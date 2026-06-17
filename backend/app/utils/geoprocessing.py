"""Geospatial processing utilities: interpolation, bbox extraction."""

import numpy as np
from scipy.interpolate import RegularGridInterpolator


def bilinear_interpolate(
    data: np.ndarray,
    lons: np.ndarray,
    lats: np.ndarray,
    target_lon: float,
    target_lat: float,
) -> float | None:
    """Bilinear interpolation of a 2D field at a target point.

    Args:
        data: 2D numpy array of shape (lat, lon).
        lons: 1D array of longitudes.
        lats: 1D array of latitudes.
        target_lon: Target longitude in degrees.
        target_lat: Target latitude in degrees.

    Returns:
        Interpolated value or None if out of bounds.
    """
    # Check bounds with small tolerance
    lon_min, lon_max = float(lons.min()), float(lons.max())
    lat_min, lat_max = float(lats.min()), float(lats.max())

    if not (lon_min - 0.1 <= target_lon <= lon_max + 0.1):
        return None
    if not (lat_min - 0.1 <= target_lat <= lat_max + 0.1):
        return None

    # Handle longitude wrapping
    if target_lon < lon_min:
        target_lon = lon_min
    if target_lon > lon_max:
        target_lon = lon_max
    if target_lat < lat_min:
        target_lat = lat_min
    if target_lat > lat_max:
        target_lat = lat_max

    try:
        interp = RegularGridInterpolator(
            (lats, lons),
            data,
            method="linear",
            bounds_error=False,
            fill_value=None,
        )
        result = interp((target_lat, target_lon))
        return float(result)
    except Exception:
        # Fallback: nearest neighbor
        lon_idx = np.abs(lons - target_lon).argmin()
        lat_idx = np.abs(lats - target_lat).argmin()
        return float(data[lat_idx, lon_idx])


def extract_bbox(
    data: np.ndarray,
    lons: np.ndarray,
    lats: np.ndarray,
    lon_min: float,
    lon_max: float,
    lat_min: float,
    lat_max: float,
) -> tuple[np.ndarray, np.ndarray, np.ndarray] | None:
    """Extract a bounding box subset from a 2D field.

    Args:
        data: 2D numpy array of shape (lat, lon).
        lons: 1D array of longitudes.
        lats: 1D array of latitudes.
        lon_min, lon_max, lat_min, lat_max: Bounding box in degrees.

    Returns:
        Tuple of (subset_data, subset_lons, subset_lats) or None if invalid.
    """
    lon_mask = (lons >= lon_min) & (lons <= lon_max)
    lat_mask = (lats >= lat_min) & (lats <= lat_max)

    if not lon_mask.any() or not lat_mask.any():
        return None

    subset_lons = lons[lon_mask]
    subset_lats = lats[lat_mask]

    # Get indices for slicing
    lon_indices = np.where(lon_mask)[0]
    lat_indices = np.where(lat_mask)[0]

    lon_slice = slice(int(lon_indices[0]), int(lon_indices[-1]) + 1)
    lat_slice = slice(int(lat_indices[0]), int(lat_indices[-1]) + 1)

    subset_data = data[lat_slice, lon_slice]

    return subset_data, subset_lons, subset_lats


def compute_region_stats(data: np.ndarray) -> dict:
    """Compute basic statistics for a 2D data array.

    Args:
        data: 2D numpy array.

    Returns:
        Dict with keys: min, max, mean, std, count
    """
    valid = data[~np.isnan(data)]
    if len(valid) == 0:
        return {"min": None, "max": None, "mean": None, "std": None, "count": 0}

    return {
        "min": float(valid.min()),
        "max": float(valid.max()),
        "mean": float(valid.mean()),
        "std": float(valid.std()),
        "count": int(len(valid)),
    }
