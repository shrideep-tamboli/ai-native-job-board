// ============================================================
// Prompt Templates for Gemini-based Evaluation
// Two-stage design: Artifact Analysis -> Job Alignment Scoring
// ============================================================

import type { ArtifactBundle, JobDescription } from '../types';
import type { ArtifactSignals } from './types';

// ------------------------------------------------------------------
// Stage 1: Artifact Analysis Prompt
// ------------------------------------------------------------------

export function buildArtifactAnalysisPrompt(bundle: ArtifactBundle): string {
  const artifactSummary = serializeArtifactBundle(bundle);

  return `You are a senior technical recruiter's AI assistant. Your task is to analyze a software developer's GitHub repository artifacts and extract structured signals about their technical abilities, code quality, and working style.

## Artifact Data

${artifactSummary}

## Instructions

Analyze the above repository data and produce a JSON response with the following structure. Be evidence-based -- every assessment must reference specific artifacts (commits, PRs, issues).

Respond with ONLY valid JSON matching this exact schema:

{
  "technicalSkills": [
    {
      "skill": "Name of skill/technology",
      "proficiencyLevel": "beginner | intermediate | advanced | expert",
      "evidence": "Brief description of where this was demonstrated",
      "confidence": 0.0 to 1.0
    }
  ],
  "codeQualityIndicators": [
    {
      "aspect": "e.g. commit message clarity, PR documentation, code organization",
      "rating": "poor | fair | good | excellent",
      "evidence": "Brief supporting evidence"
    }
  ],
  "workComplexity": {
    "averageTaskComplexity": "low | medium | high",
    "scopeOfWork": "Summary of what the candidate built or changed",
    "technicalDepth": "Summary of technical depth demonstrated",
    "estimatedExperienceYears": number
  },
  "communicationQuality": {
    "commitMessageQuality": "poor | fair | good | excellent",
    "prDescriptionQuality": "poor | fair | good | excellent",
    "issueEngagement": "none | minimal | moderate | active",
    "overallCommunication": "Summary of communication patterns"
  },
  "overallSummary": "2-3 sentence summary of the candidate's profile based on artifacts"
}

Important guidelines:
- If data is insufficient for a particular signal, note low confidence.
- Do not invent skills not evidenced in the artifacts.
- Consider both quantity and quality of contributions.
- Evaluate commit messages for clarity, PR descriptions for thoroughness.
- Assess code complexity from file change patterns and languages used.`;
}

// ------------------------------------------------------------------
// Stage 2: Job Alignment & Scoring Prompt
// ------------------------------------------------------------------

export function buildScoringPrompt(
  signals: ArtifactSignals,
  jobDescription: JobDescription
): string {
  const signalsJson = JSON.stringify(signals, null, 2);
  const jdSummary = serializeJobDescription(jobDescription);

  return `You are a senior technical recruiter's AI assistant. Your task is to score a software developer candidate against a specific job description, based on their analyzed artifact signals.

## Candidate's Artifact Analysis

${signalsJson}

## Job Description

${jdSummary}

## Instructions

Score the candidate across 4 components, each 0-100. Then produce an overall weighted score and a concise explanation.

Scoring rubric:
- **skills_alignment** (weight: 35%): How well do the candidate's demonstrated technical skills match the job requirements? Consider both direct matches and transferable skills.
- **code_quality** (weight: 25%): Based on code quality indicators, how does their craftsmanship compare to what this role expects?
- **experience_relevance** (weight: 25%): Does the scope and complexity of their work match the seniority and domain of this role?
- **work_style** (weight: 15%): Do their communication patterns (PRs, commits, issues) suggest they'd work well in this team/role?

Confidence levels:
- "high": Sufficient artifact data and clear alignment/misalignment
- "medium": Some data gaps but reasonable assessment possible
- "low": Insufficient data for reliable scoring

Respond with ONLY valid JSON matching this exact schema:

{
  "overallScore": number (0-100, weighted average of components),
  "componentScores": [
    {
      "category": "skills_alignment",
      "score": number (0-100),
      "reasoning": "One sentence explaining this score"
    },
    {
      "category": "code_quality",
      "score": number (0-100),
      "reasoning": "One sentence explaining this score"
    },
    {
      "category": "experience_relevance",
      "score": number (0-100),
      "reasoning": "One sentence explaining this score"
    },
    {
      "category": "work_style",
      "score": number (0-100),
      "reasoning": "One sentence explaining this score"
    }
  ],
  "explanation": "2-3 sentence summary: key strengths, gaps, and overall fit",
  "flaggedConcerns": ["Array of specific concerns or caveats, e.g. 'Limited commit history', 'No evidence of backend experience'"],
  "confidence": "high | medium | low"
}

Important guidelines:
- Be calibrated: 70+ is a strong match, 50-69 is partial, below 50 is weak.
- Justify each score with specific evidence from the artifact signals.
- Flag any data gaps that limit confidence.
- The explanation should be useful for a recruiter making a hiring decision.`;
}

