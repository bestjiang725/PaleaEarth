"""TileService: generates climate data overlay images using matplotlib+cartopy."""

from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from app.core.config import settings


class TileService:
    """Generates equirectangular PNG overlay images for paleoclimate visualization.

    Renders pure climate data on a transparent background — no modern coastlines.
    Paleo-continents are rendered separately by the frontend via GPlates SVG.
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
        """Generate a climate overlay PNG — no modern coastlines.

        The image has a transparent background so the frontend's SVG
        paleo-continents and ocean background show through.

        Returns:
            Relative path to the generated PNG file.
        """
        valid_data = data[~np.isnan(data)]
        if vmin is None:
            vmin = float(np.percentile(valid_data, 2))
        if vmax is None:
            vmax = float(np.percentile(valid_data, 98))

        fig_width = settings.OVERLAY_WIDTH / settings.OVERLAY_DPI
        fig_height = settings.OVERLAY_HEIGHT / settings.OVERLAY_DPI

        try:
            import cartopy.crs as ccrs

            fig, ax = plt.subplots(
                figsize=(fig_width, fig_height),
                dpi=settings.OVERLAY_DPI,
                subplot_kw={"projection": ccrs.PlateCarree()},
            )

            ax.pcolormesh(
                lons, lats, data,
                cmap=colormap,
                vmin=vmin,
                vmax=vmax,
                transform=ccrs.PlateCarree(),
                shading="auto",
                rasterized=True,
            )

            # NO modern coastlines — paleo-continents rendered by frontend
            ax.set_global()
            ax.set_axis_off()
            ax.set_position([0, 0, 1, 1])
            plt.tight_layout(pad=0)

        except ImportError:
            fig, ax = plt.subplots(
                figsize=(fig_width, fig_height),
                dpi=settings.OVERLAY_DPI,
            )

            ax.pcolormesh(
                lons, lats, data,
                cmap=colormap,
                vmin=vmin,
                vmax=vmax,
                shading="auto",
                rasterized=True,
            )

            ax.set_xlim(lons.min(), lons.max())
            ax.set_ylim(lats.min(), lats.max())
            ax.set_axis_off()
            ax.set_position([0, 0, 1, 1])
            plt.tight_layout(pad=0)

        output_path = self._get_overlay_path(age_ma, var_name)
        fig.savefig(
            output_path,
            bbox_inches="tight",
            pad_inches=0,
            format="png",
            transparent=True,
        )
        plt.close(fig)

        return f"overlays/{output_path.name}"

    def get_data_range(self, data: np.ndarray) -> tuple[float, float]:
        valid = data[~np.isnan(data)]
        vmin = float(np.percentile(valid, 2))
        vmax = float(np.percentile(valid, 98))
        return vmin, vmax
