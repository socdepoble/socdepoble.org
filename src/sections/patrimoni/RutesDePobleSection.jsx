import { Fragment, Suspense, useMemo, useState } from 'react';
import { Boto, Taula } from '../../components/PedraSeca/index.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { useNavigate } from '../../app/contexts/RouterContext.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { adoptaFullDiferit } from '../../config/fullDiferit.js';
import { BarreraDelTrosAccessori, lazyRoute } from '../../apps/plataforma/lazyRoute.js';
import cssRutesPoble from '../../css/diferit-rutes-poble.css?inline';
import { RUTES_LA_TORRE } from '../../data/patrimoni/rutesDePoble.js';
import { textosCatalegAfigV26 } from '../../components/universal/workspace/i18nCatalegAfigV26.js';
import EmpremtaFont from './EmpremtaFont.jsx';
import { traductorPatrimoni } from './textosPatrimoni.js';

const ModalAfigCataleg = lazyRoute(() => import('../../components/universal/workspace/ModalAfigCataleg.jsx'));

function useNavigateRutesSegur() {
  try {
    return useNavigate();
  } catch {
    return () => {};
  }
}

const adoptaEstilsRutesPoble = (node) => {
  if (node) adoptaFullDiferit(node, 'rutes-poble', cssRutesPoble);
};

/* IDEA-113 (Onada R9, carril C5) + R32.55 (U-DIS-01 · Noblesa Pedra Seca) · /page/rutes-de-poble:
   els itineraris d'un poble pintats des de la forma de dades de rutesDePoble.js (PLANTILLA_RUTES_DE_POBLE).
   Per defecte, els de La Torre de les Maçanes; un altre poble hi passa el seu `conjunt`, amb la seua font.
   Tot el text documental és literal de la font i les pàgines són les del PDF de la font. */
const ple = (valor) => typeof valor === 'string' && valor.trim().length > 0;
const editorDeLaFont = (font) => (ple(font.editor) ? font.editor.split(' · ')[0].trim() : '');
const anyDeLaFont = (font) => (typeof font.revisio === 'string' ? (/^\d{4}/.exec(font.revisio.trim())?.[0] ?? '') : '');

function Ruta({ ruta, tr }) {
  const id = `ruta-${ruta.numero}`;
  return (
    <article className="sdp-rutes-poble__ruta" aria-labelledby={id}>
      <h4 id={id} className="sdp-rutes-poble__ruta-titol">
        {tr('patrimoni.rutes.ruta', 'Ruta')} {ruta.numero} · <span lang="ca">{ruta.eix}</span>
      </h4>
      <p className="sdp-rutes-poble__meta">
        <span className="sdp-rutes-poble__pindola">
          {tr('patrimoni.rutes.durada', 'Durada')}: {ruta.temps}
        </span>
        <span className="sdp-rutes-poble__sep" aria-hidden="true">{' · '}</span>
        <span className="sdp-rutes-poble__pindola">
          {tr('patrimoni.rutes.distancia', 'Distància')}: {ruta.distancia}
        </span>
        <span className="sdp-rutes-poble__sep" aria-hidden="true">{' · '}</span>
        <span className="sdp-rutes-poble__pindola">
          {tr('patrimoni.font.pagina', 'Pàgina {n} del PDF', { n: ruta.pagina })}
        </span>
      </p>
      {ruta.lema && <p className="sdp-rutes-poble__lema" lang="ca"><em>{ruta.lema}</em></p>}
      <ol className="sdp-rutes-poble__parades" lang="ca">
        {ruta.parades.map((parada) => (
          <li key={parada.linies[0]} className="sdp-rutes-poble__parada">
            <strong>{parada.hora}</strong> · {parada.titol}{parada.explicacio ? `. ${parada.explicacio}` : ''}
          </li>
        ))}
      </ol>
      <details className="sdp-rutes-poble__programa">
        <summary>{tr('patrimoni.rutes.programa', 'Programa d’activitats')}</summary>
        <p lang="ca">{ruta.programa}</p>
      </details>
    </article>
  );
}

