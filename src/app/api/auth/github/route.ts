// ============================================================
// GET /api/auth/github
// Redirects the user to GitHub's OAuth authorization page.
// Accepts an optional ?returnTo=/path query param so the
// callback can redirect back to the originating page.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getGitHubAuthURL } from '@/lib/screener/github/oauth';
import { ScreenerError } from '@/lib/screener/types';

export async function GET(request: NextRequest) {
  try {
    const returnTo = new URL(request.url).searchParams.get('returnTo') ?? undefined;
    const authUrl = getGitHubAuthURL(['repo', 'read:user'], returnTo);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    if (error instanceof ScreenerError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }

    console.error('GitHub auth route error:', error);
    return NextResponse.json(
      { error: 'Failed to generate GitHub authorization URL.' },
      { status: 500 }
    );
  }
}
