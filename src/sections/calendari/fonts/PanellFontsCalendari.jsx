/**
 * PanellFontsCalendari.jsx — «Els meus calendaris», el panell lateral de
 * /calendari, a l'estil de Google Calendar.
 *
 * T1 (prompt comú 261002_0125) · «La Sidebar» del calendari és este panell de
 * la mateixa secció, al costat de la graella, i no la barra de navegació de
 * l'App (App.jsx · SidebarContent): aquella és la de totes les seccions, i
 * les caselles d'un calendari només tenen sentit al costat del calendari que
 * filtren. Un grup per compte (amb «Connecta amb …» o «Desconnecta») i una
 * casella per font, amb el color del seu token.
 *
 * Presentacional: no sap de Google ni de tokens. Rep els comptes de
 * useFontsCalendari i avisa amb onCommuta(idFont), onConnecta(clau),
 * onCancella(clau), onDesconnecta(clau) i onReintenta(idFont). El color mai
 * és l'únic senyal: cada casella porta el nom de la font.
 */
import { useId } from 'react';
import { Boto } from '../../../components/PedraSeca/index.js';
import { ERRORS_DE_FONT } from './contracteFonts.js';

/* La classe de cada token de color: un mapa explícit de literals
   (tractor-vocabulari, V2), mai una classe construïda. */
const CLASSE_CASELLA = Object.freeze({
  accio: 'sdp-calendari-fonts-panell__casella sdp-calendari-fonts-panell__casella--accio',
  accent: 'sdp-calendari-fonts-panell__casella sdp-calendari-fonts-panell__casella--accent',
  exit: 'sdp-calendari-fonts-panell__casella sdp-calendari-fonts-panell__casella--exit',
  avis: 'sdp-calendari-fonts-panell__casella sdp-calendari-fonts-panell__casella--avis',
  error: 'sdp-calendari-fonts-panell__casella sdp-calendari-fonts-panell__casella--error'
});

const TEXT_DE_LA_FASE = Object.freeze({
  desconnectat: 'Sense connectar.',
  connectant: 'Esperant la finestra d’autorització…',
  connectat: 'Connectat. Només es llig: no s’hi escriu res.'
});
/* Els errors d'una font que val la pena tornar a provar. */
const REINTENTABLES = new Set([ERRORS_DE_FONT.XARXA, ERRORS_DE_FONT.RESPOSTA_INVALIDA]);

function EstatDeLaFont({ font, onReintenta }) {
  if (font.fase === 'carregant') return <span role="status" className="sdp-calendari-fonts-panell__avis">Carregant…</span>;
  if (font.fase !== 'error' || !font.error) return <span role="status" className="sdp-calendari-fonts-panell__avis" />;
  return (
    <span role="status" className="sdp-calendari-fonts-panell__avis sdp-calendari-fonts-panell__avis--error">
      {font.error.missatge}
      {REINTENTABLES.has(font.error.tipus) ? (
        <>
          {' '}
          <Boto varietat="fantasma" onClick={() => onReintenta(font.id)}>Torna a provar</Boto>
        </>
      ) : null}
    </span>
  );
}

function CompteDeFonts({ compte, onCommuta, onConnecta, onCancella, onDesconnecta, onReintenta }) {
  const idNom = useId();
  const ambError = compte.fase === 'desconnectat' && Boolean(compte.error);
  return (
    <section className="sdp-calendari-fonts-panell__compte">
      <h4 id={idNom} className="sdp-calendari-fonts-panell__compte-nom">{compte.etiqueta}</h4>
      <ul className="sdp-calendari-fonts-panell__llista" aria-labelledby={idNom}>
        {compte.fonts.map((font) => (
          <li key={font.id} className="sdp-calendari-fonts-panell__font">
            <label className={CLASSE_CASELLA[font.colorToken] ?? CLASSE_CASELLA.accio}>
              <input type="checkbox" checked={font.activa} onChange={() => onCommuta(font.id)} />
              <span>{font.nom}</span>
            </label>
            {compte.fase === 'connectat' ? <EstatDeLaFont font={font} onReintenta={onReintenta} /> : null}
          </li>
        ))}
      </ul>
      <p role="status" className={ambError ? 'sdp-calendari-fonts-panell__estat sdp-calendari-fonts-panell__estat--error' : 'sdp-calendari-fonts-panell__estat'}>
        {ambError ? compte.error.missatge : TEXT_DE_LA_FASE[compte.fase]}
      </p>
      {compte.fase === 'connectat' ? (
        <Boto varietat="fantasma" aria-describedby={idNom} onClick={() => onDesconnecta(compte.clau)}>Desconnecta</Boto>
      ) : null}
      {compte.fase === 'connectant' ? (
        <Boto varietat="fantasma" aria-describedby={idNom} onClick={() => onCancella(compte.clau)}>Cancel·la</Boto>
      ) : null}
      {compte.fase === 'desconnectat' ? (
        <Boto varietat="secundari" aria-describedby={idNom} onClick={() => onConnecta(compte.clau)}>
          {`Connecta amb ${compte.proveidor}`}
        </Boto>
      ) : null}
    </section>
  );
}

export function PanellFontsCalendari({
  comptes, onCommuta, onConnecta, onCancella, onDesconnecta, onReintenta, titol = 'Els meus calendaris'
}) {
  const idTitol = useId();
  return (
    <aside className="sdp-calendari-fonts-panell" aria-labelledby={idTitol}>
      <h3 id={idTitol} className="sdp-calendari-fonts-panell__titol">{titol}</h3>
      {comptes.map((compte) => (
        <CompteDeFonts key={compte.clau || 'sense-compte'} compte={compte} onCommuta={onCommuta} onConnecta={onConnecta}
          onCancella={onCancella} onDesconnecta={onDesconnecta} onReintenta={onReintenta} />
      ))}
    </aside>
  );
}
