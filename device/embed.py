"""On-device embeddings: FastEmbed dense (bge-small, ONNX/CPU) + Qdrant Edge native BM25."""
from functools import lru_cache

from qdrant_edge import Bm25, SparseVector

from device import config


@lru_cache(maxsize=1)
def _dense_model():
    from fastembed import TextEmbedding

    return TextEmbedding(config.DENSE_MODEL, cache_dir=str(config.MODELS_DIR))


@lru_cache(maxsize=1)
def _bm25() -> Bm25:
    return Bm25()


def dense(text: str) -> list[float]:
    return next(iter(_dense_model().embed([text]))).tolist()


def dense_query(text: str) -> list[float]:
    # bge models expect a query prefix for asymmetric retrieval.
    return next(iter(_dense_model().query_embed([text]))).tolist()


def sparse_doc(text: str) -> SparseVector:
    return _bm25().embed_document(text)


def sparse_query(text: str) -> SparseVector:
    return _bm25().embed_query(text)
