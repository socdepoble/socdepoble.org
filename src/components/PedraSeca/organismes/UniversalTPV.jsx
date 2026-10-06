/**
 * UniversalTPV.jsx — el TPV universal (ordre del Mestre, 261006: prompt
 * 261006_1215 i skill sdp-clon-loiverse). Calca l'ESTRUCTURA de Loyverse, no
 * l'estil («Clonar és copiar l'estructura, no l'estil», correcció del Mestre,
 * 261003): el tiquet blanc a l'esquerra, la graella de categories i
 * productes a la dreta, es veu més que es llig i la imatge mana. La pell és
 * Pedra Seca (tpv.css): només tokens, blau de control per a l'acció
 * principal i taronja per a la marca i l'acció secundària.
 *
 * Una sola peça per a dues intel·ligències: el Bar de la Parròquia («Cobra»)
 * i la Llista de la Compra o el Rebost («Afig a la llista»). La peça no sap
 * de diners, de sessions ni de backend: rep les formes de l'esquelet comú
 * (articles.js) ja vestides per l'app i li torna els tocs. Presentacional
 * pur: cap emmagatzematge, xarxa ni global. L'únic estat propi és el de la
 * vista (la categoria triada, el text de la cerca i la pestanya del mòbil) i,
 * per a cada imatge, la font que no s'ha pogut carregar.
 *
 * SENSE XARXA (ordre del Mestre, 261006: capacitat offline prioritària). La
 * peça no sap si hi ha xarxa: l'app ho diu a l'avís. El que sí fa és no
 * dependre'n per a pintar. La foto d'un article o el logotip de la marca que
 * no es poden carregar (sense connexió, enllaç trencat) tornen a la marca
 * (icona i inicials) o a les inicials: cap imatge trencada ni salt de
 * disposició, perquè el quadrat 1:1 no canvia de mida. Cada element recorda
 * la font fallida (onError); una font nova, o la mateixa quan l'element es
 * torna a muntar, es torna a provar.
 *
 * CONTRACTE
 *   etiqueta   string, obligatori: el nom de la regió («TPV de La Parròquia»).
 *   marca      { nom, logotip? } | null · la capçalera del tiquet: el logotip
 *              1:1 o, sense (o si no es pot carregar), les inicials del nom
 *              sobre el taronja de marca.
 *   avis       node | node[] | null · la franja damunt del tiquet (sessió,
 *              torn, mode emportar…). Una llista va per ordre d'importància:
 *              en el mòbil només el primer va davall de la barra d'accions, i
 *              la resta, dins de la pestanya del tiquet, perquè la franja no
 *              deixe sense alçada la graella ni les línies.
 *   tiquet     { titol: 'Tiquet' | 'Llista', nom?, comptador?, linies, total?,
 *              resum?: [{ etiqueta, valor }], buit: { titol, text?, icona? },
 *              onEdita?(linia), textosEstat?: { fet?, anullat? } }
 *              · nom: el tiquet o la llista actius («Taula 3», «Casa»). Va al
 *                títol, darrere de `titol`, i al nom de la regió: la pantalla
 *                diu sempre a quin tiquet s'afig i quin es cobra.
 *              · comptador: les unitats (el «[3]» de Loyverse). Un missatge
 *                d'estat (role="status") les anuncia quan canvien.
 *              · linia { id, articleId?, quantitat, nom, detall?, valor?, estat? }
 *              · amb onEdita, cada línia és un botó; una d'anul·lada es ratlla
 *                i ho diu amb text.
 *   accions    { secundaria?: { text, comptador?, onClick, desactivada? },
 *                principal: { text, valor?, onClick, desactivada? } }
 *              · la barra partida 50/50 del peu del tiquet (dalt, en el mòbil).
 *   cataleg    { titol?: 'Productes', categories, articles, textTotes?,
 *                etiquetaCerca?, onTria(article), onDetall?(article),
 *                desactivat?, textosEstat?: { 'en-colleccio'?, desactivat? },
 *                buit: { titol, text? }, textSenseResultats?(text),
 *                textCategoriaBuida?(nom) }
 *              · article { id, nom, categoriaId, secundari?, valor?, imatge?,
 *                estat?, insignia?, insigniaLector?, alergens? }; categoria
 *                { id, nom, icona?, visible, ordre }
 *              · insigniaLector: el que el lector diu de la insígnia («2
 *                unitats a la comanda»); sense, en llig el text curt.
 *              · alergens: ids de la llista canònica (ALERGENS de
 *                utils/productes/producteUniversal.js). Ordre del Mestre,
 *                261006 («vital per a la Carta Digital i el TPV»): la rajola
 *                pinta IconesAlergens xicoteta a dalt a l'esquerra, damunt de
 *                la foto o de la marca, com a molt 4 peces (fins a 4 icones;
 *                amb més, 3 i «+N»), sense tapar la insígnia ni la banda; i el
 *                nom del botó hi afig «, conté gluten, llet» (tots, també els
 *                del «+N»). Les icones són aria-hidden: el nom ja les diu. A
 *                la comanda, les icones baixen davall de la marca de la
 *                cantonada. Els ids desconeguts no compten. Sense al·lèrgens,
 *                la rajola de sempre, node a node (Llei del Píxel).
 *              · imatge: la foto ompli el quadrat; la que no es pot carregar
 *                torna a la marca (icona de la categoria i inicials).
 *              · buit: el catàleg sense cap article. Una categoria triada que
 *                no en té cap diu textCategoriaBuida («Cap producte a «Cafès».»).
 *              · el toc crida onTria; la pulsació llarga, el botó dret o
 *                Maj+F10, onDetall (pulsacioLlarga.js).
 *   oberts     { obert, onTanca(motiu), titol, elements: [{ id, nom, detall?,
 *                valor?, actiu? }], onTria(element), nou?: { text, onClick },
 *                buit?: { titol, text? } } | null · el diàleg dels tiquets
 *                oberts o de les llistes.
 *   tria       { obert, onTanca(motiu), titol, descripcio?, opcions: [{ id,
 *                nom, valor?, actiu? }], onTria(opcio) } | null · el diàleg
 *                menut d'una sola tria (variants, modificador obligatori).
 *   Als dos diàlegs, un toc tria i tanca: onTria(opció) i després
 *   onTanca('tria'). Els altres motius són els del Dialeg ('esc', 'vel',
 *   'boto'): cancel·lar.
 *
 * DISPOSICIÓ. Decidix l'amplada PRÒPIA de la peça (useAmpladaContenidor),
 * mai la del viewport: a partir de 46em, dues àrees (tiquet i catàleg); per
 * davall, una columna com Loyverse mòbil (la barra d'accions dalt i les
 * pestanyes «Productes» i «Tiquet N»). L'arrel porta data-mida="ampla" o
 * "estreta" i el full en penja. Mentre l'amplada no es coneix (jsdom), ampla.
 * LLEI DE SCROLL: la peça ompli l'alçada del contenidor i només fan scroll
 * les línies del tiquet i la graella. Quan no tenen cap control actiu
 * (catàleg desactivat, línies sense onEdita), reben el focus (tabIndex 0):
 * amb Chrome 100 i Safari 16, un scroll sense res enfocable no es mou amb
 * el teclat.
 *
 * Importa per camí directe (mai per index.js): la porta de dependències
 * circulars de Pedra Seca ho exigix.
 */
