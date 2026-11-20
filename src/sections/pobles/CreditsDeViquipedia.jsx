/**
 * CreditsDeViquipedia.jsx · Fase 3a de l'eina de pobles nous (disseny
 * nit/viquipedia_disseny.md §4.7) · «D'on ve esta fitxa»: l'atribució
 * visible del que la Viquipèdia ha omplit en este navegador.
 *   · el text: extracte de l'article (enllaç) i la llicència CC BY-SA 4.0
 *     (enllaç), que demana dir d'on ve i que s'ha retallat (§3(a)(1));
 *   · les dades: l'element de Wikidata (CC0, per cortesia);
 *   · cada foto de Commons que es pinta, amb el seu autor, la seua llicència
 *     i l'enllaç a la pàgina del fitxer;
 *   · el dia que es va consultar.
 * Les fotos només es pinten amb el sí de la persona (`ambFotos`), sense
 * galetes (crossOrigin="anonymous": el navegador ni n'envia ni n'accepta) i
 * sense referent (referrerPolicy="no-referrer"), a 960 px (miniaturaDeCommons).
 * Text pla: React escapa, cap HTML. Enllaços de prosa sense classe (base.css).
 */
import { miniaturaDeCommons } from './fitxaDelPoble.js';
import {
  LLICENCIA_DEL_TEXT,
  LOCALE_PER_DEFECTE,
  REL_DE_FORA,
  altDeFotoCommons,
  dataLlegible,
  fotosDe,
  midaDeFotoCommons,
  traductorDeViquipedia,
  urlDeLArticle,
  urlDeWikidata
} from './creditsDeViquipediaModel.js';

function EnllacDeFora({ href, children }) {
  return <a href={href} target="_blank" rel={REL_DE_FORA}>{children}</a>;
}

export function CreditsDeViquipedia({ entrada, ambFotos = false, t, locale = LOCALE_PER_DEFECTE }) {
  const tx = traductorDeViquipedia(t);
  const { dto, llegitEl } = entrada;
  const fotos = ambFotos ? fotosDe(dto.imatges) : [];
  const dades = [
    ['Població', dto.population ? `${dto.population}${dto.population_year ? ` (${dto.population_year})` : ''}` : null],
    ['Altitud', Number.isFinite(dto.elevation) ? `${dto.elevation} m` : null],
    ['Superfície', Number.isFinite(dto.area) ? `${dto.area} km²` : null], ['Gentilici', dto.gentilici],
    ['Coordenades', Number.isFinite(dto.lat) && Number.isFinite(dto.lng) ? `${dto.lat}, ${dto.lng}` : null]
  ].filter(([, valor]) => valor != null);
  return (
    <>
      <p>{tx('intro')}</p>
      {dades.length ? <dl>{dades.map(([nom, valor]) => <div key={nom}><dt>{nom}</dt><dd>{valor}</dd></div>)}</dl> : null}
      <ul>
        {dto.content && dto.wikipedia_title ? (
          <li>
            <strong>{tx('text')}</strong> {tx('extracte')} <EnllacDeFora href={urlDeLArticle(dto.wikipedia_title)}>«{dto.wikipedia_title}»</EnllacDeFora> {tx('deLaViquipedia')} · <EnllacDeFora href={LLICENCIA_DEL_TEXT.url}>{LLICENCIA_DEL_TEXT.nom}</EnllacDeFora>
          </li>
        ) : null}
        {dto.wikidata_id ? (
          <li>
            <strong>{tx('dades')}</strong> <EnllacDeFora href={urlDeWikidata(dto.wikidata_id)}>Wikidata {dto.wikidata_id}</EnllacDeFora> · CC0
          </li>
        ) : null}
      </ul>
      {fotos.map((foto) => (
        <figure key={foto.fitxer}>
          <img src={miniaturaDeCommons(foto.src)} alt={altDeFotoCommons(foto.fitxer)} {...midaDeFotoCommons(foto)}
            loading="lazy" decoding="async" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          <figcaption>
            <strong>{tx('foto')}</strong> {foto.autor || tx('autorAlFitxer')}
            {foto.llicencia ? <> · {foto.llicenciaUrl ? <EnllacDeFora href={foto.llicenciaUrl}>{foto.llicencia}</EnllacDeFora> : foto.llicencia}</> : null}
            {foto.fontUrl ? <> · <EnllacDeFora href={foto.fontUrl}>{foto.fitxer}</EnllacDeFora></> : null}
          </figcaption>
        </figure>
      ))}
      {Number.isFinite(llegitEl) ? <p>{tx('consultat').replace('{data}', () => dataLlegible(llegitEl, locale))}</p> : null}
    </>
  );
}
