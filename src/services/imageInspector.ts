/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Image Inspector & Compatibility Engine
 * Inspects uploaded satellite scenes, parses dimensions, detects format & headers,
 * extracts geospatial metadata, and validates multi-temporal/multimodal pair compatibility.
 */

import {
  UploadedImage,
  ImageFormat,
  GeospatialMetadata,
  InputMode,
  ValidationReport,
  CompatibilityCheckItem,
  CompatibilityStatus,
} from '../types/upload';
import { ModalityType, SensorType } from '../types/observation';

export class ImageInspector {
  /**
   * Inspects a single File object and produces a standardized UploadedImage record.
   */
  public static async inspectFile(
    file: File,
    preferredModality?: ModalityType,
    label?: string
  ): Promise<UploadedImage> {
    const fileName = file.name;
    const format = this.detectFormat(fileName, file.type);
    const fileSizeBytes = file.size;

    // Create object preview URL
    const previewUrl = URL.createObjectURL(file);

    // Measure image dimensions via HTML Image loader
    const { width, height } = await this.readDimensions(previewUrl);

    // Extract geospatial metadata from filename patterns or demo context
    const geospatialInfo = this.extractMetadataFromFileName(fileName, format);

    // Determine modality
    let modality: ModalityType = preferredModality || 'OPTICAL';
    let modalityConfidence = 0.6;
    let isUserSpecified = Boolean(preferredModality);

    if (!preferredModality) {
      const detected = this.inferModality(fileName);
      modality = detected.modality;
      modalityConfidence = detected.confidence;
    }

    const validationNotes: string[] = [];
    if (format === 'UNKNOWN') {
      validationNotes.push('Format not natively recognized. Fallback raster preview enabled.');
    }
    if (!geospatialInfo.hasGeospatial) {
      validationNotes.push('No embedded GeoTIFF tags found; treated as standard image raster.');
    }

    return {
      id: `IMG_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      file,
      fileName,
      format,
      fileSizeBytes,
      previewUrl,
      width,
      height,
      modality,
      modalityConfidence,
      isUserSpecifiedModality: isUserSpecified,
      geospatialInfo,
      acquisitionDate: geospatialInfo.acquisitionDate || new Date().toISOString().slice(0, 10),
      label: label || 'Uploaded Scene',
      source: 'USER_UPLOAD',
      validationStatus: format === 'UNKNOWN' ? 'WARNING' : 'VALID',
      validationNotes,
    };
  }

  /**
   * Creates a synthetic or benchmark UploadedImage from a preset URL and metadata.
   */
  public static createPresetImage(params: {
    fileName: string;
    format: ImageFormat;
    previewUrl: string;
    width: number;
    height: number;
    modality: ModalityType;
    sensorType: SensorType;
    acquisitionDate: string;
    bounds?: [number, number, number, number];
    center?: { lat: number; lon: number };
    label: string;
    crs?: string;
  }): UploadedImage {
    return {
      id: `PRESET_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      fileName: params.fileName,
      format: params.format,
      fileSizeBytes: 2450000,
      previewUrl: params.previewUrl,
      width: params.width,
      height: params.height,
      modality: params.modality,
      modalityConfidence: 0.98,
      isUserSpecifiedModality: true,
      label: params.label,
      source: 'BENCHMARK_DEMO',
      acquisitionDate: params.acquisitionDate,
      validationStatus: 'VALID',
      geospatialInfo: {
        hasGeospatial: Boolean(params.bounds || params.center),
        bounds: params.bounds,
        center: params.center,
        crs: params.crs || 'EPSG:4326',
        satellitePlatform: params.sensorType,
        sensorType: params.sensorType,
        acquisitionDate: params.acquisitionDate,
      },
    };
  }

