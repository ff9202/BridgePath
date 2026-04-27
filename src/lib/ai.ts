export interface AIConfig {
  provider: 'zhipu' | 'deepseek' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}

const PROVIDER_CONFIGS: Record<string, { baseUrl: string; model: string }> = {
  zhipu: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  custom: {
    baseUrl: '',
    model: '',
  },
};

export function getAIConfig(): AIConfig {
  if (typeof window === 'undefined') {
    return { provider: 'zhipu', apiKey: '', baseUrl: PROVIDER_CONFIGS.zhipu.baseUrl, model: PROVIDER_CONFIGS.zhipu.model };
  }

  const saved = localStorage.getItem('bridgepath_ai_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const providerConfig = PROVIDER_CONFIGS[parsed.provider] || PROVIDER_CONFIGS.zhipu;
      return {
        provider: parsed.provider || 'zhipu',
        apiKey: parsed.apiKey || '',
        baseUrl: parsed.baseUrl || providerConfig.baseUrl,
        model: parsed.model || providerConfig.model,
      };
    } catch {
      // fall through
    }
  }

  return {
    provider: 'zhipu',
    apiKey: '',
    baseUrl: PROVIDER_CONFIGS.zhipu.baseUrl,
    model: PROVIDER_CONFIGS.zhipu.model,
  };
}

export function saveAIConfig(config: AIConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bridgepath_ai_config', JSON.stringify(config));
  }
}

export function getProviderConfigs() {
  return PROVIDER_CONFIGS;
}

export async function callAI(messages: { role: string; content: string }[]): Promise<string> {
  const config = getAIConfig();

  if (!config.apiKey) {
    throw new Error('NO_API_KEY');
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function* streamAI(messages: { role: string; content: string }[]): AsyncGenerator<string> {
  const config = getAIConfig();

  if (!config.apiKey) {
    throw new Error('NO_API_KEY');
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

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
            yield content;
          }
        } catch {
          // skip malformed JSON
        }
      }
    }
  }
}