import { useId, useRef, useState } from 'react';
import { Check, Receipt, Search } from 'lucide-react';
import { Boto } from '../atoms/Boto.jsx';
import { EstatBuit } from '../atoms/estats.jsx';
import { IconesAlergens } from '../molecules/IconesAlergens.jsx';
import { inicialsDe } from '../molecules/Rajola.jsx';
import { alergensConeguts, textAlergens } from '../recursos/alergens.js';
import { Dialeg } from './Dialeg.jsx';
import { Pestanyes } from './Pestanyes.jsx';
import { SelectorCategoria } from './SeccionsCategoria.jsx';
import {
  TEXTOS_ARTICLES, TEXTOS_ESTAT_LINIA, categoriesEnOrdre, categoriesVisibles, estatArticle, estatLinia,
  liniaSecundaria, normalitzaText
} from './articles.js';
import { fontSegura, pintaMarca } from './marca.jsx';
import { usePulsacioLlarga } from './pulsacioLlarga.js';
import { esEstret, useAmpladaContenidor } from '../../../hooks/useAmpladaContenidor.js';

/* Per davall d'esta amplada pròpia, en em de la peça (≈ 736 px amb 16 px),
   el tiquet i la graella no caben de costat: una sola columna. */
const LLINDAR_ESTRET_EM = 46;

