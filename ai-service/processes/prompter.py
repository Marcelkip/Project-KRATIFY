import os
import requests

VLLM_URL = os.getenv(
    "VLLM_API_URL",
    "http://127.0.0.1:8000/v1/chat/completions"
)

MODEL_NAME = os.getenv("VLLM_MODEL", "Qwen3-0.6B")


def call_llama(prompt: str) -> str:
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 1024,
        "stream": False,
    }

    try:
        response = requests.post(
            VLLM_URL,
            json=payload,
            timeout=180
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

    except requests.RequestException as error:
        print(f"vLLM connection error: {error}")
        raise
