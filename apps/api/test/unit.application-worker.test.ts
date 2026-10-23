import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ApplicationQueue, formHash } from '@pursuit/application';
import { ApplicationExecutionService } from '../src/application-execution.service';
import { digest } from '@pursuit/tailoring';
it('revokes pending worker authorizations when membership has been removed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'pursuit-worker-grant-'));
  const old = process.env.APPLICATION_STORAGE_DIR;
  process.env.APPLICATION_STORAGE_DIR = root;
  const tenant = '00000000-0000-4000-8000-000000000001',
    user = '00000000-0000-4000-8000-000000000002';
  const path = join(root, tenant, user, 'queue.sqlite');
  const q = new ApplicationQueue(path);
  const pdf = new TextEncoder().encode('%PDF-test');
  const row = await q.add({
    personId: user,
    jobUrl: 'https://jobs.ashbyhq.com/example/role',
    packetHash: 'a'.repeat(64),
    pdfHash: await digest(pdf),
    formHash: await formHash({ url: 'https://jobs.ashbyhq.com/example/role', fields: [] }),
    answers: {},
  });
  q.policy(true);
  q.authorize(row.id, row.payload_hash);
  q.close();
  const service = new ApplicationExecutionService(
    { db: { membership: { findFirst: jest.fn().mockResolvedValue(null) } } } as never,
    {} as never,
  );
  const run = jest.spyOn(service, 'run');
  try {
    await service.tick();
    expect(run).not.toHaveBeenCalled();
    const persisted = new ApplicationQueue(path);
    expect(persisted.get(row.id).state).toBe('DRAFT');
    expect(persisted.get(row.id).approval).toBeNull();
    persisted.close();
  } finally {
    if (old === undefined) delete process.env.APPLICATION_STORAGE_DIR;
    else process.env.APPLICATION_STORAGE_DIR = old;
    await rm(root, { recursive: true, force: true });
  }
});
