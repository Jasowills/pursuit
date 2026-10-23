import { DiscoveryRequest } from '../src/discovery.service';
import { WorkflowService } from '../src/workflow.service';
import { Source, Job } from '@pursuit/discovery';
describe('discovery API boundary', () => {
  it('requires source-specific fields and rejects arbitrary options or embedded credentials', () => {
    expect(DiscoveryRequest.safeParse({ provider: 'lever' }).success).toBe(false);
    expect(DiscoveryRequest.safeParse({ provider: 'himalayas' }).success).toBe(false);
    expect(
      DiscoveryRequest.safeParse({
        provider: 'greenhouse',
        board: 'acme',
        headers: { Authorization: 'x' },
      }).success,
    ).toBe(false);
    expect(
      DiscoveryRequest.safeParse({ provider: 'page', url: 'http://user:secret@example.com' })
        .success,
    ).toBe(false);
  });
  it('imports more than 25 observations and retains source provenance', async () => {
    const careers = {
      getProfile: jest.fn().mockResolvedValue({}),
      intakeJob: jest.fn().mockImplementation(async (_tenant, input) => ({
        job: { id: input.posting_id },
        deduped: false,
        match: null,
      })),
    };
    const source = Source.parse({
      id: 'gh:fixture',
      provider: 'greenhouse',
      board: 'fixture',
      company: 'Fixture',
      url: 'https://boards-api.greenhouse.io/v1/boards/fixture/jobs',
    });
    const jobs = Array.from({ length: 40 }, (_, i) =>
      Job.parse({
        provider: 'greenhouse',
        sourceId: source.id,
        externalId: String(i),
        title: 'Engineer',
        company: 'Fixture',
        sourceUrl: `https://example.com/jobs/${i}`,
        applyUrl: null,
        description: 'Build systems',
        location: null,
        workplace: 'unknown',
        applicantCountries: [],
        countryEvidence: null,
        timezoneRestrictions: null,
        raw: { id: i },
        publishedAt: null,
        updatedAt: null,
        validThrough: null,
        compensation: null,
        employmentType: null,
        evidence: {
          url: `https://example.com/jobs/${i}`,
          method: 'fixture',
          parserVersion: 'test',
          observedAt: new Date().toISOString(),
        },
      }),
    );
    const discovery = {
      fetch: jest.fn().mockResolvedValue({
        source,
        poll: { jobs, complete: true, diagnostics: [], observedAt: new Date().toISOString() },
      }),
    };
    const workflow = new WorkflowService(
      {} as never,
      {} as never,
      {} as never,
      careers as never,
      discovery as never,
    );
    const result = await workflow.discover(
      { tenantId: 'tenant', userId: 'user' } as never,
      'fixture',
    );
    expect(result.imported).toBe(40);
    expect(result.complete).toBe(true);
    expect(careers.intakeJob.mock.calls[0][2].source.raw).toEqual({ id: 0 });
    expect(careers.intakeJob.mock.calls[0][2].userId).toBe('user');
  });
});
