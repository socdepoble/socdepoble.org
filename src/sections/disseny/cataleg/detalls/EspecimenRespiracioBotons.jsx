import { Especimen } from '../Especimen.jsx';
import { Boto } from '../../../../components/PedraSeca/atoms/Boto.jsx';
import { BotoVeuIaia } from '../../../../components/PedraSeca/molecules/BotoVeuIaia.jsx';
import { LogotipApple } from '../../../onboarding/LogotipsDeMarca.jsx';

/** R26.2 · Etiquetes reals i llargues, sense CSS de demostració que amague la cascada.
 *  R26.3 (ordre del Mestre del 14-11-2026) · El botó de l'App Store és l'àtom Boto amb
 *  marca="apple", no un <button> amb les classes escrites a mà. */
export default function EspecimenRespiracioBotons() {
  return (
    <Especimen id="respiracio-botons" nom="Respiració lateral dels botons"
      fitxer="src/css/components.css"
      descripcio="El coixí lateral es conserva quan falta espai: el grup baixa centrat i l'etiqueta pot fer línies."
      a11y={['Els textos visibles es conserven sencers.', 'Focus visible i objectius tàctils del botó canònic.']}
      fes={['Comprova 360 × 640 i també un contenidor estret.', 'Més de dos espais laterals per cada espai vertical.', 'Botó de marca amb l’àtom: <Boto marca="apple">.']}
      noFacis={['Llevar coixí per fer cabre una etiqueta.', 'Canviar el botó de veu de la IAIA.', 'Escriure a mà les classes sdp-boto--marca en un <button>.']}>
      <div className="sdp-pila sdp-pila--espai-4">
        <Boto mida="gran" varietat="primari" ple><span aria-hidden="true">📲 </span>Instal·lar l'App (PWA)</Boto>
        <div className="sdp-accions" aria-label="Mostra de botigues">
          <Boto marca="apple" mida="gran" icona={LogotipApple}>Disponible a l'App Store</Boto>
          <Boto mida="gran">WordPress.org</Boto>
        </div>
        <div className="sdp-accions"><Boto>Guardar les preferències del dispositiu</Boto><Boto disabled>Acció desactivada</Boto></div>
        <div className="sdp-xat-pindoles" aria-label="Mostra de filtres"><button type="button" className="sdp-xat-pindoles__boto" aria-pressed="true">Totes les converses</button><button type="button" className="sdp-xat-pindoles__boto" aria-pressed="false">Missatges sense llegir</button><button type="button" className="sdp-xat-pindoles__boto" aria-pressed="false">Grups i comunitats</button></div>
        <div className="sdp-xat-segments" aria-label="Mostra de segments"><button type="button" className="sdp-xat-segments__opcio" aria-pressed="true">Fitxers del dispositiu</button><button type="button" className="sdp-xat-segments__opcio" aria-pressed="false">Enllaços compartits</button><button type="button" className="sdp-xat-segments__opcio" aria-pressed="false">Documents del poble</button></div>
        <div className="sdp-veu-lectura-marc"><BotoVeuIaia text="Este botó conserva el disseny anterior." /></div>
      </div>
    </Especimen>
  );
}
