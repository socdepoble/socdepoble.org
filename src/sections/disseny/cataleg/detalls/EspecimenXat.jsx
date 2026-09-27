/**
 * EspecimenXat.jsx — l'espècimen viu del Xat (pla 260927_0055 §4.E).
 *
 * Mostra els components reals de src/sections/xat/components/ amb dades
 * fixes, sense XatContext ni xarxa: la fila de conversa (UX-B01), totes les
 * variants de la bombolla (UX-B02), el compositor (UX-B03) i la pastilla de
 * no llegits amb les marques d'estat (UX-B05). L'únic proveïdor que cal és
 * el d'AppGridShell, perquè el Compositor llig `mida` per decidir què fa
 * Retorn; ací es simula amb un valor fix commutable.
 *
 * Avatar i Boto s'importen del barril de PedraSeca: el tractor del catàleg
 * (C2) exigix que cada peça «viva» es renderitze en algun espècimen.
 */
import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { Avatar, Boto } from '../../../../components/PedraSeca/index.js';
import { AppGridContext } from '../../../../components/layout/AppGridShell.jsx';
import FilaConversa from '../../../xat/components/FilaConversa.jsx';
import Bombolla from '../../../xat/components/Bombolla.jsx';
import Compositor from '../../../xat/components/Compositor.jsx';
import MarquesEstat from '../../../xat/components/MarquesEstat.jsx';
import PastillaNoLlegits from '../../../xat/components/PastillaNoLlegits.jsx';

/* Traductor mínim: els components reben `t(clau, alternativa)` com a prop i
   les alternatives ja són el text en valencià. Sense UIContext. */
const t = (clau, alternativa) => alternativa;
const LOCALE = 'ca-ES';

/* Hores d'avui, perquè la llista mostre «17:34» i no una data. */
function hui(hores, minuts) {
  const d = new Date();
  d.setHours(hores, minuts, 0, 0);
  return d.toISOString();
}

const FILS = [
  {
    id: 'fil-comissio-festes',
    tipus: 'grup',
    name: 'Comissió de Festes',
    ultimText: 'Pepica: Qui porta les cadires dissabte?',
    ultimAl: hui(17, 34),
    noLlegits: 3,
    fixat: true
  },
  {
    id: 'fil-vicent-ferris',
    tipus: 'directe',
    name: 'Vicent Ferris',
    ultimText: 'Perfecte, comencem amb la sessió de hui.',
    ultimAl: hui(9, 12),
    noLlegits: 0,
    silenciat: true
  }
];

const MISSATGES = [
  {
    id: 'm-sistema', seq: 40, tipus: 'sistema', metadades: {},
    text: 'Javi Llinares ha creat el grup «Comissió de Festes»'
  },
  {
    id: 'm-altre', seq: 41, sender: 'other', author: 'Pepica la Vall',
    text: 'Bona vesprada! Qui porta les cadires dissabte?', creatAl: hui(17, 30)
  },
  {
    id: 'm-enllac', seq: 42, sender: 'other', author: 'Vicent Ferris',
    text: 'El programa ja és públic: https://socdepoble.org/festes', creatAl: hui(17, 31)
  },
  {
    id: 'm-llegit', seq: 43, sender: 'me', estatEnviament: 'llegit',
    text: 'Jo puc portar-ne una dotzena.', creatAl: hui(17, 32)
  },
  {
    id: 'm-esborrat', seq: 44, sender: 'other', author: 'Joan Baptiste', esborrat: true,
    text: null, creatAl: hui(17, 33)
  },
  {
    id: 'm-enviat', seq: 45, sender: 'me', estatEnviament: 'enviat',
    text: 'I la furgoneta la porte jo.', creatAl: hui(17, 34)
  },
  {
    id: 'm-pendent', seq: null, sender: 'me', estatEnviament: 'pendent',
    text: 'Vos passe la llista per ací.', creatAl: hui(17, 35)
  },
  {
    id: 'm-error', seq: null, sender: 'me', estatEnviament: 'error',
    text: 'I les taules?', creatAl: hui(17, 36)
  }
];

const PERSONES = [
  ['p-1', 'Joan Baptiste'], ['p-2', 'Maria la Vall'], ['p-3', 'Vicent Ferris'],
  ['p-4', 'Pepica la Vall'], ['p-5', 'IAIA MarIA'], ['p-6', 'Javi Llinares']
];

function LlistaDeMostra() {
  const [actiu, setActiu] = useState(FILS[0].id);
  return (
    <ul className="sdp-xat-llista" aria-label="Converses de mostra">
      {FILS.map((fil) => (
        <li key={fil.id}>
          <FilaConversa fil={fil} activa={fil.id === actiu} onSelect={setActiu} locale={LOCALE} t={t} />
        </li>
      ))}
    </ul>
  );
}

