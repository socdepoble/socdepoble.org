/**
 * Esquelet comú de catàleg i col·lecció · la columna del CATÀLEG.
 *
 * Ordre del Mestre (261002, sinergies T4/T8): el TPV del bar i La Compra
 * pinten el catàleg amb esta mateixa columna. Cap app fa una graella pròpia.
 * La columna és presentacional: rep els articles ja vestits (preu, IVA,
 * pendent o comprat són intel·ligència de cada app) i torna els gestos.
 *
 *   capçalera  AppGridColumn amb el títol
 *   eines      SelectorCategoria · vista (graella/llista) · AfegitRapid
 *   cos        GraellaArticles o LlistaArticles, per seccions de categoria
 *              (agrupa) o plana; els destacats («Recents») van davant
 *   detall     DetallArticle, obert per ?article=<id>. Amb
 *              detall.triaDirecta (booleà o funció de l'article), el diàleg
 *              menut d'un grup obligatori: un toc tria i tanca (disseny del
 *              Bar §A.6, flux 1). El toc normal l'obri amb obriDetall només
 *              si l'app ho decidix; si no, l'app afig la variant per defecte
 *   peu        en pantalla estreta, BarraResum, que porta a la col·lecció
 *   avis       (opcional) un avís de l'app, dins del marc (MarcColumna): el
 *              primer fill del cos, davall de la capçalera i de les eines.
 *              Correcció F3 (261006): la capçalera no baixa. Sense, el de sempre
 * Tot l'estat de vista viu a la URL (vistes.js). Sense categories ni
 * destacats, el catàleg és una sola peça plana, sense seccions.
 *
 * Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes») ·
 * forma="targetes" (OPCIONAL): el cos és de UniversalCard dins de
 * GraellaTargetes de Pedra Seca, en lloc de les rajoles i les files pròpies.
 * Vista graella: la targeta de sempre; vista llista: la targeta plana en
 * columna. Sense la prop, el cos de sempre, byte a byte: el TPV del Bar i la
 * Salut no canvien (Llei del Píxel). Ho pinta TargetesArticles, de baix, que
 * també fa servir ColumnaColleccio.
 */
import { isValidElement, useEffect, useLayoutEffect, useRef } from 'react';
import { FileText, LayoutGrid, List } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import {
  AfegitRapid, BarraResum, Boto, DetallArticle, ESTATS_ARTICLE, EstatBuit, GraellaArticles, GraellaTargetes, LlistaArticles,
  MarcColumna, PaginaApp, PillToggle, SelectorCategoria, UniversalCard
} from '../../../components/PedraSeca/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { useVistaCataleg, useVistesEsquelet } from './vistes.js';

/* Els textos d'estat per defecte de la forma «targetes»: els mateixos de les
   rajoles (TEXTOS_ARTICLES d'articles.js, que la façana no publica). L'app
   els canvia pels seus («A la llista», «La seguixes»). */
const TEXTOS_TARGETES = Object.freeze({ 'en-colleccio': 'Ja és a la col·lecció', desactivat: 'No disponible' });
/* Les apps no entren a la telemetria (frontera.test.js de cada app): el Connectar del peu no compta. */
const SENSE_TELEMETRIA = Object.freeze({ comptar: false });

const estatDe = (article) => (ESTATS_ARTICLE.includes(article?.estat) ? article.estat : 'normal');
/* La línia de davall del nom, com a les rajoles: l'especificació i el valor. */
const liniaDeDavall = (article) => [article.secundari, article.valor].filter((text) => typeof text === 'string' && text !== '').join(' · ');
const ambText = (text) => typeof text === 'string' && text.trim() !== '';
/* Ordre del Mestre, 261004 (regressió de la Nevera) · El que la rajola deia al lector i
   l'element principal de la targeta (que només porta el nom) ja no deia: l'especificació
   (la línia de davall), el text d'estat i la insígnia, en l'ordre de la rajola. */
const descripcioDe = (article, estat, t) => [liniaDeDavall(article), estat === 'normal' ? null : t[estat], article.insignia]
  .filter(ambText).join(', ');
/* REGLA D'OR 1 (ordre del Mestre, 261004) · La boina de l'article, la que l'app hi ha vestit
   (`autoria`): només els textos i les rutes que hi són; la resta, undefined (cap atribut nou). */
