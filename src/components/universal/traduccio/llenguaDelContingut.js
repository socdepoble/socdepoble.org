/**
 * llenguaDelContingut.js — Gauntlet 261030 (cicle 3,
 * tc3-lang-ca-sobre-interficie-traduida; ordre TC3.3 de la Fase 3).
 *
 * PageFrame posava `lang` (p. ex. «ca») a tot l'<article> d'una pàgina en
 * valencià quan la interfície era en una altra llengua. Però dins de
 * l'article també hi ha peces de la interfície traduïdes amb t() (el botó
 * repetit al final, «Instal·la l'App»…), i un lector de pantalla les llegia
 * amb la veu valenciana (WCAG 3.1.2). Ara PageFrame no marca l'article: posa
 * el lang de la pàgina en este context (només quan la interfície és en una
 * altra llengua; si no, undefined) i el demana cada fill que és text de la
 * pàgina (TextSection · CosDeLaPagina). La resta de fills no el demanen i
 * hereten la llengua de la interfície.
 *
 * Fora d'un PageFrame, o sense `llenguaDelContingut`, undefined: cap lang i
 * el DOM de sempre (Llei del Píxel). Pur React, sense cap node.
 */
import { createContext, useContext } from 'react';

export const LlenguaDelContingut = createContext(undefined);

/** El lang que ha de portar un text de la pàgina, o undefined. */
export function useLlenguaDelContingut() {
  const llengua = useContext(LlenguaDelContingut);
  return typeof llengua === 'string' && llengua ? llengua : undefined;
}
