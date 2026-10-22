import { NextResponse } from 'next/server';
export async function GET() {
  try {
    const response = await fetch('https://api.github.com/repos/Jasowills/pursuit', {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Pursuit-public-site' },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Unavailable');
    const body = await response.json();
    if (!Number.isSafeInteger(body.stargazers_count) || body.stargazers_count < 0)
      throw new Error('Invalid count');
    return NextResponse.json(
      { stars: body.stargazers_count },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch {
    return NextResponse.json({ stars: null }, { status: 503 });
  }
}
