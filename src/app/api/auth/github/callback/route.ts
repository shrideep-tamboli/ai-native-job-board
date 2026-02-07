// ============================================================
// GET /api/auth/github/callback
// Handles the OAuth callback from GitHub, exchanges code for token,
// and redirects back to the app with the token.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/screener/github/oauth';
import { ScreenerError } from '@/lib/screener/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // GitHub may redirect with an error
    if (error) {
      const errorDescription = searchParams.get('error_description') ?? 'Unknown error';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
      return NextResponse.redirect(
        `${appUrl}?auth_error=${encodeURIComponent(errorDescription)}`
      );
    }

    if (!code) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
      return NextResponse.redirect(
        `${appUrl}?auth_error=${encodeURIComponent('No authorization code received.')}`
      );
    }

    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(code);

    // Redirect back to the app with the token
    // The client stores this in sessionStorage
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return NextResponse.redirect(
      `${appUrl}?github_token=${encodeURIComponent(accessToken)}`
    );
  } catch (err) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

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
