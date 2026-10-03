/**
 * estructural.js — Sentinella 1 · Estructural (permisos i Connexió Universal).
 *
 * Contrasta una instantània de la connexió (sessió, perfil i pertinences)
 * amb un contracte propi derivat de les migracions (CONTRACTE_CONNEXIO). Cada
 * fet del contracte cita la migració i el text exacte que el sosté: la capa
 * estàtica (estructural.migracions.test.js, candidata al pre-commit) comprova
 * que el text hi continua; si una migració el canvia, la prova cau abans que
 * el sentinella diga una cosa falsa.
 *
 * Proposa la reparació, mai l'aplica: completa_la_meua_alta() la crida la
 * persona des de l'app, amb la sessió iniciada. Pur: l'entrada és un JSON
 * que tria la persona (dades sintètiques a les proves).
 */
import { avis, esObjecte, fitxersTriats, llegixJson, textPle } from './comu.js';
import { FONTS_COMUNES, definixSentinella } from './contracte.js';

const INICIAL = 'supabase/migrations/2609080000_initial_schema.sql';
const IDENTITAT = 'supabase/migrations/2609261500_identitat_perfil_f1.sql';
const PATRO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* El contracte de la Connexió Universal, fet a fet, amb la seua evidència. */
export const CONTRACTE_CONNEXIO = Object.freeze({
  schema: 'sdp.connexio.v1',
  reparacio: 'completa_la_meua_alta',
  nomMaxim: 120,
  fets: Object.freeze([
    { id: 'perfil-clau', fitxer: INICIAL, evidencia: 'id uuid primary key references auth.users(id) on delete cascade', regla: 'El perfil té el mateix id que l’usuari de la sessió.' },
    { id: 'perfil-nom', fitxer: INICIAL, evidencia: 'char_length(btrim(full_name)) between 1 and 120', regla: 'El nom del perfil fa entre 1 i 120 caràcters sense espais als extrems.' },
    { id: 'perfil-visibilitat', fitxer: INICIAL, evidencia: "visibility text not null default 'private' check (visibility = 'private')", regla: 'El perfil és sempre privat.' },
    { id: 'pertinenca-clau', fitxer: INICIAL, evidencia: 'primary key (town_id, user_id)', regla: 'Una persona pertany com a molt una vegada a cada poble.' },
    { id: 'pertinenca-rol', fitxer: INICIAL, evidencia: "role text not null default 'member'", regla: 'Tota pertinença porta un rol (per defecte, member).' },
    { id: 'poble-obert', fitxer: INICIAL, evidencia: 'is_open boolean not null default true', regla: 'L’alta només unix a pobles oberts.' },
    { id: 'reparacio', fitxer: IDENTITAT, evidencia: 'create or replace function public.completa_la_meua_alta(p_tenant_id uuid default null)', regla: 'completa_la_meua_alta crea el perfil i la pertinença que falten; és idempotent.' },
    { id: 'reparacio-poble-tancat', fitxer: IDENTITAT, evidencia: 'v_tenant := private.resol_poble_alta(p_tenant_id::text, p_tenant_id is null);', regla: 'Amb un poble demanat, la reparació no prova el poble per defecte: si eixe poble està tancat, no unix ningú.' },
    { id: 'reparacio-autenticats', fitxer: IDENTITAT, evidencia: 'grant execute on function public.completa_la_meua_alta(uuid) to authenticated;', regla: 'Només la pot cridar una persona amb la sessió iniciada.' },
    { id: 'incidencies-alta', fitxer: IDENTITAT, evidencia: 'create table if not exists private.incidencies_alta', regla: 'L’alta que no ha pogut acabar deixa una incidència SDP-REG.' },
    { id: 'baixa', fitxer: IDENTITAT, evidencia: 'add column if not exists baixa_demanada_at timestamptz;', regla: 'Una baixa demanada és una quarantena: el perfil continua.' }
  ].map((fet) => Object.freeze(fet)))
});

const esUuid = (valor) => typeof valor === 'string' && PATRO_UUID.test(valor);

