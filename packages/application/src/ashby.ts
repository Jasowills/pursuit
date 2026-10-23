import { chromium, type Page } from 'playwright-core';
import { resolvePublic } from '@pursuit/discovery';
import type { ApplicationAdapter, Form, Payload, Receipt } from './contracts.js';
/** A deliberately bounded hosted-form adapter. Unsupported widgets stop for the user. */
export class AshbyAdapter implements ApplicationAdapter {
  constructor(
    private readonly page: Page,
    private readonly cleanup: () => Promise<void>,
  ) {}
  static async launch(url: string, executablePath: string) {
    const target = new URL(url);
    if (
      target.protocol !== 'https:' ||
      target.hostname !== 'jobs.ashbyhq.com' ||
      target.username ||
      target.password
    )
      throw new Error('unsupported_application_origin');
    const hosts = ['jobs.ashbyhq.com', 'api.ashbyhq.com'];
    const pins = await Promise.all(
      hosts.map(async (host) => ({ host, ...(await resolvePublic('https://' + host)) })),
    );
    const browser = await chromium.launch({
      executablePath,
      headless: true,
      chromiumSandbox: true,
      args: [
        '--no-proxy-server',
        `--host-resolver-rules=${pins.map((p) => `MAP ${p.host} ${p.address}`).join(',')}`,
      ],
    });
    try {
      const context = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: false });
      await context.route('**/*', (route) => {
        try {
          const u = new URL(route.request().url());
          return u.protocol === 'https:' && hosts.includes(u.hostname)
            ? route.continue()
            : route.abort('blockedbyclient');
        } catch {
          return route.abort('blockedbyclient');
        }
      });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!(await page.locator('input').count())) {
        const apply = page.getByRole('button', { name: /^(apply for this job|apply now)$/i });
        if ((await apply.count()) === 1) await apply.click();
      }
      return new AshbyAdapter(page, () => browser.close());
    } catch (e) {
      await browser.close();
      throw e;
    }
  }
  private async guard() {
    const u = new URL(this.page.url());
    if (u.protocol !== 'https:' || u.hostname !== 'jobs.ashbyhq.com')
      throw new Error('application_origin_changed');
    if (
      await this.page
        .locator('iframe[src*="recaptcha"],iframe[src*="hcaptcha"],[data-sitekey]')
        .count()
    )
      throw new Error('captcha_requires_user');
  }
  async observe(): Promise<Form> {
    await this.guard();
    const fields = await this.page.locator('input,textarea,select').evaluateAll((controls) =>
      controls
        .filter((node) => {
          const e = node as HTMLInputElement;
          return !['hidden', 'submit', 'button', 'reset'].includes(e.type) && !e.disabled;
        })
        .map((node, index) => {
          const e = node as HTMLInputElement;
          const label = (
            e.getAttribute('aria-label') ||
            Array.from(e.labels ?? [])
              .map((l) => l.textContent ?? '')
              .join(' ') ||
            e.getAttribute('placeholder') ||
            ''
          )
            .replace(/\s+/g, ' ')
            .trim();
          const raw =
            e.tagName === 'TEXTAREA' ? 'textarea' : e.tagName === 'SELECT' ? 'select' : e.type;
          return {
            id: `field-${index}`,
            label,
            type: raw,
            required: e.required || e.getAttribute('aria-required') === 'true',
            options:
              e.tagName === 'SELECT'
                ? Array.from((e as unknown as HTMLSelectElement).options).map((o) => o.value)
                : [],
          };
        }),
    );
    if (
      fields.some(
        (f) =>
          !f.label ||
          !['text', 'email', 'tel', 'url', 'textarea', 'select', 'checkbox', 'file'].includes(
            f.type,
          ),
      )
    )
      throw new Error('unsupported_or_ambiguous_form_field');
    if (!fields.length) throw new Error('application_form_not_found');
    return { url: this.page.url(), fields: fields as Form['fields'] };
  }
  async fill(payload: Payload, pdf: Uint8Array) {
    await this.guard();
    if (pdf.length > 2_500_000 || new TextDecoder().decode(pdf.slice(0, 5)) !== '%PDF-')
      throw new Error('invalid_resume_pdf');
    const form = await this.observe();
    for (const field of form.fields) {
      // Use exact accessible labels, never positional guesses.
      const target = this.page.getByLabel(field.label, { exact: true });
      if ((await target.count()) !== 1) throw new Error('ambiguous_field_requires_user');
      if (field.type === 'file') {
        if (/resume|cv/i.test(field.label))
          await target.setInputFiles({
            name: 'resume.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from(pdf),
          });
        else if (field.required) throw new Error('additional_document_required');
        continue;
      }
      const answer = payload.answers[field.id];
      if (answer === undefined) continue;
      if (field.type === 'checkbox') {
        if (typeof answer !== 'boolean') throw new Error('invalid_checkbox_answer');
        await target.setChecked(answer);
      } else if (field.type === 'select') {
        if (!field.options.includes(String(answer))) throw new Error('invalid_select_answer');
        await target.selectOption(String(answer));
      } else await target.fill(String(answer));
    }
  }
  async submit(): Promise<Receipt> {
    await this.guard();
    const before = await this.page
      .getByText(/application (?:has been )?(?:submitted|received)|thank you for applying/i)
      .count();
    if (before) throw new Error('confirmation_already_present');
    const button = this.page.getByRole('button', {
      name: /^(submit application|submit my application|apply)$/i,
    });
    if ((await button.count()) !== 1) throw new Error('submit_control_ambiguous');
    const accepted = this.page
      .waitForResponse(
        (r) =>
          r.request().method() === 'POST' &&
          ['jobs.ashbyhq.com', 'api.ashbyhq.com'].includes(new URL(r.url()).hostname) &&
          /application|submit/i.test(new URL(r.url()).pathname),
        { timeout: 30000 },
      )
      .catch(() => null);
    await button.click();
    const response = await accepted;
    if (!response || !response.ok()) throw new Error('submission_needs_verification');
    const confirmation = this.page
      .getByText(/application (?:has been )?(?:submitted|received)|thank you for applying/i)
      .first();
    await confirmation.waitFor({ state: 'visible', timeout: 15000 });
    await this.guard();
    return {
      kind: 'hosted_confirmation',
      url: this.page.url(),
      text: (await confirmation.innerText()).slice(0, 1000),
      acceptedPostStatus: response.status(),
      observedAt: new Date().toISOString(),
    };
  }
  async close() {
    await this.cleanup();
  }
}
