// ============================================================
// Screener Pipeline - Barrel Export
// ============================================================

// Types
export type {
  ArtifactBundle,
  EvaluationResult,
  ComponentScore,
  ScoreCategory,
  JobDescription,
  NormalizedCommit,
  NormalizedPR,
  NormalizedIssue,
  RepoMeta,
  ActivitySignals,
  ExtractOptions,
  PipelineResult,
} from './types';

export { ScreenerError, ScreenerErrorCode } from './types';

// Pipeline
export {
  runScreeningPipeline,
  extractAndNormalize,
  evaluateCandidate,
} from './pipeline';

// GitHub
export { GitHubClient } from './github/client';
export { fetchRepoArtifacts, parseRepoUrl } from './github/fetcher';
export { normalizeArtifacts } from './github/normalizer';
export { getGitHubAuthURL, exchangeCodeForToken, parseReturnToFromState } from './github/oauth';

// Evaluator
export { GeminiClient } from './evaluator/gemini';
export { analyzeArtifacts } from './evaluator/analyzer';
export { scoreCandidate } from './evaluator/scorer';
