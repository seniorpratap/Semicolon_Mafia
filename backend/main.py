"""
SimulCrisis — FastAPI Backend
==============================
Handles AI agent responses via Gemini API.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = FastAPI(title="SimulCrisis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Configure Gemini ─────────────────────────────────────
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)


class AgentRequest(BaseModel):
    agent_id: str
    system_prompt: str
    prompt: str


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""


# ─── Health Check ─────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "🚨 SimulCrisis API running", "ai_ready": bool(API_KEY)}


@app.get("/api/health")
def health():
    return {"status": "alive", "ai_configured": bool(API_KEY)}


# ─── Agent Response Endpoint ──────────────────────────────
@app.post("/api/agent-respond")
async def agent_respond(req: AgentRequest):
    """Get a response from a specific AI agent."""
    if not API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    try:
        model = genai.GenerativeModel(
            "gemini-2.0-flash",
            system_instruction=req.system_prompt
        )

        response = model.generate_content(req.prompt)
        return {"response": response.text, "agent_id": req.agent_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")


# ─── Free Chat (for user to talk to coordinator) ──────────
@app.post("/api/chat")
async def chat(req: ChatRequest):
    """General chat endpoint for user queries."""
    if not API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    try:
        system = """You are the Crisis Coordinator AI for SimulCrisis. 
        You help users understand the crisis simulation, explain decisions, 
        and answer questions about the agents' reasoning. Be concise and helpful."""

        model = genai.GenerativeModel(
            "gemini-2.0-flash",
            system_instruction=system
        )

        prompt = req.message
        if req.context:
            prompt = f"Context: {req.context}\n\nUser question: {req.message}"

        response = model.generate_content(prompt)
        return {"response": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