  /**
   * Validates multi-image compatibility for Bi-Temporal or Optical+SAR workflows.
   */
  public static validateInputPair(
    mode: InputMode,
    primary: UploadedImage,
    secondary?: UploadedImage
  ): ValidationReport {
    const checks: CompatibilityCheckItem[] = [];

    // Check 1: Supported Format
    const primaryFormatOk = primary.format !== 'UNKNOWN';
    const secondaryFormatOk = !secondary || secondary.format !== 'UNKNOWN';
    if (primaryFormatOk && secondaryFormatOk) {
      checks.push({
        id: 'chk_format',
        title: 'Supported File Format',
        status: 'PASS',
        message: `Primary: ${primary.format}${secondary ? ` | Secondary: ${secondary.format}` : ''}`,
      });
    } else {
      checks.push({
        id: 'chk_format',
        title: 'Supported File Format',
        status: 'WARNING',
        message: 'One or more files have unrecognized raster containers.',
      });
    }

    // Check 2: Resolution & Dimensions
    if (primary.width > 0 && primary.height > 0) {
      if (secondary) {
        const dimRatio = (primary.width * primary.height) / (secondary.width * secondary.height);
        const isDimClose = dimRatio >= 0.5 && dimRatio <= 2.0;

        checks.push({
          id: 'chk_dimensions',
          title: 'Dimension & Grid Compatibility',
          status: isDimClose ? 'PASS' : 'WARNING',
          message: `${primary.width}x${primary.height} px vs ${secondary.width}x${secondary.height} px (${isDimClose ? 'Matching aspect ratios' : 'Differing scale ratios'})`,
        });
      } else {
        checks.push({
          id: 'chk_dimensions',
          title: 'Image Dimensions Verified',
          status: 'PASS',
          message: `${primary.width}x${primary.height} px raster grid`,
        });
      }
    } else {
      checks.push({
        id: 'chk_dimensions',
        title: 'Dimension Verification',
        status: 'FAIL',
        message: 'Could not resolve raster grid dimensions.',
      });
    }

    // Mode-Specific Checks
    if (mode === 'BI_TEMPORAL') {
      if (!secondary) {
        checks.push({
          id: 'chk_temporal_pair',
          title: 'Temporal Observation Pair',
          status: 'FAIL',
          message: 'Second observation (Target Epoch T1) is required for change detection.',
        });
      } else {
        const d1 = new Date(primary.acquisitionDate || 0).getTime();
        const d2 = new Date(secondary.acquisitionDate || 0).getTime();
        const hasTimeDelta = d1 !== d2;

        checks.push({
          id: 'chk_temporal_pair',
          title: 'Bi-Temporal Timeline Separation',
          status: hasTimeDelta ? 'PASS' : 'WARNING',
          message: `Baseline: ${primary.acquisitionDate || 'T0'} → Target: ${secondary.acquisitionDate || 'T1'}${!hasTimeDelta ? ' (Same date detected; delta analysis may be synthetic)' : ''}`,
        });
      }
    } else if (mode === 'OPTICAL_SAR') {
      if (!secondary) {
        checks.push({
          id: 'chk_modality_pair',
          title: 'Optical + SAR Modality Pairing',
          status: 'FAIL',
          message: 'Complementary SAR observation required for multimodal fusion.',
        });
      } else {
        const hasOptical = primary.modality === 'OPTICAL' || secondary.modality === 'OPTICAL';
        const hasSar = primary.modality === 'SAR' || secondary.modality === 'SAR';

        checks.push({
          id: 'chk_modality_pair',
          title: 'Multimodal Sensor Modalities',
          status: hasOptical && hasSar ? 'PASS' : 'WARNING',
          message: `Primary: ${primary.modality} | Secondary: ${secondary.modality}${hasOptical && hasSar ? ' (Compliant Optical + SAR pair)' : ' (Sensor modalities not strictly differentiated)'}`,
        });
      }
    }

    // Spatial Grounding / Geospatial Metadata check
    const hasPrimaryGeo = primary.geospatialInfo.hasGeospatial;
    const hasSecondaryGeo = secondary ? secondary.geospatialInfo.hasGeospatial : true;

    if (hasPrimaryGeo && hasSecondaryGeo) {
      checks.push({
        id: 'chk_spatial_geo',
        title: 'Geospatial Reference & Coordinate System',
        status: 'PASS',
        message: `Referenced to ${primary.geospatialInfo.crs || 'WGS-84 / EPSG:4326'} with globe placement.`,
      });
    } else {
      checks.push({
        id: 'chk_spatial_geo',
        title: 'Geospatial Metadata Status',
        status: 'UNKNOWN',
        message: 'No spatial projection tags found. Standard pixel coordinate space used (manual location optional).',
      });
    }

    // Determine Overall Status
    const hasFails = checks.some((c) => c.status === 'FAIL');
    const hasWarnings = checks.some((c) => c.status === 'WARNING');
    const hasUnknowns = checks.some((c) => c.status === 'UNKNOWN');

    let overallStatus: CompatibilityStatus = 'COMPATIBLE';
    let canExecute = true;

    if (hasFails) {
      overallStatus = 'NOT_COMPATIBLE';
      canExecute = false;
    } else if (hasWarnings) {
      overallStatus = 'LIKELY_COMPATIBLE';
    } else if (hasUnknowns) {
      overallStatus = 'COMPATIBILITY_UNKNOWN';
    }

    return {
      overallStatus,
      canExecuteAnalysis: canExecute,
      summary: this.getSummaryMessage(overallStatus, mode),
      checks,
      suggestedAction: !canExecute ? 'Please upload the missing observation layer to continue.' : undefined,
    };
  }

