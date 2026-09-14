---
tipus: document
estat: esborrany
description: MINI-BUNDLE PER A Z
---
# MINI-BUNDLE PER A Z

## FITXER: src/components/ui/PillToggle.jsx
```jsx
/**
 * PillToggle.jsx — selector de píndola canònic de Pedra Seca (260911).
 *
 * Patró blindat pel Mestre: una píndola amb N opcions, una sola activa.
 * Substituïx les còpies soltes de `.pill` + `.pill--active` (Mur, Multimedia,
 * Onboarding) i serà el selector [Universal Cards] [Vista Comprimida].
 *
 * Decisions que no s'han de desfer:
 *  · L'estat actiu es pinta des de `[aria-pressed="true"]`, no des d'una
 *    classe. Si algú lleva l'ARIA, l'opció deixa de semblar activa: la
 *    versió inaccessible no pot tindre bon aspecte. (`.pill--active` no tenia
 *    cap regla CSS: l'estat era invisible.)
 *  · Botons natius dins d'un `role="group"`: Tab + Espai/Retorn sense JS de
 *    teclat. No és `tablist` perquè no hi ha `tabpanel`.
 *  · `onCanvi` es crida sempre, també sobre l'opció ja activa: el consumidor
 *    decidix (el Mapa del Mur es plega tornant a polsar-lo).
 *  · Actiu = taronja amb text fosc (--sdp-sobre-accent). Mai blanc sobre
 *    taronja (2,73:1).
 */
export function PillToggle({
  opcions = [],
  valor,
  onCanvi,
  etiqueta,
  className = '',
}) {
  return (
    <div
      role="group"
      aria-label={etiqueta}
      className={['sdp-pindola', className].filter(Boolean).join(' ')}
    >
      {opcions.map((opcio) => (
        <button
          key={opcio.valor}
          type="button"
          className="sdp-pindola__opcio"
          aria-pressed={opcio.valor === valor ? 'true' : 'false'}
          onClick={() => onCanvi?.(opcio.valor)}
        >
          {opcio.icona ? <span className="sdp-pindola__icona" aria-hidden="true">{opcio.icona}</span> : null}
          {opcio.text}
        </button>
      ))}
    </div>
  );
}

```

## FITXER: src/components/ui/index.js
```jsx
/**
 * components/ui — façana pública de la UI universal.
 *
 *  · Exportacions amb nom i explícites: si un nom desapareix, el build peta
 *    en lloc de callar.
 *  · Cap fitxer de ui/ importa d'ací: els germans s'importen directament
 *    ('./controls.jsx'). Així no hi ha cicles.
 *  · Només UniversalCard.jsx toca el router.
 */
export { BackIcon, ForwardIcon, IndexIcon, TranslateIcon, CommentIcon, ShareIcon, PinIcon, IaiaIcon } from './icones.jsx';
export { ActionControl, IconButton, UniversalButton, DateTimeControl } from './controls.jsx';
export { UniversalCard } from './UniversalCard.jsx';
export { UniversalIndicatorCard } from './UniversalIndicatorCard.jsx';
export { Accordion, AccordionItem } from './Accordion.jsx';
export { Dropdown, DropdownItem } from './Dropdown.jsx';
export { UniversalSearch } from './UniversalSearch.jsx';
export { PillToggle } from './PillToggle.jsx';

```

## FITXER: src/sections/disseny/DesignSection.jsx
```jsx
import { lazy, Suspense } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Link, useLocation, useSearchParams } from '../../app/contexts/RouterContext';
import { DesignSectionContent } from './DesignSectionContent.jsx';
import { PAGINES } from './cataleg/registre.js';
import { Carregant } from '../../components/ui/estats.jsx';

/* Cada pàgina del catàleg és un chunk: qui obri Fonaments no paga Formularis. */
const PAGINA = {
  estructura: lazy(() => import('./cataleg/PaginaEstructura.jsx')),
  formularis: lazy(() => import('./cataleg/PaginaFormularis.jsx')),
  superposicions: lazy(() => import('./cataleg/PaginaSuperposicions.jsx')),
  retroalimentacio: lazy(() => import('./cataleg/PaginaRetroalimentacio.jsx')),
  navegacio: lazy(() => import('./cataleg/PaginaNavegacio.jsx')),
  inventari: lazy(() => import('./cataleg/PaginaInventari.jsx')),
};

export default function DesignSection() {
  const [params] = useSearchParams();
  /* /disseny redirigix a /jo/disseny i perd la query: els enllaços es fan
     sobre la ruta real, no sobre l'àlies. */
  const { pathname } = useLocation();
  const demanada = params.get('pagina');
  const actual = PAGINA[demanada] ? demanada : 'fonaments';
  const Pagina = PAGINA[actual];

  return (
    <UniversalPage
      chrome="full"
      showLogos={true}
      title="Disseny"
      subtitle="Sistema oficial de disseny per a Sóc de Poble"
      lead="Cada component es documenta amb el seu espècimen viu, el contracte, l'accessibilitat i les regles de fes / no facis, perquè qualsevol persona o IA el puga reproduir sense endevinar."
      copyright="© Sóc de Poble / Fet per la IAIA i Nano Banana"
      heroImage="/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.png"
      authorName="Sóc de Poble"
      authorLocation="La Torre de les Maçanes"
      time="23:29"
      date="22/3/22"
    >
      <nav className="sdp-cataleg-nav" aria-label="Pàgines del sistema de disseny">
        <ul className="sdp-cataleg-nav__llista">
          {PAGINES.map((p) => (
            <li key={p.id}>
              <Link to={p.id === 'fonaments' ? pathname : `${pathname}?pagina=${p.id}`}
                className="sdp-cataleg-nav__enllac" aria-current={p.id === actual ? 'page' : undefined}>
                {p.titol}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="content-wrapper">
        {Pagina ? (
          <Suspense fallback={<Carregant etiqueta="Carregant la pàgina del catàleg…" />}>
            <Pagina />
          </Suspense>
        ) : <DesignSectionContent />}
      </div>
    </UniversalPage>
  );
}

```

## FITXER: src/sections/disseny/DesignSectionContent.jsx
```jsx
import React from 'react';
import { UniversalCard, Accordion, AccordionItem, Dropdown, DropdownItem } from '../../components/universal/UniversalElements';
import { EventCard } from '../../components/universal/EventCard.jsx';
import { showToast, AvisadorEfimer } from '../../components/universal/AvisadorEfimer.jsx';
import { EVENTS } from '../mur/eventsContent.js';
/**
 * ComponentDoc - Wrapper per a documentar elements del Sistema de Disseny (Pedra Seca)
 * Açò actua com a "Storybook" en miniatura.
 */
function ComponentDoc({ title, description, technical, transparent, children }) {
  return (
    <div className="component-doc ">
      <div className="component-doc-header">
        <h3 >{title}</h3>
        {description && <p >{description}</p>}
        {technical && (
          <div role="alert" className="sdp-alerta--info">
            <strong>Context Tècnic: </strong> {technical}
          </div>
        )}
      </div>
      <div className={`component-doc-preview ${transparent ? 'component-doc-preview--transparent' : ''}`}>
        {children}
      </div>
    </div>
  );
}

export function DesignSectionContent() {
  return (
    <>
        {/* Generated JSX from HTML */}
        
<section className="design-block ">
<h3>1. Lleis de Pedra Seca per a IAs Arquitectes</h3>
<p >Normes absolutes que regeixen tot el que una IA pot o no pot fer en este repositori. Açò és el més important abans de tocar cap codi o disseny.</p>

<h4>1.1 Arquitectura de la Pàgina Universal (UniversalPage)</h4>
<div role="alert" className="sdp-alerta--info ">
  <div className="alert-content">
    <p><strong>Estructura Anatòmica Inviolable (FONT ÚNICA DE VERITAT)</strong><br/>Aquesta secció i el component <code>UniversalComponents.jsx</code> (on es defineix la UniversalPage) són la font única de veritat per a qualsevol agent o IA. Tota nova pàgina ha d'estendre exclusivament aquesta arquitectura, sense excepcions.</p>
    <ol className="sdp-llista">
      <li><strong>Barres Superiors (Controls):</strong> La barra blava de navegació (context) i la barra taronja d'autoria (dades meta, data, connectar). En mode normal (pàgina completa), aquestes barres fan <em>sticky</em> a la part superior (es queden fixades).</li>
      <li><strong>Excepció (Mode Incrustat):</strong> Quan la UniversalPage s'incrusta en un editor (com el Bloc de Notes), la barra blava i la taronja adopten classe <code>--embed</code> (<em>position: static</em>) i s'amaguen naturalment amb l'scroll del document per afavorir l'edició lliure i evitar un "doble scroll". Aquesta és l'única excepció permesa.</li>
      <li><strong>Imatge Hero (Opcional):</strong> Es renderitza immediatament davall de les barres. Ocupa l'ample disponible (100%) sense marges.</li>
      <li><strong>La Targeta de Decoració Blanca (Header):</strong> Un bloc blanc amb <em>box-shadow</em> que embolica el logotip de Sóc de Poble (max 600px), l'element <strong>H1</strong> (H3 a la card), les etiquetes de categorització, i el <strong>Copyright</strong> de tancament.
      <br/><small >Nota: El tancament d'aquesta targeta delimita el final de la decoració del títol.</small></li>
      <li><strong>H2 i Entradilla (Fora de la targeta blanca):</strong> Actuen de pont i preàmbul visual abans d'endinsar-se en l'article profund.</li>
      <li><strong>H3 i Contingut Base (article):</strong> El text enriquit, estructurat harmònicament cap avall amb una amplària màxima centrada (~68 caràcters) per afavorir la llegibilitat (<em>var(--sdp-measure)</em>). La resta d'elements (targetes, graelles) flueixen a tota l'amplària disponible del contenidor respectant els marges de 40px (<em>var(--sdp-pad-contenidor)</em>).</li>
    </ol>
  </div>
</div>

<p><strong>Esquema anatòmic canònic (UniversalPage)</strong>:</p>
<pre><code>{`<!-- El shell extern de l'aplicació -->
<div className="app-layout">
  <Sidebar /> <!-- nav.app-sidebar -->
  <main className="app-main">
    <Topbar /> <!-- header.app-header -->
    <!-- El contenidor de la pàgina -->
    <div className="page-container">

      <!-- INICI DE LA UNIVERSAL PAGE -->
      <article className="universal-page">
        <!-- 1. Barres Superiors -->
        <header className="bar-blue">...</header>
        <section className="bar-orange">...</section>

        <!-- 2. Decoració Targeta Blanca -->
        <header className="page-header-card">
          <h1>Títol</h1>
          <div className="meta-footer">...</div>
        </header>

        <!-- 3. Contingut base -->
        <div className="page-content-wrapper">
          <p className="lead">Entradilla</p>
          <div className="page-content">
             <p>Text de cos limitat a 68ch...</p>
             <UniversalCard />
          </div>
        </div>
      </article>

    </div>
  </main>
