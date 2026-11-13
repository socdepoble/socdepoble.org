/**
 * abastConnexio.js — Qui pot vore una connexió i com s'aplica
 * (T43, ordre del Mestre, 260928).
 *
 * PRINCIPI: una connexió és sempre una nota privada del MAS de la persona.
 * La visibilitat és una TRIA desada a la nota (origen.abast) més uns PASSOS
 * de difusió que el sistema ja sap fer: enviar l'enllaç per xat a persones o
 * a grups de xat, o compartir-la al Mur des del lector del MAS («Compartir al
 * Mur», notes/ConnexioDetall.jsx, T54). Mai no es promet cap permís que el
 * servidor no aplique:
 *   · Privada: exacta (RLS de propietari en remot, IndexedDB en local).
 *   · Persones i Grups: són MISSATGES de xat; no es desfan canviant la nota.
 *   · Tot el poble: D1 Opció A (decisió del Mestre, 261112) · el Mur el
 *     pot llegir qualsevol persona, també sense compte (la política de
 *     lectura l'obri a anon des de 2611112005; la versió pública filtrada
 *     arriba amb el carril SQL de Codex). Sense servidor no hi ha Mur.
 * No s'escriu mai la tria dins de section_submissions.payload per a filtrar-la
 * al client: qualsevol membre del poble la podria llegir per REST. Quan una
 * connexió es compartix al Mur, el seu origen hi viatja sense `abast`:
 * mapSectionSubmissionToItem (data/mapejadorSeccions.js) hi aplica
 * origenPublic (data/origenNota.js) abans d'escriure la fila.
 *
 * Funcions pures, sense React ni xarxa. L'execució viu a useAplicaAbast.js.
 *
 * P1-22 (assalt 261101, T5b) · Els textos que es veuen ixen per un `t`
 * opcional (el traductor de la interfície): parells [clau, reserva] amb la
 * reserva valenciana lletra per lletra, i sense `t` el text de sempre. El
 * missatge de xat ix en la llengua de qui connecta (com section.connectar.
 * seguir.missatge). DES_DE no es traduïx: va al cos persistent de la nota.
 */
import { MODES_ABAST } from '../../data/origenNota.js';
import { CODI_ESQUEMA_ABSENT } from '../../data/errorsBackend.js';
import { omple } from '../../config/moderacio.js';

export { MODES_ABAST };

