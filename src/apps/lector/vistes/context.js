/**
 * Lector de notícies · el context de les vistes (el posa AppLector).
 *
 *   lector    useLector: l'estat de la persona i les seues accions
 *   personals useFontsPersonals: les fonts que ha afegit la persona i `lleva`
 *   noticies  useNoticies: categories, fonts i resums, amb el seu estat, les
 *             fonts que no han respost (`caigudes`) i per què (`motiu`)
 *   font      el port de notícies (per a obrir un article sencer)
 *   ara       els mil·lisegons d'«ara» d'esta pintada (injectable a les proves)
 *   desfas    els minuts del fus de qui llig respecte d'UTC
 *   ruta      useApp().ruta: els camins absoluts de l'app
 *   enLinia   useSessioApp().enLinia: fals només si el dispositiu diu que no té xarxa
 *   llegixPersonals  T5b (261024) · cert si el port és el del servei de notícies
 *             i el servei llig les fonts personals (feedPersonal, i el seu
 *             estat() no les té apagades): llavors entren al port com una font
 *             més i ja no estan pendents
 *   delServei 261024 (Lector) · cert si el port és el del servei de notícies
 *   estatServei { disponible, personals } del servei (servei.estat()), o null
 *             mentre no ho ha dit (o si el servei no ho diu). Correcció L-07
 *             (261024 Lector final): es torna a llegir en acabar cada ronda i
 *             quan torna la xarxa, fins que és el definitiu (AppLector.jsx)
 *   mitjans   mitjans.js: imatge(url) i video(enllac) del servei; sense servei,
 *             sempre null. Correcció L-10: adreca(valor), la regla del servei
 *             per a una adreça de font, o null si el servei no la dona
 *   afigFont  fontsPersonals.js · afigFontPersonal sobre el magatzem de l'app
 *             (la gestió de fonts de l'arbre, GestioFonts.jsx)
 */
import { createContext, useContext } from 'react';

export const ContextLector = createContext(null);

export function useVistaLector() {
  const valor = useContext(ContextLector);
  if (!valor) throw new Error('useVistaLector s’ha de cridar dins d’AppLector');
  return valor;
}
