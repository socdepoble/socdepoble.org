/**
 * Lector de notícies · la columna del DETALL (el panell ample): les
 * notícies de la carpeta o de la font o, amb ?article=<id>, el lector
 * immersiu (Lector.jsx), que n'ocupa el lloc.
 *
 * Les targetes horitzontals de la vista «Magazine» de Feedly són les files
 * de LlistaArticles de Pedra Seca (vista «Revista», per defecte): la
 * miniatura apaïsada 16:9 (la imatge, si passa el filtre de mitjans de
 * l'amfitrió, o el marcador de Pedra Seca), el títol en negreta, «font ·
 * fragment» i l'hora relativa a la dreta. La vista «Targetes» són les rajoles
 * de GraellaArticles amb la imatge 16:9 damunt del títol, sense fragment
 * (DISSENY §7g). El 16:9 és la variant `panoramica` de les dues peces: la
 * EXCEPCIÓ a la regla 1:1 (Pedra Seca §8) que el Mestre va autoritzar el
 * 261003 només per a les imatges del Lector (DISSENY §7, decisions finals).
 * Una notícia no llegida porta la insígnia «Nou»; una de desada, l'estat de
 * col·lecció («Desat per a després»). A «Hui» i «Per a després», les
 * notícies van per seccions de categoria (SeccionsCategoria).
 *
 * En estret el mig no es veu al costat: les eines del detall porten també
 * l'enllaç a les fonts de la carpeta (el filtre per font) i «Marca-ho tot
 * com a llegit», el ✓ de la capçalera de la llista de Feedly al mòbil.
 *
 * En tancar el lector, el focus torna a la fila de l'article i la graella
 * torna on era (scroll), però només si és la mateixa llista: una altra
 * carpeta, una altra font o una altra vista comencen de dalt. Cap classe
 * pròpia.
 */
import { useLayoutEffect, useRef } from 'react';
import { LayoutGrid, List, Rss } from 'lucide-react';
import { Link } from '../../../app/contexts/RouterContext';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import {
  Boto, Carregant, EstatBuit, GraellaArticles, LlistaArticles, MarcColumna, PillToggle
} from '../../../components/PedraSeca/index.js';
import { useVistaCataleg } from '../../comu/esquelet/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { CARPETES_FIXES, DESPRES, HUI, articlesDeCarpeta, horaRelativa, senseFinal } from '../nucli/index.js';
import { MarcaTotLlegit, ObridorCarpetes } from './comunes.jsx';
import { useVistaLector } from './context.js';
import { iconaDeCategoria } from './icones.js';
import { Lector, focusLliure } from './Lector.jsx';
import { NOTICIES, TRAM_FONTS, useSeleccio } from './navegacio.js';

const TEXTOS_ESTAT = Object.freeze({ 'en-colleccio': 'Desat per a després' });
const textNoticies = (n) => `${n} ${n === 1 ? 'notícia' : 'notícies'}`;

const BUITS = Object.freeze({
  [HUI]: ['Hui encara no hi ha res nou', 'Les notícies de les últimes 24 hores de les fonts que seguixes apareixeran ací.'],
  [DESPRES]: ['No has desat res per a després', 'Obri una notícia i toca «Desa per a després» per a guardar-la ací.'],
  altres: ['No hi ha cap notícia ací', 'Quan esta font o esta carpeta publiquen, ho voràs ací.']
});

/* La llista que es veu: el retorn del lector només val per a la mateixa. */
const clauDeLlista = (seleccio, vista) => [seleccio.carpeta, seleccio.fontId || '', vista.vista].join('|');

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
  const { lector, noticies, ara, desfas } = useVistaLector();
  const { mida } = useClosaAplicacio();
  const seleccio = useSeleccio(params);
  const cos = useRef(null);
  const titol = seleccio.font?.nom || seleccio.nomCarpeta || 'Notícies';
  const clau = clauDeLlista(seleccio, vista);

  /* Tornant del lector: la graella on era i el focus a la fila de l'article. */
  useLayoutEffect(() => {
    const desti = retorn.current;
    if (!desti || !cos.current) return;
    /* S'ha canviat de llista amb l'article obert: res a restaurar. */
    if (desti.clau !== clau) {
      retorn.current = null;
      return;
    }
    const fila = cos.current.querySelector(`[data-article="${desti.id}"]`);
    if (!fila && noticies.estat !== 'llest') return;
    retorn.current = null;
    const regio = cos.current.parentElement;
    if (regio) regio.scrollTop = desti.scroll;
    if (focusLliure(cos.current, cos.current.closest('section'))) (fila || regio)?.focus({ preventScroll: true });
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
    const revista = vista.vista === 'llista';
    const agrupa = CARPETES_FIXES.includes(seleccio.carpeta) && !seleccio.fontId;
    const llista = articlesDeCarpeta({ ...noticies, estat: lector.estat, carpeta: seleccio.carpeta, fontId: seleccio.fontId, ara }) || [];
    const articles = llista.map((article) => {
      const font = fontsPerId.get(article.fontId);
      return {
        id: article.id,
        nom: senseFinal(article.titol),
        categoriaId: agrupa ? font?.categoriaId || undefined : undefined,
        secundari: (revista ? [font?.nom, article.resum] : [font?.nom]).filter(Boolean).join(' · ') || undefined,
        valor: article.data ? horaRelativa(article.data, ara, desfas) : undefined,
        imatge: article.imatge || undefined,
        estat: desats.has(article.id) ? 'en-colleccio' : 'normal',
        insignia: llegits.has(article.id) ? undefined : 'Nou'
      };
    });
    const categories = agrupa ? noticies.categories.map((categoria) => ({
      id: categoria.id, nom: categoria.nom, icona: iconaDeCategoria(categoria.icona), visible: true, ordre: categoria.ordre
    })) : null;
    const [titolBuit, textBuit] = BUITS[CARPETES_FIXES.includes(seleccio.carpeta) && !seleccio.fontId ? seleccio.carpeta : 'altres'];
    const Peca = revista ? LlistaArticles : GraellaArticles;
    contingut = (
      <Peca
        panoramica
        articles={articles}
        categories={categories}
        etiqueta={titol}
        textos={TEXTOS_ESTAT}
        textArticles={textNoticies}
        onTria={(article) => {
          const regio = cos.current?.parentElement;
          retorn.current = { id: article.id, scroll: regio ? regio.scrollTop : 0, clau };
          vista.obriArticle(article.id);
        }}
        buit={<EstatBuit titol={titolBuit}>{textBuit}</EstatBuit>}
      />
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
