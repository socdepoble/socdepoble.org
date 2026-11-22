/**
 * useLlenguaDeLaUI.js — la llengua del text de la interfície per als diccionaris diferits del Perfil (R32.37), o
 * undefined.
 *
 * v1.2.21 · integració de R32.37 · Els cinc consumidors (DetallCompte, DialegNovaOrganitzacio, PanellSessionsDetall,
 * PaginesTrilogiaWp i PanellUsuarisDispositiusBotigues) llegien UIContext important src/app/contexts/objectesDeContext.js,
 * i la regla de propietaris ho prohibix (objectesDeContext.test.jsx: només l'importen els .jsx del seu context). Ara
 * passen per useUIStateOpcional dins d'un try, com useTraductorOpcional: sense UIProvider (un espècimen solt) o amb una
 * prova que simula UIContext sense eixa exportació, undefined, i el diccionari parla valencià, com abans de R32.37.
 */
import { useUIStateOpcional } from '../../app/contexts/UIContext';

export function useLlenguaDeLaUI() {
  try {
    const ui = useUIStateOpcional();
    return ui?.llenguaDelText || ui?.language;
  } catch {
    return undefined;
  }
}