</div>`}</code></pre>

<h4>1.2 Normes de Codi i CSS Absolutes (Llista "Prohibit Inventar")</h4>
<div role="alert" className="sdp-alerta--avis "><div className="alert-content">
<p><strong>Aquestes regles són absolutes i no es poden trencar sota cap concepte:</strong></p>
<ol>
<li><strong>Cap Serif al Core:</strong> Està terminantment prohibit usar tipografies serif (com Times o Georgia). La font única i exclusiva és <code>Noto Sans</code>.</li>
<li><strong>Prohibició d'estils en línia:</strong> Està terminantment prohibit l'ús de <code>style=&#123;&#123;&#125;&#125;</code> en tot el codi JSX. Tots els estils han de viure en CSS mitjançant classes de la Constitució Pedra Seca.</li>
<li><strong>Només Variables Semàntiques:</strong> Els components han d'utilitzar únicament els tokens semàntics (Capa 2, ex. <code>var(--sdp-accio)</code>). Prohibit aplicar colors directes o tokens de la paleta primitiva (Capa 1). L'H3 usa exclusivament <code>var(--sdp-accio-text)</code>.</li>
<li><strong>Shadow DOM i Mode Fosc:</strong> Perquè les variables de CSS funcionin bé dins de WordPress o altres entorns amb Shadow DOM, <strong>sempre</strong> que s'escrigui una regla per al tema fosc com <code>:root[data-theme="dark"]</code> s'ha de duplicar exactament amb el selector bessó <code>:host([data-theme="dark"])</code>.</li>
</ol>
</div></div>
</section>

<section className="design-block">
<h3>2. Identitat Cromàtica</h3>
<p>La paleta es genera en <strong>OKLCH</strong>: el to i el croma de marca es mantenen constants i només varia la lluminositat. Per això l'escala és perceptivament regular i cada graó té un contrast previsible.</p>
<div role="alert" className="sdp-alerta--info "><div className="alert-content"><h4>Contracte d'accessibilitat</h4>
<p>Este sistema complix <strong>WCAG 2.2 nivell AAA (≥7:1) en tot el text, els fons i els grisos estructurals</strong>, i <strong>nivell AA (≥4,5:1) en els colors d'interacció</strong> — enllaços, pestanyes actives i botons primaris. Els límits dels controls complixen la norma 1.4.11 (≥3:1).</p>
<p>Esta distinció és deliberada i honesta: AAA estricte en tot obligaria a abandonar el taronja de marca, perquè cap taronja reconeixible arriba a 7:1 sobre blanc. Preferim dir-ho que amagar-ho.</p>
</div></div>

<h4>2.1 Colors de marca</h4>
<div className="palette">
<div className="swatch">
<div className="swatch-color sw-primary-500">Taronja · fons</div>
<div className="swatch-info">#ff7300<br/>--sdp-primary-500</div>
</div>
<div className="swatch">
<div className="swatch-color sw-primary-700">Taronja fort</div>
<div className="swatch-info">#ad4c03<br/>--sdp-primary-700<br/>Text accent sobre fons clar · fons massís de botó important</div>
</div>
<div className="swatch">
<div className="swatch-color sw-secondary-500">Blau · fons</div>
<div className="swatch-info">#016ebf<br/>--sdp-secondary-500</div>
</div>
<div className="swatch">
<div className="swatch-color sw-secondary-600">Blau fort</div>
<div className="swatch-info">#00599d<br/>--sdp-secondary-600</div>
</div>
<div className="swatch">
<div className="swatch-color sw-blanc-pur">Blanc</div>
<div className="swatch-info">#ffffff<br/>Fons principal</div>
</div>
<div className="swatch">
<div className="swatch-color sw-negre-pur">Negre</div>
<div className="swatch-info">#0e0d0c<br/>--sdp-pedra-900<br/>Text principal</div>
</div>
</div>
<div className="sdp-taula sdp-taula--densa"><table><thead><tr><th>Parella</th><th>Contrast</th><th>Nivell</th><th>Ús</th></tr></thead><tbody>
<tr><td>Text fosc sobre taronja 500</td><td>7.13:1</td><td>AAA</td><td>Botons primaris, capçalera de targeta</td></tr>
<tr><td>Taronja 700 sobre blanc</td><td>5.51:1</td><td>AA</td><td>Enllaços, pestanya activa</td></tr>
<tr><td>Taronja 800 sobre blanc</td><td>7.97:1</td><td>AAA</td><td>Títols h2 i h4</td></tr>
<tr><td>Blanc sobre blau 500</td><td>5.23:1</td><td>AA</td><td>Barra blava, peu de targeta</td></tr>
<tr><td>Blau 600 sobre blanc</td><td>7.20:1</td><td>AAA</td><td>Títols h1, h3 i h5</td></tr>
</tbody></table></div>
<h4>1.2 Colors d'estat</h4>
<div className="palette">
<div className="swatch">
<div className="swatch-color sw-error-500">Alerta</div>
<div className="swatch-info">#c2181d<br/>--sdp-error-500</div>
</div>
<div className="swatch">
<div className="swatch-color sw-avis-500">Avís</div>
<div className="swatch-info">#9c6902<br/>--sdp-avis-500</div>
</div>
<div className="swatch">
<div className="swatch-color sw-exit-500">Èxit</div>
<div className="swatch-info">#027e38<br/>--sdp-exit-500</div>
</div>
</div>
<h4>1.3 Escala Pedra</h4>
<p>Neutre càlid, mai gris fred. El graó <strong>600</strong> és el sòl per a text secundari: és el primer que arriba a 7:1 sobre blanc.</p>
<div className="palette">
<div className="swatch">
<div className="swatch-color sw-pedra-50">Blanc trencat · 50</div>
<div className="swatch-info">#ffffff<br/>--sdp-pedra-50</div>
</div>
<div className="swatch">
<div className="swatch-color sw-pedra-100">Núvol · 100</div>
<div className="swatch-info">#ffffff<br/>--sdp-pedra-100</div>
</div>
<div className="swatch">
<div className="swatch-color sw-pedra-200">Arena · 200</div>
<div className="swatch-info">#efece7<br/>--sdp-pedra-200</div>
</div>
<div className="swatch">
<div className="swatch-color sw-pedra-300">Calç · 300</div>
<div className="swatch-info">#dcd7cd<br/>--sdp-pedra-300</div>
</div>
<div className="swatch">
<div className="swatch-color sw-pedra-400">Cendra · 400</div>
<div className="swatch-info">#b7b1a5<br/>--sdp-pedra-400</div>
</div>
<div className="swatch">
<div className="swatch-color sw-pedra-500">Pedra · 500</div>
<div className="swatch-info">#8b857b<br/>--sdp-pedra-500</div>
</div>
<div className="swatch">
<div className="swatch-color sw-pedra-600">Pedra fosca · 600</div>
<div className="swatch-info">#5b564e<br/>--sdp-pedra-600</div>
</div>
<div className="swatch">
<div className="swatch-color sw-pedra-700">Grafit · 700</div>
<div className="swatch-info">#3d3b35<br/>--sdp-pedra-700</div>
</div>
<div className="swatch">
<div className="swatch-color sw-pedra-750">Pissarra · 750</div>
<div className="swatch-info">#302e29<br/>--sdp-pedra-750</div>
</div>
<div className="swatch">
<div className="swatch-color sw-pedra-800">Carbó · 800</div>
<div className="swatch-info">#22211e<br/>--sdp-pedra-800</div>
</div>
<div className="swatch">
<div className="swatch-color sw-pedra-850">Sutja · 850</div>
<div className="swatch-info">#181715<br/>--sdp-pedra-850</div>
</div>
<div className="swatch">
<div className="swatch-color sw-pedra-900">Negre · 900</div>
<div className="swatch-info">#0e0d0c<br/>--sdp-pedra-900</div>
</div>
</div>
</section>
{/*  SECCIÓ: TIPOGRAFIA CMS  */}
<section className="design-block">
<h3>2. Estudi Tipogràfic (Contracte Canònic)</h3>
<p>Aquesta és l'arquitectura tipogràfica universal de l'ecosistema Sóc de Poble. S'ha dissenyat sota un rigorós estudi per a garantir l'accessibilitat AAA (lectura sota llum solar intensa per a gent gran).</p>

<div role="alert" className="sdp-alerta--avis">
  <div className="alert-content">
    <h4>CONTRACTE TIPOGRÀFIC (PROHIBIT AL·LUCINAR)</h4>
    <p>Cap IA pot alterar o inventar tipografies (com introduir "serif" a l'H3 per associar-ho a conceptes com "còdex" o "arcaic"). Tot el sistema utilitza estrictament <strong>Noto Sans</strong>. A més, els colors dels títols alternen entre Blau Acció i Taronja Accent, i aquesta és l'única veritat acceptable.</p>
  </div>
</div>

<div className="sdp-taula sdp-taula--densa">
  <table>
    <thead>
      <tr>
        <th>Nivell</th>
        <th>Mida (rem/px)</th>
        <th>Pes (font-weight)</th>
        <th>Color Token</th>
        <th>Alineació</th>
        <th>Vora (Border)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>H1</strong></td>
        <td>2.5rem (40px)</td>
        <td>800</td>
        <td><code>var(--sdp-accio-text)</code> (Blau fort)</td>
        <td>Centrat</td>
        <td>Cap</td>
      </tr>
      <tr>
        <td><strong>H2</strong></td>
        <td>2rem (32px)</td>
        <td>800</td>
        <td><code>var(--sdp-accent-titol)</code> (Taronja fort)</td>
        <td>Centrat</td>
        <td>Cap</td>
      </tr>
      <tr>
        <td><strong>H3</strong></td>
        <td>1.75rem (28px)</td>
        <td>700</td>
        <td><code>var(--sdp-accio-text)</code> (Blau fort)</td>
        <td>Esquerra</td>
        <td>Inferior (1px solid var(--sdp-vora))</td>
      </tr>
      <tr>
        <td><strong>H4</strong></td>
        <td>1.5rem (24px)</td>
        <td>700</td>
        <td><code>var(--sdp-accent-titol)</code> (Taronja fort)</td>
        <td>Esquerra</td>
        <td>Cap</td>
      </tr>
      <tr>
        <td><strong>H5</strong></td>
        <td>1.25rem (20px)</td>
        <td>700</td>
        <td><code>var(--sdp-accio-text)</code> (Blau fort)</td>
        <td>Esquerra</td>
        <td>Cap</td>
      </tr>
      <tr>
        <td><strong>H6</strong></td>
        <td>1.125rem (18px)</td>
        <td>700</td>
        <td><code>var(--sdp-text-suau)</code> (Pedra)</td>
        <td>Esquerra</td>
        <td>Cap (Text en majúscules)</td>
      </tr>
    </tbody>
  </table>
</div>

<h4>Ritme Vertical i Espaiat Editorial</h4>
<p>L'interlineat base (line-height) és <code>1.65</code> per a paràgrafs i text de cos, garantint oxigen a la lectura, i <code>1.21</code> (snug) per a encapçalaments, mantenint compacitat visual.</p>
<div className="sdp-taula sdp-taula--densa">
  <table>
    <thead>
      <tr>
        <th>Element</th>
        <th>Marge Superior (margin-top)</th>
        <th>Marge Inferior (margin-bottom)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>h1</strong></td>
        <td><code>0</code></td>
        <td><code>16px</code> (var(--sdp-space-4))</td>
      </tr>
      <tr>
        <td><strong>h2</strong></td>
        <td><code>48px</code> (var(--sdp-space-12))</td>
        <td><code>12px</code> (var(--sdp-space-3))</td>
      </tr>
      <tr>
        <td><strong>h3</strong></td>
        <td><code>40px</code> (var(--sdp-space-10))</td>
        <td><code>12px</code> (var(--sdp-space-3))</td>
      </tr>
      <tr>
        <td><strong>h4</strong></td>
        <td><code>32px</code> (var(--sdp-space-8))</td>
        <td><code>8px</code> (var(--sdp-space-2))</td>
      </tr>
      <tr>
        <td><strong>Paràgraf (p)</strong> / <strong>Llistes (ul, ol)</strong></td>
        <td><code>0</code></td>
        <td><code>16px</code> (var(--sdp-space-4))</td>
      </tr>
    </tbody>
  </table>
</div>

<h4>Lleis Fonamentals Addicionals:</h4>
<ul>
<li><strong>Arrel Mestra:</strong> <code>18px (1.125rem)</code> per a garantir touch-targets i visibilitat nativa sense zoom.</li>
<li><strong>Ample Màxim de Lectura:</strong> <code>68ch</code>, el límit científic abans de causar fatiga ocular al saltar de línia.</li>
<li><strong>Subtítols (H2):</strong> Mai porten punt final, ja que funcionen com a titulars estructurals i no com a paràgrafs.</li>
<li><strong>Entradilla (Lead):</strong> S'ha d'ubicar sempre exclusivament davall del títol H2. Aquest és el seu únic lloc.</li>
</ul>

</section>
{/*  SECCIÓ: ESPAIAT I GRID  */}
<section className="design-block">
<h3>3. Espaiat i Grid</h3>
<h4>Sistema d'Espaiat (escala modular base 4/8)</h4>

<div className="sdp-escala">
  <div className="sdp-escala__fila"><span className="sdp-escala__token">--sdp-space-1</span><span className="sdp-escala__barra sdp-escala__barra--1"></span><span>4 px</span></div>
  <div className="sdp-escala__fila"><span className="sdp-escala__token">--sdp-space-2</span><span className="sdp-escala__barra sdp-escala__barra--2"></span><span>8 px</span></div>
  <div className="sdp-escala__fila"><span className="sdp-escala__token">--sdp-space-3</span><span className="sdp-escala__barra sdp-escala__barra--3"></span><span>12 px</span></div>
  <div className="sdp-escala__fila"><span className="sdp-escala__token">--sdp-space-4</span><span className="sdp-escala__barra sdp-escala__barra--4"></span><span>16 px</span></div>
  <div className="sdp-escala__fila"><span className="sdp-escala__token">--sdp-space-6</span><span className="sdp-escala__barra sdp-escala__barra--6"></span><span>24 px</span></div>
  <div className="sdp-escala__fila"><span className="sdp-escala__token">--sdp-space-8</span><span className="sdp-escala__barra sdp-escala__barra--8"></span><span>32 px</span></div>
  <div className="sdp-escala__fila"><span className="sdp-escala__token">--sdp-space-10</span><span className="sdp-escala__barra sdp-escala__barra--10"></span><span>40 px</span></div>
  <div className="sdp-escala__fila"><span className="sdp-escala__token">--sdp-space-12</span><span className="sdp-escala__barra sdp-escala__barra--12"></span><span>48 px</span></div>
  <div className="sdp-escala__fila"><span className="sdp-escala__token">--sdp-space-16</span><span className="sdp-escala__barra sdp-escala__barra--16"></span><span>64 px</span></div>
  <div className="sdp-escala__fila"><span className="sdp-escala__token">--sdp-space-20</span><span className="sdp-escala__barra sdp-escala__barra--20"></span><span>80 px</span></div>
</div>

<h4>Grid Responsive</h4>
<div className="grid-preview">
<div className="grid-col">1 columna (mòbil)</div>
<div className="grid-col">2 columnes (tauleta)</div>
<div className="grid-col">3 columnes (escriptori)</div>
</div>
</section>
{/*  SECCIÓ: BOTONS  */}
<section className="design-block ">
<ComponentDoc
  title="4. Botons (Accions)"
  description="L'element interactiu fonamental. Els botons han de comunicar clarament l'acció que realitzaran i el seu nivell d'importància."
  technical="Tots els botons complixen un touch-target mínim de 44x44px en mòbil. L'estat :focus-visible aplica un anell de color per a navegació per teclat (WCAG 2.1.1). Mai s'han d'usar per a enllaços simples sense acció."
>
  <h4>Variants i Jerarquia</h4>
  <p >Els botons es divideixen en nivells d'atenció. Usa <code>btn-primary</code> només per a l'acció principal d'una vista.</p>
  <div className="btn-group ">
    <button className="btn btn-primary">Primari</button>
    <button className="btn btn-secondary">Secundari</button>
    <button className="btn btn-outline-dark">Terciari</button>
    <button className="btn btn-base">Neutral / Base</button>
    <button className="btn btn-danger">Perill</button>
    <button className="btn btn-ghost">Fantasma</button>
  </div>

  <h4>Estats d'Interacció</h4>
  <p >Els estats visuals informen l'usuari sobre la disponibilitat de l'acció.</p>
  <div className="btn-group ">
    <button className="btn btn-primary">Normal</button>
    <button className="btn btn-primary" disabled>Desactivat</button>
    <button className="btn btn-primary" disabled>
      <svg className="spinner spinner-sm " viewBox="0 0 20 20">
        <circle cx="12" cy="12" fill="none" r="10" stroke="currentColor" strokeWidth="3"></circle>
      </svg>
      <span>Carregant...</span>
    </button>
  </div>
</ComponentDoc>
</section>

{/*  SECCIÓ: TARGETA MESTRA I AVATARS  */}
<section className="design-block">
  <h3>4.5 Avatars (Contracte)</h3>
  <div role="alert" className="sdp-alerta--avis">
    <div className="alert-content">
      <p><strong>Prohibit inventar mides:</strong> Els avatars només poden tenir les mides: <code>xs</code> (24px), <code>sm</code> (32px), <code>md</code> (44px, mínim touch), <code>lg</code> (56px) i <code>xl</code> (80px). Ràtio 1:1 exacte. Colors restringits a variables semàntiques.</p>
    </div>
  </div>
  <div className="sdp-avatar-grup">
    <span className="sdp-avatar sdp-avatar--xl">IA</span>
    <span className="sdp-avatar sdp-avatar--lg">MJ</span>
    <span className="sdp-avatar sdp-avatar--md">ER</span>
    <span className="sdp-avatar sdp-avatar--sm">SP</span>
    <span className="sdp-avatar sdp-avatar--xs">+4</span>
  </div>

  <h3>4.6 Targeta Mestra (UniversalCard)</h3>
  <p>La <code>&lt;UniversalCard&gt;</code> és el component base per a mostrar qualsevol entitat (poble, fitxa, usuari). No s'ha d'intentar imitar el seu DOM a mà; s'ha d'instanciar el component de React.</p>

  <div role="alert" className="sdp-alerta--avis">
    <div className="alert-content">
      <h4>CONTRACTE DOM (UNIVERSAL CARD)</h4>
      <p>Quan calgui entendre o replicar l'estructura, l'ordre de renderitzat és estricte:</p>
      <ol>
        <li><code>.sp-card-header</code> (Opcional, autoria i meta).</li>
        <li><code>.sp-card-media-container</code> (Opcional, aspect-ratio 1/1).</li>
        <li><code>.sp-card-body</code> (Obligatori, conté el títol, subtítol, text descriptiu i etiquetes <code>.sp-card-labels</code>).</li>
        <li><code>.sp-card-footer</code> (Opcional, equival a la barra blava, amb botons d'acció).</li>
      </ol>
      <p><strong>Classes obligatòries:</strong> L'embolcall sempre porta la classe <code>.sp-card</code>.</p>
    </div>
  </div>
  <div role="alert" className="sdp-alerta--info">
    <div className="alert-content">
      <h4>Invocació Canònica</h4>
      <p><code>{`<UniversalCard title="Títol" subtitle="Subtítol" headerLabel="Categoria" img="ruta.jpg" />`}</code></p>
    </div>
  </div>
  <UniversalCard
    title="La Torre de les Maçanes"
    subtitle="L'essència de la muntanya"
    headerLabel="POBLE"
    authorName="Sóc de Poble"
    img="https://picsum.photos/400/400"
  >
    <p>La UniversalCard centralitza tota la complexitat visual: des de la capçalera taronja fins a la imatge quadrada perfecta.</p>
  </UniversalCard>
</section>

{/*  SECCIÓ: FORMULARIS  */}
<section className="design-block">
<h3>5. Formularis i Inputs</h3>

<div className="form-group">
<label>Nom del poble</label>
<input placeholder="Ex: Petrer" type="text"/>
</div>
<div className="form-group">
<label>Província</label>
<select>
<option>Alacant</option>
<option>València</option>
<option>Castelló</option>
</select>
</div>
<div className="form-group">
<label>Descripció</label>
<textarea placeholder="Escriu una breu descripció..." rows="4"></textarea>
</div>
<div className="checkbox-group">
<input defaultChecked id="chk1" type="checkbox"/>
<label htmlFor="chk1">Accepte els termes del Consell de la Petorreta</label>
</div>
<div className="checkbox-group ">
<input defaultChecked id="optA" name="opt" type="radio"/> <label htmlFor="optA">Opció A</label>
<input id="optB" name="opt" type="radio"/> <label htmlFor="optB">Opció B</label>
</div>
<div className="form-group has-error ">
<label>Input amb error</label>
<input type="text" defaultValue="valor incorrecte"/>
<div className="error-text">Aquest camp és obligatori.</div>
</div>
<div className="form-group is-disabled ">
<label>Input desactivat</label>
<input disabled="" type="text" defaultValue="No editable"/>
</div>

</section>
{/*  SECCIÓ 7: ALERTES  */}
<section className="design-block">
<h3>7. Alertes i Missatges</h3>
<div role="alert" className="sdp-alerta--info">
<svg fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="16" y2="12"></line><line x1="12" x2="12.01" y1="8" y2="8"></line></svg>
<div className="alert-content">
<h4>Informació</h4>
<p>Aquesta és una alerta informativa per a destacar dades rellevants.</p>
</div>
</div>
<div role="alert" className="sdp-alerta--ok">
<svg fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
<div className="alert-content">
<h4>Èxit</h4>
<p>L'operació s'ha completat correctament.</p>
</div>
</div>
<div role="alert" className="sdp-alerta--avis">
<svg fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20"><path d="M10.25 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>
<div className="alert-content">
<h4>Avís</h4>
<p>Revisa els camps abans de continuar.</p>
</div>
</div>
<div role="alert" className="sdp-alerta--error">
<svg fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20"><circle cx="12" cy="12" r="10"></circle><line x1="15" x2="9" y1="9" y2="15"></line><line x1="9" x2="15" y1="9" y2="15"></line></svg>
<div className="alert-content">
<h4>Error</h4>
<p>No s'ha pogut connectar amb el servidor.</p>
</div>
</div>
</section>
{/*  SECCIÓ 8: BADGES  */}
<section className="design-block ">
<h3>8. Badges i Etiquetes</h3>
<div className="design-badges-container">
<span className="badge badge-default">Per defecte</span>
<span className="badge badge-primary">Primari</span>
<span className="badge badge-success">Èxit</span>
<span className="badge badge-warning">Avís</span>
<span className="badge badge-danger">Perill</span>
<span className="badge badge-info">Informació</span>
</div>
<h4>Etiquetes de Poble</h4>
<div >
<span className="badge badge-outline"><svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Poble actiu</span>
<span className="badge badge-outline"><svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg> Fototeca</span>
<span className="badge badge-outline"><svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Arxiu</span>
<span className="badge badge-outline"><svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" x2="8" y1="2" y2="18"></line><line x1="16" x2="16" y1="6" y2="22"></line></svg> Mapa</span>
<span className="badge badge-outline"><svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="16" y2="12"></line><line x1="12" x2="12.01" y1="8" y2="8"></line></svg> Festes</span>
</div>
</section>
{/*  SECCIÓ 9: TAULES  */}
<section className="design-block">
<h3>9. Taules</h3>
<div className="sdp-taula">
<table>
<thead>
<tr>
<th>Poble</th>
<th>Província</th>
<th>Habitants</th>
<th>Estat</th>
<th>Accions</th>
</tr>
</thead>
<tbody>
<tr>
<td>Petrer</td>
<td>Alacant</td>
<td>34.000</td>
<td><span className="badge badge-success">Actiu</span></td>
<td><a className="table-action" href="#">Editar</a></td>
</tr>
<tr>
<td>Ontinyent</td>
<td>València</td>
<td>36.000</td>
<td><span className="badge badge-warning">Pendent</span></td>
<td><a className="table-action" href="#">Editar</a></td>
</tr>
<tr>
<td>Morella</td>
<td>Castelló</td>
<td>2.500</td>
<td><span className="badge badge-info">Revisió</span></td>
<td><a className="table-action" href="#">Editar</a></td>
</tr>
</tbody>
</table>
</div>
<h4>Taula Zebra (Alternada)</h4>
<div className="sdp-taula">
<table>
<thead>
<tr>
<th>Recurs</th>
<th>Tipus</th>
<th>Data</th>
</tr>
</thead>
<tbody>
<tr>
<td>Festa de la Mare de Déu</td>
<td>Esdeveniment</td>
<td>15/08/2024</td>
</tr>
<tr>
<td>Plaça Major</td>
<td>Lloc</td>
<td>—</td>
</tr>
<tr>
<td>Entrevista alcalde</td>
<td>Notícia</td>
<td>03/06/2024</td>
</tr>
</tbody>
</table>
</div>
</section>
{/*  SECCIÓ 10: NAVEGACIÓ  */}
<section className="design-block">
<h3>10. Navegació</h3>
<h4>Barra de Navegació</h4>
<div className="nav-bar">
<a className="active" href="#">Sóc de Poble</a>
<a href="#">Inici</a>
<a href="#">Pobles</a>
<a href="#">Arxiu</a>
</div>
<h4>Paginació</h4>
<div className="pagination">
<button className="page-btn" disabled="">← Anterior</button>
<button className="page-btn active">1</button>
<button className="page-btn">2</button>
<button className="page-btn">3</button>
<span>...</span>
<button className="page-btn">12</button>
<button className="page-btn">Següent →</button>
</div>
</section>
{/*  SECCIÓ 11: MODALS  */}
<section className="design-block">
<h3>11. Modals i Diàlegs</h3>
<div className="modal-preview">
<div className="modal-box">
<h4>Confirmar Eliminació</h4>
<p>Esteu segur que voleu eliminar aquest element? Aquesta acció no es pot desfer.</p>
<div className="modal-actions">
<button className="btn btn-outline-dark btn-sm">Cancel·lar</button>
<button className="btn btn-danger btn-sm">Eliminar</button>
</div>
</div>
</div>
</section>
{/*  SECCIÓ 12: CÀRREGA  */}
<section className="design-block">
<h3>12. Indicadors de Càrrega</h3>
<div className="spinner-group">
<div ><svg className="spinner spinner-sm" viewBox="0 0 20 20"><circle cx="12" cy="12" fill="none" r="10" stroke="currentColor" strokeWidth="3"></circle></svg>
Petit</div>
<div ><svg className="spinner spinner-md" viewBox="0 0 20 20"><circle cx="12" cy="12" fill="none" r="10" stroke="currentColor" strokeWidth="3"></circle></svg>
Normal</div>
<div ><svg className="spinner spinner-lg" viewBox="0 0 20 20"><circle cx="12" cy="12" fill="none" r="10" stroke="currentColor" strokeWidth="3"></circle></svg>
Gran</div>
</div>
<h4>Esquelet (Skeleton)</h4>
<div className="skeleton skeleton-title">{""}</div>
<div className="skeleton skeleton-text">{""}</div>
<div className="skeleton skeleton-text">{""}</div>
<div className="skeleton skeleton-text">{""}</div>
</section>
{/*  SECCIÓ 13: AVATARS  */}
<section className="design-block">
<h3>13. Avatars i Imatges</h3>
<div className="avatar-group">
<div className="avatar avatar-xs">AB</div>
<div className="avatar avatar-sm">AB</div>
<div className="avatar avatar-md">AB</div>
<div className="avatar avatar-lg">AB</div>
<div className="avatar avatar-xl">AB</div>
</div>
</section>
{/*  SECCIÓ 14: DESPLEGABLES I MENÚS FLOTANTS  */}
<section className="design-block">
<h3>14. Desplegables i Menús Flotants</h3>
<div >
  <h4>Acordions</h4>
  <Accordion>
    <AccordionItem title="Què és Sóc de Poble?" defaultOpen={false}>
      <p>Sóc de Poble és una iniciativa per a la preservació de la memòria i el patrimoni dels pobles valencians, utilitzant tecnologia descentralitzada i IA local.</p>
    </AccordionItem>
    <AccordionItem title="Com puc col·laborar?">
      <p>Pots col·laborar aportant fotografies antigues, entrevistant els teus majors, o ajudant a transcriure documents històrics.</p>
    </AccordionItem>
  </Accordion>
</div>
<div>
  <h4>Menús Flotants (Dropdowns)</h4>
  <p >Components usats per a menús contextuals, com les opcions d'una publicació o els ajustaments.</p>
  <div >
    <Dropdown 
      trigger={<button className="btn btn-outline-dark">Opcions de la Nota</button>}
    >
      <DropdownItem>Fer Pública</DropdownItem>
      <DropdownItem>Moure a Carpeta</DropdownItem>
      <DropdownItem className="sdp-text-error">Eliminar</DropdownItem>
    </Dropdown>
  </div>
</div>
</section>
{/*  SECCIÓ 15: PESTANYES  */}
<section className="design-block">
<h3>15. Pestanyes</h3>
<div className="tabs">
<div className="tab active">General</div>
<div className="tab">Fotografies</div>
<div className="tab">Història</div>
<div className="tab">Mapa</div>
</div>
<div className="tab-content">
<p >Contingut de la pestanya activa. Aquesta àrea canvia segons la selecció. Les pestanyes són accessibles via teclat (Tab + Enter/Espai).</p>
</div>
</section>
{/*  SECCIÓ 16: PROGRÉS  */}
<section className="design-block">
<h3>16. Barra de Progrés</h3>
<div className="progress-container">
<div className="progress-header"><span>Pujada d'imatges</span><span>45%</span></div>
<div className="progress-bar"><div className="progress-fill">{""}</div></div>
</div>
<div className="progress-container">
<div className="progress-header"><span>Indexació de documents</span><span>78%</span></div>
<div className="progress-bar"><div className="progress-fill">{""}</div></div>
</div>
</section>
{/*  SECCIÓ 17: TOOLTIPS  */}
<section className="design-block">
<h3>17. Tooltips</h3>
<div className="tooltip-preview">
<button className="btn btn-primary" title="Això és un tooltip d'exemple">Passa per damunt</button>
<span className="tooltip-term" title="Explicació addicional del terme">Terme amb ajuda</span>
</div>
</section>
{/*  SECCIÓ 18: LLISTES  */}
<section className="design-block">
<h3>18. Llistes</h3>
<div className="lists-preview">
<h4>Llista Ordenada</h4>
<ol>
<li>Registrar-se al portal</li>
<li>Seleccionar el poble</li>
<li>Pujar contingut històric</li>
<li>Revisar i publicar</li>
</ol>
<h4>Llista Desordenada</h4>
<ul>
<li>Fotografies antigues</li>
<li>Documents administratius</li>
<li>Entrevistes orals</li>
</ul>
</div>
</section>
{/*  SECCIÓ 19: DIVISORS  */}
<section className="design-block ">
<h3>19. Divisors i Separadors</h3>
<div className="divider-preview">
<div className="divider-label">19.1 Divisor horitzontal bàsic</div>
<div className="divider-basic">{""}</div>
</div>
<div className="divider-preview">
<div className="divider-label">19.2 Divisor amb text</div>
<div className="divider-text">O BÉ</div>
</div>
<div className="divider-preview">
<div className="divider-label">19.3 Separador de secció (major)</div>
<div className="divider-major">{""}</div>
</div>
<div className="divider-preview">
<div className="divider-label">19.4 Separador puntejat</div>
<div className="divider-dashed">{""}</div>
</div>
<div className="divider-preview">
<div className="divider-label">19.5 Separador de pàgina (salt visual)</div>
<div className="divider-dotted">{""}</div>
</div>
</section>
{/*  SECCIÓ 20: TARGETES MESTRES  */}
<section className="design-block ">
<h3 >20. Targeta Mestra (Sóc de Poble Universal Card)</h3>

<ComponentDoc
  title="Variants de la Targeta Mestra"
  description="L'ànima de la IAIA. Totes les publicacions hereten de la mateixa anatomia. El contenidor flexbox d'avall (.sdp-card-grid) mostra com s'adapten les targetes segons si tenen una insígnia lateral (badge) o no."
  technical="Utilitza la propietat `squareBadge` per introduir una insígnia a la dreta (data, preu, icona). Això afegeix la classe `.has-aside` al cos de la targeta i alinea automàticament el text a l'esquerra per contrapesar el bloc. Si no hi ha insígnia, el text es centra."
  transparent={true}
>
  <div className="sdp-card-grid">
    {/* 20.1: Base (sense aside) */}
    <UniversalCard
      title="Disseny Pedra Seca"
      subtitle="Sistema oficial de disseny per a Sóc de Poble"
      body="Inclou la Targeta Mestra, els colors oficials, i tots els elements preparats, inclús els skills i scripts, perquè qualsevol IA puga entendre este sistema i reproduir-lo."
      imageUrl="/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.png"
      imageAlt="Disseny Pedra Seca"
      labels={[
        { text: 'MUR', className: 'sdp-badge-system' },
        { text: 'Disseny UI', className: 'sdp-badge-category' }
      ]}
      author="Sóc de Poble"
      location="La Torre de les Maçanes"
      avatarUrl="/assets/system/ui/logo-socdepoble-cuadrat-verd.svg"
      time="10:00"
      date="07/08/22"
      copyright="© Sóc de Poble / Fet per la IAIA i Nano Banana"
      hasFooter={true}
      showTranslate={true}
      showComment={true}
      showShare={true}
      showConnect={true}
      mainHref="#disseny"
    />

    {/* 20.2: Mercat (amb preu) */}
    <UniversalCard
      title="Samarreta Sóc de Poble"
      subtitle="L'edició definitiva amb el logotip complet"
      body="Dibuix del mapa del tresor. Cotó Roly de màxima qualitat."
      squareBadge={{ type: 'price', value: '15 €' }}
      imageUrl="https://socdepoble.org/assets/uploads/brain/media__1776503825171.jpg"
      imageAlt="Samarreta"
      labels={[
        { text: 'Mercat', className: 'sdp-badge-system' },
        { text: '2 variants', className: 'sdp-badge-accent' },
        { text: 'roba', className: 'sdp-badge-category' },
        { text: 'samarreta', className: 'sdp-badge-tag' }
      ]}
      author="Sóc de Poble"
      location="La Torre de les Maçanes"
      avatarUrl="/assets/system/ui/logo-socdepoble-cuadrat-verd.svg"
      time="00:29"
      date="23/03/22"
      copyright="© Sóc de Poble / Fet per la IAIA i Nano Banana"
      hasFooter={true}
      showTranslate={true}
      showComment={true}
      showShare={true}
      showConnect={true}
    />

    {/* 20.3: Esdeveniment (amb data) */}
    {(() => {
      const eventItem = EVENTS.find(e => e.id === 'aplec-2023') || {};
      return <EventCard item={eventItem} />;
    })()}

    {/* Variant: Vehicle */}
    <UniversalCard
      title="Viatge a Alacant"
      subtitle="Compartir cotxe"
      body="Isc demà divendres a les 8:00h cap a l'estació de tren d'Alacant. Tinc 3 places lliures."
      squareBadge={{ type: 'custom', content: <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg> }}
      labels={[
        { text: 'Vehicle', className: 'sdp-badge-system' },
        { text: 'Alacant', className: 'sdp-badge-category' }
      ]}
      author="Maria"
      location="La Torre de les Maçanes"
      time="18:30"
      date="13/09/26"
      hasFooter={true}
      showTranslate={true}
      showComment={true}
      showShare={true}
      showConnect={true}
      connectLabel="Sol·licitar plaça"
    />

    {/* Variant: Animalets */}
    <UniversalCard
      title="Gos perdut"
      subtitle="Zona del Riu"
      body="Hem trobat un gosset xicotet prop del riu. Porta un collar roig però no té xapa. Si algú el coneix que avise."
      squareBadge={{ type: 'custom', content: <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16.5A3.5 3.5 0 0 1 8.5 13a3.5 3.5 0 0 1 7 0 3.5 3.5 0 0 1-3.5 3.5Z"/><path d="M6 10.5A2.5 2.5 0 0 1 3.5 8a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5Z"/><path d="M18 10.5A2.5 2.5 0 0 1 15.5 8a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5Z"/><path d="M9.5 5A2.5 2.5 0 0 1 7 2.5 2.5 2.5 0 0 1 12 2.5 2.5 2.5 0 0 1 9.5 5Z"/><path d="M14.5 5A2.5 2.5 0 0 1 12 2.5 2.5 2.5 0 0 1 17 2.5 2.5 2.5 0 0 1 14.5 5Z"/></svg> }}
      labels={[
        { text: 'Animalets', className: 'sdp-badge-system' },
        { text: 'Perdut', className: 'sdp-badge-accent' }
      ]}
      author="Paco"
      location="La Torre de les Maçanes"
      time="09:15"
      date="13/09/26"
      hasFooter={true}
      showTranslate={false}
      showComment={true}
      showShare={true}
      showConnect={true}
    />

    {/* Variant: Sense imatge i text */}
    <UniversalCard
      title="Hisenda"
      subtitle="Model 303 / 130"
      squareBadge={{ type: 'text', content: <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>Vist</span> }}
      labels={[
        { text: 'Gestoria', className: 'sdp-badge-system' },
        { text: 'Hisenda', className: 'sdp-badge-category' }
      ]}
      author="Mestre Poble"
      location="La Torre de les Maçanes"
      time="14:28"
      date="26/06/22"
      hasFooter={true}
      showTranslate={true}
      showComment={true}
      showShare={true}
      showConnect={true}
      connectLabel="Obrir"
    />
  </div>
</ComponentDoc>
</section>
{/*  SECCIÓ 21: ESTADÍSTIQUES I DASHBOARDS  */}
<section className="design-block">



<h3>21. Estadístiques i Dashboards</h3>
<h4>21.1 Targeta d'estadística</h4>
<div className="stat-card ">
<div className="stat-icon"><svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
<div className="stat-info">
<div className="stat-value">5.847</div>
<div className="stat-label">Habitants</div>
</div>
</div>
<h4>21.2 Grid d'estadístiques</h4>
<div className="stat-grid">
<div className="stat-card">
<div className="stat-icon"><svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><rect height="18" rx="2" ry="2" width="18" x="3" y="4"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg></div>
<div className="stat-info">
<div className="stat-value">776</div>
<div className="stat-label">Anys d'història</div>
</div>
</div>
<div className="stat-card">
<div className="stat-icon"><svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>
<div className="stat-info">
<div className="stat-value">2.341</div>
<div className="stat-label">Habitatges</div>
</div>
</div>
<div className="stat-card">
<div className="stat-icon">🌳</div>
<div className="stat-info">
<div className="stat-value">29,4</div>
<div className="stat-label">Km² de natura</div>
</div>
</div>
<div className="stat-card">
<div className="stat-icon">📖</div>
<div className="stat-info">
<div className="stat-value">142</div>
<div className="stat-label">Documents històrics</div>
</div>
</div>
</div>

</section>
{/*  SECCIÓ 22: CERCA I FILTRATGE  */}
<section className="design-block">
<h3>22. Cerca i Filtratge</h3>
<h4>22.1 Barra de cerca bàsica</h4>
<div className="search-bar-basic">
<input placeholder="Cerca pobles, festes, documents..." type="text"/>
<button>🔍 Cerca</button>
</div>
<h4>22.2 Cerca amb filtres</h4>
<div className="search-filters">
<input placeholder="Cerca..." type="text"/>
<select>
<option>Totes les categories</option>
<option>Festes</option>
<option>Llocs</option>
</select>
<button>Cerca</button>
</div>
<h4>22.3 Resultats de cerca</h4>
<div >S'han trobat <strong>12 resultats</strong> per a "festa major"</div>
<div className="search-result">
<div className="search-result-title">Festa Major de Benigànim</div>
<div className="search-result-meta">Festes • Benigànim • Agost 2024</div>
<div className="search-result-excerpt">Del 15 al 20 d'agost celebrem les festes patronals amb més de 50 activitats per a tots els públics...</div>
</div>
<div className="search-result">
<div className="search-result-title">Festa Major de Llutxent</div>
<div className="search-result-meta">Festes • Llutxent • Setembre 2024</div>
<div className="search-result-excerpt">La festa major de Llutxent destaca per la seua processó de les festes de la Mare de Déu...</div>
</div>
</section>
{/*  SECCIÓ 23: PAGINACIÓ  */}
<section className="design-block">
<h3>23. Paginació</h3>
<h4>23.1 Paginació numèrica</h4>
<div className="pagination">
<a className="page-btn" href="#">← Primera</a>
<a className="page-btn" href="#">2</a>
<a className="page-btn active" href="#">3</a>
<a className="page-btn" href="#">4</a>
<a className="page-btn" href="#">5</a>
<span>...</span>
<a className="page-btn" href="#">20</a>
<a className="page-btn" href="#">Següent →</a>
</div>
<h4>23.2 Paginació simplificada (anterior / següent)</h4>
<div className="pagination-simple">
<a href="#">
<span className="pagination-label">← Article Anterior</span>
<span className="pagination-title">Les festes de la Magdalena</span>
</a>
<a className="next" href="#">
<span className="pagination-label">Article Següent →</span>
<span className="pagination-title">La ruta del riu-rau</span>
</a>
</div>
</section>
{/*  SECCIÓ 24: TASQUES I CHECKLISTS  */}
<section className="design-block">
<h3>24. Llistes de Tasques i Checklists</h3>
<h4>24.1 Checklist d'administració</h4>
<div className="checklist-admin">
<div className="checklist-item">
<input defaultChecked type="checkbox"/>
<label><svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Verificació prèvia a publicar</label>
</div>
<div className="checklist-item">
<input defaultChecked type="checkbox"/>
<label>Revisar ortografia i valencià</label>
</div>
<div className="checklist-item">
<input defaultChecked type="checkbox"/>
<label>Comprovar imatges (alt text obligatori)</label>
</div>
<div className="checklist-item">
<input type="checkbox"/>
<label>Validar enllaços interns</label>
</div>
<div className="checklist-item">
<input type="checkbox"/>
<label>Revisar contrast de colors (WCAG 2.1 AA)</label>
</div>
</div>
<h4>24.2 Llista de tasques amb progrés</h4>
<div className="checklist-admin">
<div className="checklist-item">
<input defaultChecked type="checkbox"/>
<label>Migrar base de dades històrica</label>
<span className="date-tag done">15/01</span>
</div>
<div className="checklist-item">
<input type="checkbox"/>
<label>Digitalitzar fotografies del fons municipal</label>
<span className="date-tag">01/02</span>
</div>
</div>
</section>
{/*  SECCIÓ 25: UPLOAD I DESCÀRREGUES  */}
<section className="design-block">
<h3>25. Upload i Descàrregues</h3>
<h4>25.1 Zona d'arrossegament d'arxius</h4>
<div className="upload-zone">
<div className="upload-zone-text">📎 Arrossega els arxius ací</div>
<div className="upload-zone-sub">o <span>selecciona'ls del teu dispositiu</span></div>
<div >Màxim 10MB per arxiu. Formats: JPG, PNG, PDF</div>
</div>
<div className="file-item">
<div className="file-item-info">
<div className="file-item-name">festa_major_2024.jpg</div>
<div className="file-item-meta">2,4 MB</div>
</div>
<div className="file-item-action"><svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></div>
</div>
<h4>25.2 Enllaç de descàrrega</h4>
<div className="download-card">
<div className="download-card-icon"><svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
<div className="download-card-info">
<div className="download-card-title">Carta Pobla de Benigànim (1248)</div>
<div className="download-card-meta">PDF • 3,2 MB • Transcripció paleogràfica</div>
</div>
<a className="download-card-btn" href="#"><svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><line x1="12" x2="12" y1="5" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg></a>
</div>
</section>
{/*  SECCIÓ 26: EMBEDDINGS I MEDIA EXTERNA  */}
<section className="design-block">
<h3>26. Embeddings i Media Externa</h3>
<h4>26.1 Vídeo embebint (HTML5 natiu)</h4>
<div className="embed-container">
{React.createElement('iframe', {
  src: "https://www.youtube-nocookie.com/embed/Fadaa7Kyxm0?si=G_xGeA1VqR0cX_IP",
  title: "Sóc de Poble: Portal de pobles connectats",
  frameBorder: "0",
  allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
  referrerPolicy: "strict-origin-when-cross-origin",
  allowFullScreen: true,
  style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }
})}
</div>
<div className="embed-caption">Sóc de Poble: Portal de pobles connectats (2013)</div>
<details className="accordion ">
<summary className="accordion-header">
<svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Descripció del vídeo original
            <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 20 20" width="20"><polyline points="6 9 12 15 18 9"></polyline></svg>
</summary>
<div className="dsg-pre-wrap">
  <p>Un Projecte per col·laborar en el desenvolupament sostenible i tecnològic en entorns rurals.</p>
  <p>Sóc del Poble serà un PORTAL DE POBLES CONNECTATS on compartir informació, experiències i idees que faciliten el desenvolupament sostenible i tecnològic en entorns rurals, per posar en valor els recursos locals, que són l'essència de la nostra identitat, i mostrar l'atractiu dels pobles com a llocs on viure i treballar.</p>
  <p>Serà un canal orientat a la difusió dels beneficis que les Noves Tecnologies poden aportar al món rural, utilitzant ferramentes col·laboratives:</p>
  <p>
    1. BASE DE DADES OBERTES. MAPA DIRECTORI DE RECURSOS LOCALS.<br/>
    2. CERCADOR TEMÀTIC.<br/>
    3. XARXA SOCIAL DE PRODUCTIVITAT.<br/>
    4. REVISTA DIGITAL.<br/>
    5. VIVERS TIC DE POBLE. Vivers Virtuals d'Emprenedors Rurals.
  </p>
  <p>★ Actualment comptem al Facebook amb més de 200.000 seguidors que se senten identificats amb el concepte de "Ser de Poble". Aquesta xarxa ens permet interactuar amb milers de persones amb les que compartim la nostra percepció del món rural.</p>
  <hr className="" />
  <h4>GUIÓ DEL VÍDEO</h4>
  <p>
    Pepet toca el clarinet...<br/>
    Viu tranquil i be en un poble menut<br/>
    A l'escola de música del seu poblet aprèn... I ho fa be, si...<br/>
    Vol aprendre més, però ha d'anar a la ciutat... I puja i baixa i va i torna...<br/>
    I fa música i vol que tothom escolte el so del seu clarinet...<br/>
    Però és tot tan difícil al seu poblet!!!<br/>
    Com faré? Es pregunta Pepet.
  </p>
  <p>
    A l'altra banda de les muntanyes viu la Rosa,<br/>
    Ha decidit viure en el camp, té una granja i és apicultora...<br/>
    Les ovelles, les abelles... i els pots de mel, de la bona, de la millor qualitat...<br/>
    Però ha de baixar a la ciutat a vendre la seva mel i obrir-se camí entre marques, mercats, xarxes de distribució...<br/>
    I li ve tot difícil, complex, costerut...
  </p>
  <p>
    Hi ha qualitat de vida a aquells pobles... Es viu tranquil, i es poden fer coses interessants, saludables, arrelades, autèntiques...<br/>
    Però hi ha massa preguntes sense contestar... Massa dificultats... Gent que fa coses als pobles, que necessita oportunitats...<br/>
    Sóc de Poble vol ser pont, xarxa oberta que connecte pobles, persones, empreses, col·lectius, fer fàcil el que sembla difícil entre muntanyes i complexitats tecnològiques...<br/>
    Pep i Rosa ja s'han sumat i formen part de la gentada que vol viure als pobles i contribuir a mantenir-los vius, actius...<br/>
    Gent que té idees i vol fer-les realitat en llocs amb qualitat de vida, amb respecte per les arrels, la natura, la gent...<br/>
    Sóc de poble... i tinc veu...<br/>
    I tu?, et sumes?
  </p>
</div>
</details>
<h4>26.2 Mapa embebint (iframe amb fallback)</h4>
<div>
  <div>
  {React.createElement('iframe', {
    width: "100%",
    height: "450",
    style: { border: 0 },
    loading: "lazy",
    allowFullScreen: true,
    src: "https://www.google.com/maps/embed/v1/place?key=FAKE_KEY&q=La+Torre+de+les+Macanes"
  })}
</div>
</div>
<div className="embed-caption"><a href="#">Veure mapa més gran a OpenStreetMap →</a></div>
<h4>26.3 Audio (podcast local)</h4>
<div className="audio-player">
<button className="audio-play-btn"><svg viewBox="0 0 20 20"><path d="M8 5v14l11-7z"></path></svg></button>
<div className="audio-progress">
<div className="audio-progress-fill">{""}</div>
</div>
<div className="audio-time">12:45</div>
</div>
<div className="embed-caption ">Podcast «Històries de poble» · Episodi 1</div>
</section>
{/*  SECCIÓ 27: CLASSES UTILITÀRIES  */}
<section className="design-block">
<h3>27. Classes Utilitàries</h3>
<p >Aquestes classes són recomanacions d'arquitectura css (no aplicades ací via Tailwind pur sinó com a concepte)</p>
<div className="utils-grid">
<div className="utils-box">
<h4>Classes de Visibilitat</h4>
<ul className="utils-list">
<li><strong>.sdp-sr-only</strong> - Ocult visiblement, text per a screen readers</li>
<li><strong>.sdp-visible-sr-only</strong> - Visible només per assistència</li>
<li><strong>.sdp-ocult</strong> - display: none</li>
<li><strong>.sdp-ocult-mobil</strong> - Amaga en xs/sm</li>
</ul>
</div>
<div className="utils-box">
<h4>Classes de Color</h4>
<ul className="utils-list">
<li><strong>.sdp-text-exit</strong> - ✓ Èxit</li>
<li><strong>.sdp-text-error</strong> - ✕ Error</li>
<li><strong>.sdp-text-avis</strong> - <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="icona-linia" viewBox="0 0 20 20" width="16"><path d="M10.25 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg> Avís</li>
<li><strong>.sdp-text-info</strong> - i Informació</li>
</ul>
</div>
</div>
</section>
{/*  SECCIÓ 28: PEUS DE PÀGINA  */}
<section className="design-block">
<h3>28. Peus de pàgina (Footers)</h3>
<h4>28.1 Peu de pàgina complet</h4>
<div >[Footer complet (Enllaços, Legal, Xarxes)]</div>
<h4>28.2 Peu de pàgina minimalista</h4>
<div >© 2026 Sóc de Poble. Tots els drets reservats.</div>
</section>
{/* SECCIÓ 29: EXEMPLES DE COMPOSICIÓ */}
<section className="design-block ">
<h3>29. Exemples de Composició</h3>
<h4>29.1 Formulari de contacte complet</h4>
<div className="card dsg-center-600">
<h4 >Contacta amb nosaltres</h4>
<p >Envieu-nos les vostres dubtes o suggeriments per a millorar el portal.</p>
<div className="form-group">
<label>Correu electrònic</label>
<input placeholder="elteu@email.com" type="email" />
</div>
<div className="form-group ">
<label>El teu missatge</label>
<textarea placeholder="Com ens pots ajudar?" rows="4"></textarea>
</div>
<div className="login-form">
  <button className="pill pill--primary login-action">Enviar missatge</button>
</div>
</div>
</section>

{/* SECCIÓ 30: XAT I MISSATGERIA */}
<section className="design-block ">
<ComponentDoc
  title="30. Elements de Xat i Missatgeria"
  description="Components estructurals dissenyats específicament per a la Fase Final (Consell i Interacció Humà-Màquina)."
  technical="Les bambolles mantenen un contrast correcte (WCAG AA) depenent del seu origen (usuari vs IA/Sistema). El camp d'entrada inclou adaptabilitat d'alçada per a missatges multilínea."
>
  <h4>Bambolles de Xat (Chat Bubbles)</h4>
  <div className="chat-container">
    
    {/* Missatge del Sistema / IA */}
    <div className="dsg-msg-container">
      <div className="avatar avatar-sm chat-avatar-ia">IA</div>
      <div className="sdp-chat-bubble sdp-chat-bubble--ai">
        <p >Bona vesprada, Mestre. El sistema Pedra Seca està 100% operatiu i les constants vitals són estables.</p>
        <span className="sdp-chat-bubble-meta">17:34</span>
      </div>
    </div>

    {/* Missatge de l'Usuari */}
    <div className="dsg-msg-container dsg-msg-self">
      <div className="avatar avatar-sm chat-avatar-jl">JL</div>
      <div className="sdp-chat-bubble sdp-chat-bubble--user">
        <p >Perfecte, comencem amb la sessió de hui.</p>
        <span className="sdp-chat-bubble-meta">17:36</span>
      </div>
    </div>

  </div>

  <h4>Input de Missatgeria (Message Composer)</h4>
  <div className="chat-input-wrapper">
    <div className="dsg-flex-1">
      <textarea 
        className="chat-input-textarea form-control" 
        placeholder="Escriu un missatge..." 
        rows="1" 
      ></textarea>
    </div>
    <button className="btn btn-primary btn-sm dsg-btn-round" title="Enviar">
      <svg viewBox="0 0 20 20" className="dsg-icon-1em"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"></path></svg>
    </button>
  </div>
</ComponentDoc>
</section>

{/* SECCIÓ 31: ARQUITECTURA UNIVERSAL I GESTORS */}
<section className="design-block">
<ComponentDoc
  title="31. Arquitectura Universal: Top Bar + Sidebar + Contingut"
  description="Patró canònic per a pàgines d'aplicació, gestors i editors de tres columnes."
  technical="UniversalPage governa el chrome i el contingut; UniversalManager compon facetes, llista i detall; AppGridShell governa responsive, scroll, plegat i amplàries. Cap consumidor ha de clonar estes responsabilitats."
>
  <div className="card">
    <h4>Contracte estructural</h4>
    <ol className="dsg-pl-1">
      <li><strong>Top Bar fixa:</strong> navegació i accions globals pertanyen a <code>UniversalPage</code>.</li>
      <li><strong>Sidebar / Carpetes:</strong> facetes jeràrquiques; els grups s'obrin cap avall i la columna es replega cap a l'esquerra.</li>
      <li><strong>Llista / Notes:</strong> cerca i creació en una barra secundària subtil; en replegar queda només la lupa.</li>
      <li><strong>Contingut:</strong> detall o editor flexible, sempre amb <code>min-width: 0</code> i scroll propi.</li>
      <li><strong>Separadors:</strong> arrossegables amb punter i tacte, operables amb fletxes, <kbd>Home</kbd> i <kbd>End</kbd>.</li>
    </ol>
  </div>
  <div className="card">
    <h4>Estats responsive obligatoris</h4>
    <dl>
      <dt><strong>Ample (≥ 1090 px)</strong></dt>
      <dd>Tres columnes simultànies, plegables i redimensionables.</dd>
      <dt><strong>Mitjà (720–1089 px)</strong></dt>
      <dd>Llista + contingut; Carpetes apareix com a panell superposat.</dd>
      <dt><strong>Estret (&lt; 720 px)</strong></dt>
      <dd>Un panell visible cada vegada; els panells fora de pantalla són <code>inert</code>.</dd>
    </dl>
  </div>
  <div className="card">
    <h4>API mínima de la graella</h4>
    <pre><code>{`<AppGridShell
  leftColumn={<Facetes />}
  middleColumn={<Llista />}
  rightColumn={<Detall />}
