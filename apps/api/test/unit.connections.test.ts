import { CredentialVault } from '../src/credential-vault';
import { ModelGateway } from '../src/model-gateway';

describe('user-owned credential encryption', () => {
  const previous = process.env['CONNECTION_ENCRYPTION_KEY'];
  beforeEach(() => {
    process.env['CONNECTION_ENCRYPTION_KEY'] = 'a'.repeat(64);
  });
  afterAll(() => {
    if (previous === undefined) delete process.env['CONNECTION_ENCRYPTION_KEY'];
    else process.env['CONNECTION_ENCRYPTION_KEY'] = previous;
  });
  it('encrypts non-deterministically and refuses another user or provider', () => {
    const vault = new CredentialVault();
    const envelope = vault.seal('secret-test-api-key', 'tenant:user:openai');
    expect(envelope).not.toContain('secret-test-api-key');
    expect(vault.seal('secret-test-api-key', 'tenant:user:openai')).not.toBe(envelope);
    expect(vault.open(envelope, 'tenant:user:openai')).toBe('secret-test-api-key');
    expect(() => vault.open(envelope, 'tenant:other:openai')).toThrow();
    expect(() => vault.open(envelope, 'tenant:user:google')).toThrow();
  });
  it('fails closed when no encryption key is configured', () => {
    delete process.env['CONNECTION_ENCRYPTION_KEY'];
    expect(new CredentialVault().available()).toBe(false);
    expect(() => new CredentialVault().seal('key', 'owner')).toThrow();
  });
});

describe('model transport', () => {
  it('uses fixed authenticated endpoints and removes unsupported model families', async () => {
    const transport = jest
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [{ id: 'gpt-text' }, { id: 'gpt-audio' }, { id: 'image-model' }],
          }),
          { status: 200 },
        ),
      );
    const gateway = new ModelGateway(transport);
    expect(await gateway.models('openai', 'private-key')).toEqual(['gpt-text']);
    expect(transport).toHaveBeenCalledWith(
      'https://api.openai.com/v1/models',
      expect.objectContaining({
        redirect: 'error',
        headers: expect.objectContaining({ Authorization: 'Bearer private-key' }),
      }),
    );
  });
  it('never returns a provider body containing a key', async () => {
    const gateway = new ModelGateway(
      jest.fn().mockResolvedValue(new Response('private-key', { status: 401 })),
    );
    try {
      await gateway.models('openai', 'private-key');
      throw new Error('expected rejection');
    } catch (error: any) {
      expect(error.getResponse()).toEqual(
        expect.objectContaining({ error: 'model_provider_error', provider_status: 401 }),
      );
      expect(JSON.stringify(error.getResponse())).not.toContain('private-key');
    }
  });
  it('requires real nonempty model output', async () => {
    const gateway = new ModelGateway(
      jest.fn().mockResolvedValue(new Response(JSON.stringify({ output: [] }), { status: 200 })),
    );
    await expect(gateway.generate('openai', 'key', 'gpt-text', 'hello')).rejects.toThrow();
  });
});
