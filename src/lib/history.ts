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

export async function listGenerations(kind: GenerationKind): Promise<Generation[]> {
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Generation[];
}

export async function saveGeneration(entry: {
  kind: GenerationKind;
  title: string;
  input: Record<string, unknown>;
  output: string;
}): Promise<Generation> {
  const { data, error } = await supabase.from("generations").insert(entry).select().single();
  if (error) throw error;
  return data as Generation;
}

export async function updateGenerationOutput(id: string, output: string): Promise<void> {
  const { error } = await supabase.from("generations").update({ output }).eq("id", id);
  if (error) throw error;
}

export async function deleteGeneration(id: string): Promise<void> {
  const { error } = await supabase.from("generations").delete().eq("id", id);
  if (error) throw error;
}
