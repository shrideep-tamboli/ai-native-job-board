// ============================================================
// Pipeline Orchestrator
// Ties extraction, normalization, analysis, and scoring together.
// ============================================================

import { fetchRepoArtifacts } from './github/fetcher';
import { normalizeArtifacts } from './github/normalizer';
import { analyzeArtifacts } from './evaluator/analyzer';
import { scoreCandidate } from './evaluator/scorer';
import { GeminiClient } from './evaluator/gemini';
import type {
  ArtifactBundle,
  EvaluationResult,
  ExtractOptions,
  JobDescription,
  PipelineResult,
} from './types';
import { ScreenerError, ScreenerErrorCode } from './types';

// ------------------------------------------------------------------
// Full Pipeline: Extract -> Normalize -> Analyze -> Score
// ------------------------------------------------------------------

/**
 * Run the complete screening pipeline.
 *
 * Steps:
 *  1. Fetch raw GitHub data (commits, PRs, issues)
 *  2. Normalize into a structured ArtifactBundle
 *  3. Analyze artifacts via Gemini (Stage 1 -- extract signals)
 *  4. Score candidate against job description via Gemini (Stage 2)
 */
export async function runScreeningPipeline(
  token: string,
  repoUrl: string,
  jobDescription: JobDescription,
  options?: ExtractOptions & { candidateGithub?: string }
): Promise<PipelineResult> {
  try {
    // Step 1 & 2: Extract and normalize
    const artifactBundle = await extractAndNormalize(token, repoUrl, options);

    // Step 3 & 4: Analyze and score
    const evaluation = await evaluateCandidate(artifactBundle, jobDescription);

    return {
      artifactBundle,
      evaluation,
    };
  } catch (error) {
    if (error instanceof ScreenerError) {
      throw error;
    }
    throw new ScreenerError(
      `Pipeline failed: ${(error as Error).message}`,
      ScreenerErrorCode.PIPELINE_ERROR,
      error
    );
  }
}

// ------------------------------------------------------------------
// Partial Pipeline Steps (for API route flexibility)
// ------------------------------------------------------------------

/**
 * Step 1 + 2: Fetch GitHub data and normalize into an ArtifactBundle.
 * Can be called independently via the /api/screener/extract route.
 */
export async function extractAndNormalize(
  token: string,
  repoUrl: string,
  options?: ExtractOptions & { candidateGithub?: string }
): Promise<ArtifactBundle> {
  try {
    // Step 1: Fetch raw data from GitHub
    const rawData = await fetchRepoArtifacts(token, repoUrl, {
      maxCommits: options?.maxCommits ?? 50,
      sinceDays: options?.sinceDays ?? 90,
      includeIssues: options?.includeIssues ?? true,
      includePRs: options?.includePRs ?? true,
    });

    // Step 2: Normalize into structured bundle
    const artifactBundle = normalizeArtifacts(
      rawData,
      repoUrl,
      options?.candidateGithub
    );

    return artifactBundle;
  } catch (error) {
    if (error instanceof ScreenerError) {
      throw error;
    }
    throw new ScreenerError(
      `Extraction failed: ${(error as Error).message}`,
      ScreenerErrorCode.PIPELINE_ERROR,
      error
    );
  }
}

/**
 * Step 3 + 4: Analyze artifacts and score against a job description.
 * Can be called independently via the /api/screener/evaluate route.
 */
export async function evaluateCandidate(
  artifactBundle: ArtifactBundle,
  jobDescription: JobDescription
): Promise<EvaluationResult> {
  try {
    // Share a single Gemini client instance for both calls
    const geminiClient = new GeminiClient();

    // Step 3: Analyze artifacts (Stage 1)
    const analysisResponse = await analyzeArtifacts(artifactBundle, geminiClient);
    const signals = analysisResponse.data;

    // Step 4: Score against job description (Stage 2)
    const evaluation = await scoreCandidate(
      signals,
      jobDescription,
      artifactBundle.id,
      geminiClient
    );

    return evaluation;
  } catch (error) {
    if (error instanceof ScreenerError) {
      throw error;
    }
    throw new ScreenerError(
      `Evaluation failed: ${(error as Error).message}`,
      ScreenerErrorCode.PIPELINE_ERROR,
      error
    );
  }
}
