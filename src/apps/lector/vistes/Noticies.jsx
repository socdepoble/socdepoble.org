/**
 * Lector de notícies · la columna del DETALL (el panell ample): les
 * notícies de la carpeta o de la font o, amb ?article=<id>, el lector
 * immersiu (Lector.jsx), que n'ocupa el lloc.
 *
 * Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes») ·
 * Cada notícia és una UniversalCard, la targeta de tot Sóc de Poble, dins de
 * GraellaTargetes de Pedra Seca (la graella de sempre o la columna de les
 * targetes planes). Les files i les rajoles pròpies (LlistaArticles,
 * GraellaArticles) i la variant 16:9 ja no s'hi fan servir.
 *   vista «Targetes»  la targeta de sempre, en la graella
 *   vista «Revista»   la targeta plana (variant 'pla'), en columna
 * La targeta porta tota l'anatomia: la boina taronja amb la font (enllaça a
 * les seues notícies) i la data absoluta, la imatge, el títol, el resum, les
 * etiquetes i el peu amb les quatre accions per defecte. El Mestre decidirà
 * què s'apaga. Una notícia és un contingut de fora:
 *   · la imatge i el logo de la font passen pel filtre de mitjans de
 *     l'amfitrió i es demanen sense referent (imatgePrivada);
 *   · la data no porta al Calendari (onDateTime={false});
 *   · cap xat comú on comentar-la (objecte={null}, useAccions);
 *   · el Connectar no compta a la telemetria ({ comptar: false }).
 * Una notícia no llegida porta l'etiqueta «Nou»; una de desada, «Desat per a
 * després». A «Hui» i «Per a després», les notícies van per seccions de
 * categoria (SeccionsCategoria, h3) i el títol de cada targeta baixa a h4.
 *
 * En estret el mig no es veu al costat: les eines del detall porten també
 * l'enllaç a les fonts de la carpeta (el filtre per font) i «Marca-ho tot
 * com a llegit», el ✓ de la capçalera de la llista de Feedly al mòbil.
 *
 * En tancar el lector, el focus torna a la targeta de l'article (el seu
 * element principal, [data-element]) i la graella torna on era (scroll),
 * però només si és la mateixa llista: una altra carpeta, una altra font o una
 * altra vista comencen de dalt. Cap classe pròpia.
 *
 * Ordre del Mestre, 261004 (integració final; F05 de Codex i R1 de la 1045) ·
 * L'element principal de la targeta és un enllaç de veres al detall
 * (mainHref: la ruta canònica de la llista amb ?article=<id>, rutaArticle de
 * l'esquelet). El peu el fa servir: Compartir envia el detall, no la llista,
 * amb la base del router (navegador) o l'origen canònic (memòria). El clic
 * normal només apunta on tornar (retorn, focus i scroll) i navega el Link,
 * una sola vegada; Ctrl/Cmd/clic del mig obrin el detall en una pestanya nova.
 * La ruta és la canònica (/noticies/<carpeta>[/<font>]): des de l'entrada de
 * l'app (/noticies) ja no cal canonitzar després d'obrir.
 */
import { useLayoutEffect, useRef } from 'react';
import { LayoutGrid, List, Rss } from 'lucide-react';
import { Link } from '../../../app/contexts/RouterContext';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import {
  Boto, Carregant, EstatBuit, GraellaTargetes, MarcColumna, PillToggle, UniversalCard
} from '../../../components/PedraSeca/index.js';
import { useVistaCataleg } from '../../comu/esquelet/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { CARPETES_FIXES, DESPRES, HUI, articlesDeCarpeta, dataDeBoina, dataLlarga, senseFinal } from '../nucli/index.js';
import { MarcaTotLlegit, ObridorCarpetes } from './comunes.jsx';
import { useVistaLector } from './context.js';
import { iconaDeCategoria } from './icones.js';
import { CLOSCA, Lector, focusLliure } from './Lector.jsx';
import { NOTICIES, TRAM_FONTS, useSeleccio } from './navegacio.js';

