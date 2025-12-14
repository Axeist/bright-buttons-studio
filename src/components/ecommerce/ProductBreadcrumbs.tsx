import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface BreadcrumbItemData {
  label: string;
  href?: string;
}

interface ProductBreadcrumbsProps {
  items: BreadcrumbItemData[];
  className?: string;
}

export const ProductBreadcrumbs = ({
  items,
  className,
}: ProductBreadcrumbsProps) => {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            <BreadcrumbSeparator>
              <ChevronRight className="w-4 h-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {item.href && index < items.length - 1 ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

