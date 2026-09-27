/**
 * xatSeed.js — Llavor del Xat per al mode seed.
 *
 * Cinc converses del poble pilot amb una cinquantena de missatges repartits
 * en tres dies, perquè la interfície puga pintar separadors de dia, un
 * missatge de sistema, un d'esborrat, missatges de la IAIA i uns quants no
 * llegits:
 *   · dos directes (Pepa, Vicent) i un grup (Comissió de Festes), com en F0;
 *   · la conversa amb la IAIA MarIA (T3): un fil de tipus 'iaia' on ella
 *     respon sola amb la frase fixa d'identitatsSeed;
 *   · el canal de l'entitat «Sóc de Poble» (T2): Toni Pastor hi ha escrit
 *     com a client i Maria Roig ha respost en nom de l'entitat. Qui mira, com
 *     a propietari de l'entitat pilot, el veu i pot respondre-hi.
 * Les hores són relatives al moment de construir la llavor: la del dia -2 i
 * -1 són fixes, les d'avui van cap arrere des d'ara.
 *
 * La persona que mira («jo») no té identificador fix: `construeixLlavorXat(joId)`
 * el substituïx allà on toca. Cap dada real: noms i converses són inventats.
 * Els identificadors de la IAIA i de l'entitat pilot vénen d'identitatsSeed,
 * perquè el perfil, el xat i el Mercat parlen de la mateixa persona.
 */
import {
  BENVINGUDA_IAIA, ENTITAT_PILOT_ID, ENTITATS_SEED, IAIA_ID, MEMBRE_ADMIN_PILOT
} from './identitatsSeed.js';
import { AGENTS_MAP } from './agentsSeed.js';

const DIA_MS = 86400000;

const PEPA = '4b0f9c3e-1a2d-4f5e-8b6c-0d1e2f3a4b01';
const VICENT = '4b0f9c3e-1a2d-4f5e-8b6c-0d1e2f3a4b02';
const MARIA = MEMBRE_ADMIN_PILOT;
const TONI = '4b0f9c3e-1a2d-4f5e-8b6c-0d1e2f3a4b04';
const IAIA = IAIA_ID;
const ENTITAT = ENTITAT_PILOT_ID;
const FIL_PEPA = '7c2a1d9e-3b4f-4a5c-9d6e-1f2a3b4c5d01';
const FIL_VICENT = '7c2a1d9e-3b4f-4a5c-9d6e-1f2a3b4c5d02';
const FIL_COMISSIO = '7c2a1d9e-3b4f-4a5c-9d6e-1f2a3b4c5d03';
const FIL_IAIA = '7c2a1d9e-3b4f-4a5c-9d6e-1f2a3b4c5d04';
const FIL_ENTITAT = '7c2a1d9e-3b4f-4a5c-9d6e-1f2a3b4c5d05';

/* Marcador de la persona que mira; es substituïx en construir la llavor. */
const JO = 'jo';

export const XAT_SEED_IDS = Object.freeze({
  pepa: PEPA, vicent: VICENT, maria: MARIA, toni: TONI, iaia: IAIA, entitat: ENTITAT,
  filPepa: FIL_PEPA, filVicent: FIL_VICENT, filComissio: FIL_COMISSIO, filIaia: FIL_IAIA, filEntitat: FIL_ENTITAT
});

/* Noms de qui escriu (la IAIA i l'entitat incloses, perquè signen els seus missatges). */
export const XAT_SEED_NOMS = Object.freeze({
  [PEPA]: 'Pepa Ferrer',
  [VICENT]: 'Vicent Sanchis',
  [MARIA]: 'Maria Roig',
  [TONI]: 'Toni Pastor',
  [IAIA]: AGENTS_MAP.IAIA.name,
  [ENTITAT]: ENTITATS_SEED[0].name
});

/* Padró del poble: a qui es pot escriure. Persones, l'entitat pilot i la IAIA,
   cadascú amb el seu tipus perquè la interfície ho diga. */
