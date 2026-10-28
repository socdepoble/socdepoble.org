import { esErrorLazy, lazyRoute } from '../../apps/plataforma/lazyRoute.js';
import React, { Suspense, useMemo } from 'react';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace.jsx';
import { ALL_CATEGORY_ID } from '../../components/universal/workspace/workspaceState.js';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { useToast } from '../../components/universal/NotificationContext.jsx';
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { wikiManifest } from '../../data/wikiManifest.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { resolRecursosDeHtml } from '../../config/assetResolver.js';
import { Folder, FileText } from 'lucide-react';
import { useNavigate, useLocation } from '../../app/contexts/RouterContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useSuperadminEstable } from '../../hooks/useSuperadminEstable.js';
import { PAGE_COPY } from '../text/pageContent';
import { COPYRIGHT_SDP, dataDelNom, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { COVER_PAGE_KEYS } from '../../config/systemPages';
import { parseMarkdown, extreuEditorial, parseMarkdownEnLinia } from './parseMarkdown.js';
import { ICONES_ITEMS_WIKI, glifDeCarpetaWiki, iconaDeDocument } from './iconesWiki.js';
import { esperaElRol, maquinariaALaVista } from './maquinaria.js';

// La portada és una peça estructural: si la clau desapareix, la pàgina es
// pinta buida. En desenvolupament ho diem en veu alta (incident del 24-09).
if (import.meta.env?.DEV && !PAGE_COPY[COVER_PAGE_KEYS.wiki]) {
  console.warn(`[Wiki] Falta la portada «${COVER_PAGE_KEYS.wiki}» a PAGE_COPY; es pinta el títol per defecte.`);
}

/**
 * Ordre del Mestre, 261001 · El copy d'una portada: primer el del contingut
 * core (useCoreContent().pageCopy) i PAGE_COPY només de reserva, amb la
 * mateixa precedència que TextRoute (App.jsx) i paginaDeText.js.
 *
 * Per què: la targeta de la Wiki al Mur i al Calendari porta la data del
 * pageCopy (en mode seed, les dates de prova de mur/datesDeProvaMur.js, que
 * aplica data/supabase/content.js). Si la portada llig PAGE_COPY directament,
 * la seua pastilla diu un altre dia i porta a un Calendari on la seua targeta
 * no hi és. Mentre el core carrega (pageCopy buit) o si no porta la pàgina,
 * mana PAGE_COPY, com abans.
 */
const copyDePortada = (pageCopy, clau) => pageCopy?.[clau] || PAGE_COPY[clau];

/* Una eina local com a ítem de la Wiki, amb la forma dels ítems sintètics de la Consola.
   La fitxa porta glif propi: sense ell heretaria la carpeta de la seua
   categoria, hui maquinaria_cat (glifDeCategoria; pla 2045, Marató 2230, F3).
   Ordre del Mestre (261007) · El glif propi ja no és el FileText de Lucide
   sinó el seu emoji (iconesWiki.js), distint per a cada eina.
   Revisió del 261007 (M2-15) · Una eina nova sense emoji a iconesWiki.js
   porta FileText de reserva: mai la carpeta de la categoria.
   Pla 261027_0845 (Guarda Nocturna), §3 · `type` diu si l'ítem és l'eina
   (en desenvolupament, 'Eina local') o la seua documentació (fora de
   desenvolupament, TIPUS_DOCUMENTACIO): la mateixa fitxa, amb el mateix glif. */
const einaLocal = (id, title, subtitle, categoryId, tags, lead, type = 'Eina local') => ({
  id,
  title,
  subtitle,
  lead,
  icon: ICONES_ITEMS_WIKI[id] || FileText,
  categoryId,
  categoryIds: [categoryId],
  tags,
  attributes: { type, author: 'Sistema' },
  content: ''
});

/* Pla 261027_0845 (Guarda Nocturna), §3 · El tipus (i la píndola) de les
   pàgines de documentació de la Maquinària. */
export const TIPUS_DOCUMENTACIO = 'Documentació';

/* Revisió adversarial del bloc B (Guarda Nocturna 261027) · T51, regla del
   Mestre (260928): «Cap document existeix sense data». La data i l'hora de la
   versió vigent de cada text de documentació (documentacioMaquinaria.js), que
   pinten la pastilla de la barra taronja i van a attributes.date: viu ací, i
   no al costat del text, perquè la llista la llig sense carregar el tros de
   la documentació. Qui canvie un text, hi canvia la data; mai la d'ara. El
   BIOS no en porta: el seu text és AGENTS.md, que no té cap data al
   frontmatter. És un deute de DADES, com els documents del manifest sense
   `date` (dataDeDocumentWiki), i la pàgina es queda sense pastilla. */
export const DATA_DOCUMENTACIO = Object.freeze({
  tractors_aprovacio: '2026-10-27T10:04:00+01:00',
  sentinelles_panell: '2026-10-27T10:01:00+01:00'
});

/* Revisió adversarial del bloc B (Guarda Nocturna 261027) · Una pàgina que
   només es llig no convida a cap acció que no fa: a la documentació, el
   subtítol dels Sentinelles ja no diu «aprova'ls». Els altres dos, el de
   l'eina: «Què fa cada tractor…» ho explica el text (documentacioMaquinaria.js),
   i el del BIOS no demana res. */
const SUBTITOLS_DOCUMENTACIO = Object.freeze({
  sentinelles_panell: 'Els set sentinelles d’autonomia: què observen i com s’aproven'
});

/* Les tres peces de la Maquinària de la IAIA, amb el text de la seua pàgina:
   [id, títol, subtítol, etiquetes, entradilla]. Les mateixes per a l'eina de
   desenvolupament (modulsLocalsActius) i per a la seua documentació pública
   (documentacioMaquinariaActiva): l'adreça (?item=) i la capçalera no canvien
   d'un entorn a l'altre, llevat del subtítol que convidaria a una acció
   (SUBTITOLS_DOCUMENTACIO).
   IDEA-27 (ordre del Mestre, àudio de 01:54 del 261025) · Anatomia de
   pàgina: H1, H2 i l'entradilla centrada davall de l'H2. La de Sentinelles
   estava perduda al cos, davall de l'h3 de la porta («Els components
   comuns…»); ara la pinta UniversalPage, i el panell ja no la repetix. */
const PECES_MAQUINARIA = Object.freeze([
  ['tractors_aprovacio', 'Aprovació de tractors', 'Què fa cada tractor, la seua empremta i la teua signatura', ['tractors'],
    'Un tractor és un automatisme que processa dades. Cap s’executa si no n’has aprovat la versió exacta: l’empremta cobrix el manifest, la fitxa i cada línia de les fonts llistades, que són el codi del tractor, el de la seua interfície i el d’esta porta. Els components comuns de l’app (botons, diàlegs, navegació) no hi entren. Si en canvia una línia, torna a «pendent».'],
  ['sentinelles_panell', 'Sentinelles', 'Els set sentinelles d’autonomia: aprova’ls i mira què observen', ['sentinelles'],
    'Un sentinella és un tractor que només observa: llig el que tries, alça banderes i proposa, però no aplica, no esborra, no envia i no paga res. Només treballa si n’has aprovat la versió exacta, i l’empremta d’eixa versió cobrix el seu codi, el de la seua interfície i el de la porta. Els components comuns de l’app (botons, diàlegs, navegació) no hi entren. Si en canvia una línia, torna a «pendent».'],
  ['agents_panell', 'Agents (BIOS)', 'EL BIOS COGNITIU i directrius dels agents (AGENTS.md)', ['agents']]
]);

/**
 * 261002 · Les eines locals: la porta d'aprovació de Tractors i els
 * Sentinelles viuen a la Wiki NOMÉS en desenvolupament (decisió D3: cap ruta
 * /gestoria ni /tractors a App.jsx, ControlSection.test.jsx). Esta funció
 * pura decidix quines categories i ítems hi afig la Wiki; al punt d'ús es
 * crida amb el literal import.meta.env.DEV, i els components es carreguen
 * amb lazy() dins d'una constant que fora de DEV és null (EINES_LOCALS): Vite
 * reemplaça el literal per false al build i les importacions dinàmiques
 * desapareixen del paquet de producció.
 *
 * Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
 * Gestoria i Wiki»): la Gestoria de Poble ja no viu ací. La seua carpeta,
 * el Full trimestral i Aprendre s'han mogut a la seua app, /app/gestoria
 * (src/apps/gestoria), també només en desenvolupament. La Wiki no en
 * coneix cap id ni cap ruta: una URL vella amb els seus ids cau com
 * qualsevol ítem desconegut (la portada), sense redirigir enlloc.
 *
 * Pla 261027_0845 (Guarda Nocturna), §3 · Les eines (els seus botons) continuen
 * sent només de desenvolupament; la seua documentació, no: fora de DEV la porta
 * documentacioMaquinariaActiva, avall, amb els mateixos ids.
 *
 * @param {{ DEV?: boolean }} [env] només DEV === true les activa
 * @returns {{ categories: object[], items: object[] }}
 */
export function modulsLocalsActius(env) {
  if (env?.DEV !== true) return { categories: [], items: [] };
  return {
    /* Ordre del Mestre, 261004 (pla 2045, Marató 2230, F3) · Regla del glif,
       fins al §0.7 de baix: una categoria que agrupa documents portava Folder
       (Tractors i les carpetes del manifest); una entrada directa a una sola
       pàgina, FileText (Wiki de Poble, Consola); un document final, el seu glif.
       261006 (MarIA; prompt 261006_0224, T6) · Ni Tractors ni la Consola tenen
       ja carpeta pròpia: les eines locals i la Consola pengen de maquinaria_cat
       («Maquinària de la IAIA»), que declara la Wiki. Ací ja no es
       torna cap categoria, i cada fitxa conserva el glif propi.
       Ordre del Mestre (261007) · Els ítems que nomena l'ordre porten el seu
       emoji (iconesWiki.js): la Consola i les eines locals, el seu, i els
       documents del manifest, el que diuen el seu id o el seu tipus
       (icones.test.jsx).
       Ordre del Mestre (pla 261007_0012, §0.7) · Les carpetes i subcarpetes de
       la Wiki ja no porten Folder ni FileText: cada una, el seu emoji
       (iconesWiki.js · glifDeCarpetaWiki), també la Maquinària de la IAIA i
       l'entrada de la portada, «Wiki de Poble», que porta el de la portada
       (ICONA_PORTADA). */
    categories: [],
    items: PECES_MAQUINARIA.map(([id, title, subtitle, tags, lead]) => einaLocal(id, title, subtitle, 'maquinaria_cat', tags, lead))
  };
}

/**
 * Pla 261027_0845 (Guarda Nocturna), §3 · Transparència radical: fora de
 * desenvolupament, la documentació pública de les tres peces (Tractors,
 * Sentinelles i el BIOS) es llig a la Maquinària de la IAIA, amb el mateix
 * id, títol, entradilla, etiquetes i glif que l'eina, i el seu subtítol
 * (SUBTITOLS_DOCUMENTACIO) i la seua data (DATA_DOCUMENTACIO) si en té. Les accions
 * mecàniques no hi arriben: el cos és DocumentacioMaquinaria.jsx (text i, per
 * al BIOS, AGENTS.md de lectura), i les eines de veres continuen dins
 * d'EINES_LOCALS, nul·la fora de DEV. La decisió D3 es manté: cap ruta
 * /tractors ni /gestoria a App.jsx. En desenvolupament, cap ítem: hi són les
 * eines, com sempre (modulsLocalsActius). Pura, com modulsLocalsActius:
 * només DEV === true la buida; qualsevol altra cosa porta la documentació
 * (sense accions, que és el costat segur).
 *
 * @param {{ DEV?: unknown }} [env]
 * @returns {{ items: object[] }}
 */
export function documentacioMaquinariaActiva(env) {
  if (env?.DEV === true) return { items: [] };
  return {
    items: PECES_MAQUINARIA.map(([id, title, subtitle, tags, lead]) => {
      const fitxa = einaLocal(id, title, SUBTITOLS_DOCUMENTACIO[id] || subtitle, 'maquinaria_cat', tags, lead, TIPUS_DOCUMENTACIO);
      const date = DATA_DOCUMENTACIO[id];
      return date ? { ...fitxa, attributes: { ...fitxa.attributes, date } } : fitxa;
    })
  };
}

const MODULS_LOCALS = modulsLocalsActius({ DEV: import.meta.env.DEV });
const DOCUMENTACIO_MAQUINARIA = documentacioMaquinariaActiva({ DEV: import.meta.env.DEV });
const IDS_DOCUMENTACIO = new Set(DOCUMENTACIO_MAQUINARIA.items.map((item) => item.id));

/* Els components de les eines locals, a demanda. Fora de DEV, null: cap
   importació dels Tractors arriba al build. La Gestoria ja no hi és (ordre
   del Mestre, 261004): la carrega la seua app, src/apps/gestoria. */
const EINES_LOCALS = import.meta.env.DEV ? {
  tractors_aprovacio: lazyRoute(() => import('../tractors/PanellTractors.jsx')),
  sentinelles_panell: lazyRoute(() => import('../tractors/PanellSentinelles.jsx')),
  agents_panell: lazyRoute(() => import('../tractors/PanellAgents.jsx'))
} : null;

/* Pla 261027_0845 (Guarda Nocturna), §3 · El cos de les pàgines de
   documentació de la Maquinària, a demanda, com la Consola: el text
   d'AGENTS.md no pesa al tros de la Wiki fins que algú obri el BIOS. És un
   mòdul de la Wiki, fora dels carrils dels Tractors i de la Gestoria: no porta
   cap botó, cap magatzem ni cap font d'eixos carrils, i per això pot anar al
   paquet de producció. En desenvolupament no es pinta mai (hi són les eines). */
const DocumentacioMaquinaria = lazyRoute(() => import('./DocumentacioMaquinaria.jsx'));

/* Onada 7 (261009) · La Consola, a demanda. Amb l'import estàtic, el tros de
   la Wiki arrossegava el de la Consola (197.067 B al build real del 261009)
   a cada visita, l'obrira algú o no. Ara es carrega quan s'obri la seua
   fitxa, amb lazyRoute i un Suspense només sobre el cos, com les eines
   locals. Una fallada és un LazyRouteError, i la recull BarreraDeLaConsola
   (ací baix), no la ruta. lazyRoute espera un mòdul amb default, i
   ConsolaIncrustada és una exportació amb nom. */
const ConsolaIncrustada = lazyRoute(() => import('../consola/ConsolaSection.jsx')
  .then((modul) => ({ default: modul.ConsolaIncrustada })));

/* Revisió adversarial de l'Onada 7 · Si el tros de la Consola no arriba (una
   connexió rural que cau, o sense connexió i sense haver-la oberta abans),
   la fallada es queda dins del cos, com la del panell del poble
   (BarreraDelPanellDelPoble, detailSectionMeta.jsx). Sense esta barrera
   pujava a RouteErrorBoundary, que substituïx la ruta sencera: arbre, llista
   i detall. I com que la seua clau és el camí i la Wiki només canvia ?item=,
   cap altre document s'obria fins eixir pel menú. Abans, amb l'import
   estàtic, la Consola no podia fallar així: no s'havia d'empitjorar res.
   Sense botó de reintent: un import fallit continua fallit a la memòria de
   React (lazyRoute.js), i recarregar és cosa de qui navega. Qualsevol altre
   error puja com sempre. No s'importa la del poble perquè portaria
   detailSectionMeta.jsx sencer al tros de la Wiki. */
export class BarreraDeLaConsola extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (!esErrorLazy(error)) throw error;
    return this.props.fallback;
  }
}

