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
 *
 * Onada 3B (Pedra Seca §9): la capçalera de la conversa d'una pàgina
 * («Sobre:» i participants) i la dels Avisos (el megàfon), i el compositor
 * amb l'avís dels Avisos (qui no n'és administrador no hi escriu) i amb
 * l'avís del xat públic d'una pàgina. La resta de peces noves del Xat viuen
 * a EspecimenXatLlista, EspecimenXatCerca, EspecimenXatComunitats,
 * EspecimenXatNovaConversa i EspecimenXatRail.
 *
 * Torn 260930 (T1 · la conversa calcada de WhatsApp Desktop): les bombolles
 * es pinten agrupades com a la conversa (anotaGrups: la cua i el nom només a
 * la primera de cada tirada); un grup de tres de la mateixa persona; el
 * separador «N missatges no llegits»; dos respostes, una amb la cita que
 * porta a l'original i una amb l'original sense carregar; el botó «Baixa al
 * final» amb la pastilla, i la barra de resposta damunt del compositor.
 */
import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { Avatar, Boto } from '../../../../components/PedraSeca/index.js';
import { AppGridContext } from '../../../../components/layout/AppGridShell.jsx';
import FilaConversa from '../../../xat/components/FilaConversa.jsx';
import Bombolla from '../../../xat/components/Bombolla.jsx';
import Compositor from '../../../xat/components/Compositor.jsx';
import CapcaleraConversa from '../../../xat/components/CapcaleraConversa.jsx';
import MarquesEstat from '../../../xat/components/MarquesEstat.jsx';
import PastillaNoLlegits from '../../../xat/components/PastillaNoLlegits.jsx';
import SeparadorNoLlegits from '../../../xat/components/SeparadorNoLlegits.jsx';
import BotoBaixar from '../../../xat/components/BotoBaixar.jsx';
import BarraResposta from '../../../xat/components/BarraResposta.jsx';
import { mapejaFil } from '../../../xat/missatges.js';
import { anotaGrups } from '../../../xat/conversa.js';

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

/* Les files com les munta la conversa: cada missatge amb primerDelGrup. */
const filesDe = (missatges) => anotaGrups(missatges.map((msg) => ({ tipus: 'missatge', clau: msg.id, msg })));

/* T1 · Un grup de tres de Pepica (cua i nom només a la primera) i dos
   respostes pròpies: una a un missatge de la llista i una a un que no s'ha
   carregat («Missatge no carregat»). */
const GRUP = [
  { id: 'g-1', seq: 50, sender: 'other', author: 'Pepica la Vall', usuariId: 'p-4', text: 'Ja tinc les cadires.', creatAl: hui(18, 1) },
  { id: 'g-2', seq: 51, sender: 'other', author: 'Pepica la Vall', usuariId: 'p-4', text: 'Les deixe a la plaça o al magatzem de la Societat?', creatAl: hui(18, 1) },
  { id: 'g-3', seq: 52, sender: 'other', author: 'Pepica la Vall', usuariId: 'p-4', text: 'Diuen pluja per a dissabte.', creatAl: hui(18, 2) },
  { id: 'g-4', seq: 53, sender: 'me', estatEnviament: 'enviat', respostaA: 'g-2', text: 'Al magatzem, millor.', creatAl: hui(18, 3) },
  { id: 'g-5', seq: 54, sender: 'me', estatEnviament: 'enviat', respostaA: 'm-antic', text: 'I la llista de la setmana passada?', creatAl: hui(18, 4) }
];

function ConversaAgrupadaDeMostra() {
  const [avis, setAvis] = useState('');
  const [ressaltat, setRessaltat] = useState(null);
  const perId = new Map(GRUP.map((m) => [m.id, m]));
  return (
    <>
      <ol className="sdp-xat-missatges" aria-label="Grup, no llegits i respostes de mostra">
        <SeparadorNoLlegits quants={3} t={t} />
        {filesDe(GRUP).map(({ clau, msg, primerDelGrup }) => (
          <Bombolla
            key={clau}
            missatge={msg}
            esGrup
            primerDelGrup={primerDelGrup}
            citat={msg.respostaA ? perId.get(msg.respostaA) ?? null : null}
            onVesACita={(id) => { setRessaltat(id); setAvis('La cita portaria a l’original i el ressaltaria.'); }}
            onRespon={(m) => setAvis(`Obriria la barra de resposta a «${m.text}».`)}
            ressaltat={ressaltat === msg.id}
            locale={LOCALE}
            t={t}
          />
        ))}
      </ol>
      <BotoBaixar nous={4} onBaixa={() => setAvis('Baixaria al final de la conversa.')} t={t} />
      {avis ? <p role="status">{avis}</p> : null}
    </>
  );
}

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

