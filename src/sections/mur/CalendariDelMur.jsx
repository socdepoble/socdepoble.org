/**
 * CalendariDelMur.jsx — la pestanya Calendari del Mur: el calendari únic de
 * Sóc de Poble (CalendariDelPoble) amb els actes del Mur.
 *
 * Onada 6 (prompt 261009_0230, punt 1: «El Mur i el Calendari gastaven
 * components diferents; s'han d'unificar absolutament sota l'estètica i
 * funcionalitat de Google Calendar») · Abans, CalendariMur (la taula de
 * CalendariEsdeveniments, una píndola per dia, sense vistes ni enllaços). Ara
 * el mateix calendari que /calendari: «Hui ‹ ›» amb el títol a la mateixa
 * fila, les cinc vistes, l'enllaç de cada acte a la seua pàgina (amb ratolí) i,
 * davall, les targetes del dia triat o del període que es veu, amb la mateixa
 * regla (entradesDelDia, la d'acteOcorreElDia). Només els actes del Mur: ni
 * l'agenda de Sollutia ni les fonts de Google (són de la pàgina /calendari),
 * ni les tasques del Mapa de la Consola (privacitat, agendaMur.js).
 *
 * L'estat és el de la URL, com a /calendari (useEstatCalendari: ?vista=,
 * ?setmana=, ?date=, ?mes= i ?any=, sempre amb replace); el ?date= és el
 * mateix filtre del Mur. S'obri al mes del pròxim acte (mesDeLActeMesProper,
 * la regla del Mur des de T6; calendari-4: només els que el calendari sap
 * pintar) o, sense cap, al de hui. MurSection el munta només amb la pestanya
 * oberta (els hooks no es criden a mitges) i, en eixir-ne, lleva la vista i
 * el període de la URL i conserva el ?date=.
 */
import { useMemo } from 'react';
import { diaIso } from '../../components/universal/editorial.js';
import { cursorDe } from '../../utils/calendari.js';
import { recurrenciaSuportada } from '../../utils/esdeveniment.js';
import { CalendariDelPoble } from '../calendari/CalendariDelPoble.jsx';
import { diaDeLaClau, entradesDelCalendari } from '../calendari/calendariGlobal.js';
import { useEstatCalendari } from '../calendari/useEstatCalendari.js';
import { mesDeLActeMesProper } from './agendaMur.js';

export function CalendariDelMur({ actes }) {
  // El dia, no l'instant: el mes d'obertura no es recalcula a cada pintada.
  const hui = diaIso(new Date());
  const avui = useMemo(() => diaDeLaClau(hui), [hui]);
  const entrades = useMemo(() => entradesDelCalendari(actes), [actes]);
  const obertura = useMemo(() => {
    const pintables = entrades.map((entrada) => entrada.acte).filter((esd) => esd && recurrenciaSuportada(esd));
    return mesDeLActeMesProper(pintables, avui) ?? cursorDe(avui);
  }, [entrades, avui]);
  const { estat, navega, canviaVista, triaDia, obriDia } = useEstatCalendari({ obertura, avui });
  const senseData = entrades.filter((entrada) => !entrada.esdeveniment).length;

  return (
    <CalendariDelPoble estat={estat} navega={navega} canviaVista={canviaVista} triaDia={triaDia} obriDia={obriDia}
      entrades={entrades} avui={avui} senseData={senseData} />
  );
}
