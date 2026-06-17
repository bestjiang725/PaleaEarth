"""TileService: generates climate data overlay images using matplotlib+cartopy."""

from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt

from app.core.config import settings


class TileService:
    """Generates equirectangular PNG overlay images for MapLibre image source.

    Renders a 2D climate data array on a global PlateCarree map with coastlines,
    then saves as PNG to the storage directory.
    """

    def __init__(self, storage_dir: str | None = None):
        self.storage_dir = Path(storage_dir or settings.STORAGE_DIR) / "overlays"
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def _get_overlay_path(self, age_ma: float, var_name: str) -> Path:
        """Get the file path for a cached overlay image."""
        return self.storage_dir / f"{age_ma:.0f}_{var_name}.png"

    def is_cached(self, age_ma: float, var_name: str) -> bool:
        """Check if an overlay already exists in cache."""
        return self._get_overlay_path(age_ma, var_name).exists()

    def get_cached_path(self, age_ma: float, var_name: str) -> str | None:
        """Get relative path to cached overlay if it exists."""
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
        """Generate a climate overlay PNG image.

        Args:
            data: 2D numpy array (lat, lon).
            lons: 1D longitude array.
            lats: 1D latitude array.
            age_ma: Geological age for the filename.
            var_name: Variable name for the filename.
            colormap: Matplotlib colormap name.
            vmin, vmax: Data value range (auto-computed if None).

        Returns:
            Relative path to the generated PNG file (overlays/{name}.png).
        """
        # Auto-compute value range, excluding extreme outliers
        valid_data = data[~np.isnan(data)]
        if vmin is None:
            vmin = float(np.percentile(valid_data, 2))
        if vmax is None:
            vmax = float(np.percentile(valid_data, 98))

        fig_width = settings.OVERLAY_WIDTH / settings.OVERLAY_DPI
        fig_height = settings.OVERLAY_HEIGHT / settings.OVERLAY_DPI

        try:
            import cartopy.crs as ccrs
            import cartopy.feature as cfeature

            fig, ax = plt.subplots(
                figsize=(fig_width, fig_height),
                dpi=settings.OVERLAY_DPI,
                subplot_kw={"projection": ccrs.PlateCarree()},
            )

            # Plot the data as a mesh
            mesh = ax.pcolormesh(
                lons, lats, data,
                cmap=colormap,
                vmin=vmin,
                vmax=vmax,
                transform=ccrs.PlateCarree(),
                shading="auto",
                rasterized=True,
            )

            # Add coastlines for geographic context
            ax.coastlines(resolution="110m", linewidth=0.5, color="black")
            ax.add_feature(cfeature.BORDERS, linewidth=0.3, color="gray", alpha=0.5)

            # Set global extent
            ax.set_global()

            # Remove axes and margins
            ax.set_axis_off()
            ax.set_position([0, 0, 1, 1])

            plt.tight_layout(pad=0)

        except ImportError:
            # Fallback: pure matplotlib rendering without cartopy
            fig, ax = plt.subplots(
                figsize=(fig_width, fig_height),
                dpi=settings.OVERLAY_DPI,
            )

            mesh = ax.pcolormesh(
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

        # Save the figure
        output_path = self._get_overlay_path(age_ma, var_name)
        fig.savefig(
            output_path,
            bbox_inches="tight",
            pad_inches=0,
            format="png",
            facecolor="white",
            edgecolor="none",
        )
        plt.close(fig)

        return f"overlays/{output_path.name}"

    def get_data_range(self, data: np.ndarray) -> tuple[float, float]:
        """Get reasonable display range for a data array."""
        valid = data[~np.isnan(data)]
        vmin = float(np.percentile(valid, 2))
        vmax = float(np.percentile(valid, 98))
        return vmin, vmax
