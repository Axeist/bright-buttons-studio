import { useState, useEffect, useCallback } from "react";
import { MapPin, Search, X, Check, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  getCurrentLocation,
  getLocationFromCoordinates,
  getPincodeDetails,
  checkPincodeServiceable,
  type LocationData,
} from "@/lib/pincodeUtils";

interface Location extends LocationData {}

export const LocationSelector = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [recentLocations, setRecentLocations] = useState<Location[]>([]);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleDetectLocation = useCallback(async () => {
    setIsDetectingLocation(true);
    try {
      const position = await getCurrentLocation();
      const location = await getLocationFromCoordinates(
        position.coords.latitude,
        position.coords.longitude
      );

      if (location) {
        if (location.deliveryAvailable) {
          handleSelectLocation(location);
          toast({
            title: "Location Detected",
            description: `We found your location: ${location.city}, ${location.state} - ${location.pincode}`,
          });
        } else {
          setSearchResults([location]);
          toast({
            title: "Location Detected",
            description: `We found your location, but delivery is not available in this area yet.`,
            variant: "destructive",
          });
        }
        localStorage.setItem("hasAutoDetectedLocation", "true");
      } else {
        toast({
          title: "Location Detection Failed",
          description: "Could not determine your location. Please enter your pincode manually.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error detecting location:", error);
      toast({
        title: "Location Detection Failed",
        description: error.message || "Please allow location access or enter your pincode manually.",
        variant: "destructive",
      });
    } finally {
      setIsDetectingLocation(false);
    }
  }, []);

  useEffect(() => {
    // Load saved location from localStorage
    const saved = localStorage.getItem("deliveryLocation");
    if (saved) {
      try {
        const location = JSON.parse(saved);
        setSelectedLocation(location);
      } catch (e) {
        // Invalid saved data
      }
    }

    // Load recent locations
    const recent = localStorage.getItem("recentLocations");
    if (recent) {
      try {
        setRecentLocations(JSON.parse(recent));
      } catch (e) {
        // Invalid saved data
      }
    }

    // Auto-detect location when component mounts (only once)
    const hasAutoDetected = localStorage.getItem("hasAutoDetectedLocation");
    if (!hasAutoDetected && !saved) {
      handleDetectLocation();
    }
  }, [handleDetectLocation]);

  const handlePincodeSearch = async () => {
    if (!pincode || pincode.length !== 6) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      // First check if pincode exists in database
      const locationDetails = await getPincodeDetails(pincode);
      
      if (locationDetails) {
        setSearchResults([locationDetails]);
      } else {
        // If not in database, check if it's serviceable (shouldn't happen, but fallback)
        const isServiceable = await checkPincodeServiceable(pincode);
        const location: Location = {
          pincode,
          city: "Unknown",
          state: "Unknown",
          deliveryAvailable: isServiceable,
        };
        setSearchResults([location]);
        
        if (!isServiceable) {
          toast({
            title: "Delivery Not Available",
            description: "We are coming soon to your area to serve. Please check back later!",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Error searching pincode:", error);
      toast({
        title: "Error",
        description: "Failed to check pincode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (location: Location) => {
    if (!location.deliveryAvailable) {
      toast({
        title: "Delivery Not Available",
        description: "We are coming soon to your area to serve. Please check back later!",
        variant: "destructive",
      });
      return;
    }

    setSelectedLocation(location);
    localStorage.setItem("deliveryLocation", JSON.stringify(location));

    // Add to recent locations
    const recent = recentLocations.filter((loc) => loc.pincode !== location.pincode);
    const updated = [location, ...recent].slice(0, 5);
    setRecentLocations(updated);
    localStorage.setItem("recentLocations", JSON.stringify(updated));

    setIsOpen(false);
    setPincode("");
    setSearchResults([]);

    toast({
      title: "Location Updated",
      description: `Delivery to ${location.city}, ${location.state} - ${location.pincode}`,
    });
  };

  const handleRemoveLocation = () => {
    setSelectedLocation(null);
    localStorage.removeItem("deliveryLocation");
    toast({
      title: "Location Removed",
      description: "Please select a delivery location",
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm"
      >
        <MapPin className="w-4 h-4" />
        <span className="hidden sm:inline">
          {selectedLocation
            ? `${selectedLocation.city} - ${selectedLocation.pincode}`
            : "Select Location"}
        </span>
        <span className="sm:hidden">
          {selectedLocation ? selectedLocation.pincode : "Location"}
        </span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Select Delivery Location
            </DialogTitle>
            <DialogDescription>
              Enter your pincode to check delivery availability
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Auto-detect Location Button */}
            <Button
              variant="outline"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="w-full"
            >
              {isDetectingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Detecting Location...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Detect My Location
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Pincode Search */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit pincode"
                  value={pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPincode(value);
                    if (value.length === 6) {
                      handlePincodeSearch();
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  className="flex-1"
                  maxLength={6}
                />
                <Button 
                  onClick={handlePincodeSearch} 
                  disabled={pincode.length !== 6 || isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Search Results</p>
                {searchResults.map((location) => (
                  <div
                    key={location.pincode}
                    onClick={() => handleSelectLocation(location)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{location.city}, {location.state}</p>
                        <p className="text-sm text-muted-foreground">Pincode: {location.pincode}</p>
                      </div>
                      {location.deliveryAvailable ? (
                        <Badge variant="default">Available</Badge>
                      ) : (
                        <Badge variant="destructive">Not Available</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Locations */}
            {recentLocations.length > 0 && !selectedLocation && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent Locations</p>
                {recentLocations.map((location) => (
                  <div
                    key={location.pincode}
                    onClick={() => handleSelectLocation(location)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{location.city}, {location.state}</p>
                        <p className="text-sm text-muted-foreground">Pincode: {location.pincode}</p>
                      </div>
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            )}


            {/* Current Location */}
            {selectedLocation && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div>
                    <p className="font-medium">{selectedLocation.city}, {selectedLocation.state}</p>
                    <p className="text-sm text-muted-foreground">Pincode: {selectedLocation.pincode}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveLocation}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
