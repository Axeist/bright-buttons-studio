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
  const channelRef = useRef<any>(null);

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
      stopScanner();
    };
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

    try {
      const scanner = new Html5Qrcode("barcode-scanner");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
        },
        (decodedText) => {
          handleBarcodeScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      toast({
        title: "Camera Error",
        description: err.message || "Failed to start camera",
        variant: "destructive",
      });
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

        {/* Scanner */}
        {isConnected && (
          <div className="bg-card rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Barcode Scanner</h2>
            
            <div
              id="barcode-scanner"
              className="w-full aspect-square rounded-xl overflow-hidden bg-black mb-4 relative"
            >
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Camera not started</p>
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
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Scanner
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

              <div className="text-center text-sm text-muted-foreground">
                <p>Point camera at barcode to scan</p>
                <p className="text-xs mt-1">Scanned items will be added to POS cart</p>
              </div>
            </div>
          </div>
        )}

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
