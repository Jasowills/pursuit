import { DirectGmailService } from '../src/direct-gmail.service';
import { CredentialVault } from '../src/credential-vault';

describe('direct Gmail OAuth', () => {
  const saved = {
    key: process.env['CONNECTION_ENCRYPTION_KEY'],
    id: process.env['GOOGLE_CLIENT_ID'],
    secret: process.env['GOOGLE_CLIENT_SECRET'],
  };
  const a = {
    tenantId: 'tenant',
    userId: 'user',
    email: 'fictional@example.test',
    displayName: 'Tester',
    sessionId: 'test',
  };
  const vault = new CredentialVault();
  const scope = { tenantId: a.tenantId, userId: a.userId };
  const connections: any = {
    vault,
    scope: () => scope,
    owner: (_a: unknown, provider: string) => `tenant:user:${provider}`,
  };
  const upsert = jest.fn().mockResolvedValue({});
  const findFirst = jest.fn();
  const db: any = {
    db: {
      userConnection: { upsert, findFirst, deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
    },
  };
  beforeEach(() => {
    process.env['CONNECTION_ENCRYPTION_KEY'] = 'b'.repeat(64);
    process.env['GOOGLE_CLIENT_ID'] = 'test-client';
    process.env['GOOGLE_CLIENT_SECRET'] = 'test-secret';
    jest.clearAllMocks();
  });
  afterAll(() => {
    for (const [key, value] of Object.entries({
      CONNECTION_ENCRYPTION_KEY: saved.key,
      GOOGLE_CLIENT_ID: saved.id,
      GOOGLE_CLIENT_SECRET: saved.secret,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  it('uses single-use state, PKCE and send-only Gmail permission', async () => {
    const service = new DirectGmailService(db, connections);
    const result = await service.connect(a);
    const url = new URL(result.redirect_url);
    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('scope')).toBe(
      'openid email https://www.googleapis.com/auth/gmail.send',
    );
    expect(url.searchParams.get('state')?.length).toBeGreaterThan(30);
    const stored = upsert.mock.calls[0][0].create.ciphertext;
    expect(stored).not.toContain(url.searchParams.get('state'));
  });
  it('rejects a forged callback before contacting Google', async () => {
    const service = new DirectGmailService(db, connections);
    findFirst.mockResolvedValue({
      id: 'pending',
      ciphertext: vault.seal(
        JSON.stringify({
          state: 'expected-state',
          verifier: 'secret',
          expires: Date.now() + 60000,
        }),
        'tenant:user:gmail_pending',
      ),
    });
    const transport = jest.spyOn(global, 'fetch');
    await expect(service.finish(a, 'fake-code', 'attacker-state')).rejects.toThrow();
    expect(transport).not.toHaveBeenCalled();
    transport.mockRestore();
    expect(db.db.userConnection.deleteMany).not.toHaveBeenCalled();
  });
});
