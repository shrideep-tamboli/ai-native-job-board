// ============================================================
// POST /api/screener/evaluate
// Accepts an ArtifactBundle + JobDescription, returns EvaluationResult.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { evaluateCandidate } from '@/lib/screener/pipeline';
import { ScreenerError } from '@/lib/screener/types';
import type { ArtifactBundle, JobDescription } from '@/lib/screener/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { artifactBundle, jobDescription } = body as {
      artifactBundle?: ArtifactBundle;
      jobDescription?: JobDescription;
    };

    // Validate required fields
    if (!artifactBundle || !artifactBundle.id) {
      return NextResponse.json(
        { error: 'Missing or invalid artifactBundle field.' },
        { status: 400 }
      );
    }

    if (!jobDescription || !jobDescription.id || !jobDescription.title) {
      return NextResponse.json(
        { error: 'Missing or invalid jobDescription field.' },
        { status: 400 }
      );
    }

    // Run evaluation (Stage 1: analyze + Stage 2: score)
    const evaluation = await evaluateCandidate(artifactBundle, jobDescription);

    return NextResponse.json({ success: true, data: evaluation });
  } catch (error) {
    if (error instanceof ScreenerError) {
      const statusMap: Record<string, number> = {
        GEMINI_API_ERROR: 502,
        GEMINI_RATE_LIMITED: 429,
        EVALUATION_PARSE_ERROR: 502,
      };

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusMap[error.code] ?? 500 }
      );
    }

    console.error('Evaluate route error:', error);
    return NextResponse.json(
      { error: 'Internal server error during evaluation.' },
      { status: 500 }
    );
  }
}
