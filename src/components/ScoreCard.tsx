'use client';

export interface ComponentScoreItem {
  category: string;
  score: number;
  reasoning: string;
}

export interface EvaluationDisplay {
  overallScore: number;
  componentScores: ComponentScoreItem[];
  explanation: string;
  flaggedConcerns: string[];
  confidence: string;
}

interface ScoreCardProps {
  evaluation: EvaluationDisplay | null;
  repoUrl?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  skills_alignment: 'Skills alignment',
  code_quality: 'Code quality',
  experience_relevance: 'Experience relevance',
  work_style: 'Work style',
};

function barOpacity(score: number): string {
  if (score >= 70) return 'bg-zinc-900 dark:bg-zinc-100';
  if (score >= 50) return 'bg-zinc-500 dark:bg-zinc-400';
  return 'bg-zinc-300 dark:bg-zinc-600';
}

export default function ScoreCard({ evaluation, repoUrl }: ScoreCardProps) {
  if (!evaluation) {
    return (
      <p className="text-xs text-zinc-400 dark:text-zinc-500">No evaluation yet.</p>
    );
  }

  const { overallScore, componentScores, explanation, flaggedConcerns, confidence } = evaluation;

  return (
    <div className="space-y-3">
      {/* Score + confidence + repo */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          overallScore >= 70
            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
            : overallScore >= 50
              ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
        }`}>
          {overallScore}/100
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
          {confidence} confidence
        </span>
        {repoUrl && (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 dark:text-zinc-400 underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            View repo
          </a>
        )}
      </div>

      {/* Component bars */}
      {Array.isArray(componentScores) && componentScores.length > 0 && (
        <div className="space-y-1.5">
          {componentScores.map((cs) => (
            <div key={cs.category} className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 w-32 shrink-0">
                {CATEGORY_LABELS[cs.category] ?? cs.category}
              </span>
              <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barOpacity(cs.score)}`}
                  style={{ width: `${Math.min(100, Math.max(0, cs.score))}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 w-7 text-right tabular-nums">
                {cs.score}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{explanation}</p>
      )}

      {/* Concerns */}
      {Array.isArray(flaggedConcerns) && flaggedConcerns.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {flaggedConcerns.map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
