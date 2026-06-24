import {
  LayoutDashboard,
  ListChecks,
  Target,
  Sparkles,
  CalendarDays,
  BarChart3,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean; // shown in mobile bottom nav
}

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, primary: true },
  { href: "/habits", label: "Hábitos", icon: ListChecks, primary: true },
  { href: "/goals", label: "Objetivos", icon: Target, primary: true },
  { href: "/planner", label: "Planificador", icon: Sparkles, primary: true },
  { href: "/calendar", label: "Calendario", icon: CalendarDays, primary: true },
  { href: "/stats", label: "Estadísticas", icon: BarChart3 },
  { href: "/notes", label: "Notas", icon: NotebookPen },
];
