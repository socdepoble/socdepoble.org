/** Secret-bearing values, not the name of a database role in documentation.
 * Keep project URL and publishable-key restrictions from the deployment contract.
 * Diagnostics never return matched credentials.
 */
export function findDistSecrets(source) {
  const patterns = [
    [/https:\/\/[a-z0-9]{15,}\.supabase\.co/g, 'URL del projecte Supabase'],
    [/\bsb_(publishable|secret)_[A-Za-z0-9_-]{10,}/g, 'clau Supabase'],
    [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, 'JWT (possible service_role)']
  ];
  return patterns.flatMap(([pattern, label]) => {
    const count = source.match(pattern)?.length || 0;
    return count ? [{ label, count }] : [];
  });
}


/** Free (:fx) o clau Pro al costat del seu nom/capçalera. Cap valor al diagnòstic. */
export function findDeepLSecrets(source) {
  const uuid = '[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}';
  const free = new RegExp(`\\b${uuid}:fx\\b`, 'gi');
  const contextual = new RegExp(`(?:DeepL-Auth-Key\\s+|(?:VITE_)?DEEPL_API_KEY["']?\\s*[:,=]\\s*["']?)${uuid}(?!:fx)`, 'gi');
  const count = (source.match(free)?.length || 0) + (source.match(contextual)?.length || 0);
  return count ? [{label: 'possible clau DeepL', count}] : [];
}
