/**
 * TargetesIncrustadesContext.js — El canal entre l'editor que munta les
 * targetes incrustades (DocumentEditor) i el NodeView de cada targeta.
 *
 * T7 (ordre del Mestre, prompt 261004_0515) · Va en un mòdul a banda, sense
 * TipTap: DocumentEditor.test.jsx, NotesEditor.p4.test.jsx i les proves de
 * la closca substituïxen sencers './richText' i './richText/extensions' amb
 * fàbriques tancades, i qualsevol símbol nou d'eixos dos mòduls hi petaria.
 *
 * Valor: { avisa(), t(clau, reserva) } o null (cap editor amb targetes).
 *  · avisa: el clic a una acció de la targeta en edició. La targeta és una
 *    previsualització: el consumidor obri un sol diàleg fora del cos.
 *  · t: el traductor de la secció, per als botons d'alineació.
 */
import { createContext, useContext } from 'react';

/** El nom de l'extensió de TipTap: el magatzem viu a editor.storage[NOM]. */
export const NOM_EXTENSIO_TARGETES = 'sdpTargetesIncrustades';

export const TargetesIncrustadesContext = createContext(null);

export const useTargetesIncrustades = () => useContext(TargetesIncrustadesContext);
