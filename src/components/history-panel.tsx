import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Generation } from "@/lib/history";

export function HistoryPanel({
  items,
  activeId,
  onSelect,
  onDelete,
}: {
  items: Generation[];
  activeId?: string | undefined;
  onSelect: (item: Generation) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Saved drafts for this tab will appear here.</p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className={`group flex items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
            activeId === item.id
              ? "border-primary/60 bg-primary/5"
              : "border-border hover:bg-muted/60"
          }`}
        >
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelect(item)}>
            <span className="block truncate text-xs font-medium">{item.title}</span>
            <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="size-3" />
              {new Date(item.created_at).toLocaleString()}
            </span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100"
            onClick={() => onDelete(item.id)}
            aria-label="Delete saved draft"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