/>`}</code></pre>
  </div>
</ComponentDoc>
</section>

{/*  SECCIÓ 23: LÒGICA DEL MOTOR DE POBLES  */}
<section className="design-block">
<h3 >23. Lògica del Motor de Pobles</h3>
<ComponentDoc
  title="Ordenació Dinàmica (Rank per Activitat)"
  description="La pàgina de Pobles no té publicadors oficials. El seu funcionament es basa en l'activitat orgànica dels usuaris de cada poble en la resta de l'aplicació (Mur, Mercat, Esdeveniments)."
  technical="El context de dades (AppDataContext) escaneja totes les publicacions i detecta quina és la més recent de cada poble. La targeta del poble ('Gent de...') s'ordena de més recent a més antiga. Per això, si l'última publicació del sistema l'ha feta algú de La Torre de les Maçanes, la targeta de 'Gent de La Torre' pujarà a la primera posició automàticament."
>
  <div className="card ">
    <h4 >Com funciona el rànquing?</h4>
    <ol  className="dsg-pl-1">
      <li ><strong>Dades en temps real:</strong> L'aplicació agrupa l'activitat per poble.</li>
      <li ><strong>La Targeta de Poble:</strong> Adopta dinàmicament el nom de l'autor (`Gent de La Torre`, `Gent d'Alcoleja`...) gestionant apòstrofs automàticament si comença per vocal.</li>
      <li><strong>Posicionament:</strong> El poble que té l'última interacció de la comunitat es corona com el primer de la llista.</li>
    </ol>
  </div>
