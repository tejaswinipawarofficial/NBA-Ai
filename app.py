from __future__ import annotations

import logging
import os
import sys
import threading
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

load_dotenv()

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from agent_config import NBA_CRITERIA, PROGRAMME_OUTCOMES, CO_PO_LEVELS
from utils.rag_pipeline import initialize_rag, retrieve, get_status as rag_status
from utils.watsonx_client import generate_answer, get_model_info

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "nba-secret-change-in-prod")
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

PDF_FILENAME = os.getenv("NBA_PDF_FILENAME", "NBA_PDF_FILENAME.pdf")
PDF_PATH     = BASE_DIR / "knowledge_base" / PDF_FILENAME

history_lock = threading.Lock()
_chat_history: list[dict] = []


def _init_rag():
    if PDF_PATH.exists():
        logger.info("Initialising RAG pipeline from: %s", PDF_PATH)
        success = initialize_rag(str(PDF_PATH))
        if success:
            logger.info("RAG pipeline ready")
        else:
            logger.warning("RAG pipeline init failed – chat will work without context")
    else:
        logger.warning(
            "NBA PDF not found at %s – place the NBA General Manual PDF in knowledge_base/ and restart.",
            PDF_PATH,
        )


@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data        = request.get_json(silent=True) or {}
    user_msg    = (data.get("message") or "").strip()
    if not user_msg:
        return jsonify({"error": "message field is required"}), 400

    top_k  = int(os.getenv("RAG_TOP_K", 5))
    chunks = retrieve(user_msg, top_k=top_k)
    
    with history_lock:
        active_history = list(_chat_history[-8:])

    answer = generate_answer(
        query=user_msg,
        context_chunks=chunks,
        chat_history=active_history,
    )

    with history_lock:
        _chat_history.append({"role": "user",      "content": user_msg})
        _chat_history.append({"role": "assistant", "content": answer})
        if len(_chat_history) > 40:
            del _chat_history[:10]

    return jsonify({
        "answer":      answer,
        "chunks_used": len(chunks),
        "sources":     [c[:200] + "…" for c in chunks],
    })


@app.route("/api/copomapping", methods=["POST"])
def copomapping():
    data        = request.get_json(silent=True) or {}
    course_name = (data.get("course_name") or "").strip()
    cos         = data.get("course_outcomes") or []
    num_psos    = int(data.get("num_psos", 2))

    if not course_name or not cos:
        return jsonify({"error": "course_name and course_outcomes are required"}), 400

    cos_text = "\n".join(f"- {co}" for co in cos)
    pos_text = "\n".join(f"- {po}: {desc}" for po, desc in PROGRAMME_OUTCOMES.items())

    query = (
        f"For the course '{course_name}' with Course Outcomes:\n{cos_text}\n\n"
        f"And Programme Outcomes:\n{pos_text}\n\n"
        f"Generate a CO-PO mapping matrix. For each CO-PO pair, assign a "
        f"correlation level: 0 (none), 1 (low), 2 (medium), 3 (high). "
        f"Then suggest CQI actions for any PO with average attainment below 2."
    )

    chunks = retrieve(query, top_k=6)
    answer = generate_answer(query=query, context_chunks=chunks, chat_history=[])

    return jsonify({
        "course_name":     course_name,
        "cos":             cos,
        "pos":             list(PROGRAMME_OUTCOMES.keys()),
        "po_descriptions": PROGRAMME_OUTCOMES,
        "analysis":        answer,
        "co_po_levels":    CO_PO_LEVELS,
    })


@app.route("/api/status")
def status():
    return jsonify({
        "rag":          rag_status(),
        "model":        get_model_info(),
        "pdf_path":     str(PDF_PATH),
        "pdf_exists":   PDF_PATH.exists(),
        "criteria_count": len(NBA_CRITERIA),
    })


@app.route("/api/criteria")
def criteria():
    return jsonify(NBA_CRITERIA)


@app.route("/api/rebuild-index", methods=["POST"])
def rebuild_index():
    if not PDF_PATH.exists():
        return jsonify({"error": f"PDF not found at {PDF_PATH}"}), 404
    success = initialize_rag(str(PDF_PATH), force_rebuild=True)
    return jsonify({"success": success, "rag": rag_status()})


@app.route("/api/clear-history", methods=["POST"])
def clear_history():
    with history_lock:
        _chat_history.clear()
    return jsonify({"cleared": True})


logger.info("Launching global asynchronous RAG pipeline initialization thread...")
threading.Thread(target=_init_rag, daemon=True).start()

if __name__ == "__main__":
    port  = int(os.getenv("PORT", 8080))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    logger.info("Starting local development server on port %d", port)
    app.run(host="0.0.0.0", port=port, debug=debug)