/** Cos viu de TextSection a /page/rutes-de-poble. */
export default function RutesDePobleSection({ conjunt = RUTES_LA_TORRE }) {
  const { t, language = 'ca' } = useUIActions();
  const navega = useNavigateRutesSegur();
  const esSuperadmin = useSessioOpcional()?.esSuperadmin === true;
  const txAfig = textosCatalegAfigV26(language);
  const [modalAfigObert, setModalAfigObert] = useState(false);
  const [modalAfigMuntat, setModalAfigMuntat] = useState(false);
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
    ple(font.editor) && { clau: 'editor', node: <span className="sdp-rutes-poble__pindola" lang="ca">{font.editor}</span> },
    ple(font.titol) && { clau: 'titol', node: <span className="sdp-rutes-poble__pindola" lang="ca">«{font.titol}»</span> },
    ple(font.revisio) && { clau: 'revisio', node: <span className="sdp-rutes-poble__pindola">{tr('patrimoni.rutes.revisio', 'Revisió')} {font.revisio}</span> },
    /^https:\/\//.test(font.web ?? '') && {
      clau: 'web',
      node: (
        <span className="sdp-rutes-poble__pindola">
          <a href={font.web} target="_blank" rel="noopener noreferrer">{font.web.replace(/^https:\/\//, '')}</a>{' '}
          {tr('patrimoni.font.finestraNova', '(s’obri en una finestra nova)')}
        </span>
      )
    }
  ].filter(Boolean);
  return (
    <section ref={adoptaEstilsRutesPoble} className="sdp-rutes-poble" aria-label={titol}>
      <h3>{titol}</h3>
      {capcalera.length > 0 && (
        <p className="sdp-rutes-poble__fonts">
          {capcalera.map((item, i) => (
            <Fragment key={item.clau}>
              {i > 0 ? <span className="sdp-rutes-poble__sep" aria-hidden="true">{' · '}</span> : null}
              {item.node}
            </Fragment>
          ))}
        </p>
      )}
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
      {vigencia && <p className="sdp-rutes-poble__vigencia">{vigencia}</p>}
      {rutes.map((ruta) => <Ruta key={ruta.numero} ruta={ruta} tr={tr} />)}
      {recursos.length > 0 && (
        <>
          <h4>{tr('patrimoni.rutes.recursos', 'Fitxes de recurs')}</h4>
          <ol className="sdp-rutes-poble__recursos">
            {recursos.map((recurs) => (
              <li key={recurs.id} className="sdp-rutes-poble__recurs">
                <span lang="ca">{recurs.nom}{recurs.adreca ? ` · ${recurs.adreca}` : ''}</span> · {tr('patrimoni.font.pagina', 'Pàgina {n} del PDF', { n: recurs.pagina })}
              </li>
            ))}
          </ol>
        </>
      )}
      {recursos.some((recurs) => recurs.establiments) && <p>{tr('patrimoni.rutes.establiments', 'La font de 2021 hi dona els establiments amb el seu telèfon: no es copien, perquè poden haver canviat.')}</p>}
      <h4>{tr('patrimoni.rutes.plantilla', 'Plantilla per a altres pobles')}</h4>
      <p>{tr('patrimoni.rutes.plantillaText', 'Cada poble pot omplir la mateixa forma de dades (eix, durada, distància, parades i fitxes de recurs) amb la seua font i la seua empremta. Ací només hi ha les dades d’este poble.')}</p>
      <div className="sdp-alerta__accions sdp-alerta__accions--centrades">
        <Boto
          varietat="primari"
          onClick={() => { setModalAfigMuntat(true); setModalAfigObert(true); }}
        >
          {txAfig.catalegAfigV26Boto}
        </Boto>
      </div>
      {modalAfigMuntat ? (
        <BarreraDelTrosAccessori>
          <Suspense fallback={null}>
            <ModalAfigCataleg
              obert={modalAfigObert}
              onTanca={() => setModalAfigObert(false)}
              font="rutes-de-poble"
              idioma={language}
              onNavega={navega}
              esSuperadmin={esSuperadmin}
            />
          </Suspense>
        </BarreraDelTrosAccessori>
      ) : null}
      <EmpremtaFont font={font} tr={tr} />
    </section>
  );
}
