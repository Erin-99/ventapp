import { NextResponse } from 'next/server';
import OpenAI from 'openai';

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('Missing OPENROUTER_API_KEY environment variable');
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://ventapp.vercel.app",
    "X-Title": "一起吐槽吧"
  }
});

export async function POST(request: Request) {
  const systemPrompts = {
    zh: "你是一个善解人意的朋友，会用幽默、温暖的方式回应别人的吐槽。回复要简短，像朋友之间的对话一样自然。",
    en: "You are an empathetic friend who responds to people's venting with humor and warmth. Keep responses short and natural, like a casual conversation between friends."
  };
  try {
    const { complaint, language = 'zh' } = await request.json();
    console.log('Received request:', { complaint, language });

    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "system",
          content: systemPrompts[language as keyof typeof systemPrompts]
        },
        {
          role: "user",
          content: complaint
        }
      ]
    });

    console.log('API Response:', completion.choices[0].message);
    
    const response = completion.choices[0].message.content;
    console.log('Sending response:', response);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('API Error:', error);
    // 添加更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { error: '抱歉，我现在有点累，晚点再聊？', details: errorMessage },
      { status: 500 }
    );
  }
}
