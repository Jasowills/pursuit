import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export const ModelProvider = z.enum(['openai', 'anthropic', 'google', 'hermes']);
export type ModelProvider = z.infer<typeof ModelProvider>;
export const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', key_label: 'OpenAI API key' },
  { id: 'anthropic', name: 'Claude', key_label: 'Anthropic API key' },
  { id: 'google', name: 'Gemini', key_label: 'Google AI Studio API key' },
  { id: 'hermes', name: 'Hermes · Nous Research', key_label: 'OpenRouter API key (Hermes models)' },
] as const;

/** Fixed destinations: user input can never redirect a credential to another host. */
export class ModelGateway {
  constructor(private readonly transport: typeof fetch = fetch) {}

  private async request(
    url: string,
    key: string,
    provider: ModelProvider,
    body?: unknown,
  ): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (provider === 'anthropic') {
      headers['x-api-key'] = key;
      headers['anthropic-version'] = '2023-06-01';
    } else if (provider === 'google') headers['x-goog-api-key'] = key;
    else headers['Authorization'] = `Bearer ${key}`;
    try {
      const res = await this.transport(url, {
        method: body === undefined ? 'GET' : 'POST',
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error',
        signal: AbortSignal.timeout(90_000),
      });
      if (!res.ok) {
        // Raw provider bodies may echo credentials or personal prompt data.
        throw new BadGatewayException({
          error: 'model_provider_error',
          provider,
          provider_status: res.status,
          detail:
            res.status === 429
              ? 'Provider quota or rate limit reached.'
              : [401, 403].includes(res.status)
                ? 'Check your API key and model access.'
                : 'The provider rejected the request.',
        });
      }
      return await res.json();
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new BadGatewayException({ error: 'model_provider_unreachable', provider });
    }
  }

  async models(provider: ModelProvider, key: string): Promise<string[]> {
    const urls = {
      openai: 'https://api.openai.com/v1/models',
      anthropic: 'https://api.anthropic.com/v1/models?limit=1000',
      google: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
      hermes: 'https://openrouter.ai/api/v1/models',
    };
    const data = await this.request(urls[provider], key, provider);
    const rows = provider === 'google' ? data.models : data.data;
    if (!Array.isArray(rows)) throw new BadGatewayException({ error: 'invalid_model_catalog' });
    return [
      ...new Set<string>(
        rows
          .filter((m: any) => {
            if (provider === 'google')
              return m.supportedGenerationMethods?.includes('generateContent');
            if (provider === 'hermes') return /^nousresearch\/hermes/i.test(m.id ?? '');
            if (provider === 'openai')
              return (
                /^(gpt-|o[1-9]|chatgpt-)/.test(m.id ?? '') &&
                !/(audio|realtime|transcribe|tts|image|search|codex)/.test(m.id ?? '')
              );
            return typeof m.id === 'string';
          })
          .map((m: any) => String(m.id ?? m.name?.replace(/^models\//, ''))),
      ),
    ].sort();
  }

  async generate(
    provider: ModelProvider,
    key: string,
    model: string,
    prompt: string,
  ): Promise<string> {
    if (!model || /[\r\n]/.test(model)) throw new BadRequestException({ error: 'model_required' });
    let data: any;
    let text: unknown;
    if (provider === 'openai') {
      data = await this.request('https://api.openai.com/v1/responses', key, provider, {
        model,
        input: prompt,
        max_output_tokens: 6000,
        store: false,
      });
      text = data.output
        ?.flatMap((o: any) => o.content ?? [])
        .filter((c: any) => c.type === 'output_text')
        .map((c: any) => c.text)
        .join('\n');
    } else if (provider === 'anthropic') {
      data = await this.request('https://api.anthropic.com/v1/messages', key, provider, {
        model,
        max_tokens: 6000,
        messages: [{ role: 'user', content: prompt }],
      });
      text = data.content
        ?.filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n');
    } else if (provider === 'google') {
      data = await this.request(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        key,
        provider,
        { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 6000 } },
      );
      text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('\n');
    } else {
      data = await this.request('https://openrouter.ai/api/v1/chat/completions', key, provider, {
        model,
        max_tokens: 6000,
        messages: [{ role: 'user', content: prompt }],
      });
      text = data.choices?.[0]?.message?.content;
    }
    if (typeof text !== 'string' || !text.trim())
      throw new BadGatewayException({ error: 'model_output_missing' });
    return text;
  }
}
