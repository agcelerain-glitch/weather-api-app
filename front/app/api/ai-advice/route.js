import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TIMEOUT_MS = 15000;

export async function POST(request) {
  try {
    const { cityName, date, description, maxTemp, minTemp, humidity, pop } =
      await request.json();

    const generatePromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `以下の天気条件について外出のための実用的なアドバイスを日本語で200文字程度で回答してください。
回答は必ず「【${cityName}・${date}】」から始め、その後に服装・持ち物・注意点を自然な文章で記述してください。

都市: ${cityName}
日付: ${date}
天気: ${description}
最高気温: ${maxTemp}°C / 最低気温: ${minTemp}°C
湿度: ${humidity}%
降水確率: ${pop}%`,
      config: {
        systemInstruction:
          '天気に基づいた外出アドバイスを日本語で提供するアシスタントです。' +
          '必ず冒頭に【都市名・日付】を明記し、服装・持ち物・注意点を続けて自然な日本語の文章で200文字程度にまとめてください。' +
          'markdownの記号（**、##、- など）は一切使わず、プレーンテキストのみで回答してください。',
        maxOutputTokens: 1024,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);

    return NextResponse.json({ advice: response.text });
  } catch (e) {
    const msg = e.message ?? '';
    if (msg === 'TIMEOUT') {
      return NextResponse.json(
        { error: '応答に時間がかかりすぎました。再度お試しください。' },
        { status: 408 }
      );
    }
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      return NextResponse.json(
        { error: 'APIの利用制限に達しました。しばらくしてからお試しください。' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: 'AIアドバイスの取得に失敗しました。' },
      { status: 500 }
    );
  }
}
