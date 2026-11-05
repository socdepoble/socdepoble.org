/** Entrada pròpia del paquet Node 0. La bandera es fixa en compilar; no es
 * llig cap declaració de l'amfitrió, preferència, hostname o token. */
export const NODE_ZERO_HTTP_ACTIU = import.meta.env?.VITE_SDP_NODE0_HTTP === '1';
export const NODE_ZERO_PRIVAT_ACTIU = import.meta.env?.VITE_SDP_NODE0_PRIVAT === '1';
export const TENANT_NODE_ZERO = 'ac3bec76-255b-5ca2-8886-28fcceab4267';

/** L'origen de la pàgina determina només l'URL, mai activa el backend. */
export function capaNodeZeroHttp(origen) {
  if (typeof origen !== 'string' || origen !== origen.trim()) throw new TypeError('Origen del Node 0 invàlid.');
  let url;
  try { url = new URL(origen); } catch { throw new TypeError('Origen del Node 0 invàlid.'); }
  if (origen !== url.origin || !(url.protocol === 'https:' || url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
    throw new TypeError('Origen del Node 0 invàlid.');
  }
  return Object.freeze({ backendId: 'sdp-node0-http', supabaseUrl: `${url.origin}/api/v1/node0`, tenantId: TENANT_NODE_ZERO, dataMode: 'remote' });
}

let preparacio = null;
let origenFixat = null;

/** S'espera abans de configura()/arrenca()/render. El transport injectat és
 * només una costura de proves interna: no rep tokens ni canvia l'endpoint.
 * Una fallada queda rebutjada; no es reintenta amb Supabase. */
export function preparaArrencadaNodeZero(origen = globalThis.location?.origin, { fetchImpl } = {}) {
  if (!NODE_ZERO_HTTP_ACTIU) return Promise.resolve(null);
  const capa = capaNodeZeroHttp(origen);
  if (origenFixat !== null && origenFixat !== origen) throw new Error('L’origen del Node 0 ja està fixat.');
  if (preparacio) return preparacio;
  origenFixat = origen;
  preparacio = (async () => {
    const [{ fixaCapaDelPaquet }, { injectaBackendDelPaquet }, { creaAdaptadorNodeZeroHttp }] = await Promise.all([
      import('../../config/capaDelPaquet.js'), import('../../host.js'), import('./adaptadorNodeZeroHttp.js')
    ]);
    fixaCapaDelPaquet(capa);
    let adaptador = creaAdaptadorNodeZeroHttp({ endpoint: capa.supabaseUrl, tenantId: capa.tenantId, ...(fetchImpl ? { fetchImpl } : {}) });
    let transport = null, privatActiu = false, motiuPrivat = 'bandera-apagada', rebut;
    try {
      if (NODE_ZERO_PRIVAT_ACTIU) {
        const [{ preparaClientPrivatNodeZero }, { creaSessioNodeZeroHttp }] = await Promise.all([
          import('./clientPrivatNodeZero.js'), import('./sessioNodeZeroHttp.js')
        ]);
        transport = creaSessioNodeZeroHttp({ endpoint: capa.supabaseUrl, origin: origen, ...(fetchImpl ? { fetchImpl } : {}) });
        const composicio = await preparaClientPrivatNodeZero({ publicAdapter: adaptador, transport, habilitaPrivat: true });
        privatActiu = composicio.privatActiu;
        motiuPrivat = composicio.motiu ?? null;
        adaptador = composicio.adapter;
        if (!privatActiu) { transport.destroy(); transport = null; }
      }
      // No host sees a partially prepared backend or an unverified identity.
      rebut = injectaBackendDelPaquet(adaptador);
    } catch (error) {
      adaptador.destroy();
      if (!privatActiu) transport?.destroy();
      throw error;
    }
    const operacions = adaptador.operacions;
    return Object.freeze({ actiu: true, capa, acceptats: Object.freeze([...rebut.acceptats]), lecturaPublica: true,
      privatSollicitat: NODE_ZERO_PRIVAT_ACTIU, privatActiu, motiuPrivat,
      escriptura: operacions.escriptura === true, autenticacio: operacions.autenticacio === true,
      xat: operacions.xatTempsReal === true, xatText: operacions.xatText === true, xatTempsReal: operacions.xatTempsReal === true });
  })();
  return preparacio;
}
