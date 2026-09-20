import { Send } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { Avatar, Boto } from '../../../../components/PedraSeca/index.js';

export default function EspecimenXat() {
  return (
    <Especimen id="xat" nom="Xat i missatgeria" fitxer="src/css/modules.css (.sdp-chat-bubble) · src/sections/xat/"
      descripcio="Components estructurals de la fase de Consell i interacció humà–màquina. Les bambolles mantenen contrast AA segons l'origen (usuari vs IA/sistema); el compositor creix en alçada per a missatges multilínia."
      a11y={['Cada bambolla porta l’hora en text (.sdp-chat-bubble-meta).', 'El compositor és un <textarea> amb etiqueta i el botó d’enviar té nom.']}
      fes={['Avatar de mida sm al costat de cada missatge.', 'Alinear a la dreta només els missatges propis.']}
      noFacis={['Color com a únic senyal de qui parla.']}>
      <h4>Bambolles</h4>
      <div className="chat-container">
        <div className="dsg-msg-container">
          <Avatar nom="IAIA MarIA" mida="sm" />
          <div className="sdp-chat-bubble sdp-chat-bubble--ai">
            <p>Bona vesprada, Mestre. El sistema Pedra Seca està 100% operatiu i les constants vitals són estables.</p>
            <span className="sdp-chat-bubble-meta">17:34</span>
          </div>
        </div>
        <div className="dsg-msg-container dsg-msg-self">
          <Avatar nom="Javi Llinares" mida="sm" />
          <div className="sdp-chat-bubble sdp-chat-bubble--user">
            <p>Perfecte, comencem amb la sessió de hui.</p>
            <span className="sdp-chat-bubble-meta">17:36</span>
          </div>
        </div>
      </div>

      <h4>Compositor de missatges</h4>
      <div className="chat-input-wrapper">
        <div className="dsg-flex-1">
          <label className="sr-only" htmlFor="especimen-xat-missatge">Missatge</label>
          <textarea id="especimen-xat-missatge" className="chat-input-textarea form-control" placeholder="Escriu un missatge..." rows="1"></textarea>
        </div>
        <Boto varietat="primari" icona={Send} aria-label="Enviar">Enviar</Boto>
      </div>
    </Especimen>
  );
}
