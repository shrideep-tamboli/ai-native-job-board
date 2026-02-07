// ============================================================
// POST /api/screener/extract
// Accepts a GitHub repo URL + token, returns an ArtifactBundle.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { extractAndNormalize } from '@/lib/screener/pipeline';
import { ScreenerError } from '@/lib/screener/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { repoUrl, token, options } = body as {
      repoUrl?: string;
      token?: string;
      options?: {
        maxCommits?: number;
        sinceDays?: number;
        includeIssues?: boolean;
        includePRs?: boolean;
        candidateGithub?: string;
      };
    };

    // Validate required fields
    if (!repoUrl || typeof repoUrl !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid repoUrl field.' },
        { status: 400 }
      );
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid token field.' },
        { status: 400 }
      );
    }

    // Run extraction + normalization
    const artifactBundle = await extractAndNormalize(token, repoUrl, options);

    return NextResponse.json({ success: true, data: artifactBundle });
  } catch (error) {
    if (error instanceof ScreenerError) {
      const statusMap: Record<string, number> = {
        GITHUB_AUTH_FAILED: 401,
        GITHUB_REPO_NOT_FOUND: 404,
        GITHUB_RATE_LIMITED: 429,
        INVALID_REPO_URL: 400,
      };

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusMap[error.code] ?? 500 }
      );
    }

    console.error('Extract route error:', error);
    return NextResponse.json(
      { error: 'Internal server error during extraction.' },
      { status: 500 }
    );
  }
}
