/**
 * xatSeed.js — Llavor del Xat per al mode seed.
 *
 * T63.1 (decisió del Mestre, 260928): fora les persones i les converses
 * inventades. La llavor només porta identitats reals del projecte:
 *   · el padró de contactes: «Javi» (la persona pilot, AGENTS_MAP.JAVI),
 *     l'entitat «Sóc de Poble» i la IAIA MarIA;
 *   · la conversa de benvinguda de la IAIA (T3): un fil de tipus 'iaia' on
 *     ella respon sola amb la frase fixa d'identitatsSeed;
 *   · la COMUNITAT «Sóc de Poble», que naix de la Pàgina Universal de
 *     l'entitat pilot (el camp `subjecte` la nomena), amb tres fills: el canal
 *     «Avisos», on només escriu l'entitat, el grup «General» i el grup «Beta
 *     testers» (FIL_BETA_TESTERS; Auditoria 261007 (B): la capçalera en
 *     comptava dos). La comunitat és un contenidor sense missatges propis
 *     (ultimSeq 0); els fills la porten a `comunitatId`.
 * Tots els fils porten `comunitatId` i `subjecte` (null si no en tenen), com
 * mana el contracte del Xat.
 *
 * L'entitat signa els seus missatges com a participant virtual (`esEntitat`):
 * la llavor no posa cap persona inventada darrere. L'últim avís es queda sense
 * llegir perquè la interfície pinte el distintiu. Les hores són relatives al
 * moment de construir la llavor: les del dia -2 i -1 són fixes, les d'avui van
 * cap arrere des d'ara.
 *
 * La persona que mira («jo») no té identificador fix: `construeixLlavorXat(joId)`
 * el substituïx allà on toca. Els identificadors de la IAIA, de l'entitat
 * pilot i de Javi vénen d'identitatsSeed i agentsSeed, perquè el perfil, el
 * xat i el Mercat parlen de la mateixa identitat.
 */
import { BENVINGUDA_IAIA, ENTITAT_PILOT_ID, IAIA_ID, PERSONA_PILOT, entitatSeed } from './identitatsSeed.js';
import { AGENTS_MAP } from './agentsSeed.js';
import { ID_FIL_BETA_TESTERS_LLAVOR } from './xatsPerDefecte.js';
import { rutaDePerfil } from '../config/navigation.js';

const DIA_MS = 86400000;

const JAVI = AGENTS_MAP.JAVI.id;
const IAIA = IAIA_ID;
const ENTITAT = ENTITAT_PILOT_ID;
/* Front 3 (261013) · La fitxa de l'entitat pilot es busca pel seu id, no per
   la posició: el padró d'entitats ja en porta més d'una (Rentonar). */
const PILOT = entitatSeed(ENTITAT_PILOT_ID);
const FIL_IAIA = '7c2a1d9e-3b4f-4a5c-9d6e-1f2a3b4c5d04';
/* Identificadors nous: els acabats en 01, 02, 03 i 05 eren de les converses
   retirades i no es tornen a fer servir. */
const FIL_COMUNITAT = '7c2a1d9e-3b4f-4a5c-9d6e-1f2a3b4c5d06';
const FIL_AVISOS = '7c2a1d9e-3b4f-4a5c-9d6e-1f2a3b4c5d07';
const FIL_GENERAL = '7c2a1d9e-3b4f-4a5c-9d6e-1f2a3b4c5d08';
/* Onada 6 · L'id viu a xatsPerDefecte.js: «Informa d'un error» el reconeix
   sense importar esta llavor. */
const FIL_BETA_TESTERS = ID_FIL_BETA_TESTERS_LLAVOR;

/* Marcador de la persona que mira; es substituïx en construir la llavor. */
const JO = 'jo';

export const XAT_SEED_IDS = Object.freeze({
  javi: JAVI, iaia: IAIA, entitat: ENTITAT,
  filIaia: FIL_IAIA, filComunitat: FIL_COMUNITAT, filAvisos: FIL_AVISOS, filGeneral: FIL_GENERAL, filBetaTesters: FIL_BETA_TESTERS
});

/* Noms de qui escriu o de qui es pot parlar (la IAIA i l'entitat signen els seus missatges). */
export const XAT_SEED_NOMS = Object.freeze({
  [JAVI]: AGENTS_MAP.JAVI.avatarName,
  [IAIA]: AGENTS_MAP.IAIA.name,
  [ENTITAT]: PILOT.name
});

