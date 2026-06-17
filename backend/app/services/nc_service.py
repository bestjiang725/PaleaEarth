"""NCDataService: core NetCDF file reading and data extraction.

Works with NetCDF3 classic format files using scipy.io.netcdf_file
to avoid issues with Chinese path encoding on Windows.
"""

import numpy as np
from pathlib import Path
from scipy.io import netcdf_file

from app.utils.geoprocessing import bilinear_interpolate, extract_bbox, compute_region_stats


class NCDataService:
    """Reads and queries NetCDF climate data files.

    All files share the same grid structure:
    - longitude: 96 points (0 to 356.25 deg, 3.75 deg resolution)
    - latitude: 73 points (90 to -90 deg, 2.5 deg resolution)
    - Some variables on staggered grid: 72 lat points
    - Variables have shape (1, 1, lat, lon) or (1, 1, lat_s, lon_s)
    """

    def __init__(self, file_path: str):
        self.path = Path(file_path)
        self._file = None

    def open(self):
        """Open the NetCDF file."""
        if self._file is None:
            self._file = netcdf_file(str(self.path), "r", mmap=False)

    def close(self):
        """Close the NetCDF file."""
        if self._file is not None:
            self._file.close()
            self._file = None

    def __enter__(self):
        self.open()
        return self

    def __exit__(self, *args):
        self.close()

    def _get_var_data(self, var_name: str) -> np.ndarray:
        """Read a variable as a numpy array, squeezing leading dims of size 1."""
        if self._file is None:
            raise RuntimeError("File not opened")
        if var_name not in self._file.variables:
            raise KeyError(f"Variable '{var_name}' not found in {self.path.name}")
        data = self._file.variables[var_name].data.copy()
        # Squeeze leading singleton dimensions (time, level) but keep 2D
        while data.ndim > 2 and data.shape[0] == 1:
            data = data.squeeze(0)
        return data.astype(np.float64)

    def get_variable_2d(self, var_name: str) -> np.ndarray:
        """Get a 2D (lat, lon) array for a variable.

        For multi-layer variables (e.g., soil moisture with 4 levels),
        returns the surface layer (first layer).
        """
        data = self._get_var_data(var_name)
        if data.ndim > 2:
            # Take the first non-singleton leading dimension
            # For soil vars: shape (4, 73, 96) -> take layer 0
            data = data[0]
        if data.ndim != 2:
            raise ValueError(
                f"Variable '{var_name}' has unexpected shape {data.shape}, "
                f"expected 2D after squeeze"
            )
        return data

    def get_lons(self) -> np.ndarray:
        """Get longitude array (96 points)."""
        if self._file is None:
            raise RuntimeError("File not opened")
        if "longitude" in self._file.variables:
            return self._file.variables["longitude"].data.copy().astype(np.float64)
        # Fallback for files without explicit longitude variable
        return np.linspace(0, 356.25, 96)

    def get_lats(self) -> np.ndarray:
        """Get latitude array (73 points, 90 to -90)."""
        if self._file is None:
            raise RuntimeError("File not opened")
        if "latitude" in self._file.variables:
            return self._file.variables["latitude"].data.copy().astype(np.float64)
        return np.linspace(90, -90, 73)

    def list_variables(self) -> list[str]:
        """List all climate variables available in this file.

        Excludes dimension/coordinate variables (longitude, latitude, time, etc.)
        """
        if self._file is None:
            raise RuntimeError("File not opened")
        dim_vars = {"longitude", "latitude", "t", "longitude_1", "latitude_1",
                    "surface", "hybrid_p_x1000", "toa", "hybrid_p_x1000_1",
                    "ht", "level275", "level6", "msl", "unspecified",
                    "height", "depth", "field700", "field150", "lsm",
                    "depthlevel", "depthdepth"}
        vars_list = []
        for name, var in self._file.variables.items():
            if name not in dim_vars:
                vars_list.append(name)
        return sorted(vars_list)

    def point_query(self, var_name: str, lon: float, lat: float) -> float | None:
        """Query a climate variable value at a specific lon/lat point.

        Uses bilinear interpolation from the four surrounding grid points.

        Args:
            var_name: Variable name.
            lon: Target longitude (-180 to 180 will be wrapped to 0-360).
            lat: Target latitude (-90 to 90).

        Returns:
            Interpolated value or None if out of bounds.
        """
        data = self.get_variable_2d(var_name)
        lons = self.get_lons()
        lats = self.get_lats()

        # Handle grid: check if variable has 72 lats (staggered)
        if data.shape[0] == 72 and len(lats) != 72:
            if "latitude_1" in self._file.variables:
                lats = self._file.variables["latitude_1"].data.copy().astype(np.float64)

        # Normalize lon to 0-360 range
        target_lon = lon % 360

        return bilinear_interpolate(data, lons, lats, target_lon, lat)

    def region_stats(
        self,
        var_name: str,
        lon_min: float,
        lon_max: float,
        lat_min: float,
        lat_max: float,
    ) -> dict:
        """Compute statistics for a geographic bounding box.

        Args:
            var_name: Variable name.
            lon_min, lon_max: Longitude bounds (0-360).
            lat_min, lat_max: Latitude bounds (-90 to 90).

        Returns:
            Dict with min, max, mean, std, count.
        """
        data = self.get_variable_2d(var_name)
        lons = self.get_lons()
        lats = self.get_lats()

        # Normalize lons to 0-360
        lon_min = lon_min % 360
        lon_max = lon_max % 360

        # Handle lon wrapping (e.g., 350 to 10)
        if lon_min > lon_max:
            # Split query: [lon_min, 360) and [0, lon_max]
            result1 = extract_bbox(data, lons, lats, lon_min, 360, lat_min, lat_max)
            result2 = extract_bbox(data, lons, lats, 0, lon_max, lat_min, lat_max)
            if result1 is None and result2 is None:
                return {"min": None, "max": None, "mean": None, "std": None, "count": 0}
            combined = None
            if result1 is not None:
                combined = result1[0]
            if result2 is not None:
                combined = np.concatenate((combined, result2[0]), axis=1) if combined is not None else result2[0]
            return compute_region_stats(combined)

        result = extract_bbox(data, lons, lats, lon_min, lon_max, lat_min, lat_max)
        if result is None:
            return {"min": None, "max": None, "mean": None, "std": None, "count": 0}

        return compute_region_stats(result[0])
