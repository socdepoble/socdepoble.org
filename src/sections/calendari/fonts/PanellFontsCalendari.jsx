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
import { useUIStateOpcional } from '../../../app/contexts/UIContext';
import { Boto } from '../../../components/PedraSeca/index.js';
import { textosCalendariExtra } from '../i18nCalendariExtra.js';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import cssDiferitCalendari from '../../../css/diferit-calendari.css?inline';
import {
  classeCasellaFont,
  esErrorFontReintentable,
} from './panellFontsCalendariModel.js';

const adoptaEstilsDiferits = (el) => { adoptaFullDiferit(el, 'calendari', cssDiferitCalendari); };

function useIdiomaPanellFonts() {
  try {
    return useUIStateOpcional()?.language || 'ca';
  } catch {
    return 'ca';
  }
}

function EstatDeLaFont({ font, onReintenta, tx }) {
  if (font.fase === 'carregant') return <span ref={adoptaEstilsDiferits} role="status" className="sdp-calendari-fonts-panell__avis">{tx.carregant}</span>;
  if (font.fase !== 'error' || !font.error) return <span ref={adoptaEstilsDiferits} role="status" className="sdp-calendari-fonts-panell__avis" />;
  return (
    <span ref={adoptaEstilsDiferits} role="status" className="sdp-calendari-fonts-panell__avis sdp-calendari-fonts-panell__avis--error">
      {font.error.missatge}
      {esErrorFontReintentable(font.error.tipus) ? (
        <>
          {' '}
          <Boto varietat="fantasma" onClick={() => onReintenta(font.id)}>{tx.tornaAProvar}</Boto>
        </>
      ) : null}
    </span>
  );
}

function CompteDeFonts({ compte, onCommuta, onConnecta, onCancella, onDesconnecta, onReintenta, tx }) {
  const idNom = useId();
  const ambError = compte.fase === 'desconnectat' && Boolean(compte.error);
  return (
    <section ref={adoptaEstilsDiferits} className="sdp-calendari-fonts-panell__compte">
      <h4 id={idNom} className="sdp-calendari-fonts-panell__compte-nom">{compte.etiqueta}</h4>
      <ul className="sdp-calendari-fonts-panell__llista" aria-labelledby={idNom}>
        {compte.fonts.map((font) => (
          <li ref={adoptaEstilsDiferits} key={font.id} className="sdp-calendari-fonts-panell__font">
            <label className={classeCasellaFont(font.colorToken)}>
              <input type="checkbox" checked={font.activa} onChange={() => onCommuta(font.id)} />
              <span>{font.nom}</span>
            </label>
            {compte.fase === 'connectat' ? <EstatDeLaFont font={font} onReintenta={onReintenta} tx={tx} /> : null}
          </li>
        ))}
      </ul>
      <p role="status" className={ambError ? 'sdp-calendari-fonts-panell__estat sdp-calendari-fonts-panell__estat--error' : 'sdp-calendari-fonts-panell__estat'}>
        {ambError ? compte.error.missatge : tx.fases[compte.fase]}
      </p>
      <div className="sdp-calendari-fonts-panell__accions sdp-fila--centrada">
        {compte.fase === 'connectat' ? (
          <Boto varietat="fantasma" aria-describedby={idNom} onClick={() => onDesconnecta(compte.clau)}>{tx.desconnecta}</Boto>
        ) : null}
        {compte.fase === 'connectant' ? (
          <Boto varietat="fantasma" aria-describedby={idNom} onClick={() => onCancella(compte.clau)}>{tx.cancella}</Boto>
        ) : null}
        {compte.fase === 'desconnectat' ? (
          <Boto varietat="secundari" aria-describedby={idNom} onClick={() => onConnecta(compte.clau)}>
            {tx.connectaAmb(compte.proveidor)}
          </Boto>
        ) : null}
      </div>
    </section>
  );
}

export function PanellFontsCalendari({
  comptes, onCommuta, onConnecta, onCancella, onDesconnecta, onReintenta, titol
}) {
  const idTitol = useId();
  const tx = textosCalendariExtra(useIdiomaPanellFonts());
  const titolVisible = titol ?? tx.panellTitol;
  return (
    <aside ref={adoptaEstilsDiferits} className="sdp-calendari-fonts-panell" aria-labelledby={idTitol}>
      <h3 id={idTitol} className="sdp-calendari-fonts-panell__titol">{titolVisible}</h3>
      {comptes.map((compte) => (
        <CompteDeFonts key={compte.clau || 'sense-compte'} compte={compte} onCommuta={onCommuta} onConnecta={onConnecta}
          onCancella={onCancella} onDesconnecta={onDesconnecta} onReintenta={onReintenta} tx={tx} />
      ))}
    </aside>
  );
}
