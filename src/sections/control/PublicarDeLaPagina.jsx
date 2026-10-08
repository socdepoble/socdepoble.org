/**
 * PublicarDeLaPagina.jsx — P6 · Onada 4, sisena passada (directriu
 * 261003_2325 del Mestre, confirmació 4) · El gran botó blau «Publicar» al
 * final de les UniversalPage de la doble acció (/page/publicar_mur,
 * publicar_mercat, publicar_calendari, publicar_mapa, vehicle_compartit,
 * animalets, treball i habitatge). Qui ja ha llegit què passarà si publica,
 * publica d'ací mateix. Peça C (ordre del Mestre, 261007, prompt
 * 261007_1628) · Són vuit (DESTINS_CONTROL): les sis de P6 i, des del W4-08
 * (261004), Treball i Habitatge. Abans esta capçalera en deia sis.
 *
 *  · Una sola font: el destí és el de la porta «Publicar» de la targeta
 *    (destinsControl.js · destiDePagina i portesDe), amb el mateix nom
 *    accessible i el mateix avís. Cap segona taula ni cap ruta fictícia.
 *  · El Mur porta al Bloc (/notes) amb el router de l'app (Link, amb la base
 *    de l'amfitrió); les altres set encara no tenen editor: el botó és inert
 *    (aria-disabled, «(en obres)» al nom) i en prémer-lo ho diu amb el toast.
 *  · TextSection el pinta davall del text (children): és React, no HTML, i
 *    cap handler viatja dins de la cadena sanejada.
 * Una pàgina que no és de cap targeta del Panell no pinta res.
 *
 * T8 (ordre del Mestre, 261004, prompt 261004_0515 §6, «el botonaco de
 * Publicar») · El mateix botó gran blau també dalt, davall de l'H1, on van les
 * etiquetes: la finalitat de la pàgina es veu només entrar. `lloc`:
 *  · 'baix' (per defecte) · el de sempre, dins de div.sdp-pagina-accio, al
 *    final del text. Sense la prop, el DOM de sempre.
 *  · 'dalt' · la porta sola: PageFrame la posa dins de div.page-title-accio
 *    (la ranura accioPrincipal), que ja li dona l'aire.
 * Els dos són la mateixa porta (destí, nom accessible i avís): dos controls
 * amb el mateix nom que porten al mateix lloc (WCAG 2.4.4). El de dalt és
 * dins del bloc del títol i es veu també amb la pàgina traduïda; el de baix
 * és dins del cos original, que s'amaga quan es traduïx.
 * Fora d'abast (decidit): PluginPage (/plugin/:id) té el mateix patró de
 * botó al final, però amb «Obrir …», no «Publicar»: no porta el de dalt.
 */
import { useUIActions } from '../../app/contexts/UIContext';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { destiDePagina, portesDe } from './destinsControl.js';

export function PublicarDeLaPagina({ clau, lloc = 'baix' }) {
  const { t } = useUIActions();
  const desti = destiDePagina(clau);
  if (!desti) return null;
  const [publicar] = portesDe(desti, t);
  if (lloc === 'dalt') return <PortaDePagina porta={publicar} />;
  return (
    <div className="sdp-pagina-accio">
      <PortaDePagina porta={publicar} />
    </div>
  );
}
