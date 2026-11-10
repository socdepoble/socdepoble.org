import { Especimen } from '../Especimen.jsx';
import { Alerta } from '../../../../components/PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../../../components/PedraSeca/hooks/useTraductorOpcional.js';

/* Onada R16b (R16-AC1 i R16-AD1, arbitrats a C5-09) · Dos patrons que el codi ja seguix: el
   quadre blanc editorial (.sdp-admin-editorial-stack > .sdp-admin-editorial-bloc, modules.css) i on
   s'obrin els ajustos de l'espai de treball. Els dels catàlegs fets amb CatalegWorkspace van a la
   columna 3 (WorkspaceSettingsInlinePanel, UniversalWorkspace.jsx, amb ajustosEnDetall); la resta
   d'espais encara usen el diàleg (WorkspaceSettingsDialog) i el xat obri FullAjustos en un Dialeg.
   Cap llei sobre els altres diàlegs: el codi no la seguix. Cap veredicte ni cens escrit a mà. El
   text nou passa pel traductor (cinc diccionaris de src/config/idiomes/); la `estructura` és codi
   (un selector CSS que casa amb el que es pinta) i no es traduïx. */
const P = (nom, reserva) => [`section.disseny.contracte.${nom}`, reserva];
const TEXTOS_LLEIS = Object.freeze({
  quadreBlanc: P('quadreBlanc.titol', 'Llei del quadre blanc editorial i del fals tauler en columnes'),
  alertaTitol: P('quadreBlanc.alertaTitol', 'Encapçalaments i paràgrafs dins dels quadres informatius'),
  alerta: P('quadreBlanc.alerta', 'Dins d’un quadre informatiu blanc, tota explicació (funcionament, passos o arquitectura) s’escriu amb encapçalaments (h3, h4, h5) i paràgrafs o llistes a tota l’amplària de la columna. Una explicació no es disfressa de tauler de dues columnes: una llista de definicions (dl) amb títols llargs a l’esquerra i paràgrafs escanyats a la dreta.'),
  diagnostic: P('quadreBlanc.diagnostic', 'Quadres blancs editorials i llistes tècniques curtes'),
  quanUsar: P('quanUsar', 'Quan usar-lo:'),
  estructura: P('estructura', 'Estructura:'),
  modals: P('modals.titol', 'Ajustos de l’espai de treball: columna 3 als catàlegs, diàleg a la resta'),
  columna3Titol: P('modals.columna3.titol', 'Catàlegs: ajustos en la columna 3'),
  columna3: P('modals.columna3.text', 'Els ajustos de l’espai de treball dels catàlegs fets amb CatalegWorkspace (Herbari, Banc de llavors, Receptes, Fediversity, Rebost i catàleg del TPV) es pinten dins de la columna 3 de detall, amb un botó de tornada dalt i un altre davall, i no en un modal flotant que tape el context.'),
  dialegTitol: P('modals.dialeg.titol', 'Resta d’espais: ajustos en un diàleg'),
  dialeg: P('modals.dialeg.text', 'Els altres espais de treball fets amb UniversalWorkspace, quan tenen ajustos, encara els obrin en un diàleg (WorkspaceSettingsDialog). El full d’Ajustos del xat (FullAjustos) també s’obri en un diàleg.')
});

export const DIAGNOSTIC_QUADRES_BLANCS_PEDRA_SECA = Object.freeze([
  Object.freeze({
    id: 'redaccio-editorial-h4-h5-p',
    patro: P('patro.editorial', 'Redacció editorial (h4/h5 + p)'),
    quanUsar: P('quanUsar.editorial', 'Explicacions de domini, cròniques tècniques, protocols i blocs didàctics amb paràgrafs de més de 80 caràcters.'),
    estructura: '.sdp-admin-editorial-stack > .sdp-admin-editorial-bloc > :is(h4, h5) + p',
    estat: P('canonic', 'Canònic')
  }),
  Object.freeze({
    id: 'parella-tecnica-curta-dl',
    patro: P('patro.parella', 'Parella tècnica curta (dl)'),
    quanUsar: P('quanUsar.parella', 'Metadades clau-valor estrictes (versió, port, llicència, SHA-256 curt o identificadors) de menys de 80 caràcters.'),
    estructura: 'dl > dt + dd',
    estat: P('canonic', 'Canònic')
  }),
  Object.freeze({
    id: 'antipatro-fals-tauler-avio-dl',
    patro: P('patro.falsTauler', 'Fals tauler en columnes (dl amb paràgrafs llargs)'),
    quanUsar: P('quanUsar.falsTauler', 'Mai: cap dl, dt ni dd en dues o tres columnes per a encabir frases llargues o explicacions; s’escriu amb h4/h5 + p.'),
    estructura: null,
    estat: P('prohibit', 'Prohibit')
  })
]);

