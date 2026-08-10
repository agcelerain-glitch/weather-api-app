import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q?.trim()) return NextResponse.json([]);

  const key = process.env.OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();

    return NextResponse.json(
      data.map((c) => ({
        displayName: c.local_names?.ja || c.name,
        lat: c.lat,
        lon: c.lon,
        country: c.country,
        state: c.state,
      }))
    );
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