/* Sense traductor (proves pures, catàleg), la reserva valenciana. */
const senseTraductor = (_clau, reserva) => reserva;
/* Un parell traduït; un `t` que no és funció (null) dona la reserva. */
const text = (t, [clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva);

/* Els enviaments són irreversibles i el xat té límit de freqüència: pocs i en sèrie. */
export const LIMIT_PERSONES = 20;
export const LIMIT_GRUPS = 10;
/* El xat accepta 4096 caràcters per missatge (xat.js). */
export const MAXIM_MISSATGE = 4096;
const MAXIM_TITOL = 300;

/* T67 · Només els grups reben l'enllaç: una comunitat és un contenidor sense
   missatges (els seus fills són Avisos i els grups) i als Avisos (el canal)
   només hi escriuen els administradors. */
const TIPUS_GRUP_XAT = new Set(['grup']);

/** Com es diu cada objecte connectable a la interfície. */
export const ETIQUETA_OBJECTE = Object.freeze({
  publicacio: 'Publicació del Mur',
  producte: 'Producte del Mercat',
  esdeveniment: 'Esdeveniment de l’agenda',
  multimedia: 'Multimèdia',
  poble: 'Poble',
  persona: 'Persona',
  entitat: 'Entitat',
  grup: 'Grup',
  ia: 'Intel·ligència artificial',
  pagina: 'Pàgina',
  nota: 'Nota',
  carpeta: 'Carpeta',
  categoria: 'Categoria',
  etiqueta: 'Etiqueta'
});

/* P1-22 · Les mateixes etiquetes, en parells per al traductor. ETIQUETA_OBJECTE
   es queda: el llig Notes (ConnexioDetall, ConnexioFitxa). */
const PARELLS_OBJECTE = Object.freeze({
  publicacio: Object.freeze(['section.connectar.objecte.publicacio', ETIQUETA_OBJECTE.publicacio]),
  producte: Object.freeze(['section.connectar.objecte.producte', ETIQUETA_OBJECTE.producte]),
  esdeveniment: Object.freeze(['section.connectar.objecte.esdeveniment', ETIQUETA_OBJECTE.esdeveniment]),
  multimedia: Object.freeze(['section.connectar.objecte.multimedia', ETIQUETA_OBJECTE.multimedia]),
  poble: Object.freeze(['section.connectar.objecte.poble', ETIQUETA_OBJECTE.poble]),
  persona: Object.freeze(['section.connectar.objecte.persona', ETIQUETA_OBJECTE.persona]),
  entitat: Object.freeze(['section.connectar.objecte.entitat', ETIQUETA_OBJECTE.entitat]),
  grup: Object.freeze(['section.connectar.objecte.grup', ETIQUETA_OBJECTE.grup]),
  ia: Object.freeze(['section.connectar.objecte.ia', ETIQUETA_OBJECTE.ia]),
  pagina: Object.freeze(['section.connectar.objecte.pagina', ETIQUETA_OBJECTE.pagina]),
  nota: Object.freeze(['section.connectar.objecte.nota', ETIQUETA_OBJECTE.nota]),
  carpeta: Object.freeze(['section.connectar.objecte.carpeta', ETIQUETA_OBJECTE.carpeta]),
  categoria: Object.freeze(['section.connectar.objecte.categoria', ETIQUETA_OBJECTE.categoria]),
  etiqueta: Object.freeze(['section.connectar.objecte.etiqueta', ETIQUETA_OBJECTE.etiqueta])
});
const PARELL_ELEMENT = Object.freeze(['section.connectar.objecte.element', 'Element']);

/** Com es diu l'objecte a la interfície; un objecte desconegut (o «toString»), «Element». */
export function etiquetaObjecte(objecte, t = senseTraductor) {
  return text(t, Object.hasOwn(PARELLS_OBJECTE, objecte) ? PARELLS_OBJECTE[objecte] : PARELL_ELEMENT);
}

/* «des del Mur», «des de l'agenda»… (desDe) viu a notes/connexions.js, l'únic
   mòdul de l'arrencada que el demana (el cos persistent de la connexió).
   Onada R22 · BOOT3: importat d'ací, arrossegava tot este mòdul a l'arrencada. */
export { desDe } from '../notes/connexions.js';

/** Els grups de xat on la persona ja és: fils de tipus 'grup', no arxivats. */
export function grupsDeXat(fils, t = senseTraductor) {
  if (!Array.isArray(fils)) return [];
  return fils
    .filter((fil) => fil && fil.id != null && TIPUS_GRUP_XAT.has(fil.tipus) && !fil.arxivat)
    .map((fil) => ({ id: String(fil.id), nom: String(fil.name || fil.title || text(t, ['section.connectar.grups.senseNom', 'Grup sense nom'])) }));
}

/**
 * En quin punt està la llista de converses (XatContext): 'carregant' mentre
 * arriba, 'error' si no ha arribat (hi ha avís i cap fil) i, si no, 'llest'.
 * Sense `status` (un context sense xat), es dona per llesta.
 */
export function estatDelXat({ status, avis, fils } = {}) {
  if (status === 'loading') return 'carregant';
  const senseFils = !Array.isArray(fils) || fils.length === 0;
  return avis && senseFils ? 'error' : 'llest';
}

/**
 * Les quatre opcions de «Qui ho pot vore?», amb el text que diu la veritat
 * i, si no es pot triar, el motiu (`detall`). Forma de GrupOpcions.
 * `xat` (estatDelXat): una llista buida només vol dir «cap grup» quan el xat
 * ha carregat bé; mentre carrega o si ha fallat, es diu això.
 * P1-22 · `t` opcional: sense, els textos valencians de sempre.
 */
export function opcionsDAbast({ dataMode = 'remote', teSessio = false, grups = [], xat = 'llest', t = senseTraductor } = {}) {
  const remot = dataMode === 'remote';
  const tr = (parell) => text(t, parell);
  const senseComptes = tr(['section.connectar.abast.senseCompte', 'Entra amb el teu compte per a enviar-ho per xat.']);
  const nomesAci = tr(['section.connectar.abast.nomesAci', 'Sense servidor, el missatge es queda en este dispositiu: ningú més el rep.']);
  const senseGrups = Array.isArray(grups) ? grups.length === 0 : true;
  const motiuSenseGrups = xat === 'carregant' ? tr(['section.connectar.abast.grupsCarregant', 'Carregant els teus grups de xat…'])
    : xat === 'error' ? tr(['section.connectar.abast.xatNoDisponible', 'El xat no està disponible ara mateix.'])
      : tr(['section.connectar.abast.capGrup', 'Encara no eres en cap grup de xat.']);
  return [
    {
      valor: 'privada',
      etiqueta: tr(['section.connectar.private', 'Privada']),
      /* D1 (ordre del Mestre, 260930) · el verb és connectar, no guardar.
         261024 correccions (directiva del Mestre 15:05, Gemini G2-02) · res de
         «MAS» a la interfície: «a les teues notes». */
      ajuda: tr(['section.connectar.abast.privadaAjuda', 'Queda a les teues notes. Ningú més la veu.']),
      detall: remot ? undefined : tr(['section.connectar.abast.privadaLocal', 'Sense servidor, queda només en este dispositiu.'])
    },
    {
      valor: 'persones',
      etiqueta: tr(['section.connectar.abast.persones', 'Persones concretes']),
      ajuda: tr(['section.connectar.abast.personesAjuda', 'Tria gent del padró i li enviarem l’enllaç per xat. És un missatge, no un permís: no es pot desfer.']),
      desactivada: !teSessio,
      detall: !teSessio ? senseComptes
        : (remot ? omple(tr(['section.connectar.abast.personesLimit', 'Fins a {n} persones.']), { n: LIMIT_PERSONES }) : nomesAci)
    },
    {
      valor: 'grups',
      /* IDEA-14 (261024) · «de xat»: no són les entitats de tipus grup (el camí «Formar part»). */
      etiqueta: tr(['section.connectar.abast.grups', 'Grups de xat']),
      ajuda: tr(['section.connectar.abast.grupsAjuda', 'Enviarem l’enllaç als grups de xat on ja eres. És un missatge, no un permís: no es pot desfer.']),
      desactivada: !teSessio || senseGrups,
      detall: !teSessio ? senseComptes
        : senseGrups ? motiuSenseGrups
          : (remot ? omple(tr(['section.connectar.abast.grupsLimit', 'Fins a {n} grups.']), { n: LIMIT_GRUPS }) : nomesAci)
    },
    {
      valor: 'poble',
      etiqueta: tr(['section.connectar.abast.poble', 'Tot el poble']),
      ajuda: tr(['section.connectar.abast.pobleAjuda', 'No ix sola: obri la connexió a les teues notes i prem «Compartir al Mur». Al Mur la pot llegir qualsevol persona, també sense compte.']),
      desactivada: !remot || !teSessio,
      detall: !remot ? tr(['section.connectar.abast.pobleLocal', 'Sense servidor no es pot compartir al Mur.'])
        : (!teSessio ? tr(['section.connectar.abast.pobleSenseCompte', 'Entra amb el teu compte per a compartir-la al Mur.']) : undefined)
    }
  ];
}

/** El mode que es pot aplicar: si el triat està desactivat (o no existix), 'privada'. */
export function modeAplicable(mode, opcions) {
  const opcio = (opcions || []).find((o) => o.valor === mode);
  return opcio && !opcio.desactivada ? mode : 'privada';
}

function unics(llista, limit) {
  if (!Array.isArray(llista)) return [];
  const vistos = new Set();
  const fora = [];
  for (const desti of llista) {
    const id = desti?.id == null ? '' : String(desti.id);
    if (!id || vistos.has(id)) continue;
    vistos.add(id);
    fora.push({ ...desti, id, nom: String(desti.nom || id) });
    if (fora.length >= limit) break;
  }
  return fora;
}

/**
 * Els passos que cal fer després de connectar (crear la nota), en ordre. Els límits
 * s'apliquen ací: mai més de 20 persones ni de 10 grups.
 *   'xat-persona' → obrir (o reprendre) la conversa i enviar l'enllaç.
 *   'xat-grup'    → enviar l'enllaç al grup.
 *   'mur'         → no s'executa sol: la persona l'ha de compartir des del
 *                   lector del MAS («Compartir al Mur», T54).
 * P1-22 · El nom del pas del Mur es veu al resum: passa per `t`.
 */
export function passosDAplicacio(abast, t = senseTraductor) {
  if (!abast || typeof abast !== 'object') return [];
  if (abast.mode === 'persones') {
    return unics(abast.persones, LIMIT_PERSONES).map((desti) => ({ tipus: 'xat-persona', desti }));
  }
  if (abast.mode === 'grups') {
    return unics(abast.grups, LIMIT_GRUPS).map((desti) => ({ tipus: 'xat-grup', desti }));
  }
  if (abast.mode === 'poble') return [{ tipus: 'mur', desti: { id: 'mur', nom: text(t, ['section.connectar.resum.mur', 'El teu mur']) } }];
  return [];
}

/* P1-22 · Quatre frases senceres (amb autor o sense, amb enllaç o sense): cap
   tros enganxat, i cada llengua ordena la frase com li cal. */
const PLANTILLES_DEL_MISSATGE = Object.freeze({
  base: Object.freeze(['section.connectar.missatge.base', 'T’envie «{titol}», que he guardat a les meues notes.']),
  autor: Object.freeze(['section.connectar.missatge.autor', 'T’envie «{titol}» (de {autor}), que he guardat a les meues notes.']),
  enllac: Object.freeze(['section.connectar.missatge.enllac', 'T’envie «{titol}», que he guardat a les meues notes. Ho pots vore ací: {url}']),
  autorEnllac: Object.freeze(['section.connectar.missatge.autorEnllac', 'T’envie «{titol}» (de {autor}), que he guardat a les meues notes. Ho pots vore ací: {url}'])
});

/** El missatge de xat: què s'ha connectat, de qui és i on es veu. Mai més de 4096 caràcters.
 * P1-22 · Ix en la llengua de qui connecta (`t`); sense `t`, el valencià. */
export function missatgeDeConnexio({ titol = '', autorNom = '' } = {}, url = '', t = senseTraductor) {
  const nom = String(titol || text(t, ['section.connectar.missatge.senseTitol', 'un element'])).trim().slice(0, MAXIM_TITOL);
  const autor = autorNom ? String(autorNom).trim().slice(0, MAXIM_TITOL) : '';
  const clau = autorNom ? (url ? 'autorEnllac' : 'autor') : (url ? 'enllac' : 'base');
  /* 261024 correccions (G2-02) · qui el rep no sap què és el «MAS»: les meues notes.
     omple() fa una sola passada: un títol amb «{url}» no s'hi torna a omplir. */
  return omple(text(t, PLANTILLES_DEL_MISSATGE[clau]), { titol: nom, autor, url }).slice(0, MAXIM_MISSATGE);
}

/**
 * D10 · Sense la migració 2609272100 el servidor no té la columna notes.origen
 * i rebutja la connexió amb un error de PostgREST. Es diu clar, sense el
 * missatge cru. La resta d'errors passen tal qual.
 * ENX-16 (261006) · Primer el codi neutral (error.codi 'esquema-absent'),
 * que pot portar qualsevol adaptador; la regex de PostgREST queda de reserva.
 * P1-22 · Els dos textos propis passen per `t`; un missatge cru que no és
 * d'esquema passa tal qual, com abans.
 */
export function missatgeDeLError(error, t = senseTraductor) {
  const missatge = String(error?.message || '');
  const columnaOrigen = error?.codi === CODI_ESQUEMA_ABSENT
    || (/origen/i.test(missatge) && /PGRST204|42703|column|columna/i.test(missatge));
  if (columnaOrigen) {
    return text(t, ['section.connectar.error.esquema', 'El servidor d’este poble encara no admet connexions: falta aplicar-hi la migració de l’origen de les notes. La connexió no s’ha fet.']);
  }
  return missatge || text(t, ['section.connectar.error.generic', 'No s’ha pogut connectar. Torna-ho a provar.']);
}

/** El registre del que s'ha fet de veres, per a origen.abast.aplicat. */
export function aplicatDe(resultats, ara = new Date()) {
  const fets = (resultats || []).filter((r) => r.estat === 'fet');
  return {
    persones: fets.filter((r) => r.tipus === 'xat-persona').map((r) => r.id),
    grups: fets.filter((r) => r.tipus === 'xat-grup').map((r) => r.id),
    mur: fets.some((r) => r.tipus === 'mur'),
    al: ara.toISOString()
  };
}
