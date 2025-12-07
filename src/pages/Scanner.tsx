import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Scan, User, CheckCircle2, XCircle, Loader2, Camera, X, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Scanner = () => {
  const { user } = useAuth();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [posCustomer, setPosCustomer] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false);
  const [scannedBarcodes, setScannedBarcodes] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);

  // Check for POS customer selection
  useEffect(() => {
    if (!user) return;

    // Subscribe to POS customer changes
    const channel = supabase
      .channel('pos-scanner-sync')
      .on(
        'broadcast',
        { event: 'customer-selected' },
        (payload) => {
          setPosCustomer(payload.payload.customer);
        }
      )
      .on(
        'broadcast',
        { event: 'customer-cleared' },
        () => {
          setPosCustomer(null);
          setIsConnected(false);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Request current customer from POS
          channel.send({
            type: 'broadcast',
            event: 'request-customer',
            payload: {}
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      // Stop scanner immediately on unmount
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        // Use stop() without await since we're in cleanup
        scanner.stop().catch(() => {
          // Silently ignore all errors during unmount
        });
      }
    };
  }, []);

  // Check browser support
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Safari.");
    }
  }, []);

  const checkCustomerMatch = async () => {
    if (!customerPhone.trim()) {
      toast({
        title: "Error",
        description: "Please enter customer phone number",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingCustomer(true);

    try {
      // Check if customer exists
      const { data: customerData, error } = await supabase
        .from("customers")
        .select("id, name, phone")
        .eq("phone", customerPhone.trim())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If POS has a customer selected, verify it matches
      if (posCustomer) {
        if (posCustomer.phone !== customerPhone.trim()) {
          toast({
            title: "Customer Mismatch",
            description: `POS has customer: ${posCustomer.name} (${posCustomer.phone}). Please enter the same customer.`,
            variant: "destructive",
          });
          setIsCheckingCustomer(false);
          return;
        }

        // Customer matches - establish connection
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'scanner-connected',
            payload: {
              customer: posCustomer,
              scannerId: user?.id,
            }
          });
        }

        setIsConnected(true);
        toast({
          title: "Scanner Connected!",
          description: "You can now scan barcodes to add items to POS",
        });
      } else {
        // No customer in POS - create or get customer and notify POS
        let customerId: string;
        let customerNameToUse: string;

        if (customerData) {
          customerId = customerData.id;
          customerNameToUse = customerData.name;
        } else {
          // Create new customer
          const { data: newCustomer, error: createError } = await supabase
            .from("customers")
            .insert({
              name: customerName.trim() || "Walk-in Customer",
              phone: customerPhone.trim(),
            })
            .select()
            .single();

          if (createError) throw createError;
          customerId = newCustomer.id;
          customerNameToUse = newCustomer.name;
        }

        const customer = {
          id: customerId,
          name: customerNameToUse,
          phone: customerPhone.trim(),
        };

        // Notify POS to select this customer
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'scanner-customer-selected',
            payload: {
              customer,
              scannerId: user?.id,
            }
          });
          
          // Wait a bit for POS to process, then send connection event
          setTimeout(() => {
            if (channelRef.current) {
              channelRef.current.send({
                type: 'broadcast',
                event: 'scanner-connected',
                payload: {
                  customer,
                  scannerId: user?.id,
                }
              });
            }
          }, 100);
        }

        setIsConnected(true);
        toast({
          title: "Scanner Connected!",
          description: "You can now scan barcodes to add items to POS",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify customer",
        variant: "destructive",
      });
    } finally {
      setIsCheckingCustomer(false);
    }
  };

  const startScanner = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to POS first by verifying customer",
        variant: "destructive",
      });
      return;
    }

    // Prevent starting if already scanning
    if (isScanning || scannerRef.current) {
      return;
    }

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = "Your browser does not support camera access. Please use a modern browser.";
      setCameraError(errorMsg);
      toast({
        title: "Browser Not Supported",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Check if element exists and wait a bit if needed
    let element = document.getElementById("barcode-scanner");
    if (!element) {
      // Wait a bit for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      element = document.getElementById("barcode-scanner");
      if (!element) {
        toast({
          title: "Error",
          description: "Scanner element not found. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }
    }

    // Stop any existing scanner first
    if (scannerRef.current) {
      try {
        const currentScanner = scannerRef.current;
        // Check if scanner is still active
        try {
          await currentScanner.stop();
        } catch (stopError: any) {
          // If stop fails, try to get state - if it's already stopped, that's fine
          if (!stopError.message?.includes('already stopped')) {
            throw stopError;
          }
        }
      } catch (e: any) {
        // Only log if it's not a DOM/node error (these are common during cleanup)
        if (!e.message?.includes('removeChild') && 
            !e.message?.includes('not a child') &&
            !e.message?.includes('Node')) {
          console.log("Error stopping previous scanner (ignored):", e);
        }
      } finally {
        scannerRef.current = null;
        // Wait longer for cleanup to complete and DOM to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setCameraError(null);
    setIsScanning(false);

    try {
      // Ensure element exists and is ready - wait a bit for React to finish rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let scannerElement = document.getElementById("barcode-scanner");
      if (!scannerElement) {
        // Try one more time after a short delay
        await new Promise(resolve => setTimeout(resolve, 200));
        scannerElement = document.getElementById("barcode-scanner");
        if (!scannerElement) {
          throw new Error("Scanner element not found. Please refresh the page.");
        }
      }

      // Don't clear the element - let html5-qrcode manage it
      // Clearing can cause issues with video elements

      // Create new scanner instance
      const scanner = new Html5Qrcode("barcode-scanner");
      scannerRef.current = scanner;

      // Get available cameras first
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length === 0) {
        throw new Error("No cameras found on this device");
      }

      // Find back camera (environment facing)
      const backCamera = devices?.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      ) || devices?.[devices.length - 1]; // Use last camera (usually back camera on mobile)

      const cameraId = backCamera?.id || { facingMode: "environment" };

      // Calculate qrbox size based on screen width (mobile-first)
      const screenWidth = window.innerWidth;
      const qrboxSize = Math.min(280, screenWidth - 80);

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: qrboxSize, height: qrboxSize },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          handleBarcodeScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (these are normal during scanning)
          // Only log if it's not a common scanning error
          if (!errorMessage.includes('NotFoundException') && 
              !errorMessage.includes('No MultiFormat Readers')) {
            // Silent - these are expected during scanning
          }
        }
      );

      setIsScanning(true);
      setCameraError(null);
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(err.message || "Failed to start camera");
      setIsScanning(false);
      
      let errorMessage = err.message || "Failed to start camera";
      
      // Provide more helpful error messages
      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("no camera")) {
        errorMessage = "No camera found on this device.";
      } else if (errorMessage.includes("NotReadableError")) {
        errorMessage = "Camera is already in use by another application.";
      }

      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null; // Clear ref first to prevent race conditions
      
      try {
        // Stop the scanner
        await scanner.stop();
      } catch (err: any) {
        // Ignore all errors during stop - these are common and expected
        // The scanner might already be stopped, element might be removed, etc.
        // We don't want to show errors to users for cleanup issues
      } finally {
        setIsScanning(false);
        setCameraError(null);
        // Don't clear innerHTML - let html5-qrcode handle cleanup
        // Clearing can cause removeChild errors
      }
    } else {
      setIsScanning(false);
      setCameraError(null);
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    // Prevent duplicate scans
    if (scannedBarcodes.includes(barcode)) {
      return;
    }

    setScannedBarcodes((prev) => [...prev, barcode]);

    // Send barcode to POS
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'barcode-scanned',
        payload: {
          barcode,
          scannerId: user?.id,
        }
      });

      toast({
        title: "Barcode Scanned",
        description: `Sent to POS: ${barcode}`,
      });

      // Clear after 2 seconds to allow re-scanning same barcode
      setTimeout(() => {
        setScannedBarcodes((prev) => prev.filter((b) => b !== barcode));
      }, 2000);
    }
  };

  const disconnect = () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'scanner-disconnected',
        payload: {
          scannerId: user?.id,
        }
      });
    }
    setIsConnected(false);
    stopScanner();
    setCustomerPhone("");
    setCustomerName("");
    setPosCustomer(null);
    toast({
      title: "Disconnected",
      description: "Scanner disconnected from POS",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-earth-50 dark:from-background dark:via-background dark:to-background safe-top safe-bottom">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Scan className="w-6 h-6 text-primary" />
              Barcode Scanner
            </h1>
            {isConnected && (
              <div className="flex items-center gap-2 text-primary">
                <Wifi className="w-5 h-5" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            )}
          </div>

          {/* Connection Status */}
          {posCustomer && !isConnected && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl mb-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">POS Customer Selected</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {posCustomer.name} ({posCustomer.phone})
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter the same customer phone to connect
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Verification */}
        {!isConnected ? (
          <div className="bg-card rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Connect to POS
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Customer Phone *</Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="rounded-xl h-12 mt-1"
                  disabled={isCheckingCustomer}
                />
              </div>
              <div>
                <Label htmlFor="name">Customer Name (Optional)</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="rounded-xl h-12 mt-1"
                  disabled={isCheckingCustomer}
                />
              </div>
              <Button
                onClick={checkCustomerMatch}
                disabled={!customerPhone.trim() || isCheckingCustomer}
                className="w-full rounded-xl h-12"
                size="lg"
              >
                {isCheckingCustomer ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Connect to POS
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Connected
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Ready to scan barcodes
                </p>
              </div>
              <Button
                onClick={disconnect}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <X className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* Scanner - Always render container when connected to prevent DOM removal */}
        <div className={`bg-card rounded-2xl p-6 shadow-lg mb-6 ${!isConnected ? 'hidden' : ''}`}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Barcode Scanner</h2>
          
          {/* Stable container that never gets removed */}
          <div 
            className="w-full aspect-square rounded-xl overflow-hidden bg-black mb-4 relative"
            key="scanner-container"
          >
            <div
              id="barcode-scanner"
              ref={scannerElementRef}
              key="scanner-element"
              className="w-full h-full"
              style={{ minHeight: '300px' }}
            />
            {!isScanning && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 z-10 pointer-events-none">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Camera not started</p>
                </div>
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 z-10 pointer-events-none">
                <div className="text-center p-4">
                  <XCircle className="w-16 h-16 text-destructive/50 mx-auto mb-4" />
                  <p className="text-destructive font-medium mb-2">Camera Error</p>
                  <p className="text-sm text-muted-foreground">{cameraError}</p>
                </div>
              </div>
            )}
          </div>

            <div className="space-y-3">
              {!isScanning ? (
                <Button
                  onClick={startScanner}
                  className="w-full rounded-xl h-12"
                  size="lg"
                  disabled={!!cameraError}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {cameraError ? "Retry Camera" : "Start Scanner"}
                </Button>
              ) : (
                <Button
                  onClick={stopScanner}
                  variant="outline"
                  className="w-full rounded-xl h-12"
                  size="lg"
                >
                  <X className="w-4 h-4 mr-2" />
                  Stop Scanner
                </Button>
              )}

              {cameraError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium mb-1">Troubleshooting:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Check browser permissions for camera access</li>
                    <li>Make sure no other app is using the camera</li>
                    <li>Try refreshing the page</li>
                    <li>Use a device with a working camera</li>
                  </ul>
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">
                <p>Point camera at barcode to scan</p>
                <p className="text-xs mt-1">Scanned items will be added to POS cart</p>
              </div>
            </div>
          </div>

        {/* Instructions */}
        <div className="bg-card/50 rounded-2xl p-4 border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-2">How to use:</h3>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Make sure a customer is selected in POS</li>
            <li>Enter the same customer phone number</li>
            <li>Click "Connect to POS"</li>
            <li>Start the scanner and scan barcodes</li>
            <li>Items will be added to POS cart automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
