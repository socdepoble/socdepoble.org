/**
 * actorsDelXat.js — Gauntlet 261016_1530 (prompt, Bloc 3.6; pla, Onada 1.2;
 * relleu F21, F57-F61 i F63) · Ordre del Mestre: «Hi ha d'haver
 * permanentment i en aquest ordre estricte 4 converses/actors de
 * referència», dalt de tot de la llista:
 *   1r · la Comunitat Sóc de Poble (Avisos, General i Beta Testers);
 *   2n · Javi Llinares;
 *   3r · Gent de la Torre (el poble del xat, pobleAmfitrio.js);
 *   4t · la IAIA MarIA.
 * Darrere, la resta de converses com sempre (fixades primer, després per
 * activitat). I la capçalera de cada conversa oberta porta a la seua pàgina
 * canònica (/socdepoble, /javillinares, /iaia; el poble ja hi portava).
 *
 * Mana sobre l'ordre del 261007, que havia creat la fila directa sintètica
 * de «Sóc de Poble» (data/xatsPerDefecte.js): eixa fila ja no existix, i el
 * primer actor és la COMUNITAT.
 *
 * Cada actor es reconeix per identificador, mai pel nom (doctrina de T6):
 *   · la comunitat de Sóc de Poble · una fila de comunitat amb subjecte
 *     'entitat' que és l'entitat pilot (esEntitatDelProjecte: l'id de la
 *     llavor o el remot que el backend ja ha registrat). Si no és a la
 *     llista (en remot, qui encara no hi ha entrat; en local, el magatzem
 *     naix buit), una fila que hi PORTA, amb l'anatomia de la del poble
 *     (FilaPoble): prémer-la fa el mateix camí que el «Comentar» de
 *     /socdepoble (?sobre=entitat:socdepoble), i és el servidor qui resol
 *     l'entitat pel slug dins del poble (private.xat_subjecte,
 *     2609282100_xat_de_pagina.sql), com resol «En privat»
 *     (control/xatCorporatiu.js). Cap fil ni cap missatge inventat. En remot
 *     porta a la comunitat només quan el backend ja ha donat l'id de
 *     l'entitat (coneixIdRemotDelProjecte).
 *     QA-R2-05 (Codex, Ronda 2) · Derogat «en remot sense l'id, cap fila»:
 *     fins que arriba l'UUID, la reserva continua al seu lloc amb la mateixa
 *     clau (CLAU_FILA_DE_SOC_DE_POBLE), però només és l'enllaç públic a
 *     /socdepoble (COMUNITAT_PUBLICA_DE_SOC_DE_POBLE): cap acció pel slug.
 *     Quan arriba, la mateixa fila porta a la comunitat i, si la comunitat de
 *     veres ja és a la llista (reconeguda per l'UUID), la substituïx: cap
 *     duplicat. Mentre l'UUID no ha arribat, la comunitat de veres no es pot
 *     reconéixer (mai pel nom) i, si ja fos a la llista, hi hauria dues files
 *     amb el mateix nom fins a la hidratació;
 *   · Javi Llinares · la seua fila sintètica, el seu xat de només lectura
 *     (fake-javi) o un directe real amb ell (jaTeElXat);
 *   · Gent de la Torre · la fila del poble (anteposaPoble, `delPoble`);
 *   · la IAIA · la seua fila sintètica, la de mostra (fake-iaia), el seu fil
 *     o un directe amb ella; si no n'hi ha cap, el xat públic de /iaia (on
 *     porta la fila en remot).
 * P1-70 (ordre del Mestre, 261029 18:20: «No me veo a mí como Javi Llinares
 * ni a la IAIA MarIA, esto es una regresión») · Derogat «un actor que falta
 * no ocupa cap lloc» per a Javi i la IAIA: si la llista no els porta (una
 * llista encara buida, un node sense poble, un adaptador que no les
 * sintetitza, un fil seu arxivat), XatSection hi passa les files de reserva
 * (FILA_DE_RESERVA_DE_JAVI i FILA_DE_RESERVA_DE_LA_IAIA), les mateixes que
 * porta el port. Mai una segona: només si l'actor no hi és, per identificador.
 * Pur: cap React ni cap xarxa.
 */
import { RUTA_FITXA_IAIA, RUTES_CANONIQUES, coneixIdRemotDelProjecte, esEntitatDelProjecte } from '../../config/navigation.js';
import { rutaXatDePagina } from '../../config/objecteConnectable.js';
import { ENTITAT_PILOT_SLUG, PERSONA_PILOT, esIAIA } from '../../data/identitatsSeed.js';
import { AJUDA_PER_CLAU, ID_FIL_DE_MOSTRA_DE_JAVI, conversaPerDefecteDe, esLaPersonaDeContacte, esXatDeLaIAIA, jaTeElXat } from '../../data/xatsPerDefecte.js';
import { mapejaFil } from './missatges.js';
import { ID_FIL_DE_MOSTRA_DE_LA_IAIA } from './useObriXatPerDefecte.js';

