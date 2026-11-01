/* P0-23 (BOT-A2; Gauntlet Claude 261025_1705; rebasat a l'assalt 261101) ·
   Capacitat 'versioClient': la versió mínima de l'app nativa que el node
   encara servix (2611011510_versio_minima_client.sql). L'app la pregunta en
   arrencar, abans de tindre sessió: la RPC és d'anon i d'authenticated, i va
   amb la capçalera de sempre (runtime.rpc). Sense servidor (seed o local) no
   hi ha mínim: null i cap petició. Un servidor sense la migració tampoc en té:
   l'esquema absent (el 404 de runtime.rpc) torna null. La resta d'errors (la
   xarxa, un tall, un 5xx) es propaguen tal qual: qui pregunta
   (src/natiu/versioMinima.js) no bloqueja mai per un error. */
import { getResolvedConfig, rpc } from './runtime.js';

const PLATAFORMES_NATIVES = new Set(['ios', 'android']);
/* Com la salut del node (auth.js, TOPALL_SALUT_MS): l'arrencada no espera
   ningú, però una petició penjada no ha de viure més que això. El topall és de
   cada petició, no de tota la pregunta: amb una sessió desada caducada, el 401
   renova el testimoni (fins a 12 s, auth.js) i torna a provar amb un altre
   topall (runtime.request), i la resposta pot arribar uns 22 s després
   d'obrir l'app. Per això CalActualitzar.jsx s'emporta el focus. */
const TOPALL_VERSIO_MS = 5000;
const LLARGARIA_MAXIMA_ENLLAC = 2048;

/* Coacció primitiva: només un enter ≥ 1 és un mínim, i només un text https
   sense espais, d'una llargària raonable, és un enllaç. Res més del cos passa. */
function versioDeLaFila(fila) {
  const versioMinima = fila?.versio_minima;
  if (!Number.isSafeInteger(versioMinima) || versioMinima < 1) return null;
  const text = typeof fila.enllac === 'string' ? fila.enllac.trim() : '';
  const enllac = text.length <= LLARGARIA_MAXIMA_ENLLAC && /^https:\/\/\S+$/i.test(text) ? text : null;
  return { versioMinima, enllac };
}

export async function versioMinimaClient(plataforma, config = {}) {
  if (!PLATAFORMES_NATIVES.has(plataforma)) return null;
  const { runtimeDataMode, hasSupabaseConfig } = getResolvedConfig(config);
  if (runtimeDataMode !== 'remote' || !hasSupabaseConfig) return null;
  let fila;
  try {
    fila = await rpc('versio_minima_client', { p_plataforma: plataforma }, config, { timeoutMs: TOPALL_VERSIO_MS });
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
  return versioDeLaFila(fila);
}