export const XAT_SEED_MEMBRES = Object.freeze([
  Object.freeze({ usuariId: PEPA, nom: XAT_SEED_NOMS[PEPA], tipus: 'persona', avatarUrl: null }),
  Object.freeze({ usuariId: VICENT, nom: XAT_SEED_NOMS[VICENT], tipus: 'persona', avatarUrl: null }),
  Object.freeze({ usuariId: MARIA, nom: XAT_SEED_NOMS[MARIA], tipus: 'persona', avatarUrl: null }),
  Object.freeze({ usuariId: TONI, nom: XAT_SEED_NOMS[TONI], tipus: 'persona', avatarUrl: null }),
  Object.freeze({ usuariId: ENTITAT, nom: XAT_SEED_NOMS[ENTITAT], tipus: 'entitat', avatarUrl: ENTITATS_SEED[0].logo_url }),
  Object.freeze({ usuariId: IAIA, nom: XAT_SEED_NOMS[IAIA], tipus: 'ia', avatarUrl: AGENTS_MAP.IAIA.avatar_url })
]);

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
  /* Un missatge escrit en nom de l'entitat: el signa l'entitat i recorda qui l'ha escrit. */
  const comEntitat = (filId, autor, creatAl, text) => m(filId, autor, creatAl, text, {
    autorNom: XAT_SEED_NOMS[ENTITAT], comOrgId: ENTITAT, metadades: { autorPersona: XAT_SEED_NOMS[autor] }
  });

  const missatges = [
    /* ── Pepa Ferrer (directe): 13 missatges, els dos últims sense llegir ── */
    m(FIL_PEPA, PEPA, a(2, 9, 12), 'Bon dia! Has vist que ja han posat el cartell de la recol·lecció d’olives a la plaça?'),
    m(FIL_PEPA, JO, a(2, 9, 20), 'Sí, l’he vist esta matinada quan he anat al forn. Enguany avancen una setmana.'),
    m(FIL_PEPA, PEPA, a(2, 9, 21), 'Amb la calor que ha fet, normal. Tu quan penses començar al bancal de dalt?'),
    m(FIL_PEPA, JO, a(2, 9, 40), 'Dissabte si no plou. Si vols, et guarde un parell de caixes de manzanilla.'),
    m(FIL_PEPA, PEPA, a(2, 9, 41), 'Home, clar que sí! Dos caixes i ja em dius què et dec.'),
    m(FIL_PEPA, PEPA, a(2, 10, 2), 'Per cert, ta mare ja està millor del genoll?'),
    m(FIL_PEPA, JO, a(2, 10, 15), 'Millorant, gràcies. Dilluns té revisió a Alcoi.'),
    m(FIL_PEPA, JO, a(1, 18, 5), 'Pepa, al final el molí de Xixona obri dilluns. Ho he confirmat per telèfon.'),
    m(FIL_PEPA, PEPA, a(1, 18, 30), 'Perfecte, així portem les dos remeses juntes i estalviem un viatge.'),
    m(FIL_PEPA, JO, a(1, 18, 31), 'Fet. Passe a per tu a les 8 amb la furgoneta.'),
    m(FIL_PEPA, PEPA, a(1, 18, 33), null, { esborratAl: a(1, 18, 34) }),
    m(FIL_PEPA, PEPA, fa(25), 'Ei, m’ha dit Vicent que hui tanca el forn a les 13. Si vols pa per a demà, afanya’t.'),
    m(FIL_PEPA, PEPA, fa(7), 'I porta bossa, que se li han acabat les de paper.'),

    /* ── Vicent Sanchis, el forner (directe): 8 missatges, tot llegit; l’últim és meu ── */
    m(FIL_VICENT, JO, a(2, 12, 2), 'Vicent, em pots guardar tres coques de mullador per a dissabte? Vénen els meus nebots.'),
    m(FIL_VICENT, VICENT, a(2, 12, 45), 'Guardades. Les vols amb tonyina o només pebrera i tomaca?'),
    m(FIL_VICENT, JO, a(2, 12, 50), 'Dos amb tonyina i una sense, que la xiqueta no en menja.'),
    m(FIL_VICENT, VICENT, a(2, 12, 51), 'Apuntat. Les tindràs a les 9 del matí.'),
    m(FIL_VICENT, VICENT, a(1, 7, 58), 'Hui he fet pa de llenya amb farina de la cooperativa de Penàguila. Si vols provar-lo, te’n guarde un.'),
    m(FIL_VICENT, JO, a(1, 8, 30), 'Guarda-me’n un, i un altre per a ma mare, que ella sempre diu que el d’abans era millor.'),
    m(FIL_VICENT, VICENT, a(1, 8, 31), 'A vore si li canvie l’opinió!'),
    m(FIL_VICENT, JO, fa(95), 'Vicent, al final les coques les arreplegarà Pepa, que jo estaré al bancal.'),

    /* ── Comissió de Festes (grup): 18 missatges, els tres últims sense llegir ── */
    m(FIL_COMISSIO, MARIA, a(2, 17, 0), null, {
      tipus: 'sistema',
      metadades: { clau: 'grup_creat', parametres: { autor: XAT_SEED_NOMS[MARIA], titol: 'Comissió de Festes' } }
    }),
    m(FIL_COMISSIO, MARIA, a(2, 17, 2), 'Bona vesprada a tots! He creat este grup per a organitzar el sopar de germanor del dissabte 10.'),
    m(FIL_COMISSIO, TONI, a(2, 17, 15), 'Gràcies, Maria. Jo m’encarregue de les taules i les cadires del casal.'),
    m(FIL_COMISSIO, PEPA, a(2, 17, 20), 'Jo puc fer dos paelles grans si algú em porta la llenya.'),
    m(FIL_COMISSIO, JO, a(2, 17, 32), 'Llenya en tinc de sobra al mas. Te la porte divendres.'),
    m(FIL_COMISSIO, MARIA, a(2, 17, 40), 'Genial. Ens falta saber quanta gent ve. Aneu dient-ho per ací i la IAIA ens farà la llista.'),
    m(FIL_COMISSIO, TONI, a(2, 17, 41), 'Nosaltres som 4.'),
    m(FIL_COMISSIO, PEPA, a(2, 17, 45), 'Jo i Ximo, 2.'),
    m(FIL_COMISSIO, TONI, a(2, 17, 50), 'Ah, i necessitem algú que s’encarregue de la música.'),
    m(FIL_COMISSIO, JO, a(2, 18, 0), 'Parle amb el meu nebot, que té l’equip de so de la colla.'),
    m(FIL_COMISSIO, JO, a(1, 10, 10), 'A casa serem 3, i pot ser que vinga ma germana de València amb els xiquets: 3 més, però ho confirme dijous.'),
    m(FIL_COMISSIO, MARIA, a(1, 10, 30), 'Apuntat com a possible. Algú sap si el Rentonar farà la ruta el matí?'),
    m(FIL_COMISSIO, TONI, a(1, 11, 2), 'Sí, ixen a les 9 de la font. Podríem fer el sopar a les 21 per si tornen tard.'),
    m(FIL_COMISSIO, IAIA, a(1, 11, 5), 'He arreplegat les respostes fins ara: 9 persones confirmades (Toni 4, Pepa 2 i tu 3) i 3 possibles (la família de València). Quan ho confirmeu, actualitzaré la llista.'),
    m(FIL_COMISSIO, MARIA, a(1, 11, 10), 'Perfecte, gràcies IAIA. Aleshores sopar a les 21 al casal.'),
    m(FIL_COMISSIO, PEPA, fa(180), 'Recordeu que dijous és l’últim dia per a dir el nombre definitiu!'),
    m(FIL_COMISSIO, TONI, fa(50), 'Confirmat, nosaltres 4. I porte el vi de la cooperativa.'),
    m(FIL_COMISSIO, MARIA, fa(12), 'Jo porte els postres: coca de llanda i bunyols.'),

    /* ── IAIA MarIA (iaia): la benvinguda, llegida ── */
    m(FIL_IAIA, IAIA, a(1, 9, 0), BENVINGUDA_IAIA),

    /* ── Sóc de Poble (entitat): Toni escriu com a client; Maria respon en nom de l'entitat ── */
    m(FIL_ENTITAT, TONI, a(1, 12, 5), 'Bon dia! Queden samarretes de Sóc de Poble en verd de la talla M?'),
    comEntitat(FIL_ENTITAT, MARIA, a(1, 12, 40), 'Bon dia, Toni! En verd ens en queden dos de la M. Te’n guarde una?'),
    m(FIL_ENTITAT, TONI, fa(35), 'Sí, per favor. Passe dijous per la plaça a arreplegar-la.')
  ];

  /* El número d’ordre el posa «el servidor»: ací, l’ordre d’aparició per conversa. */
  const seqPerFil = new Map();
  for (const missatge of missatges) {
    const seq = (seqPerFil.get(missatge.filId) || 0) + 1;
    seqPerFil.set(missatge.filId, seq);
    missatge.seq = seq;
  }
  const ultim = (filId) => missatges.filter((x) => x.filId === filId).at(-1);

  const fils = [
    { id: FIL_PEPA, tipus: 'directe', titol: null, orgId: null, imatgeUrl: null, creatAl: a(2, 9, 10), actualitzatAl: ultim(FIL_PEPA).creatAl, ultimSeq: seqPerFil.get(FIL_PEPA) },
    { id: FIL_VICENT, tipus: 'directe', titol: null, orgId: null, imatgeUrl: null, creatAl: a(2, 12, 0), actualitzatAl: ultim(FIL_VICENT).creatAl, ultimSeq: seqPerFil.get(FIL_VICENT) },
    { id: FIL_COMISSIO, tipus: 'grup', titol: 'Comissió de Festes', orgId: null, imatgeUrl: null, creatAl: a(2, 17, 0), actualitzatAl: ultim(FIL_COMISSIO).creatAl, ultimSeq: seqPerFil.get(FIL_COMISSIO) },
    { id: FIL_IAIA, tipus: 'iaia', titol: null, orgId: null, imatgeUrl: null, creatAl: a(1, 8, 59), actualitzatAl: ultim(FIL_IAIA).creatAl, ultimSeq: seqPerFil.get(FIL_IAIA) },
    { id: FIL_ENTITAT, tipus: 'entitat', titol: null, orgId: ENTITAT, imatgeUrl: null, creatAl: a(1, 12, 4), actualitzatAl: ultim(FIL_ENTITAT).creatAl, ultimSeq: seqPerFil.get(FIL_ENTITAT) }
  ];

  const participant = (filId, usuariId, llegitFinsSeq, extra = {}) => ({
    filId, usuariId: qui(usuariId), llegitFinsSeq, rebutFinsSeq: seqPerFil.get(filId), buidatFinsSeq: 0,
    arxivatAl: null, fixatAl: null, silenciatFinsAl: null, preferitAl: null, noLlegitManual: false,
    comOrgId: null, esEntitat: false, ...extra
  });

  const participants = [
    /* Pepa: jo m’he quedat a l’11 (dos sense llegir); ella ho ha llegit tot. */
    participant(FIL_PEPA, JO, 11),
    participant(FIL_PEPA, PEPA, seqPerFil.get(FIL_PEPA)),
    /* Vicent: tot llegit per la meua part; ell encara no ha llegit el meu últim. */
    participant(FIL_VICENT, JO, seqPerFil.get(FIL_VICENT)),
    participant(FIL_VICENT, VICENT, seqPerFil.get(FIL_VICENT) - 1),
    /* Comissió: jo al 15 (tres sense llegir); la resta al dia. */
    participant(FIL_COMISSIO, JO, 15),
    participant(FIL_COMISSIO, PEPA, seqPerFil.get(FIL_COMISSIO)),
    participant(FIL_COMISSIO, MARIA, seqPerFil.get(FIL_COMISSIO)),
    participant(FIL_COMISSIO, TONI, seqPerFil.get(FIL_COMISSIO)),
    participant(FIL_COMISSIO, IAIA, seqPerFil.get(FIL_COMISSIO)),
    /* IAIA: la benvinguda ja està llegida. */
    participant(FIL_IAIA, JO, seqPerFil.get(FIL_IAIA)),
    participant(FIL_IAIA, IAIA, seqPerFil.get(FIL_IAIA)),
    /* Entitat: Toni és el client; l'entitat és una participant virtual que
       llig el que ha llegit qualsevol membre; Maria hi és com a membre. Jo no
       hi tinc fila: el magatzem me la crea en obrir-la com a propietari. */
    participant(FIL_ENTITAT, TONI, seqPerFil.get(FIL_ENTITAT)),
    participant(FIL_ENTITAT, ENTITAT, 2, { esEntitat: true }),
    participant(FIL_ENTITAT, MARIA, 2, { comOrgId: ENTITAT })
  ];

  return { fils, participants, missatges };
}