/* Les peces d'al·lèrgens que caben a la cantonada d'una rajola, «+N» inclòs:
   fins a 4 icones i, amb més, 3 i «+N». Així no arriben mai a la banda del
   nom, tampoc en la rajola més estreta (7.5rem) ni davall de la marca. */
const MAXIM_ALERGENS = 4;

const TEXTOS = Object.freeze({
  tiquet: 'Tiquet',
  cataleg: 'Productes',
  totes: 'Totes',
  cerca: 'Busca un producte',
  categoria: 'Categoria',
  vista: 'Vista',
  linies: 'Línies',
  tiquetBuit: 'Encara no hi ha res.',
  catalegBuit: 'Encara no hi ha cap producte.',
  obertsBuit: 'Encara no n’hi ha cap.',
  senseResultats: (text) => `Cap resultat per a «${text}».`,
  categoriaBuida: (nom) => `Cap producte a «${nom}».`,
  categoriaBuidaText: 'Tria una altra categoria.',
  unitats: (n) => `${n} ${n === 1 ? 'unitat' : 'unitats'}`,
  conte: (alergens) => `conté ${alergens}`
});

/* Desactivat no necessita classe: el botó ja és disabled i es pinta com a tal. */
const CLASSE_ELEMENT = Object.freeze({
  normal: 'sdp-tpv__element',
  'en-colleccio': 'sdp-tpv__element sdp-tpv__element--en-colleccio',
  desactivat: 'sdp-tpv__element'
});

const CLASSE_LINIA = Object.freeze({
  normal: 'sdp-tpv__element-linia',
  fet: 'sdp-tpv__element-linia sdp-tpv__element-linia--fet',
  anullat: 'sdp-tpv__element-linia sdp-tpv__element-linia--anullat'
});

const ambId = (llista) => (Array.isArray(llista) ? llista.filter((element) => element && typeof element.id === 'string') : []);
const comptadorDe = (valor) => (Number.isFinite(valor) ? valor : null);
const textNet = (valor) => (typeof valor === 'string' && valor.trim() !== '' ? valor : null);
/* L'avís: un node o una llista per ordre d'importància; els buits no compten. */
const llistaAvisos = (avis) => (Array.isArray(avis) ? avis : [avis])
  .filter((node) => node !== null && node !== undefined && node !== false && node !== '');

/* El número d'una píndola (el «[3]» de Loyverse): al títol, a la pestanya i a la secundària. */
function Comptador({ valor }) {
  if (valor === null) return null;
  return <>{' '}<span className="sdp-tpv__comptador">{valor}</span></>;
}

/* ── LA BARRA D'ACCIONS · secundària | principal, 50/50 ─────────────── */
function BarraAccions({ accions }) {
  const secundaria = accions?.secundaria || null;
  const principal = accions?.principal || null;
  if (!secundaria && !principal) return null;
  return (
    <div className="sdp-tpv__accions">
      {secundaria ? (
        <button type="button" className="sdp-tpv__accio sdp-tpv__accio--secundaria"
          disabled={Boolean(secundaria.desactivada)} onClick={() => secundaria.onClick?.()}>
          <span className="sdp-tpv__accio-text">{secundaria.text}</span>
          <Comptador valor={comptadorDe(secundaria.comptador)} />
        </button>
      ) : null}
      {principal ? (
        <button type="button" className="sdp-tpv__accio sdp-tpv__accio--principal"
          disabled={Boolean(principal.desactivada)} onClick={() => principal.onClick?.()}>
          <span className="sdp-tpv__accio-text">{principal.text}</span>
          {principal.valor ? <>{' '}<span className="sdp-tpv__accio-valor">{principal.valor}</span></> : null}
        </button>
      ) : null}
    </div>
  );
}

/* Una imatge que pot fallar (sense xarxa, enllaç trencat): la font que no
   s'ha pogut carregar es recorda i l'element pinta el marcador en el seu
   lloc. Una font nova es torna a provar. */
function useFontQueCarrega(font) {
  const [fallida, setFallida] = useState(null);
  return [font !== null && font !== fallida ? font : null, () => setFallida(font)];
}

