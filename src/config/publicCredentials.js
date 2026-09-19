/**
 * Validar que una URL i una clau de Supabase són exclusivament públiques i inofensives.
 * S'utilitza tant en build-time (Node) com en runtime (Navegador).
 */
export function validatePublicCredentials(supabaseUrl, anonKey) {
  if (!supabaseUrl || !anonKey) {
    return; // Si no hi ha credencials explícites, deleguem en la configuració per defecte.
  }

  // Validar forma de l'URL
  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      throw new Error(`ATURADOR CRÍTIC: URL de Supabase invàlida o no segura (${supabaseUrl}).`);
    }
  } catch (err) {
    throw new Error('ATURADOR CRÍTIC: URL de Supabase malformada.');
  }

  // Validar ANON KEY per evitar fugues de service_rol o altres secrets
  if (typeof anonKey === 'string') {
    if (anonKey.includes('sb_secret_')) {
      throw new Error('ATURADOR CRÍTIC: La clau conté marcadors de secret (sb_secret_).');
    }
    
    if (anonKey.includes('.')) {
      const parts = anonKey.split('.');
      if (parts.length >= 2) {
        let payload = null;
        try {
          const isNode = typeof process !== 'undefined' && process.release?.name === 'node';
          const payloadBuffer = isNode && typeof Buffer !== 'undefined'
            ? Buffer.from(parts[1], 'base64')
            : { toString: () => typeof atob !== 'undefined' ? decodeURIComponent(escape(atob(parts[1]))) : '' };
          
          let payloadString = payloadBuffer.toString();
          
          if (payloadString) {
            payload = JSON.parse(payloadString);
          }
        } catch(e) {
           // Si falla el parsing, és possible que no siga un JWT estàndard. Ignorem ací.
        }
        
        if (payload && payload.role === ['service', 'role'].join('_')) {
          throw new Error("ATURADOR CRÍTIC: Has posat la clau d'administració a l'anon key! Risc massiu d'exfiltració de dades.");
        }
      }
    }
  }
}
