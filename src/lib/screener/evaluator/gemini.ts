// ============================================================
// Gemini 3 API Client Wrapper
// ============================================================

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ScreenerError, ScreenerErrorCode } from '../types';
import { GeminiResponse } from './types';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

export class GeminiClient {
  private model: GenerativeModel;

  constructor(apiKey?: string, modelName: string = 'gemini-2.5-flash') {
    const key = apiKey ?? process.env.GEMINI_API_KEY;
    if (!key) {
      throw new ScreenerError(
        'GEMINI_API_KEY environment variable is not set.',
        ScreenerErrorCode.GEMINI_API_ERROR
      );
    }

    const genAI = new GoogleGenerativeAI(key);
    this.model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,   // low temperature for consistent scoring
      },
    });
  }

  /**
   * Generate a structured JSON response from a prompt.
   * Retries on transient errors with exponential backoff.
   */
  async generateStructuredResponse<T>(prompt: string): Promise<GeminiResponse<T>> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse JSON response
        let parsed: T;
        try {
          parsed = JSON.parse(text) as T;
        } catch {
          throw new ScreenerError(
            `Failed to parse Gemini response as JSON: ${text.substring(0, 200)}`,
            ScreenerErrorCode.EVALUATION_PARSE_ERROR,
            { rawText: text }
          );
        }

        // Get token usage (approximate -- Gemini provides this in metadata)
        const usage = response.usageMetadata;

        return {
          data: parsed,
          tokensUsed: {
            prompt: usage?.promptTokenCount ?? 0,
            completion: usage?.candidatesTokenCount ?? 0,
            total: usage?.totalTokenCount ?? 0,
          },
        };
      } catch (error) {
        lastError = error;

        // Don't retry parse errors
        if (error instanceof ScreenerError && error.code === ScreenerErrorCode.EVALUATION_PARSE_ERROR) {
          throw error;
        }

        // Check for rate limiting
        const errMsg = (error as { message?: string }).message ?? '';
        if (errMsg.includes('429') || errMsg.toLowerCase().includes('rate limit')) {
          if (attempt < MAX_RETRIES - 1) {
            const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
            await sleep(backoff);
            continue;
          }
          throw new ScreenerError(
            'Gemini API rate limit exceeded after retries.',
            ScreenerErrorCode.GEMINI_RATE_LIMITED,
            error
          );
        }

        // Retry transient errors
        if (attempt < MAX_RETRIES - 1) {
          const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          await sleep(backoff);
          continue;
        }
      }
    }

    throw new ScreenerError(
      `Gemini API call failed after ${MAX_RETRIES} retries.`,
      ScreenerErrorCode.GEMINI_API_ERROR,
      lastError
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
