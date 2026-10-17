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
 *
 * Torn 260930 (T1 · la conversa amb el patró estàndard de missatgeria):
 *   · Grups: `primerDelGrup` (conversa.js, anotaGrups) posa la cua
 *     (.sdp-xat-bombolla--cua) i el nom de l'autor només a la primera
 *     bombolla de cada tirada; les següents van sense i més juntes
 *     (.sdp-xat-item--segueix). Per defecte és cert: una bombolla solta es
 *     pinta com sempre.
 *   · Respostes: «Respon» encapçala el menú quan hi ha `onRespon` (el fil
 *     admet escriure) i el missatge és confirmat: ni esborrat, ni pendent, ni
 *     en error. Un missatge amb `respostaA` porta la cita dalt (CitaResposta)
 *     amb el missatge `citat` que li passa Conversa, o «Missatge no
 *     carregat» si no és a la llista.
 *   · Cada bombolla porta data-missatge="<id>" perquè la cita la trobe, i
 *     `ressaltat` la marca un moment en arribar-hi.
 *
 * Revisió adversarial 260930: el menú «⋯» seguix el patró de MenuLlista (el
 * focus hi entra en obrir-lo i torna al «⋯» amb Escape o «Copia el text»,
 * i l'Escape queda consumit), i el <li> és enfocable amb tabIndex -1 perquè
 * la cita hi porte el focus.
 */
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Circle, Copy, MoreVertical, Reply } from 'lucide-react';
import { Link } from '../../../app/contexts/RouterContext';
import MarquesEstat from './MarquesEstat.jsx';
import CitaResposta from './CitaResposta.jsx';
import EnllacSegur from './EnllacSegur.jsx';
import { etiquetaHora } from '../temps.js';
import { segmentaEnllacos, segmentaRutesDeLaWiki } from '../enllacos.js';
/* Onada 6 · Un codi SDP traduït (SDP-XAT-429, el límit de missatges) en lloc del text cru. */
import { textDErrorDelXat } from '../errorsXat.js';
import { rutaCanonicaDePerfil, rutaDePerfil } from '../../../config/navigation.js';
import { esIAIA } from '../../../data/identitatsSeed.js';

/**
 * Lògica d'Usuari (T3, T4): el nom de qui escriu es pinta als grups i, fora
 * d'ells, quan qui escriu és la IAIA o una entitat; i enllaça al seu perfil
 * públic quan se sap qui és. Una entitat signa amb el seu nom, no amb el de
 * la persona que ha teclejat.
 * Gauntlet 261016_1530 (Bloc 3.6.3; relleu F65; ordre del Mestre: /iaia «és
 * on s'ha d'accedir des del xat») · Quan qui signa és la IAIA MarIA (per id i
 * amb el tipus d'IA, mai pel nom), el seu nom porta a la seua fitxa neta,
 * /iaia (rutaCanonicaDePerfil), com la capçalera. La resta, el perfil de
 * sempre: cap altre enllaç canvia.
 */
function AutorDeLaBombolla({ missatge, esGrup, triable, t }) {
  const esIA = Boolean(missatge.is_ai);
  const esEntitat = Boolean(missatge.comEntitat);
  if (!esGrup && !esIA && !esEntitat) return null;
  const nom = missatge.author || missatge.author_name || t('section.xat.vei', 'Veí');
  const text = esIA ? `${nom} · ${t('section.xat.ia.etiqueta', 'IA')}` : nom;
  const tipus = esIA ? 'ia' : esEntitat ? 'entitat' : 'persona';
  const fitxaDeLaIA = esIA ? rutaCanonicaDePerfil({ tipus, id: missatge.usuariId }) : null;
  const ruta = !triable && !esEntitat ? (fitxaDeLaIA || rutaDePerfil(tipus, missatge.usuariId)) : null;
  if (!ruta) return <span className="sdp-xat-bombolla__autor">{text}</span>;
  return (
    <Link className="sdp-xat-bombolla__autor" to={ruta} aria-label={t('section.xat.perfil.obri', 'Obri el perfil de {nom}').replace('{nom}', nom)}>
      {text}
    </Link>
  );
}

/* Torn 261004 (T5) · Cada enllaç és EnllacSegur, la peça que també pinta la
   vista «Contingut multimèdia». El DOM no canvia.
   Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25) · Amb `rutesDeLaWiki` (només
   la bombolla de la IAIA MarIA, fora del mode de selecció), cada ruta
   /wikidepoble?item=<slug> que cita la IAIA local és un enllaç intern de
   l'app, amb la classe dels enllaços del xat. Sense la prop, els segments i el
   DOM són els de sempre. */
