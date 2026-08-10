import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { cityName, date, description, maxTemp, minTemp, humidity, pop } =
      await request.json();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `以下の天気条件について外出のための実用的なアドバイスを日本語で100文字程度で回答してください。服装・持ち物・注意点を含めてください。

都市: ${cityName}
日付: ${date}
天気: ${description}
最高気温: ${maxTemp}°C / 最低気温: ${minTemp}°C
湿度: ${humidity}%
降水確率: ${pop}%`,
      config: {
        systemInstruction:
          '天気に基づいた外出アドバイスを日本語で提供する簡潔なアシスタントです。服装・持ち物・注意点を実用的にまとめてください。',
        maxOutputTokens: 256,
      },
    });

    return NextResponse.json({ advice: response.text });
  } catch (e) {
    const msg = e.message ?? '';
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      return NextResponse.json(
        { error: 'APIの利用制限に達しました。しばらくしてからお試しください。' },
        { status: 429 }
      );
    }
    // 実際のエラーをそのまま返す（原因特定後に汎用メッセージに戻す）
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