const textNoticies = (n) => `${n} ${n === 1 ? 'notícia' : 'notícies'}`;

/* Les etiquetes d'estat, sempre en text (mai només pel color). */
const NOU = Object.freeze({ text: 'Nou', className: 'sdp-badge-accent' });
const DESAT = Object.freeze({ text: 'Desat per a després', className: 'sdp-badge-category' });
/* Les apps no entren a la telemetria (frontera.test.js): el Connectar no compta. */
const SENSE_TELEMETRIA = Object.freeze({ comptar: false });

/* Ordre del Mestre, 261004 (auditoria 0605, l'estat al lector de pantalla) ·
   L'element principal de la targeta només porta el títol: les etiquetes d'estat
   («Nou», «Desat per a després») les diu la seua descripció accessible, com fa
   l'esquelet per a la Nevera (descripcioDe de ColumnaCataleg). Sense cap estat,
   cap descripció. */
const descripcioDeNoticia = (etiquetes) => etiquetes.filter(Boolean).map((etiqueta) => etiqueta.text).join(', ') || undefined;

const BUITS = Object.freeze({
  [HUI]: ['Hui encara no hi ha res nou', 'Les notícies de les últimes 24 hores de les fonts que seguixes apareixeran ací.'],
  [DESPRES]: ['No has desat res per a després', 'Obri una notícia i toca «Desa per a després» per a guardar-la ací.'],
  altres: ['No hi ha cap notícia ací', 'Quan esta font o esta carpeta publiquen, ho voràs ací.']
});

/* La llista que es veu: el retorn del lector només val per a la mateixa. */
const clauDeLlista = (seleccio, vista) => [seleccio.carpeta, seleccio.fontId || '', vista.vista].join('|');

/* Ordre del Mestre, 261004 (integració final; F04 de Codex i R4 de la 1045) · L'anatomia
   sencera de la targeta de notícia, amb dades reals i mai inventades:
     · boina: la font (enllaçada a les seues notícies) o, sense font coneguda, l'autor de
       l'article, sense enllaç;
     · subtítol: la secció de la font (el nom de la seua categoria) i, si la boina és la font,
       l'autor de l'article («Cultura i festes · La colla»); si no n'hi ha cap dels dos, el nom
       de la font. Sense font, la data llarga de l'article.
   EXCEPCIÓ DE DADES EXTERNES ABSENTS (documentada): una notícia sense font ni autor no porta
   boina. Ni el nom en blanc ni «Sóc de Poble», que no l'ha escrita: la data passa al subtítol
   i la pastilla no es pinta (showDateTime={false}), de manera que la capçalera taronja no ix
   buida. */
function anatomiaDeNoticia(article, font, nomSeccio, desfas) {
  const autor = font?.nom || article.autor || '';
  const subtitol = font
    ? [nomSeccio, article.autor].filter(Boolean).join(' · ') || font.nom
    : dataLlarga(article.data, desfas);
  return { autor: autor || undefined, ambBoina: autor !== '', subtitol: subtitol || undefined };
}

function EnllacHui({ children }) {
  const { ruta } = useVistaLector();
  return <Link to={ruta(NOTICIES, HUI)} className="sdp-boto sdp-boto--secundari">{children}</Link>;
}

/* En estret: les fonts de la carpeta (el mig), on es tria una font. */
function EnllacFonts({ carpeta }) {
  const { ruta } = useVistaLector();
  return (
    <Link to={ruta(NOTICIES, carpeta, TRAM_FONTS)} className="sdp-boto sdp-boto--secundari">
      <Rss size={20} aria-hidden="true" focusable="false" />
      <span>Fonts</span>
    </Link>
  );
}

