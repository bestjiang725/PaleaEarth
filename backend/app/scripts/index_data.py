"""Data indexing script: scan NC files → populate SQLite metadata tables.

Usage: python -m app.scripts.index_data

Scans the data/ directory for NetCDF climate files, extracts metadata,
and populates time_mapping and variable_meta tables.
"""

import sys
from pathlib import Path

# Ensure backend package is importable
BACKEND_DIR = Path(__file__).parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
from app.core.database import init_sync_db, sync_session_factory
from app.models.time_mapping import TimeMapping
from app.models.variable_meta import VariableMeta
from app.utils.file_utils import get_available_nc_files


# ─── Geologic Period Boundaries ──────────────────────────────────────────
# Maps age_ma → (period_name, era_name, epoch_name)
# ICS 2023 timescale for Paleozoic

PERIOD_EPOCHS = [
    # (period, era, [(epoch_name, age_boundary_older_end), ...])
    # Boundaries are the OLDER end of each epoch (higher Ma = older)
    ("Silurian", "Paleozoic", [
        ("Pridoli", 423.0),
        ("Ludlow", 427.4),
        ("Wenlock", 433.4),
        ("Llandovery", 443.8),
    ]),
    ("Ordovician", "Paleozoic", [
        ("Late Ordovician", 458.4),
        ("Middle Ordovician", 470.0),
        ("Early Ordovician", 485.4),
    ]),
    ("Cambrian", "Paleozoic", [
        ("Furongian", 497.0),
        ("Miaolingian / Series 3", 509.0),
        ("Series 2", 521.0),
        ("Terreneuvian", 538.8),
    ]),
]


def find_geologic_period(age_ma: float) -> tuple[str, str, str]:
    """Map a geological age to (period_name, era_name, epoch_name).

    Args:
        age_ma: Age in millions of years before present.

    Returns:
        Tuple of (period, era, epoch).
    """
    for period, era, epochs in PERIOD_EPOCHS:
        for epoch_name, epoch_boundary in epochs:
            if age_ma <= epoch_boundary:
                return period, era, epoch_name
    # Older than Cambrian
    return "Precambrian", "Precambrian", "Unknown"


# ─── Variable Metadata Seed Data ────────────────────────────────────────
# Static catalog of all climate variables with display metadata