/* expires_at de la sessió: segons des de 1970 (com el servix l'autenticació), mil·lisegons o ISO. */
function caducitatDe(valor) {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor < 1e12 ? valor * 1000 : valor;
  if (typeof valor === 'string') {
    const ms = Date.parse(valor);
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

const reparacio = (tenant) => `${CONTRACTE_CONNEXIO.reparacio}(${tenant ? `'${tenant}'` : ''})`;

/**
 * @param {{ sessio?: object|null, perfil?: object|null, pertinences?: object[], pobles?: object[],
 *   tenantId?: string|null, incidenciaAlta?: { codi: string }|null }} entrada
 * @param {{ ara: number }} context
 */
export function observaEstructural(entrada, { ara }) {
  const avisos = [];
  const propostes = [];
  const e = esObjecte(entrada) ? entrada : {};
  const sessio = esObjecte(e.sessio) ? e.sessio : null;
  const tenant = e.tenantId ?? null;
  const tenantValid = tenant === null || esUuid(tenant);
  if (!tenantValid) {
    avisos.push(avis('EST-TENANT-INVALID', 'roja', 'La configuració porta un poble (tenantId) que no és un UUID: el backend el refusa i ningú no s’hi pot unir.', 'tenantId'));
  }
  const tancats = new Set((Array.isArray(e.pobles) ? e.pobles : []).filter((p) => esObjecte(p) && p.is_open === false).map((p) => p.id));
  /* Amb un poble tancat, completa_la_meua_alta('<poble>') no hi unix ningú (resol_poble_alta
     torna null i no prova el poble per defecte): la crida es proposa sense poble. */
  const tenantTancat = tenant !== null && tenantValid && tancats.has(tenant);
  const crida = reparacio(tenantValid && !tenantTancat ? tenant : null);
  const notaTancat = tenantTancat ? ' Sense poble només l’unix al poble per defecte, si n’hi ha un d’obert: el de la configuració està tancat.' : '';

  if (!sessio) {
    avisos.push(avis('EST-SENSE-SESSIO', 'info', 'No hi ha sessió iniciada: és una visita anònima i no hi ha perfil ni pertinences per contrastar.', 'sessio'));
    return { avisos, informe: 'Sense sessió: res a contrastar. Torna a observar després d’iniciar la sessió.' };
  }

  const uid = sessio.user?.id;
  if (!esUuid(uid)) {
    avisos.push(avis('EST-USUARI-INVALID', 'roja', 'La sessió no porta un identificador d’usuari vàlid (UUID): cap perfil ni pertinença hi pot casar.', 'sessio.user.id'));
  }
  const caduca = caducitatDe(sessio.expires_at);
  if (caduca !== null && caduca <= ara) {
    avisos.push(avis('EST-SESSIO-CADUCADA', 'groga', 'La sessió ha caducat: cal tornar a entrar abans de reparar res.', 'sessio.expires_at'));
  }

  const perfil = esObjecte(e.perfil) ? e.perfil : null;
  if (!perfil) {
    avisos.push(avis('EST-SENSE-PERFIL', 'roja', `La sessió no té perfil (public.profiles). Proposta: crida ${crida} des de l’app amb la sessió iniciada.`, 'perfil'));
    propostes.push('crear el perfil');
  } else {
    if (perfil.id !== uid) avisos.push(avis('EST-PERFIL-ALIE', 'roja', 'El perfil no és el de l’usuari de la sessió: l’app estaria mostrant dades d’una altra persona.', 'perfil.id'));
    const nom = typeof perfil.full_name === 'string' ? perfil.full_name.trim() : '';
    if (nom.length < 1 || nom.length > CONTRACTE_CONNEXIO.nomMaxim) {
      avisos.push(avis('EST-NOM-INVALID', 'groga', `El nom del perfil ha de fer entre 1 i ${CONTRACTE_CONNEXIO.nomMaxim} caràcters: el backend refusaria desar-lo.`, 'perfil.full_name'));
    }
    if (perfil.visibility !== undefined && perfil.visibility !== 'private') {
      avisos.push(avis('EST-VISIBILITAT', 'roja', 'El perfil no és privat i el contracte només admet «private».', 'perfil.visibility'));
    }
    if (perfil.consentiment_rgpd_at === null) {
      avisos.push(avis('EST-SENSE-CONSENTIMENT', 'groga', 'El perfil no té el consentiment de privacitat: l’app l’ha de tornar a demanar (passa després d’entrar amb Google).', 'perfil.consentiment_rgpd_at'));
    }
    if (textPle(perfil.baixa_demanada_at)) {
      avisos.push(avis('EST-BAIXA', 'info', 'La persona ha demanat la baixa: el perfil està en quarantena fins a la purga o fins que la cancel·le.', 'perfil.baixa_demanada_at'));
    }
  }

  const pertinences = (Array.isArray(e.pertinences) ? e.pertinences : []).filter(esObjecte);
  const propies = pertinences.filter((p) => p.user_id === uid);
  if (pertinences.length > propies.length) {
    avisos.push(avis('EST-PERTINENCA-ALIENA', 'roja', `${pertinences.length - propies.length} pertinences no són de l’usuari de la sessió: el client en veu de més.`, 'pertinences'));
  }
  const pobles = propies.map((p) => p.town_id);
  const repetits = pobles.filter((id, i) => pobles.indexOf(id) !== i);
  if (repetits.length) {
    avisos.push(avis('EST-PERTINENCA-REPETIDA', 'groga', 'Hi ha pertinences repetides al mateix poble: la clau (town_id, user_id) no ho admet; la instantània no és fiable.', 'pertinences'));
  }
  if (propies.some((p) => !textPle(p.role))) {
    avisos.push(avis('EST-ROL-BUIT', 'groga', 'Una pertinença no porta rol: el backend hi posa «member» per defecte.', 'pertinences.role'));
  }
  if (tenantTancat && !pobles.includes(tenant)) {
    avisos.push(avis('EST-POBLE-CONFIG-TANCAT', 'groga', `L’app està configurada per a un poble tancat: ${reparacio(tenant)} no hi unix ningú. Cal reobrir-lo o canviar la configuració, i ho decidix una persona.`, 'tenantId'));
  }
  if (!propies.length) {
    avisos.push(avis('EST-SENSE-POBLE', 'roja', `La persona no pertany a cap poble i no veurà les seccions. Proposta: crida ${crida} des de l’app.${notaTancat}`, 'pertinences'));
    propostes.push(tenantTancat ? 'unir-la al poble per defecte, si n’hi ha un d’obert' : 'unir-la al poble');
  } else if (tenant && tenantValid && !tenantTancat && !pobles.includes(tenant)) {
    avisos.push(avis('EST-POBLE-CONFIG', 'groga', `L’app està configurada per a un poble on la persona no consta. Proposta: crida ${reparacio(tenant)}.`, 'tenantId'));
    propostes.push('unir-la al poble de la configuració');
  }
  if (pobles.some((id) => tancats.has(id))) {
    avisos.push(avis('EST-POBLE-TANCAT', 'groga', 'La persona pertany a un poble tancat: l’alta nova no hi unix ningú; revisa si s’ha de reobrir.', 'pobles.is_open'));
  }
  if (esObjecte(e.incidenciaAlta) && textPle(e.incidenciaAlta.codi)) {
    avisos.push(avis('EST-INCIDENCIA-ALTA', 'groga', `L’alta va deixar la incidència ${e.incidenciaAlta.codi}: ${crida} la repara i l’esborra quan troba un poble obert.${notaTancat}`, 'incidenciaAlta.codi'));
  }

  const linies = [
    `Contracte ${CONTRACTE_CONNEXIO.schema}: ${CONTRACTE_CONNEXIO.fets.length} fets derivats de les migracions.`,
    `Perfil: ${perfil ? 'present' : 'absent'}. Pertinences pròpies: ${propies.length}.`,
    propostes.length
      ? `Reparació proposada (${propostes.join(', ')}): ${crida}. La crida la fa la persona des de l’app; el sentinella no la fa.`
      : 'Cap reparació necessària.'
  ];
  return { avisos, informe: linies.join('\n') };
}

/* L'entrada: un JSON amb la instantània (exportada de la Consola o feta a mà amb dades sintètiques). */
function preparaEstructural(fitxers) {
  const [fitxer] = fitxersTriats(fitxers);
  const dades = llegixJson(fitxer);
  return esObjecte(dades) ? dades : {};
}

export const SENTINELLA_ESTRUCTURAL = definixSentinella({
  id: 'sentinella.estructural',
  nom: 'Sentinella Estructural · Permisos i Connexió Universal',
  versio: '1.0.0',
  descripcio: 'Contrasta la sessió, el perfil i les pertinences amb el contracte derivat de les migracions i proposa la reparació (completa_la_meua_alta) sense aplicar-la.',
  disparador: [
    { tipus: 'arrencada-sessio', detall: 'En arrencar la sessió, amb la instantània de sessió, perfil i pertinences.' },
    { tipus: 'pre-commit', detall: 'Capa estàtica: estructural.migracions.test.js comprova que les migracions sostenen cada fet del contracte.' },
    { tipus: 'obrir-tauler', detall: 'Els informes de nit (RLS, migracions i dist-secrets) es calculen en obrir el Tauler l’endemà.' }
  ],
  llig: ['La instantània de connexió que tries (JSON): sessió, perfil, pertinences, pobles i incidència d’alta'],
  escriu: ['Res: només mostra les banderes i l’informe a la pantalla'],
  xarxa: 'cap',
  dadesPersonals: true,
  nivell: 'L0',
  eixida: ['bandera', 'informe'],
  superficie: { tipus: 'consola' },
  portaHumana: 'Proposa completa_la_meua_alta; la crida la fa la persona, amb la sessió iniciada, després de llegir l’avís.',
  proves: ['src/sections/tractors/sentinelles/estructural.test.js', 'src/sections/tractors/sentinelles/estructural.migracions.test.js'],
  llindars: {},
  fitxa: 'src/sections/tractors/sentinelles/fitxes/sentinella_estructural.md',
  fonts: [...FONTS_COMUNES, 'src/sections/tractors/sentinelles/estructural.js'],
  entrada: {
    etiqueta: 'Instantània de connexió (JSON)',
    ajuda: 'Sessió, perfil i pertinences tal com els veu l’app. Usa dades sintètiques per a provar-lo.',
    accepta: '.json,application/json',
    multiple: false,
    prepara: preparaEstructural
  },
  observa: observaEstructural
});