/* Traduir enviaria el text de la pàgina al servei de traducció de l'amfitrió
   (useTraduccioPagina), i el que mostren les eines locals no ix d'este
   ordinador: no es traduïxen. */
export const AVIS_EINA_LOCAL_SENSE_TRADUCCIO = 'Les eines locals no es traduïxen: el que mostren no ix d’este ordinador.';

function EinaLocal({ item, Eina }) {
  const { showToast } = useToast();
  return (
    <UniversalPage
      chrome="context"
      title={item.title}
      subtitle={item.subtitle}
      lead={item.lead}
      showLogos={true}
      labels={[
        { text: 'WIKI DE POBLE', className: 'sdp-badge-system' },
        { text: 'Eina local', className: 'sdp-badge-category' },
        ...(item.tags || []).map(text => ({ text, className: 'sdp-badge-tag' }))
      ]}
      copyright={COPYRIGHT_SDP}
      onTranslate={() => showToast(AVIS_EINA_LOCAL_SENSE_TRADUCCIO)}
    >
      <Suspense fallback={<Carregant etiqueta="Carregant l’eina…" />}>
        <Eina />
      </Suspense>
    </UniversalPage>
  );
}

/* Pla 261027_0845 (Guarda Nocturna), §3 · La pàgina d'una peça de la
   Maquinària fora de desenvolupament: la capçalera de l'eina (títol,
   subtítol, entradilla, etiquetes i copyright), amb la píndola de la
   documentació en lloc de la d'eina local, i el cos de DocumentacioMaquinaria
   a demanda. El text és públic i no porta cap dada d'este ordinador (al
   contrari que les eines, AVIS_EINA_LOCAL_SENSE_TRADUCCIO): es traduïx com
   qualsevol document de la Wiki. Si el tros no arriba (una connexió rural que
   cau), la barrera de la Consola el recull dins del cos, com a la Consola.
   Revisió adversarial del bloc B (Guarda Nocturna 261027) · T51: la pastilla
   porta la data del text (DATA_DOCUMENTACIO), com la Consola porta la del
   seu copy; sense data (el BIOS), cap pastilla, mai la d'ara. */
