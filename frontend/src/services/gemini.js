/**
 * SimulCrisis — Gemini AI Service
 * =================================
 * Direct client-side integration with Google's Gemini API.
 * Eliminates the need for a separate backend server during demo.
 *
 * Usage:
 *   Set VITE_GEMINI_API_KEY in frontend/.env
 *   Falls back to mock responses if key is missing or API fails.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Initialize Client ──────────────────────────────────
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
let genAI = null;
let model = null;

if (API_KEY && API_KEY !== 'your_key_here') {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
  } catch (err) {
    console.warn('[Gemini] Failed to initialize:', err.message);
  }
}

/**
 * Check if Gemini is properly configured and ready.
 */
export function isGeminiReady() {
  return model !== null;
}

/**
 * Generate a response from a specific agent using Gemini.
 *
 * @param {string} systemPrompt - The agent's system instruction (persona)
 * @param {string} userPrompt - The situation report + context
 * @returns {Promise<string>} The agent's response text
 * @throws {Error} If API call fails
 */
export async function generateAgentResponse(systemPrompt, userPrompt) {
  if (!model) {
    throw new Error('Gemini not configured');
  }

  // Create a model instance with the agent's system prompt
  const agentModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  });

  const result = await agentModel.generateContent(userPrompt);
  const response = result.response;
  return response.text();
}

/**
 * Generate a streaming response for real-time typewriter effect.
 *
 * @param {string} systemPrompt - The agent's system instruction
 * @param {string} userPrompt - The situation + context
 * @param {function} onChunk - Callback receiving (accumulatedText) on each chunk
 * @returns {Promise<string>} The full response text
 */
export async function generateAgentResponseStreaming(systemPrompt, userPrompt, onChunk) {
  if (!model) {
    throw new Error('Gemini not configured');
  }

  const agentModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  });

  const result = await agentModel.generateContentStream(userPrompt);

  let accumulated = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    accumulated += text;
    if (onChunk) onChunk(accumulated);
  }

  return accumulated;
}
