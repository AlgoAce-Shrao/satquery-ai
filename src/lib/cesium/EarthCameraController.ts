/**
 * EarthCameraController - High-precision spherical camera navigation & flight controller.
 * Isolates 3D coordinates, altitudes, target framing, and flight animations.
 */

export interface CameraPosition {
  lat: number;
  lon: number;
  altitude: number; // in meters or normalized globe units
  heading?: number;
  pitch?: number;
}

export interface BoundingBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

export class EarthCameraController {
  private currentLat: number = 0;
  private currentLon: number = 0;
  private currentZoom: number = 1.0;
  private targetLat: number = 0;
  private targetLon: number = 0;
  private targetZoom: number = 1.0;
  private isFlying: boolean = false;
  private flightProgress: number = 1.0;
  private flightDuration: number = 1800; // ms
  private flightStartTime: number = 0;
  private onFrameCallback?: (lat: number, lon: number, zoom: number) => void;

  constructor(initialLat: number = 0, initialLon: number = 0, initialZoom: number = 1.0) {
    this.currentLat = initialLat;
    this.currentLon = initialLon;
    this.currentZoom = initialZoom;
    this.targetLat = initialLat;
    this.targetLon = initialLon;
    this.targetZoom = initialZoom;
  }

  public setFrameCallback(callback: (lat: number, lon: number, zoom: number) => void) {
    this.onFrameCallback = callback;
  }

  /**
   * Smoothly flies the camera to a geographic latitude and longitude with altitude zoom.
   */
  public flyToLocation(lat: number, lon: number, zoom: number = 1.35, durationMs: number = 1800): Promise<void> {
    return new Promise((resolve) => {
      this.targetLat = lat;
      this.targetLon = lon;
      this.targetZoom = zoom;
      this.flightDuration = durationMs;
      this.flightStartTime = performance.now();
      this.isFlying = true;

      const animate = (time: number) => {
        if (!this.isFlying) {
          resolve();
          return;
        }

        const elapsed = time - this.flightStartTime;
        const progress = Math.min(elapsed / this.flightDuration, 1.0);
        
        // Cubic smooth-step easing
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Spherical shortest-arc longitudinal delta
        let deltaLon = this.targetLon - this.currentLon;
        if (deltaLon > 180) deltaLon -= 360;
        if (deltaLon < -180) deltaLon += 360;

        const newLat = this.currentLat + (this.targetLat - this.currentLat) * ease;
        const newLon = this.currentLon + deltaLon * ease;
        const newZoom = this.currentZoom + (this.targetZoom - this.currentZoom) * ease;

        if (this.onFrameCallback) {
          this.onFrameCallback(newLat, newLon, newZoom);
        }

        if (progress < 1.0) {
          requestAnimationFrame(animate);
        } else {
          this.currentLat = this.targetLat;
          this.currentLon = this.targetLon;
          this.currentZoom = this.targetZoom;
          this.isFlying = false;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Frames the camera around a geographic bounding box
   */
  public flyToBoundingBox(bbox: BoundingBox, durationMs: number = 1800): Promise<void> {
    const centerLat = (bbox.minLat + bbox.maxLat) / 2;
    const centerLon = (bbox.minLon + bbox.maxLon) / 2;
    const latSpan = Math.abs(bbox.maxLat - bbox.minLat);
    const lonSpan = Math.abs(bbox.maxLon - bbox.minLon);
    const maxSpan = Math.max(latSpan, lonSpan);

    // Compute appropriate zoom from span
    const zoom = Math.max(1.1, Math.min(1.8, 2.5 - maxSpan / 20));
    return this.flyToLocation(centerLat, centerLon, zoom, durationMs);
  }

  /**
   * Resets camera to global Earth orbit view
   */
  public returnToGlobalView(durationMs: number = 1400): Promise<void> {
    return this.flyToLocation(0, 0, 1.0, durationMs);
  }

  public getCurrentPosition(): CameraPosition {
    return {
      lat: this.currentLat,
      lon: this.currentLon,
      altitude: this.currentZoom,
    };
  }

  public updateManualPosition(lat: number, lon: number, zoom: number) {
    this.isFlying = false;
    this.currentLat = lat;
    this.currentLon = lon;
    this.currentZoom = zoom;
    this.targetLat = lat;
    this.targetLon = lon;
    this.targetZoom = zoom;
  }
}
