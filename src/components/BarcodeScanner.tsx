import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const BarcodeScanner = ({ onScan, onClose, isOpen }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode("barcode-scanner");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to start camera");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current = null;
          setIsScanning(false);
        })
        .catch(() => {
          scannerRef.current = null;
          setIsScanning(false);
        });
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            id="barcode-scanner"
            className="w-full aspect-square rounded-lg overflow-hidden bg-black"
          />

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          {!isScanning && !error && (
            <Button onClick={startScanner} className="w-full" size="lg">
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          )}

          {isScanning && (
            <Button onClick={stopScanner} variant="outline" className="w-full" size="lg">
              <X className="w-4 h-4 mr-2" />
              Stop Scanner
            </Button>
          )}

          <Button onClick={handleClose} variant="ghost" className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

