import { supabase } from "@/integrations/supabase/client";

export type GenerationKind = "comms" | "postmortem" | "shift";

export type Generation = {
  id: string;
  kind: GenerationKind;
  title: string;
  input: Record<string, unknown>;
  output: string;
  created_at: string;
};

const STORAGE_PREFIX = "capaciti_gen_history_";

function getLocalHistory(kind: GenerationKind): Generation[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + kind);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalHistory(kind: GenerationKind, items: Generation[]): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + kind, JSON.stringify(items.slice(0, 30)));
  } catch {
    // ignore
  }
}

export async function listGenerations(kind: GenerationKind): Promise<Generation[]> {
  try {
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("kind", kind)
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data && data.length > 0) return data as Generation[];
  } catch {
    // fallback
  }
  return getLocalHistory(kind);
}

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function saveGeneration(entry: {
  kind: GenerationKind;
  title: string;
  input: Record<string, unknown>;
  output: string;
}): Promise<Generation> {
  const localItem: Generation = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `gen-${Date.now()}`,
    ...entry,
    created_at: new Date().toISOString(),
  };

  try {
    const userId = await currentUserId();
    if (!userId) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("generations")
      .insert({ ...entry, user_id: userId, input: entry.input as never })
      .select()
      .single();
    if (!error && data) return data as Generation;
  } catch {
    // fallback
  }

  const existing = getLocalHistory(entry.kind);
  setLocalHistory(entry.kind, [localItem, ...existing]);
  return localItem;
}

export async function updateGenerationOutput(id: string, output: string): Promise<void> {
  try {
    await supabase.from("generations").update({ output }).eq("id", id);
  } catch {
    // fallback
  }
  for (const kind of ["comms", "postmortem", "shift"] as GenerationKind[]) {
    const list = getLocalHistory(kind);
    const item = list.find((x) => x.id === id);
    if (item) {
      item.output = output;
      setLocalHistory(kind, list);
      break;
    }
  }
}

export async function deleteGeneration(id: string): Promise<void> {
  try {
    await supabase.from("generations").delete().eq("id", id);
  } catch {
    // fallback
  }
  for (const kind of ["comms", "postmortem", "shift"] as GenerationKind[]) {
    const list = getLocalHistory(kind);
    const updated = list.filter((x) => x.id !== id);
    if (updated.length !== list.length) {
      setLocalHistory(kind, updated);
      break;
    }
  }
}
