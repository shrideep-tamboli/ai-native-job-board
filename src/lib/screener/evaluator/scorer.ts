// ============================================================
// Candidate Scorer (Stage 2)
// Scores a candidate against a job description using Gemini.
// ============================================================

import { GeminiClient } from './gemini';
import { buildScoringPrompt } from './prompts';
import type { ArtifactSignals } from './types';
import type {
  JobDescription,
  EvaluationResult,
  ComponentScore,
  ScoreCategory,
} from '../types';
import { ScreenerError, ScreenerErrorCode } from '../types';

// Component weights for overall score calculation
const WEIGHTS: Record<ScoreCategory, number> = {
  skills_alignment: 0.35,
  code_quality: 0.25,
  experience_relevance: 0.25,
  work_style: 0.15,
};

interface RawScoringResponse {
  overallScore: number;
  componentScores: ComponentScore[];
  explanation: string;
  flaggedConcerns: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Score a candidate against a job description based on their artifact signals.
 * This is Stage 2 of the two-stage evaluation pipeline.
 */
export async function scoreCandidate(
  signals: ArtifactSignals,
  jobDescription: JobDescription,
  artifactBundleId: string,
  geminiClient?: GeminiClient
): Promise<EvaluationResult> {
  const client = geminiClient ?? new GeminiClient();

  const prompt = buildScoringPrompt(signals, jobDescription);
  const response = await client.generateStructuredResponse<RawScoringResponse>(prompt);

  // Validate and normalize the scores
  const validated = validateAndNormalizeScores(response.data);

  return {
    id: generateEvaluationId(artifactBundleId, jobDescription.id),
    artifactBundleId,
    jobId: jobDescription.id,
    overallScore: validated.overallScore,
    componentScores: validated.componentScores,
    explanation: validated.explanation,
    flaggedConcerns: validated.flaggedConcerns,
    evaluatedAt: new Date().toISOString(),
    confidence: validated.confidence,
  };
}

/**
 * Validate scores are in range and recalculate overall score using our weights.
 */
function validateAndNormalizeScores(raw: RawScoringResponse): RawScoringResponse {
  if (!raw || !Array.isArray(raw.componentScores)) {
    throw new ScreenerError(
      'Gemini returned invalid scoring response.',
      ScreenerErrorCode.EVALUATION_PARSE_ERROR,
      { received: raw }
    );
  }

  // Ensure all 4 categories are present
  const requiredCategories: ScoreCategory[] = [
    'skills_alignment',
    'code_quality',
    'experience_relevance',
    'work_style',
  ];

  const scoreMap = new Map<ScoreCategory, ComponentScore>();
  for (const cs of raw.componentScores) {
    if (requiredCategories.includes(cs.category as ScoreCategory)) {
      scoreMap.set(cs.category as ScoreCategory, cs);
    }
  }

  // Fill in any missing categories with a default
  for (const cat of requiredCategories) {
    if (!scoreMap.has(cat)) {
      scoreMap.set(cat, {
        category: cat,
        score: 50,
        reasoning: 'Insufficient data to evaluate this component.',
      });
    }
  }

  // Clamp all scores to [0, 100]
  const componentScores: ComponentScore[] = requiredCategories.map((cat) => {
    const cs = scoreMap.get(cat)!;
    return {
      ...cs,
      score: Math.max(0, Math.min(100, Math.round(cs.score))),
    };
  });

  // Recalculate overall score using our weights (don't trust AI's math)
  const overallScore = Math.round(
    componentScores.reduce((sum, cs) => {
      return sum + cs.score * (WEIGHTS[cs.category] ?? 0.25);
    }, 0)
  );

  return {
    overallScore,
    componentScores,
    explanation: raw.explanation || 'No explanation provided.',
    flaggedConcerns: Array.isArray(raw.flaggedConcerns) ? raw.flaggedConcerns : [],
    confidence: ['high', 'medium', 'low'].includes(raw.confidence) ? raw.confidence : 'medium',
  };
}

function generateEvaluationId(artifactBundleId: string, jobId: string): string {
  const timestamp = Date.now().toString(36);
  return `eval_${artifactBundleId.substring(0, 8)}_${jobId.substring(0, 8)}_${timestamp}`;
}