function TextAmbEnllacos({ text, t, rutesDeLaWiki = false }) {
  const enllacos = segmentaEnllacos(text);
  const segments = rutesDeLaWiki ? segmentaRutesDeLaWiki(enllacos) : enllacos;
  return segments.map((segment, i) => {
    if (segment.tipus === 'ruta') return <Link key={i} className="sdp-xat-enllac" to={segment.ruta}>{segment.text}</Link>;
    if (segment.tipus !== 'enllac') return <span key={i}>{segment.text}</span>;
    return <EnllacSegur key={i} segment={segment} t={t} />;
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
  seleccio = null, onReintenta, onDescarta, onCopia,
  primerDelGrup = true, citat = null, onVesACita = null, onRespon = null, ressaltat = false
}) {
  const [menuObert, setMenuObert] = useState(false);
  const menuRef = useRef(null);
  const botoRef = useRef(null);

  /* El patró de MenuLlista (revisió adversarial 260930, #7 i #8): en obrir,
     el focus entra a la primera opció; Escape tanca, queda consumit (un sol
     Escape tanca UNA cosa: la selecció de xats l'escolta a window) i torna
     el focus al «⋯». */
  useEffect(() => {
    if (!menuObert) return undefined;
    const node = menuRef.current;
    node?.querySelector('[role="menuitem"]')?.focus();
    const arrel = node?.getRootNode?.() || document;
    const tancaFora = (e) => { if (node && !node.contains(e.target)) setMenuObert(false); };
    const tancaEsc = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setMenuObert(false);
      botoRef.current?.focus();
    };
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
  /* Només es respon a un missatge que el servidor ja té: amb id, ni pendent
     ni en error, i mai a una làpida (T1). */
  const potRespondre = typeof onRespon === 'function' && !esborrat && missatge.id != null
    && estat !== 'pendent' && !enError;
  const teMenu = !triable && !esborrat && (Boolean(text) || potRespondre);
  const respostaA = missatge.respostaA ?? null;
  /* F25 · La IAIA MarIA, per id i signant com a IA (mai pel nom), i fora del
     mode de selecció: els seus enllaços a la Wiki de Poble s'obrin a l'app. */
  const rutesDeLaWiki = !meu && !triable && Boolean(missatge.is_ai) && esIAIA(missatge.usuariId);

  const propsSeleccio = triable ? {
    role: 'checkbox',
    'aria-checked': triat,
    tabIndex: 0,
    onClick: () => seleccio.onAlterna(),
    onKeyDown: (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); seleccio.onAlterna(); }
    }
  } : {};

  /* tabIndex -1: la cita hi pot portar el focus (#12) sense que la bombolla
     entre a l'ordre de tabulació. En mode de selecció, la casella hi posa 0. */
  return (
    <li
      className={`sdp-xat-item ${meu ? 'sdp-xat-item--meu' : 'sdp-xat-item--altre'}${primerDelGrup ? '' : ' sdp-xat-item--segueix'}${ressaltat ? ' sdp-xat-item--ressaltat' : ''}${triable ? ' sdp-xat-item--triable' : ''}${triat ? ' sdp-xat-item--triat' : ''}`}
      data-vist={!meu && missatge.seq != null ? missatge.seq : undefined}
      data-missatge={missatge.id ?? undefined}
      tabIndex={-1}
      {...propsSeleccio}
    >
      <div className="sdp-xat-bombolla-wrap">
        {triable ? (
          <span className="sdp-xat-marca-tria" aria-hidden="true">
            {triat ? <CheckCircle2 size={20} focusable="false" /> : <Circle size={20} focusable="false" />}
          </span>
        ) : null}
        <div className={`sdp-xat-bombolla ${meu ? 'sdp-xat-bombolla--meu' : 'sdp-xat-bombolla--altre'}${primerDelGrup ? ' sdp-xat-bombolla--cua' : ''}${enError ? ' sdp-xat-bombolla--error' : ''}`}>
          {!meu && !esborrat && primerDelGrup ? (
            <AutorDeLaBombolla missatge={missatge} esGrup={esGrup} triable={triable} t={t} />
          ) : null}
          {!esborrat && respostaA != null ? (
            <CitaResposta citat={citat} onVes={onVesACita} interactiva={!triable} t={t} />
          ) : null}
          {esborrat ? (
            <p className="sdp-xat-bombolla__text sdp-xat-bombolla__text--esborrat">
              {t('section.xat.missatge.esborrat', "S'ha esborrat este missatge")}
            </p>
          ) : (
            <p className="sdp-xat-bombolla__text"><TextAmbEnllacos text={text} t={t} rutesDeLaWiki={rutesDeLaWiki} /></p>
          )}
          <span className="sdp-xat-bombolla__meta">
            {hora ? <time dateTime={missatge.creatAl || undefined}>{hora}</time> : null}
            {meu && !esborrat ? <MarquesEstat estat={estat} t={t} /> : null}
          </span>
          {enError ? (
            <div className="sdp-xat-bombolla__error" role="alert">
              <AlertTriangle size={16} aria-hidden="true" focusable="false" />
              <span>{textDErrorDelXat({ code: missatge.codiError, message: missatge.error }, t, t('section.xat.missatge.noEnviat', "No s'ha enviat"))}</span>
              <button type="button" className="sdp-xat-bombolla__accio" onClick={() => onReintenta?.(missatge.id)}>
                {t('section.xat.missatge.reintenta', 'Torna-ho a provar')}
              </button>
              <button type="button" className="sdp-xat-bombolla__accio" onClick={() => onDescarta?.(missatge.id)}>
                {t('section.xat.missatge.descarta', 'Descarta')}
              </button>
            </div>
          ) : null}
        </div>
        {teMenu ? (
          <div className={`sdp-xat-bombolla__accions${menuObert ? ' sdp-xat-bombolla__accions--obert' : ''}`} ref={menuRef}>
            <button
              ref={botoRef}
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
                {potRespondre ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="sdp-xat-menu__item"
                    onClick={() => { setMenuObert(false); onRespon(missatge); }}
                  >
                    <Reply size={18} aria-hidden="true" focusable="false" />
                    {t('section.xat.missatge.respon', 'Respon')}
                  </button>
                ) : null}
                {text ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="sdp-xat-menu__item"
                    onClick={() => { setMenuObert(false); onCopia?.(text); botoRef.current?.focus(); }}
                  >
                    <Copy size={18} aria-hidden="true" focusable="false" />
                    {t('section.xat.missatge.copia', 'Copia el text')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