function DocumentacioLocal({ item }) {
  const data = dataHoraDeBarra({ creat: item.attributes?.date });
  return (
    <UniversalPage
      chrome="context"
      title={item.title}
      subtitle={item.subtitle}
      lead={item.lead}
      {...data}
      showLogos={true}
      labels={[
        { text: 'WIKI DE POBLE', className: 'sdp-badge-system' },
        { text: TIPUS_DOCUMENTACIO, className: 'sdp-badge-category' },
        ...(item.tags || []).map(text => ({ text, className: 'sdp-badge-tag' }))
      ]}
      copyright={COPYRIGHT_SDP}
    >
      <BarreraDeLaConsola
        fallback={(
          <Alerta to="error" titol="No s’ha pogut carregar la documentació">
            La resta de la Wiki continua com sempre.
          </Alerta>
        )}
      >
        <Suspense fallback={<Carregant etiqueta="Carregant la documentació…" />}>
          <DocumentacioMaquinaria id={item.id} />
        </Suspense>
      </BarreraDeLaConsola>
    </UniversalPage>
  );
}

/**
 * T51 · Regla del Mestre (260928): cap document sense data (editorial.js,
 * dataDeDocument). La data real d'un document de la Wiki, per ordre:
 *   1. `date` del frontmatter (l'únic camp de data que admet
 *      tooling/wiki/schema.json), que el manifest copia a `attributes`;
 *   2. el segell del nom segons la taxonomia (aammdd_hhmm_…).
 * El manifest generat no porta cap altra data (ni la de modificació ni la
 * de generació): un document sense cap de les dues fonts es queda sense
 * pastilla, i és un deute del generador (compile-wiki-to-app.mjs), no de la
 * pàgina. Mai s'hi posa la data d'ara.
 */