function CompositorDeMostra() {
  const [valor, setValor] = useState('');
  const [mida, setMida] = useState('ample');
  const estret = mida === 'estret';
  return (
    <AppGridContext.Provider value={{ mida }}>
      <div className="sdp-especimen__fila">
        <Boto varietat="secundari" aria-pressed={estret} onClick={() => setMida(estret ? 'ample' : 'estret')}>
          {estret ? 'Mode estret: Retorn fa salt de línia' : 'Mode ample: Retorn envia'}
        </Boto>
      </div>
      <Compositor valor={valor} onCanvia={setValor} onEnvia={() => setValor('')} t={t} />
    </AppGridContext.Provider>
  );
}

export default function EspecimenXat() {
  return (
    <Especimen id="xat" nom="Xat i missatgeria" fitxer="src/sections/xat/components/ · src/css/modules.css (sdp-xat-*)"
      descripcio="Les peces del Xat F0 tal com es munten sobre AppGridShell: fila de conversa de 72 px (--sdp-xat-fila-mida) amb avatar, nom, hora, previsualització i comptador; bombolles pròpies a la dreta (--sdp-accio-subtil) i alienes a l'esquerra (--sdp-accent-subtil), amb variants de sistema, esborrada, amb enllaç i en error; compositor amb textarea que creix fins a 6 línies; marques d'estat amb forma i text, mai només color."
      contracte={[
        ['FilaConversa', '{ fil, activa, onSelect, locale, t }', '—', 'Un botó per conversa; ressalta si hi ha no llegits o marca manual.'],
        ['Bombolla', '{ missatge, esGrup, locale, t, seleccio?, onReintenta?, onDescarta?, onCopia? }', '—', 'Un <li> per missatge; tria la variant per tipus, sender, esborrat i estatEnviament.'],
        ['Compositor', '{ valor, onCanvia, onEnvia, t, desactivat? }', '—', 'Controlat; necessita AppGridShell (o el seu context) per a saber si el mode és estret.'],
        ['PastillaNoLlegits', '{ quants, t }', '0', 'Res si quants és 0; «99+» per damunt de 99.'],
        ['MarquesEstat', "{ estat: 'pendent'|'enviat'|'llegit'|'error', t }", "'enviat'", 'Icona més text per al lector de pantalla.']
      ]}
      a11y={[
        'La fila és un <button> amb aria-current per a la conversa oberta; l’avatar porta alt="" perquè el nom ja està escrit.',
        'Cada marca d’estat i cada pastilla porten text en .sdp-nomes-lector: el color és secundari.',
        'La bombolla en error porta role="alert" i dos botons de 44 px: «Torna-ho a provar» i «Descarta».',
        'El compositor és un <textarea> amb aria-label; el botó d’enviar té nom i es desactiva sense text.',
        'Els enllaços ixen amb rel="noopener noreferrer" i avís si el domini porta caràcters enganyosos.'
      ]}
      fes={[
        'Passa `llavor` (l’identificador, no el nom) a l’Avatar per a un to estable per persona.',
        'Escriu el nom de l’autor a les bombolles alienes dels grups (esGrup).',
        'Munta les bombolles dins d’un <ol class="sdp-xat-missatges">: la Bombolla és un <li>.'
      ]}
      noFacis={[
        'Un punt de color com a únic senyal de no llegits: sempre el número dins de la pastilla.',
        'Prometre accions que no fan res (trucades, adjunts, micròfon): F1 és F1.',
        'Formatar hores al context: la UI ho fa amb temps.js i el locale de la llengua.'
      ]}>
      <h4>Fila de conversa (UX-B01)</h4>
      <LlistaDeMostra />

      <h4>Bombolles (UX-B02)</h4>
      <ol className="sdp-xat-missatges" aria-label="Conversa de mostra">
        {MISSATGES.map((missatge) => (
          <Bombolla key={missatge.id} missatge={missatge} esGrup locale={LOCALE} t={t} />
        ))}
      </ol>

      <h4>Compositor (UX-B03)</h4>
      <CompositorDeMostra />

      <h4>Pastilla de no llegits i marques d’estat (UX-B05)</h4>
      <div className="sdp-especimen__fila">
        <PastillaNoLlegits quants={1} t={t} />
        <PastillaNoLlegits quants={3} t={t} />
        <PastillaNoLlegits quants={120} t={t} />
      </div>
      <ul>
        <li>Pendent (rellotge): <MarquesEstat estat="pendent" t={t} /></li>
        <li>Enviat (una marca): <MarquesEstat estat="enviat" t={t} /></li>
        <li>Llegit (dos marques, blau acció): <MarquesEstat estat="llegit" t={t} /></li>
        <li>No enviat (avís): <MarquesEstat estat="error" t={t} /></li>
      </ul>

      <h4>Tons de l’avatar per llavor</h4>
      <div className="sdp-especimen__fila">
        {PERSONES.map(([id, nom]) => <Avatar key={id} nom={nom} mida="md" llavor={id} />)}
      </div>
    </Especimen>
  );
}
