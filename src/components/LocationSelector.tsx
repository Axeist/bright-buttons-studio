import { useState, useEffect } from "react";
import { MapPin, Search, X, Check } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Location {
  pincode: string;
  city: string;
  state: string;
  deliveryAvailable: boolean;
}

// Common Indian cities and pincodes for quick selection
const popularLocations: Location[] = [
  { pincode: "110001", city: "New Delhi", state: "Delhi", deliveryAvailable: true },
  { pincode: "400001", city: "Mumbai", state: "Maharashtra", deliveryAvailable: true },
  { pincode: "560001", city: "Bangalore", state: "Karnataka", deliveryAvailable: true },
  { pincode: "600001", city: "Chennai", state: "Tamil Nadu", deliveryAvailable: true },
  { pincode: "700001", city: "Kolkata", state: "West Bengal", deliveryAvailable: true },
  { pincode: "380001", city: "Ahmedabad", state: "Gujarat", deliveryAvailable: true },
  { pincode: "500001", city: "Hyderabad", state: "Telangana", deliveryAvailable: true },
  { pincode: "110092", city: "Gurgaon", state: "Haryana", deliveryAvailable: true },
  { pincode: "411001", city: "Pune", state: "Maharashtra", deliveryAvailable: true },
  { pincode: "302001", city: "Jaipur", state: "Rajasthan", deliveryAvailable: true },
];

export const LocationSelector = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [recentLocations, setRecentLocations] = useState<Location[]>([]);
  const [searchResults, setSearchResults] = useState<Location[]>([]);

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
  }, []);

  const handlePincodeSearch = () => {
    if (!pincode || pincode.length !== 6) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive",
      });
      return;
    }

    // Simulate pincode validation (in real app, use an API)
    const found = popularLocations.find((loc) => loc.pincode === pincode);
    if (found) {
      setSearchResults([found]);
    } else {
      // For demo, assume delivery is available
      const newLocation: Location = {
        pincode,
        city: "City",
        state: "State",
        deliveryAvailable: true,
      };
      setSearchResults([newLocation]);
    }
  };

  const handleSelectLocation = (location: Location) => {
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
                <Button onClick={handlePincodeSearch} disabled={pincode.length !== 6}>
                  <Search className="w-4 h-4" />
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

            {/* Popular Locations */}
            {!selectedLocation && recentLocations.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Popular Cities</p>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {popularLocations.map((location) => (
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
                        {location.deliveryAvailable && (
                          <Badge variant="outline">Available</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
