"""
OpenAI Responses API service.
Uses previous_response_id for thread chaining.
Wrapped with @traceable for LangSmith observability.

NOTE: Module 2 will replace this file entirely with completions_service.py
(Chat Completions API). The function signature is preserved for a clean swap.
"""
from typing import Generator, Optional
from openai import OpenAI
from langsmith import traceable
from app.config import settings

client = OpenAI(api_key=settings.openai_api_key)


@traceable(name="chat_with_responses_api", run_type="llm")
def stream_chat_response(
    user_message: str,
    previous_response_id: Optional[str],
    vector_store_id: str,
) -> Generator:
    """
    Streams a response using the OpenAI Responses API.

    Yields:
        ("delta", content_str) — incremental text chunks
        ("done", response_id_str) — final response ID for thread chaining
        ("error", error_msg_str) — on failure
    """
    params: dict = {
        "model": "gpt-4o",
        "input": user_message,
        "stream": True,
    }

    # Only attach file_search if a vector store is configured
    if vector_store_id:
        params["tools"] = [
            {
                "type": "file_search",
                "vector_store_ids": [vector_store_id],
            }
        ]

    # Chain to the previous response for thread continuity
    if previous_response_id:
        params["previous_response_id"] = previous_response_id

    try:
        response = client.responses.create(**params)
        response_id: Optional[str] = None

        for event in response:
            event_type = event.type

            if event_type == "response.output_text.delta":
                yield ("delta", event.delta)
            elif event_type == "response.completed":
                response_id = event.response.id

        if response_id:
            yield ("done", response_id)
        else:
            yield ("error", "Response completed without a response ID")

    except Exception as e:
        yield ("error", str(e))
