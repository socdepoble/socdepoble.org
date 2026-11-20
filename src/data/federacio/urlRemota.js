/** Shared lexical public-HTTPS boundary. No DNS, fetch, clock or credentials.
 * Socket/DNS pinning is still required on servers; a public name is not an IP proof.
 * Literal IPs of every family are deliberately outside this public actor profile. */
const MAX_URL = 2048;
const IPV4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
const HOST_LDH = /^[a-z0-9.-]+$/;
const DOMINIS_LOCALS = Object.freeze(['localhost', 'localdomain', 'local', 'internal', 'home.arpa']);
export function urlRemota(valor) {
  if (typeof valor !== 'string' || valor.length < 12 || valor.length > MAX_URL || !valor.startsWith('https://')
    || /[\x00-\x20\x7f\\]/.test(valor)) return null;
  const authority = valor.slice(8).split(/[/?#]/, 1)[0];
  if (authority.includes('%') || /[^\x21-\x7e]/.test(authority)) return null;
  let url = null;
  try { url = new URL(valor); } catch { return null; }
  const host = url.hostname;
  if (url.protocol !== 'https:' || url.username || url.password || !host.includes('.') || host.endsWith('.')
    || host.length > 253 || !HOST_LDH.test(host) || host.split('.').some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) || url.href.length > MAX_URL
    || IPV4.test(host) || host.startsWith('[') || DOMINIS_LOCALS.some((d) => host === d || host.endsWith(`.${d}`))) return null;
  return url;
}

