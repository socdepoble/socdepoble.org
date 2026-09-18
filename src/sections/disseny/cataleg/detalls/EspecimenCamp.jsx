import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Camp, CampText, AreaText, Selector, Casella, GrupOpcions, GrupCamps, Interruptor, Boto, Alerta, PillToggle, UniversalSearch } from '../../../../components/PedraSeca/index.js';

export default function EspecimenCamp() {
  return (
    <Especimen id="camp" nom="Camp · CampText · AreaText · Selector" fitxer="src/components/PedraSeca/formulari.jsx"
        descripcio="Contenidor de camp amb etiqueta, ajuda i error. El control de dins hereta id, aria-describedby, aria-invalid i required."
        contracte={[           ['etiqueta', 'node', '—', 'Obligatòria i sempre visible.'],           ['ajuda', 'node', 'null', 'Instrucció curta abans del control.'],           ['error', 'string', 'null', 'Què passa i com arreglar-ho. Activa aria-invalid.'],           ['obligatori', 'boolean', 'false', 'Escriu «(obligatori)» en text, no només un asterisc.'],           ['CampText.tipus', "'text'|'email'|'tel'|'number'|'search'|'password'|'date'", "'text'", 'Tipus natiu: el mòbil mostra el teclat bo.'],           ['Selector.opcions', '{ valor, etiqueta, desactivat? }[]', '[]', 'Opcions del <select> natiu.'],
        ]}
        a11y={['label[for] ↔ input[id] garantit per construcció.', 'L’error s’anuncia per aria-describedby; porta icona i text, no només roig.', 'Un control fora de <Camp> llança un error en desenvolupament.']}
        fes={['Validar en enviar, no a cada tecla.', 'Usar autoComplete i inputMode.']}
        noFacis={['Placeholder com a etiqueta.', 'Errors genèrics («Camp invàlid»).']}>
        <Camp etiqueta="Nom del poble" ajuda="Tal com l’escriu l’Ajuntament."><CampText placeholder="La Torre de les Maçanes" /></Camp>
        <Camp etiqueta="Telèfon" error="Falta un dígit: han de ser 9."><CampText tipus="tel" defaultValue="96 555 12" /></Camp>
        <Camp etiqueta="Província" obligatori><Selector opcions={[{ valor: 'a', etiqueta: 'Alacant' }, { valor: 'v', etiqueta: 'València' }, { valor: 'c', etiqueta: 'Castelló' }]} /></Camp>
        <Camp etiqueta="Descripció"><AreaText placeholder="Una breu descripció…" /></Camp>
        <Camp etiqueta="Camp desactivat"><CampText defaultValue="No editable" disabled /></Camp>
    </Especimen>
  );
}
