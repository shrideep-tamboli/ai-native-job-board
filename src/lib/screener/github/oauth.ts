// ============================================================
// GitHub OAuth2 Helpers
// ============================================================

import { ScreenerError, ScreenerErrorCode } from '../types';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

/**
 * Build the GitHub OAuth authorization URL.
 * @param scopes  GitHub OAuth scopes to request.
 * @param returnTo  Optional path to redirect back to after the callback (e.g. '/candidate/feed').
 */
export function getGitHubAuthURL(
  scopes: string[] = ['repo', 'read:user'],
  returnTo?: string,
): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    throw new ScreenerError(
      'GITHUB_CLIENT_ID environment variable is not set.',
      ScreenerErrorCode.GITHUB_AUTH_FAILED
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const callbackUrl = `${appUrl}/api/auth/github/callback`;

  // Encode returnTo inside the state parameter alongside the CSRF token
  const csrf = generateState();
  const statePayload = returnTo ? `${csrf}:${returnTo}` : csrf;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: scopes.join(' '),
    state: statePayload,
  });

  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Extract the returnTo path from the state parameter, if present.
 */
export function parseReturnToFromState(state: string | null): string | null {
  if (!state) return null;
  const colonIndex = state.indexOf(':');
  if (colonIndex === -1) return null;
  const path = state.substring(colonIndex + 1);
  // Only allow relative paths starting with /
  if (path.startsWith('/')) return path;
  return null;
}

/**
 * Exchange an OAuth authorization code for an access token.
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new ScreenerError(
      'GitHub OAuth credentials are not configured (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET).',
      ScreenerErrorCode.GITHUB_AUTH_FAILED
    );
  }

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    throw new ScreenerError(
      `GitHub token exchange failed with status ${response.status}.`,
      ScreenerErrorCode.GITHUB_AUTH_FAILED
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new ScreenerError(
      `GitHub OAuth error: ${data.error_description ?? data.error}`,
      ScreenerErrorCode.GITHUB_AUTH_FAILED,
      data
    );
  }

  return data.access_token;
}

/**
 * Generate a random state parameter for CSRF protection.
 */
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}
