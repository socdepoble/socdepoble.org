/**
 * PublicarDeLaPagina.jsx — P6 · Onada 4, sisena passada (directriu
 * 261003_2325 del Mestre, confirmació 4) · El gran botó blau «Publicar» al
 * final de les sis UniversalPage de la doble acció (/page/publicar_mur,
 * publicar_mercat, publicar_calendari, publicar_mapa, vehicle_compartit i
 * animalets). Qui ja ha llegit què passarà si publica, publica d'ací mateix.
 *
 *  · Una sola font: el destí és el de la porta «Publicar» de la targeta
 *    (destinsControl.js · destiDePagina i portesDe), amb el mateix nom
 *    accessible i el mateix avís. Cap segona taula ni cap ruta fictícia.
 *  · El Mur porta al Bloc (/notes) amb el router de l'app (Link, amb la base
 *    de l'amfitrió); les altres cinc encara no tenen editor: el botó és inert
 *    (aria-disabled, «(en obres)» al nom) i en prémer-lo ho diu amb el toast.
 *  · TextSection el pinta davall del text (children): és React, no HTML, i
 *    cap handler viatja dins de la cadena sanejada.
 * Una pàgina que no és de cap targeta del Panell no pinta res.
 */
import { useUIActions } from '../../app/contexts/UIContext';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { destiDePagina, portesDe } from './destinsControl.js';

export function PublicarDeLaPagina({ clau }) {
  const { t } = useUIActions();
  const desti = destiDePagina(clau);
  if (!desti) return null;
  const [publicar] = portesDe(desti, t);
  return (
    <div className="sdp-pagina-accio">
      <PortaDePagina porta={publicar} />
    </div>
  );
}