</ComponentDoc>
</section>


      <ComponentDoc
        title="25. Avisador Efímer (Toasts)"
        description="Notificacions lleugeres sense interrompre"
      >
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => showToast('Canvis guardats correctament', 'success')}>Toast d'èxit</button>
          <button className="btn btn-danger" onClick={() => showToast('Error en desar les dades', 'error')}>Toast d'error</button>
          <button className="btn btn-base" onClick={() => showToast('Tens un missatge nou', 'info')}>Toast info</button>
        </div>
      </ComponentDoc>

      {/*  SECCIÓ 26: PÀGINES DE SISTEMA  */}
      <section className="design-block">
        <h3 >26. Pàgines de Sistema vs. Pàgines de Contingut</h3>
        
        <ComponentDoc
          title="Lògica d'Etiquetatge (Labels)"
          description="Normativa sobre quan i per què utilitzar etiquetes de categoria en una UniversalPage."
          technical="Les Pàgines de Sistema (com el Panell de Control, Dispositius, Disseny, etc.) NO porten cap categoria ni etiqueta a la capçalera de la pàgina."
        >
          <div className="card ">
            <h4 >Regla de les Categories</h4>
            <p>
              Una pàgina només pot tenir etiquetes/categories si la seua naturalesa és ser una <strong>Targeta Publicable</strong> (una <em>card</em>) dins d'un <em>feed</em> (Mur, Mercat, Esdeveniments, Notes, etc.).
            </p>
            <ol  className="dsg-pl-1">
              <li ><strong>Pàgines de Contingut:</strong> Corresponen a una <em>card</em>. Aquestes <strong>SÍ</strong> que necessiten la seua categoria o etiqueta identificativa a dalt per mantenir la correspondència amb la targeta d'origen.</li>
              <li><strong>Pàgines de Sistema:</strong> No són publicacions ni es presenten com a <em>cards</em> en cap secció. Per tant, <strong>NO</strong> necessiten ni han de dur categories inventades com "Sistema", "Admin", o "Local". Són rutes estructurals pures i la seua capçalera ha de ser neta.</li>
            </ol>
          </div>
        </ComponentDoc>

        <ComponentDoc
          title="Catàleg de Pàgines i Motors Lògics"
          description="Descripció del funcionament intern de cadascuna de les pàgines de sistema, perquè les IAs no es confonguen."
        >
          <div className="card">
            <h4 >Panell de Control</h4>
            <p><strong>Tipus:</strong> Sistema (Sense Labels)</p>
            <p ><strong>Tipus:</strong> Sistema (Sense Labels)</p>
            <p >És el <em>Hub</em> o quadre de comandament central. No té cap feed ni <em>cards</em>. Servix exclusivament com a enrutador per a oferir accessos ràpids a la publicació i altres eines d'administració de l'ecosistema. A més, fa servir una <em>entradilla</em> (propietat `lead`) com a subtítol per mantenir la neteja visual i prescindir de títols amb estils <em>inline</em>.</p>
          </div>
          
          <div className="card">
            <h4 >Dispositius (Descoberta en viu)</h4>
            <p ><strong>Tipus:</strong> Sistema (Sense Labels)</p>
            <p >És el motor d'aparellament de la plataforma. La seua lògica s'encarrega d'escanejar la xarxa local, negociar les connexions WebRTC o per relé (Relay) i anunciar la presència del node local. No és una publicació, sinó la font de connectivitat estructural per al P2P offline-first.</p>
          </div>

          <div className="card">
            <h4 >Cens de Població</h4>
            <p ><strong>Tipus:</strong> Sistema (Sense Labels)</p>
            <p >Un simple llistat estàtic de caràcter informatiu. Ordena la llista de pobles de forma purament descendent pel seu volum demogràfic (nombre d'habitants) i permet l'accés directe al perfil de cada localitat. Tampoc requereix etiquetes.</p>
          </div>

          <div className="card ">
            <h4 >Bloc de Notes (Editor Universal)</h4>
            <p ><strong>Tipus:</strong> Sistema (Sense Labels, Disseny Imbricat)</p>
            <p >És la sala de redacció (<em>Composer</em>). Fa servir el motor TipTap per a l'edició de text ric. Tota la seua complexitat visual rau en simular amb exactitud com quedarà la publicació. Per aconseguir-ho, incrusta una targeta <strong>UniversalPage</strong> dins del propi editor, amb les següents excepcions estrictes:</p>
            <ul  className="dsg-pl-1">
              <li ><strong>Sense Barra Blava:</strong> La navegació superior de la `UniversalPage` interior s'obvia.</li>
              <li ><strong>Ordre dels elements:</strong> La primera cosa visual sempre és la imatge de capçalera (<em>Hero Image</em>).</li>
              <li ><strong>Barra de Publicador (Taronja):</strong> Se situa sota la imatge. Mostra el botó d'hora estàndard. Hi haurà un botó de 'pinejar' que obrirà un desplegable per a triar icones (pinejar, candau, i altres), funcionalitat que s'ampliarà en el futur.</li>
              <li ><strong>Capçalera i Logotips:</strong> En aquest exemple de «Bloc de Notes» <strong>sí que apareix el logotip de 'Sóc de Poble'</strong>, ja que representa una nota propietat de Sóc de Poble. L'ocultació del logotip en favor de l'acció d'inserir multimèdia només s'aplica en la vista de redacció d'una <em>nova nota</em> buida.</li>
            </ul>
          </div>
        </ComponentDoc>

      </section>
    </>
  );
}

