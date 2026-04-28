"""
AI Helper — Gemini API Wrapper
===============================
Provides easy-to-use functions for:
  - Text analysis / prompting
  - Image analysis (from file path or bytes)
  - Multi-turn chat
  
Set GEMINI_API_KEY in your .env file.
"""

import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

# ─── Configure ────────────────────────────────────────────
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

# Use gemini-2.0-flash for speed (best for hackathons)
MODEL_NAME = "gemini-2.0-flash"


def _get_model():
    """Get configured Gemini model."""
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY not set in environment. Add it to .env file.")
    return genai.GenerativeModel(MODEL_NAME)


# ─── Text Analysis ────────────────────────────────────────
def ask_ai(prompt: str, system: str = "") -> str:
    """
    Send a text prompt to Gemini and get a response.
    
    Args:
        prompt: The main question or text to analyze
        system: Optional system instruction for context
    
    Returns:
        AI response as string
    """
    model = _get_model()
    
    if system:
        model = genai.GenerativeModel(MODEL_NAME, system_instruction=system)
    
    response = model.generate_content(prompt)
    return response.text


# ─── Image Analysis (from file path) ─────────────────────
def analyze_image(image_path: str, prompt: str = "Analyze this image in detail.") -> str:
    """
    Analyze an image file using Gemini's vision capabilities.
    
    Args:
        image_path: Path to the image file
        prompt: What to analyze about the image
    
    Returns:
        AI analysis as string
    """
    import PIL.Image
    
    model = _get_model()
    img = PIL.Image.open(image_path)
    response = model.generate_content([prompt, img])
    return response.text


# ─── Image Analysis (from bytes) ─────────────────────────
def analyze_image_bytes(image_bytes: bytes, mime_type: str, prompt: str = "Analyze this image in detail.") -> str:
    """
    Analyze image bytes (from file upload) using Gemini's vision.
    
    Args:
        image_bytes: Raw image bytes
        mime_type: MIME type (e.g., 'image/jpeg')
        prompt: What to analyze about the image
    
    Returns:
        AI analysis as string
    """
    model = _get_model()
    
    image_part = {
        "mime_type": mime_type,
        "data": image_bytes
    }
    
    response = model.generate_content([prompt, image_part])
    return response.text


# ─── Multi-Turn Chat ─────────────────────────────────────
def chat_with_ai(message: str, history: list = None) -> str:
    """
    Chat with AI, maintaining conversation history.
    
    Args:
        message: Current user message
        history: List of previous messages [{"role": "user"/"model", "parts": ["text"]}]
    
    Returns:
        AI response as string
    """
    model = _get_model()
    
    chat_history = []
    if history:
        for msg in history:
            chat_history.append({
                "role": msg.get("role", "user"),
                "parts": [msg.get("content", msg.get("parts", [""])[0])]
            })
    
    chat = model.start_chat(history=chat_history)
    response = chat.send_message(message)
    return response.text


# ─── Structured Output (JSON mode) ───────────────────────
def ask_ai_json(prompt: str, system: str = "") -> dict:
    """
    Get structured JSON output from Gemini.
    
    Args:
        prompt: The prompt (include instruction to respond in JSON)
        system: Optional system instruction
    
    Returns:
        Parsed JSON dict
    """
    import json
    
    json_prompt = f"{prompt}\n\nRespond ONLY with valid JSON, no markdown formatting."
    result = ask_ai(json_prompt, system=system)
    
    # Clean up response (remove markdown code blocks if present)
    result = result.strip()
    if result.startswith("```"):
        result = result.split("\n", 1)[1]  # remove first line
        result = result.rsplit("```", 1)[0]  # remove last ```
    
    return json.loads(result)


# ─── Quick Test ───────────────────────────────────────────
if __name__ == "__main__":
    print("Testing Gemini connection...")
    try:
        response = ask_ai("Say 'Hello Hackathon!' in a creative way. Keep it under 20 words.")
        print(f"✅ Gemini is working: {response}")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Make sure GEMINI_API_KEY is set in your .env file")
