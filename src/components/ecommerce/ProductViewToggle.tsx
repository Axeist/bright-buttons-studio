import { Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductViewToggleProps {
  viewMode: "grid" | "list";
  onViewChange: (mode: "grid" | "list") => void;
  className?: string;
}

export const ProductViewToggle = ({
  viewMode,
  onViewChange,
  className,
}: ProductViewToggleProps) => {
  return (
    <div className={cn("flex items-center border rounded-full p-1", className)}>
      <Button
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full",
          viewMode === "grid" && "bg-primary text-primary-foreground"
        )}
        onClick={() => onViewChange("grid")}
        aria-label="Grid view"
      >
        <Grid className="w-4 h-4" />
      </Button>
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full",
          viewMode === "list" && "bg-primary text-primary-foreground"
        )}
        onClick={() => onViewChange("list")}
        aria-label="List view"
      >
        <List className="w-4 h-4" />
      </Button>
    </div>
  );
};

