import { expect, test, vi } from 'vitest';
import { performance } from 'node:perf_hooks';
import { configTelemetria } from './telemetria.js';

test('a64KiB configured endpoint does not backtrack over nonfinal slash runs or perform requests', () => {
  const prefix = 'https://compta.example/';
  const host = prefix + '/'.repeat(65536 - prefix.length - 1) + 'x';
  expect(new TextEncoder().encode(host).length).toBe(65536);
  const request = vi.spyOn(globalThis, 'fetch');
  try {
    const times = [];
    for (let i = 0; i < 7; i++) {
      const start = performance.now();
      const cfg = configTelemetria({ VITE_UMAMI_WEBSITE_ID: '00000000-0000-4000-8000-000000000001', VITE_UMAMI_HOST: host });
      times.push(performance.now() - start);
      expect(cfg.host).toBe(host); expect(cfg.actiu).toBe(true);
    }
    expect(Math.max(...times)).toBeLessThan(25);
    expect(request).not.toHaveBeenCalled();
  } finally { request.mockRestore(); }
});
test('trailing slash normalization retains exact existing URL semantics', () => {
  for (const [value, expected] of [['https://compta.example////', 'https://compta.example'], ['https://compta.example/a///', 'https://compta.example/a'], ['https://compta.example/a///x', 'https://compta.example/a///x'], ['https://user:pass@compta.example/', ''], ['http://compta.example/', '']]) {
    expect(configTelemetria({ VITE_UMAMI_HOST: value }).host).toBe(expected);
  }
});
