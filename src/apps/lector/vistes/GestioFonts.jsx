/**
 * Lector de notícies · l'entrada «Fonts» (el «Follow sources» de Feedly),
 * sobre l'esquelet comú de catàleg i col·lecció: el patró de La Compra.
 *
 *   ColumnaCatalegFonts  el DETALL: totes les fonts del poble per categoria
 *                        (ColumnaCataleg). Tocar-ne una la seguix o la deixa
 *                        de seguir (aria-pressed, «La seguixes»)
 *   ColumnaSeguides      el MIG: les que seguixes, amb les no llegides; cada
 *                        una porta a les seues notícies. Davant, si n'hi ha,
 *                        les fonts que ha afegit la persona (FontsPersonals)
 * Cap classe pròpia.
 */
import { useEffect, useRef, useState } from 'react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { Alerta, Boto, Carregant, EstatBuit, LiniesColleccio, MarcColumna } from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, useVistesEsquelet } from '../../comu/esquelet/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { HUI, llocDe, seguix } from '../nucli/index.js';
import { NavTargetes } from './comunes.jsx';
import { useVistaLector } from './context.js';
import { iconaDeCategoria } from './icones.js';
import { NOTICIES } from './navegacio.js';

const textFonts = (n) => `${n} ${n === 1 ? 'font' : 'fonts'}`;

const TEXTOS_CATALEG = Object.freeze({
  buit: 'No hi ha cap font',
  buitText: 'El poble encara no n’ha declarat cap.',
  vista: 'Vista de les fonts',
  graella: 'Targetes',
  llista: 'Llista',
  categoria: 'Categoria',
  totes: 'Totes'
});

const TEXTOS_PERSONALS = Object.freeze({ lleva: (nom) => `Lleva la font ${nom}` });

/* SN (261003) · Les fonts que la persona ha afegit des del Snippet Curador
   del Bloc (fontsPersonals.js): pendents del connector, perquè l'app no baixa
   res per ella mateixa, i per això sense cap notícia. Es poden llevar; en una
   pestanya lectora el magatzem no deixa escriure i no hi ha paperera.
   Van DAVANT de les seguides (correcció SN-R3): el snippet porta ací després
   d'afegir-ne una, i en estret, darrere de les fonts del poble, quedaria
   dues pantalles més avall, fora de la vista. */
function FontsPersonals() {
  const { lector, personals, noticies } = useVistaLector();
  const arrel = useRef(null);
  /* Correcció SN-R6 (el patró C16 de /connectar) · Llevar-ne una desmunta la
     paperera premuda: el focus va a la de la línia següent, o a l'anterior,
     o, si no en queda cap, a la columna (una regió amb nom que s'enfoca).
     Mai al <body> (WCAG 2.4.3). Es resol quan el DOM ja és el nou. */
  const [focusDesti, setFocusDesti] = useState(null);
  useEffect(() => {
    if (!focusDesti) return;
    const linia = [...(arrel.current?.querySelectorAll('[data-linia]') || [])].find((node) => node.dataset.linia === focusDesti.id);
    (linia?.querySelector('button') || focusDesti.regio)?.focus();
    setFocusDesti(null);
  }, [focusDesti]);

  if (personals.fonts.length === 0) return null;
  const nomDe = new Map(noticies.categories.map((categoria) => [categoria.id, categoria.nom]));
  const linies = personals.fonts.map((font) => ({
    id: font.id,
    nom: font.nom,
    detall: ['Pendent del connector', llocDe(font.url), nomDe.get(font.categoriaId)].filter(Boolean).join(' · ')
  }));
  const lleva = async (linia) => {
    const index = personals.fonts.findIndex((font) => font.id === linia.id);
    const veina = personals.fonts[index + 1] || personals.fonts[index - 1] || null;
    const regio = arrel.current?.closest('[role="region"]') || null;
    if (await personals.lleva(linia.id)) setFocusDesti({ id: veina?.id ?? null, regio });
  };
  return (
    <div ref={arrel}>
      <Alerta to="info" titol="Les teues fonts" viva={false}>
        L’app no baixa res per ella mateixa: les seues notícies arribaran quan l’amfitrió o el servidor les servisquen.
      </Alerta>
      <LiniesColleccio
        linies={linies}
        etiqueta="Les teues fonts"
        textos={TEXTOS_PERSONALS}
        onLleva={lector.mode === 'lectora' ? undefined : lleva}
      />
      {personals.error ? (
        /* Correcció SN-R9 · Neutre: pot haver fallat la lectura o l'escriptura. */
        <Alerta to="error" titol="Les teues fonts no estan disponibles">Torna a obrir el lector i prova-ho de nou.</Alerta>
      ) : null}
    </div>
  );
}

