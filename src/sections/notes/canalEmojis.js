/**
 * canalEmojis.js — el canal entre la graella d'emojis del Bloc de notes i
 * l'editor de la nota oberta (Bloc 3.8 del Gauntlet, 261016: «Si s'invoca
 * mentre s'escriu al cos de l'article (TipTap), l'emoji s'insereix al cursor o
 * es copia al porta-retalls amb un sol toc»).
 *
 * Dues portes obrin la mateixa graella en mode cos, i totes dues viuen fora
 * de l'editor: la icona «Emojis» de la capçalera de NOTES (NotesSection) i
 * l'ordre «/» Emoji del cos (DocumentEditor, per l'adaptador de NotesEditor).
 * NotesSection proveïx el canal; l'editor viu s'hi registra
 * (DocumentEditor · registraInsercio) i, en obrir la graella, el canal li
 * pregunta si s'hi pot escriure (pot): la resposta es fixa en obrir, abans
 * que el diàleg modal tape la resta (en un encastament, la modalitat local
 * posa inert als germans).
 *
 * Les dades del catàleg (292 kB, emojisUnicode18.js) sempre a demanda, amb
 * import(): la graella universal no les importa (components/ no importa de
 * sections/) i les rep d'ací.
 *
 * Gauntlet 261017 (F29–F34) · El carregador ja porta les famílies del
 * selector (familiesEmojis.js: Cares, Persones, Animals, Menjar, Activitats,
 * Viatges, Objectes, Símbols i Banderes): el diàleg «Emojis» del Bloc i tots
 * els DialegEmoticona (Notes, Perfil i Snippet) en pinten les mateixes.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { tradueix } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { omple } from '../../config/moderacio.js';
import { familiesDelSelector } from './familiesEmojis.js';

export const CanalEmojisContext = createContext(null);

/** El canal del Bloc ({ registra, obri }), o null fora del Bloc. */
export const useCanalEmojis = () => useContext(CanalEmojisContext);

/** El catàleg Emojis XL, a demanda i en famílies del selector: { GRUPS_EMOJIS }. */
export const carregaCatalegEmojis = () => import('../disseny/cataleg/dades/emojisUnicode18.js')
  .then((modul) => ({ GRUPS_EMOJIS: familiesDelSelector(modul?.GRUPS_EMOJIS) }));

const p = (nom, reserva) => Object.freeze([`section.notes.emojis.${nom}`, reserva]);
export const PARELLS_EMOJIS = Object.freeze({
  titol: p('titol', 'Emojis'),
  etiqueta: p('etiqueta', 'Emojis'),
  inserir: p('inserir', 'Toca un emoji i s’escriurà on tenies el cursor, a la nota oberta.'),
  copiar: p('copiar', 'Toca un emoji per copiar-lo al porta-retalls: ara no hi ha cap nota oberta on escriure’l.'),
  tancar: p('tancar', 'Tancar'),
  senseCopia: p('senseCopia', 'La còpia no està disponible en aquest navegador.'),
  noCopiat: p('noCopiat', 'No s’ha pogut copiar l’emoji. Torna-ho a provar.'),
  copiat: p('copiat', 'Copiat {glif} al porta-retalls: ja el pots apegar.'),
  noReconegut: p('noReconegut', 'Este navegador encara no reconeix {glif} com a emoji: tria’n un altre.'),
});

export const textosEmojis = (t = null) => Object.freeze({
  titol: tradueix(t, PARELLS_EMOJIS.titol),
  etiqueta: tradueix(t, PARELLS_EMOJIS.etiqueta),
  inserir: tradueix(t, PARELLS_EMOJIS.inserir),
  copiar: tradueix(t, PARELLS_EMOJIS.copiar),
  tancar: tradueix(t, PARELLS_EMOJIS.tancar),
  senseCopia: tradueix(t, PARELLS_EMOJIS.senseCopia),
  noCopiat: tradueix(t, PARELLS_EMOJIS.noCopiat),
});
export const TEXTOS_EMOJIS = textosEmojis(null);
export const textCopiat = (glif, t = null) => omple(tradueix(t, PARELLS_EMOJIS.copiat), { glif });
/* Correcció de la revisió (261016) · Un emoji del catàleg massa nou per a este
   navegador (utils/emoji · emojiSol el rebutja: Safari 16 porta les dades
   d'Unicode 14) no s'escriu ni es copia: es veuria trencat. El mateix avís que
   el DialegEmoticona (la via d'assignar), amb el que toca fer en el cos. */
export const textEmojiNoReconegut = (glif, t = null) => omple(tradueix(t, PARELLS_EMOJIS.noReconegut), { glif });

/**
 * Copia un text amb el porta-retalls del navegador. Torna la promesa de
 * writeText, o null si el navegador no en té. Safari 16 només l'accepta dins
 * del gest de la persona: qui la crida ho fa dins del clic, abans de tancar.
 */
export function copiaAlPortaretalls(text) {
  const porta = globalThis.navigator?.clipboard;
  if (typeof porta?.writeText !== 'function') return null;
  try {
    return Promise.resolve(porta.writeText(text));
  } catch (error) {
    return Promise.reject(error);
  }
}

/* Una crida a l'editor registrat: només un true és un sí (un editor que peta o
   que ja no hi és, no). */
const crida = (entrada, accio, ...args) => {
  if (!entrada) return false;
  try {
    return entrada[accio](...args) === true;
  } catch {
    return false;
  }
};

/**
 * El canal del Bloc (el munta NotesSection):
 *   · canal: { registra(inserix, { pot }) → desregistra, obri() }, el valor
 *     del context, estable;
 *   · obert, inserir: el diàleg és obert i, si ho és, si triar escriu a la nota
 *     (la resposta de pot() en obrir-lo) o copia;
 *   · inserix(text) → Boolean i tanca().
 * Mana l'últim editor registrat; el desregistre només esborra el seu.
 */
export function useCanalEmojisDelBloc() {
  const registre = useRef(null);
  const [estat, setEstat] = useState({ obert: false, inserir: false });

  const registra = useCallback((inserix, { pot } = {}) => {
    if (typeof inserix !== 'function') return () => {};
    const entrada = { inserix, pot: typeof pot === 'function' ? pot : () => true };
    registre.current = entrada;
    return () => {
      if (registre.current === entrada) registre.current = null;
    };
  }, []);
  const inserix = useCallback((text) => crida(registre.current, 'inserix', text), []);
  const obri = useCallback(() => {
    setEstat({ obert: true, inserir: crida(registre.current, 'pot') });
  }, []);
  const tanca = useCallback(() => {
    setEstat((abans) => (abans.obert ? { ...abans, obert: false } : abans));
  }, []);

  const canal = useMemo(() => ({ registra, obri }), [registra, obri]);
  return { canal, obert: estat.obert, inserir: estat.inserir, inserix, tanca };
}