function GraellaNoticies({ params, vista, retorn }) {
  const { lector, noticies, ara, desfas, ruta } = useVistaLector();
  const { mida } = useClosaAplicacio();
  const seleccio = useSeleccio(params);
  const cos = useRef(null);
  const titol = seleccio.font?.nom || seleccio.nomCarpeta || 'Notícies';
  const clau = clauDeLlista(seleccio, vista);

  /* Tornant del lector: la graella on era i el focus a la targeta de l'article. */
  useLayoutEffect(() => {
    const desti = retorn.current;
    if (!desti || !cos.current) return;
    /* S'ha canviat de llista amb l'article obert: res a restaurar. */
    if (desti.clau !== clau) {
      retorn.current = null;
      return;
    }
    const targeta = cos.current.querySelector(`[data-element="${desti.id}"]`);
    if (!targeta && noticies.estat !== 'llest') return;
    retorn.current = null;
    const regio = cos.current.parentElement;
    if (regio) regio.scrollTop = desti.scroll;
    /* Ordre del Mestre, 261004 (integració final) · «Si era dins de la closca», com en obrir (Lector.jsx). */
    if (focusLliure(cos.current, cos.current.closest(CLOSCA) || cos.current.closest('section'))) (targeta || regio)?.focus({ preventScroll: true });
  });

  let contingut;
  if (noticies.estat === 'carregant') {
    contingut = <Carregant etiqueta="Carregant les notícies…" />;
  } else if (noticies.estat === 'error') {
    contingut = (
      <EstatBuit titol="No s’han pogut carregar les notícies" accio={<Boto varietat="secundari" onClick={noticies.rellegix}>Torna-ho a provar</Boto>}>
        Les fonts no han respost. Pot ser cosa d’un moment.
      </EstatBuit>
    );
  } else if (!seleccio.carpetaExistix || !seleccio.fontExistix) {
    contingut = (
      <EstatBuit titol={seleccio.carpetaExistix ? 'Esta font no existix' : 'Esta carpeta no existix'} accio={<EnllacHui>Ves a Hui</EnllacHui>}>
        Potser ja no és del poble, o l’enllaç és d’una altra adreça.
      </EstatBuit>
    );
  } else {
    const llegits = new Set(lector.estat.llegits);
    const desats = new Set(lector.estat.despres.map((desat) => desat.id));
    const fontsPerId = new Map(noticies.fonts.map((font) => [font.id, font]));
    const seccions = new Map(noticies.categories.map((categoria) => [categoria.id, categoria.nom]));
    /* La llista canònica (F05): la de la carpeta i, si n'hi ha, la font. */
    const camiDeLaLlista = seleccio.fontId ? ruta(NOTICIES, seleccio.carpeta, seleccio.fontId) : ruta(NOTICIES, seleccio.carpeta);
    const revista = vista.vista === 'llista';
    const agrupa = CARPETES_FIXES.includes(seleccio.carpeta) && !seleccio.fontId;
    const llista = articlesDeCarpeta({ ...noticies, estat: lector.estat, carpeta: seleccio.carpeta, fontId: seleccio.fontId, ara }) || [];
    const elements = llista.map((article) => ({
      id: article.id,
      categoriaId: agrupa ? fontsPerId.get(article.fontId)?.categoriaId || undefined : undefined,
      article
    }));
    const categories = agrupa ? noticies.categories.map((categoria) => ({
      id: categoria.id, nom: categoria.nom, icona: iconaDeCategoria(categoria.icona), visible: true, ordre: categoria.ordre
    })) : null;
    const [titolBuit, textBuit] = BUITS[CARPETES_FIXES.includes(seleccio.carpeta) && !seleccio.fontId ? seleccio.carpeta : 'altres'];
    /* On tornar en tancar el lector. Derogat per l'ordre del Mestre, 261004 (integració final,
       F05) · Ja no navega: ho fa el Link de la targeta (mainHref), una sola vegada. Si la ruta
       del detall no es pot fer (fora de la base), el botó de sempre i obriArticle. */
    const apunta = (id) => {
      const regio = cos.current?.parentElement;
      retorn.current = { id, scroll: regio ? regio.scrollTop : 0, clau };
    };
    const pintaTargeta = ({ article }) => {
      const font = fontsPerId.get(article.fontId) || null;
      const boina = dataDeBoina(article.data, desfas);
      const etiquetes = [llegits.has(article.id) ? null : NOU, desats.has(article.id) ? DESAT : null];
      const anatomia = anatomiaDeNoticia(article, font, font ? seccions.get(font.categoriaId) : null, desfas);
      const detallDeLArticle = vista.rutaArticle(article.id, camiDeLaLlista);
      return (
        <UniversalCard
          key={article.id}
          variant={revista ? 'pla' : 'default'}
          headingLevel={agrupa ? 'h4' : 'h3'}
          title={senseFinal(article.titol)}
          subtitle={anatomia.subtitol}
          body={article.resum || undefined}
          /* Verificació «lector-nevera», D3 (REGLA D'OR 1) · Sense font coneguda (una notícia
             desada d'una font que el port ja no servix), l'autor de l'article, sense enllaç,
             com al lector (Lector.jsx). Mai «Sóc de Poble», que no l'ha escrita. */
          author={anatomia.autor}
          authorHref={font ? ruta(NOTICIES, font.categoriaId || HUI, font.id) : undefined}
          avatarUrl={font?.imatge || undefined}
          imageUrl={article.imatge || undefined}
          imatgePrivada
          time={boina?.time}
          date={boina?.date}
          dateTime={boina ? article.data : undefined}
          showDateTime={anatomia.ambBoina ? undefined : false}
          onDateTime={false}
          labels={etiquetes}
          objecte={null}
          mainHref={detallDeLArticle || undefined}
          onMainClick={detallDeLArticle ? () => apunta(article.id) : () => {
            apunta(article.id);
            vista.obriArticle(article.id);
          }}
          idElement={article.id}
          descripcioAccessible={descripcioDeNoticia(etiquetes)}
          hasFooter
          telemetria={SENSE_TELEMETRIA}
        />
      );
    };
    contingut = (
      <GraellaTargetes
        elements={elements}
        categories={categories}
        variant={revista ? 'llista' : 'graella'}
        etiqueta={titol}
        textArticles={textNoticies}
        buit={<EstatBuit titol={titolBuit}>{textBuit}</EstatBuit>}
      >
        {pintaTargeta}
      </GraellaTargetes>
    );
  }

  const ambMig = mida === 'estret' && seleccio.carpetaExistix;
  const eines = (
    <>
      <ObridorCarpetes />
      {ambMig ? <EnllacFonts carpeta={seleccio.carpeta} /> : null}
      {ambMig ? <MarcaTotLlegit carpeta={seleccio.carpeta} fontId={seleccio.fontId} /> : null}
      <PillToggle etiqueta="Vista de les notícies" valor={vista.vista} onCanvi={vista.triaVista} opcions={[
        { valor: 'llista', text: 'Revista', icona: <List size={20} aria-hidden="true" focusable="false" /> },
        { valor: 'graella', text: 'Targetes', icona: <LayoutGrid size={20} aria-hidden="true" focusable="false" /> }
      ]} />
    </>
  );
  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} />} eines={eines} etiqueta={titol}>
      <div ref={cos}>{contingut}</div>
    </MarcColumna>
  );
}

export function ColumnaNoticies({ params }) {
  const vista = useVistaCataleg('llista');
  /* On tornar en tancar el lector: { id, scroll, clau }. Viu ací perquè la columna no es desmunta. */
  const retorn = useRef(null);
  if (vista.article) return <Lector key={vista.article} id={vista.article} onTanca={() => vista.tancaArticle()} />;
  return <GraellaNoticies params={params} vista={vista} retorn={retorn} />;
}