const textDe = (valor) => (ambText(valor) ? valor : undefined);
const boinaDe = ({ autoria } = {}) => ({
  nom: textDe(autoria?.nom),
  href: textDe(autoria?.href),
  avatar: textDe(autoria?.avatar),
  poble: textDe(autoria?.poble)
});
/* Ordre del Mestre, 261004 (integració final; F04 de Codex) · L'anatomia sencera de la targeta:
   el subtítol (`article.subtitol`) i l'entradeta, amb dades reals que l'app vestix. L'entradeta
   és la línia de davall de sempre (especificació, estat, valor) i, si no n'hi ha, la que l'app
   hi posa (`article.entradeta`). Sense cap de les dues, el cos de sempre: l'esquelet no inventa. */
const entradetaDe = (article) => liniaDeDavall(article) || textDe(article.entradeta);

/* La icona del quadrat de la targeta (squareBadge, 48 px com a l'espècimen): un component de
   lucide-react o un element ja fet. Decorativa: el quadrat porta el nom de la secció. */
function iconaDelQuadrat(icona) {
  if (isValidElement(icona)) return icona;
  if (typeof icona === 'function' || (typeof icona === 'object' && icona !== null && '$$typeof' in icona)) {
    const Icona = icona;
    return <Icona size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" />;
  }
  return null;
}

/**
 * Ordre del Mestre, 261004 · Els articles d'una columna de l'esquelet com a
 * UniversalCard, amb l'anatomia de sempre i les opcionals de les apps:
 *   elements   [{ article, categoria }] · `categoria` és la secció pròpia de
 *              l'article (la icona del quadrat), també dins de «Recents»
 *   categories les seccions (GraellaTargetes, h3) o null: una sola graella
 *   pla        la targeta plana en columna (la vista llista)
 * Cada targeta: el nom (h4 dins d'una secció; si no, `nivellTargeta`), la
 * línia de davall, la foto privada o, sense, la icona de la secció al
 * quadrat (article.icona, si l'app la vestix, mana), l'estat i la insígnia
 * en etiqueta de text, el toc (onTria), aria-pressed si és commutable, la
 * pulsació llarga per al detall (onAccioSecundaria), data-element amb l'id i
 * la descripció accessible de l'element principal (descripcioDe).
 * El peu, el per defecte, sense Compartir: les dades d'una app viuen al
 * dispositiu i una llista privada no té res a compartir (guarda «Identitat
 * privada»). El Connectar no compta.
 * REGLA D'OR 1 (ordre del Mestre, 261004) · La boina taronja amb l'autor real:
 * `article.autoria` { nom, href, avatar, poble } (la forma de l'autoria de
 * PaginaApp), que l'app vestix (autoriaDe de la plataforma per a l'entitat,
 * resolta per identificador). L'esquelet no sap qui ha escrit res i no
 * n'inventa cap: sense `autoria`, la targeta de sempre. L'avatar passa pel
 * filtre de les imatges privades, com la foto.
 */
export function TargetesArticles({
  elements = [], categories = null, etiqueta, pla = false, nivellTargeta = 'h3', commutable = false, textos,
  onTria, onAccioSecundaria, renderMedia, plegades, onPlega, textArticles, buit = null
}) {
  const t = { ...TEXTOS_TARGETES, ...textos };
  const ambSeccions = Array.isArray(categories);
  const llista = (Array.isArray(elements) ? elements : [])
    .filter((element) => element?.article && typeof element.article.id === 'string')
    .map(({ article, categoria }) => ({ id: article.id, categoriaId: article.categoriaId, article, categoria }));

  const pinta = ({ article, categoria }) => {
    const estat = estatDe(article);
    const propi = typeof renderMedia === 'function' ? renderMedia(article) : null;
    const icona = propi || iconaDelQuadrat(article.icona ?? categoria?.icona);
    const boina = boinaDe(article);
    return (
      <UniversalCard
        key={article.id}
        variant={pla ? 'pla' : 'default'}
        headingLevel={ambSeccions ? 'h4' : nivellTargeta}
        author={boina.nom}
        authorHref={boina.href}
        avatarUrl={boina.avatar}
        location={boina.poble}
        title={article.nom}
        subtitle={textDe(article.subtitol)}
        body={entradetaDe(article) || undefined}
        imageUrl={article.imatge || undefined}
        imatgePrivada
        squareBadge={!article.imatge && icona ? { type: 'custom', label: categoria?.nom || article.nom, content: icona } : null}
        labels={[article.insignia, estat === 'normal' ? null : t[estat]]}
        onMainClick={estat === 'desactivat' ? undefined : () => onTria?.(article)}
        premuda={commutable ? estat === 'en-colleccio' : undefined}
        idElement={article.id}
        descripcioAccessible={descripcioDe(article, estat, t) || undefined}
        onAccioSecundaria={typeof onAccioSecundaria === 'function' ? () => onAccioSecundaria(article) : undefined}
        hasFooter
        showShare={false}
        telemetria={SENSE_TELEMETRIA}
      />
    );
  };

  return (
    <GraellaTargetes elements={llista} categories={categories} variant={pla ? 'llista' : 'graella'} etiqueta={etiqueta}
      plegades={plegades} onPlega={onPlega} textArticles={textArticles} buit={buit}>
      {pinta}
    </GraellaTargetes>
  );
}