/* Mentre el port no respon, o si falla, el marc de la columna ho diu. */
function EstatDelPort({ titol }) {
  const { noticies } = useVistaLector();
  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} />} etiqueta={titol}>
      {noticies.estat === 'error' ? (
        <EstatBuit titol="No s’han pogut carregar les fonts" accio={<Boto varietat="secundari" onClick={noticies.rellegix}>Torna-ho a provar</Boto>}>
          Pot ser cosa d’un moment.
        </EstatBuit>
      ) : <Carregant etiqueta="Carregant les fonts…" />}
    </MarcColumna>
  );
}

export function ColumnaCatalegFonts() {
  const { lector, noticies } = useVistaLector();
  if (noticies.estat !== 'llest') return <EstatDelPort titol="Fonts del poble" />;
  const fonts = noticies.fonts.map((font) => ({
    id: font.id,
    nom: font.nom,
    categoriaId: font.categoriaId || undefined,
    secundari: font.descripcio || undefined,
    imatge: font.imatge || undefined,
    estat: seguix(lector.estat, font.id) ? 'en-colleccio' : 'normal'
  }));
  const categories = noticies.categories.map((categoria) => ({
    id: categoria.id, nom: categoria.nom, icona: iconaDeCategoria(categoria.icona), visible: true, ordre: categoria.ordre
  }));
  const seguides = fonts.filter((font) => font.estat === 'en-colleccio').length;
  return (
    <ColumnaCataleg
      titol="Fonts del poble"
      categories={categories}
      articles={fonts}
      vistaPerDefecte="llista"
      commutable
      textosEstat={{ 'en-colleccio': 'La seguixes' }}
      onTria={(font) => lector.accions.commutaSeguiment(font.id)}
      textArticles={textFonts}
      resum={{ etiqueta: 'Les que seguixes', comptador: seguides, textComptador: textFonts }}
      textos={TEXTOS_CATALEG}
    />
  );
}

export function ColumnaSeguides() {
  const { lector, noticies, ruta } = useVistaLector();
  const { mida } = useClosaAplicacio();
  const vistes = useVistesEsquelet();
  if (noticies.estat !== 'llest') return <EstatDelPort titol="Les que seguixes" />;
  const llegits = new Set(lector.estat.llegits);
  const perFont = new Map();
  for (const article of noticies.articles) {
    if (!llegits.has(article.id)) perFont.set(article.fontId, (perFont.get(article.fontId) || 0) + 1);
  }
  const seguides = noticies.fonts.filter((font) => seguix(lector.estat, font.id)).map((font) => {
    const n = perFont.get(font.id) || 0;
    return { ...font, comptador: n, secundari: n > 0 ? 'sense llegir' : 'tot llegit', imatge: font.imatge || undefined };
  });
  return (
    <MarcColumna
      capcalera={<AppGridColumn titol="Les que seguixes" />}
      eines={mida === 'estret' ? <Boto varietat="secundari" onClick={vistes.cataleg.vesA}>Totes les fonts</Boto> : null}
      etiqueta="Les que seguixes"
    >
      <FontsPersonals />
      <NavTargetes
        elements={seguides}
        etiqueta="Les que seguixes"
        actiu={null}
        camiDe={(font) => ruta(NOTICIES, font.categoriaId || HUI, font.id)}
        buit={<EstatBuit titol="No en seguixes cap">Tria les fonts del poble que vols llegir.</EstatBuit>}
      />
    </MarcColumna>
  );
}
