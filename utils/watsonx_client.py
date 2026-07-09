from __future__ import annotations

import logging
import os
from typing import List

logger = logging.getLogger(__name__)

_model = None


def _get_model():
    global _model
    if _model is not None:
        return _model

    try:
        from ibm_watsonx_ai import Credentials

        try:
            from ibm_watsonx_ai.foundation_models import ModelInference
        except ImportError:
            from ibm_watsonx_ai.foundation_models.inference import ModelInference

        try:
            from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
        except ImportError:
            from ibm_watsonx_ai.foundation_models.schema import TextGenParameters as GenParams

        api_key    = os.getenv("IBM_CLOUD_API_KEY", "").strip()
        project_id = os.getenv("WATSONX_PROJECT_ID", "").strip()
        url        = os.getenv("WATSONX_URL", "https://au-syd.ml.cloud.ibm.com").strip()
        
        supported_models = [
            "ibm/granite-8b-code-instruct",
            "meta-llama/llama-3-3-70b-instruct",
        ]

        preferred_model = os.getenv("GRANITE_MODEL_ID", "ibm/granite-8b-code-instruct").strip()
        model_id = preferred_model if preferred_model in supported_models else supported_models[0]

        if not api_key or not project_id:
            raise ValueError(
                "IBM_CLOUD_API_KEY and WATSONX_PROJECT_ID must be set in .env"
            )

        credentials = Credentials(url=url, api_key=api_key)

        params = {
            GenParams.MAX_NEW_TOKENS:     int(os.getenv("MAX_NEW_TOKENS", 1024)),
            GenParams.MIN_NEW_TOKENS:     1,
            GenParams.TEMPERATURE:        0.0,
            GenParams.TOP_P:              0.9,
            GenParams.TOP_K:              50,
            GenParams.REPETITION_PENALTY: 1.1,
            GenParams.STOP_SEQUENCES:     ["<|end|>", "<|endoftext|>", "<|user|>", "<|assistant|>", "<|system|>"],
        }

        _model = ModelInference(
            model_id=model_id,
            credentials=credentials,
            project_id=project_id,
            params=params,
        )
        logger.info("watsonx.ai model initialised: %s @ %s", model_id, url)
        return _model

    except Exception as exc:
        logger.exception("Failed to initialise watsonx model: %s", exc)
        raise


def _build_prompt(query: str, context_chunks: List[str], chat_history: List[dict]) -> str:
    from agent_config import AGENT_INSTRUCTIONS

    system_prompt = AGENT_INSTRUCTIONS.strip()

    if context_chunks:
        context_text = "\n\n---\n\n".join(
            f"[Source chunk {i+1}]\n{chunk.strip()}"
            for i, chunk in enumerate(context_chunks)
        )
        context_block = (
            "\n\n### RETRIEVED KNOWLEDGE BASE CONTEXT\n"
            "(Use ONLY the following excerpts to answer the question)\n\n"
            f"{context_text}\n"
        )
    else:
        context_block = (
            "\n\n### RETRIEVED KNOWLEDGE BASE CONTEXT\n"
            "No relevant context was found in the knowledge base for this query.\n"
        )

    history_block = ""
    if chat_history:
        for turn in chat_history[-4:]:
            role    = turn.get("role", "user")
            content = turn.get("content", "").strip()
            if role == "user":
                history_block += f"<|user|>\n{content}\n"
            else:
                history_block += f"<|assistant|>\n{content}\n"

    prompt = (
        f"<|system|>\n{system_prompt}{context_block}\n"
        f"{history_block}"
        f"<|user|>\n{query}\n"
        f"<|assistant|>\n"
    )
    return prompt


def generate_answer(
    query: str,
    context_chunks: List[str],
    chat_history: List[dict] | None = None,
) -> str:
    if chat_history is None:
        chat_history = []

    prompt = _build_prompt(query, context_chunks, chat_history)

    logger.info("=" * 80)
    logger.info("PROMPT SENT TO GRANITE")
    logger.info(prompt[:4000])
    logger.info("=" * 80)

    logger.debug("Prompt length: %d chars", len(prompt))
    try:
        model  = _get_model()
        result = model.generate_text(prompt=prompt)
        answer = result.strip() if isinstance(result, str) else str(result)

        if not answer:
            answer = (
                "I could not generate an answer based on the available knowledge base. "
                "Please rephrase your question or ensure the NBA General Manual PDF "
                "has been loaded correctly."
            )
        return answer

    except Exception as exc:
        logger.exception("Text generation failed: %s", exc)
        return (
            f"An error occurred while contacting the watsonx.ai service: {exc}\n\n"
            "Please verify your IBM_CLOUD_API_KEY, WATSONX_PROJECT_ID, and WATSONX_URL "
            "in your .env file."
        )


def get_model_info() -> dict:
    return {
        "model_id":            os.getenv("GRANITE_MODEL_ID", "ibm/granite-8b-code-instruct"),
        "url":                 os.getenv("WATSONX_URL", "https://au-syd.ml.cloud.ibm.com"),
        "project_configured":  bool(os.getenv("WATSONX_PROJECT_ID", "").strip()),
        "api_key_configured":  bool(os.getenv("IBM_CLOUD_API_KEY", "").strip()),
    }
