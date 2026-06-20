"""TileService: global climate data with paleo-continent overlay."""

from pathlib import Path
import numpy as np
import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from app.core.config import settings

GPLATES_BASE = "https://gws.gplates.org"
GPLATES_MODEL = "MERDITH2021"


class TileService:
    """Render global climate data + paleo-continents as semi-transparent overlay."""

    def __init__(self, storage_dir: str | None = None):
        self.storage_dir = Path(storage_dir or settings.STORAGE_DIR) / "overlays"
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def _get_overlay_path(self, age_ma: float, var_name: str) -> Path:
        return self.storage_dir / f"{age_ma:.0f}_{var_name}.png"

    def is_cached(self, age_ma: float, var_name: str) -> bool:
        return self._get_overlay_path(age_ma, var_name).exists()

    def _fetch_continent_polygons(self, age_ma: float) -> list[np.ndarray]:
        """Fetch GPlates static polygons."""
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
        """Global climate data + paleo-continent overlay."""
        valid_data = data[~np.isnan(data)]
        if vmin is None:
            vmin = float(np.percentile(valid_data, 2))
        if vmax is None:
            vmax = float(np.percentile(valid_data, 98))

        continent_polygons = self._fetch_continent_polygons(age_ma)

        fig_width = settings.OVERLAY_WIDTH / settings.OVERLAY_DPI
        fig_height = settings.OVERLAY_HEIGHT / settings.OVERLAY_DPI

        fig, ax = plt.subplots(
            figsize=(fig_width, fig_height),
            dpi=settings.OVERLAY_DPI,
        )

        # Layer 1: Full global climate data
        ax.pcolormesh(
            lons, lats, data,
            cmap=colormap,
            vmin=vmin, vmax=vmax,
            shading="auto",
            rasterized=True,
            zorder=1,
        )

        # Layer 2: Paleo-continents as semi-transparent fill + outline
        for poly in continent_polygons:
            # Semi-transparent brown fill for land
            ax.fill(
                poly[:, 0], poly[:, 1],
                facecolor=(0, 0, 0, 0.25),
                edgecolor="none",
                zorder=2,
            )
            # Visible outline
            ax.plot(
                poly[:, 0], poly[:, 1],
                color=(255/255, 255/255, 255/255, 0.9),
                linewidth=0.8,
                solid_capstyle='round',
                zorder=3,
            )

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
