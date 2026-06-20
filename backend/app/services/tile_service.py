"""TileService: professional paleoclimate visualization with smooth rendering."""

from pathlib import Path
import numpy as np
import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.interpolate import griddata

from app.core.config import settings

GPLATES_BASE = "https://gws.gplates.org"
GPLATES_MODEL = "MERDITH2021"
BG_COLOR = "#0d1117"


class TileService:

    def __init__(self, storage_dir: str | None = None):
        self.storage_dir = Path(storage_dir or settings.STORAGE_DIR) / "overlays"
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def _get_overlay_path(self, age_ma: float, var_name: str) -> Path:
        return self.storage_dir / f"{age_ma:.0f}_{var_name}.png"

    def is_cached(self, age_ma: float, var_name: str) -> bool:
        return self._get_overlay_path(age_ma, var_name).exists()

    def _fetch_continent_polygons(self, age_ma: float) -> list[np.ndarray]:
        import urllib.request
        url = f"{GPLATES_BASE}/reconstruct/static_polygons/?time={age_ma}&model={GPLATES_MODEL}"
        try:
            with urllib.request.urlopen(url, timeout=30) as resp:
                data = json.loads(resp.read())
        except Exception:
            return []

        polygons = []
        for feat in data.get("features", []):
            geom = feat.get("geometry")
            if not geom:
                continue
            rings = []
            coords = geom.get("coordinates", [])
            if geom["type"] == "Polygon":
                rings = coords
            elif geom["type"] == "MultiPolygon":
                rings = [ring for poly in coords for ring in poly]
            for ring in rings:
                if len(ring) < 3:
                    continue
                arr = np.array(ring)
                arr[:, 0] = np.where(arr[:, 0] < 0, arr[:, 0] + 360, arr[:, 0])
                polygons.append(arr)
        return polygons

    def _upsample(self, data: np.ndarray, lons: np.ndarray, lats: np.ndarray,
                  factor: int = 4) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Upsample coarse 96x73 grid to smooth high-res grid via interpolation."""
        lon_grid, lat_grid = np.meshgrid(lons, lats)

        nlons = len(lons) * factor
        nlats = len(lats) * factor
        new_lons = np.linspace(lons.min(), lons.max(), nlons)
        new_lats = np.linspace(lats.min(), lats.max(), nlats)
        new_lon_grid, new_lat_grid = np.meshgrid(new_lons, new_lats)

        valid = ~np.isnan(data)
        if valid.sum() < 3:
            return data, lons, lats

        points = np.column_stack([lon_grid[valid].ravel(), lat_grid[valid].ravel()])
        values = data[valid].ravel()

        smooth = griddata(
            points, values,
            (new_lon_grid, new_lat_grid),
            method='cubic',
            fill_value=np.nan,
        )
        # Fill NaN edges with nearest
        mask = np.isnan(smooth)
        if mask.any():
            nearest = griddata(
                points, values,
                (new_lon_grid, new_lat_grid),
                method='nearest',
            )
            smooth[mask] = nearest[mask]

        return smooth, new_lons, new_lats

    def generate_overlay(
        self,
        data: np.ndarray,
        lons: np.ndarray,
        lats: np.ndarray,
        age_ma: float,
        var_name: str,
        colormap: str = "RdYlBu_r",
        vmin: float | None = None,
        vmax: float | None = None,
    ) -> str:
        # Value range
        valid = data[~np.isnan(data)]
        if vmin is None:
            vmin = float(np.percentile(valid, 2))
        if vmax is None:
            vmax = float(np.percentile(valid, 98))

        # Upsample for smooth rendering
        smooth_data, smooth_lons, smooth_lats = self._upsample(data, lons, lats, factor=4)

        # Fetch GPlates continents
        continent_polygons = self._fetch_continent_polygons(age_ma)

        w = settings.OVERLAY_WIDTH / settings.OVERLAY_DPI
        h = settings.OVERLAY_HEIGHT / settings.OVERLAY_DPI

        fig, ax = plt.subplots(figsize=(w, h), dpi=settings.OVERLAY_DPI)
        fig.patch.set_facecolor(BG_COLOR)
        ax.set_facecolor(BG_COLOR)

        # Smooth climate data
        ax.pcolormesh(
            smooth_lons, smooth_lats, smooth_data,
            cmap=colormap, vmin=vmin, vmax=vmax,
            shading='gouraud',
            rasterized=True,
        )

        # Paleo-continent outlines — clean white lines
        for poly in continent_polygons:
            ax.plot(
                poly[:, 0], poly[:, 1],
                color='white', linewidth=0.5, alpha=0.7,
                solid_capstyle='round', solid_joinstyle='round',
            )

        ax.set_xlim(lons.min(), lons.max())
        ax.set_ylim(lats.min(), lats.max())
        ax.set_axis_off()
        ax.set_position([0, 0, 1, 1])
        ax.set_aspect('auto')

        output_path = self._get_overlay_path(age_ma, var_name)
        fig.savefig(
            output_path,
            bbox_inches='tight', pad_inches=0,
            format='png', facecolor=BG_COLOR,
            dpi=settings.OVERLAY_DPI,
        )
        plt.close(fig)
        return f"overlays/{output_path.name}"

    def get_data_range(self, data: np.ndarray) -> tuple[float, float]:
        valid = data[~np.isnan(data)]
        return float(np.percentile(valid, 2)), float(np.percentile(valid, 98))
