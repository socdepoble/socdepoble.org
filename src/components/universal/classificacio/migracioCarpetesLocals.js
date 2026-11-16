/**
 * migracioCarpetesLocals.js · Onada R30 · PF-01 (decisió de MarIA, pla R30 §4) ·
 * Les carpetes de Notes creades abans de la correcció de R29 es van quedar només
 * al navegador: creaCarpetaNotes codificava el cos dues vegades, el servidor
 * responia 404 (PGRST202) i creaCarpetaCreada les desava amb un slug local
 * (f-festes) al seu àmbit de carpetesCreades.js.
 *
 * Amb sessió real (mode remot, la persona del port i l'àmbit de Notes de la
 * mateixa persona), cada inici de sessió puja pel port neutral
 * (creaCarpetaNotes, capacitat `carpetesNotes`) les carpetes de l'àmbit que no
 * tenen rèplica remota, i només les dona per migrades quan la resposta porta
 * l'id del servidor. La RPC és idempotent pel nom (únic per poble, propietari
 * i lower(nom)): dos inicis, dues pestanyes o un reintent després d'un ACK
 * perdut tornen la mateixa carpeta, mai una de nova.
 *
 * No destructiu: la carpeta local no s'esborra ni es reescriu mai. La
 * confirmació va a un registre a banda, per àmbit:
 *   { v: 1, ambits: { '<ambit>': [{ local: 'f-festes', remot: 'f-<uuid>' }] } }
 * Si falla (xarxa, servidor sense la migració 76, quota), no s'apunta res i es
 * torna a provar en el pròxim inici. Cap error ix d'ací ni es mostra cap avís.
 *
 * Les notes continuen apuntant a l'id local, que és la carpeta que es pinta.
 * Perquè el Bloc es veja igual (Llei del Píxel), la rèplica remota que encara
 * no té cap nota no es pinta dues vegades al costat de la local
 * (repliquesAmagades / senseRepliques). Re-apuntar les notes a l'id del
 * servidor és una altra decisió (informe R30, d2_pf01_migracio_carpetes).
 * Onada R30 · PF-01 (àrbitre) · El mateix filtre per a tots els que pinten les
 * carpetes del Bloc (useCarpetesDelBlocVisibles): la columna i l'editor de
 * Notes, Connectar, el detall de la connexió i l'assignació d'emojis. Cap no
 * ensenya la rèplica com una opció nova, i cap nota no s'hi pot moure des
 * d'este dispositiu (dues «Festes» al Bloc).
 * Onada R32 · Invariants R31 traslladats (Codex R31 lot_03 · P2-T3), sense la RPC ni la
 * reescriptura d'ids de la PF-01 de Codex R30 (rebutjada):
 * - Llegat ambigu: una carpeta local amb un id reservat (f-<uuid> o de sèrie) que és
 *   l'slug del seu nom va nàixer al navegador abans de la reserva de carpetesCreades.js.
 *   Sense prova remota no es puja ni es reescriu: queda pendent amb diagnòstic (`ambigues`).
 * - ACK per col·lisió: un ACK que apunta a una carpeta coneguda amb un altre nom no és la
 *   rèplica d'esta (colisiona).
 */
import { useMemo, useSyncExternalStore } from 'react';
import { STORAGE_PREFIX, getVal, setVal } from '../../../config/storage.js';
import { NOTE_FOLDERS_SEED } from '../../../data/carpetesSeed.js';
import { nomDeCarpetaValid } from '../../../data/carpetesNotes.js';
import {
  AMBITS_MAXIMS, CARPETES_MAXIMES, ambitDeCarpetes, carpetesCreades, clauDeNom, esIdReservat, slugDelNom, useCarpetesCreades
} from './carpetesCreades.js';

