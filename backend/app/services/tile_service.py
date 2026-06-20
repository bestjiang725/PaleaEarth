"""TileService: generates paleoclimate overlay images with GPlates continents."""

from pathlib import Path
import numpy as np
import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.path import Path as MplPath
from matplotlib.patches import PathPatch

from app.core.config import settings

GPLATES_BASE = "https://gws.gplates.org"
GPLATES_MODEL = "MERDITH2021"


class TileService:
    """Generates equirectangular PNG showing paleoclimate on paleo-continents.

    Ocean = dark blue background. Continents = climate data colors.
    """

    def __init__(self, storage_dir: str | None = None):
        self.storage_dir = Path(storage_dir or settings.STORAGE_DIR) / "overlays"
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def _get_overlay_path(self, age_ma: float, var_name: str) -> Path:
        return self.storage_dir / f"{age_ma:.0f}_{var_name}.png"

    def is_cached(self, age_ma: float, var_name: str) -> bool:
        return self._get_overlay_path(age_ma, var_name).exists()

    def get_cached_path(self, age_ma: float, var_name: str) -> str | None:
        path = self._get_overlay_path(age_ma, var_name)
        if path.exists():
            return f"overlays/{path.name}"
        return None

    def _fetch_continent_polygons(self, age_ma: float) -> list[np.ndarray]:
        """Fetch GPlates static polygons and convert to contour arrays."""
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
                # Normalize lon to 0-360 if needed
                arr[:, 0] = np.where(arr[:, 0] < 0, arr[:, 0] + 360, arr[:, 0])
                polygons.append(arr)
        return polygons

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
        """Generate a combined paleogeography + climate overlay.

        Ocean = dark blue. Continents = climate colormap.
        """
        valid_data = data[~np.isnan(data)]
        if vmin is None:
            vmin = float(np.percentile(valid_data, 2))
        if vmax is None:
            vmax = float(np.percentile(valid_data, 98))

        # Fetch GPlates continent polygons
        continent_polygons = self._fetch_continent_polygons(age_ma)

        fig_width = settings.OVERLAY_WIDTH / settings.OVERLAY_DPI
        fig_height = settings.OVERLAY_HEIGHT / settings.OVERLAY_DPI

        fig, ax = plt.subplots(
            figsize=(fig_width, fig_height),
            dpi=settings.OVERLAY_DPI,
        )

        # Ocean background
        ax.set_facecolor("#0a1628")

        # Draw climate data
        mesh = ax.pcolormesh(
            lons, lats, data,
            cmap=colormap,
            vmin=vmin, vmax=vmax,
            shading="auto",
            rasterized=True,
        )

        # Draw paleo-continent outlines
        for poly in continent_polygons:
            lons_p = poly[:, 0]
            lats_p = poly[:, 1]
            ax.plot(lons_p, lats_p,
                    color=(200/255, 180/255, 150/255, 0.7),
                    linewidth=0.4,
                    zorder=10)

        # Set global extent to match data grid
        ax.set_xlim(lons.min(), lons.max())
        ax.set_ylim(lats.min(), lats.max())
        ax.set_axis_off()
        ax.set_position([0, 0, 1, 1])
        ax.set_aspect('auto')

        output_path = self._get_overlay_path(age_ma, var_name)
        fig.savefig(
            output_path,
            bbox_inches="tight",
            pad_inches=0,
            format="png",
            facecolor="#0a1628",
            dpi=settings.OVERLAY_DPI,
        )
        plt.close(fig)

        return f"overlays/{output_path.name}"

    def get_data_range(self, data: np.ndarray) -> tuple[float, float]:
        valid = data[~np.isnan(data)]
        vmin = float(np.percentile(valid, 2))
        vmax = float(np.percentile(valid, 98))
        return vmin, vmax