/* ── EL TIQUET · marca, títol, línies, resum, total i (ampla) la barra ── */
function CapcaleraTiquet({ marca, titol, nom, comptador, idTitol }) {
  /* El logotip que no carrega torna a les inicials, com la marca sense logotip. */
  const [logotip, onFalla] = useFontQueCarrega(marca ? fontSegura(marca.logotip) : null);
  return (
    <header className="sdp-tpv__cap">
      {marca ? (
        <span className="sdp-tpv__marca" aria-hidden="true">
          {logotip
            ? <img className="sdp-tpv__logotip" src={logotip} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={onFalla} />
            : inicialsDe(marca.nom)}
        </span>
      ) : null}
      <span className="sdp-tpv__identitat">
        {marca?.nom ? <span className="sdp-tpv__nom-marca">{marca.nom}</span> : null}
        <span className="sdp-tpv__titol" id={idTitol}>
          {titol}
          {nom ? <>{' '}<span className="sdp-tpv__nom-tiquet">{nom}</span></> : null}
          <Comptador valor={comptador} />
        </span>
      </span>
    </header>
  );
}

/* Sense onEdita cap línia és un control: la llista mateixa rep el focus per a fer-hi scroll. */
function LiniesTiquet({ linies, onEdita, textos }) {
  return (
    <ol className="sdp-tpv__linies" aria-label={TEXTOS.linies} tabIndex={onEdita ? undefined : 0}>
      {linies.map((linia) => {
        const estat = estatLinia(linia);
        const contingut = (
          <>
            <span className="sdp-tpv__linia-nom">{linia.nom}</span>
            {Number.isFinite(linia.quantitat) ? (
              <>
                {' '}
                <span className="sdp-tpv__linia-quantitat">
                  <span aria-hidden="true">{`× ${linia.quantitat}`}</span>
                  <span className="sdp-nomes-lector">{TEXTOS.unitats(linia.quantitat)}</span>
                </span>
              </>
            ) : null}
            {linia.valor ? <>{' '}<span className="sdp-tpv__linia-valor">{linia.valor}</span></> : null}
            {linia.detall ? <>{' '}<span className="sdp-tpv__linia-detall">{linia.detall}</span></> : null}
            {estat === 'normal' ? null : <>{' '}<span className="sdp-tpv__linia-estat">{textos[estat]}</span></>}
          </>
        );
        return (
          <li key={linia.id} className={CLASSE_LINIA[estat]} data-linia={linia.id}>
            {onEdita
              ? <button type="button" className="sdp-tpv__linia" onClick={() => onEdita(linia)}>{contingut}</button>
              : <div className="sdp-tpv__linia">{contingut}</div>}
          </li>
        );
      })}
    </ol>
  );
}