VARIABLE_SEED = [
    # Temperature
    {"var_name": "temp_mm_srf", "category": "temperature", "display_name_zh": "地表温度", "units": "K", "colormap": "RdYlBu_r", "range": [230, 320], "ndim": 2},
    {"var_name": "temp_mm_1_5m", "category": "temperature", "display_name_zh": "近地面气温(1.5m)", "units": "K", "colormap": "RdYlBu_r", "range": [230, 315], "ndim": 2},
    {"var_name": "Tw_mm_hyb", "category": "temperature", "display_name_zh": "湿球温度", "units": "K", "colormap": "RdYlBu_r", "range": [230, 310], "ndim": 3},
    {"var_name": "dewT_mm_1_5m", "category": "temperature", "display_name_zh": "露点温度(1.5m)", "units": "K", "colormap": "RdYlBu_r", "range": [220, 310], "ndim": 2},
    {"var_name": "soiltemp_mm_soil", "category": "temperature", "display_name_zh": "深层土壤温度", "units": "K", "colormap": "RdYlBu_r", "range": [230, 320], "ndim": 3},

    # Precipitation
    {"var_name": "precip_mm_srf", "category": "precipitation", "display_name_zh": "总降水率", "units": "kg/m²/s", "colormap": "Blues", "range": [0, 0.0001], "ndim": 2},

    # Wind
    {"var_name": "u_mm_10m", "category": "wind", "display_name_zh": "10m纬向风", "units": "m/s", "colormap": "RdBu_r", "range": [-20, 20], "ndim": 2},
    {"var_name": "v_mm_10m", "category": "wind", "display_name_zh": "10m经向风", "units": "m/s", "colormap": "RdBu_r", "range": [-20, 20], "ndim": 2},

    # Pressure
    {"var_name": "p_mm_msl", "category": "pressure", "display_name_zh": "海平面气压", "units": "Pa", "colormap": "RdYlBu_r", "range": [97000, 103000], "ndim": 2},
    {"var_name": "p_mm_srf", "category": "pressure", "display_name_zh": "地表气压", "units": "Pa", "colormap": "RdYlBu_r", "range": [95000, 105000], "ndim": 2},

    # Cloud
    {"var_name": "totCloud_mm_ua", "category": "cloud", "display_name_zh": "总云量", "units": "fraction", "colormap": "Greys", "range": [0, 1], "ndim": 2},
    {"var_name": "atmosCorr_mm_ua", "category": "cloud", "display_name_zh": "大气能量校正", "units": "W/m²", "colormap": "RdBu_r", "range": [-100, 100], "ndim": 2},

    # Soil
    {"var_name": "sm_mm_soil", "category": "soil", "display_name_zh": "土壤湿度", "units": "kg/m²", "colormap": "YlGnBu", "range": [0, 100], "ndim": 3},

    # Evaporation
    {"var_name": "transpiration_mm_srf", "category": "evaporation", "display_name_zh": "植被蒸腾", "units": "kg/m²/s", "colormap": "Greens", "range": [0, 0.00005], "ndim": 2},
    {"var_name": "soilEvap_mm_srf", "category": "evaporation", "display_name_zh": "土壤蒸发", "units": "kg/m²/s", "colormap": "Greens", "range": [0, 0.00005], "ndim": 2},
    {"var_name": "canopyEvap_mm_can", "category": "evaporation", "display_name_zh": "冠层蒸发", "units": "kg/m²/s", "colormap": "Greens", "range": [0, 0.00002], "ndim": 2},
    {"var_name": "evapsea_mm_srf", "category": "evaporation", "display_name_zh": "海面蒸发", "units": "kg/m²/s", "colormap": "Greens", "range": [0, 0.0001], "ndim": 2},

    # Radiation
    {"var_name": "solar_mm_s3_srf", "category": "radiation", "display_name_zh": "地表净短波辐射", "units": "W/m²", "colormap": "YlOrRd", "range": [0, 350], "ndim": 2},
    {"var_name": "longwave_mm_s3_srf", "category": "radiation", "display_name_zh": "地表净长波辐射", "units": "W/m²", "colormap": "RdBu_r", "range": [-100, 100], "ndim": 2},
    {"var_name": "downSol_mm_TOA", "category": "radiation", "display_name_zh": "大气顶入射短波", "units": "W/m²", "colormap": "YlOrRd", "range": [0, 500], "ndim": 2},
    {"var_name": "upSol_mm_s3_TOA", "category": "radiation", "display_name_zh": "大气顶出射短波", "units": "W/m²", "colormap": "YlOrRd", "range": [0, 400], "ndim": 2},
    {"var_name": "olr_mm_s3_TOA", "category": "radiation", "display_name_zh": "大气顶出射长波", "units": "W/m²", "colormap": "RdBu_r", "range": [100, 350], "ndim": 2},
    {"var_name": "ilr_mm_s3_srf", "category": "radiation", "display_name_zh": "地表向下长波辐射", "units": "W/m²", "colormap": "YlOrRd", "range": [100, 500], "ndim": 2},
    {"var_name": "downSol_Seaice_mm_s3_srf", "category": "radiation", "display_name_zh": "海冰表面向下短波", "units": "W/m²", "colormap": "YlOrRd", "range": [0, 400], "ndim": 2},

    # Flux
    {"var_name": "sh_mm_hyb", "category": "flux", "display_name_zh": "感热通量", "units": "W/m²", "colormap": "RdBu_r", "range": [-100, 200], "ndim": 3},
    {"var_name": "lh_mm_srf", "category": "flux", "display_name_zh": "潜热通量", "units": "W/m²", "colormap": "RdBu_r", "range": [-200, 200], "ndim": 2},
    {"var_name": "wme_mm_srf", "category": "flux", "display_name_zh": "风搅拌能量通量", "units": "W/m²", "colormap": "YlOrRd", "range": [0, 5], "ndim": 2},
    {"var_name": "snowmeltHflx_mm_srf", "category": "flux", "display_name_zh": "融雪热通量", "units": "W/m²", "colormap": "YlOrRd", "range": [0, 200], "ndim": 2},
    {"var_name": "srfSublim_mm_srf", "category": "flux", "display_name_zh": "地表升华率", "units": "kg/m²/s", "colormap": "Blues", "range": [0, 0.00002], "ndim": 2},

    # Ice
    {"var_name": "iceconc_mm_srf", "category": "ice", "display_name_zh": "海冰覆盖率", "units": "fraction", "colormap": "Blues", "range": [0, 1], "ndim": 2},
    {"var_name": "icedepth_mm_srf", "category": "ice", "display_name_zh": "海冰厚度", "units": "m", "colormap": "Blues", "range": [0, 10], "ndim": 2},

    # Snow
    {"var_name": "snowdepth_mm_srf", "category": "snow", "display_name_zh": "积雪深度", "units": "m", "colormap": "Blues", "range": [0, 5], "ndim": 2},

    # Runoff
    {"var_name": "srfRunoff_mm_srf", "category": "runoff", "display_name_zh": "地表径流", "units": "kg/m²/s", "colormap": "Blues", "range": [0, 0.00005], "ndim": 2},
    {"var_name": "subsrfRunoff_mm_srf", "category": "runoff", "display_name_zh": "地下径流", "units": "kg/m²/s", "colormap": "Blues", "range": [0, 0.00005], "ndim": 2},

    # Humidity
    {"var_name": "q_mm_1_5m", "category": "humidity", "display_name_zh": "比湿(1.5m)", "units": "kg/kg", "colormap": "YlGnBu", "range": [0, 0.03], "ndim": 2},
    {"var_name": "rh_mm_1_5m", "category": "humidity", "display_name_zh": "相对湿度(1.5m)", "units": "%", "colormap": "YlGnBu", "range": [0, 100], "ndim": 2},

    # Wind stress
    {"var_name": "taux_mm_hyb", "category": "wind_stress", "display_name_zh": "纬向风应力", "units": "N/m²", "colormap": "RdBu_r", "range": [-0.5, 0.5], "ndim": 3},
    {"var_name": "tauy_mm_hyb", "category": "wind_stress", "display_name_zh": "经向风应力", "units": "N/m²", "colormap": "RdBu_r", "range": [-0.5, 0.5], "ndim": 3},
]