/* Padró del poble: a qui es pot escriure. La persona pilot, l'entitat pilot i
   la IAIA, cadascú amb el seu tipus perquè la interfície ho diga.
   Front 3 (261013) · Rentonar no hi és: este padró és el que llisten
   «Conversa nova» i el Cercador (els tres fundacionals de l'Onada 10), i
   afegir-la és una decisió del Mestre. «Escriu-li al xat» de la seua fitxa
   l'obri igualment: com crea_fil_directe, localXat.creaFilDirecte accepta
   qualsevol entitat del padró d'entitats (identitatsSeed · ENTITATS_SEED).
   En la llavor ningú no l'administra (rolALEntitat), i ningú no contesta.
   Onada 12 (261011; ordres 261011_0130, punt 3, D-09) · Javi porta la foto del
   padró pilot (PERSONA_PILOT.avatar, identitatsSeed.js), la mateixa del seu
   perfil, del Cercador i de les targetes que signa. Fins ara anava sense
   avatar perquè el catàleg d'agents li posava el logotip de l'entitat i els
   confonia; des de l'Onada 11 el catàleg ja porta la foto. Es llig de la taula
   d'identitats, mai d'una ruta escrita ací. */
export const XAT_SEED_MEMBRES = Object.freeze([
  Object.freeze({ usuariId: JAVI, nom: XAT_SEED_NOMS[JAVI], tipus: 'persona', avatarUrl: PERSONA_PILOT.avatar }),
  Object.freeze({ usuariId: ENTITAT, nom: XAT_SEED_NOMS[ENTITAT], tipus: 'entitat', avatarUrl: PILOT.logo_url }),
  Object.freeze({ usuariId: IAIA, nom: XAT_SEED_NOMS[IAIA], tipus: 'ia', avatarUrl: AGENTS_MAP.IAIA.avatar_url })
]);

/* La Pàgina Universal d'on naix la comunitat: el perfil públic de l'entitat
   pilot, amb la mateixa ruta que fa servir la resta de l'app. */
const SUBJECTE_ENTITAT = Object.freeze({
  tipus: 'entitat', id: ENTITAT, ruta: rutaDePerfil('entitat', ENTITAT), titol: PILOT.name
});

const idMissatge = (n) => `a1b2c3d4-0000-4000-8000-${String(n).padStart(12, '0')}`;

