import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterChip {
  id: string;
  label: string;
  type: "category" | "fabric" | "technique" | "price" | "custom";
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (chipId: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export const FilterChips = ({
  chips,
  onRemove,
  onClearAll,
  className,
}: FilterChipsProps) => {
  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {chips.map((chip) => (
        <Badge
          key={chip.id}
          variant="secondary"
          className="gap-2 pr-1 rounded-full"
        >
          <span className="text-xs">{chip.label}</span>
          <button
            onClick={() => onRemove(chip.id)}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      {onClearAll && chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 text-xs rounded-full"
        >
          Clear All
        </Button>
      )}
    </div>
  );
};