export function dataDeDocumentWiki(item) {
  return dataHoraDeBarra({ creat: [item?.attributes?.date, dataDelNom(item?.id)] });
}

/* SPEC G · Tot l'HTML que pinta la Wiki passa primer per resolRecursosDeHtml
   (els src="/assets/…" prenen la base de l'amfitrió) i DESPRÉS pel sanejador,
   que continua sent l'última paraula. Sense base, el mateix HTML (Llei del
   Píxel). La crida a sanitizeHtml s'escriu a cada punt d'injecció, sense cap
   funció intermèdia: tractor-innerhtml.mjs només accepta un __html que
   comence literalment per sanitizeHtml(. */

function WikiDetail({ item }) {
  const { pageCopy } = useCoreContent();
  if (!item || item.id === '__intro') {
    const page = copyDePortada(pageCopy, COVER_PAGE_KEYS.wiki) || { title: 'Wiki de Poble', subtitle: 'La base de coneixement', image: '', html: '' };
    const data = dataHoraDeBarra({ creat: page.date });
    return (
      <UniversalPage
        chrome="context"
        title={page.title}
        subtitle={page.subtitle}
        lead={page.lead}
        heroImage={page.image}
        heroAlt={page.imageAlt || ''}
        {...data}
        showLogos={true}
        labels={[
          { text: 'WIKI DE POBLE', className: 'sdp-badge-system' },
          { text: 'Portada', className: 'sdp-badge-category' }
        ]}
        copyright={COPYRIGHT_SDP}
        /* T43 (ordre del Mestre, 260928) · la portada també es connecta: sense
           onConnect, UniversalPage la connecta com a 'pagina' amb la seua ruta. */
      >
        <div
          className="sdp-prose sdp-prose--encoixinada"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(page.html)) }}
        />
      </UniversalPage>
    );
  }

  // Només les claus pròpies: un document que es diguera «constructor» no és cap eina.
  const Eina = EINES_LOCALS && Object.prototype.hasOwnProperty.call(EINES_LOCALS, item.id) ? EINES_LOCALS[item.id] : null;
  if (Eina) return <EinaLocal item={item} Eina={Eina} />;
  // Pla 261027_0845 (Guarda Nocturna), §3 · Fora de DEV, la mateixa adreça porta la documentació, sense accions.
  if (IDS_DOCUMENTACIO.has(item.id)) return <DocumentacioLocal item={item} />;

  if (item.id === 'consola_termodinamica') {
    // Mateix copy que la ruta /consola: el subtítol (h2) va seguit de
    // l'entradeta, i les targetes (h3) porten a /consola/<pàgina>. Amb la
    // mateixa precedència que la portada (copyDePortada, 261001). La ruta
    // /consola (consolaPagines.js) encara llig PAGE_COPY: hui el core en porta
    // una còpia idèntica (la Consola no té data de prova ni targeta al Mur).
    const consola = copyDePortada(pageCopy, COVER_PAGE_KEYS.consola);
    const data = dataHoraDeBarra({ creat: consola?.date });
    return (
      <UniversalPage
        chrome="context"
        title={consola?.title || item.title}
        subtitle={consola?.subtitle || item.subtitle}
        lead={consola?.lead}
        {...data}
        showLogos={true}
        labels={[
          { text: 'WIKI DE POBLE', className: 'sdp-badge-system' },
          { text: 'Eina Interactiva', className: 'sdp-badge-category' },
          ...(item.tags || []).map(text => ({ text, className: 'sdp-badge-tag' }))
        ]}
        copyright={COPYRIGHT_SDP}
      >
        {/* Onada 7 (261009) · La capçalera, el títol, les etiquetes i el
            copyright es pinten de seguida; només el tauler espera el seu tros
            i, si no arriba, només el tauler ho diu. */}
        <BarreraDeLaConsola
          fallback={(
            <Alerta to="error" titol="No s’ha pogut carregar la Consola">
              La resta de la Wiki continua com sempre.
            </Alerta>
          )}
        >
          <Suspense fallback={<Carregant etiqueta="Carregant la Consola…" />}>
            <ConsolaIncrustada />
          </Suspense>
        </BarreraDeLaConsola>
      </UniversalPage>
    );
  }

  const data = dataDeDocumentWiki(item);

  const categoryLabels = (item.categoryIds || []).map(id => {
    const cat = wikiManifest.categories.find(c => c.id === id);
    return { text: cat ? cat.label : id, className: 'sdp-badge-category' };
  });
  
  const tagLabels = (item.tags || []).map(tag => ({ text: tag, className: 'sdp-badge-tag' }));
  
  const labels = [...categoryLabels, ...tagLabels];

  const editorial = extreuEditorial(item.content);

  return (
    <UniversalPage
      chrome="context"
      title={editorial.titol || item.title}
      subtitle={item.subtitle}
      lead={editorial.entradilla ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(parseMarkdownEnLinia(editorial.entradilla))) }} /> : null}
      {...data}
      labels={labels}
      heroImage={item.image}
      showLogos={true}
      copyright={COPYRIGHT_SDP}
    >
      {item.id !== '00_index' && (

        <div className="sdp-article">
        {/* Quadre ISO. Les classes d'utilitat que duia (sdp-bg-alt, sdp-p-m,
            sdp-text-mut, sdp-text-brand, sdp-border-soft, sdp-radius-m,
            sdp-mb-l, sdp-mb-s, sdp-weight-bold, sdp-font-mono, sdp-badge…)
            no estaven declarades a cap full: no pintaven res i la porta de
            disseny les comptava com a Tailwind. Llevades sense tocar cap
            píxel. El quadre continua sense pell pròpia; vestir-lo amb Pedra
            Seca és una decisió de disseny, no de neteja. */}
          <h4>Quadre de Comandament ISO</h4>
          <table>
            <tbody>
              <tr>
                <th>Identificador</th>
                <td>{item.id}</td>
              </tr>
              <tr>
                <th>Domini</th>
                <td>_wiki_de_poble</td>
              </tr>
              {item.attributes?.version && (
                <tr>
                  <th>Versió</th>
                  <td>{String(item.attributes.version)}</td>
                </tr>
              )}
              {item.attributes?.author && (
                <tr>
                  <th>Autor / Propietari</th>
                  <td>{String(item.attributes.author)}</td>
                </tr>
              )}
              {item.attributes?.date && (
                <tr>
                  <th>Data Creació</th>
                  <td>{String(item.attributes.date)}</td>
                </tr>
              )}
              {item.attributes?.type && (
                <tr>
                  <th>Tipus</th>
                  <td>{String(item.attributes.type)}</td>
                </tr>
              )}
              {item.attributes?.status && (
                <tr>
                  <th>Estat</th>
                  <td>
                    <span>{String(item.attributes.status)}</span>
                  </td>
                </tr>
              )}
              {item.attributes?.description && (
                <tr>
                  <th>Descripció</th>
                  <td>{String(item.attributes.description)}</td>
                </tr>
              )}
              <tr>
                <th>Classificació</th>
                <td>{item.tags?.length > 0 ? item.tags.join(', ') : 'Públic'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <div
        className="sdp-prose"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(parseMarkdown(editorial.cos, { entradilla: false }))) }}
      />
    </UniversalPage>
  );
}

