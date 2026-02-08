// ============================================================
// GET /api/auth/github/callback
// Handles the OAuth callback from GitHub, exchanges code for token,
// and redirects back to the originating page with the token.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, parseReturnToFromState } from '@/lib/screener/github/oauth';
import { ScreenerError } from '@/lib/screener/types';

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // Determine where to redirect back to (default: /)
    const returnTo = parseReturnToFromState(state) ?? '/';

    // GitHub may redirect with an error
    if (error) {
      const errorDescription = searchParams.get('error_description') ?? 'Unknown error';
      return NextResponse.redirect(
        `${appUrl}${returnTo}${returnTo.includes('?') ? '&' : '?'}auth_error=${encodeURIComponent(errorDescription)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${appUrl}${returnTo}${returnTo.includes('?') ? '&' : '?'}auth_error=${encodeURIComponent('No authorization code received.')}`
      );
    }

    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(code);

    // Redirect back to the originating page with the token
    return NextResponse.redirect(
      `${appUrl}${returnTo}${returnTo.includes('?') ? '&' : '?'}github_token=${encodeURIComponent(accessToken)}`
    );
  } catch (err) {
    if (err instanceof ScreenerError) {
      return NextResponse.redirect(
        `${appUrl}?auth_error=${encodeURIComponent(err.message)}`
      );
    }

    console.error('GitHub callback error:', err);
    return NextResponse.redirect(
      `${appUrl}?auth_error=${encodeURIComponent('Failed to complete GitHub authentication.')}`
    );
  }
}
