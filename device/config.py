"""Per-device settings, read from environment variables.

Import this module before fastembed/transformers so the offline flags take effect.
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DEVICE_ID = os.environ.get("SMRITI_DEVICE_ID", "tech-A")
DATA_DIR = Path(os.environ.get("SMRITI_DATA_DIR", ROOT / "data" / DEVICE_ID))
MODELS_DIR = Path(os.environ.get("SMRITI_MODELS_DIR", ROOT / "models"))
GATEWAY_URL = os.environ.get("SMRITI_GATEWAY_URL", "http://localhost:8000")

# "laya" (on-device model) or "heuristic" (keyword rules; fast, used in tests).
DECIDER = os.environ.get("SMRITI_DECIDER", "laya")

DENSE_MODEL = "BAAI/bge-small-en-v1.5"
DENSE_DIM = 384

# Once models are downloaded (scripts/download_models.py), never touch the network.
if os.environ.get("SMRITI_OFFLINE", "1") == "1":
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
