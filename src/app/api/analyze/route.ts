import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { major, courses, experience, targetJob } = body;

    if (!major || !targetJob) {
      return new Response(
        JSON.stringify({ error: '请填写当前专业和目标岗位' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Read API config from request headers (passed from client)
    const apiKey = request.headers.get('x-api-key');
    const baseUrl = request.headers.get('x-base-url') || 'https://open.bigmodel.cn/api/paas/v4';
    const model = request.headers.get('x-model') || 'glm-4-flash';

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'NO_API_KEY', message: '请先在设置页面配置API Key' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `你是一位专业的职业规划顾问，擅长帮助大学生进行跨专业能力迁移分析。请根据用户的专业背景、课程、经历和目标岗位，进行详细的能力迁移分析。

请严格按照以下JSON格式返回结果（不要添加任何其他文字说明）：
{
  "matchScore": 75,
  "summary": "整体匹配度概述，1-2句话",
  "transferableSkills": [
    {
      "name": "能力名称",
      "description": "该能力在原专业中的体现",
      "matchExplanation": "如何迁移到目标岗位",
      "relevance": 90
    }
  ],
  "newSkills": [
    {
      "name": "需要学习的能力",
      "reason": "为什么需要学习",
      "priority": "高",
      "resources": "推荐学习资源"
    }
  ],
  "radarData": {
    "专业基础": 70,
    "技术能力": 40,
    "项目经验": 50,
    "沟通协作": 80,
    "学习能力": 85,
    "行业认知": 30
  }
}

注意：
- matchScore 是 0-100 的整数
- transferableSkills 至少 3 个，relevance 是 0-100
- newSkills 至少 2 个，priority 为 "高"/"中"/"低"
- radarData 的值都是 0-100 的整数，代表用户当前各维度能力水平
- 分析要具体、有针对性，不要泛泛而谈`;

    const userPrompt = `请分析以下跨专业求职者的能力迁移情况：

当前专业：${major}
核心课程：${courses || '未提供'}
项目/实习经历：${experience || '未提供'}
目标岗位：${targetJob}

请给出详细的能力迁移分析。`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `AI API 错误: ${response.status}`, detail: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === 'data: [DONE]') continue;
              if (trimmed.startsWith('data: ')) {
                try {
                  const json = JSON.parse(trimmed.slice(6));
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch {
                  // skip malformed JSON
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '服务器错误', detail: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