// ------------------------------------------------------------------
// Serialization Helpers
// ------------------------------------------------------------------

function serializeArtifactBundle(bundle: ArtifactBundle): string {
  const sections: string[] = [];

  // Repo overview
  sections.push(`### Repository: ${bundle.repoMeta.fullName}
- Description: ${bundle.repoMeta.description || 'No description'}
- Stars: ${bundle.repoMeta.stars} | Forks: ${bundle.repoMeta.forks}
- Languages: ${Object.entries(bundle.repoMeta.languages).map(([l, p]) => `${l} (${p}%)`).join(', ')}
- Created: ${bundle.repoMeta.createdAt} | Updated: ${bundle.repoMeta.updatedAt}`);

  // Activity signals
  const s = bundle.activitySignals;
  sections.push(`### Activity Signals
- Commit frequency: ${s.commitFrequency} per week
- Active days: ${s.activeDays}
- Average PR size: ${s.avgPRSize} lines changed
- Average commit size: ${s.avgCommitSize} lines changed
- PR merge rate: ${Math.round(s.prMergeRate * 100)}%
- Review participation: ${s.reviewParticipation} comments per PR`);

  // Commits (show top 15 for context)
  const topCommits = bundle.commits.slice(0, 15);
  if (topCommits.length > 0) {
    sections.push(`### Recent Commits (${bundle.commits.length} total, showing top ${topCommits.length})
${topCommits.map((c) =>
  `- [${c.sha.substring(0, 7)}] ${c.message} (by ${c.author}, +${c.additions}/-${c.deletions}, ${c.filesChanged} files, ${c.languages.join('/')})`
).join('\n')}`);
  }

  // Pull Requests (show top 10)
  const topPRs = bundle.pullRequests.slice(0, 10);
  if (topPRs.length > 0) {
    sections.push(`### Pull Requests (${bundle.pullRequests.length} total, showing top ${topPRs.length})
${topPRs.map((pr) =>
  `- PR #${pr.number}: "${pr.title}" (${pr.state}${pr.mergedAt ? ', merged' : ''}) +${pr.additions}/-${pr.deletions}, ${pr.filesChanged} files, ${pr.reviewComments} reviews
  ${pr.description ? `  Description: ${pr.description.substring(0, 200)}` : '  No description'}`
).join('\n')}`);
  }

  // Issues (show top 10)
  const topIssues = bundle.issues.slice(0, 10);
  if (topIssues.length > 0) {
    sections.push(`### Issues (${bundle.issues.length} total, showing top ${topIssues.length})
${topIssues.map((i) =>
  `- Issue #${i.number}: "${i.title}" (${i.state}) labels: [${i.labels.join(', ')}]${i.linkedPRNumbers.length > 0 ? ` linked to PR #${i.linkedPRNumbers.join(', #')}` : ''}`
).join('\n')}`);
  }

  return sections.join('\n\n');
}

function serializeJobDescription(jd: JobDescription): string {
  const parts: string[] = [
    `### ${jd.title} at ${jd.company}`,
    `**Description:** ${jd.description}`,
    `**Requirements:** ${jd.requirements}`,
  ];

  if (jd.dailyTasks) parts.push(`**Daily Tasks:** ${jd.dailyTasks}`);
  if (jd.expectedOutcomes) parts.push(`**Expected Outcomes:** ${jd.expectedOutcomes}`);
  if (jd.techStack?.length) parts.push(`**Tech Stack:** ${jd.techStack.join(', ')}`);
  if (jd.experienceLevel) parts.push(`**Experience Level:** ${jd.experienceLevel}`);

  return parts.join('\n');
}
