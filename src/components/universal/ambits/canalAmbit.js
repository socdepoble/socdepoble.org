/**
 * canalAmbit.js — IDEA-61 (T0, prompt 261102_1532) · El canal entre la secció
 * que rep ?ambit=<mercat|vehicle|treball|habitatge> a la URL (el Bloc de Notes,
 * NotesSection) i l'editor de la nota oberta (NotesEditor).
 *
 * El valor del context: { pendent, consumix } o null fora del Bloc.
 *   · pendent: l'àmbit que la URL ha demanat i cap editor ha atés encara, o null;
 *   · consumix(): l'editor l'ha atés (la nota té fitxa i el diàleg «On es
 *     publica?» s'ha obert): la secció l'oblida i neteja la URL.
 * Universal: cap importació de seccions; el proveïdor el munta la secció.
 */
import { createContext, useContext } from 'react';

export const CanalAmbitContext = createContext(null);

/** El canal de l'àmbit del Bloc ({ pendent, consumix }), o null fora del Bloc. */
export const useCanalAmbit = () => useContext(CanalAmbitContext);
