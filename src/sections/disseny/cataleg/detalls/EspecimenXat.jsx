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
 * Torn 260930 (T1 · la conversa amb el patró estàndard de missatgeria): les
 * bombolles es pinten agrupades com a la conversa (anotaGrups: la cua i el nom només a
 * la primera de cada tirada); un grup de tres de la mateixa persona; el
 * separador «N missatges no llegits»; dos respostes, una amb la cita que
 * porta a l'original i una amb l'original sense carregar; el botó «Baixa al
 * final» amb la pastilla, i la barra de resposta damunt del compositor.
 *
 * Fase E (261020, tasca 3; pla 261020_2045 «El Comú») · Una bombolla de grup
 * amb tipus 'llista_comu': la llista viva (TargetaLlistaComu, memoritzada) en
 * lloc del text, que canvia en el lloc amb cada toc, i la mateixa en el mode de
 * selecció (només lectura). Dades de mostra.
 *
 * P1-66 (barra única del compositor) · Els adjunts es mostren com els munta
 * Conversa: ControlsAdjunt guarda l'estat i munta el Compositor (render-prop)
 * amb el + (menú amb «Fotos i vídeos» i la quota al peu), la carona dins del
 * camp i el botó redó que grava, atura, envia el fitxer o envia el text. En
 * local i en la llavor no hi ha adjunts (només en remot): ací es poden vore.
 *
 * Gauntlet 261112 (R21, regressio_ui_xat-07) · Les tres capçaleres de mostra
 * passen `nivellTitol={5}` (NIVELL_TITOL_MOSTRA): a la vista del xat el nom de
 * la conversa és l'encapçalament de nivell 1, però ací van davall dels h4 de
 * l'espècimen. Sense, /disseny/fonaments/xat tenia quatre H1 (el de la pàgina
 * i tres de mostra). El píxel no canvia: el nom és el mateix <strong>.
 */
import { useCallback, useRef, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { Accions, Avatar, Boto } from '../../../../components/PedraSeca/index.js';
import { AppGridContext } from '../../../../components/layout/AppGridShell.jsx';
import FilaConversa from '../../../xat/components/FilaConversa.jsx';
import Bombolla from '../../../xat/components/Bombolla.jsx';
import { ReproductorVeu } from '../../../xat/components/AdjuntXat.jsx';
import Compositor from '../../../xat/components/Compositor.jsx';
import ControlsAdjunt from '../../../xat/components/ControlsAdjunt.jsx';
import CapcaleraConversa from '../../../xat/components/CapcaleraConversa.jsx';
import MarquesEstat from '../../../xat/components/MarquesEstat.jsx';
import IndicadorEscrivint from '../../../xat/components/IndicadorEscrivint.jsx';
import PastillaNoLlegits from '../../../xat/components/PastillaNoLlegits.jsx';
import SeparadorNoLlegits from '../../../xat/components/SeparadorNoLlegits.jsx';
import BotoBaixar from '../../../xat/components/BotoBaixar.jsx';
import BarraResposta from '../../../xat/components/BarraResposta.jsx';
import { mapejaFil } from '../../../xat/missatges.js';
import { anotaGrups } from '../../../xat/conversa.js';
/* v1.2.7 (integració, sostre d'arrencada del connector) · El contenidor .sdp-xat-bombolla-wrap--veu
   viu al full diferit del reproductor de veu: la mostra feta a mà l'adopta com fa Bombolla. */
import { useFullDiferit } from '../../../../config/fullDiferit.js';
import cssXatVeu from '../../../../css/diferit-xat-veu.css?inline';

/* Traductor mínim: els components reben `t(clau, alternativa)` com a prop i
   les alternatives ja són el text en valencià. Sense UIContext. */
const t = (clau, alternativa) => alternativa;
const LOCALE = 'ca-ES';
const SERVEI_ADJUNTS_DE_MOSTRA = { teCapacitat: () => true, quotaXat: async () => ({ usats: 0, limit: 20_000_000 }) };
const ENVIA_ADJUNT_DE_MOSTRA = async () => { throw new Error('És una mostra del manual: no s’ha pujat ni enviat el fitxer.'); };

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

/* Fase E (tasca 3) · Qui toca les llistes de mostra, i la llista que viatja a les metadades. */
const ACTOR_MOSTRA = Object.freeze({ id: 'p-6', nom: 'Javi Llinares' });
const LLISTA_MOSTRA = Object.freeze({
  id: 'mostra-compra-festes', mode: 'rebost', titol: 'Compra per a la paella', propietariId: 'p-4', revisio: 2,
  elementsComu: [
    { id: 'c1', ordre: 1, nom: 'Arròs', emoji: '🍚', capaMode: { estat: 'falta', especificacio: '3 kg', demanatPer: [{ usuariId: 'p-4', nom: 'Pepica la Vall', at: hui(18, 10), especificacio: '3 kg' }], compratPer: null } },
    { id: 'c2', ordre: 2, nom: 'Pollastre', emoji: '🍗', capaMode: { estat: 'falta', especificacio: '2', demanatPer: [{ usuariId: 'p-4', nom: 'Pepica la Vall', at: hui(18, 10), especificacio: '2' }], compratPer: null } },
    { id: 'c3', ordre: 3, nom: 'Garrofó', capaMode: { estat: 'comprat', especificacio: '1 kg', demanatPer: [{ usuariId: 'p-3', nom: 'Vicent Ferris', at: hui(18, 11), especificacio: '1 kg' }], compratPer: { usuariId: 'p-6', nom: 'Javi Llinares', at: hui(18, 20) } } }
  ]
});
const MISSATGE_LLISTA = {
  id: 'm-llista', seq: 60, sender: 'other', author: 'Pepica la Vall', usuariId: 'p-4', tipus: 'llista_comu',
  text: '🧺 Llista: Compra per a la paella', metadades: { llista: LLISTA_MOSTRA }, creatAl: hui(18, 12), estatEnviament: 'enviat'
};

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
  imatgeUrl: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png'
});

