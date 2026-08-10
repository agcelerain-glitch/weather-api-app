import { NextResponse } from 'next/server';

/**
 * スライディングウィンドウ方式のレート制限
 * key: "IP:pathname" → ウィンドウ内のリクエストタイムスタンプ配列
 *
 * 注意: Next.js のサーバーレス環境ではインスタンスをまたいで共有されないため
 * 大規模な悪用防止には Upstash Redis 等の外部ストアが必要。
 * 個人利用・小規模トラフィックでは十分に機能する。
 */
const store = new Map();

// エンドポイントごとの制限設定
const RULES = {
  '/api/ai-advice': { max: 5,  windowMs: 60_000 },   // 1分あたり5回
  '/api/weather':   { max: 30, windowMs: 60_000 },   // 1分あたり30回
  '/api/geocode':   { max: 30, windowMs: 60_000 },   // 1分あたり30回
};

function getIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const rule = RULES[pathname];
  if (!rule) return NextResponse.next();

  const ip  = getIp(request);
  const key = `${ip}:${pathname}`;
  const now = Date.now();

  // ウィンドウ外のタイムスタンプを除去してから現在のリクエストを追加
  const timestamps = (store.get(key) ?? []).filter(t => now - t < rule.windowMs);
  timestamps.push(now);
  store.set(key, timestamps);

  if (timestamps.length > rule.max) {
    const retryAfter = Math.ceil(rule.windowMs / 1000);
    return NextResponse.json(
      { error: 'リクエストが多すぎます。しばらくしてからお試しください。' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/ai-advice', '/api/weather', '/api/geocode'],
};
