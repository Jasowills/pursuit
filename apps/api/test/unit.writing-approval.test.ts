import { Test } from '@nestjs/testing';
import { WorkflowService, workflowHash, EditableContent } from '../src/workflow.service';
import { DbService } from '../src/db.service';
import { ConnectionsService } from '../src/connections.service';
import { GmailService } from '../src/gmail.service';
import { CareersService } from '../src/careers.service';
import { DiscoveryService } from '../src/discovery.service';
import type { SessionPrincipal } from '../src/auth.service';
import type { WorkflowDraft } from '@pursuit/database';

const clean = {
  resume: 'Alex Morgan\nTested REST APIs using SQL and Postman.',
  cover_letter: 'I tested REST APIs with SQL and Postman. Could we discuss the role?',
  match_explanation: 'The supplied resume documents API testing.',
  gaps: [],
  recipient: 'recruiter@example.com',
  outreach: {
    subject: 'QA role at Example',
    body: 'I tested REST APIs with SQL. Could we discuss the QA role?',
  },
};
const principal: SessionPrincipal = {
  userId: 'user',
  tenantId: 'tenant',
  sessionId: 'session',
  email: 'user@example.com',
  displayName: 'Alex Morgan',
};
function saved(content: typeof clean): WorkflowDraft {
  return {
    id: 'draft',
    automationKey: null,
    tenantId: 'tenant',
    userId: 'user',
    jobId: 'job',
    connectionId: 'connection',
    model: 'fixture',
    sourceResume: clean.resume,
    content,
    status: 'DRAFT',
    approvalHash: null,
    expiresAt: null,
    receipt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
describe('writing checks at exact-message approval', () => {
  const account = jest.fn().mockResolvedValue({ id: 'account', status: 'ACTIVE', disabled: false });
  const updateMany = jest.fn().mockResolvedValue({ count: 1 });
  let service: WorkflowService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        WorkflowService,
        { provide: DbService, useValue: { db: { workflowDraft: { updateMany } } } },
        {
          provide: ConnectionsService,
          useValue: { scope: () => ({ tenantId: 'tenant', userId: 'user' }) },
        },
        { provide: GmailService, useValue: { account } },
        { provide: CareersService, useValue: {} },
        { provide: DiscoveryService, useValue: {} },
      ],
    }).compile();
    service = module.get(WorkflowService);
  });
  it.each(['cover_letter', 'subject', 'body'])(
    'rejects unwanted wording in %s without approving or rewriting',
    async (field) => {
      const content = structuredClone(clean);
      if (field === 'cover_letter') content.cover_letter = 'I build scalable systems.';
      else if (field === 'subject') content.outreach.subject = 'A role\u2014and a question';
      else content.outreach.body = 'I have a proven track record.';
      const before = structuredClone(content);
      jest.spyOn(service, 'get').mockResolvedValue(saved(content));
      await expect(service.approve(principal, 'draft', 'hash')).rejects.toMatchObject({
        response: { error: 'writing_review_required' },
      });
      expect(content).toEqual(before);
      expect(account).not.toHaveBeenCalled();
      expect(updateMany).not.toHaveBeenCalled();
    },
  );
  it('binds approval to the unchanged reviewed content when the writing checks pass', async () => {
    const content = structuredClone(clean);
    jest.spyOn(service, 'get').mockResolvedValue(saved(content));
    const hash = workflowHash(EditableContent.parse(content), 'account');
    await service.approve(principal, 'draft', hash);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ approvalHash: hash, status: 'APPROVED' }),
      }),
    );
    expect(content).toEqual(clean);
  });
});
