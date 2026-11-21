import { esErrorLazy, lazyRoute } from '../../apps/plataforma/lazyRoute.js';
import React, { Suspense, useMemo, useSyncExternalStore } from 'react';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace.jsx';
import { ALL_CATEGORY_ID } from '../../components/universal/workspace/workspaceState.js';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { useToast } from '../../components/universal/NotificationContext.jsx';
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { wikiManifest } from '../../data/wikiManifest.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { resolRecursosDeHtml } from '../../config/assetResolver.js';
import { useLlenguaDelContingut } from '../../components/universal/traduccio/llenguaDelContingut.js';
import { Folder, FileText } from 'lucide-react';
import { useNavigate, useLocation } from '../../app/contexts/RouterContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useSuperadminEstable } from '../../hooks/useSuperadminEstable.js';
import { desaRevisioEditorial, revisioEditorial, subscriuRevisionsEditorials, versioRevisionsEditorials } from '../../data/revisionsEditorialsDelNavegador.js';
import { useSEO } from '../../hooks/useSEO.js';
import { compartix, urlPerCompartir, useUbicacioApp } from '../../components/PedraSeca/hooks/useAccions.js';
import { PAGE_COPY } from '../text/pageContent';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { COVER_PAGE_KEYS } from '../../config/systemPages';
import { parseMarkdown, extreuEditorial, parseMarkdownEnLinia } from './parseMarkdown.js';
import { ICONES_ITEMS_WIKI, glifDeCarpetaWiki, iconaDeDocument } from './iconesWiki.js';
import { esperaElRol, maquinariaALaVista } from './maquinaria.js';
import { metadadesDeDocumentWiki, rutaDeCompartirDocumentWiki } from './seoWiki.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import {
  AVIS_EINA_LOCAL_SENSE_TRADUCCIO,
  CATEGORIA_INICIAL_WIKI,
  TEXTOS_ESPAI_WIKI,
  TIPUS_DOCUMENTACIO,
  copyDePortada,
  dataDeDocumentWiki,
  destiInternDeWiki,
  documentacioMaquinariaActiva,
  modulsLocalsActius as modulsLocalsActiusModel
} from './wikiDePobleModel.js';

// La portada és una peça estructural: si la clau desapareix, la pàgina es
// pinta buida. En desenvolupament ho diem en veu alta (incident del 24-09).
if (import.meta.env?.DEV && !PAGE_COPY[COVER_PAGE_KEYS.wiki]) {
  console.warn(`[Wiki] Falta la portada «${COVER_PAGE_KEYS.wiki}» a PAGE_COPY; es pinta el títol per defecte.`);
}

/* Delegació pura a wikiDePobleModel.js conservada per compatibilitat amb la
   guarda estàtica de frontera de src/sections/gestoria/privacitat.test.js. */
export function modulsLocalsActius(env) {
  return modulsLocalsActiusModel(env);
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
      /* Cicle 4 (lang-ca-nomes-a-textsection) · El títol i l'entradilla de
         l'eina, en valencià; l'eina mateixa (dades d'este ordinador), no. */
      llenguaDelContingut="ca"
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
      /* Cicle 4 (lang-ca-nomes-a-textsection) · La documentació, en valencià
         (el cos el demana a DocumentacioMaquinaria). */
      llenguaDelContingut="ca"
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

function ProsaDeLaWiki({ encoixinada = false, html }) {
  const lang = useLlenguaDelContingut();
  const navigate = useNavigate();
  const location = useLocation();
  const alClicarProsa = (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const node = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!node || node.hasAttribute('download')) return;
    const target = (node.getAttribute('target') || '').trim().toLowerCase();
    if (target && target !== '_self') return;
    const desti = destiInternDeWiki(node.getAttribute('href'), location?.pathname || '/wikidepoble');
    if (!desti) return;
    event.preventDefault();
    navigate(desti);
  };
  return <div className={encoixinada ? 'sdp-prose sdp-prose--encoixinada' : 'sdp-prose'} lang={lang} onClick={alClicarProsa} dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(html), { llistesNumerades: true, enllacosEditorials: true }) }} />;
}

/* El Quadre ISO d'un document: etiquetes i valors en valencià, escrits ací. */
function QuadreDelDocument({ children }) {
  return <div className="sdp-article" lang={useLlenguaDelContingut()}>{children}</div>;
}

/* v1.2.8 · P0-126 (costura Codex R32.9 ↔ Gemini R32.9) · Interruptor «Mostrar també al Mur»
   d'un document de la Wiki, només per a superadmin. Desa la revisió editorial del Mur amb la
   clau 'wiki:<id>' (la de wikiAlMur.js) al navegador; desactivar-lo conserva el document al seu
   llibre i no canvia cap permís. Sense suport remot, la revisió no viatja a cap altre navegador. */