/* Els modes sense servidor de dades, com a useObriXatPerDefecte.js. */
const MODES_LOCALS = new Set(['seed', 'local']);

/** On porten les capçaleres de Javi i de Sóc de Poble: les rutes canòniques netes (Bloc 3.5.1). */
export const RUTA_DE_JAVI = RUTES_CANONIQUES[PERSONA_PILOT.slug];
export const RUTA_DE_SOC_DE_POBLE = RUTES_CANONIQUES[ENTITAT_PILOT_SLUG];
/** La capçalera de la IAIA porta a /iaia, que el Bloc 3.6.3 reserva per a la seua fitxa (el manifest va a /anima): la font única és RUTA_FITXA_IAIA. */
export const RUTA_DE_LA_IAIA = RUTA_FITXA_IAIA;

/** La comunitat de Sóc de Poble de la fila que hi porta: el nom i la cara d'AJUDA (la font única) i la seua pàgina. */
export const COMUNITAT_DE_SOC_DE_POBLE = Object.freeze({
  id: ENTITAT_PILOT_SLUG,
  nom: AJUDA_PER_CLAU.socdepoble.nom,
  avatar: AJUDA_PER_CLAU.socdepoble.avatar,
  ruta: RUTA_DE_SOC_DE_POBLE
});

/** QA-R2-05 · La reserva de la comunitat en remot mentre el backend encara no ha donat l'UUID de l'entitat: només l'enllaç públic a la seua pàgina (`ruta`). */
export const COMUNITAT_PUBLICA_DE_SOC_DE_POBLE = Object.freeze({ ...COMUNITAT_DE_SOC_DE_POBLE, publica: true });

/** La clau d'eixa fila a la llista (data-clau), com la del poble ('poble:<id>'). */
export const CLAU_FILA_DE_SOC_DE_POBLE = `entitat:${ENTITAT_PILOT_SLUG}`;

/** /xat?sobre=entitat:socdepoble&titol=…&ruta=%2Fsocdepoble: el camí del «Comentar» de la pàgina de l'entitat. */
export const RUTA_SOBRE_DE_SOC_DE_POBLE = rutaXatDePagina({
  tipus: 'entitat', id: ENTITAT_PILOT_SLUG, titol: COMUNITAT_DE_SOC_DE_POBLE.nom, ruta: RUTA_DE_SOC_DE_POBLE
});

/** Cert si `comunitat` ({ fil, fills }) és la de Sóc de Poble: el subjecte és l'entitat pilot, per identificador. */
export function esComunitatDeSocDePoble(comunitat) {
  const subjecte = comunitat?.fil?.subjecte;
  return subjecte?.tipus === 'entitat' && esEntitatDelProjecte(subjecte);
}

/**
 * Cert si la llista pot portar la fila que va a la comunitat quan encara no
 * hi és: en llavor i en local, sempre (els ids de la llavor ja hi són); en
 * remot, només quan el backend ja ha donat l'id de l'entitat (vegeu dalt).
 */
export const potPortarLaComunitat = (modeDades) => MODES_LOCALS.has(modeDades) || coneixIdRemotDelProjecte();

/**
 * QA-R2-05 · La comunitat de la fila de reserva (sempre la mateixa clau): la
 * que porta a la comunitat si potPortarLaComunitat, o la pública (només
 * /socdepoble) en remot mentre l'UUID de l'entitat encara no ha arribat.
 */
export const comunitatDeReserva = (modeDades) => (potPortarLaComunitat(modeDades)
  ? COMUNITAT_DE_SOC_DE_POBLE
  : COMUNITAT_PUBLICA_DE_SOC_DE_POBLE);

const idDe = (fil) => String(fil?.id ?? '');

/* Javi: la fila sintètica, el xat de mostra o un directe real amb ell. */
const esFilDeJavi = (fil) => fil?.perDefecte === 'javi' || idDe(fil) === ID_FIL_DE_MOSTRA_DE_JAVI || jaTeElXat(fil, 'javi');

/* La IAIA, primer pel xat on contesta (la fila, la mostra, el fil o un
   directe) i, si no n'hi ha cap, pel xat públic de la seua pàgina. */
const esDirecteDeLaIAIA = (fil) => fil?.perDefecte === 'iaia' || idDe(fil) === ID_FIL_DE_MOSTRA_DE_LA_IAIA
  || (esXatDeLaIAIA(fil) && fil.subjecte?.tipus !== 'pagina');

const esFila = (fila) => fila?.tipus === 'fil';

/* P1-70 (261029) · Les files de reserva de Javi i de la IAIA: les mateixes
   que porta el port (perDefecte, data/xatsPerDefecte.js), mapejades com les
   mapeja el context. Constants de mòdul, congelades. */
const filaPerDefecte = (clau) => {
  const fil = mapejaFil(conversaPerDefecteDe(clau));
  return Object.freeze({ clau: String(fil.id), tipus: 'fil', fil: Object.freeze(fil) });
};
export const FILA_DE_RESERVA_DE_JAVI = filaPerDefecte('javi');
export const FILA_DE_RESERVA_DE_LA_IAIA = filaPerDefecte('iaia');