def index_data():
    """Main indexing function: scan NC files and populate database."""
    print("=" * 60)
    print("PaleoEarth Data Indexing")
    print("=" * 60)

    # Initialize database tables
    print("\n[1/4] Initializing database tables...")
    init_sync_db()
    print("  Tables created successfully.")

    # Discover NC files
    print(f"\n[2/4] Scanning NC files in: {settings.DATA_DIR}")
    nc_files = get_available_nc_files(settings.DATA_DIR)
    print(f"  Found {len(nc_files)} temperature data files:")
    for f in nc_files:
        period, era, epoch = find_geologic_period(f["age_ma"])
        print(f"    {f['age_ma']:.0f} Ma — {era} / {period} / {epoch} — {f['file_group_id']}")

    # Populate time_mapping
    print("\n[3/4] Populating time_mapping table...")
    with sync_session_factory() as session:
        inserted = 0
        for f in nc_files:
            existing = session.query(TimeMapping).filter_by(
                geologic_age_ma=f["age_ma"]
            ).first()
            if existing:
                # Update file path if changed
                if existing.file_path != f["file_path"]:
                    existing.file_path = f["file_path"]
                    existing.file_group_id = f["file_group_id"]
                    session.add(existing)
                    inserted += 1
                    print(f"  Updated: {f['age_ma']:.0f} Ma")
            else:
                period, era, epoch = find_geologic_period(f["age_ma"])
                tm = TimeMapping(
                    geologic_age_ma=f["age_ma"],
                    period_name=period,
                    era_name=era,
                    epoch_name=epoch,
                    file_path=f["file_path"],
                    file_group_id=f["file_group_id"],
                    grid_longitude=96,
                    grid_latitude=73,
                    resolution="3.75° x 2.5°",
                )
                session.add(tm)
                inserted += 1
                print(f"  Inserted: {f['age_ma']:.0f} Ma → {period}")
        session.commit()
    print(f"  Total time mappings: {inserted}")

    # Populate variable_meta
    print("\n[4/4] Populating variable_meta table...")
    with sync_session_factory() as session:
        inserted = 0
        for v in VARIABLE_SEED:
            existing = session.query(VariableMeta).filter_by(
                var_name=v["var_name"]
            ).first()
            if existing:
                # Update metadata
                existing.var_category = v["category"]
                existing.display_name_zh = v["display_name_zh"]
                existing.units = v["units"]
                existing.colormap = v["colormap"]
                existing.value_range_min = v["range"][0]
                existing.value_range_max = v["range"][1]
                existing.ndim = v["ndim"]
                session.add(existing)
            else:
                vm = VariableMeta(
                    var_name=v["var_name"],
                    var_category=v["category"],
                    display_name_zh=v["display_name_zh"],
                    units=v["units"],
                    colormap=v["colormap"],
                    value_range_min=v["range"][0],
                    value_range_max=v["range"][1],
                    ndim=v["ndim"],
                )
                session.add(vm)
            inserted += 1
        session.commit()
    print(f"  Total variable metadata entries: {inserted}")

    print("\n" + "=" * 60)
    print("Indexing complete!")
    print(f"  {len(nc_files)} geological ages indexed")
    print(f"  {len(VARIABLE_SEED)} climate variables registered")
    print("=" * 60)


if __name__ == "__main__":
    index_data()
