import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Dialeg, DialegConfirmacio } from '../../../../components/PedraSeca/index.js';
import { Boto } from '../../../../components/PedraSeca/index.js';
import { Camp, CampText } from '../../../../components/PedraSeca/index.js';
import { Pista } from '../../../../components/PedraSeca/index.js';
import { Dropdown, DropdownItem } from '../../../../components/PedraSeca/index.js';
import { showToast } from '../../../../components/universal/AvisadorEfimer.jsx';

export default function EspecimenDialeg() {
  return (
    <Especimen id="dialeg" nom="Dialeg" fitxer="src/components/PedraSeca/Dialeg.jsx"
        descripcio="Modal genèric. En mòbil (≤720px) es convertix en full inferior: els botons queden a l’abast del polze, apilats i a tota amplada."
        contracte={[           ['obert', 'boolean', '—', 'Controlat pel pare.'],           ['onTanca', "(motiu: 'esc'|'vel'|'boto') =>       void", '—', 'El pare decidix; Escape no tanca a esquenes de React.'],           ['titol', 'node', '—', 'Obligatori: és el nom accessible.'],           ['descripcio', 'node', 'null', 'aria-describedby.'],           ['accions', 'node', 'null', 'Peu amb botons (primari a la dreta).'],           ['mida', "'s'|'m'|'g'", "'m'", '28 / 36 / 56 rem.'],           ['costat', "null|'esquerra'|'dreta'", 'null', 'Calaix lateral a alçada completa.'],           ['tancaEnVel', 'boolean', 'true', 'Clic al vel tanca. false en destructius.'],         ]}
        a11y={['showModal(): la resta de la pàgina queda inert.', 'El focus torna a qui l’ha obert.', 'Títol en <h2> amb aria-labelledby.']}
        fes={['Un diàleg, una tasca.', 'Formularis curts (≤ 3 camps).']}
        noFacis={['Diàlegs dins de diàlegs.', 'Obrir-lo sense acció de la persona (finestres molestes).']}>
        <Boto varietat="primari" onClick={() => setModal(true)}>Obrir un diàleg</Boto>
        <Dialeg obert={modal} onTanca={() => setModal(false)} titol="Canviar el nom de la carpeta"
          descripcio="El nou nom es veurà a totes les notes d’aquesta carpeta."
          accions={<><Boto onClick={() => setModal(false)}>Cancel·lar</Boto><Boto varietat="primari" onClick={() => { setModal(false); showToast('Nom desat', 'success'); }}>Desar</Boto></>}>
          <Camp etiqueta="Nom de la carpeta"><CampText defaultValue="Mur" /></Camp>
        </Dialeg>
    </Especimen>
  );
}
