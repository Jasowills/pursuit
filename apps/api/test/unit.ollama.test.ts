import { ModelGateway } from '../src/model-gateway';
describe('bounded local Ollama gateway', () => {
  const old = process.env.ENABLE_LOCAL_MODELS;
  afterEach(() => {
    if (old === undefined) delete process.env.ENABLE_LOCAL_MODELS;
    else process.env.ENABLE_LOCAL_MODELS = old;
  });
  it('requires the operator opt-in and accepts no caller-chosen local host', async () => {
    delete process.env.ENABLE_LOCAL_MODELS;
    const transport = jest.fn();
    await expect(new ModelGateway(transport).models('ollama', 'unused')).rejects.toThrow();
    expect(transport).not.toHaveBeenCalled();
  });
  it('uses a fixed loopback endpoint, no key, a schema and bounded output', async () => {
    process.env.ENABLE_LOCAL_MODELS = 'true';
    const transport = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: { content: '{"selectedIds":["fact-1"]}' } }), {
        status: 200,
      }),
    );
    const gateway = new ModelGateway(transport);
    const schema = {
      type: 'object',
      properties: { selectedIds: { type: 'array', items: { type: 'string' } } },
    };
    expect(
      await gateway.generate('ollama', 'never-send-me', 'qwen2.5:7b', 'synthetic', {
        maxOutputTokens: 256,
        schema,
      }),
    ).toContain('fact-1');
    const [url, options] = transport.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:11434/api/chat');
    expect(options.headers.Authorization).toBeUndefined();
    expect(options.redirect).toBe('error');
    const body = JSON.parse(options.body);
    expect(body.options.num_predict).toBe(256);
    expect(body.options.num_ctx).toBe(4096);
    expect(body.format).toEqual(schema);
  });
});