function Tiquet({ tiquet, marca, avisos, accions, ambAccions, idTitol }) {
  const linies = ambId(tiquet?.linies);
  const resum = (Array.isArray(tiquet?.resum) ? tiquet.resum : []).filter((fila) => fila && fila.etiqueta);
  const total = tiquet?.total || null;
  const textos = { ...TEXTOS_ESTAT_LINIA, ...tiquet?.textosEstat };
  const buit = tiquet?.buit || {};
  return (
    <section className="sdp-tpv__tiquet" aria-labelledby={idTitol}>
      <CapcaleraTiquet marca={marca} titol={tiquet?.titol || TEXTOS.tiquet} nom={textNet(tiquet?.nom)}
        comptador={comptadorDe(tiquet?.comptador)} idTitol={idTitol} />
      {avisos.length ? <div className="sdp-tpv__avis">{avisos}</div> : null}
      {linies.length ? (
        <LiniesTiquet linies={linies} onEdita={typeof tiquet?.onEdita === 'function' ? tiquet.onEdita : null} textos={textos} />
      ) : (
        <EstatBuit className="sdp-tpv__buit" icona={buit.icona || Receipt} titol={buit.titol || TEXTOS.tiquetBuit}>
          {buit.text || null}
        </EstatBuit>
      )}
      {resum.length || total ? (
        <dl className="sdp-tpv__resum">
          {resum.map((fila) => (
            <div key={fila.etiqueta} className="sdp-tpv__fila-resum">
              <dt className="sdp-tpv__resum-etiqueta">{fila.etiqueta}</dt>
              <dd className="sdp-tpv__resum-valor">{fila.valor}</dd>
            </div>
          ))}
          {total ? (
            <div className="sdp-tpv__fila-resum sdp-tpv__fila-resum--total">
              <dt className="sdp-tpv__resum-etiqueta">{total.etiqueta}</dt>
              <dd className="sdp-tpv__resum-valor">{total.valor}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {ambAccions ? <BarraAccions accions={accions} /> : null}
    </section>
  );
}

/* ── EL CATÀLEG · pastilles i cerca, i la graella densa de rajoles ──── */

/* Una rajola. La foto que no es pot carregar torna a la marca (icona i
   inicials) i la rajola perd la classe de foto: el mateix botó, amb la mateixa
   mida i el focus on era, pintat com un article sense foto.
   Els al·lèrgens (ordre del Mestre, 261006) van a la cantonada de dalt a
   l'esquerra, darrere de la marca de la comanda i de la insígnia al DOM: el
   full els baixa davall de la marca i, amb insígnia, en deixa lliure la
   cantonada. Sense, el DOM de sempre: el botó, la marca i la insígnia. */
function ElementGraella({ article, categoria, idInsignia, idPista, pulsacio, onTria, ambDetall, desactivat, textos }) {
  const [foto, onFalla] = useFontQueCarrega(fontSegura(article.imatge));
  const estat = estatArticle(article);
  const segona = liniaSecundaria(article);
  const alergens = alergensConeguts(article.alergens);
  const conte = alergens.length ? TEXTOS.conte(textAlergens(alergens)) : null;
  const nom = [article.nom, segona, estat === 'normal' ? null : textos[estat], conte].filter(Boolean).join(', ');
  const descrit = [article.insignia ? idInsignia : null, ambDetall ? idPista : null].filter(Boolean).join(' ');
  const { handlers, consumeix } = pulsacio;
  return (
    <li className={CLASSE_ELEMENT[estat]}>
      <button
        type="button"
        className={foto ? 'sdp-tpv__rajola sdp-tpv__rajola--imatge' : 'sdp-tpv__rajola'}
        disabled={Boolean(desactivat) || estat === 'desactivat'}
        aria-label={nom}
        aria-describedby={descrit || undefined}
        aria-keyshortcuts={ambDetall ? 'Shift+F10' : undefined}
        data-article={article.id}
        {...handlers}
        onClick={() => {
          if (consumeix()) return;
          onTria?.(article);
        }}
      >
        {/* La rajola ja té nom: la foto és decorativa (alt buit) i no envia el referent. */}
        <span className="sdp-tpv__media" aria-hidden="true">
          {foto
            ? <img className="sdp-marca-article__imatge" src={foto} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={onFalla} />
            : pintaMarca(article, categoria)}
        </span>
        <span className="sdp-tpv__banda" aria-hidden="true">
          <span className="sdp-tpv__nom">{article.nom}</span>
          {segona ? <span className="sdp-tpv__valor">{segona}</span> : null}
        </span>
      </button>
      {estat === 'en-colleccio' ? (
        <span className="sdp-tpv__marca-colleccio" aria-hidden="true">
          <Check size={16} focusable="false" />
        </span>
      ) : null}
      {article.insignia ? (
        <span id={idInsignia} className="sdp-tpv__insignia">
          {textNet(article.insigniaLector) ? (
            <>
              <span aria-hidden="true">{article.insignia}</span>
              <span className="sdp-nomes-lector">{article.insigniaLector}</span>
            </>
          ) : article.insignia}
        </span>
      ) : null}
      {alergens.length ? (
        <span className="sdp-tpv__alergens" aria-hidden="true">
          <IconesAlergens alergens={alergens} maxim={MAXIM_ALERGENS} />
        </span>
      ) : null}
    </li>
  );
}

function Graella({ articles, etiqueta, perId, onTria, onDetall, desactivat, textos, idPista }) {
  const id = useId();
  const premuda = usePulsacioLlarga(onDetall);
  /* Cap rajola enfocable (sense sessió, tot esgotat): la graella rep el focus per a fer-hi scroll. */
  const capEnfocable = Boolean(desactivat) || articles.every((article) => estatArticle(article) === 'desactivat');
  return (
    <ul className="sdp-tpv__graella" aria-label={etiqueta} tabIndex={capEnfocable ? 0 : undefined}>
      {articles.map((article, i) => (
        <ElementGraella key={article.id} article={article} categoria={perId.get(article.categoriaId)}
          idInsignia={`${id}-insignia-${i}`} idPista={idPista} pulsacio={premuda(article)} onTria={onTria}
          ambDetall={Boolean(onDetall)} desactivat={desactivat} textos={textos} />
      ))}
    </ul>
  );
}

/* El buit del catàleg: la cerca sense resultats, una categoria triada sense
   cap article (la carta en té en altres) o el catàleg sense cap article. */
function buitDelCataleg({ cataleg, cerca, net, activa, ambArticles }) {
  if (net) {
    const senseResultats = typeof cataleg?.textSenseResultats === 'function' ? cataleg.textSenseResultats : TEXTOS.senseResultats;
    return { icona: Search, titol: senseResultats(cerca.trim()), text: null };
  }
  if (activa && ambArticles) {
    const categoriaBuida = typeof cataleg?.textCategoriaBuida === 'function' ? cataleg.textCategoriaBuida : TEXTOS.categoriaBuida;
    return { icona: undefined, titol: categoriaBuida(activa.nom), text: TEXTOS.categoriaBuidaText };
  }
  const buit = cataleg?.buit || {};
  return { icona: undefined, titol: buit.titol || TEXTOS.catalegBuit, text: buit.text || null };
}

function Cataleg({ cataleg, categoria, onCategoria, cerca, onCerca }) {
  const idPista = useId();
  const titol = cataleg?.titol || TEXTOS.cataleg;
  const etiquetaCerca = cataleg?.etiquetaCerca || TEXTOS.cerca;
  const textos = { ...TEXTOS_ARTICLES, ...cataleg?.textosEstat };
  const onDetall = typeof cataleg?.onDetall === 'function' ? cataleg.onDetall : null;
  const totes = categoriesEnOrdre(cataleg?.categories);
  const perId = new Map(totes.map((c) => [c.id, c]));
  const amagades = new Set(totes.filter((c) => c.visible === false).map((c) => c.id));
  /* Una categoria triada que ja no es veu torna a «Totes». */
  const activa = categoriesVisibles(totes).find((c) => c.id === categoria) || null;
  const net = normalitzaText(cerca);
  const visibles = ambId(cataleg?.articles).filter((article) => !amagades.has(article.categoriaId));
  const articles = visibles
    .filter((article) => !activa || article.categoriaId === activa.id)
    .filter((article) => !net || normalitzaText(article.nom).includes(net));
  const buit = articles.length ? null : buitDelCataleg({ cataleg, cerca, net, activa, ambArticles: visibles.length > 0 });
  return (
    <section className="sdp-tpv__cataleg" aria-label={titol}>
      <div className="sdp-tpv__eines">
        <SelectorCategoria categories={totes} valor={activa ? activa.id : null} onCanvi={onCategoria}
          etiqueta={TEXTOS.categoria} textTotes={cataleg?.textTotes || TEXTOS.totes} />
        <div className="sdp-tpv__cerca" role="search" aria-label={etiquetaCerca}>
          <Search className="sdp-tpv__lupa" size={20} aria-hidden="true" focusable="false" />
          <input type="search" className="sdp-control sdp-tpv__camp-cerca" value={cerca} autoComplete="off"
            aria-label={etiquetaCerca} placeholder={etiquetaCerca} onChange={(event) => onCerca(event.target.value)} />
        </div>
      </div>
      {onDetall ? <span id={idPista} className="sdp-nomes-lector">{textos.pista}</span> : null}
      {buit ? (
        <EstatBuit className="sdp-tpv__buit" icona={buit.icona} titol={buit.titol}>{buit.text}</EstatBuit>
      ) : (
        <Graella articles={articles} etiqueta={activa ? `${titol}: ${activa.nom}` : titol} perId={perId}
          onTria={cataleg?.onTria} onDetall={onDetall} desactivat={cataleg?.desactivat} textos={textos} idPista={idPista} />
      )}
    </section>
  );
}

/* ── ELS DIÀLEGS · una llista de botons grans; un toc tria i tanca ──── */
function LlistaOpcions({ etiqueta, opcions, onTria, onTanca }) {
  return (
    <ul className="sdp-tpv__opcions" aria-label={etiqueta}>
      {opcions.map((opcio) => (
        <li key={opcio.id} className="sdp-tpv__element-opcio">
          <button type="button" className="sdp-tpv__opcio" aria-current={opcio.actiu ? 'true' : undefined}
            onClick={() => {
              onTria?.(opcio);
              onTanca?.('tria');
            }}>
            <span className="sdp-tpv__opcio-nom">{opcio.nom}</span>
            {opcio.valor ? <>{' '}<span className="sdp-tpv__opcio-valor">{opcio.valor}</span></> : null}
            {opcio.detall ? <>{' '}<span className="sdp-tpv__opcio-detall">{opcio.detall}</span></> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

function DialegOberts({ oberts }) {
  const elements = ambId(oberts.elements);
  const buit = oberts.buit || {};
  return (
    <Dialeg obert={Boolean(oberts.obert)} onTanca={oberts.onTanca} titol={oberts.titol} mida="m"
      accions={oberts.nou ? <Boto varietat="primari" onClick={() => oberts.nou.onClick?.()}>{oberts.nou.text}</Boto> : null}>
      {elements.length ? (
        <LlistaOpcions etiqueta={oberts.titol} opcions={elements} onTria={oberts.onTria} onTanca={oberts.onTanca} />
      ) : (
        <EstatBuit icona={Receipt} titol={buit.titol || TEXTOS.obertsBuit}>{buit.text || null}</EstatBuit>
      )}
    </Dialeg>
  );
}

function DialegTria({ tria }) {
  return (
    <Dialeg obert={Boolean(tria.obert)} onTanca={tria.onTanca} titol={tria.titol} descripcio={tria.descripcio} mida="s">
      <LlistaOpcions etiqueta={tria.titol} opcions={ambId(tria.opcions)} onTria={tria.onTria} onTanca={tria.onTanca} />
    </Dialeg>
  );
}

export function UniversalTPV({ etiqueta, marca = null, avis = null, tiquet, accions, cataleg, oberts = null, tria = null }) {
  const arrel = useRef(null);
  const mida = useAmpladaContenidor(arrel);
  const estreta = esEstret(mida, LLINDAR_ESTRET_EM);
  const idTitol = `${useId()}-titol`;
  /* L'estat de la vista viu ací, no a les àrees: canviar de disposició no el perd. */
  const [categoria, setCategoria] = useState(null);
  const [cerca, setCerca] = useState('');
  const [vista, setVista] = useState('productes');

  const cat = <Cataleg cataleg={cataleg} categoria={categoria} onCategoria={setCategoria} cerca={cerca} onCerca={setCerca} />;
  const titolTiquet = tiquet?.titol || TEXTOS.tiquet;
  const comptador = comptadorDe(tiquet?.comptador);
  const avisos = llistaAvisos(avis);
  /* El missatge d'estat (WCAG 4.1.3): fora de les pestanyes, sempre al DOM, diu les unitats quan canvien. */
  const anunci = comptador === null ? '' : `${[titolTiquet, textNet(tiquet?.nom)].filter(Boolean).join(' ')}: ${TEXTOS.unitats(comptador)}`;
  return (
    <section ref={arrel} className="sdp-tpv" data-mida={estreta ? 'estreta' : 'ampla'} aria-label={etiqueta}>
      {estreta ? (
        <>
          <BarraAccions accions={accions} />
          {avisos.length ? <div className="sdp-tpv__avis">{avisos[0]}</div> : null}
          <Pestanyes className="sdp-tpv__pestanyes" etiqueta={TEXTOS.vista} activa={vista} onCanvi={setVista} pestanyes={[
            { id: 'productes', etiqueta: cataleg?.titol || TEXTOS.cataleg, contingut: cat },
            {
              id: 'tiquet',
              etiqueta: <>{titolTiquet}<Comptador valor={comptador} /></>,
              contingut: <Tiquet tiquet={tiquet} marca={marca} avisos={avisos.slice(1)} accions={accions} ambAccions={false} idTitol={idTitol} />
            }
          ]} />
        </>
      ) : (
        <>
          <Tiquet tiquet={tiquet} marca={marca} avisos={avisos} accions={accions} ambAccions idTitol={idTitol} />
          {cat}
        </>
      )}
      {oberts ? <DialegOberts oberts={oberts} /> : null}
      {tria ? <DialegTria tria={tria} /> : null}
      <p className="sdp-nomes-lector" role="status">{anunci}</p>
    </section>
  );
}