function InterruptorWikiAlMur({ item }) {
  const { esSuperadmin } = useSuperadminEstable();
  useSyncExternalStore(subscriuRevisionsEditorials, versioRevisionsEditorials, versioRevisionsEditorials);
  if (!esSuperadmin || !item?.id) return null;
  const clau = `wiki:${item.id}`;
  const revisio = revisioEditorial('mur', clau);
  const perDefecte = typeof item.mur === 'boolean' ? item.mur : item.attributes?.mur === true;
  const actiu = typeof revisio?.mostrarAlMur === 'boolean' ? revisio.mostrarAlMur : perDefecte;
  return (
    <tr>
      <th scope="row">Mur</th>
      <td>
        <label>
          <input
            type="checkbox"
            checked={actiu}
            onChange={(event) => desaRevisioEditorial('mur', clau, { mostrarAlMur: event.target.checked })}
          />{' '}
          Mostrar també al Mur
        </label>
      </td>
    </tr>
  );
}

function WikiDetail({ item }) {
  const { pageCopy } = useCoreContent();
  /* Pla 261028_1526 (P1-61, Fase 2) · El <head> del document que es pinta
     (seoWiki.js): el d'un document públic del manifest, amb el canonical
     ?item=<id> (la clau de la ruta, useSEO), i el genèric sense indexar per a
     qualsevol altre. Els hooks van davant dels retorns anticipats: l'ordre no
     canvia mai.
     Decisió 2 del Mestre (261028) · Compartir un document públic envia la
     forma de camí (/wikidepoble/<id>), la que el build prerenderitza amb el
     seu títol i la seua imatge; la resta d'ítems, el Compartir de sempre. */
  const { search } = useLocation();
  const { showToast } = useToast();
  const router = useUbicacioApp();
  const seo = useMemo(() => metadadesDeDocumentWiki(item, search, wikiManifest.items), [item, search]);
  useSEO(seo);
  const rutaDeCompartir = rutaDeCompartirDocumentWiki(item, wikiManifest.items);
  const compartirDocument = rutaDeCompartir
    ? () => compartix(seo.title, urlPerCompartir(rutaDeCompartir, router), showToast)
    : undefined;
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
        /* v1.2.17 · Gauntlet R1 (L3-14) · La mida i la prioritat que porta la portada (copyDePortada)
           arriben al hero, com a les pàgines de text (paginaDeText.js); sense, el de sempre. */
        {...(page.image && page.imageWidth != null && page.imageHeight != null
          ? { heroWidth: page.imageWidth, heroHeight: page.imageHeight } : null)}
        {...(page.imageFetchPriority === 'high' ? { heroFetchPriority: 'high' } : null)}
        {...data}
        showLogos={true}
        labels={[
          { text: 'WIKI DE POBLE', className: 'sdp-badge-system' },
          { text: 'Portada', className: 'sdp-badge-category' }
        ]}
        copyright={COPYRIGHT_SDP}
        /* T43 (ordre del Mestre, 260928) · la portada també es connecta: sense
           onConnect, UniversalPage la connecta com a 'pagina' amb la seua ruta. */
        llenguaDelContingut="ca"
      >
        <ProsaDeLaWiki encoixinada html={page.html} />
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
        /* Gauntlet 261030 (cicle 4, ALT-C1 de Codex; C4-CONSOLA-WIKI-TRADUIR) · Sense
           Traductor, com la ruta /consola: el tauler incrustat pinta dades d'este
           ordinador (consola.json, el Mapa i el govern en desenvolupament; fora, el
           registre de certificacions d'este navegador) i res no s'envia a cap motor de
           traducció. Traduir avisa (AVIS_PAGINA_SENSE_TRADUCCIO); el botó no canvia
           (Llei del Píxel). */
        traduccio={false}
        /* Cicle 4 (lang-ca-nomes-a-textsection) · El copy de PAGE_COPY.consola, en valencià. */
        llenguaDelContingut="ca"
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
      {...(compartirDocument ? { onShare: compartirDocument } : null)}
      lead={editorial.entradilla ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(parseMarkdownEnLinia(editorial.entradilla)), { enllacosEditorials: true }) }} /> : null}
      {...data}
      labels={labels}
      heroImage={item.image || item.attributes?.image}
      heroAlt={item.imageAlt || item.attributes?.imageAlt || ''}
      showLogos={true}
      copyright={COPYRIGHT_SDP}
      /* Cicle 4 (lang-ca-nomes-a-textsection) · El document, en valencià. */
      llenguaDelContingut="ca"
    >
      {item.id !== '00_index' && (

        <QuadreDelDocument>
        {/* Quadre ISO. Les classes d'utilitat que duia (sdp-bg-alt, sdp-p-m,
            sdp-text-mut, sdp-text-brand, sdp-border-soft, sdp-radius-m,
            sdp-mb-l, sdp-mb-s, sdp-weight-bold, sdp-font-mono, sdp-badge…)
            no estaven declarades a cap full: no pintaven res i la porta de
            disseny les comptava com a Tailwind. Llevades sense tocar cap
            píxel. El quadre continua sense pell pròpia; vestir-lo amb Pedra
            Seca és una decisió de disseny, no de neteja. */}
          {/* Gauntlet 261029 (cicle 1, a11y; IDEA-57 L5, P1-16) · La taula
              porta el nom del seu títol i cada etiqueta és una capçalera de
              fila (scope="row"). Cap selector en depén: 0 px. El nom va en
              aria-label i no en un id de l'h4: l'Índex de la pàgina posa el
              seu id als encapçalaments que no en tenen. */}
          {/* O7 · Gauntlet WC-05 · Continua sent h4: PageFrame pren el nivell
              de l'Índex del tag, i un h3 hi pujava l'entrada (sense sagnat,
              pes 600, color de títol). Canviar-lo és decisió del Mestre. */}
          <h4>Quadre de Comandament ISO</h4>
          <table aria-label="Quadre de Comandament ISO">
            <tbody>
              <tr>
                <th scope="row">Identificador</th>
                <td>{item.id}</td>
              </tr>
              <tr>
                <th scope="row">Domini</th>
                <td>_wiki_de_poble</td>
              </tr>
              {item.attributes?.version && (
                <tr>
                  <th scope="row">Versió</th>
                  <td>{String(item.attributes.version)}</td>
                </tr>
              )}
              {(item.revisions ?? item.attributes?.revisions) != null && (
                <tr>
                  <th scope="row">Revisions</th>
                  <td>{String(item.revisions ?? item.attributes.revisions)}</td>
                </tr>
              )}
              {item.attributes?.author && (
                <tr>
                  <th scope="row">Autor / Propietari</th>
                  <td>{String(item.attributes.author)}</td>
                </tr>
              )}
              {item.attributes?.date && (
                <tr>
                  <th scope="row">Data Creació</th>
                  <td>{String(item.attributes.date)}</td>
                </tr>
              )}
              {(item.attributes?.updated || item.updated) && (
                <tr>
                  <th scope="row">Última actualització</th>
                  <td>{String(item.attributes?.updated || item.updated)}</td>
                </tr>
              )}
              {item.attributes?.type && (
                <tr>
                  <th scope="row">Tipus</th>
                  <td>{String(item.attributes.type)}</td>
                </tr>
              )}
              {item.attributes?.status && (
                <tr>
                  <th scope="row">Estat</th>
                  <td>
                    <span>{String(item.attributes.status)}</span>
                  </td>
                </tr>
              )}
              {item.attributes?.description && (
                <tr>
                  <th scope="row">Descripció</th>
                  <td>{String(item.attributes.description)}</td>
                </tr>
              )}
              <tr>
                <th scope="row">Classificació</th>
                <td>{item.tags?.length > 0 ? item.tags.join(', ') : 'Públic'}</td>
              </tr>
              <InterruptorWikiAlMur item={item} />
            </tbody>
          </table>
        </QuadreDelDocument>
      )}
      <ProsaDeLaWiki html={parseMarkdown(editorial.cos, { entradilla: false })} />
    </UniversalPage>
  );
}