/**
 * Ordre del Mestre, 261004 (integració final; F04 de Codex: «la Nevera, detall complet sense
 * perdre la commutació») · La FITXA d'un article: la seua pàgina pròpia (PaginaApp), a
 * ?fitxa=<id>, al lloc de la graella (com la lectura del Lector). La mateixa anatomia de la
 * targeta: la boina de qui signa (només si l'app la vestix: sense, PaginaApp signaria «Sóc de
 * Poble», que no l'ha escrit, i no hi ha fitxa), el nom (H1), el subtítol, l'entradeta, l'estat
 * i la insígnia en etiqueta i la foto privada. Tornar la tanca. L'acció principal obri el
 * diàleg de sempre (DetallArticle) damunt de la fitxa. Les dades d'una app viuen al dispositiu:
 * sense Compartir i sense xat comú (objecte={null}), com les targetes.
 */
function FitxaArticle({ article, textos, accio, onTorna, refTitol, children }) {
  const boina = boinaDe(article);
  const estat = estatDe(article);
  return (
    <PaginaApp
      title={article.nom}
      subtitle={textDe(article.subtitol)}
      lead={entradetaDe(article)}
      author={{ nom: boina.nom, href: boina.href, avatar: boina.avatar, poble: boina.poble }}
      labels={[article.insignia, estat === 'normal' ? null : textos[estat]].filter(ambText)}
      heroImage={article.imatge || undefined}
      accioPrincipal={accio}
      onBack={onTorna}
      refTitol={refTitol}
      objecte={null}
      showShare={false}
    >
      {children}
    </PaginaApp>
  );
}

const TEXTOS_CATALEG = Object.freeze({
  buit: 'No hi ha cap article ací',
  buitText: 'Tria una altra categoria o afig-ne un amb el camp de dalt.',
  vista: 'Vista del catàleg',
  graella: 'Graella',
  llista: 'Llista',
  categoria: 'Categoria',
  totes: 'Totes'
});