/* P1-70 (261029) · La fila de Javi diu què és quan no porta cap últim text
   (una còpia: la de reserva és congelada i un fil del port no es muta). */
const ambSubtitol = (fila, subtitol) => (fila && subtitol && !fila.fil?.ultimText
  ? { ...fila, fil: { ...fila.fil, ultimText: subtitol } }
  : fila);

/**
 * Les files de la llista (les de XatSection, després d'anteposaPoble) amb els
 * quatre actors al capdamunt i en l'ordre de l'ordre del Mestre; la resta,
 * darrere i en el seu ordre. Un actor que no hi és no ocupa cap lloc. Amb
 * `comunitat` (potPortarLaComunitat i la llista ja carregada), la comunitat
 * de Sóc de Poble que falta es pinta com una fila { tipus: 'entitat' } que
 * hi porta. Torna la MATEIXA referència si no canvia res. Pura.
 * P1-70 (261029) · `reservaJavi` i `reservaIAIA` (XatSection les passa amb la
 * fila virtual del poble) ocupen el lloc de Javi i de la IAIA quan la llista
 * no els porta; `subtitolDeJavi`, el text de la seua fila sense últim missatge.
 * QA-R2-05 · `comunitat` també pot ser la comunitat de la reserva
 * (comunitatDeReserva): la fila porta eixa, amb la mateixa clau; `true` és
 * COMUNITAT_DE_SOC_DE_POBLE.
 */
export function anteposaActors(files, { comunitat = false, reservaJavi = null, reservaIAIA = null, subtitolDeJavi = '' } = {}) {
  if (!Array.isArray(files)) return files;
  const troba = (predicat) => files.find(predicat) || null;
  const entitatDeReserva = comunitat && typeof comunitat === 'object' ? comunitat : COMUNITAT_DE_SOC_DE_POBLE;
  const deSocDePoble = troba((fila) => fila?.tipus === 'comunitat' && esComunitatDeSocDePoble(fila.comunitat))
    || (comunitat ? { clau: CLAU_FILA_DE_SOC_DE_POBLE, tipus: 'entitat', entitat: entitatDeReserva } : null);
  const javiTrobat = troba((fila) => esFila(fila) && esFilDeJavi(fila.fil));
  const deJavi = ambSubtitol(javiTrobat || reservaJavi, subtitolDeJavi);
  const delPoble = troba((fila) => fila?.delPoble === true);
  const deLaIAIA = troba((fila) => esFila(fila) && esDirecteDeLaIAIA(fila.fil))
    || troba((fila) => esFila(fila) && esXatDeLaIAIA(fila.fil))
    || reservaIAIA;
  const actors = [deSocDePoble, deJavi, delPoble, deLaIAIA].filter(Boolean);
  if (!actors.length) return files;
  /* La fila de Javi trobada també és «de dalt»: la còpia amb el subtítol no la duplica. */
  const dalt = new Set([...actors, javiTrobat]);
  const resultat = [...actors, ...files.filter((fila) => !dalt.has(fila))];
  const igual = resultat.length === files.length && resultat.every((fila, i) => fila === files[i]);
  return igual ? files : resultat;
}

/**
 * La ruta canònica de la capçalera d'un fil obert (Bloc 3.6.2), o null si no
 * en té cap i CapcaleraConversa fa com sempre (el perfil de l'altra part o la
 * Pàgina Universal del subjecte):
 *   · Javi Llinares · /javillinares: el seu xat de només lectura o un
 *     directe amb ell (per id o àlies del padró pilot);
 *   · Sóc de Poble · /socdepoble: un fil de la seua comunitat (Avisos,
 *     General, Beta Testers) o un directe amb l'entitat;
 *   · la IAIA · /iaia: la seua conversa de mostra, el seu fil o un directe.
 * El poble («Gent de la Torre») no en necessita: el subjecte ja porta
 * /pobles/<id>. Pura.
 */
export function rutaCanonicaDelXat(fil) {
  if (!fil) return null;
  const id = idDe(fil);
  if (id === ID_FIL_DE_MOSTRA_DE_JAVI) return RUTA_DE_JAVI;
  if (id === ID_FIL_DE_MOSTRA_DE_LA_IAIA) return RUTA_DE_LA_IAIA;
  const { subjecte } = fil;
  if (subjecte) return subjecte.tipus === 'entitat' && esEntitatDelProjecte(subjecte) ? RUTA_DE_SOC_DE_POBLE : null;
  if (fil.tipus === 'grup') return null;
  if (fil.tipus === 'iaia') return RUTA_DE_LA_IAIA;
  const altres = Array.isArray(fil.altres) ? fil.altres : [];
  if (altres.length !== 1) return null;
  const [altre] = altres;
  if (altre?.tipus === 'persona' && esLaPersonaDeContacte(altre)) return RUTA_DE_JAVI;
  if (altre?.tipus === 'ia' && esIAIA(altre.id)) return RUTA_DE_LA_IAIA;
  return esEntitatDelProjecte(altre) ? RUTA_DE_SOC_DE_POBLE : null;
}
