"""Utility functions for NC file discovery and filename parsing."""

import re
from pathlib import Path


def discover_nc_files(data_dir: str, pattern: str = "*Ma_temperature.nc") -> list[Path]:
    """Discover NC files matching a pattern in the data directory.

    Args:
        data_dir: Path to the data directory.
        pattern: Glob pattern for matching files.

    Returns:
        List of Path objects sorted by name.
    """
    data_path = Path(data_dir)
    files = sorted(data_path.glob(pattern))
    return files


def parse_age_from_filename(filename: str) -> float | None:
    """Extract geological age (Ma) from NC file name.

    Examples:
        'teXPia.pdclann_430Ma_temperature.nc' -> 430.0
        'teXPxa.pdclann_505Ma_temperature.nc' -> 505.0

    Args:
        filename: The file name or path.

    Returns:
        The age in Ma as a float, or None if not found.
    """
    match = re.search(r"_(\d+)Ma_", str(filename))
    if match:
        return float(match.group(1))
    return None


def parse_file_group_id(filename: str) -> str:
    """Extract file group ID from NC file name.

    Examples:
        'teXPia.pdclann_430Ma_temperature.nc' -> 'teXPia'
        'teXPra.pdclann.nc' -> 'teXPra'

    Args:
        filename: The file name or path.

    Returns:
        The file group ID string.
    """
    name = Path(filename).stem
    # Take first segment before first dot
    parts = name.split(".")
    return parts[0]


def get_available_nc_files(data_dir: str) -> list[dict]:
    """Get metadata for all available NC temperature files.

    Returns:
        List of dicts with keys: file_path, age_ma, file_group_id
    """
    files = discover_nc_files(data_dir)
    results = []
    for f in files:
        age = parse_age_from_filename(f.name)
        group_id = parse_file_group_id(f.name)
        if age is not None:
            results.append({
                "file_path": str(f.resolve()),
                "age_ma": age,
                "file_group_id": group_id,
            })
    return results
