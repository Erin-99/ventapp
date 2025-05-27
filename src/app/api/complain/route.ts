import { NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';

// 使用 Node.js runtime
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

if (!process.env.OPENROUTER_API_KEY) {
  console.error('API key is missing!');
  throw new Error('Missing OPENROUTER_API_KEY environment variable');
}

const systemPrompts = {
  zh: "你是一个善解人意的朋友，会用幽默、温暖的方式回应别人的吐槽。回复要简短，像朋友之间的对话一样自然。",
  en: "You are an empathetic friend who responds to people's venting with humor and warmth. Keep responses short and natural, like a casual conversation between friends."
};

// 添加环境变量检查
function checkEnvironment() {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      runtime: process.env.NEXT_RUNTIME
    });
    
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is missing');
    }
    if (apiKey.length < 30) {
      throw new Error('OPENROUTER_API_KEY appears to be invalid');
    }
  } catch (error) {
    console.error('Environment check failed:', error);
    throw error;
  }
}

async function makeRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
  for (let i = 0; i < retries; i++) {
    try {
      const agent = process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy) : undefined;
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        agent
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // exponential backoff
    }
  }
  throw new Error('All retries failed');
}

export async function POST(request: Request) {
  // 捕获所有可能的错误
  try {
  // 检查环境变量
  checkEnvironment();
    const { complaint, language = 'zh' } = await request.json();
    console.log('Received request:', { complaint, language, timestamp: new Date().toISOString() });

    console.log('Making API request...');
    const requestBody = {
      model: 'deepseek/deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompts[language as keyof typeof systemPrompts]
        },
        {
          role: 'user',
          content: complaint
        }
      ]
    };
    console.log('Request body:', requestBody);

    const response = await makeRequest('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://ventapp.vercel.app',
        'X-Title': '一起吐槽吧'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response format');
    }

    const aiResponse = data.choices[0].message.content;
    console.log('Sending response:', aiResponse);

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('Error details:', errorMessage);
    
    // 检查各种错误类型
    if (error instanceof Error) {
      // 连接超时
      if (error.name === 'TimeoutError' || errorMessage.includes('timeout')) {
        return NextResponse.json(
          { error: '请求超时，请稍后再试~' },
          { status: 504 }
        );
      }
      
      // 网络错误
      if (error.name === 'TypeError' || 
          errorMessage.includes('network') || 
          errorMessage.includes('connection') ||
          errorMessage.includes('failed to fetch')) {
        return NextResponse.json(
          { error: '网络连接不太顺畅，请稍后再试~' },
          { status: 503 }
        );
      }

      // API 错误
      if (errorMessage.includes('API')) {
        return NextResponse.json(
          { error: 'API 服务暂时不可用，请稍后再试~' },
          { status: 502 }
        );
      }
    }
    
    // 其他未知错误
    return NextResponse.json(
      { error: '抱歉，出了点小问题，请稍后再试~', details: errorMessage },
      { status: 500 }
    );
  }
}