/* La primera opció de l'arbre: la portada («Wiki de Poble»). */
const CATEGORIA_INICIAL = '__intro_cat';

export default function WikiDePobleSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pageCopy } = useCoreContent();
  /* 261001 · La llista i el detall lligen el mateix copy (copyDePortada). */
  const portada = copyDePortada(pageCopy, COVER_PAGE_KEYS.wiki);
  const consola = copyDePortada(pageCopy, COVER_PAGE_KEYS.consola);
  /* Gauntlet 261016 (Bloc 3.4; ordre del Mestre: «retirar definitivament la
     maquinària interna de desenvolupament de l'aside en pantalles d'usuari»)
     · La carpeta «Maquinària de la IAIA», amb la Consola incrustada i les
     eines locals, només en desenvolupament o per a qui és superadmin
     (maquinariaALaVista), com la ruta /consola en producció. Abans la Wiki
     pública la mostrava a qualsevol visitant. Sense la carpeta, una URL vella
     amb ?item=consola_termodinamica cau com qualsevol ítem desconegut: la
     portada. Sense proveïdor de sessió, ningú no és superadmin.
     Revisió adversarial del carril D (261016, problema 2) · El rol arriba
     tard i torna a comprovar-se a cada renovació del JWT: durant la renovació
     es conserva l'últim rol resolt del mateix compte (useSuperadminEstable),
     i la Consola no desapareix de davant d'un superadmin que hi treballa.
     Pla 261027_0845 (Guarda Nocturna), §3 · Transparència radical: fora de
     desenvolupament, la carpeta porta també la documentació pública de les
     tres peces (documentacioMaquinariaActiva) i ix per a tothom. La Consola
     continua sent només de desenvolupament o de qui és superadmin
     (ambMaquinaria), i les eines amb botons, només de desenvolupament.
     Derogat EN PART: «la carpeta, només en desenvolupament o per a qui és
     superadmin» (Bloc 3.4): ho continua sent la Consola, no la carpeta. */
  const { esSuperadmin, rolPendent } = useSuperadminEstable();
  const ambMaquinaria = maquinariaALaVista({ DEV: import.meta.env.DEV, esSuperadmin });
  const ambCarpetaMaquinaria = ambMaquinaria || DOCUMENTACIO_MAQUINARIA.items.length > 0;

  // Parseitem de la URL per mantenir l'estat (ex: ?item=genoma)
  const queryParams = new URLSearchParams(location.search);
  const activeItemId = queryParams.get('item');
  /* Revisió adversarial del carril D (261016, problema 2) · Mentre el rol és
     pendent (la sessió es comprova i no hi ha cap rol resolt del mateix compte
     per heretar), una URL que demana la Maquinària (la carpeta o la Consola;
     les eines locals només existixen en desenvolupament, on la carpeta sempre
     és a la vista) espera en 'loading'. Així el workspace no la dona per
     absent ni reescriu la URL abans d'hora, i un superadmin que l'obri en fred
     arriba a la Consola quan el rol es resol. Qualsevol altra URL es pinta de
     seguida, com sempre.
     Pla 261027_0845 (Guarda Nocturna), §3 · Ara la carpeta ja és a la vista
     fora de desenvolupament, però sense la Consola fins que el rol es resol:
     una URL de la carpeta continua esperant, perquè el workspace no hi trie
     una altra fitxa ni reescriga la URL abans que la Consola hi puga ser.
     Revisió adversarial del bloc B (Guarda Nocturna 261027) · Llei del Píxel:
     només espera la URL que pot acabar a la Consola (la Consola mateixa, o la
     carpeta sense cap fitxa de documentació triada). La d'una pàgina de
     documentació (?categoria=maquinaria_cat&item=sentinelles_panell, la que
     escriu triar-la a l'arbre) s'obri de seguida: la fitxa ja hi és abans del
     rol, i el workspace no la canvia. */
  const esperaLaSessio = esperaElRol({
    aLaVista: ambMaquinaria,
    rolPendent,
    demana: activeItemId === 'consola_termodinamica'
      || (queryParams.get('categoria') === 'maquinaria_cat' && !IDS_DOCUMENTACIO.has(activeItemId))
  });

  const model = useMemo(() => {
    return {
      status: esperaLaSessio ? 'loading' : 'ready',
      itemsComplete: true,
      workspaceKey: 'wikidepoble',
      /* Ordre del Mestre (pla 261007_0012, §0.7) · Cada entrada de l'arbre, el
         seu emoji (iconesWiki.js · glifDeCarpetaWiki): menut a l'arbre i als
         rails (NavGlyph), i el glif que heretaria a la llista una fitxa sense
         emoji propi. Una carpeta nova del manifest sense emoji, Folder. */
      categories: [
        { id: '__intro_cat', label: 'Wiki de Poble', icon: glifDeCarpetaWiki('__intro_cat') },
        ...(ambCarpetaMaquinaria ? [
          { id: 'maquinaria_cat', label: 'Maquinària de la IAIA', icon: glifDeCarpetaWiki('maquinaria_cat') },
        ] : []),
        ...MODULS_LOCALS.categories,
        ...wikiManifest.categories.map(c => ({
          id: c.id,
          parentId: c.parentId,
          label: c.label,
          icon: glifDeCarpetaWiki(c.id)
        }))
      ],
      items: [
        {
          id: '__intro',
          /* Ordre del Mestre (pla 261007_0012, §0.7) · A la llista, la portada
             porta el seu emoji (XL a la fitxa, ItemMedia). La fitxa ja no porta
             la imatge de la portada: ItemMedia la pintaria en lloc de l'emoji.
             En obrir-la, la imatge de la capçalera continua igual: WikiDetail
             la llig del copy (page.image), no de l'ítem. */
          icon: ICONES_ITEMS_WIKI.__intro,
          title: portada?.title || 'Wiki de Poble',
          subtitle: portada?.subtitle || 'La base de coneixement',
          categoryId: '__intro_cat',
          categoryIds: ['__intro_cat'],
          attributes: { type: 'Portada', date: portada?.date }
        },
        ...(ambMaquinaria ? [
          {
            id: 'consola_termodinamica',
            /* 261006 · La Consola ja no té carpeta pròpia (consola_termodinamica_cat,
               FileText). Sense glif propi, la seua fitxa heretaria la carpeta de
               maquinaria_cat (regla del glif, 261004). Ordre del Mestre (261007):
               el glif propi és el seu emoji, ⚙️, el de la Consola al catàleg. */
            icon: ICONES_ITEMS_WIKI.consola_termodinamica,
            title: consola?.title || 'Consola Termodinàmica',
            subtitle: consola?.subtitle || 'Manteniment de la IAIA',
            categoryId: 'maquinaria_cat',
            categoryIds: ['maquinaria_cat'],
            tags: ['consola', 'ia'],
            attributes: { type: 'Eina Interactiva', author: 'Sistema', date: consola?.date },
            content: ''
          },
          ...MODULS_LOCALS.items,
        ] : []),
        // Pla 261027_0845 (Guarda Nocturna), §3 · Fora de DEV, per a tothom, darrere de la Consola si hi és.
        ...DOCUMENTACIO_MAQUINARIA.items,
        ...wikiManifest.items.map(i => ({
          id: i.id,
          /* Ordre del Mestre (261007) · L'emoji del document (iconesWiki.js): el
             manifest és generat i no en porta cap. */
          icon: iconaDeDocument(i),
          title: i.id === '00_index' && i.title === '00_index' ? 'Índex' : i.title,
          subtitle: i.subtitle,
          // Un fitxer de l'arrel (00_index) és un document de «Tot», no una carpeta.
          categoryId: i.categoryId || null,
          categoryIds: i.categoryId ? [i.categoryId] : [],
          tags: i.tags,
          attributes: i.attributes || {},
          content: i.content,
          image: i.image
        }))
      ]
    };
  }, [portada, consola, ambMaquinaria, ambCarpetaMaquinaria, esperaLaSessio]);

  // T26.2 (ordre del Mestre, 260927 nit): en entrar sense res a la URL, la
  // primera opció de l'arbre («Wiki de Poble», la portada) va seleccionada,
  // com a Disseny i al Xat. Obrir un document per URL sense carpeta continua
  // mostrant «Tot» (no restringix la llista a sa carpeta), i «Tot» triat a mà
  // es guarda a la URL com qualsevol altra carpeta.
  const categoryParam = queryParams.get('categoria');
  const categoriaInicial = activeItemId ? ALL_CATEGORY_ID : CATEGORIA_INICIAL;
  const activeCategoryId = categoryParam === ALL_CATEGORY_ID || model.categories.some(category => category.id === categoryParam)
    ? categoryParam
    : categoriaInicial;
  const itemEfectiu = activeItemId
    ?? (activeCategoryId === ALL_CATEGORY_ID || activeCategoryId === CATEGORIA_INICIAL ? '__intro' : null);

  const initialSelection = useMemo(() => {
    return { categoryId: activeCategoryId, itemId: itemEfectiu };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selection = useMemo(() => {
    return { categoryId: activeCategoryId, itemId: itemEfectiu };
  }, [activeCategoryId, itemEfectiu]);

  const handleSelectionChange = (sel) => {
    const next = new URLSearchParams(location.search);
    // El valor per defecte no s'escriu a la URL: la carpeta inicial sense
    // document obert, «Tot» amb un document obert (mateix criteri que en llegir-la).
    const itemObert = Boolean(sel.itemId && sel.itemId !== '__intro');
    const perDefecte = itemObert ? ALL_CATEGORY_ID : CATEGORIA_INICIAL;
    if (sel.categoryId && sel.categoryId !== perDefecte) next.set('categoria', sel.categoryId);
    else next.delete('categoria');
    if (sel.itemId && sel.itemId !== '__intro') {
      next.set('item', sel.itemId);
    } else {
      next.delete('item');
    }
    navigate(`?${next.toString()}`, { replace: true });
  };

  return (
    <UniversalWorkspace
      collapsibleNavigation={false}
      replegaTotaCapcalera
      /* MD (ordre del Mestre, 261003) · En mòbil, primer l'arbre; amb ?item=
         a l'entrada (el cru, no itemEfectiu, que val '__intro'), el document,
         tret que siga el que hi havia quan la persona va deixar la Wiki (triar
         una carpeta escriu la primera fitxa sola): llavors, el nivell on era
         (nivellMestreDetall.js). */
      mestreDetall={{ clau: 'wiki', element: activeItemId }}
      model={model}
      initialSelection={initialSelection}
      selection={selection}
      onSelectionChange={handleSelectionChange}
      labels={{ categories: 'WIKI DE POBLE', items: 'DOCUMENTS', select: 'Tria un document.' }}
      icons={{ categories: Folder, items: FileText }}
      className="sdp-wiki-workspace"
      renderDetail={({ item }) => <WikiDetail item={item} />}
    />
  );
}
