import { Especimen } from '../Especimen.jsx';
import { Alerta } from '../../../../components/PedraSeca/index.js';

export default function EspecimenFormulariComplex() {
  return (
    <Especimen id="formulari-complex" nom="Composició: formulari complex"
        descripcio="Referència de validació: en enviar, resum d’errors a dalt (role=alert) i error al costat de cada camp.">
      <Alerta tipus="info">Aquest formulari d'alta està en construcció (mancava migrar des de DesignSectionContent.jsx).</Alerta>
    </Especimen>
  );
}
