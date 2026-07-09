"""
rag_pipeline.py
───────────────
Retrieval-Augmented Generation pipeline for the NBA Accreditation Assistant.

Responsibilities:
  1. Load & parse the NBA General Manual PDF
  2. Chunk the text into overlapping segments
  3. Generate sentence-transformer embeddings
  4. Build / persist a FAISS vector store
  5. Expose a retrieve() function for query-time retrieval
"""

from __future__ import annotations

import logging
import pickle
from pathlib import Path
from typing import List, Tuple

import numpy as np

logger = logging.getLogger(__name__)

# ─── Lazy imports (avoid startup cost when vector store already exists) ────────
_embedder    = None
_faiss_index = None
_chunks: List[str] = []

VECTOR_STORE_PATH = Path("vector_store/faiss_index.pkl")
EMBEDDER_MODEL = "all-MiniLM-L6-v2"   # fast, 384-dim, MIT licence


# ──────────────────────────────────────────────────────────────────────────────
#  Embedding helper
# ──────────────────────────────────────────────────────────────────────────────

def _get_embedder():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading sentence-transformer model: %s", EMBEDDER_MODEL)
        _embedder = SentenceTransformer(EMBEDDER_MODEL)
    return _embedder


def _embed(texts: List[str]) -> np.ndarray:
    model = _get_embedder()
    return model.encode(texts, show_progress_bar=False, convert_to_numpy=True)


# ──────────────────────────────────────────────────────────────────────────────
#  PDF loading
# ──────────────────────────────────────────────────────────────────────────────

def _load_pdf(pdf_path: str) -> str:
    """Extract all text from a PDF, page by page."""
    try:
        import pdfplumber
        logger.info("Extracting text from PDF: %s", pdf_path)
        full_text = []
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    full_text.append(f"[Page {i + 1}]\n{text}")
        combined = "\n\n".join(full_text)
        logger.info("Extracted %d characters from %d pages", len(combined), len(full_text))
        return combined
    except Exception as exc:
        logger.error("pdfplumber failed (%s), falling back to pypdf", exc)
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            pages.append(f"[Page {i + 1}]\n{text}")
        return "\n\n".join(pages)


# ──────────────────────────────────────────────────────────────────────────────
#  Text chunking
# ──────────────────────────────────────────────────────────────────────────────

def _chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    """
    Split text into overlapping chunks.
    Uses paragraph-aware splitting first, then hard character splitting.
    """
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=["\n\n\n", "\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(text)
    logger.info("Created %d chunks (size=%d, overlap=%d)", len(chunks), chunk_size, overlap)
    return chunks


# ──────────────────────────────────────────────────────────────────────────────
#  FAISS index build / load
# ──────────────────────────────────────────────────────────────────────────────

def _build_index(chunks: List[str]):
    """Build a FAISS flat L2 index from the given text chunks."""
    import faiss

    embeddings = _embed(chunks)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings.astype("float32"))
    logger.info("Built FAISS index: %d vectors, dim=%d", index.ntotal, dim)
    return index


def _save_vector_store(index, chunks: List[str]):
    VECTOR_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    import faiss
    faiss.write_index(index, str(VECTOR_STORE_PATH.with_suffix(".index")))
    with open(VECTOR_STORE_PATH, "wb") as f:
        pickle.dump(chunks, f)
    logger.info("Vector store persisted to %s", VECTOR_STORE_PATH)


def _load_vector_store() -> Tuple[object, List[str]]:
    import faiss
    index = faiss.read_index(str(VECTOR_STORE_PATH.with_suffix(".index")))
    with open(VECTOR_STORE_PATH, "rb") as f:
        chunks = pickle.load(f)
    logger.info("Loaded vector store: %d vectors", index.ntotal)
    return index, chunks


# ──────────────────────────────────────────────────────────────────────────────
#  Public API
# ──────────────────────────────────────────────────────────────────────────────

def initialize_rag(pdf_path: str, force_rebuild: bool = False) -> bool:
    """
    Build (or load) the vector store from the NBA General Manual PDF.

    Args:
        pdf_path:      Absolute or relative path to the PDF file.
        force_rebuild: If True, re-index even if a cached index exists.

    Returns:
        True on success, False on failure.
    """
    global _faiss_index, _chunks

    index_exists = (
        VECTOR_STORE_PATH.exists()
        and VECTOR_STORE_PATH.with_suffix(".index").exists()
    )

    if index_exists and not force_rebuild:
        logger.info("Loading existing vector store (use force_rebuild=True to re-index)")
        try:
            _faiss_index, _chunks = _load_vector_store()
            return True
        except Exception as exc:
            logger.warning("Failed to load cached store (%s), rebuilding…", exc)

    if not Path(pdf_path).exists():
        logger.error("PDF not found at: %s", pdf_path)
        return False

    try:
        raw_text = _load_pdf(pdf_path)
        _chunks = _chunk_text(raw_text)
        _faiss_index = _build_index(_chunks)
        _save_vector_store(_faiss_index, _chunks)
        return True
    except Exception as exc:
        logger.exception("RAG initialization failed: %s", exc)
        return False


def retrieve(query: str, top_k: int = 5) -> List[str]:
    """
    Retrieve the top-k most relevant chunks for a given query.

    Args:
        query: The user's question.
        top_k: Number of chunks to retrieve.

    Returns:
        List of text chunks, most relevant first.
    """
    if _faiss_index is None or not _chunks:
        logger.warning("Vector store not initialized; returning empty context.")
        return []

    try:
        query_vec = _embed([query]).astype("float32")
        distances, indices = _faiss_index.search(query_vec, top_k)

        results = []
        for idx in indices[0]:
            if 0 <= idx < len(_chunks):
                results.append(_chunks[idx])

        logger.info("========== RETRIEVED CHUNKS ==========")
        for i, chunk in enumerate(results):
            logger.info("Chunk %d:\n%s\n", i + 1, chunk[:500])

        logger.debug("Retrieved %d chunks for query: %.60s…", len(results), query)


        return results

        
    except Exception as exc:
        logger.exception("Retrieval failed: %s", exc)
        return []


def get_status() -> dict:
    """Return current RAG pipeline status for health checks."""
    return {
        "initialized": _faiss_index is not None,
        "total_chunks": len(_chunks),
        "index_vectors": int(_faiss_index.ntotal) if _faiss_index else 0,
        "embedder_model": EMBEDDER_MODEL,
    }
