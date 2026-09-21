"""Real pixel-level raster analysis.

Unlike `spectral_calculator.py` (which does scalar arithmetic on two pre-supplied
reflectance numbers from the seed/PostGIS catalogue), everything in this module operates
on actual decoded pixel arrays from an uploaded image. It is intentionally conservative
about what it claims:

- True NDVI/NDWI require a near-infrared band. A plain RGB image (PNG/JPEG, or a 3-band
  GeoTIFF) does NOT have one, so we compute VARI (a published, genuinely visible-spectrum
  vegetation index) instead of fabricating an NDVI number from bands that can't support it.
- SAR handling is honestly labelled as heuristic grayscale-intensity statistics, not
  calibrated radar backscatter (dB) — no radiometric/terrain correction is applied.
- Bi-temporal "alignment" is a resize-to-common-grid, not a georeferenced co-registration.
- Confidence is a heuristic derived from real signals (valid-pixel coverage, band count,
  decoder used) — not a model-derived probability.
"""

import base64
import io
import time
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image

try:
    import rasterio
    from rasterio.io import MemoryFile

    HAS_RASTERIO = True
except Exception:  # pragma: no cover - rasterio is optional at runtime
    HAS_RASTERIO = False

MAX_DIMENSION = 1024
CHANGE_THRESHOLD = 0.12  # mean-band absolute difference (0-1 scale) counted as "changed"


class ExecutionTracer:
    def __init__(self) -> None:
        self._steps: List[Dict[str, Any]] = []

    def record(self, step: str, tool: str, detail: str, started_at: float) -> None:
        self._steps.append(
            {
                "step": step,
                "tool": tool,
                "detail": detail,
                "durationMs": round((time.perf_counter() - started_at) * 1000, 2),
            }
        )

    @property
    def steps(self) -> List[Dict[str, Any]]:
        return self._steps


def _dtype_max(dtype_name: str) -> float:
    try:
        info = np.iinfo(dtype_name)
        return float(info.max)
    except (ValueError, TypeError):
        return 1.0


def decode_image(content_base64: str, filename: str, tracer: ExecutionTracer) -> Tuple[np.ndarray, str]:
    """Returns (array[h, w, bands] float32 normalized to 0..1, decoder name used)."""
    t0 = time.perf_counter()
    raw = base64.b64decode(content_base64)
    lower = filename.lower()

    if HAS_RASTERIO and (lower.endswith(".tif") or lower.endswith(".tiff")):
        try:
            with MemoryFile(raw) as memfile:
                with memfile.open() as dataset:
                    data = dataset.read()  # (bands, h, w)
                    arr = np.transpose(data, (1, 2, 0)).astype(np.float32)
                    max_val = _dtype_max(str(dataset.dtypes[0]))
                    arr = arr / max_val if max_val > 0 else arr
            tracer.record(
                "Raster decode",
                "rasterio (GDAL)",
                f"Opened {filename} as a {arr.shape[2]}-band GeoTIFF ({arr.shape[1]}x{arr.shape[0]}px).",
                t0,
            )
            return arr, "rasterio"
        except Exception:
            pass  # fall through to the generic image decoder below

    img = Image.open(io.BytesIO(raw))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    arr = np.asarray(img).astype(np.float32) / 255.0
    if arr.ndim == 2:
        arr = arr[:, :, np.newaxis]
    tracer.record(
        "Raster decode",
        "Pillow",
        f"Opened {filename} as a {arr.shape[2]}-band image ({arr.shape[1]}x{arr.shape[0]}px) "
        f"via a generic image decoder (not a georeferenced GeoTIFF read).",
        t0,
    )
    return arr, "Pillow"


def downsample_if_needed(arr: np.ndarray, tracer: ExecutionTracer) -> np.ndarray:
    h, w = arr.shape[0], arr.shape[1]
    if max(h, w) <= MAX_DIMENSION:
        return arr
    t0 = time.perf_counter()
    scale = MAX_DIMENSION / max(h, w)
    new_size = (max(1, int(w * scale)), max(1, int(h * scale)))
    channels = arr.shape[2]
    as_uint8 = np.clip(arr[:, :, : min(channels, 3)] * 255, 0, 255).astype(np.uint8)
    resized = np.asarray(Image.fromarray(as_uint8).resize(new_size, Image.BILINEAR)).astype(np.float32) / 255.0
    if channels > 3:
        # Extra bands (e.g. NIR) resized independently since PIL only handles up to 4 channels well.
        extra = []
        for band_index in range(3, channels):
            band_uint8 = np.clip(arr[:, :, band_index] * 255, 0, 255).astype(np.uint8)
            band_resized = np.asarray(Image.fromarray(band_uint8).resize(new_size, Image.BILINEAR)).astype(np.float32) / 255.0
            extra.append(band_resized)
        resized = np.dstack([resized] + extra)
    tracer.record(
        "Downsample",
        "Pillow (bilinear)",
        f"Resized from {w}x{h} to {new_size[0]}x{new_size[1]} for processing speed.",
        t0,
    )
    return resized