/* Onada 3B · Fils de pàgina i d'Avisos, passats per mapejaFil com els dona
   el context. «Festa major» és el xat comú d'una publicació del Mur; els
   Avisos, el canal d'una comunitat on la persona és membre (no admin). */
const FIL_PAGINA = mapejaFil({
  id: 'g-festa', tipus: 'grup', titol: 'Festa major', participants: 12, altresNoms: ['Pep', 'Maria'],
  subjecte: { tipus: 'publicacio', id: 'p-festa', ruta: '/mur', titol: 'Festa major' }
});
const FIL_AVISOS = mapejaFil({
  id: 'a-sdp', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-sdp', rol: 'membre', altresNoms: ['Javi', 'Maria', 'Pep'],
  imatgeUrl: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg'
});

function CapcaleresDeMostra() {
  const [avis, setAvis] = useState('');
  return (
    <>
      <CapcaleraConversa fil={FIL_PAGINA} onTorna={() => setAvis('Fletxa: tornaria a la llista.')} onSeleccionar={() => setAvis('Entraria a «Seleccionar missatges».')} t={t} />
      <CapcaleraConversa fil={FIL_AVISOS} onTorna={() => setAvis('Fletxa: tornaria a la llista.')} onSeleccionar={() => setAvis('Entraria a «Seleccionar missatges».')} t={t} />
      {avis ? <p role="status">{avis}</p> : null}
    </>
  );
}

function CompositorsDePagina() {
  const [valor, setValor] = useState('');
  return (
    <AppGridContext.Provider value={{ mida: 'ample' }}>
      <div className="sdp-xat-conversa">
        <Compositor valor="" onCanvia={() => {}} onEnvia={() => {}} t={t} fil={FIL_AVISOS} />
      </div>
      <div className="sdp-xat-conversa">
        <Compositor valor={valor} onCanvia={setValor} onEnvia={() => setValor('')} t={t} fil={FIL_PAGINA} />
      </div>
    </AppGridContext.Provider>
  );
}

/* T1 · El compositor porta la barra de resposta damunt quan es respon: la ✕
   o Escape la tanquen, i enviar la buida. */
function CompositorDeMostra() {
  const [valor, setValor] = useState('');
  const [mida, setMida] = useState('ample');
  const [resposta, setResposta] = useState(GRUP[1]);
  const estret = mida === 'estret';
  const tanca = () => setResposta(null);
  return (
    <AppGridContext.Provider value={{ mida }}>
      <div className="sdp-especimen__fila">
        <Boto varietat="secundari" aria-pressed={estret} onClick={() => setMida(estret ? 'ample' : 'estret')}>
          {estret ? 'Mode estret: Retorn fa salt de línia' : 'Mode ample: Retorn envia'}
        </Boto>
        <Boto varietat="secundari" disabled={Boolean(resposta)} onClick={() => setResposta(GRUP[1])}>
          Respon a Pepica
        </Boto>
      </div>
      <Compositor
        valor={valor}
        onCanvia={setValor}
        onEnvia={() => { setValor(''); tanca(); }}
        t={t}
        onEscapa={resposta ? tanca : null}
        barra={resposta ? <BarraResposta missatge={resposta} onCancela={tanca} t={t} /> : null}
      />
    </AppGridContext.Provider>
  );
}

