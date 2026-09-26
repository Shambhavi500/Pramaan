"""Run once while online. Afterwards every device runs with the network off.

    python scripts/download_models.py            # FastEmbed + Laya
    python scripts/download_models.py --no-laya  # embeddings only (tests, heuristic decider)
"""
import os
import sys
from pathlib import Path

os.environ["SMRITI_OFFLINE"] = "0"
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from device import config  # noqa: E402


def main():
    from fastembed import TextEmbedding

    print(f"FastEmbed {config.DENSE_MODEL} -> {config.MODELS_DIR}")
    list(TextEmbedding(config.DENSE_MODEL, cache_dir=str(config.MODELS_DIR)).embed(["warmup"]))

    if "--no-laya" not in sys.argv:
        from laya import Router

        print("Laya convaiinnovations/laya -> HF cache (first run takes several minutes on CPU)")
        Router(device="cpu").predict("warmup", {"q": {"type": "noul", "instructions": "Is this a test?"}})

    print("Done. Qdrant Edge BM25 is built in and needs no download.")
    print("Ollama (Sun): run `ollama pull qwen2.5:1.5b` separately.")


if __name__ == "__main__":
    main()
