import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

interface SortOption {
  value: string;
  label: string;
}

interface ProductSortDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  options?: SortOption[];
  className?: string;
}

const defaultOptions: SortOption[] = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
];

export const ProductSortDropdown = ({
  value,
  onValueChange,
  options = defaultOptions,
  className,
}: ProductSortDropdownProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <SelectValue placeholder="Sort by" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