def valid_pixel_fraction(arr: np.ndarray) -> float:
    nonzero = np.any(arr > 0.01, axis=2)
    return float(np.mean(nonzero)) if nonzero.size else 0.0


MIN_ABS_DENOMINATOR = 0.05  # below this, the ratio is numerically unstable and excluded rather than reported
INDEX_PHYSICAL_RANGE = (-1.0, 1.0)  # normalized-difference-style indices are conventionally bounded to this range


def _safe_ratio_index(numerator: np.ndarray, denominator: np.ndarray) -> np.ndarray:
    """Computes numerator/denominator, masking (as NaN, excluded from stats) pixels whose
    denominator is too close to zero to be numerically meaningful, then clips the rest to the
    conventional [-1, 1] physical range for normalized-difference indices."""
    unstable = np.abs(denominator) < MIN_ABS_DENOMINATOR
    safe_denominator = np.where(unstable, np.nan, denominator)
    with np.errstate(invalid="ignore", divide="ignore"):
        ratio = numerator / safe_denominator
    return np.clip(ratio, INDEX_PHYSICAL_RANGE[0], INDEX_PHYSICAL_RANGE[1])


def _index_result(name: str, formula: str, values: np.ndarray, interpretation: str, caveat: Optional[str]) -> Dict[str, Any]:
    finite = values[np.isfinite(values)]
    return {
        "name": name,
        "formula": formula,
        "mean": round(float(np.mean(finite)), 4) if finite.size else 0.0,
        "min": round(float(np.min(finite)), 4) if finite.size else 0.0,
        "max": round(float(np.max(finite)), 4) if finite.size else 0.0,
        "interpretation": interpretation,
        "caveat": caveat,
    }


def compute_indices(arr: np.ndarray, tracer: ExecutionTracer) -> List[Dict[str, Any]]:
    t0 = time.perf_counter()
    bands = arr.shape[2]
    r = arr[:, :, 0]
    g = arr[:, :, 1] if bands > 1 else r
    b = arr[:, :, 2] if bands > 2 else r
    results: List[Dict[str, Any]] = []

    if bands >= 4:
        nir = arr[:, :, 3]
        ndvi = _safe_ratio_index(nir - r, nir + r)
        results.append(
            _index_result(
                "NDVI",
                "(NIR - Red) / (NIR + Red)",
                ndvi,
                "Vegetation vigor from real NIR/Red bands: values above ~0.3 indicate dense healthy "
                "vegetation, near 0 or negative indicates water, bare soil, or built-up surfaces.",
                None,
            )
        )
        ndwi = _safe_ratio_index(g - nir, g + nir)
        results.append(
            _index_result(
                "NDWI",
                "(Green - NIR) / (Green + NIR)",
                ndwi,
                "Surface water content: values above ~0.2 suggest open water or high moisture content.",
                None,
            )
        )
    else:
        vari = _safe_ratio_index(g - r, g + r - b)
        results.append(
            _index_result(
                "VARI",
                "(Green - Red) / (Green + Red - Blue)",
                vari,
                "Visible-band vegetation greenness proxy computed from RGB only.",
                "True NDVI requires a near-infrared band, which this image does not provide "
                "(only R/G/B channels were decoded). VARI is a visible-spectrum substitute, not "
                "equivalent to NDVI, and should not be reported as NDVI.",
            )
        )

    tracer.record(
        "Vegetation index computation",
        "numpy array math",
        f"Computed {', '.join(r['name'] for r in results)} over the full {arr.shape[1]}x{arr.shape[0]}px array.",
        t0,
    )
    return results


def compute_sar_stats(arr: np.ndarray, tracer: ExecutionTracer) -> Dict[str, Any]:
    t0 = time.perf_counter()
    gray = arr.mean(axis=2)
    stats = {
        "meanIntensity": round(float(gray.mean()), 4),
        "stdIntensity": round(float(gray.std()), 4),
        "method": "heuristic grayscale-intensity statistics on the decoded raster",
        "caveat": (
            "Not calibrated radar backscatter (dB) — no SAR-specific radiometric, speckle, or "
            "terrain correction is applied. This is a genuine statistic of the pixel values you "
            "uploaded, not a simulated SAR-derived value, but it should not be presented as a "
            "calibrated backscatter measurement."
        ),
    }
    tracer.record(
        "SAR intensity statistics",
        "numpy array math",
        "Computed mean/std of decoded pixel intensity as a SAR-modality heuristic (see caveat).",
        t0,
    )
    return stats


def analyze_single_image(arr: np.ndarray, modality: str, decoder: str, tracer: ExecutionTracer) -> Dict[str, Any]:
    valid_fraction = valid_pixel_fraction(arr)
    indices = compute_indices(arr, tracer)
    sar_stats = compute_sar_stats(arr, tracer) if modality == "SAR" else None
    return {
        "width": int(arr.shape[1]),
        "height": int(arr.shape[0]),
        "bandCount": int(arr.shape[2]),
        "validPixelFraction": round(valid_fraction, 4),
        "indices": indices,
        "sarStats": sar_stats,
    }


