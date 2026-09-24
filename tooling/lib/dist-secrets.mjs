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
