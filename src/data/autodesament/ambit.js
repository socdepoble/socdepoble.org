/* ═══════════════════════════════════════════════════════════════════
   T47 (ordre del Mestre, 260928) · L'ÀMBIT D'UN ESBORRANY

   Un esborrany és d'una persona en un backend: `backendScope` (endpoint,
   tenant, mode) + l'id de qui ha entrat. Cap esborrany passa d'un compte
   a un altre ni d'un poble a un altre.

   `ambitActual` es llig del port en el moment d'enviar (Model B: ni
   Supabase ni cap adaptador concret). Si no coincidix amb el de
   l'esborrany, la cua no l'envia: mai el text d'A amb la sessió de B.

   Qui ESCRIU un esborrany pren la persona de la sessió de React (useSession),
   no del port: amb el JWT caducat mentre es renova, el port diu «ningú»
   encara que la persona continue dins, i l'esborrany aniria a un àmbit que
   cap sessió no tindrà mai (T47, correcció de la revisió).
   ═══════════════════════════════════════════════════════════════════ */
import { getCurrentUser } from '../backendPort.js';
import { backendScope } from '../../config/backendConfig.js';

/** L'àmbit d'una persona en un backend, o null: sense persona no hi ha àmbit ni esborranys. */
export function ambitDe(config, usuariId) {
  if (usuariId == null || usuariId === '') return null;
  let scope;
  try { scope = backendScope(config || {}); } catch { return null; }
  return `${scope}|${String(usuariId)}`;
}

/** L'àmbit de la sessió viva per a esta configuració, o null si no hi ha ningú dins. */
export function ambitActual(config) {
  let usuari = null;
  try { usuari = getCurrentUser(); } catch { return null; }
  return usuari?.id != null ? ambitDe(config, usuari.id) : null;
}
