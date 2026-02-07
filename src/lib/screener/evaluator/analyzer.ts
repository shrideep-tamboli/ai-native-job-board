// ============================================================
// Artifact Analyzer (Stage 1)
// Extracts structured signals from an ArtifactBundle via Gemini.
// ============================================================

import { GeminiClient } from './gemini';
import { buildArtifactAnalysisPrompt } from './prompts';
import type { ArtifactSignals, GeminiResponse } from './types';
import type { ArtifactBundle } from '../types';
import { ScreenerError, ScreenerErrorCode } from '../types';

/**
 * Analyze an artifact bundle and extract structured technical signals.
 * This is Stage 1 of the two-stage evaluation pipeline.
 */
export async function analyzeArtifacts(
  bundle: ArtifactBundle,
  geminiClient?: GeminiClient
): Promise<GeminiResponse<ArtifactSignals>> {
  const client = geminiClient ?? new GeminiClient();

  const prompt = buildArtifactAnalysisPrompt(bundle);
  const response = await client.generateStructuredResponse<ArtifactSignals>(prompt);

  // Validate the response structure
  validateArtifactSignals(response.data);

  return response;
}

/**
 * Validate that the AI response matches the expected ArtifactSignals shape.
 */
function validateArtifactSignals(signals: ArtifactSignals): void {
  if (!signals) {
    throw new ScreenerError(
      'Gemini returned empty artifact signals.',
      ScreenerErrorCode.EVALUATION_PARSE_ERROR
    );
  }

  if (!Array.isArray(signals.technicalSkills)) {
    throw new ScreenerError(
      'Gemini response missing technicalSkills array.',
      ScreenerErrorCode.EVALUATION_PARSE_ERROR,
      { received: signals }
    );
  }

  if (!Array.isArray(signals.codeQualityIndicators)) {
    throw new ScreenerError(
      'Gemini response missing codeQualityIndicators array.',
      ScreenerErrorCode.EVALUATION_PARSE_ERROR,
      { received: signals }
    );
  }

  if (!signals.workComplexity) {
    throw new ScreenerError(
      'Gemini response missing workComplexity object.',
      ScreenerErrorCode.EVALUATION_PARSE_ERROR,
      { received: signals }
    );
  }

  if (!signals.communicationQuality) {
    throw new ScreenerError(
      'Gemini response missing communicationQuality object.',
      ScreenerErrorCode.EVALUATION_PARSE_ERROR,
      { received: signals }
    );
  }

  if (typeof signals.overallSummary !== 'string') {
    throw new ScreenerError(
      'Gemini response missing overallSummary string.',
      ScreenerErrorCode.EVALUATION_PARSE_ERROR,
      { received: signals }
    );
  }

  // Validate skill entries
  for (const skill of signals.technicalSkills) {
    if (!skill.skill || !skill.proficiencyLevel || typeof skill.confidence !== 'number') {
      throw new ScreenerError(
        `Invalid skill entry: ${JSON.stringify(skill)}`,
        ScreenerErrorCode.EVALUATION_PARSE_ERROR
      );
    }
    // Clamp confidence to [0, 1]
    skill.confidence = Math.max(0, Math.min(1, skill.confidence));
  }
}