```

## FITXER: src/sections/mur/MurSection.jsx
```jsx
import React, { useMemo, useState } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { UniversalCard, ContentProvider } from '../../components/universal/UniversalElements';
import { EventCard } from '../../components/universal/EventCard';
import { useSEO } from '../../hooks/useSEO';
import { resolveAsset } from '../../config/assetResolver';
import { getSectionItemPath } from '../../config/navigation';
import { buildMapEmbedUrl } from './mapConfig';
import { useMur } from './MurContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { PillToggle } from '../../components/ui/PillToggle.jsx';

export default function MurSection() {
  const { sortedEvents, sortedFeedPosts, sortedMarketItems } = useMur();
  const { sortedTowns, pageCopy } = useCoreContent();
  const { t } = useUIActions();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateFilter = searchParams.get('date');
  const categoryFilter = searchParams.get('category');

  const [filterType, setFilterType] = useState('all');
  const [isMapOpen, setIsMapOpen] = useState(false);

  useSEO({
    title: t('section.mur.kicker', 'Mur'),
    description: t('section.mur.subtitle', 'Llig el mur públic amb les darreres publicacions del poble.')
  });

  const systemPages = [
    { key: 'disseny', isAvis: true, href: '/disseny' },
    { key: 'projecte', isAvis: false, href: '/projecte' },
    { key: 'constitucio', isAvis: false, href: '/constitucio' },
    { key: 'skills', isAvis: false, href: '/skills' },
    { key: 'anima', isAvis: false, href: '/ia' },
    { key: 'roadmap', isAvis: false, href: '/roadmap' },
    { key: 'notes', isAvis: false, href: '/jo/notes' },
    { key: 'versions', isAvis: false, href: '/versions' },
    { key: 'legal', isAvis: false, href: '/legal' }
  ].map(item => {
    const data = pageCopy[item.key];
    if (!data) return null;
    return {
      ...data,
      id: item.key,
      isSystem: true,
      isAvis: item.isAvis,
      mainHref: item.href,
      type: 'sistema'
    };
  }).filter(Boolean);

  const allItems = useMemo(() => {
    const combined = [
      ...(sortedEvents || []),
      ...(sortedFeedPosts || []),
      ...(sortedMarketItems || []),
      ...systemPages
    ].filter(Boolean);

    return combined.sort((a, b) => {
      const dateA = new Date(a.date || a.publish_date || a.created_at || "2026-08-21T00:00:00.000Z");
      const dateB = new Date(b.date || b.publish_date || b.created_at || "2026-08-21T00:00:00.000Z");
      return dateB - dateA;
    });
  }, [sortedEvents, sortedFeedPosts, sortedMarketItems, sortedTowns, pageCopy, systemPages]);

  const displayedItems = useMemo(() => {
    let items = allItems;
    if (filterType === 'events') items = items.filter(i => i.type === 'event');
    if (filterType === 'sistema') items = items.filter(i => i.type === 'sistema');

    if (dateFilter) {
      items = items.filter(i => {
        const rawDate = i.date || i.publish_date || i.created_at;
        if (!rawDate) return false;
        return rawDate.startsWith ? rawDate.startsWith(dateFilter) : String(rawDate).startsWith(dateFilter);
      });
    }
    
    if (categoryFilter) {
      items = items.filter(i => {
        const labels = i.labels || [{ text: i.isSystem ? 'Sistema' : (i.type || 'Publicació') }];
        return labels.some(l => l.text.toLowerCase() === categoryFilter.toLowerCase());
      });
    }

    return items;
  }, [allItems, filterType, dateFilter, categoryFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const formatTime = (timeStr, dateStr) => {
    if (timeStr) return timeStr;
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const config = {
    title: t('section.mur.kicker', 'Mur'),
    subtitle: t('section.mur.title', 'Publicacions recents'),
    lead: t('section.mur.subtitle', 'Llig el mur públic amb les darreres publicacions del poble.'),
    chrome: "system",
    showLogos: true
  };

  return (
    <ContentProvider initialConfig={config}>
      <UniversalPage>
        <div className="content-wrapper">
          <section aria-label="Filtres del mur" className="sdp-camp">
            <PillToggle
              etiqueta="Filtres del mur"
              valor={isMapOpen ? 'mapa' : filterType}
              onCanvi={(v) => {
                if (v === 'mapa') { setIsMapOpen((obert) => !obert); return; }
                setFilterType(v);
                setIsMapOpen(false);
              }}
              opcions={[
                { valor: 'all', text: 'Mostrar Tot' },
                { valor: 'events', text: 'Esdeveniments' },
                { valor: 'system', text: 'Sistema' },
                { valor: 'mapa', text: '🗺️ Mapa' },
              ]}
            />
          </section>

          {isMapOpen && (
            <div className="sdp-camp">
              <iframe
                title="Mapa del territori"
                src={buildMapEmbedUrl()}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="embed-container"
              />
            </div>
          )}

          <div className="sdp-card-grid">
            {displayedItems.map((item) => {
              const rawDate = item.date || item.publish_date || item.created_at || "2026-08-21T00:00:00.000Z";
              
              if (item.type === 'event') {
                return <EventCard key={`${item.type}-${item.id}`} item={item} />;
              }
              
              return (
                <UniversalCard
                  key={`${item.type}-${item.id}`}
                  title={item.title || item.name}
                  subtitle={item.subtitle}
                  body={item.lead || <p className="sp-card-text">{item.description}</p>}
                  imageUrl={resolveAsset(item.image_url || item.image || item.images?.[0] || item.imageSrc || '')}
                  imageAlt={item.imageAlt || item.title || ''}
                  author={item.author_name || item.seller || "Sóc de Poble"}
                  authorHref={item.isSystem ? "/pobles" : undefined}
                  avatarUrl={resolveAsset(item.author_avatar || item.avatar_url || '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg')}
                  location={item.author_location || item.population || "La Torre de les Maçanes"}
                  date={formatDate(rawDate)}
                  time={formatTime(item.time, rawDate)}
                  copyright="© Sóc de Poble / Fet per la IAIA i Nano Banana"
                  calendarBadge={null}
                  price={item.price}
                  labels={item.labels || [
                    { 
                      text: item.isSystem ? 'Sistema' : ((item.type === 'market' || item.type === 'product') ? 'Mercat' : (item.type || 'Publicació')), 
                      className: (item.isSystem || item.type === 'market' || item.type === 'product') ? 'sdp-badge-system' : 'sdp-badge-category' 
                    },
                    (item.type === 'market' || item.type === 'product') && item.variations?.length ? { text: `${item.variations.length} ${t('section.mercat.variations', 'variants')}`, className: 'sdp-badge-accent' } : null,
                    (item.type === 'market' || item.type === 'product') && item.category_slug ? { text: item.category_slug, className: 'sdp-badge-category' } : null,
                    (item.type === 'market' || item.type === 'product') && item.tag ? { text: item.tag, className: 'sdp-badge-tag' } : null
                  ].filter(Boolean)}
                  mainHref={item.mainHref || getSectionItemPath(item.type === 'event' ? 'events' : ((item.type === 'market' || item.type === 'product') ? 'mercat' : (item.type === 'poble' ? 'pobles' : 'mur')), item.id)}
                  showPin={item.isAvis}
                  hasFooter={true}
                  showTranslate={true}
                  showComment={true}
                  showShare={true}
                  showConnect={true}
                />
              );
            })}
          </div>
        </div>
      </UniversalPage>
    </ContentProvider>
  );
}

```

## FITXER: src/css/index.css
```css
/* ═══════════════════════════════════════════════════════════════════
   PEDRA SECA · ORQUESTRADOR — v3.0 (refactor 260912)
   Sóc de Poble · CSS natiu, sense frameworks.

   Este fitxer NO conté cap regla. Només declara l'ordre de la cascada
   i cus els mòduls. Si algú hi afig un selector, ha triat malament el
   fitxer: que el pose al mòdul que toca.

   ─────────────────────────────────────────────────────────────────
   PER QUÈ LA SENTÈNCIA @layer VA DAVANT DELS @import

   L'ordre de les capes el fixa la PRIMERA aparició de cada nom. Un
   @import insereix el fitxer importat en eixe punt exacte, amb les
   seues capes incloses. Al monòlit anterior, components.css
   s'importava a la línia 2 i la sentència @layer estava a la 39: el
   navegador calculava, doncs,

       components, reset, sdp, legacy, utilities

   és a dir, la capa canònica de components perdia contra les 3.444
   línies de `legacy` — exactament al revés del que promet el capçal
   de components.css. Cap porta ho detectava: les portes compten
   cadenes de text, no resolen la cascada.

   La sentència @layer és l'única regla que pot precedir un @import
   (CSS Cascade 5 §4.2), així que ara l'ordre és explícit i no depén
   de cap accident d'importació.

   ORDRE REAL (de menys a més força):
     reset      · normalització
     sdp        · elements nus amb :where() — especificitat 0
     legacy     · tot el deute (base + layout + legat). NOMÉS POT ENCONGIR.
     components · components canònics (Boto, Píndola, Fitxa de gestor…)
     utilities  · classes d'una sola declaració. L'última paraula.

   NOTA DELIBERADA: base.css, layout.css i legat.css escriuen dins de
   `legacy`, no dins de capes pròpies. La partició d'este refactor és
   de RESPONSABILITAT (quin fitxer obri el Mestre), no de CASCADA.
   Repartir 722 regles entre capes noves canviaria qui guanya a qui en
   llocs que no es poden verificar amb un diff, i això és una segona
   feina, per fases i amb captures. Avui: mateixa cascada, quatre
   fitxers manejables i la capa `components` al lloc que li pertoca.
   ═══════════════════════════════════════════════════════════════════ */

@layer reset, sdp, legacy, components, utilities;

/* 0 · Tokens generats (canon taronja i blau) + tokens del sistema.
       Sense capa: són custom properties, no disputen cap cascada. */
@import url('./design-tokens.css');
@import url('./tokens.css');

/* 1 · Fonament */
@import url('./base.css');       /* @layer reset + @layer legacy */
@import url('./sdp.css');        /* @layer sdp                   */

/* 2 · Estructura */
@import url('./layout.css');     /* @layer legacy                */

/* 3 · Deute */
@import url('./legat.css');      /* @layer legacy                */

/* 4 · Components canònics */
@import url('./components.css'); /* @layer components            */
@import url('./modules.css');    /* @layer components            */

/* 5 · Utilitats */
@import url('./utilities.css');  /* @layer utilities             */

```

## FITXER: src/css/components.css
```css
/* ═══════════════════════════════════════════════════════════════════
   COMPONENTS CANÒNICS · PEDRA SECA (260911 · Seient 5)
   Full de src/components/ui/{formulari,Boto,Insignia,Alerta,Dialeg,
   Pestanyes,navegacio,estats,Pista}.jsx. Catàleg: /disseny?pagina=…
   · Només tokens semàntics: el tema fosc funciona sense cap regla extra.
   · Capa `components`: declarada a index.css DAVANT dels @import.
   · Boto gran: var(--sdp-alt-accio) = 58px (abans 56px en brut).
   · Llei de Vida: tot control ≥ var(--sdp-touch-min).
   ═══════════════════════════════════════════════════════════════════ */
@layer components {

  .sdp-nomes-lector {
    position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
    overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }

  /* ── BOTÓ ─────────────────────────────────────────────────────────── */
  .sdp-boto {
    display: inline-flex; align-items: center; justify-content: center; gap: var(--sdp-space-2);
    min-height: var(--sdp-touch-min); padding: 0 var(--sdp-space-5);
    border: 2px solid transparent; border-radius: var(--sdp-radi-pastilla);
    font: inherit; font-size: var(--sdp-text-small); font-weight: 700; line-height: 1.2;
    text-decoration: none; cursor: pointer; transition: background var(--sdp-t), border-color var(--sdp-t);
  }
  .sdp-boto:focus-visible { outline: 3px solid var(--sdp-focus); outline-offset: 2px; }
  .sdp-boto:disabled { cursor: not-allowed; opacity: 0.55; }
  .sdp-boto--primari { background: var(--sdp-accio); color: var(--sdp-sobre-accio); }
  .sdp-boto--primari:hover:not(:disabled) { background: var(--sdp-accio-hover); }
  .sdp-boto--accent { background: var(--sdp-accent); color: var(--sdp-sobre-accent); }
  .sdp-boto--accent:hover:not(:disabled) { background: var(--sdp-accent-hover); }
  .sdp-boto--secundari { background: var(--sdp-fons-targeta); color: var(--sdp-text-titol); border-color: var(--sdp-vora-control); }
  .sdp-boto--secundari:hover:not(:disabled) { background: var(--sdp-fons-subtil); }
  .sdp-boto--perill { background: var(--sdp-error); color: var(--sdp-sobre-color); }
  .sdp-boto--perill:hover:not(:disabled) { background: var(--sdp-error-text); }
  .sdp-boto--fantasma { background: transparent; color: var(--sdp-accio-text); }
  .sdp-boto--fantasma:hover:not(:disabled) { background: var(--sdp-fons-subtil); }
  .sdp-boto--gran { min-height: var(--sdp-alt-accio); padding: 0 var(--sdp-space-8); font-size: var(--sdp-text-base); }
  .sdp-boto--ple { width: 100%; }
  .sdp-boto__gir, .sdp-carregant__gir { animation: sdp-gir 0.9s linear infinite; }
  @keyframes sdp-gir { to { rotate: 360deg; } }

  /* ── INSÍGNIA D'ESTAT ─────────────────────────────────────────────── */
  .sdp-insignia {
    display: inline-flex; align-items: center; gap: var(--sdp-space-1);
    padding: 2px var(--sdp-space-3); border-radius: var(--sdp-radi-pastilla);
    font-size: var(--sdp-text-meta); font-weight: 700; line-height: 1.5; border: 1px solid currentColor;
  }
  .sdp-insignia--neutre { background: var(--sdp-fons-subtil); color: var(--sdp-text-cos); }
  .sdp-insignia--info  { background: var(--sdp-info-fons);  color: var(--sdp-info-text); }
  .sdp-insignia--exit  { background: var(--sdp-exit-fons);  color: var(--sdp-exit-text); }
  .sdp-insignia--avis  { background: var(--sdp-avis-fons);  color: var(--sdp-avis-text); }
  .sdp-insignia--error { background: var(--sdp-error-fons); color: var(--sdp-error-text); }

  /* ── ALERTA EN LÍNIA (estén el canon sdp-alerta--* de @layer sdp) ── */
  .sdp-alerta {
    display: flex; align-items: flex-start; gap: var(--sdp-space-3);
    padding: var(--sdp-space-4); margin-block: var(--sdp-space-3);
    border: 1px solid currentColor; border-inline-start-width: 6px; border-radius: var(--sdp-radi-s);
  }
  .sdp-alerta--info  { background: var(--sdp-info-fons);  color: var(--sdp-info-text); }
  .sdp-alerta--exit, .sdp-alerta--ok { background: var(--sdp-exit-fons); color: var(--sdp-exit-text); }
  .sdp-alerta--avis  { background: var(--sdp-avis-fons);  color: var(--sdp-avis-text); }
  .sdp-alerta--error { background: var(--sdp-error-fons); color: var(--sdp-error-text); }
  .sdp-alerta__icona { flex: none; margin-top: 2px; }
  .sdp-alerta__cos { flex: 1; min-width: 0; }
  .sdp-alerta__titol { margin: 0 0 var(--sdp-space-1); font-weight: 800; }
  .sdp-alerta__text > :last-child { margin-bottom: 0; }
  .sdp-alerta__accions { display: flex; flex-wrap: wrap; gap: var(--sdp-space-2); margin-top: var(--sdp-space-3); }
  .sdp-alerta__tanca {
    flex: none; display: inline-flex; align-items: center; justify-content: center;
    width: var(--sdp-touch-min); height: var(--sdp-touch-min); margin: calc(var(--sdp-space-3) * -1);
    border: 0; border-radius: var(--sdp-radi-pastilla); background: transparent; color: inherit; cursor: pointer;
  }
  .sdp-alerta__tanca:focus-visible { outline: 3px solid var(--sdp-focus); }

  /* ── FORMULARIS ───────────────────────────────────────────────────── */
  .sdp-camp { display: flex; flex-direction: column; gap: var(--sdp-space-2); margin-bottom: var(--sdp-space-5); }
  .sdp-camp__etiqueta, .sdp-grup__llegenda { font-weight: 700; color: var(--sdp-text-titol); font-size: var(--sdp-text-small); }
  .sdp-camp__obligatori { font-weight: 400; color: var(--sdp-text-suau); }
  .sdp-camp__ajuda { color: var(--sdp-text-suau); font-size: var(--sdp-text-meta); }
  .sdp-camp__error {
    margin-top: var(--sdp-space-2);
    color: var(--sdp-error-text); font-weight: 700; font-size: var(--sdp-text-meta);
  }
  /* .sdp-camp--error utilitzat per a marcar camps amb error (el border el dóna aria-invalid) */
  .sdp-control {
    width: 100%; min-height: var(--sdp-touch-min); padding: var(--sdp-space-2) var(--sdp-space-3);
    border: 2px solid var(--sdp-vora-control); border-radius: var(--sdp-radi-s);
    background: var(--sdp-fons-targeta); color: var(--sdp-text-titol);
    font: inherit; font-size: var(--sdp-text-base);
  }
  .sdp-control::placeholder { color: var(--sdp-text-suau); }
  .sdp-control:focus-visible { outline: 3px solid var(--sdp-focus); outline-offset: 1px; border-color: var(--sdp-focus); }
  .sdp-control:disabled { background: var(--sdp-fons-subtil); color: var(--sdp-text-desactivat); cursor: not-allowed; }
  .sdp-control[aria-invalid="true"] { border-color: var(--sdp-error); }
  .sdp-control--area { min-height: calc(var(--sdp-touch-min) * 2.5); resize: vertical; line-height: 1.5; }
  .sdp-control--selector { appearance: auto; }

  .sdp-grup { margin: 0 0 var(--sdp-space-5); padding: var(--sdp-space-4); border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-m); }
  .sdp-grup--error { border-color: var(--sdp-error); }
  .sdp-grup__llegenda { padding: 0 var(--sdp-space-2); }
  .sdp-grup__cos { display: grid; gap: 0 var(--sdp-space-4); grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }

  .sdp-casella { display: flex; align-items: flex-start; gap: var(--sdp-space-3); min-height: var(--sdp-touch-min); padding-block: var(--sdp-space-2); }
  .sdp-casella__control { flex: none; width: 24px; height: 24px; margin: 0; accent-color: var(--sdp-accio); cursor: pointer; }
  .sdp-casella__control:focus-visible { outline: 3px solid var(--sdp-focus); outline-offset: 2px; }
  .sdp-casella__etiqueta { display: flex; flex-direction: column; gap: 2px; cursor: pointer; color: var(--sdp-text-titol); }
  .sdp-casella__ajuda { color: var(--sdp-text-suau); font-size: var(--sdp-text-meta); }

  .sdp-interruptor { display: flex; align-items: center; justify-content: space-between; gap: var(--sdp-space-4); min-height: var(--sdp-touch-min); }
  .sdp-interruptor__etiqueta { font-weight: 700; color: var(--sdp-text-titol); }
  .sdp-interruptor__control {
    display: inline-flex; align-items: center; gap: var(--sdp-space-2);
    min-height: var(--sdp-touch-min); padding: 0 var(--sdp-space-2);
    border: 0; background: transparent; color: var(--sdp-text-titol); font: inherit; font-weight: 700; cursor: pointer;
  }
  .sdp-interruptor__control:focus-visible { outline: 3px solid var(--sdp-focus); border-radius: var(--sdp-radi-pastilla); }
  .sdp-interruptor__carril {
    position: relative; width: 52px; height: 30px; border-radius: var(--sdp-radi-pastilla);
    background: var(--sdp-fons-subtil); border: 2px solid var(--sdp-vora-control); transition: background var(--sdp-t);
  }
  .sdp-interruptor__botonet {
    position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%;
    background: var(--sdp-text-suau); transition: translate var(--sdp-t), background var(--sdp-t);
  }
  .sdp-interruptor__control[aria-checked="true"] .sdp-interruptor__carril { background: var(--sdp-accio); border-color: var(--sdp-accio); }
  .sdp-interruptor__control[aria-checked="true"] .sdp-interruptor__botonet { translate: 22px 0; background: var(--sdp-sobre-accio); }
  .sdp-interruptor__estat { min-width: 2ch; }

  /* ── DIÀLEG · CONFIRMACIÓ · CALAIX ────────────────────────────────── */
  .sdp-dialeg {
    width: min(92vw, 36rem); max-height: min(88dvh, 48rem); padding: 0;
    border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-g);
    background: var(--sdp-fons-targeta); color: var(--sdp-text-cos); box-shadow: var(--sdp-ombra-4);
  }
  .sdp-dialeg--s { width: min(92vw, 28rem); }
  .sdp-dialeg--g { width: min(94vw, 56rem); }
  .sdp-dialeg::backdrop { background: var(--sdp-fons-vel); }
  .sdp-dialeg__marc { display: flex; flex-direction: column; max-height: inherit; }
  .sdp-dialeg__cap {
    display: flex; align-items: center; justify-content: space-between; gap: var(--sdp-space-3);
    padding: var(--sdp-space-4) var(--sdp-space-4) var(--sdp-space-2) var(--sdp-space-6);
  }
  .sdp-dialeg__titol { margin: 0; font-size: var(--sdp-text-base); font-weight: 800; color: var(--sdp-text-titol); }
  .sdp-dialeg__tanca {
    flex: none; display: inline-flex; align-items: center; justify-content: center;
    width: var(--sdp-touch-min); height: var(--sdp-touch-min); border: 0; border-radius: var(--sdp-radi-pastilla);
    background: transparent; color: var(--sdp-text-titol); cursor: pointer;
  }
  .sdp-dialeg__tanca:hover { background: var(--sdp-fons-subtil); }
  .sdp-dialeg__tanca:focus-visible { outline: 3px solid var(--sdp-focus); }
  .sdp-dialeg__descripcio { margin: 0; padding: 0 var(--sdp-space-6); color: var(--sdp-text-cos); }
  .sdp-dialeg__cos { padding: var(--sdp-space-4) var(--sdp-space-6); overflow-y: auto; overscroll-behavior: contain; }
  .sdp-dialeg__peu {
    display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--sdp-space-3);
    padding: var(--sdp-space-4) var(--sdp-space-6); border-top: 1px solid var(--sdp-vora);
  }
  .sdp-dialeg--calaix {
    margin: 0; width: min(88vw, 24rem); height: 100dvh; max-height: 100dvh; border-radius: 0; border-block: 0;
  }
  .sdp-dialeg--calaix .sdp-dialeg__marc { height: 100%; }
  .sdp-dialeg--calaix .sdp-dialeg__cos { flex: 1; }
  .sdp-dialeg--esquerra { inset: 0 auto 0 0; border-inline-start: 0; }
  .sdp-dialeg--dreta { inset: 0 0 0 auto; border-inline-end: 0; }
  @media (max-width: 720px) {
    /* Mòbil: el modal es convertix en full inferior; el polze arriba als botons. */
    .sdp-dialeg:not(.sdp-dialeg--calaix) {
      width: 100vw; max-width: 100vw; margin: auto 0 0; border-radius: var(--sdp-radi-g) var(--sdp-radi-g) 0 0;
    }
    .sdp-dialeg__peu { flex-direction: column-reverse; padding-bottom: calc(var(--sdp-space-4) + env(safe-area-inset-bottom, 0px)); }
    .sdp-dialeg__peu .sdp-boto { width: 100%; }
  }

  /* ── PESTANYES ────────────────────────────────────────────────────── */
  .sdp-pestanyes__llista {
    display: flex; gap: var(--sdp-space-1); overflow-x: auto; scrollbar-width: thin;
    border-bottom: 2px solid var(--sdp-vora);
  }
  .sdp-pestanyes__pestanya {
    display: inline-flex; align-items: center; gap: var(--sdp-space-2); flex: none;
    min-height: var(--sdp-touch-min); padding: 0 var(--sdp-space-4); margin-bottom: -2px;
    border: 0; border-bottom: 4px solid transparent; background: transparent;
    color: var(--sdp-text-suau); font: inherit; font-weight: 700; cursor: pointer;
  }
  .sdp-pestanyes__pestanya:hover { color: var(--sdp-text-titol); background: var(--sdp-fons-subtil); }
  .sdp-pestanyes__pestanya[aria-selected="true"] { color: var(--sdp-text-titol); border-bottom-color: var(--sdp-accent-text); }
  .sdp-pestanyes__pestanya:focus-visible, .sdp-pestanyes__panell:focus-visible { outline: 3px solid var(--sdp-focus); outline-offset: -3px; }
  .sdp-pestanyes__panell { padding: var(--sdp-space-4) 0; }

  /* ── MOLLA DE PA · PAGINACIÓ ──────────────────────────────────────── */
  .sdp-molla__llista { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sdp-space-1); margin: 0; padding: 0; list-style: none; }
  .sdp-molla__pas { display: inline-flex; align-items: center; gap: var(--sdp-space-1); margin: 0; color: var(--sdp-text-suau); }
  .sdp-molla__pas + .sdp-molla__pas::before { content: '›'; padding-inline: var(--sdp-space-1); color: var(--sdp-text-suau); }
  .sdp-molla__enllac { display: inline-flex; align-items: center; min-height: var(--sdp-touch-min); color: var(--sdp-accio-text); font-weight: 700; }
  .sdp-molla__pas [aria-current="page"] { color: var(--sdp-text-titol); font-weight: 700; }

  .sdp-paginacio { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--sdp-space-2); }
  .sdp-paginacio__llista { display: flex; align-items: center; gap: var(--sdp-space-1); margin: 0; padding: 0; list-style: none; }
  .sdp-paginacio__llista > li { margin: 0; }
  .sdp-paginacio__num, .sdp-paginacio__pas {
    display: inline-flex; align-items: center; justify-content: center; gap: var(--sdp-space-1);
    min-width: var(--sdp-touch-min); min-height: var(--sdp-touch-min); padding: 0 var(--sdp-space-3);
    border: 2px solid var(--sdp-vora); border-radius: var(--sdp-radi-s);
    background: var(--sdp-fons-targeta); color: var(--sdp-text-titol); font: inherit; font-weight: 700; cursor: pointer;
  }
  .sdp-paginacio__num[aria-current="page"] { background: var(--sdp-accio); border-color: var(--sdp-accio); color: var(--sdp-sobre-accio); }
  .sdp-paginacio__num:focus-visible, .sdp-paginacio__pas:focus-visible { outline: 3px solid var(--sdp-focus); outline-offset: 2px; }
  .sdp-paginacio__pas:disabled { opacity: 0.45; cursor: not-allowed; }
  .sdp-paginacio__salt { padding-inline: var(--sdp-space-1); color: var(--sdp-text-suau); }
  .sdp-taula--ampla { width: 100%; min-width: 600px; }
  .sdp-taula--interactiva tbody tr:hover { background: var(--sdp-fons-subtil); cursor: pointer; }
  .sdp-accions { display: flex; flex-wrap: wrap; gap: var(--sdp-space-3); align-items: center; }
  .sdp-accions--final { justify-content: flex-end; }

  /* ── ESTATS ───────────────────────────────────────────────────────── */
  .sdp-buit {
    display: flex; flex-direction: column; align-items: center; gap: var(--sdp-space-3);
    padding: var(--sdp-space-10) var(--sdp-space-4); text-align: center; color: var(--sdp-text-suau);
  }
  .sdp-buit__titol { margin: 0; font-size: var(--sdp-text-base); font-weight: 800; color: var(--sdp-text-titol); }
  .sdp-buit__text { max-width: 40ch; }
  .sdp-carregant { display: inline-flex; align-items: center; gap: var(--sdp-space-3); color: var(--sdp-text-suau); font-weight: 700; }
  .sdp-esquelet__forma { display: grid; gap: var(--sdp-space-3); }
  .sdp-esquelet__linia, .sdp-esquelet__media {
    display: block; height: 1rem; border-radius: var(--sdp-radi-s);
    background: linear-gradient(90deg, var(--sdp-fons-subtil) 0%, var(--sdp-vora) 50%, var(--sdp-fons-subtil) 100%);
    background-size: 200% 100%; animation: sdp-lluentor 1.4s ease-in-out infinite;
  }
  .sdp-esquelet__linia:last-child { width: 60%; }
  .sdp-esquelet__linia--titol { height: 1.6rem; width: 45%; }
  .sdp-esquelet__media { height: 10rem; }
  @keyframes sdp-lluentor { from { background-position: 100% 0; } to { background-position: -100% 0; } }
  .sdp-progres { display: grid; gap: var(--sdp-space-2); margin-bottom: var(--sdp-space-4); }
  .sdp-progres__cap { display: flex; justify-content: space-between; font-weight: 700; color: var(--sdp-text-titol); }
  .sdp-progres__barra {
    width: 100%; height: 14px; appearance: none; border: 0; border-radius: var(--sdp-radi-pastilla);
    background: var(--sdp-fons-subtil); overflow: hidden; accent-color: var(--sdp-accio);
  }
  .sdp-progres__barra::-webkit-progress-bar { background: var(--sdp-fons-subtil); }
  .sdp-progres__barra::-webkit-progress-value { background: var(--sdp-accio); border-radius: var(--sdp-radi-pastilla); }
  .sdp-progres__barra::-moz-progress-bar { background: var(--sdp-accio); border-radius: var(--sdp-radi-pastilla); }

  /* ── PISTA (toggletip) ────────────────────────────────────────────── */
  .sdp-pista { position: relative; display: inline-flex; vertical-align: middle; }
  .sdp-pista__boto {
    display: inline-flex; align-items: center; justify-content: center;
    width: var(--sdp-touch-min); height: var(--sdp-touch-min); border: 0; border-radius: var(--sdp-radi-pastilla);
    background: transparent; color: var(--sdp-accio-text); cursor: pointer;
  }
  .sdp-pista__boto:focus-visible { outline: 3px solid var(--sdp-focus); }
  .sdp-pista__bafarada {
    position: absolute; top: 100%; left: 50%; translate: -50% 0; z-index: 10;
    width: max-content; max-width: min(18rem, 80vw); padding: var(--sdp-space-3) var(--sdp-space-4);
    border-radius: var(--sdp-radi-s); background: var(--sdp-fons-invers); color: var(--sdp-text-invers);
    box-shadow: var(--sdp-ombra-3); font-size: var(--sdp-text-small); line-height: 1.4;
  }

  /* ── CATÀLEG (només /disseny) ─────────────────────────────────────── */
  .sdp-cataleg-nav { margin-block: var(--sdp-space-4) var(--sdp-space-6); }
  .sdp-cataleg-nav__llista { display: flex; flex-wrap: wrap; gap: var(--sdp-space-2); margin: 0; padding: 0; list-style: none; }
  .sdp-cataleg-nav__llista > li { margin: 0; }
  .sdp-cataleg-nav__enllac {
    display: inline-flex; align-items: center; min-height: var(--sdp-touch-min); padding: 0 var(--sdp-space-4);
    border: 2px solid var(--sdp-vora); border-radius: var(--sdp-radi-pastilla);
    color: var(--sdp-text-titol); font-weight: 700; text-decoration: none;
  }
  .sdp-cataleg-nav__enllac[aria-current="page"] { background: var(--sdp-fons-invers); border-color: var(--sdp-fons-invers); color: var(--sdp-text-invers); }
  .sdp-especimen { margin-bottom: var(--sdp-space-10); padding-top: var(--sdp-space-6); border-top: 2px solid var(--sdp-vora); }
  .sdp-especimen__cap { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--sdp-space-3); }
  .sdp-especimen__nom { margin: 0; }
  .sdp-especimen__fitxer { font-size: var(--sdp-text-meta); color: var(--sdp-text-suau); }
  .sdp-especimen__viu {
    margin-block: var(--sdp-space-4); padding: var(--sdp-space-6); border: 1px dashed var(--sdp-vora-control);
    border-radius: var(--sdp-radi-m); background: var(--sdp-fons-app);
  }
  .sdp-especimen__fila { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sdp-space-3); }
  .sdp-especimen__regles { display: grid; gap: var(--sdp-space-4); grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); }
  .sdp-especimen__fes, .sdp-especimen__no { padding: var(--sdp-space-4); border-radius: var(--sdp-radi-s); border-inline-start: 6px solid; }
  .sdp-especimen__fes { border-color: var(--sdp-exit); background: var(--sdp-exit-fons); color: var(--sdp-exit-text); }
  .sdp-especimen__no { border-color: var(--sdp-error); background: var(--sdp-error-fons); color: var(--sdp-error-text); }
  .sdp-especimen__fes > :last-child, .sdp-especimen__no > :last-child { margin-bottom: 0; }
  .sdp-anatomia { display: grid; gap: 2px; min-height: 16rem; border: 2px solid var(--sdp-vora-forta); border-radius: var(--sdp-radi-s); overflow: hidden;
    grid-template: "lat sup" auto "lat fin" 1fr / minmax(6rem, 22%) 1fr; background: var(--sdp-vora-forta); }
  .sdp-anatomia > * { display: flex; align-items: center; justify-content: center; padding: var(--sdp-space-3); text-align: center; font-weight: 700; }
  .sdp-anatomia__lat { grid-area: lat; background: var(--sdp-crom-fons); color: var(--sdp-crom-text); }
  .sdp-anatomia__sup { grid-area: sup; min-height: 3rem; background: var(--sdp-crom-fons); color: var(--sdp-crom-text); }
  .sdp-anatomia__fin { grid-area: fin; background: var(--sdp-fons-app); color: var(--sdp-text-titol); }

  /* Fuga reparada (260912): este bloc vivia FORA de @layer components, i el
     CSS sense capa guanya a TOTES les capes, `utilities` inclosa. Funcionava
     per accident (la intenció era anul·lar animacions). Ara viu on diu el
     capçal del fitxer. */
  @media (prefers-reduced-motion: reduce) {
    .sdp-boto__gir, .sdp-carregant__gir, .sdp-esquelet__linia, .sdp-esquelet__media { animation: none; }
    .sdp-interruptor__botonet, .sdp-interruptor__carril { transition: none; }
  }
}

```

