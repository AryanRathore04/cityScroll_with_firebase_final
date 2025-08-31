interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  address?: string;
}

export class LocationService {
  static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const locationData = await this.reverseGeocode(latitude, longitude);
            resolve(locationData);
          } catch (error) {
            // Fallback with coordinates only
            resolve({
              latitude,
              longitude,
              city: "Your Location",
              address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
            });
          }
        },
        (error) => {
          // Better error handling with fallback location
          console.warn(`Location error: ${error.message}`);
          reject(
            new Error(
              `Unable to get location: ${error.message}. Please enable location services.`,
            ),
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 60000, // Reduced cache time for better accuracy
        },
      );
    });
  }

  static async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<LocationData> {
    try {
      // Using OpenStreetMap Nominatim API (free alternative to Google Maps)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1&accept-language=en`,
      );

      if (!response.ok) {
        throw new Error("Geocoding failed");
      }

      const data = await response.json();

      // Better city detection
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        data.address?.suburb ||
        data.address?.neighbourhood ||
        "Current Location";

      return {
        latitude,
        longitude,
        city,
        address: data.display_name || "Unknown location",
      };
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return { latitude, longitude };
    }
  }

  static async searchLocation(query: string): Promise<LocationData[]> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&limit=5&countrycodes=in`,
      );

      if (!response.ok) {
        throw new Error("Location search failed");
      }

      const data = await response.json();

      return data.map((item: any) => ({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        city: item.display_name.split(",")[0],
        address: item.display_name,
      }));
    } catch (error) {
      console.error("Location search failed:", error);
      return [];
    }
  }

  static generateMapUrl(
    latitude: number,
    longitude: number,
    zoom = 15,
  ): string {
    // Using OpenStreetMap for map display
    return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