export function ColumnaCataleg({
  titol = 'Catàleg', categories = [], articles = [], destacats = [], agrupa = true,
  selector = 'pastilles', ambVistes = true, vistaPerDefecte = 'graella',
  onTria, commutable = false, textosEstat, renderMedia, plegades, onPlega, textArticles,
  afegit = null, detall = null, resum = null, primer, tram, textos,
  /* Ordre del Mestre, 261004 · 'targetes': UniversalCard (TargetesArticles). Sense, les rajoles i les files de sempre. */
  forma,
  /* Correcció F3 (261006) · L'avís de l'app, dins del marc (MarcColumna). Sense, el de sempre. */
  avis = null
}) {
  const t = { ...TEXTOS_CATALEG, ...textos };
  const { mida } = useClosaAplicacio();
  const vista = useVistaCataleg(vistaPerDefecte);
  const vistes = useVistesEsquelet({ primer, tram });
  const llista = Array.isArray(articles) ? articles : [];
  const totes = Array.isArray(categories) ? categories : [];
  const perId = new Map(totes.map((categoria) => [categoria.id, categoria]));

  const articleObert = detall && vista.article ? llista.find((article) => article.id === vista.article) || null : null;
  const obriDetall = detall ? (article) => vista.obriArticle(article.id) : undefined;
  const tria = (article) => {
    if (onTria) onTria(article, { obriDetall: () => obriDetall?.(article) });
    else obriDetall?.(article);
  };

  /* El filtre de la URL; els destacats només amb totes les categories. */
  const filtrats = vista.categoria ? llista.filter((article) => article.categoriaId === vista.categoria) : llista;
  const delFiltre = vista.categoria ? totes.filter((categoria) => categoria.id === vista.categoria) : totes;
  const grupsDestacats = agrupa && !vista.categoria && Array.isArray(destacats)
    ? destacats.filter((d) => d && typeof d.id === 'string' && Array.isArray(d.articles) && d.articles.length) : [];
  /* Sense categories ni destacats no hi ha res a agrupar: una sola peça plana,
     no una secció «Altres» inventada amb tot el catàleg. */
  const categoriesCos = agrupa && (totes.length > 0 || grupsDestacats.length > 0) ? [
    ...grupsDestacats.map((d, i) => ({ id: `destacat-${d.id}`, nom: d.nom, icona: d.icona, visible: true, ordre: -grupsDestacats.length + i })),
    ...delFiltre
  ] : null;
  const articlesCos = [
    ...grupsDestacats.flatMap((d) => d.articles.map((article) => ({ ...article, categoriaId: `destacat-${d.id}` }))),
    ...filtrats
  ];
  const Peca = vista.vista === 'llista' ? LlistaArticles : GraellaArticles;
  /* Les targetes: la mateixa llista del cos, cada article amb la seua secció pròpia (la icona del
     quadrat), també els destacats, que al cos porten la secció «Recents». */
  const ambTargetes = forma === 'targetes';
  const propis = ambTargetes ? [...grupsDestacats.flatMap((d) => d.articles), ...filtrats] : [];

  /* Ordre del Mestre, 261004 (integració final) · La fitxa (FitxaArticle): només amb les
     targetes, amb detall (qui la munta en té les accions) i amb la boina vestida per l'app. */
  const teFitxa = (article) => ambTargetes && Boolean(detall) && Boolean(boinaDe(article).nom);
  const candidata = ambTargetes && vista.fitxa ? llista.find((article) => article.id === vista.fitxa) || null : null;
  const articleFitxa = candidata && teFitxa(candidata) ? candidata : null;
  const textosFitxa = { ...TEXTOS_TARGETES, ...textosEstat };
  const textAccioFitxa = detall?.textAccepta || (typeof detall?.etiquetaVariants === 'string' ? detall.etiquetaVariants : null) || 'Opcions';
  /* El focus: en obrir la fitxa des de l'app, a l'H1; en tancar-la, a la targeta de l'article
     (si es veu). Una fitxa que ja és a la URL en muntar (un enllaç, una recàrrega) no mou el
     focus: és del canvi de ruta, i encastat podria ser d'un camp de l'amfitrió. */
  const titolFitxa = useRef(null);
  const retornFitxa = useRef(null);
  const muntada = useRef(false);
  const idFitxa = articleFitxa?.id ?? null;
  /* useEffect, no de layout: el Dialeg del detall (un fill) torna el focus on era en tancar-se
     en el seu efecte, que s'executa abans que el d'esta columna; així l'H1 mana. */
  useEffect(() => {
    const primera = !muntada.current;
    muntada.current = true;
    if (idFitxa) {
      if (!primera) titolFitxa.current?.focus({ preventScroll: true });
      return;
    }
    const desti = retornFitxa.current;
    retornFitxa.current = null;
    desti?.regio?.querySelector(`[data-element="${desti.id}"]`)?.focus({ preventScroll: true });
  }, [idFitxa]);
  const tancaFitxa = () => {
    retornFitxa.current = { id: idFitxa, regio: titolFitxa.current?.closest('.sdp-marc-columna__cos') || null };
    vista.tancaFitxa();
  };
  /* Arreglo del verificador (ordre del Mestre, 261004, «la fitxa de La compra no és compartible
     entre amplades») · La fitxa és contingut d'esta columna, no un diàleg com ?article=. En
     estret, si el camí obri l'altra columna (La compra: primer la col·lecció, el catàleg és el
     tram), el panell «Per comprar» la tapava: un enllaç fet en ample (el camí sense tram), una
     recàrrega o una finestra que s'estreteix amb la fitxa oberta. Es canonitza al camí del
     catàleg (vistes.js, replace) abans de pintar; tancar el panell no valdria, perquè el
     PanellEstret de la plataforma torna a obrir el que demana la ruta. En estret el diàleg del
     detall ja s'obri al camí del catàleg (useObriDetall de la Nevera). En tauleta i escriptori
     les dues columnes es veuen: el camí de sempre, byte a byte. */
  const fitxaTapada = mida === 'estret' && vistes.veient !== 'cataleg';
  useLayoutEffect(() => {
    if (idFitxa && fitxaTapada) vistes.cataleg.fitxa(idFitxa, { replace: true });
  }, [idFitxa, fitxaTapada, vistes]);

  const eines = (
    <>
      {selector ? (
        <SelectorCategoria categories={totes} valor={vista.categoria} onCanvi={vista.triaCategoria}
          forma={selector === 'desplegable' ? 'desplegable' : 'pastilles'} etiqueta={t.categoria} textTotes={t.totes} />
      ) : null}
      {ambVistes ? (
        <PillToggle etiqueta={t.vista} valor={vista.vista} onCanvi={vista.triaVista} opcions={[
          { valor: 'graella', text: t.graella, icona: <LayoutGrid size={20} aria-hidden="true" focusable="false" /> },
          { valor: 'llista', text: t.llista, icona: <List size={20} aria-hidden="true" focusable="false" /> }
        ]} />
      ) : null}
      {afegit ? <AfegitRapid {...afegit} onTria={afegit.onTria || tria} /> : null}
    </>
  );
  const peu = mida === 'estret' && resum ? (
    <BarraResum {...resum} forma="peu" href={vistes.colleccio.href} onObri={vistes.colleccio.vesA} />
  ) : null;

  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} />} eines={selector || ambVistes || afegit ? eines : null}
      peu={peu} avis={avis} etiqueta={titol}>
      {articleFitxa ? (
        <FitxaArticle
          article={articleFitxa}
          textos={textosFitxa}
          accio={<Boto varietat="primari" onClick={() => vista.obriArticle(articleFitxa.id)}>{textAccioFitxa}</Boto>}
          onTorna={tancaFitxa}
          refTitol={titolFitxa}
        >
          {detall.contingutDe?.(articleFitxa) || null}
        </FitxaArticle>
      ) : ambTargetes ? (
        <TargetesArticles
          elements={articlesCos.map((article, i) => ({ article, categoria: perId.get(propis[i]?.categoriaId) || null }))}
          categories={categoriesCos}
          etiqueta={titol}
          pla={vista.vista === 'llista'}
          onTria={tria}
          onAccioSecundaria={obriDetall}
          commutable={commutable}
          textos={textosEstat}
          renderMedia={renderMedia}
          plegades={plegades}
          onPlega={onPlega}
          textArticles={textArticles}
          buit={<EstatBuit titol={t.buit}>{t.buitText}</EstatBuit>}
        />
      ) : (
        <Peca
          articles={articlesCos}
          categories={categoriesCos}
          etiqueta={titol}
          onTria={tria}
          onAccioSecundaria={obriDetall}
          commutable={commutable}
          textos={textosEstat}
          renderMedia={renderMedia}
          plegades={plegades}
          onPlega={onPlega}
          textArticles={textArticles}
          buit={<EstatBuit titol={t.buit}>{t.buitText}</EstatBuit>}
        />
      )}
      {detall ? (
        <DetallArticle
          obert={Boolean(articleObert)}
          article={articleObert}
          categoria={perId.get(articleObert?.categoriaId) || null}
          variants={articleObert ? detall.variantsDe?.(articleObert) || [] : []}
          inicial={articleObert ? detall.inicialDe?.(articleObert) || null : null}
          triaDirecta={articleObert ? Boolean(typeof detall.triaDirecta === 'function' ? detall.triaDirecta(articleObert) : detall.triaDirecta) : false}
          ambQuantitat={detall.ambQuantitat ?? true}
          ambNota={detall.ambNota ?? true}
          etiquetaVariants={articleObert && typeof detall.etiquetaVariants === 'function' ? detall.etiquetaVariants(articleObert) : detall.etiquetaVariants}
          etiquetaNota={detall.etiquetaNota}
          unitat={detall.unitat}
          textAccepta={detall.textAccepta}
          renderMedia={renderMedia}
          onTanca={vista.tancaArticle}
          onAccepta={(valors, article) => {
            detall.onAccepta?.(valors, article);
            vista.tancaArticle();
          }}
          accions={articleObert ? (
            <>
              {detall.accionsDe?.(articleObert, vista.tancaArticle) || null}
              {/* Ordre del Mestre, 261004 (integració final) · La porta a la fitxa de l'article, si
                  en té i no s'hi és ja. */}
              {teFitxa(articleObert) && vista.fitxa !== articleObert.id ? (
                <Boto varietat="secundari" icona={FileText} onClick={() => vista.obriFitxa(articleObert.id)}>Fitxa de l’article</Boto>
              ) : null}
            </>
          ) : null}
        >
          {articleObert ? detall.contingutDe?.(articleObert) || null : null}
        </DetallArticle>
      ) : null}
    </MarcColumna>
  );
}