function iniciDelDia(ara) {
  const d = new Date(ara);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Construïx la llavor per a una persona concreta.
 * @param {string} joId identificador de qui mira el xat
 * @param {number} ara instant de referència (per a les proves)
 * @returns {{ fils: object[], participants: object[], missatges: object[] }}
 */
export function construeixLlavorXat(joId, ara = Date.now()) {
  const dia = iniciDelDia(ara);
  const a = (dies, hh, mm) => new Date(dia - dies * DIA_MS + hh * 3600000 + mm * 60000).toISOString();
  const fa = (minuts) => new Date(ara - minuts * 60000).toISOString();
  const qui = (id) => (id === JO ? joId : id);
  let n = 0;
  const m = (filId, autor, creatAl, text, extra = {}) => ({
    id: idMissatge(++n),
    filId,
    usuariId: qui(autor),
    autorNom: autor === JO ? null : XAT_SEED_NOMS[autor],
    text,
    tipus: 'text',
    respostaA: null,
    editatAl: null,
    esborratAl: null,
    metadades: {},
    esIA: autor === IAIA,
    comOrgId: null,
    creatAl,
    ...extra
  });
  /* Un missatge de l'entitat: el signa ella mateixa, com a participant virtual. */
  const deLEntitat = (filId, creatAl, text) => m(filId, ENTITAT, creatAl, text, { comOrgId: ENTITAT });

  const missatges = [
    /* ── IAIA MarIA (iaia): la benvinguda, llegida ── */
    m(FIL_IAIA, IAIA, a(1, 9, 0), BENVINGUDA_IAIA),

    /* ── Comunitat «Sóc de Poble» · General (grup): la creació i la benvinguda, llegides ── */
    m(FIL_GENERAL, ENTITAT, a(2, 10, 0), null, { tipus: 'sistema', metadades: { clau: 'creat' } }),
    deLEntitat(FIL_GENERAL, a(2, 10, 1), 'Hola! Este és el grup General de la comunitat de Sóc de Poble: ací podeu conversar, preguntar i compartir el que vullgueu. Els avisos oficials arriben pel canal Avisos.'),

    /* ── Comunitat «Sóc de Poble» · Avisos (canal): el primer llegit, l’últim no ── */
    deLEntitat(FIL_AVISOS, a(2, 10, 5), 'Benvinguts a la comunitat de Sóc de Poble! Este és el canal d’avisos: ací publicarem les novetats, les quedades i els canvis importants del projecte.'),
    deLEntitat(FIL_AVISOS, fa(40), 'En este canal només escriu l’equip de Sóc de Poble. Per a preguntar o conversar, feu servir el grup General de la comunitat.'),
    deLEntitat(FIL_AVISOS, fa(20), 'Estem a punt de donar permís als usuaris per a poder registrar-se i començar amb les primeres interaccions.'),

    /* ── Comunitat «Sóc de Poble» · Beta testers (grup) ── */
    m(FIL_BETA_TESTERS, ENTITAT, a(2, 10, 0), null, { tipus: 'sistema', metadades: { clau: 'creat' } }),
    deLEntitat(FIL_BETA_TESTERS, a(2, 10, 1), 'Benvinguts al canal de Beta Testers! Este és l’espai per a fer proves, reportar errors i donar-nos idees sobre el projecte.')
  ];

  /* El número d’ordre el posa «el servidor»: ací, l’ordre d’aparició per conversa. */
  const seqPerFil = new Map();
  for (const missatge of missatges) {
    const seq = (seqPerFil.get(missatge.filId) || 0) + 1;
    seqPerFil.set(missatge.filId, seq);
    missatge.seq = seq;
  }
  const ultimSeq = (filId) => seqPerFil.get(filId) || 0;
  const ultim = (filId) => missatges.filter((x) => x.filId === filId).at(-1) || null;

  /* Forma del contracte del Xat: tot fil porta comunitatId i subjecte. */
  const fil = (id, tipus, creatAl, extra = {}) => ({
    id, tipus, titol: null, orgId: null, imatgeUrl: null, comunitatId: null, subjecte: null,
    creatAl, actualitzatAl: ultim(id)?.creatAl || creatAl, ultimSeq: ultimSeq(id), ...extra
  });
  /* Una còpia per fil: cap magatzem comparteix objectes amb un altre. */
  const subjecte = () => ({ ...SUBJECTE_ENTITAT });

  const fils = [
    fil(FIL_IAIA, 'iaia', a(1, 8, 59)),
    fil(FIL_COMUNITAT, 'comunitat', a(2, 10, 0), {
      titol: PILOT.name, orgId: ENTITAT, imatgeUrl: PILOT.logo_url, subjecte: subjecte()
    }),
    fil(FIL_AVISOS, 'canal', a(2, 10, 0), { titol: 'Avisos', orgId: ENTITAT, comunitatId: FIL_COMUNITAT, subjecte: subjecte() }),
    fil(FIL_GENERAL, 'grup', a(2, 10, 0), { titol: 'General', comunitatId: FIL_COMUNITAT, subjecte: subjecte() }),
    fil(FIL_BETA_TESTERS, 'grup', a(2, 10, 0), { titol: 'Beta testers', comunitatId: FIL_COMUNITAT, subjecte: subjecte() })
  ];

  const participant = (filId, usuariId, llegitFinsSeq, extra = {}) => ({
    filId, usuariId: qui(usuariId), llegitFinsSeq, rebutFinsSeq: ultimSeq(filId), buidatFinsSeq: 0,
    arxivatAl: null, fixatAl: null, silenciatFinsAl: null, preferitAl: null, noLlegitManual: false,
    comOrgId: null, esEntitat: false, ...extra
  });
  const entitatVirtual = (filId) => participant(filId, ENTITAT, ultimSeq(filId), { esEntitat: true });

  const participants = [
    /* IAIA: la benvinguda ja està llegida. */
    participant(FIL_IAIA, JO, ultimSeq(FIL_IAIA)),
    participant(FIL_IAIA, IAIA, ultimSeq(FIL_IAIA)),
    /* La comunitat i els seus fills: jo hi soc membre, i l'entitat hi és com a
       participant virtual (la que signa). A Avisos em queda l'últim per llegir. */
    participant(FIL_COMUNITAT, JO, 0),
    entitatVirtual(FIL_COMUNITAT),
    participant(FIL_AVISOS, JO, ultimSeq(FIL_AVISOS) - 2),
    entitatVirtual(FIL_AVISOS),
    participant(FIL_GENERAL, JO, ultimSeq(FIL_GENERAL)),
    entitatVirtual(FIL_GENERAL),
    participant(FIL_BETA_TESTERS, JO, ultimSeq(FIL_BETA_TESTERS)),
    entitatVirtual(FIL_BETA_TESTERS)
  ];

  return { fils, participants, missatges };
}
