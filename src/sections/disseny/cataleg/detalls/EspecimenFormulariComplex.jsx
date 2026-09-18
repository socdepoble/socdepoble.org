import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Camp, CampText, AreaText, Selector, Casella, GrupOpcions, GrupCamps, Interruptor, Boto, Alerta, PillToggle, UniversalSearch } from '../../../../components/PedraSeca/index.js';

export default function EspecimenFormulariComplex() {
  return (
    <Especimen id="formulari-complex" nom="Composició: formulari complex"
        descripcio="Referència de validació: en enviar, resum d’errors a dalt (role=alert) i error al costat de cada camp.">
      <FormulariAlta />
    </Especimen>
  );
}
