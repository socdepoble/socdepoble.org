/**
 * textosModeHumaPur.js — Onada v1.2.23 (R32.50) · IDEA-334 · Textos de
 * l'interruptor «Experiència 100 % humana (amagar assistents d'IA)» en les
 * 5 llengües oficials (ca, es, en, eu, gl).
 *
 * Viu fora de src/config/idiomes/ perquè només s'importa a les superfícies
 * d'ajustos diferides (/el-meu-perfil, Ajustos del Xat i /control): 0 B
 * d'augment al tros d'arrencada estàtica de WordPress.
 */
import { resolLlenguaModeSenior } from './textosModeSenior.js';

export const TEXTOS_MODE_HUMA_PUR = Object.freeze({
  ca: Object.freeze({
    xip: "Experiència 100 % humana (amagar assistents d'IA)",
    xipCurt: 'Experiència 100 % humana',
    descripcio: 'Amaga el botó de la IAIA de la barra superior, el botó «Escolta la IAIA» i la conversa suggerida amb la IAIA per utilitzar Sóc de Poble exclusivament entre persones.',
    actiu: 'Actiu',
    inactiu: 'Desactivat',
    seccioPerfil: 'Experiència sense IA',
    regio: "Preferència d'experiència 100 % humana",
  }),
  es: Object.freeze({
    xip: 'Experiencia 100 % humana (ocultar asistentes de IA)',
    xipCurt: 'Experiencia 100 % humana',
    descripcio: 'Oculta el botón de la IAIA de la barra superior, el botón «Escucha a la IAIA» y la conversación sugerida con la IAIA para utilizar Sóc de Poble exclusivamente entre personas.',
    actiu: 'Activo',
    inactiu: 'Desactivado',
    seccioPerfil: 'Experiencia sin IA',
    regio: 'Preferencia de experiencia 100 % humana',
  }),
  en: Object.freeze({
    xip: '100% human experience (hide AI assistants)',
    xipCurt: '100% human experience',
    descripcio: 'Hides the IAIA button in the top bar, the «Listen to IAIA» button and the suggested IAIA conversation so you can use Sóc de Poble exclusively among people.',
    actiu: 'Active',
    inactiu: 'Off',
    seccioPerfil: 'AI-free experience',
    regio: '100% human experience preference',
  }),
  eu: Object.freeze({
    xip: '% 100 giza esperientzia (ezkutatu AA laguntzaileak)',
    xipCurt: '% 100 giza esperientzia',
    descripcio: 'Goiko barrako IAIAren botoia, «Entzun IAIA» botoia eta IAIArekin iradokitako elkarrizketa ezkutatzen ditu, Sóc de Poble pertsonen artean bakarrik erabiltzeko.',
    actiu: 'Aktibo',
    inactiu: 'Itzalita',
    seccioPerfil: 'AArik gabeko esperientzia',
    regio: '% 100 giza esperientziaren hobespena',
  }),
  gl: Object.freeze({
    xip: 'Experiencia 100 % humana (ocultar asistentes de IA)',
    xipCurt: 'Experiencia 100 % humana',
    descripcio: 'Oculta o botón da IAIA da barra superior, o botón «Escoita a IAIA» e a conversa suxerida coa IAIA para empregar Sóc de Poble exclusivamente entre persoas.',
    actiu: 'Activo',
    inactiu: 'Desactivado',
    seccioPerfil: 'Experiencia sen IA',
    regio: 'Preferencia de experiencia 100 % humana',
  }),
});

export function textosModeHumaPur(llengua, t) {
  return TEXTOS_MODE_HUMA_PUR[resolLlenguaModeSenior(llengua, t)] || TEXTOS_MODE_HUMA_PUR.ca;
}