def analyze_bi_temporal(arr_a: np.ndarray, arr_b: np.ndarray, tracer: ExecutionTracer) -> Dict[str, Any]:
    t0 = time.perf_counter()
    h = min(arr_a.shape[0], arr_b.shape[0])
    w = min(arr_a.shape[1], arr_b.shape[1])

    def _to_common_grid(arr: np.ndarray) -> np.ndarray:
        rgb_uint8 = np.clip(arr[:, :, :3] * 255, 0, 255).astype(np.uint8)
        if rgb_uint8.shape[1] == w and rgb_uint8.shape[0] == h:
            return rgb_uint8.astype(np.float32) / 255.0
        resized = np.asarray(Image.fromarray(rgb_uint8).resize((w, h), Image.BILINEAR))
        return resized.astype(np.float32) / 255.0

    a = _to_common_grid(arr_a)
    b = _to_common_grid(arr_b)
    tracer.record(
        "Bi-temporal alignment",
        "Pillow resize (bilinear)",
        f"Both images resized to a common {w}x{h} grid. This is a resize-based alignment, "
        f"NOT a georeferenced pixel-to-pixel co-registration (no ground-control-point warping "
        f"was performed).",
        t0,
    )

    t1 = time.perf_counter()
    diff = np.abs(a - b).mean(axis=2)  # 0..1
    mean_abs_difference = float(diff.mean())
    percent_changed = float(np.mean(diff > CHANGE_THRESHOLD) * 100.0)
    tracer.record(
        "Bi-temporal pixel differencing",
        "numpy array math",
        f"Computed per-pixel mean absolute band difference across the {w}x{h} common grid; "
        f"{percent_changed:.1f}% of pixels exceed the {CHANGE_THRESHOLD} change threshold.",
        t1,
    )

    t2 = time.perf_counter()
    heat = np.clip(diff * 255, 0, 255).astype(np.uint8)
    buf = io.BytesIO()
    Image.fromarray(heat, mode="L").save(buf, format="PNG")
    mask_b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    tracer.record(
        "Change-heatmap encoding",
        "Pillow (PNG)",
        "Encoded the real per-pixel absolute-difference array as a grayscale PNG (brighter = more change).",
        t2,
    )

    ndvi_delta = None
    if arr_a.shape[2] >= 4 and arr_b.shape[2] >= 4:
        t3 = time.perf_counter()

        def _ndvi(arr: np.ndarray) -> np.ndarray:
            red, nir = arr[:, :, 0], arr[:, :, 3]
            return np.nan_to_num(_safe_ratio_index(nir - red, nir + red), nan=0.0)

        ndvi_a_resized = np.asarray(
            Image.fromarray(np.clip(_ndvi(arr_a) * 127 + 128, 0, 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)
        ).astype(np.float32)
        ndvi_b_resized = np.asarray(
            Image.fromarray(np.clip(_ndvi(arr_b) * 127 + 128, 0, 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)
        ).astype(np.float32)
        delta = ((ndvi_b_resized - 128) / 127.0) - ((ndvi_a_resized - 128) / 127.0)
        ndvi_delta = {
            "meanDelta": round(float(delta.mean()), 4),
            "interpretation": "Negative mean delta indicates net vegetation loss between the two images; positive indicates net gain.",
        }
        tracer.record(
            "Bi-temporal NDVI delta",
            "numpy array math",
            "Both images had a usable NIR band (index 3); computed real NDVI for each and differenced.",
            t3,
        )

    return {
        "alignment": "resize-to-common-grid (not georeferenced co-registration)",
        "width": w,
        "height": h,
        "meanAbsoluteDifference": round(mean_abs_difference, 4),
        "percentChangedPixels": round(percent_changed, 2),
        "changeThreshold": CHANGE_THRESHOLD,
        "changeMaskPngBase64": mask_b64,
        "ndviDelta": ndvi_delta,
    }


def compute_confidence(valid_pixel_fraction: float, band_count: int, decoder: str) -> Dict[str, Any]:
    score = 0.5 + 0.2 * valid_pixel_fraction + (0.15 if band_count >= 4 else 0.0) + (0.05 if decoder == "rasterio" else 0.0)
    score = round(min(score, 0.9), 2)
    return {
        "value": score,
        "method": (
            f"Heuristic confidence = 0.5 base + 0.2 * valid-pixel-fraction ({valid_pixel_fraction:.2f}) "
            f"+ 0.15 if >=4 bands available ({'yes' if band_count >= 4 else 'no'}) "
            f"+ 0.05 if decoded via rasterio/GDAL ({'yes' if decoder == 'rasterio' else 'no'}), capped at 0.9. "
            f"This is a rule-based confidence estimate over real signal, not a trained model's output probability."
        ),
    }
