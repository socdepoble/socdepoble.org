import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Dialeg } from '../../../../components/PedraSeca/index.js';
import { Accions, Boto } from '../../../../components/PedraSeca/index.js';
import { Camp, CampText } from '../../../../components/PedraSeca/index.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { Llinatge } from '../Llinatge.jsx';

export default function EspecimenDialeg() {
  const { showToast } = useToast();
  const [modal, setModal] = useState(false);
  const [barra, setBarra] = useState(false);
  return (
    <>
    <Llinatge id="dialeg" />
    <Especimen id="dialeg" nom="Dialeg" fitxer="src/components/PedraSeca/organismes/Dialeg.jsx"
        descripcio="Modal genèric. En mòbil (≤720px) es convertix en full inferior: els botons queden a l’abast del polze, apilats i a tota amplada."
        contracte={[           ['obert', 'boolean', '—', 'Controlat pel pare.'],           ['onTanca', "(motiu: 'esc'|'vel'|'boto', info?) =>       void", '—', 'El pare decidix; Escape no tanca a esquenes de React. Si el navegador el tanca igualment (dos Escape seguits), avisa amb info = { forcat: true } i el pare l’ha de donar per tancat.'],           ['titol', 'node', '—', 'Obligatori: és el nom accessible.'],           ['descripcio', 'node', 'null', 'aria-describedby.'],           ['accions', 'node', 'null', 'Peu amb botons (primari a la dreta).'],           ['mida', "'s'|'m'|'g'", "'m'", '28 / 36 / 56 rem.'],           ['costat', "null|'esquerra'|'dreta'", 'null', 'Calaix lateral a alçada completa.'],           ['tancaEnVel', 'boolean', 'true', 'Clic al vel tanca. false en destructius.'],
          ['lloc', "'centre'|'barra'", "'centre'", "T40–T41: 'barra' és la finestra flotant de la barra taronja (data de publicació i visibilitat): en escriptori, dalt a la dreta davall de les barres; en mòbil, el full inferior. Un calaix (costat) mana."],
        ]}
        a11y={['showModal(): la resta de la pàgina queda inert.', 'El focus torna a qui l’ha obert.', 'Títol en <h2> amb aria-labelledby.']}
        fes={['Un diàleg, una tasca.', 'Formularis curts (≤ 3 camps).']}
        noFacis={['Diàlegs dins de diàlegs.', 'Obrir-lo sense acció de la persona (finestres molestes).']}>
        {/* IDEA-26 i IDEA-27 (ordre del Mestre, 261025) · Els dos botons, junts dins
            d'Accions, sols a la caixa; els diàlegs van fora (tancats no es veuen, i un
            <dialog> germà desfaria el primer i l'últim fill de la caixa). Cadascun
            torna el focus al botó que l'ha obert. */}
        <Accions>
          <Boto varietat="primari" onClick={() => setModal(true)}>Obrir un diàleg</Boto>
          <Boto onClick={() => setBarra(true)} aria-haspopup="dialog">Obrir la finestra de la barra</Boto>
        </Accions>
    </Especimen>
    <Dialeg obert={modal} onTanca={() => setModal(false)} titol="Canviar el nom de la carpeta"
      descripcio="El nou nom es veurà a totes les notes d’aquesta carpeta."
      accions={<><Boto onClick={() => setModal(false)}>Cancel·lar</Boto><Boto varietat="primari" onClick={() => { setModal(false); showToast('Nom desat', 'success'); }}>Desar</Boto></>}>
      <Camp etiqueta="Nom de la carpeta"><CampText defaultValue="Mur" /></Camp>
    </Dialeg>
    <Dialeg obert={barra} onTanca={() => setBarra(false)} lloc="barra" mida="s" titol="Finestra de la barra taronja"
      descripcio="La mateixa anatomia per a la data de publicació i per a la visibilitat: títol, descripció, cos i peu d’accions."
      accions={<><Boto onClick={() => setBarra(false)}>Cancel·lar</Boto><Boto varietat="primari" onClick={() => setBarra(false)}>Fet</Boto></>}>
      <p>En escriptori s’ancora dalt a la dreta, davall de les barres, prop dels botons que l’obrin. En mòbil és el full inferior de sempre.</p>
    </Dialeg>
    </>
  );
}
