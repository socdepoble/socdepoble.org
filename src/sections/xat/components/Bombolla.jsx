/**
 * Bombolla.jsx — un missatge dins de la conversa (UX-A07, UX-B02) en totes
 * les variants de F0: pròpia, aliena, de sistema, esborrada i en error.
 *
 *   · La pròpia va a la dreta amb --sdp-accio-subtil; l'aliena a l'esquerra
 *     amb --sdp-fons-elevat. Hora i marques dins, a baix a la dreta.
 *   · Als grups s'escriu el nom de l'autor (no només un color).
 *   · «sistema» es pinta centrada amb text d'i18n a partir de metadades.clau;
 *     mai text escrit pel servidor (XAT-B20).
 *   · «esborrat» és una làpida en cursiva (ARQ-A04).
 *   · «error» es queda amb «No s'ha enviat», «Torna-ho a provar» i «Descarta»
 *     (XAT-B25, XAT-C10).
 *   · Els enllaços van amb rel="noopener noreferrer" i avís de domini enganyós
 *     (XAT-B05); el menú «⋯» copia el text (XAT-B12). Cap inserció d'HTML:
 *     el text es pinta sempre com a nodes de React.
 *
 * En mode de selecció (Retall cap a Notes) la bombolla és una casella.
 */
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Circle, Copy, MoreVertical } from 'lucide-react';
import { Link } from '../../../app/contexts/RouterContext';
import MarquesEstat from './MarquesEstat.jsx';
import { etiquetaHora } from '../temps.js';
import { segmentaEnllacos } from '../enllacos.js';
import { rutaDePerfil } from '../../../config/navigation.js';

/**
 * Lògica d'Usuari (T3, T4): el nom de qui escriu es pinta als grups i, fora
 * d'ells, quan qui escriu és la IAIA o una entitat; i enllaça al seu perfil
 * públic quan se sap qui és. Una entitat signa amb el seu nom, no amb el de
 * la persona que ha teclejat.
 */
function AutorDeLaBombolla({ missatge, esGrup, triable, t }) {
  const esIA = Boolean(missatge.is_ai);
  const esEntitat = Boolean(missatge.comEntitat);
  if (!esGrup && !esIA && !esEntitat) return null;
  const nom = missatge.author || missatge.author_name || t('section.xat.vei', 'Veí');
  const text = esIA ? `${nom} · ${t('section.xat.ia.etiqueta', 'IA')}` : nom;
  const tipus = esIA ? 'ia' : esEntitat ? 'entitat' : 'persona';
  const ruta = !triable && !esEntitat ? rutaDePerfil(tipus, missatge.usuariId) : null;
  if (!ruta) return <span className="sdp-xat-bombolla__autor">{text}</span>;
  return (
    <Link className="sdp-xat-bombolla__autor" to={ruta} aria-label={t('section.xat.perfil.obri', 'Obri el perfil de {nom}').replace('{nom}', nom)}>
      {text}
    </Link>
  );
}

function TextAmbEnllacos({ text, t }) {
  const segments = segmentaEnllacos(text);
  return segments.map((segment, i) => {
    if (segment.tipus !== 'enllac') return <span key={i}>{segment.text}</span>;
    return (
      <span key={i}>
        <a className="sdp-xat-enllac" href={segment.href} target="_blank" rel="noopener noreferrer">{segment.text}</a>
        {segment.sospitos ? (
          <span className="sdp-xat-enllac__avis" role="note">
            <AlertTriangle size={14} aria-hidden="true" focusable="false" />
            {t('section.xat.enllac.avis', 'Este enllaç porta a un domini amb caràcters enganyosos ({host}).').replace('{host}', segment.host)}
          </span>
        ) : null}
      </span>
    );
  });
}

function textDeSistema(missatge, t) {
  const clau = missatge?.metadades?.clau;
  const parametres = missatge?.metadades?.parametres || {};
  const generic = t('section.xat.sistema.generic', 'Missatge del sistema');
  if (!clau) return missatge?.text || generic;
  let text = t(`section.xat.sistema.${clau}`, generic);
  for (const [nom, valor] of Object.entries(parametres)) text = text.replace(`{${nom}}`, String(valor ?? ''));
  return text;
}

