import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat と lon が必要です' }, { status: 400 });
  }

  const key = process.env.OPENWEATHER_API_KEY;
  const base = 'https://api.openweathermap.org/data/4.0/onecall/timeline/1day';

  async function fetchPage(url) {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `API error ${res.status}`);
    }
    return res.json();
  }

  try {
    const batch1 = await fetchPage(
      `${base}?lat=${lat}&lon=${lon}&units=metric&lang=ja&appid=${key}`
    );
    let days = batch1.data || [];

    // 1回目で 10件取得、14件に満たない場合は次ページを取得
    if (days.length < 14 && batch1.next) {
      try {
        const batch2 = await fetchPage(batch1.next);
        days = [...days, ...(batch2.data || [])];
      } catch {
        // 部分データのまま続行
      }
    }

    const result = days.slice(0, 14).map((d) => ({
      dt: d.dt,
      temp: {
        max: d.temp.max,
        min: d.temp.min,
        day: d.temp.day,
      },
      humidity: d.humidity,
      pop: d.pop ?? 0,
      description: d.weather?.[0]?.description ?? '',
      icon: d.weather?.[0]?.icon ?? '01d',
      uvi: d.uvi ?? 0,
    }));

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
