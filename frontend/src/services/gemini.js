/**
 * SimulCrisis — Gemini AI Service (New SDK)
 * ==========================================
 * Uses @google/genai (current SDK, replaces deprecated @google/generative-ai)
 * Model: gemini-2.5-pro (top-tier flagship — 1M context, thinking, complex reasoning)
 */

import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
let ai = null;

if (API_KEY && API_KEY !== 'your_key_here') {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
    console.log('[Gemini] Initialized with @google/genai SDK');
  } catch (err) {
    console.warn('[Gemini] Failed to initialize:', err.message);
  }
}

export function isGeminiReady() {
  return ai !== null;
}

/**
 * Generate a streaming response for real-time typewriter effect.
 */
export async function generateAgentResponseStreaming(systemPrompt, userPrompt, onChunk) {
  if (!ai) throw new Error('Gemini not configured');

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.5-pro',
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  });

  let accumulated = '';
  for await (const chunk of response) {
    const text = chunk.text || '';
    if (text) {
      accumulated += text;
      if (onChunk) onChunk(accumulated);
    }
  }

  return accumulated;
}

/**
 * Non-streaming generate (used for quick calls).
 */
export async function generateAgentResponse(systemPrompt, userPrompt) {
  if (!ai) throw new Error('Gemini not configured');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  });

  return response.text;
}
