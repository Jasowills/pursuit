import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));
vi.mock('node:dns/promises', () => ({ lookup: mocks.lookup }));
vi.mock('node:https', () => ({ request: mocks.request }));
vi.mock('node:http', () => ({ request: mocks.request }));
import { createReader, resolvePublic } from '../src/transport.js';
function response(status = 200, headers: Record<string, string> = {}, body = '{}') {
  mocks.request.mockImplementationOnce((_url, _options, callback) => {
    const req = new EventEmitter() as any;
    req.destroy = (error: Error) => {
      req.emit('error', error);
      req.emit('close');
    };
    req.end = () =>
      queueMicrotask(() => {
        const res = new EventEmitter() as any;
        res.statusCode = status;
        res.headers = headers;
        res.destroy = (error?: Error) => {
          if (error) res.emit('error', error);
        };
        callback(res);
        res.emit('data', Buffer.from(body));
        res.emit('end');
        req.emit('close');
      });
    return req;
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
});
describe('network trust boundary', () => {
  it('rejects mixed public/private DNS results before opening a socket', async () => {
    mocks.lookup.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ]);
    await expect(createReader()('https://example.com')).rejects.toThrow('private_source_address');
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it.each([
    'http://localhost',
    'http://user:secret@example.com',
    'http://example.com:8080',
    'file:///etc/passwd',
  ])('rejects unsafe input %s', async (url) => {
    await expect(resolvePublic(url)).rejects.toThrow();
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('pins the public DNS address into the actual socket lookup', async () => {
    response();
    await createReader({ minHostDelayMs: 0 })('https://example.com');
    const callback = vi.fn();
    mocks.request.mock.calls[0][1].lookup('example.com', { all: true }, callback);
    expect(callback).toHaveBeenCalledWith(null, [{ address: '93.184.216.34', family: 4 }]);
    expect(mocks.lookup).toHaveBeenCalledTimes(1);
  });
  it('revalidates a redirect and blocks metadata/private destinations', async () => {
    response(302, { location: 'http://169.254.169.254/latest/meta-data/' });
    mocks.lookup
      .mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }])
      .mockResolvedValueOnce([{ address: '169.254.169.254', family: 4 }]);
    await expect(createReader({ minHostDelayMs: 0 })('https://example.com')).rejects.toThrow(
      'private_source_address',
    );
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });
  it('never forwards a search credential across origins', async () => {
    response(302, { location: 'https://other.example/search' });
    await expect(
      createReader({ minHostDelayMs: 0 })('https://example.com', {
        headers: { 'X-Subscription-Token': 'fixture-secret' },
      }),
    ).rejects.toThrow('credential_redirect_blocked');
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });
  it('does not follow a page redirect onto a different robots policy', async () => {
    response(302, { location: 'https://other.example/careers' });
    await expect(
      createReader({ minHostDelayMs: 0 })('https://example.com', { sameOriginOnly: true }),
    ).rejects.toThrow('cross_origin_page_redirect_blocked');
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });
  it('follows same-host redirects without deadlocking its rate queue', async () => {
    response(302, { location: '/new' });
    response(200, {}, 'ok');
    expect((await createReader({ minHostDelayMs: 0 })('https://example.com')).body).toBe('ok');
  });
  it('rejects an oversized streaming response', async () => {
    response(200, {}, '123456');
    await expect(
      createReader({ maxBytes: 5, minHostDelayMs: 0 })('https://example.com'),
    ).rejects.toThrow('source_too_large');
  });
  it('terminates a stalled request', async () => {
    mocks.request.mockImplementationOnce(() => {
      const req = new EventEmitter() as any;
      req.end = () => {};
      req.destroy = (error: Error) => {
        req.emit('error', error);
        req.emit('close');
      };
      return req;
    });
    await expect(
      createReader({ timeoutMs: 10, minHostDelayMs: 0 })('https://example.com'),
    ).rejects.toThrow('source_timeout');
  });
});
