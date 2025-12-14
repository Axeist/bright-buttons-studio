import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Ruler, HelpCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SizeGuideData {
  size: string;
  chest?: string;
  waist?: string;
  length?: string;
  shoulder?: string;
  sleeve?: string;
  [key: string]: string | undefined;
}

interface ProductSizeGuideProps {
  sizes?: SizeGuideData[];
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
}

const defaultSizes: SizeGuideData[] = [
  { size: "XS", chest: "34-36", length: "26", waist: "28-30" },
  { size: "S", chest: "36-38", length: "27", waist: "30-32" },
  { size: "M", chest: "38-40", length: "28", waist: "32-34" },
  { size: "L", chest: "40-42", length: "29", waist: "34-36" },
  { size: "XL", chest: "42-44", length: "30", waist: "36-38" },
  { size: "XXL", chest: "44-46", length: "31", waist: "38-40" },
];

export const ProductSizeGuide = ({
  sizes = defaultSizes,
  title = "Size Guide",
  description = "Find your perfect fit. Measurements are in inches.",
  trigger,
}: ProductSizeGuideProps) => {
  if (sizes.length === 0) return null;

  // Get all measurement keys (excluding 'size')
  const measurementKeys = Array.from(
    new Set(sizes.flatMap(s => Object.keys(s).filter(k => k !== "size")))
  );

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="rounded-full">
      <Ruler className="w-4 h-4 mr-2" />
      Size Guide
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  {measurementKeys.map((key) => (
                    <TableHead key={key} className="capitalize">
                      {key.replace(/_/g, " ")} (inches)
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sizes.map((sizeData) => (
                  <TableRow key={sizeData.size}>
                    <TableCell className="font-medium">{sizeData.size}</TableCell>
                    {measurementKeys.map((key) => (
                      <TableCell key={key}>{sizeData[key] || "-"}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="bg-accent/50 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Measuring Tips:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Measure around the fullest part of your chest</li>
                  <li>Measure your natural waistline</li>
                  <li>For length, measure from shoulder to desired hem</li>
                  <li>All measurements are approximate</li>
                </ul>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            * For custom sizing, please contact us via WhatsApp
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

