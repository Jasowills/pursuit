import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = {
  vus: 5,
  duration: '10s',
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<500'] },
};
const base = 'http://127.0.0.1:4401/api/v1';
export function setup() {
  const r = http.post(
    `${base}/auth/dev-login`,
    JSON.stringify({
      email: `load-${Date.now()}@pursuit.test`,
      display_name: 'Disposable load tester',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (r.status !== 201) throw new Error('Isolated test sign-in failed');
  return { token: r.json('token') };
}
export default function (data) {
  const headers = { Authorization: `Bearer ${data.token}` };
  for (const path of ['/profile', '/jobs', '/watchers']) {
    const r = http.get(base + path, { headers });
    check(r, { 'authenticated list succeeds': (r) => r.status === 200 });
  }
  sleep(0.2);
}
