import { useState } from 'react';
import { Especimen } from './Especimen.jsx';
import { Dialeg, DialegConfirmacio } from '../../../components/PedraSeca/index.js';
import { Boto } from '../../../components/PedraSeca/index.js';
import { Camp, CampText } from '../../../components/PedraSeca/index.js';
import { Pista } from '../../../components/PedraSeca/index.js';
import { Dropdown, DropdownItem } from '../../../components/PedraSeca/index.js';
import { showToast } from '../../../components/universal/AvisadorEfimer.jsx';

export default function PaginaSuperposicions() {
  const [modal, setModal] = useState(false);
  const [confirma, setConfirma] = useState(false);
  const [calaix, setCalaix] = useState(false);
  return (
    <>
      <h2>Diàlegs, calaixos i capes flotants</h2>
      <p>Tot el que tapa la pàgina usa <code>&lt;dialog&gt;</code> natiu: capa superior, vel, trampa de focus i Escape sense guerres de z-index amb les barres.</p>

      <Especimen id="dialeg" nom="Dialeg" fitxer="src/components/PedraSeca/Dialeg.jsx"
        descripcio="Modal genèric. En mòbil (≤720px) es convertix en full inferior: els botons queden a l’abast del polze, apilats i a tota amplada."
        contracte={[
          ['obert', 'boolean', '—', 'Controlat pel pare.'],
          ['onTanca', "(motiu: 'esc'|'vel'|'boto') => void", '—', 'El pare decidix; Escape no tanca a esquenes de React.'],
          ['titol', 'node', '—', 'Obligatori: és el nom accessible.'],
          ['descripcio', 'node', 'null', 'aria-describedby.'],
          ['accions', 'node', 'null', 'Peu amb botons (primari a la dreta).'],
          ['mida', "'s'|'m'|'g'", "'m'", '28 / 36 / 56 rem.'],
          ['costat', "null|'esquerra'|'dreta'", 'null', 'Calaix lateral a alçada completa.'],
          ['tancaEnVel', 'boolean', 'true', 'Clic al vel tanca. false en destructius.'],
        ]}
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

      <Especimen id="confirmacio" nom="DialegConfirmacio" fitxer="src/components/PedraSeca/Dialeg.jsx"
        descripcio="Confirmació. Amb destructiu, el focus inicial va a «Cancel·lar» i el vel no tanca (Llei de la Por Orgànica)."
        contracte={[
          ['onConfirma', '() => void', '—', 'Acció confirmada.'],
          ['destructiu', 'boolean', 'false', 'Botó en perill, focus a Cancel·lar, vel inactiu.'],
          ['etiquetaConfirma / etiquetaCancela', 'string', "'Confirmar' / 'Cancel·lar'", 'Usa el verb real: «Esborrar la nota».'],
          ['carregant', 'boolean', 'false', 'Mentre s’executa.'],
        ]}
        a11y={['Un Intro distret cancel·la, no esborra.']}
        fes={['Dir què es perd: «Es perdran 3 notes».']} noFacis={['«Esteu segur?» sense dir de què.', '«Sí / No» com a etiquetes.']}>
        <Boto varietat="perill" onClick={() => setConfirma(true)}>Esborrar la nota</Boto>
        <DialegConfirmacio obert={confirma} destructiu titol="Esborrar «Guia ràpida»?"
          descripcio="La nota anirà a la paperera 30 dies. Després no es podrà recuperar."
          etiquetaConfirma="Esborrar la nota" onTanca={() => setConfirma(false)}
          onConfirma={() => { setConfirma(false); showToast('Nota a la paperera', 'success'); }} />
      </Especimen>

      <Especimen id="calaix" nom="Calaix (Dialeg costat)" fitxer="src/components/PedraSeca/Dialeg.jsx"
        descripcio="Panell lateral per a filtres, índex o detalls secundaris. Mateix contracte que Dialeg."
        fes={['Filtres en mòbil, índex de secció.']} noFacis={['Navegació principal: això és la barra lateral de l’UniversalShell.']}>
        <Boto onClick={() => setCalaix(true)}>Obrir calaix de filtres</Boto>
        <Dialeg obert={calaix} costat="dreta" onTanca={() => setCalaix(false)} titol="Filtres"
          accions={<Boto varietat="primari" ple onClick={() => setCalaix(false)}>Veure resultats</Boto>}>
          <p>Contingut del calaix.</p>
        </Dialeg>
      </Especimen>

      <Especimen id="pista" nom="Pista (toggletip)" fitxer="src/components/PedraSeca/Pista.jsx"
        descripcio="Ajuda que es toca. Substituïx els tooltips de title=, que no existixen en pantalla tàctil."
        contracte={[['etiqueta', 'string', "'Ajuda'", 'Nom accessible del botó «?».'], ['children', 'node', '—', 'Text curt d’ajuda.']]}
        a11y={['aria-expanded al botó; el text s’anuncia en obrir.', 'Escape i tocar fora el tanquen.']}
        fes={['Frases curtes que expliquen un terme.']} noFacis={['Amagar ací informació imprescindible per a completar la tasca.']}>
        <p>Número de parcel·la <Pista etiqueta="Què és el número de parcel·la?">El trobaràs al rebut de l’IBI, a dalt a la dreta.</Pista></p>
      </Especimen>

      <Especimen id="menu" nom="Dropdown · DropdownItem" fitxer="src/components/PedraSeca/Dropdown.jsx"
        descripcio="Menú contextual. DEUTE: minWidth arriba com a estil en línia i no gestiona focus per fletxes; pendent de migrar a <dialog> o popover."
        fes={['Accions secundàries d’un element.']} noFacis={['Navegació principal dins d’un menú flotant.']}>
        <Dropdown trigger={<button type="button" className="sdp-boto sdp-boto--secundari">Opcions de la nota</button>}>
          <DropdownItem>Fer pública</DropdownItem>
          <DropdownItem>Moure a carpeta</DropdownItem>
        </Dropdown>
      </Especimen>

      <Especimen id="toast" nom="showToast (avís efímer)" fitxer="src/components/universal/AvisadorEfimer.jsx"
        descripcio="Confirmació que no demana acció. Si cal actuar, és una Alerta en línia o un Dialeg."
        contracte={[['showToast(missatge, tipus, durada)', "string, 'success'|'error'|…, ms", '3000', 'Crida imperativa.']]}
        fes={['«Nota desada».']} noFacis={['Errors que cal corregir en un toast que desapareix.']}>
        <Boto onClick={() => showToast('Nota desada', 'success')}>Mostrar un avís efímer</Boto>
      </Especimen>
    </>
  );
}