/* Davall dels h4 de l'espècimen (h3), com les targetes de mostra (h5). */
const NIVELL_TITOL_MOSTRA = 5;

function CapcaleresDeMostra() {
  const [avis, setAvis] = useState('');
  return (
    <>
      <CapcaleraConversa fil={FIL_PAGINA} nivellTitol={NIVELL_TITOL_MOSTRA} onTorna={() => setAvis('Fletxa: tornaria a la llista.')} onSeleccionar={() => setAvis('Entraria a «Seleccionar missatges».')} t={t} />
      <CapcaleraConversa fil={FIL_AVISOS} nivellTitol={NIVELL_TITOL_MOSTRA} onTorna={() => setAvis('Fletxa: tornaria a la llista.')} onSeleccionar={() => setAvis('Entraria a «Seleccionar missatges».')} t={t} />
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
   o Escape la tanquen, i enviar la buida.
   IDEA-26 i IDEA-27 (ordre del Mestre, 261025) · Els dos botons de la mostra,
   dins d'Accions i darrere del paràgraf que els explica (al pare). */
function CompositorDeMostra() {
  const [valor, setValor] = useState('');
  const [mida, setMida] = useState('ample');
  const [resposta, setResposta] = useState(GRUP[1]);
  const estret = mida === 'estret';
  const tanca = () => setResposta(null);
  return (
    <AppGridContext.Provider value={{ mida }}>
      <Accions>
        <Boto varietat="secundari" aria-pressed={estret} onClick={() => setMida(estret ? 'ample' : 'estret')}>
          {estret ? 'Mode estret: Retorn fa salt de línia' : 'Mode ample: Retorn envia'}
        </Boto>
        <Boto varietat="secundari" disabled={Boolean(resposta)} onClick={() => setResposta(GRUP[1])}>
          Respon a Pepica
        </Boto>
      </Accions>
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

/* P1-66 · La barra única amb els adjunts de veres (el port de mostra no puja
   res): el +, la carona dins del camp i el botó redó, i la safata que només
   apareix mentre hi ha un fitxer a mig fer. */
function BarraAmbAdjuntsDeMostra() {
  const [valor, setValor] = useState('');
  return (
    <AppGridContext.Provider value={{ mida: 'ample' }}>
      <div className="sdp-xat-conversa">
        <ControlsAdjunt fil={FIL_PAGINA} servei={SERVEI_ADJUNTS_DE_MOSTRA} onEnvia={ENVIA_ADJUNT_DE_MOSTRA} t={t} locale={LOCALE}>
          {(adjunts) => <Compositor valor={valor} onCanvia={setValor} onEnvia={() => setValor('')} t={t} adjunts={adjunts} />}
        </ControlsAdjunt>
      </div>
    </AppGridContext.Provider>
  );
}

/* R32.6 (P0-119 + P0-120) · Àudio WAV silenciós generat en memòria per a la
   mostra viva del manual: dura el temps indicat i funciona sense cap xarxa. */
const URLS_WAV_MOSTRA = new Map();
function obteWavSilenciDeMostra(segons = 38) {
  if (URLS_WAV_MOSTRA.has(segons)) return Promise.resolve(URLS_WAV_MOSTRA.get(segons));
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return Promise.resolve('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YQAAAAA=');
  }
  const taxa = 4000;
  const mostres = taxa * segons;
  const buffer = new ArrayBuffer(44 + mostres);
  const vista = new DataView(buffer);
  const escriu = (pos, txt) => { for (let i = 0; i < txt.length; i += 1) vista.setUint8(pos + i, txt.charCodeAt(i)); };
  escriu(0, 'RIFF');
  vista.setUint32(4, 36 + mostres, true);
  escriu(8, 'WAVEfmt ');
  vista.setUint32(16, 16, true);
  vista.setUint16(20, 1, true);
  vista.setUint16(22, 1, true);
  vista.setUint32(24, taxa, true);
  vista.setUint32(28, taxa, true);
  vista.setUint16(32, 1, true);
  vista.setUint16(34, 8, true);
  escriu(36, 'data');
  vista.setUint32(40, mostres, true);
  new Uint8Array(buffer, 44).fill(128);
  const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  URLS_WAV_MOSTRA.set(segons, url);
  return Promise.resolve(url);
}

const FIL_SOFIA_PERSONAL = mapejaFil({
  id: 'mostra-sofia-personal',
  tipus: 'directe',
  titol: 'Sofía Bornay',
  altresNoms: ['Sofía Bornay'],
  altres: [{ id: 'sofia-bornay', tipus: 'persona', nom: 'Sofía Bornay', avatarUrl: null }],
  ultimText: 'Missatge de veu',
  ultimTipus: 'veu',
  ultimSeq: 3,
  llegitFinsSeq: 3
});

const FIL_SOFIA_ENTITAT = mapejaFil({
  id: 'mostra-sofia-sdp',
  tipus: 'directe',
  titol: 'Sofía Bornay',
  comEntitat: true,
  entitatId: 'socdepoble',
  entitatNom: 'Sóc de Poble',
  altresNoms: ['Sofía Bornay'],
  altres: [{ id: 'sofia-bornay', tipus: 'persona', nom: 'Sofía Bornay', avatarUrl: null }],
  ultimText: 'Bon dia!',
  ultimSeq: 1,
  llegitFinsSeq: 1
});

function ConversaDirectaAmbVeuDeMostra() {
  const [canalActiu, setCanalActiu] = useState(FIL_SOFIA_PERSONAL.id);
  const filObert = canalActiu === FIL_SOFIA_ENTITAT.id ? FIL_SOFIA_ENTITAT : FIL_SOFIA_PERSONAL;
  const arrel = useRef(null);
  useFullDiferit(arrel, 'xat-veu', cssXatVeu);
  return (
    <div ref={arrel} className="sdp-especimen__mostra" data-especimen="r32-6-xat-veu-avatars">
      <CapcaleraConversa
        fil={filObert}
        canals={[FIL_SOFIA_PERSONAL, FIL_SOFIA_ENTITAT]}
        onTriaCanal={setCanalActiu}
        nivellTitol={NIVELL_TITOL_MOSTRA}
        onTorna={() => {}}
        onSeleccionar={() => {}}
        t={t}
      />
      <ol className="sdp-xat-missatges" aria-label="Conversa directa amb notes de veu i avatars clicables">
        <li className="sdp-xat-item sdp-xat-item--altre">
          <div className="sdp-xat-bombolla-wrap sdp-xat-bombolla-wrap--veu">
            <a
              className="sdp-xat-bombolla__cara sdp-xat-bombolla__cara--enllac"
              href="/gent/sofia-bornay"
              aria-label="Obri el perfil de Sofía Bornay"
              onClick={(e) => e.preventDefault()}
            >
              <Avatar nom="Sofía Bornay" llavor="sofia-bornay" mida="sm" alt="" className="sdp-xat-bombolla__avatar-grup" />
            </a>
            <div className="sdp-xat-bombolla sdp-xat-bombolla--altre sdp-xat-bombolla--cua">
              <div className="sdp-xat-adjunt">
                <ReproductorVeu
                  obteUrl={() => obteWavSilenciDeMostra(38)}
                  duradaMs={38_000}
                  memoria="especimen/veu-sofia-38"
                  locale={LOCALE}
                  t={t}
                />
              </div>
              <span className="sdp-xat-bombolla__meta">
                <time dateTime={hui(14, 53)}>14:53</time>
              </span>
            </div>
          </div>
        </li>
        <Bombolla
          missatge={{
            id: 'm-sofia-2',
            seq: 2,
            sender: 'other',
            author: 'Sofía Bornay',
            usuariId: 'sofia-bornay',
            text: 'Ací tens la primera nota de veu gravada des del mòbil!',
            creatAl: hui(14, 53)
          }}
          esGrup={false}
          primerDelGrup={false}
          locale={LOCALE}
          t={t}
        />
        <li className="sdp-xat-item sdp-xat-item--meu">
          <div className="sdp-xat-bombolla-wrap sdp-xat-bombolla-wrap--veu">
            <div className="sdp-xat-bombolla sdp-xat-bombolla--meu sdp-xat-bombolla--cua">
              <div className="sdp-xat-adjunt">
                <ReproductorVeu
                  obteUrl={() => obteWavSilenciDeMostra(15)}
                  duradaMs={15_000}
                  memoria="especimen/veu-javi-15"
                  locale={LOCALE}
                  t={t}
                />
              </div>
              <span className="sdp-xat-bombolla__meta">
                <time dateTime={hui(14, 54)}>14:54</time>
                <MarquesEstat estat="llegit" t={t} />
              </span>
            </div>
          </div>
        </li>
      </ol>
    </div>
  );
}

const CITAT_LA_VEU_MOSTRA = Object.freeze({
  id: 'm-veu-0',
  seq: 10,
  sender: 'other',
  author: 'Redacció La Veu',
  usuariId: 'la-veu',
  text: 'https://socdepoble.org/mur/la-veu-de-soc-de-poble — Crònica setmanal il·lustrada del poble'
});

const MISSATGES_ESPILL_R32_7 = [
  {
    id: 'm-espill-anna-1',
    seq: 11,
    sender: 'other',
    author: 'Anna Climent',
    usuariId: 'anna-climent',
    respostaA: 'm-veu-0',
    text: 'Bon dia! Ja heu vist l’edició d’esta setmana de La Veu de Sóc de Poble?',
    creatAl: hui(11, 42),
    estatEnviament: 'enviat',
    reaccions: { '😂': ['javi-llinares', 'sofia-bornay'] }
  },
  {
    id: 'm-espill-javi-1',
    seq: 12,
    sender: 'me',
    author: 'Javi Llinares',
    usuariId: 'javi-llinares',
    text: 'Quina meravella de portada! Ara mateix la reenvie a la quadrilla.',
    creatAl: hui(11, 43),
    estatEnviament: 'llegit'
  },
  {
    id: 'm-espill-javi-2',
    seq: 13,
    sender: 'me',
    author: 'Javi Llinares',
    usuariId: 'javi-llinares',
    text: 'Ens veiem a les 19:00 a la plaça per a repartir els cartells.',
    creatAl: hui(11, 44),
    estatEnviament: 'llegit'
  }
];

function ConversaEspill11OpcionsDeMostra() {
  const [avis, setAvis] = useState('');
  const [reaccionsMapa, setReaccionsMapa] = useState(() => ({
    'm-espill-anna-1': { '😂': ['javi-llinares', 'sofia-bornay'] }
  }));
  const [destacats, setDestacats] = useState(() => ({}));
  const [fixatId, setFixatId] = useState(null);
  const [capesObertes, setCapesObertes] = useState(() => new Set());

  const gestionaCapaFlotant = useCallback((clau, oberta) => {
    setCapesObertes((prev) => {
      const teClau = prev.has(clau);
      if (oberta === teClau) return prev;
      const seguent = new Set(prev);
      if (oberta) seguent.add(clau);
      else seguent.delete(clau);
      return seguent;
    });
  }, []);

  const alternaReaccio = (msg, emoji) => {
    setReaccionsMapa((prev) => {
      const actual = { ...(prev[msg.id] || {}) };
      const usuaris = new Set(actual[emoji] || []);
      if (usuaris.has('javi-llinares')) usuaris.delete('javi-llinares');
      else usuaris.add('javi-llinares');
      if (usuaris.size === 0) delete actual[emoji];
      else actual[emoji] = [...usuaris];
      return { ...prev, [msg.id]: actual };
    });
    setAvis(`Reacció ${emoji} actualitzada.`);
  };

  return (
    <section className="sdp-especimen__mostra" data-especimen="r32-7-xat-espill-11-opcions" aria-label="Conversa d’espill de mostra">
      <CapcaleraConversa
        fil={FILS[0]}
        nivellTitol={NIVELL_TITOL_MOSTRA}
        onTorna={() => {}}
        onSeleccionar={() => setAvis('Activaria la selecció de missatges.')}
        t={t}
      />
      <ol
        className={capesObertes.size > 0 ? 'sdp-xat-missatges sdp-xat-missatges--obert' : 'sdp-xat-missatges'}
        aria-label="Conversa d’espill amb avatars de 44 px, reaccions i menú de 11 opcions"
      >
        {filesDe(MISSATGES_ESPILL_R32_7).map(({ clau, msg, primerDelGrup }) => (
          <Bombolla
            key={clau}
            missatge={msg}
            esGrup
            primerDelGrup={primerDelGrup}
            citat={msg.respostaA === 'm-veu-0' ? CITAT_LA_VEU_MOSTRA : null}
            nomPropi="Javi Llinares"
            usuariAdjunts="javi-llinares"
            reaccions={reaccionsMapa[msg.id] || null}
            onCapaFlotantCanvia={gestionaCapaFlotant}
            destacat={Boolean(destacats[msg.id])}
            fixat={fixatId === msg.id}
            nomAutor={msg.sender === 'other' ? msg.author : ''}
            onVesACita={() => setAvis('Aniria al missatge citat de La Veu.')}
            onRespon={(m) => setAvis(`Respondria a «${m.text}».`)}
            onResponEnPrivat={(m) => setAvis(`Respondria en privat a ${m.author}.`)}
            onReacciona={alternaReaccio}
            onDestaca={(m, nou) => {
              setDestacats((prev) => ({ ...prev, [m.id]: nou }));
              setAvis(nou ? 'Missatge destacat.' : 'Llevat dels destacats.');
            }}
            onFixa={(m, nou) => {
              setFixatId(nou ? m.id : null);
              setAvis(nou ? 'Missatge fixat dalt de la conversa.' : 'Missatge desfixat.');
            }}
            onReenvia={() => setAvis('Obriria Reenvia a… amb cerca i «Nou grup».')}
            onCopia={() => setAvis('Text copiat al porta-retalls.')}
            onEnviaPrivat={(m) => setAvis(`Obriria xat directe amb ${m.author}.`)}
            onDenuncia={() => setAvis('Obriria el diàleg de denúncia.')}
            onBloqueja={() => setAvis('Obriria el diàleg de bloqueig.')}
            onElimina={() => setAvis('Obriria «Elimina per a mi» / «Elimina per a tothom».')}
            onSelecciona={() => setAvis('Activaria les caselles de selecció múltiple.')}
            locale={LOCALE}
            t={t}
          />
        ))}
      </ol>
      {avis ? <p role="status">{avis}</p> : null}
    </section>
  );
}

const SERVEI_QUOTA_PLENA_MOSTRA = { teCapacitat: () => true, quotaXat: async () => ({ usats: 19_999_999, limit: 20_000_000 }) };
const MISSATGE_UBICACIO_SAFAREIG = Object.freeze({
  id: 'm-safareig-riu',
  seq: 70,
  sender: 'other',
  author: 'Sofía Bornay',
  usuariId: 'sofia-bornay',
  text: 'Mireu en quin estat ha quedat el safareig antic del riu després de la pluja.',
  metadades: { ubicacio: { lat: 38.5892, lng: -0.4214 } },
  creatAl: hui(18, 45),
  estatEnviament: 'enviat'
});

/* Onada R32.8 (ordre del Mestre del 17-11-2026, P0-125a/d i P0-126) · Mostra de xip «Veure al mapa», píndola GPS activa per defecte i avís amb ✕. */
function UbicacioIAvisTancableDeMostra() {
  const [valor, setValor] = useState('');
  const [conserva, setConserva] = useState(true);
  const [mostraError, setMostraError] = useState(true);
  return (
    <section data-especimen="r32-8-xat-ubicacio-i-avis" aria-label="Ubicació i avís tancable de mostra">
      <ol className="sdp-xat-missatges" aria-label="Missatge amb ubicació al mapa">
        <Bombolla missatge={MISSATGE_UBICACIO_SAFAREIG} esGrup locale={LOCALE} t={t} />
      </ol>
      <AppGridContext.Provider value={{ mida: 'ample' }}>
        <div className="sdp-xat-conversa">
          <div className="sdp-xat-adjunts sdp-xat-adjunts--activa" role="group" aria-label="Adjunts del xat">
            {mostraError ? (
              <div className="sdp-xat-adjunts__alerta">
                <p role="alert">Has arribat al límit d’espai dels adjunts del xat. Revisa els fitxers pendents o prova-ho més endavant.</p>
                <button
                  type="button"
                  className="sdp-xat-icona sdp-xat-adjunts__tanca-error"
                  aria-label="Tanca l’avís"
                  onClick={() => setMostraError(false)}
                >
                  ×
                </button>
              </div>
            ) : null}
            <div className="sdp-xat-ubicacio-control">
              <span className="sdp-xat-ubicacio-control__estat">
                <span>{conserva ? '📍 S’inclourà la ubicació on s’ha fet (38,59°, -0,42°)' : '📍 Ubicació amagada'}</span>
              </span>
              {conserva ? (
                <button type="button" className="sdp-xat-pindola sdp-xat-pindola--secundaria" onClick={() => setConserva(false)}>
                  Amaga el lloc
                </button>
              ) : null}
            </div>
          </div>
          <ControlsAdjunt fil={FIL_PAGINA} servei={SERVEI_QUOTA_PLENA_MOSTRA} onEnvia={ENVIA_ADJUNT_DE_MOSTRA} t={t} locale={LOCALE}>
            {(adjunts) => <Compositor valor={valor} onCanvia={setValor} onEnvia={() => setValor('')} t={t} adjunts={adjunts} />}
          </ControlsAdjunt>
        </div>
      </AppGridContext.Provider>
    </section>
  );
}

export default function EspecimenXat() {
  return (
    <Especimen id="xat" nom="Xat i missatgeria" fitxer="src/sections/xat/components/ · src/css/modules.css (sdp-xat-*)"
      descripcio="Les peces del Xat F0 tal com es munten sobre AppGridShell: fila de conversa de 96 px (--sdp-xat-fila-mida, 2 × 48) amb l'avatar gran de 76 px (--sdp-xat-avatar-mida), nom, hora, previsualització i comptador; bombolles pròpies a la dreta (--sdp-accio-subtil) i alienes a l'esquerra (--sdp-accent-subtil), amb variants de sistema, esborrada, amb enllaç i en error; compositor d'una sola barra (+ dels adjunts, carona dins del camp i botó redó) amb textarea que creix fins a 6 línies; marques d'estat amb forma i text, mai només color."
      contracte={[
        ['FilaConversa', '{ fil, activa, onSelect, locale, t }', '—', 'Un botó per conversa; ressalta si hi ha no llegits o marca manual.'],
        ['Bombolla', '{ missatge, esGrup, locale, t, seleccio?, onReintenta?, onDescarta?, onCopia?, primerDelGrup?, citat?, onVesACita?, onRespon?, ressaltat?, actorLlista?, onMutaLlista? }', 'primerDelGrup = true', 'Un <li data-missatge> per missatge; tria la variant per tipus, sender, esborrat i estatEnviament. La cua i el nom, només a la primera del grup; amb respostaA, la cita dalt; «Respon» al menú si hi ha onRespon i el missatge és confirmat. Amb tipus \'llista_comu\' i una instantània a metadades.llista, el cos és la llista viva (actorLlista toca, onMutaLlista és el port); sense instantània, el text.'],
        ['TargetaLlistaComu', '{ llista, actor?, interactiva?, onMuta? }', 'interactiva = true', 'La llista viva d’«El Comú» dins de la bombolla (UniversalListCard, variant bombolla). Memoritzada: una tecla al compositor no la repinta. En el mode de selecció, interactiva = false i cap control.'],
        ['Compositor', '{ valor, onCanvia, onEnvia, t, desactivat?, fil?, barra?, onEscapa?, campRef?, adjunts? }', 'adjunts = null', 'Controlat; necessita AppGridShell (o el seu context) per a saber si el mode és estret. Amb fil: als Avisos sense permís, l’avís en lloc del camp; a una pàgina, l’avís del xat públic damunt. barra es pinta just damunt del camp; Escape crida onEscapa. Amb adjunts (el dona ControlsAdjunt), el + i el que fa el botó redó; sense, només envia text.'],
        ['ControlsAdjunt', '{ fil, onEnvia, servei?, usuariId?, externalConfig?, actiu?, onTextOrfe?, t?, locale?, children(adjunts) }', 'actiu = true', 'Guarda l’estat de les fotos, els vídeos i les notes de veu i munta el Compositor (render-prop) sempre al mateix lloc. adjunts és null sense capacitat, sense la migració, sense quota llegida o amb actiu fals; la safata de damunt només ocupa lloc mentre hi ha un fitxer a mig fer.'],
        ['SeparadorNoLlegits', '{ quants, t }', '0', 'Res si quants és 0; «1 missatge no llegit» o «{n} missatges no llegits».'],
        ['BotoBaixar', '{ nous, onBaixa, t }', '0', 'Botó redó «Baixa al final»; la pastilla ix amb nous > 0 («99+» per damunt de 99).'],
        ['BarraResposta', '{ missatge, onCancela, t }', '—', 'Autor («Tu» si és teu) i text a una línia; la ✕ «Cancel·la la resposta».'],
        ['CitaResposta', '{ citat, onVes?, interactiva?, t }', 'interactiva = true', 'Botó cap a l’original; «Missatge no carregat» sense acció si citat és null.'],
        ['CapcaleraConversa', '{ fil, onTorna, onSeleccionar, seleccio?, t, nivellTitol? }', 'nivellTitol = 1', 'Avatar, nom i línia. Un fil de pàgina porta «Sobre: …» i els participants, i tot el bloc enllaça a la pàgina; un canal, el megàfon. El nom és l’encapçalament de nivell nivellTitol (role="heading" sobre el <strong>, mai un element H1); fora de la vista del xat, un nivell més baix o null.'],
        ['PastillaNoLlegits', '{ quants, t }', '0', 'Res si quants és 0; «99+» per damunt de 99.'],
        ['MarquesEstat', "{ estat: 'pendent'|'enviat'|'lliurat'|'llegit'|'error', t }", "'enviat'", 'Icona més text per al lector de pantalla.']
      ]}
      a11y={[
        'La fila és un <button> amb aria-current per a la conversa oberta; l’avatar porta alt="" perquè el nom ja està escrit.',
        'Cada marca d’estat i cada pastilla porten text en .sdp-nomes-lector: el color és secundari.',
        'La bombolla en error porta role="alert" i dos botons de 44 px: «Torna-ho a provar» i «Descarta».',
        'El compositor és un <textarea> amb aria-label; el botó redó és un sol control que canvia de nom (Grava àudio, Atura la gravació, Envia el fitxer, Envia) i, sense adjunts, es desactiva sense text. El segon toc d’un doble toc no fa l’acció que el primer hi ha deixat (ni obri el micròfon ni envia una nota sense escoltar-la).',
        'El + porta aria-haspopup="menu", aria-expanded i aria-controls; el focus entra a la primera opció, les fletxes s’hi mouen i Escape el tanca abans que la resposta i torna el focus al +.',
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
        'Prometre accions que no fan res (trucades, documents, enquestes): el + només oferix el que funciona.',
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

      <h4>Conversa directa 1:1 amb notes de veu estil WhatsApp i avatars clicables (R32.6)</h4>
      <ConversaDirectaAmbVeuDeMostra />

      <h4>Espill d’avatars 44×44 px, botons visibles, píndola «😂 2» i menú de les 11 opcions de WhatsApp (R32.7)</h4>
      <ConversaEspill11OpcionsDeMostra />

      <h4>Una llista viva d’«El Comú» dins d’una bombolla (Fase E, tasca 3)</h4>
      <ol className="sdp-xat-missatges" aria-label="Llista viva de mostra">
        <Bombolla missatge={MISSATGE_LLISTA} esGrup locale={LOCALE} t={t} actorLlista={ACTOR_MOSTRA} />
      </ol>
      <h4>La mateixa, en el mode de selecció (només lectura)</h4>
      <ol className="sdp-xat-missatges" aria-label="Llista viva de mostra en el mode de selecció">
        <Bombolla missatge={MISSATGE_LLISTA} esGrup locale={LOCALE} t={t} actorLlista={ACTOR_MOSTRA}
          seleccio={{ actiu: true, triat: false, onAlterna: () => {} }} />
      </ol>

      <h4>Grup de tres, no llegits, respostes i «Baixa al final» (T1)</h4>
      <ConversaAgrupadaDeMostra />

      <h4>Compositor (UX-B03) amb la barra de resposta (T1)</h4>
      <p>Els dos botons canvien la mostra: el mode (en ample, Retorn envia; en estret, fa salt de línia) i la resposta a Pepica, que posa la barra damunt del camp. La ✕, Escape o enviar la tanquen.</p>
      <CompositorDeMostra />

      <h4>Adjunts a la barra única: previsualitza abans d’enviar (P1-66)</h4>
      <p>Toca + per a triar una foto o un vídeo de fins a 10 segons; amb el camp buit, el botó redó grava àudio; amb text o un fitxer preparat, envia. Esta mostra no puja cap fitxer.</p>
      <BarraAmbAdjuntsDeMostra />

      <h4>Geolocalització per defecte amb «Amaga el lloc», xip «Veure al mapa» i avís tancable amb ✕ (R32.8)</h4>
      <UbicacioIAvisTancableDeMostra />

      <h4>Capçalera de la conversa: una pàgina («Sobre:» i participants) i els Avisos (el megàfon)</h4>
      <CapcaleresDeMostra />

      <h4>Compositor als Avisos (sense permís) i al xat públic d’una pàgina</h4>
      <CompositorsDePagina />

      <h4>Presència observada al servidor (R54, mostra fixa)</h4>
      <CapcaleraConversa fil={FILS[0]} nivellTitol={NIVELL_TITOL_MOSTRA} escrivint={2} onTorna={() => {}} t={t} />
      <IndicadorEscrivint quants={1} t={t} />
      <IndicadorEscrivint quants={3} t={t} />
      <h4>Pastilla de no llegits i marques d’estat (UX-B05)</h4>
      <div className="sdp-especimen__fila">
        <PastillaNoLlegits quants={1} t={t} />
        <PastillaNoLlegits quants={3} t={t} />
        <PastillaNoLlegits quants={120} t={t} />
      </div>
      <ul>
        <li>Pendent (rellotge): <MarquesEstat estat="pendent" t={t} /></li>
        <li>Enviat (una marca): <MarquesEstat estat="enviat" t={t} /></li>
        <li>Lliurat als altres (dos marques): <MarquesEstat estat="lliurat" t={t} /></li>
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
