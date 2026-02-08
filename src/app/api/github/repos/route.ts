// ============================================================
// POST /api/github/repos
// Returns repositories for the authenticated user (token in body).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

const GITHUB_API = 'https://api.github.com';

export interface RepoItem {
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = (body?.token ?? '') as string;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid token.' }, { status: 400 });
    }

    const res = await fetch(`${GITHUB_API}/user/repos?per_page=100&sort=updated&type=all`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401) {
        return NextResponse.json({ error: 'Invalid or expired GitHub token.' }, { status: 401 });
      }
      return NextResponse.json(
        { error: text || 'Failed to fetch repositories.' },
        { status: res.status }
      );
    }

    const data = (await res.json()) as Array<{ full_name: string; html_url: string; description: string | null; private: boolean }>;
    const repos: RepoItem[] = data.map((r) => ({
      full_name: r.full_name,
      html_url: r.html_url,
      description: r.description ?? null,
      private: r.private ?? false,
    }));

    return NextResponse.json({ success: true, repos });
  } catch (err) {
    console.error('GitHub repos route error:', err);
    return NextResponse.json({ error: 'Failed to fetch repositories.' }, { status: 500 });
  }
}
