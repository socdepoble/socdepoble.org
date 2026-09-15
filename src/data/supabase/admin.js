import { getResolvedConfig, rpc } from './runtime.js';
export async function adminListUsers(limit = 100, offset = 0, config = {}) {
  if (!getResolvedConfig(config).hasSupabaseConfig) return [];
  const rows = await rpc('admin_list_users', { p_limit: limit, p_offset: offset }, config);
  return Array.isArray(rows) ? rows : [];
}
export async function adminListOrganizations(config = {}) {
  if (!getResolvedConfig(config).hasSupabaseConfig) return [];
  const rows = await rpc('admin_list_organizations', {}, config); return Array.isArray(rows) ? rows : [];
}
