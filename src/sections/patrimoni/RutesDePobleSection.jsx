import { useMemo } from 'react';
import { Taula } from '../../components/PedraSeca/index.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { RUTES_LA_TORRE } from '../../data/patrimoni/rutesDePoble.js';
import EmpremtaFont from './EmpremtaFont.jsx';
import { traductorPatrimoni } from './textosPatrimoni.js';

/* IDEA-113 (Onada R9, carril C5) · /page/rutes-de-poble: els itineraris d'un poble pintats des de la forma de
   dades de rutesDePoble.js (PLANTILLA_RUTES_DE_POBLE). Per defecte, els de La Torre de les Maçanes; un altre
   poble hi passa el seu `conjunt`, amb la seua font. Tot el text documental és literal de la font. Es pinta
   només el que la font porta: una font encara buida (la plantilla) no peta ni mostra cap enllaç ni empremta
   (R9V-C5-06). Les pàgines són les del PDF de la font.
   G1-08 (Gauntlet de l'arbre R9) · Davall del resum, una nota diu qui va publicar el programa i quin any, i que no
   és cap oferta vigent: ací no es reserva res. L'editor és el primer tros de font.editor (abans de « · ») i l'any,
   el de font.revisio. Sense editor o sense any, no es pinta: no s'endevina cap data. */
const ple = (valor) => typeof valor === 'string' && valor.trim().length > 0;
const editorDeLaFont = (font) => (ple(font.editor) ? font.editor.split(' · ')[0].trim() : '');
const anyDeLaFont = (font) => (typeof font.revisio === 'string' ? (/^\d{4}/.exec(font.revisio.trim())?.[0] ?? '') : '');

function Ruta({ ruta, tr }) {
  const id = `ruta-${ruta.numero}`;
  return (
    <article aria-labelledby={id}>
      <h4 id={id}>{tr('patrimoni.rutes.ruta', 'Ruta')} {ruta.numero} · <span lang="ca">{ruta.eix}</span></h4>
      <p>
        {tr('patrimoni.rutes.durada', 'Durada')}: {ruta.temps} · {tr('patrimoni.rutes.distancia', 'Distància')}: {ruta.distancia} · {tr('patrimoni.font.pagina', 'Pàgina {n} del PDF', { n: ruta.pagina })}
      </p>
      {ruta.lema && <p lang="ca"><em>{ruta.lema}</em></p>}
      <ol lang="ca">
        {ruta.parades.map((parada) => (
          <li key={parada.linies[0]}>
            <strong>{parada.hora}</strong> · {parada.titol}{parada.explicacio ? `. ${parada.explicacio}` : ''}
          </li>
        ))}
      </ol>
      <details>
        <summary>{tr('patrimoni.rutes.programa', 'Programa d’activitats')}</summary>
        <p lang="ca">{ruta.programa}</p>
      </details>
    </article>
  );
}

/** Cos viu de TextSection a /page/rutes-de-poble. */
export default function RutesDePobleSection({ conjunt = RUTES_LA_TORRE }) {
  const { t } = useUIActions();
  const tr = useMemo(() => traductorPatrimoni(t), [t]);
  const font = conjunt.font ?? {};
  const rutes = conjunt.rutes ?? [];
  const recursos = conjunt.recursos ?? [];
  const titol = tr('patrimoni.rutes.titol', 'Els itineraris de {poble}', { poble: conjunt.poble });
  const editor = editorDeLaFont(font);
  const any = anyDeLaFont(font);
  const vigencia = rutes.length > 0 && editor && any
    ? tr('patrimoni.rutes.vigencia', 'Programa publicat per {editor} el {any}: no és cap oferta vigent i ací no es reserva res.', { editor, any })
    : null;
  const capcalera = [
    ple(font.editor) && <span key="editor" lang="ca">{font.editor}</span>,
    ple(font.titol) && <span key="titol" lang="ca">«{font.titol}»</span>,
    ple(font.revisio) && <span key="revisio">{tr('patrimoni.rutes.revisio', 'Revisió')} {font.revisio}</span>,
    /^https:\/\//.test(font.web ?? '') && (
      <span key="web">
        <a href={font.web} target="_blank" rel="noopener noreferrer">{font.web.replace(/^https:\/\//, '')}</a>{' '}
        {tr('patrimoni.font.finestraNova', '(s’obri en una finestra nova)')}
      </span>
    )
  ].filter(Boolean);
  return (
    <section aria-label={titol}>
      <h3>{titol}</h3>
      {capcalera.length > 0 && <p>{capcalera.flatMap((tros, i) => (i ? [' · ', tros] : [tros]))}</p>}
      <p>{tr('patrimoni.font.llengua', 'El contingut documental es manté en la llengua de la font: no es traduïx.')} {tr('patrimoni.font.literal', 'Transcripció literal: es conserven les paraules i les xifres de la font, també les errates.')}</p>
      {rutes.length > 0 && (
        <Taula titol={tr('patrimoni.rutes.taula', 'Resum dels itineraris')}>
          <thead>
            <tr>
              <th scope="col">{tr('patrimoni.rutes.ruta', 'Ruta')}</th>
              <th scope="col">{tr('patrimoni.rutes.eix', 'Eix')}</th>
              <th scope="col">{tr('patrimoni.rutes.durada', 'Durada')}</th>
              <th scope="col">{tr('patrimoni.rutes.distancia', 'Distància')}</th>
              <th scope="col">{tr('patrimoni.rutes.parades', 'Parades')}</th>
            </tr>
          </thead>
          <tbody>
            {rutes.map((ruta) => (
              <tr key={ruta.numero}>
                <th scope="row">{ruta.numero}</th>
                <td lang="ca">{ruta.eix}</td>
                <td>{ruta.temps}</td>
                <td>{ruta.distancia}</td>
                <td>{ruta.parades.length}</td>
              </tr>
            ))}
          </tbody>
        </Taula>
      )}
      {vigencia && <p>{vigencia}</p>}
      {rutes.map((ruta) => <Ruta key={ruta.numero} ruta={ruta} tr={tr} />)}
      {recursos.length > 0 && (
        <>
          <h4>{tr('patrimoni.rutes.recursos', 'Fitxes de recurs')}</h4>
          <ol>
            {recursos.map((recurs) => (
              <li key={recurs.id}>
                <span lang="ca">{recurs.nom}{recurs.adreca ? ` · ${recurs.adreca}` : ''}</span> · {tr('patrimoni.font.pagina', 'Pàgina {n} del PDF', { n: recurs.pagina })}
              </li>
            ))}
          </ol>
        </>
      )}
      {recursos.some((recurs) => recurs.establiments) && <p>{tr('patrimoni.rutes.establiments', 'La font de 2021 hi dona els establiments amb el seu telèfon: no es copien, perquè poden haver canviat.')}</p>}
      <h4>{tr('patrimoni.rutes.plantilla', 'Plantilla per a altres pobles')}</h4>
      <p>{tr('patrimoni.rutes.plantillaText', 'Cada poble pot omplir la mateixa forma de dades (eix, durada, distància, parades i fitxes de recurs) amb la seua font i la seua empremta. Ací només hi ha les dades d’este poble.')}</p>
      <EmpremtaFont font={font} tr={tr} />
    </section>
  );
}