export default function EspecimenXat() {
  return (
    <Especimen id="xat" nom="Xat i missatgeria" fitxer="src/sections/xat/components/ · src/css/modules.css (sdp-xat-*)"
      descripcio="Les peces del Xat F0 tal com es munten sobre AppGridShell: fila de conversa de 72 px (--sdp-xat-fila-mida) amb avatar, nom, hora, previsualització i comptador; bombolles pròpies a la dreta (--sdp-accio-subtil) i alienes a l'esquerra (--sdp-accent-subtil), amb variants de sistema, esborrada, amb enllaç i en error; compositor amb textarea que creix fins a 6 línies; marques d'estat amb forma i text, mai només color."
      contracte={[
        ['FilaConversa', '{ fil, activa, onSelect, locale, t }', '—', 'Un botó per conversa; ressalta si hi ha no llegits o marca manual.'],
        ['Bombolla', '{ missatge, esGrup, locale, t, seleccio?, onReintenta?, onDescarta?, onCopia?, primerDelGrup?, citat?, onVesACita?, onRespon?, ressaltat? }', 'primerDelGrup = true', 'Un <li data-missatge> per missatge; tria la variant per tipus, sender, esborrat i estatEnviament. La cua i el nom, només a la primera del grup; amb respostaA, la cita dalt; «Respon» al menú si hi ha onRespon i el missatge és confirmat.'],
        ['Compositor', '{ valor, onCanvia, onEnvia, t, desactivat?, fil?, barra?, onEscapa?, campRef? }', '—', 'Controlat; necessita AppGridShell (o el seu context) per a saber si el mode és estret. Amb fil: als Avisos sense permís, l’avís en lloc del camp; a una pàgina, l’avís del xat públic damunt. barra es pinta just damunt del camp; Escape crida onEscapa.'],
        ['SeparadorNoLlegits', '{ quants, t }', '0', 'Res si quants és 0; «1 missatge no llegit» o «{n} missatges no llegits».'],
        ['BotoBaixar', '{ nous, onBaixa, t }', '0', 'Botó redó «Baixa al final»; la pastilla ix amb nous > 0 («99+» per damunt de 99).'],
        ['BarraResposta', '{ missatge, onCancela, t }', '—', 'Autor («Tu» si és teu) i text a una línia; la ✕ «Cancel·la la resposta».'],
        ['CitaResposta', '{ citat, onVes?, interactiva?, t }', 'interactiva = true', 'Botó cap a l’original; «Missatge no carregat» sense acció si citat és null.'],
        ['CapcaleraConversa', '{ fil, onTorna, onSeleccionar, seleccio?, t }', '—', 'Avatar, nom i línia. Un fil de pàgina porta «Sobre: …» i els participants, i tot el bloc enllaça a la pàgina; un canal, el megàfon.'],
        ['PastillaNoLlegits', '{ quants, t }', '0', 'Res si quants és 0; «99+» per damunt de 99.'],
        ['MarquesEstat', "{ estat: 'pendent'|'enviat'|'llegit'|'error', t }", "'enviat'", 'Icona més text per al lector de pantalla.']
      ]}
      a11y={[
        'La fila és un <button> amb aria-current per a la conversa oberta; l’avatar porta alt="" perquè el nom ja està escrit.',
        'Cada marca d’estat i cada pastilla porten text en .sdp-nomes-lector: el color és secundari.',
        'La bombolla en error porta role="alert" i dos botons de 44 px: «Torna-ho a provar» i «Descarta».',
        'El compositor és un <textarea> amb aria-label; el botó d’enviar té nom i es desactiva sense text.',
        'Els enllaços ixen amb rel="noopener noreferrer" i avís si el domini porta caràcters enganyosos.',
        '«Baixa al final» porta el recompte com a descripció en text; la barra de resposta és un grup amb nom i la ✕ té nom propi.',
        'La cita és un botó amb el prefix «Missatge citat» per al lector i porta el focus a l’original; en triar «Respon» el focus va al camp i Escape cancel·la la resposta.',
        'El menú «⋯» de la bombolla: el focus entra a la primera opció, Escape el tanca (consumit) i el torna al «⋯». «Baixa al final» deixa el focus al camp en ample; en estret o sense camp, a la llista.',
        'La llista de missatges no és una regió en viu: una regió germana anuncia només els nous d’altres que entren pel final.'
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

      <h4>Bombolles (UX-B02), agrupades com a la conversa</h4>
      <ol className="sdp-xat-missatges" aria-label="Conversa de mostra">
        {filesDe(MISSATGES).map(({ clau, msg, primerDelGrup }) => (
          <Bombolla key={clau} missatge={msg} esGrup primerDelGrup={primerDelGrup} locale={LOCALE} t={t} />
        ))}
      </ol>

      <h4>Grup de tres, no llegits, respostes i «Baixa al final» (T1)</h4>
      <ConversaAgrupadaDeMostra />

      <h4>Compositor (UX-B03) amb la barra de resposta (T1)</h4>
      <CompositorDeMostra />

      <h4>Capçalera de la conversa: una pàgina («Sobre:» i participants) i els Avisos (el megàfon)</h4>
      <CapcaleresDeMostra />

      <h4>Compositor als Avisos (sense permís) i al xat públic d’una pàgina</h4>
      <CompositorsDePagina />

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
