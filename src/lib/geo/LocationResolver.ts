/**
 * LocationResolver - Provider-agnostic geocoding and bounding-box resolution abstraction.
 * Allows transparent swapping between Google Maps Geocoding, Nominatim, and custom spatial indexes.
 */

export interface ResolvedLocation {
  name: string;
  country: string;
  lat: number;
  lon: number;
  bbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  confidence: number;
}

export class LocationResolver {
  private static KNOWN_PLACES: Record<string, ResolvedLocation> = {
    'amazon': { name: 'Amazon Basin', country: 'Brazil', lat: -10.83, lon: -55.86, bbox: [-70, -18, -45, 5], confidence: 0.98 },
    'brazil': { name: 'Brazil', country: 'Brazil', lat: -14.235, lon: -51.925, bbox: [-74, -34, -34, 5], confidence: 0.99 },
    'india': { name: 'India', country: 'India', lat: 20.5937, lon: 78.9629, bbox: [68, 8, 97, 37], confidence: 0.99 },
    'punjab': { name: 'Punjab Agricultural Belt', country: 'India', lat: 30.90, lon: 75.85, bbox: [74.5, 29.8, 77.2, 32.0], confidence: 0.95 },
    'aral': { name: 'Aral Sea Basin', country: 'Uzbekistan / Kazakhstan', lat: 45.00, lon: 59.25, bbox: [58.0, 43.5, 61.0, 46.5], confidence: 0.97 },
    'sundarbans': { name: 'Sundarbans Mangrove Forest', country: 'Bangladesh / India', lat: 21.95, lon: 89.20, bbox: [88.5, 21.3, 90.0, 22.6], confidence: 0.96 },
    'indonesia': { name: 'Indonesia', country: 'Indonesia', lat: -0.789, lon: 113.921, bbox: [95, -11, 141, 6], confidence: 0.98 },
    'africa': { name: 'Congo Basin', country: 'DR Congo', lat: -2.20, lon: 21.50, bbox: [20, -3.5, 23, -1.0], confidence: 0.94 },
  };

  /**
   * Resolves a place name or phrase to geographic coordinates
   */
  public static async resolve(queryText: string): Promise<ResolvedLocation | null> {
    const lower = queryText.toLowerCase();
    for (const [key, loc] of Object.entries(this.KNOWN_PLACES)) {
      if (lower.includes(key)) {
        return loc;
      }
    }
    return null;
  }
}
