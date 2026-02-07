// ============================================================
// Evaluator-specific Types (AI analysis intermediate results)
// ============================================================

export interface ArtifactSignals {
  technicalSkills: SkillSignal[];
  codeQualityIndicators: QualityIndicator[];
  workComplexity: ComplexitySignal;
  communicationQuality: CommunicationSignal;
  overallSummary: string;
}

export interface SkillSignal {
  skill: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  evidence: string;       // brief description of where this was demonstrated
  confidence: number;     // 0-1
}

export interface QualityIndicator {
  aspect: string;         // e.g. "commit message clarity", "PR documentation"
  rating: 'poor' | 'fair' | 'good' | 'excellent';
  evidence: string;
}

export interface ComplexitySignal {
  averageTaskComplexity: 'low' | 'medium' | 'high';
  scopeOfWork: string;           // summary of what the candidate built/changed
  technicalDepth: string;        // summary of technical depth
  estimatedExperienceYears: number; // rough estimate from artifact complexity
}

export interface CommunicationSignal {
  commitMessageQuality: 'poor' | 'fair' | 'good' | 'excellent';
  prDescriptionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  issueEngagement: 'none' | 'minimal' | 'moderate' | 'active';
  overallCommunication: string;  // summary
}

// Gemini structured response wrapper
export interface GeminiResponse<T> {
  data: T;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}