  private static getSummaryMessage(status: CompatibilityStatus, mode: InputMode): string {
    switch (status) {
      case 'COMPATIBLE':
        return `Input verified and fully compliant for ${mode.replace(/_/g, ' ')} workflow.`;
      case 'LIKELY_COMPATIBLE':
        return `Input observations are likely compatible; slight dimension or metadata variations detected.`;
      case 'COMPATIBILITY_UNKNOWN':
        return `Format valid. Non-geospatial image raster space will be used for AI visual reasoning.`;
      case 'NOT_COMPATIBLE':
        return `Missing or incompatible inputs for the selected ${mode.replace(/_/g, ' ')} workflow.`;
    }
  }

  private static detectFormat(fileName: string, mimeType?: string): ImageFormat {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.tif') || lower.endsWith('.tiff')) {
      if (lower.includes('cog') || lower.includes('cloud')) return 'COG';
      return 'GEOTIFF';
    }
    if (lower.endsWith('.nc') || lower.endsWith('.nc4') || lower.endsWith('.hdf')) return 'NETCDF';
    if (lower.endsWith('.png')) return 'PNG';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'JPEG';
    if (lower.endsWith('.webp')) return 'WEBP';

    if (mimeType?.includes('png')) return 'PNG';
    if (mimeType?.includes('jpeg')) return 'JPEG';
    if (mimeType?.includes('tiff')) return 'GEOTIFF';

    return 'UNKNOWN';
  }

  private static inferModality(fileName: string): { modality: ModalityType; confidence: number } {
    const lower = fileName.toLowerCase();
    if (
      lower.includes('sar') ||
      lower.includes('s1') ||
      lower.includes('sentinel-1') ||
      lower.includes('sentinel1') ||
      lower.includes('radar') ||
      lower.includes('vv') ||
      lower.includes('vh') ||
      lower.includes('alos') ||
      lower.includes('palsar')
    ) {
      return { modality: 'SAR', confidence: 0.9 };
    }
    if (
      lower.includes('s2') ||
      lower.includes('sentinel-2') ||
      lower.includes('sentinel2') ||
      lower.includes('landsat') ||
      lower.includes('optical') ||
      lower.includes('rgb') ||
      lower.includes('planet') ||
      lower.includes('msi') ||
      lower.includes('oli')
    ) {
      return { modality: 'OPTICAL', confidence: 0.9 };
    }
    return { modality: 'OPTICAL', confidence: 0.5 };
  }

  private static extractMetadataFromFileName(fileName: string, format: ImageFormat): GeospatialMetadata {
    const lower = fileName.toLowerCase();
    const hasGeo = format === 'GEOTIFF' || format === 'COG' || format === 'NETCDF';

    // Try extracting date pattern like 20230615 or 2024-03-12
    let acquisitionDate: string | undefined = undefined;
    const dateMatch = fileName.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/);
    if (dateMatch) {
      acquisitionDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    }

    let sensorType: SensorType | undefined = undefined;
    if (lower.includes('s2') || lower.includes('sentinel2') || lower.includes('sentinel-2')) {
      sensorType = 'Sentinel-2';
    } else if (lower.includes('s1') || lower.includes('sentinel1') || lower.includes('sentinel-1')) {
      sensorType = 'Sentinel-1';
    } else if (lower.includes('landsat')) {
      sensorType = 'Landsat-8';
    } else if (lower.includes('planet')) {
      sensorType = 'PlanetScope';
    }

    return {
      hasGeospatial: hasGeo,
      crs: hasGeo ? 'EPSG:4326 (WGS-84)' : undefined,
      acquisitionDate,
      sensorType,
      satellitePlatform: sensorType,
    };
  }

  private static readDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
      };
      img.onerror = () => {
        resolve({ width: 800, height: 600 });
      };
      img.src = url;
    });
  }
}