/* La primera opció de l'arbre: la portada («Wiki de Poble»). */
const CATEGORIA_INICIAL = CATEGORIA_INICIAL_WIKI;

export default function WikiDePobleSection() {
  const t = useTraductorOpcional();
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
          image: i.image || i.attributes?.image,
          imageAlt: i.imageAlt || i.attributes?.imageAlt || '',
          ...(i.revisions != null ? { revisions: i.revisions } : {})
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
      /* R32.26 (IDEA-302) · En mòbil, entrar a /wikidepoble obri directament la
         portada o l'article net (inicial: null, detall a pantalla) sense cobrir el
         visor amb el calaix fosc de l'arbre; el botó «← Documents» permet obrir
         l'arbre quan la persona vol canviar de carpeta o fitxa. */
      mestreDetall={{ clau: 'wiki', element: activeItemId, inicial: null }}
      model={model}
      initialSelection={initialSelection}
      selection={selection}
      onSelectionChange={handleSelectionChange}
      labels={{
        categories: tradueix(t, TEXTOS_ESPAI_WIKI.categories),
        items: tradueix(t, TEXTOS_ESPAI_WIKI.items),
        select: tradueix(t, TEXTOS_ESPAI_WIKI.tria),
      }}
      icons={{ categories: Folder, items: FileText }}
      className="sdp-wiki-workspace"
      renderDetail={({ item }) => <WikiDetail item={item} />}
    />
  );
}