export default function Bombolla({
  missatge, esGrup = false, locale, t,
  seleccio = null, onReintenta, onDescarta, onCopia
}) {
  const [menuObert, setMenuObert] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuObert) return undefined;
    const node = menuRef.current;
    const arrel = node?.getRootNode?.() || document;
    const tancaFora = (e) => { if (node && !node.contains(e.target)) setMenuObert(false); };
    const tancaEsc = (e) => { if (e.key === 'Escape') setMenuObert(false); };
    arrel.addEventListener('pointerdown', tancaFora);
    arrel.addEventListener('keydown', tancaEsc);
    return () => {
      arrel.removeEventListener('pointerdown', tancaFora);
      arrel.removeEventListener('keydown', tancaEsc);
    };
  }, [menuObert]);

  if (missatge.tipus === 'sistema') {
    return (
      <li className="sdp-xat-sistema">
        <span className="sdp-xat-sistema__text">{textDeSistema(missatge, t)}</span>
      </li>
    );
  }

  const meu = missatge.sender === 'me';
  const esborrat = Boolean(missatge.esborrat) || Boolean(missatge.esborratAl);
  const estat = missatge.estatEnviament || 'enviat';
  const enError = estat === 'error';
  const hora = etiquetaHora(missatge.creatAl, locale);
  const text = missatge.text ?? missatge.content ?? '';
  const triable = Boolean(seleccio?.actiu);
  const triat = Boolean(seleccio?.triat);

  const propsSeleccio = triable ? {
    role: 'checkbox',
    'aria-checked': triat,
    tabIndex: 0,
    onClick: () => seleccio.onAlterna(),
    onKeyDown: (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); seleccio.onAlterna(); }
    }
  } : {};

  return (
    <li
      className={`sdp-xat-item ${meu ? 'sdp-xat-item--meu' : 'sdp-xat-item--altre'}${triable ? ' sdp-xat-item--triable' : ''}${triat ? ' sdp-xat-item--triat' : ''}`}
      data-vist={!meu && missatge.seq != null ? missatge.seq : undefined}
      {...propsSeleccio}
    >
      <div className="sdp-xat-bombolla-wrap">
        {triable ? (
          <span className="sdp-xat-marca-tria" aria-hidden="true">
            {triat ? <CheckCircle2 size={20} focusable="false" /> : <Circle size={20} focusable="false" />}
          </span>
        ) : null}
        <div className={`sdp-xat-bombolla ${meu ? 'sdp-xat-bombolla--meu' : 'sdp-xat-bombolla--altre'}${enError ? ' sdp-xat-bombolla--error' : ''}`}>
          {!meu && !esborrat ? (
            <AutorDeLaBombolla missatge={missatge} esGrup={esGrup} triable={triable} t={t} />
          ) : null}
          {esborrat ? (
            <p className="sdp-xat-bombolla__text sdp-xat-bombolla__text--esborrat">
              {t('section.xat.missatge.esborrat', "S'ha esborrat este missatge")}
            </p>
          ) : (
            <p className="sdp-xat-bombolla__text"><TextAmbEnllacos text={text} t={t} /></p>
          )}
          <span className="sdp-xat-bombolla__meta">
            {hora ? <time dateTime={missatge.creatAl || undefined}>{hora}</time> : null}
            {meu && !esborrat ? <MarquesEstat estat={estat} t={t} /> : null}
          </span>
          {enError ? (
            <div className="sdp-xat-bombolla__error" role="alert">
              <AlertTriangle size={16} aria-hidden="true" focusable="false" />
              <span>{missatge.error || t('section.xat.missatge.noEnviat', "No s'ha enviat")}</span>
              <button type="button" className="sdp-xat-bombolla__accio" onClick={() => onReintenta?.(missatge.id)}>
                {t('section.xat.missatge.reintenta', 'Torna-ho a provar')}
              </button>
              <button type="button" className="sdp-xat-bombolla__accio" onClick={() => onDescarta?.(missatge.id)}>
                {t('section.xat.missatge.descarta', 'Descarta')}
              </button>
            </div>
          ) : null}
        </div>
        {!triable && !esborrat && text ? (
          <div className={`sdp-xat-bombolla__accions${menuObert ? ' sdp-xat-bombolla__accions--obert' : ''}`} ref={menuRef}>
            <button
              type="button"
              className="sdp-xat-icona"
              aria-label={t('section.xat.missatge.opcions', 'Opcions del missatge')}
              aria-haspopup="menu"
              aria-expanded={menuObert}
              onClick={() => setMenuObert((obert) => !obert)}
            >
              <MoreVertical size={20} aria-hidden="true" focusable="false" />
            </button>
            {menuObert ? (
              <div className="sdp-xat-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="sdp-xat-menu__item"
                  onClick={() => { setMenuObert(false); onCopia?.(text); }}
                >
                  <Copy size={18} aria-hidden="true" focusable="false" />
                  {t('section.xat.missatge.copia', 'Copia el text')}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
