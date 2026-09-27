import { getRuntimePolicy } from './runtimePolicy.js';
import { resolveDataMode } from './dataMode.js';

/** Host aliases are normalised once, independently of any vendor adapter. */
export function normalizeBackendConfig(config = {}) {
  const base = getRuntimePolicy(true)?.backendConfig || {};
  const merged = { ...base, ...config };
  const backendUrl = config.backend_url ?? config.backendUrl ?? config.supabaseUrl
    ?? base.backendUrl ?? base.supabaseUrl ?? '';
  const normalized = { ...merged, backendUrl: String(backendUrl).replace(/\/$/, ''),
    supabaseUrl: String(backendUrl).replace(/\/$/, ''),
    tenantId: config.tenant_id ?? config.tenantId ?? base.tenantId ?? null,
    backendId: merged.backendId || 'supabase', dataMode: merged.dataMode || 'remote' };
  return { ...normalized, dataMode: resolveDataMode(normalized) };
}

/** Include the full endpoint (WordPress may share an origin) and tenant. */
export function backendScope(config = {}) {
  const c = normalizeBackendConfig(config);
  let endpoint = '';
  if (c.backendUrl) {
    const url = new URL(c.backendUrl);
    if (url.username || url.password || url.search || url.hash
      || !(url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) {
      throw new Error('Endpoint de backend invàlid.');
    }
    endpoint = url.href.replace(/\/$/, '');
  }
  return 'backend:' + JSON.stringify([c.backendId, endpoint, c.tenantId, c.dataMode]);
}