export const CLAU_CARPETES_MIGRADES = 'classificacio-carpetes-migrades';
/** El motiu del diagnòstic d'una carpeta del llegat ambigu (el mateix literal que el kit R31). */
export const MOTIU_AMBIGUA = 'identificador-reservat-sense-prova-remota';
/** El motiu del diagnòstic d'un ACK que xoca amb una carpeta coneguda d'un altre nom. */
export const MOTIU_COLISIO = 'ack-amb-id-d-una-altra-carpeta';
const VERSIO = 1;
const LLARGADA_MAXIMA_ID = 100;
const LLARGADA_MAXIMA_AMBIT = 200;
/* La forma dels ids de carpetesCreades.js (slug local o id de servidor). */
const PATRO_ID = /^f-[a-z0-9]+(?:-[a-z0-9]+)*$/;
/* L'id que posa el servidor (note_folders: 'f-' || gen_random_uuid()); el
   mateix patró que carpetaDeFila (src/data/carpetesNotes.js). Una carpeta de
   l'àmbit amb esta forma ja va nàixer al servidor (creaCarpetaCreada, R12). */
const ID_DE_SERVIDOR = /^f-[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const IDS_DE_SERIE = new Set(NOTE_FOLDERS_SEED.map((carpeta) => carpeta.id));
const MODES_DEL_NAVEGADOR = new Set(['seed', 'local']);
const CAP = Object.freeze([]);

const mapaBuit = () => Object.create(null);
const BUIT = Object.freeze({ v: VERSIO, ambits: Object.freeze(mapaBuit()) });
const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const esAmbitValid = (ambit) => typeof ambit === 'string' && ambit.length > 0 && ambit.length <= LLARGADA_MAXIMA_AMBIT;
const esIdValid = (id) => typeof id === 'string' && id.length <= LLARGADA_MAXIMA_ID && PATRO_ID.test(id) && !IDS_DE_SERIE.has(id);
const esIdDeServidor = (id) => typeof id === 'string' && ID_DE_SERVIDOR.test(id);
/* Onada R30 · PF-01 (àrbitre, P3) · Una rèplica és una carpeta local (slug) i l'id que li ha
   posat el servidor (f-<uuid>): mai la mateixa, mai un slug que haja tornat un adaptador. */
const esEntradaValida = (entrada) => esObjecte(entrada) && esIdValid(entrada.local) && !esIdDeServidor(entrada.local)
  && esIdDeServidor(entrada.remot);
/* La clau de nom en NFC: el servidor desa el nom normalitzat (nomDeCarpetaValid). */
const clauNfc = (nom) => clauDeNom(String(nom ?? '').normalize('NFC'));

/** Només àmbits i entrades vàlids, una per id local, dins dels límits; la resta es descarta. */
export function normalitzaCarpetesMigrades(cru) {
  if (!esObjecte(cru) || cru.v !== VERSIO || !esObjecte(cru.ambits)) return BUIT;
  const ambits = mapaBuit();
  let quants = 0;
  for (const [ambit, llista] of Object.entries(cru.ambits)) {
    if (quants >= AMBITS_MAXIMS) break;
    if (!esAmbitValid(ambit) || !Array.isArray(llista)) continue;
    const vistos = new Set();
    const bones = [];
    for (const entrada of llista) {
      if (bones.length >= CARPETES_MAXIMES) break;
      if (!esEntradaValida(entrada) || vistos.has(entrada.local)) continue;
      vistos.add(entrada.local);
      bones.push(Object.freeze({ local: entrada.local, remot: entrada.remot }));
    }
    if (bones.length) {
      ambits[ambit] = Object.freeze(bones);
      quants += 1;
    }
  }
  return Object.freeze({ v: VERSIO, ambits: Object.freeze(ambits) });
}

let cache = null;
const oients = new Set();
const estat = () => {
  if (!cache) cache = normalitzaCarpetesMigrades(getVal(CLAU_CARPETES_MIGRADES, null));
  return cache;
};
const avisa = () => oients.forEach((oient) => oient());

/** Les rèpliques confirmades d'un àmbit (llista congelada i estable entre lectures). */
export function repliquesDeCarpetes(ambit) {
  return estat().ambits[ambitDeCarpetes(ambit)] ?? CAP;
}

/**
 * Apunta que el servidor ha confirmat la rèplica d'una carpeta local. Torna a
 * llegir el storage abans de fusionar (una altra pestanya pot haver-ne apuntat
 * mentrestant) i és idempotent: un id local que ja hi és no es duplica ni
 * canvia de rèplica. Torna true si la rèplica queda apuntada.
 */
export function registraReplica(ambit, { local, remot } = {}) {
  const clau = ambitDeCarpetes(ambit);
  const entrada = { local: String(local ?? ''), remot: String(remot ?? '') };
  if (!esEntradaValida(entrada)) return false;
  cache = null;
  const actuals = repliquesDeCarpetes(clau);
  if (actuals.some((r) => r.local === entrada.local)) return true;
  if (actuals.length >= CARPETES_MAXIMES) return false;
  const ambits = Object.assign(mapaBuit(), estat().ambits);
  /* Com carpetesCreades.js: un àmbit nou quan ja n'hi ha el màxim fa lloc traient el més antic. */
  if (!(clau in ambits) && Object.keys(ambits).length >= AMBITS_MAXIMS) delete ambits[Object.keys(ambits)[0]];
  ambits[clau] = [...actuals, entrada];
  const nou = normalitzaCarpetesMigrades({ v: VERSIO, ambits });
  /* Si el storage no l'ha guardada (mode privat, quota), no es dona per migrada:
     es tornarà a demanar al servidor, que torna la mateixa carpeta. */
  if (!setVal(CLAU_CARPETES_MIGRADES, nou)) {
    cache = null;
    return false;
  }
  cache = nou;
  avisa();
  return true;
}

/**
 * Les carpetes locals de l'àmbit que encara no tenen rèplica remota: ni han
 * nascut al servidor (id de servidor), ni són de sèrie, ni hi ha confirmació.
 */
export function carpetesPendentsDeMigrar(ambit) {
  const migrades = new Set(repliquesDeCarpetes(ambit).map((r) => r.local));
  return carpetesCreades(ambit).filter((carpeta) => !ID_DE_SERVIDOR.test(carpeta.id)
    && !IDS_DE_SERIE.has(carpeta.id) && !migrades.has(carpeta.id));
}

/**
 * Onada R32 · R31 · El llegat ambigu de l'àmbit: les carpetes locals amb un id reservat que és
 * l'slug del seu nom («Mur» → f-mur, un nom UUID → f-<uuid>), nascudes al navegador abans de la
 * reserva. La forma de l'id no prova que siguen remotes ni de sèrie, i les notes que hi apunten no
 * es poden distingir: no es pugen ni es reescriuen. Una de servidor (R12) té un id que no és el del
 * seu nom i no hi entra.
 */
export function carpetesAmbiguesDeMigrar(ambit) {
  return carpetesCreades(ambit).filter((carpeta) => esIdReservat(carpeta.id) && carpeta.id === slugDelNom(carpeta.nom))
    .map((carpeta) => Object.freeze({ id: carpeta.id, motiu: MOTIU_AMBIGUA }));
}

/* L'ACK: la carpeta que torna el port porta l'id que posa el servidor (f-<uuid>, com
   carpetaDeFila), que no és l'id local, i el mateix nom (el servidor conserva el que
   ja tenia si només canvia la caixa).
   Onada R30 · PF-01 (àrbitre, P3) · Un adaptador que tornara l'id local o un altre slug
   no ha escrit res al servidor: no és cap ACK. El mateix contracte que el registre
   (esEntradaValida), en un sol lloc. */
const esAck = (resposta, carpeta) => esObjecte(resposta) && esEntradaValida({ local: carpeta.id, remot: resposta.id })
  && typeof resposta.nom === 'string' && clauNfc(resposta.nom) === clauNfc(carpeta.nom);

/* Onada R32 · R31 (guarda d'ACK per col·lisió) · Un ACK que apunta a una carpeta que ja coneixem
   amb un altre nom no és la rèplica d'esta: ni una carpeta de l'àmbit amb eixe id (la rèplica
   apuntada l'amagaria del Bloc, repliquesAmagades), ni la rèplica ja apuntada d'una altra carpeta
   local (dues carpetes en una). Només compta la divergència provada; el registre es torna a
   llegir (una altra pestanya pot haver-hi apuntat mentrestant). */
function colisiona(ambit, carpeta, remot) {
  const clau = clauNfc(carpeta.nom);
  const locals = carpetesCreades(ambit);
  const divergix = (id) => locals.some((c) => c.id === id && clauNfc(c.nom) !== clau);
  if (divergix(remot)) return true;
  cache = null;
  return repliquesDeCarpetes(ambit).some((r) => r.remot === remot && r.local !== carpeta.id && divergix(r.local));
}

/* Pre-validació local amb la mateixa regla de l'adaptador: un nom que el port
   rebutjaria (caràcters de control) no ix cap a la xarxa ni para les altres. */
const nomPujable = (nom) => {
  try {
    return nomDeCarpetaValid({ nom });
  } catch {
    return null;
  }
};

/* Les pendents de l'àmbit que no es pujaran mai sense canviar-los el nom (vegeu noMigrables). */
const quantesNoMigrables = (ambit) => carpetesPendentsDeMigrar(ambit).filter((carpeta) => !nomPujable(carpeta.nom)).length;

const enCurs = new Map();
const intentades = new Set();
const omes = (motiu) => Object.freeze({ estat: 'omes', motiu, migrades: 0, pendents: 0, noMigrables: 0 });

/* Onada R32 · R31 · L'estat de l'àmbit en acabar (o en parar): `pendents` són les que falten per
   pujar més les ambigües, que també són pendents però no ixen mai cap a la xarxa sense una decisió
   humana; `ambigues` (només si n'hi ha) en porta el diagnòstic. `colisions` (només si n'hi ha) diu
   quins ACK d'esta pujada s'han descartat per col·lisió: la carpeta continua pendent i no es perd
   en silenci que el port ha tornat l'id d'una altra carpeta. */
function resum(ambit, estat, migrades, colisions = CAP) {
  const ambigues = carpetesAmbiguesDeMigrar(ambit);
  const pendents = carpetesPendentsDeMigrar(ambit).length + ambigues.length;
  return Object.freeze({
    estat: estat ?? (pendents ? 'pendent' : 'fet'), migrades, pendents, noMigrables: quantesNoMigrables(ambit),
    ...(ambigues.length ? { ambigues: Object.freeze(ambigues) } : {}),
    ...(colisions.length ? { colisions: Object.freeze([...colisions]) } : {})
  });
}

/**
 * Puja les carpetes locals pendents de l'àmbit de Notes, una vegada per entrada
 * de sessió i pestanya. No rebutja mai.
 * @param {{ scopeKey: string, entrada?: number|null, config: object }} abast l'àmbit de Notes (NotesDataContext · token)
 * @param {string} usuariId la persona de la sessió (propietària de l'àmbit)
 * @param {{ port?: object }} [opcions] el port (per defecte, src/data/backendPort.js)
 * Onada R30 · PF-01 (àrbitre, P3) · `noMigrables` compta les pendents que no es pujaran mai
 * sense canviar-los el nom: un nom que el port rebutja (nomDeCarpetaValid: caràcters de
 * format \p{Cf}, com la unió ZWJ d'un emoji compost o el guionet tou). Continuen sent
 * pendents (també compten en `pendents`) i la carpeta local es queda; canviar-ne el nom és
 * una decisió humana. Es compta sobre l'estat final, com `pendents`, també si la pujada para.
 * Onada R32 · R31 · `ambigues` (només si n'hi ha) diu quines carpetes del llegat ambigu queden
 * pendents sense eixir cap a la xarxa (carpetesAmbiguesDeMigrar); també compten en `pendents`.
 * `colisions` (només si n'hi ha) diu quins ACK d'esta pujada s'han descartat per col·lisió.
 * @returns {Promise<{ estat: 'omes'|'res'|'fet'|'pendent'|'interromput', motiu?: string, migrades: number, pendents: number, noMigrables: number, ambigues?: Array<{ id: string, motiu: string }>, colisions?: Array<{ id: string, remot: string, motiu: string }> }>}
 */
export function migraCarpetesLocals({ scopeKey, entrada = null, config } = {}, usuariId, { port = null } = {}) {
  const ambit = scopeKey;
  /* Només amb sessió real: una persona, un àmbit seu (el scopeKey de Notes porta
     l'id de qui l'ha obert) i un mode que no és el del navegador. */
  if (!esAmbitValid(ambit) || typeof usuariId !== 'string' || !usuariId || !ambit.includes(usuariId)) return Promise.resolve(omes('sense-sessio'));
  if (!esObjecte(config) || MODES_DEL_NAVEGADOR.has(config.dataMode)) return Promise.resolve(omes('sense-sessio'));
  if (enCurs.has(ambit)) return enCurs.get(ambit);
  /* Res per pujar: «res», o només el llegat ambigu, que es diagnostica sense tocar el port. */
  if (!carpetesPendentsDeMigrar(ambit).length) {
    return Promise.resolve(carpetesAmbiguesDeMigrar(ambit).length ? resum(ambit, 'pendent', 0)
      : Object.freeze({ estat: 'res', migrades: 0, pendents: 0, noMigrables: 0 }));
  }
  /* Una vegada per entrada: el que falla es torna a provar en el pròxim inici, no en cada càrrega del Bloc. */
  const intent = `${ambit}\u0000${entrada}`;
  if (entrada !== null && intentades.has(intent)) return Promise.resolve(omes('ja-intentada'));
  intentades.add(intent);
  const feina = puja(ambit, config, usuariId, port)
    .catch(() => resum(ambit, 'pendent', 0))
    .finally(() => enCurs.delete(ambit));
  enCurs.set(ambit, feina);
  return feina;
}

async function puja(ambit, config, usuariId, portDonat) {
  const port = portDonat ?? await import('../../../data/backendPort.js');
  const mateixaPersona = () => {
    try {
      return port.getCurrentUser?.()?.id === usuariId;
    } catch {
      return false;
    }
  };
  let remot = false;
  try {
    remot = port.teCapacitat?.('carpetesNotes') === true && port.getRuntimeDataMode?.(config) === 'remote';
  } catch {
    remot = false;
  }
  /* Sense la capacitat, o amb un adaptador que no escriu al servidor, cap ACK seria de veres. */
  if (!remot) return omes('sense-capacitat');
  let migrades = 0;
  const colisions = [];
  for (const carpeta of carpetesPendentsDeMigrar(ambit)) {
    /* Una sessió que canvia a mitges (eixir, un altre compte) para la pujada:
       les carpetes d'un àmbit mai van al compte d'una altra persona. */
    if (!mateixaPersona()) return resum(ambit, 'interromput', migrades, colisions);
    /* Una altra pestanya l'ha pujada mentrestant. */
    if (!carpetesPendentsDeMigrar(ambit).some((c) => c.id === carpeta.id)) continue;
    const nom = nomPujable(carpeta.nom);
    if (!nom) continue;
    let resposta;
    try {
      resposta = await port.creaCarpetaNotes({ nom }, config);
    } catch {
      /* Xarxa, servidor sense la migració, permís: es conserva tot i es para fins al pròxim inici. */
      break;
    }
    if (!esAck(resposta, carpeta)) continue;
    if (colisiona(ambit, carpeta, resposta.id)) {
      colisions.push(Object.freeze({ id: carpeta.id, remot: resposta.id, motiu: MOTIU_COLISIO }));
      continue;
    }
    if (registraReplica(ambit, { local: carpeta.id, remot: resposta.id })) migrades += 1;
  }
  return resum(ambit, undefined, migrades, colisions);
}

/**
 * Els ids de les rèpliques que no s'han de pintar: la carpeta local d'origen
 * encara es pinta i cap nota carregada no apunta a la rèplica. Una cadena (ids
 * separats per salts de línia, buida si no n'hi ha cap): estable entre
 * pintades, perquè els useMemo del Bloc no es tornen a calcular amb cada nota.
 */
export function repliquesAmagades(repliques, locals, notes) {
  if (!Array.isArray(repliques) || !repliques.length) return '';
  const origens = new Set((Array.isArray(locals) ? locals : CAP).map((c) => String(c?.id)));
  const amagades = new Set(repliques.filter((r) => origens.has(r.local) && r.remot !== r.local).map((r) => r.remot));
  if (!amagades.size) return '';
  for (const nota of Array.isArray(notes) ? notes : CAP) {
    if (nota?.folderId != null) amagades.delete(String(nota.folderId));
    if (!amagades.size) return '';
  }
  return [...amagades].sort().join('\n');
}

/** La llista de carpetes sense les rèpliques amagades (la mateixa llista si no n'hi ha cap). */
export function senseRepliques(carpetes, amagades) {
  if (!amagades || !Array.isArray(carpetes)) return carpetes;
  const ids = new Set(amagades.split('\n'));
  const filtrades = carpetes.filter((carpeta) => !ids.has(String(carpeta?.id)));
  return filtrades.length === carpetes.length ? carpetes : filtrades;
}

/* Una altra pestanya ha apuntat rèpliques (o ha buidat el storage): es torna a llegir i s'avisa. */
let escoltaStorage = null;
function enCanviDeStorage(event) {
  if (event?.key != null && event.key !== STORAGE_PREFIX + CLAU_CARPETES_MIGRADES) return;
  cache = null;
  avisa();
}

export function subscriuCarpetesMigrades(oient) {
  oients.add(oient);
  if (!escoltaStorage && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    escoltaStorage = enCanviDeStorage;
    window.addEventListener('storage', escoltaStorage);
  }
  return () => {
    oients.delete(oient);
    if (!oients.size && escoltaStorage && typeof window !== 'undefined') {
      window.removeEventListener('storage', escoltaStorage);
      escoltaStorage = null;
    }
  };
}

/** Les rèpliques confirmades d'un àmbit, vives (useSyncExternalStore). */
export function useRepliquesDeCarpetes(ambit) {
  const llig = () => repliquesDeCarpetes(ambit);
  return useSyncExternalStore(subscriuCarpetesMigrades, llig, llig);
}

/**
 * Onada R30 · PF-01 (àrbitre, P2) · Les carpetes del Bloc (noteFolders, tal com arriben del
 * port) sense les rèpliques amagades de l'àmbit: el filtre únic de tots els que les pinten
 * (NotesSection, NotesEditor, ConnectarSection, ConnexioDetall i AssignacioEmoji). Cada un hi
 * aplica després la seua regla de sempre (carpetesDelBloc, opcionsDeCarpetes...). Torna la
 * mateixa llista (la mateixa referència) si no n'amaga cap: els useMemo de qui la rep no es
 * tornen a calcular. Viu ací, fora de NotesDataContext, perquè no pese en l'arrencada.
 */
export function useCarpetesDelBlocVisibles(noteFolders, notes, ambit) {
  const repliques = useRepliquesDeCarpetes(ambit);
  const locals = useCarpetesCreades(ambit);
  const amagades = useMemo(() => repliquesAmagades(repliques, locals, notes), [repliques, locals, notes]);
  return useMemo(() => senseRepliques(noteFolders, amagades), [noteFolders, amagades]);
}

/** Només per a proves: oblida la memòria del mòdul (com una recàrrega de la pàgina). */
export function _reiniciaMigracioCarpetes() {
  cache = null;
  enCurs.clear();
  intentades.clear();
}
