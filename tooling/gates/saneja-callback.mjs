#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';

/* Executa el script que es desplega: la presència d'una cadena no prova
   l'ordre ni la semàntica de les validacions d'origen. Cap xarxa ni finestra. */
const callbackPath = join(dirname(fileURLToPath(import.meta.url)), '../../public/auth/callback.html');
try {
  const html = readFileSync(callbackPath, 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  if (scripts.length !== 1) throw new Error('El relé ha de contindre un únic script auditable.');
  const script = scripts[0][1];
  const casos = [
    ['https://socdepoble.org', 'auth.socdepoble.org', true],
    ['https://auth.socdepoble.org', 'auth.socdepoble.org', true],
    ['https://sollutia.cat', 'auth.socdepoble.org', true],
    ['https://socdepoble.sollutia.com', 'auth.socdepoble.org', true],
    ['http://localhost:3340', 'localhost', true],
    ['http://localhost:3340', 'auth.socdepoble.org', false],
    ['http://localhost:9999', 'localhost', false],
    ['ftp://localhost:3340', 'localhost', false],
    ['http://socdepoble.org', 'auth.socdepoble.org', false],
    ['https://socdepoble.org.atacant.invalid', 'auth.socdepoble.org', false],
    ['https://socdepoble.org:444', 'auth.socdepoble.org', false],
    ['https://persona:secret@socdepoble.org', 'auth.socdepoble.org', false],
    ['https://socdepoble.org/cami', 'auth.socdepoble.org', false],
    ['https://socdepoble.org?next=https://alie.invalid', 'auth.socdepoble.org', false],
    ['https://socdepoble.org#fragment', 'auth.socdepoble.org', false]
  ];
  for (const [origen, hostname, acceptat] of casos) {
    for (const falla of [false, true]) {
      const enviats = [], ubicacions = [], historial = [], elements = new Map();
      const getElementById = id => {
        if (!elements.has(id)) elements.set(id, { hidden: false, textContent: '', href: '' });
        return elements.get(id);
      };
      const params = new URLSearchParams({ sdp_origin: origen, ...(falla
        ? { error: 'access_denied', error_description: 'sentinella-error' } : { code: 'sentinella-code' }) });
      const estat = { marcador: 'conservat' };
      runInNewContext(script, { URL, URLSearchParams, setTimeout: () => 0,
        document: { getElementById }, window: {
          location: { hostname, search: `?${params}`, pathname: '/auth/callback.html', replace: url => ubicacions.push(url) },
          history: { state: estat, replaceState: (...args) => historial.push(args) }, close() {},
          opener: { postMessage: (...args) => enviats.push(args) }
        }
      }, { timeout: 1000 });
      if (Boolean(enviats.length) !== acceptat || ubicacions.length || enviats.length > 1) throw new Error('El relé ha incomplit la matriu d’orígens.');
      if (enviats.length && enviats[0][1] !== origen) throw new Error('El destí del postMessage ha canviat.');
      if (historial.length !== 1 || historial[0][0] !== estat || historial[0][2] !== '/auth/callback.html') throw new Error('El relé conserva paràmetres d’entrada a l’historial.');
    }
  }
  console.log(`✅ [SANEJAMENT] ${casos.length * 2} contraproves reals del relé: orígens exactes i historial net.`);
} catch (error) {
  console.error('❌ [SANEJAMENT]', error.message);
  process.exitCode = 1;
}
