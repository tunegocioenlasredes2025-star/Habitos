import type {
  PlanActivity,
  PlannerResult,
  ScheduleBlock,
  PlanCategory,
} from "./types";
import { timeToMinutes } from "./utils";

const FOCUS: PlanCategory[] = ["work", "study"];
const FOCUS_CHUNK = 100; // split focus blocks longer than this
const BREAK_LEN = 15;
const MIN_BREAK_GAP = 12;

interface Anchor extends ScheduleBlock {}

interface QueueItem {
  title: string;
  minutes: number;
  category: PlanCategory;
  focus: boolean;
}

function makeBlock(
  start: number,
  end: number,
  title: string,
  kind: ScheduleBlock["kind"],
  category: PlanCategory,
): ScheduleBlock {
  return { start_min: start, end_min: end, title, kind, category };
}

/**
 * Deterministic day planner.
 * Reserves meal anchors + fixed activities, distributes the rest into the
 * gaps, inserts breaks after long focus blocks, and fills leftover time with
 * leisure / free time — without overloading the day.
 */
export function planDay(input: {
  wake: string;
  sleep: string;
  activities: PlanActivity[];
}): PlannerResult {
  const start = timeToMinutes(input.wake);
  let end = timeToMinutes(input.sleep);
  if (end <= start) end += 24 * 60; // sleep after midnight
  const awake = end - start;

  const warnings: string[] = [];
  const valid = input.activities.filter((a) => a.name.trim() && a.minutes > 0);

  // --- 1. Anchors: fixed activities + meals -------------------------------
  const anchors: Anchor[] = [];

  for (const a of valid) {
    if (a.fixed) {
      let s = timeToMinutes(a.fixed);
      if (s < start) s += 24 * 60;
      anchors.push(makeBlock(s, s + a.minutes, a.name.trim(), "activity", a.category));
    }
  }

  const tryMeal = (title: string, at: number, len: number) => {
    if (at >= start && at + len <= end) anchors.push(makeBlock(at, at + len, title, "meal", "personal"));
  };
  tryMeal("Desayuno", start, 30);
  tryMeal("Almuerzo", 13 * 60, 45);
  tryMeal("Cena", 20 * 60, 45);

  anchors.sort((a, b) => a.start_min - b.start_min);

  // Drop anchors that overlap a previously placed one (fixed activities win
  // over meals because they were pushed first at equal start).
  const reserved: Anchor[] = [];
  let guard = start;
  for (const a of anchors) {
    if (a.start_min >= guard && a.end_min <= end) {
      reserved.push(a);
      guard = a.end_min;
    } else if (a.kind === "meal") {
      warnings.push(`No hubo lugar para ${a.title.toLowerCase()} en el horario ideal.`);
    }
  }

  // --- 2. Flexible queue --------------------------------------------------
  const queue: QueueItem[] = valid
    .filter((a) => !a.fixed)
    .map((a) => ({
      title: a.name.trim(),
      minutes: a.minutes,
      category: a.category,
      focus: FOCUS.includes(a.category),
    }));

  const totalFlexible = queue.reduce((s, q) => s + q.minutes, 0);
  const reservedTime = reserved.reduce((s, r) => s + (r.end_min - r.start_min), 0);

  // --- 3. Fill the timeline ----------------------------------------------
  const blocks: ScheduleBlock[] = [];
  let leisureUsed = false;

  const fillFree = (from: number, to: number) => {
    const span = to - from;
    if (span < 5) return;
    if (span <= 25) {
      blocks.push(makeBlock(from, to, "Descanso", "break", "personal"));
    } else if (!leisureUsed && from < 18 * 60) {
      leisureUsed = true;
      blocks.push(makeBlock(from, to, "Tiempo de ocio", "leisure", "leisure"));
    } else {
      blocks.push(makeBlock(from, to, "Tiempo libre", "free", "leisure"));
    }
  };

  const fillGap = (gapStart: number, gapEnd: number) => {
    let c = gapStart;
    while (c < gapEnd && queue.length) {
      const item = queue[0];
      const avail = gapEnd - c;

      if (item.minutes <= avail) {
        // Place full item, splitting long focus blocks with a break.
        if (item.focus && item.minutes > FOCUS_CHUNK && avail >= item.minutes) {
          const half = Math.ceil(item.minutes / 2 / 5) * 5;
          blocks.push(makeBlock(c, c + half, item.title, "activity", item.category));
          c += half;
          if (gapEnd - c >= BREAK_LEN) {
            blocks.push(makeBlock(c, c + BREAK_LEN, "Descanso", "break", "personal"));
            c += BREAK_LEN;
          }
          item.minutes -= half;
          if (gapEnd - c >= item.minutes) {
            blocks.push(makeBlock(c, c + item.minutes, item.title, "activity", item.category));
            c += item.minutes;
            queue.shift();
          }
        } else {
          blocks.push(makeBlock(c, c + item.minutes, item.title, "activity", item.category));
          c += item.minutes;
          queue.shift();
          if (item.focus && queue.length && gapEnd - c >= MIN_BREAK_GAP) {
            const bl = Math.min(BREAK_LEN, gapEnd - c);
            blocks.push(makeBlock(c, c + bl, "Descanso", "break", "personal"));
            c += bl;
          }
        }
      } else if (item.focus && avail >= 30) {
        // Partially place a focus block; finish it in a later gap.
        blocks.push(makeBlock(c, gapEnd, item.title, "activity", item.category));
        item.minutes -= avail;
        c = gapEnd;
      } else {
        break;
      }
    }
    if (c < gapEnd) fillFree(c, gapEnd);
  };

  let cursor = start;
  for (const r of reserved) {
    if (cursor < r.start_min) fillGap(cursor, r.start_min);
    blocks.push(r);
    cursor = r.end_min;
  }
  if (cursor < end) fillGap(cursor, end);

  // --- 4. Overload detection ---------------------------------------------
  if (queue.length) {
    const leftover = queue.map((q) => q.title).join(", ");
    warnings.push(
      `El día está sobrecargado: no entró todo (${leftover}). Reducí duraciones o movelo a otro día.`,
    );
  }
  if (totalFlexible + reservedTime > awake) {
    warnings.unshift("Cargaste más tiempo del que tenés despierto. Prioricé lo esencial.");
  }

  blocks.sort((a, b) => a.start_min - b.start_min);

  const allocated = blocks
    .filter((b) => b.kind === "activity")
    .reduce((s, b) => s + (b.end_min - b.start_min), 0);

  return { blocks, awakeMinutes: awake, allocatedMinutes: allocated, warnings };
}
