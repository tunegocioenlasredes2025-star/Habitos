import { supabaseConfigured } from "@/lib/supabase/client";
import type { StoreAdapter } from "./adapter";
import { localAdapter } from "./local";
import { supabaseAdapter } from "./supabase";

export function getAdapter(): StoreAdapter {
  return supabaseConfigured ? supabaseAdapter : localAdapter;
}

export type { StoreAdapter, TableName } from "./adapter";
