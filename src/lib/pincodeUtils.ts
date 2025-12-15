import { supabase } from "@/integrations/supabase/client";

export interface LocationData {
  pincode: string;
  city: string;
  state: string;
  deliveryAvailable: boolean;
}

/**
 * Check if a pincode is serviceable
 */
export const checkPincodeServiceable = async (pincode: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_pincode_serviceable', {
      p_pincode: pincode
    });
    
    if (error) {
      console.error('Error checking pincode:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error checking pincode:', error);
    return false;
  }
};

/**
 * Get location details for a pincode from database
 */
export const getPincodeDetails = async (pincode: string): Promise<LocationData | null> => {
  try {
    const { data, error } = await supabase
      .from('serviceable_pincodes')
      .select('pincode, city, state, is_active')
      .eq('pincode', pincode)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      pincode: data.pincode,
      city: data.city,
      state: data.state,
      deliveryAvailable: data.is_active,
    };
  } catch (error) {
    console.error('Error fetching pincode details:', error);
    return null;
  }
};

/**
 * Get location from coordinates using reverse geocoding (OpenStreetMap Nominatim)
 */
export const getLocationFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<LocationData | null> => {
  try {
    // Using OpenStreetMap Nominatim API (free and open source)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'BrightButtonsStudio/1.0' // Required by Nominatim
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch location');
    }
    
    const data = await response.json();
    
    if (!data || !data.address) {
      return null;
    }
    
    const address = data.address;
    const pincode = address.postcode || '';
    const city = address.city || address.town || address.village || address.county || '';
    const state = address.state || address.region || '';
    
    if (!pincode || pincode.length !== 6) {
      return null;
    }
    
    // Check if pincode is serviceable
    const isServiceable = await checkPincodeServiceable(pincode);
    
    return {
      pincode,
      city,
      state,
      deliveryAvailable: isServiceable,
    };
  } catch (error) {
    console.error('Error getting location from coordinates:', error);
    return null;
  }
};

/**
 * Get user's current location using browser geolocation API
 */
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