/**
 * Contracte vigent de Pedra Seca: les lleis que cap component pot saltar-se.
 * Recuperat de l'antiga pàgina de Fonaments (seccions 1, 23, 26 i 31).
 */
export default function EspecimenContracte() {
  const t = useTraductorOpcional();
  const text = (parell) => tradueix(t, parell);
  return (
    <Especimen id="contracte" nom="Contracte vigent de Pedra Seca" fitxer="src/components/PedraSeca/ · src/components/universal/"
      descripcio="React i Vite formen la carcassa productiva. Els components viuen a PedraSeca/ (àtoms, molècules, organismes) i a universal/ (pàgina, editor, espai de treball); els estils usen classes semàntiques i tokens --sdp-*. Font de veritat: el codi, els tests, ESLint, les portes actives i l'Estàndard UI Universal."
      fes={['Importar sempre des de la façana components/PedraSeca/index.js.', 'Colors, radis, ombres i espaiat només via tokens semàntics --sdp-*.', 'Tot control tàctil ≥ --sdp-touch (44px).']}
      noFacis={['Tailwind ni estils en línia al Core nou.', 'Clonar el DOM d’un component (sp-card*, sdp-boto…) en lloc d’instanciar-lo.', 'Inventar categories a pàgines de sistema.']}>

      <h4>Les quatre peces</h4>
      <ul className="sdp-llista">
        <li><code>UniversalPage</code> delega l’estructura visual en <code>PageFrame</code>: barra blava, imatge, barra taronja, capçalera i article.</li>
        <li><code>UniversalCard</code> és la targeta mestra i usa classes <code>sp-card*</code>.</li>
        <li><code>UniversalWorkspace</code> és l’esquelet genèric de tres columnes (navegació · llistat · detall); cada secció l’ompli injectant model, etiquetes, icones i pell.</li>
        <li><code>AppGridShell</code> governa responsive, scroll, plegat i amplàries de la graella.</li>
      </ul>

      <h4>Arquitectura universal: Top Bar + Sidebar + Contingut</h4>
      <p>Patró canònic per a pàgines d’aplicació, gestors i editors de tres columnes. Cap consumidor ha de clonar estes responsabilitats.</p>
      <ol>
        <li><strong>Top Bar fixa:</strong> navegació i accions globals pertanyen a <code>UniversalPage</code>.</li>
        <li><strong>Sidebar / Carpetes:</strong> facetes jeràrquiques; els grups s’obrin cap avall i la columna es replega cap a l’esquerra.</li>
        <li><strong>Llista / Notes:</strong> cerca i creació en una barra secundària subtil; en replegar queda només la lupa.</li>
        <li><strong>Contingut:</strong> detall o editor flexible, sempre amb <code>min-width: 0</code> i scroll propi.</li>
        <li><strong>Separadors:</strong> arrossegables amb punter i tacte, operables amb fletxes, <kbd>Home</kbd> i <kbd>End</kbd>.</li>
      </ol>
      <dl>
        <dt><strong>Ample (≥ 1090 px)</strong></dt><dd>Tres columnes simultànies, plegables i redimensionables.</dd>
        <dt><strong>Mitjà (720–1089 px)</strong></dt><dd>Llista + contingut; Carpetes apareix com a panell superposat.</dd>
        <dt><strong>Estret (&lt; 720 px)</strong></dt><dd>Un panell visible cada vegada; els panells fora de pantalla són <code>inert</code>.</dd>
      </dl>
      {/* IDEA-26 (directriu del Mestre, 261025) · El bloc es desplaça dins de la
          seua caixa: amb el teclat també (tabIndex i nom, com Taula). */}
      <pre tabIndex={0} role="region" aria-label="Exemple d’ús d’UniversalWorkspace"><code>{`<UniversalWorkspace
  model={{ navigationGroups, items }}
  labels={{ categories: 'CARPETES', items: 'NOTES' }}
  renderItem={(ctx) => <NotaFitxa {...ctx} />}
  renderDetail={({ item }) => <NotesEditor activeNote={item?.data} />}
/>`}</code></pre>

      <h4>Pàgines de sistema vs. pàgines de contingut</h4>
      <Alerta to="info" titol="Regla de les categories">
        Una pàgina només pot dur etiquetes o categories si la seua naturalesa és ser una <strong>targeta publicable</strong> dins d’un feed (Mur, Mercat, Esdeveniments, Notes…). Les pàgines de sistema (Panell de control, Dispositius, Disseny, Cens…) no són publicacions: la seua capçalera ha de ser neta, sense «Sistema», «Admin» ni «Local» inventats.
      </Alerta>
      <ul>
        <li><strong>Panell de Control</strong> · sistema, sense etiquetes. És el quadre de comandament: enrutador d’accessos ràpids, amb entradeta (<code>lead</code>) com a subtítol.</li>
        <li><strong>Dispositius</strong> · sistema. Motor d’aparellament: escaneja la xarxa local, negocia WebRTC o relé i anuncia el node local.</li>
        <li><strong>Cens de població</strong> · sistema. Llistat estàtic ordenat per habitants amb accés al perfil de cada poble.</li>
        <li><strong>Bloc de notes</strong> · sistema, disseny imbricat. Sala de redacció (TipTap) que incrusta una <code>UniversalPage</code> dins de l’editor: primer la imatge de capçalera, després la barra taronja de publicador amb l’hora i el candau/globus; el logotip només es mostra a la nota de benvinguda de Sóc de Poble.</li>
      </ul>

      <h4>Lògica del motor de Pobles</h4>
      <p>La pàgina de Pobles no té publicadors oficials: es basa en l’activitat orgànica de cada poble a la resta de l’app. El context de dades escaneja les publicacions, detecta la més recent de cada poble i ordena les targetes «Gent de…» de més recent a més antiga; l’apòstrof («Gent d’Alcoleja») es resol sol davant de vocal.</p>

      <h4>{text(TEXTOS_LLEIS.quadreBlanc)}</h4>
      <Alerta to="info" titol={text(TEXTOS_LLEIS.alertaTitol)}>
        {text(TEXTOS_LLEIS.alerta)}
      </Alerta>
      <div className="sdp-admin-editorial-stack" role="group" data-testid="diagnostic-operatiu-quadres-blancs" aria-label={text(TEXTOS_LLEIS.diagnostic)}>
        {DIAGNOSTIC_QUADRES_BLANCS_PEDRA_SECA.map((item) => (
          <article key={item.id} className="sdp-admin-editorial-bloc" data-patro-id={item.id}>
            <h5>{text(item.patro)} · <span>{text(item.estat)}</span></h5>
            <p>
              <strong>{text(TEXTOS_LLEIS.quanUsar)}</strong> {text(item.quanUsar)}
              {item.estructura ? <> <strong>{text(TEXTOS_LLEIS.estructura)}</strong> <code>{item.estructura}</code></> : null}
            </p>
          </article>
        ))}
      </div>

      <h4>{text(TEXTOS_LLEIS.modals)}</h4>
      <div className="sdp-admin-editorial-stack" role="group" data-testid="ajustos-espai-treball" aria-label={text(TEXTOS_LLEIS.modals)}>
        <article className="sdp-admin-editorial-bloc">
          <h5>{text(TEXTOS_LLEIS.columna3Titol)}</h5>
          <p>{text(TEXTOS_LLEIS.columna3)}</p>
        </article>
        <article className="sdp-admin-editorial-bloc">
          <h5>{text(TEXTOS_LLEIS.dialegTitol)}</h5>
          <p>{text(TEXTOS_LLEIS.dialeg)}</p>
        </article>
      </div>
    </Especimen>
  );
}
