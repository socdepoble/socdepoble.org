/**
 * Bombolla.jsx — un missatge dins de la conversa (UX-A07, UX-B02 + R32.6 + R32.7):
 *   · Anatomia simètrica en espill amb avatars grans de 44×44 px visuals clicables
 *     (a l'esquerra per als rebuts, a la dreta per als propis, amb espaiador de
 *     44 px a les bombolles consecutives de la mateixa tirada).
 *   · Zero botons invisibles (prohibit opacity: 0): pestanya desplegable ⌄ sempre
 *     visible a la cantonada superior dreta del globus i botons circulars exteriors
 *     😀 Reacciona i ↪ Reenvia sempre visibles al marge lliure.
 *   · Paleta ràpida d'emojis (👍 ❤️ 😂 😮 😢 🙏 + SelectorEmoticones) i píndola
 *     flotant clicable davall del globus («😂 2»).
 *   · Menú complet de les 11 opcions de WhatsApp distribuïdes en 3 blocs amb
 *     separadors semàntics <hr>.
 *   · Previsualització compacta amb miniatura quadrada dreta per a enllaços
 *     interns de Sóc de Poble.
 */
import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronDown,
  Circle,
  Copy,
  CornerUpRight,
  Flag,
  ListChecks,
  MapPin,
  MessageSquare,
  Pin,
  Plus,
  Reply,
  Smile,
  Star,
  Trash2
} from 'lucide-react';
import { Link } from '../../../app/contexts/RouterContext';
import { useCapaEnrere } from '../../../components/PedraSeca/hooks/useCapaEnrere.js';
import MarquesEstat from './MarquesEstat.jsx';
import CitaResposta from './CitaResposta.jsx';
import EnllacSegur from './EnllacSegur.jsx';
import { textXatV1225 } from '../i18nVistesXatV1225.js';
import SelectorEmoticones from './SelectorEmoticones.jsx';
import { etiquetaHora } from '../temps.js';
import { segmentaEnllacos, segmentaRutesDeLaWiki } from '../enllacos.js';
import { ubicacioDeMissatge, urlMapaUbicacio } from '../ubicacioMitjaUI.js';
import { segmentaNegreta } from '../negreta.js';
import { textDErrorDelXat } from '../errorsXat.js';
import { RUTA_PERFIL_PROPI, rutaCanonicaDePerfil, rutaDAutoria, rutaDePerfil } from '../../../config/navigation.js';
import { esIAIA } from '../../../data/identitatsSeed.js';
import { CARA_DE_LA_IAIA } from '../../../data/xatsPerDefecte.js';
import TargetaLlistaComu from './TargetaLlistaComu.jsx';
import AdjuntXat from './AdjuntXat.jsx';
/* v1.2.7 (integració, sostre d'arrencada del connector) · D-R27-1 (opció b) · El contenidor
   .sdp-xat-bombolla-wrap--veu viu al full diferit del reproductor: la bombolla d'una nota de veu
   l'adopta ella mateixa abans del primer pintat, com AdjuntXat. */
import { adoptaFullDiferit, useFullDiferit } from '../../../config/fullDiferit.js';
import cssXatVeu from '../../../css/diferit-xat-veu.css?inline';
import cssXatMenu from '../../../css/diferit-xat-menu.css?inline';
import { limitsVisibles, triaOberturaMenu } from './oberturaMenu.js';
import CaraXat from './CaraXat.jsx';
import { toDeLlavor } from '../../../components/PedraSeca/atoms/Avatar.jsx';
import { mouFocusDelMenu } from './Compositor.jsx';
import { llistaDeMissatge } from '../llistaComu.js';
import { esXifratTancat, llavorDAutor, textXifratTancat } from '../conversa.js';
import { extreuPreviaInterna } from '../previaEnllacIntern.js';
import { RUTA_ENTRADA } from '../../../config/rutaEntrada.js';

export const EMOJIS_REACCIO_RAPIDA = Object.freeze(['👍', '❤️', '😂', '😮', '😢', '🙏']);
const CAP_REACCIO = Object.freeze([]);

const CLASSES_COLOR_AUTOR = Object.freeze([
  'sdp-xat-bombolla__autor--to-1',
  'sdp-xat-bombolla__autor--to-2',
  'sdp-xat-bombolla__autor--to-3',
  'sdp-xat-bombolla__autor--to-4',
  'sdp-xat-bombolla__autor--to-5',
  'sdp-xat-bombolla__autor--to-6'
]);

/**
 * Normalitza reaccions d'un missatge (array d'agregats `{ emoji, quants, meua }`,
 * llista de files `{ emoji, usuari_id }` o mapa `{ emoji: [...] | number }`) en
 * una llista ordenada `[{ emoji, quants, meua }]`. Pura.
 */
export function normalitzaReaccions(font, meuId = null) {
  if (!font) return CAP_REACCIO;
  const jo = meuId != null && String(meuId) !== '' ? String(meuId) : null;
  if (Array.isArray(font)) {
    if (font.length === 0) return CAP_REACCIO;
    if (font[0] && typeof font[0] === 'object' && typeof font[0].quants === 'number') {
      const netes = font
        .filter((r) => r && typeof r.emoji === 'string' && r.emoji && r.quants > 0)
        .map((r) => ({ emoji: r.emoji, quants: r.quants, meua: Boolean(r.meua) }));
      return netes.length ? netes : CAP_REACCIO;
    }
    const perEmoji = new Map();
    for (const fila of font) {
      const emoji = typeof fila?.emoji === 'string' ? fila.emoji : (typeof fila?.reaccio === 'string' ? fila.reaccio : '');
      if (!emoji) continue;
      const uid = fila?.usuariId ?? fila?.usuari_id ?? null;
      const actual = perEmoji.get(emoji) || { emoji, quants: 0, meua: false };
      actual.quants += 1;
      if (jo && uid != null && String(uid) === jo) actual.meua = true;
      perEmoji.set(emoji, actual);
    }
    return perEmoji.size ? [...perEmoji.values()] : CAP_REACCIO;
  }
  if (typeof font === 'object') {
    const eixida = [];
    for (const [emoji, valor] of Object.entries(font)) {
      if (!emoji) continue;
      if (Array.isArray(valor)) {
        if (valor.length > 0) {
          eixida.push({
            emoji,
            quants: valor.length,
            meua: Boolean(jo && valor.some((u) => String(u) === jo))
          });
        }
      } else if (typeof valor === 'number' && valor > 0) {
        eixida.push({ emoji, quants: valor, meua: false });
      }
    }
    return eixida.length ? eixida : CAP_REACCIO;
  }
  return CAP_REACCIO;
}

function dadesAutorDeMissatge(missatge, triable, t, entitatId = null) {
  const esIA = Boolean(missatge.is_ai);
  const esEntitat = Boolean(missatge.comEntitat);
  const nom = missatge.author || missatge.author_name || t('section.xat.vei', 'Veí');
  const text = esIA ? `${nom} · ${t('section.xat.ia.etiqueta', 'IA')}` : nom;
  const tipus = esIA ? 'ia' : esEntitat ? 'entitat' : 'persona';
  const fitxaDeLaIA = esIA ? rutaCanonicaDePerfil({ tipus, id: missatge.usuariId }) : null;
  const rutaEntitat = esEntitat && entitatId != null && String(entitatId) !== ''
    ? rutaDAutoria({ tipus: 'entitat', id: entitatId })
    : null;
  const ruta = !triable ? (esEntitat ? rutaEntitat : (fitxaDeLaIA || rutaDePerfil(tipus, missatge.usuariId))) : null;
  /* Gauntlet R22 (xat-07) · Una entitat pren el color del seu nom, mai el de qui l'opera. */
  const llavor = llavorDAutor(missatge, nom);
  const classeTo = CLASSES_COLOR_AUTOR[toDeLlavor(llavor) % CLASSES_COLOR_AUTOR.length];
  return { esIA, esEntitat, nom, text, ruta, llavor, classeTo };
}

function AutorDeLaBombolla({ missatge, esGrup, triable, t, entitatId = null }) {
  const { esIA, esEntitat, nom, text, ruta, classeTo } = dadesAutorDeMissatge(missatge, triable, t, entitatId);
  if (!esGrup && !esIA && !esEntitat) return null;
  const classe = esGrup ? `sdp-xat-bombolla__autor ${classeTo}` : 'sdp-xat-bombolla__autor';
  if (!ruta) return <span className={classe}>{text}</span>;
  return (
    <Link className={classe} to={ruta} aria-label={t('section.xat.perfil.obri', 'Obri el perfil de {nom}').replace('{nom}', () => nom)}>
      {text}
    </Link>
  );
}

function pintaSegment(segment, clau, t, interactiu = true) {
  if (segment.tipus === 'ruta') return <Link key={clau} className="sdp-xat-enllac" to={segment.ruta}>{segment.text}</Link>;
  if (segment.tipus !== 'enllac') return <span key={clau}>{segment.text}</span>;
  if (!interactiu) return <EnllacQuiet key={clau} segment={segment} t={t} />;
  return <EnllacSegur key={clau} segment={segment} t={t} />;
}

function EnllacQuiet({ segment, t }) {
  return (
    <span>
      <span className="sdp-xat-enllac">{segment.text}</span>
      {segment.sospitos ? (
        <span className="sdp-xat-enllac__avis" role="note">
          <AlertTriangle size={14} aria-hidden="true" focusable="false" />
          {t('section.xat.enllac.avis', 'Este enllaç porta a un domini amb caràcters enganyosos ({host}).').replace('{host}', () => segment.host)}
        </span>
      ) : null}
    </span>
  );
}

function TextAmbEnllacos({ text, t, rutesDeLaWiki = false, interactiu = true }) {
  const enllacos = segmentaEnllacos(text);
  const segments = rutesDeLaWiki ? segmentaRutesDeLaWiki(enllacos) : enllacos;
  return segmentaNegreta(segments).flatMap((tram, i) => (tram.negreta
    ? [<strong key={`n${i}`}>{tram.segments.map((segment, j) => pintaSegment(segment, j, t, interactiu))}</strong>]
    : tram.segments.map((segment, j) => pintaSegment(segment, `${i}-${j}`, t, interactiu))));
}

function EnllacARegistre({ t, interactiu }) {
  const text = t('section.xat.fake.registre', 'Entra o registra’t ara →');
  const ambFletxa = text.endsWith('→');
  const nom = ambFletxa ? text.slice(0, -1).trimEnd() : text;
  const contingut = <>{nom}{ambFletxa ? <span aria-hidden="true"> →</span> : null}</>;
  return (
    <p className="sdp-xat-bombolla__text">
      {interactiu ? <Link className="sdp-xat-enllac" to={RUTA_ENTRADA}>{contingut}</Link> : <span className="sdp-xat-enllac">{contingut}</span>}
    </p>
  );
}

function PreviaEnllacIntern({ previa, interactiu }) {
  if (!previa) return null;
  const cos = (
    <>
      <span className="sdp-xat-previa-interna__info">
        <strong className="sdp-xat-previa-interna__titol">{previa.titol}</strong>
        <span className="sdp-xat-previa-interna__domini">{previa.domini}</span>
      </span>
      <img
        className="sdp-xat-previa-interna__img"
        src={previa.imatgeUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
      />
    </>
  );
  if (!interactiu) {
    return <div className="sdp-xat-previa-interna">{cos}</div>;
  }
  return (
    <Link className="sdp-xat-previa-interna" to={previa.ruta}>
      {cos}
    </Link>
  );
}

function textDeSistema(missatge, t) {
  const clau = missatge?.metadades?.clau;
  const parametres = missatge?.metadades?.parametres || {};
  const generic = t('section.xat.sistema.generic', 'Missatge del sistema');
  if (!clau) return missatge?.text || generic;
  let text = t(`section.xat.sistema.${clau}`, generic);
  for (const [nom, valor] of Object.entries(parametres)) text = text.replace(`{${nom}}`, () => String(valor ?? ''));
  return text;
}

function Bombolla({
  missatge, esGrup = false, locale, t, configAdjunts, usuariAdjunts,
  seleccio = null, onReintenta, onDescarta, onCopia,
  primerDelGrup = true, citat = null, onVesACita = null, onRespon = null, ressaltat = false,
  onDenuncia = null, onBloqueja = null, nomAutor = '', actorLlista = null, onMutaLlista = null,
  onObriImatge = null, caraAutor = null, entitatId = null,
  caraPropia = null, nomPropi = '', rutaPropia = null,
  reaccions = null, destacat = false, fixat = false,
  onResponEnPrivat = null, onReacciona = null, onDestaca = null, onFixa = null,
  onReenvia = null, onEnviaPrivat = null, onElimina = null, onSelecciona = null,
  onCancelaEnviament = null,
  onCapaFlotantCanvia = null
}) {
  const [menuObert, setMenuObert] = useState(false);
  const [menuAmunt, setMenuAmunt] = useState(false);
  const [paletaOberta, setPaletaOberta] = useState(false);
  const [catalegEmojisObert, setCatalegEmojisObert] = useState(false);
  const menuRef = useRef(null);
  const menuLlistaRef = useRef(null);
  const botoRef = useRef(null);
  const paletaRef = useRef(null);
  const botoReaccioRef = useRef(null);
  const botoReenviaRef = useRef(null);
  const arrelRef = useRef(null);
  const idSelectorEmojis = useId();

  const triable = Boolean(seleccio?.actiu);
  const meu = missatge.sender === 'me';
  const esborrat = Boolean(missatge.esborrat) || Boolean(missatge.esborratAl);
  const estat = missatge.estatEnviament || 'enviat';
  const enError = estat === 'error';
  const tancat = !esborrat && esXifratTancat(missatge);
  const text = tancat ? '' : missatge.text ?? missatge.content ?? '';
  const triat = Boolean(seleccio?.triat);

  const confirmat = !esborrat && missatge.id != null && estat !== 'pendent' && !enError;
  const obertContingut = confirmat && !tancat;

  const nomPersonaAltre = !meu && !missatge.is_ai && !missatge.comEntitat
    ? String(nomAutor || missatge.author || missatge.author_name || '').trim()
    : '';
  const potRespondre = typeof onRespon === 'function' && confirmat;
  const potRespondreEnPrivat = esGrup && !meu && Boolean(nomPersonaAltre) && typeof onResponEnPrivat === 'function' && confirmat;
  const potReaccionar = typeof onReacciona === 'function' && obertContingut;
  const potDestacar = typeof onDestaca === 'function' && obertContingut;
  const potFixar = typeof onFixa === 'function' && obertContingut;
  const potReenviar = typeof onReenvia === 'function' && obertContingut;
  const potCopiar = Boolean(text);

  const potEnviarPrivat = esGrup && !meu && Boolean(nomPersonaAltre) && typeof onEnviaPrivat === 'function' && confirmat;
  const potDenunciar = typeof onDenuncia === 'function';
  const nomBloqueig = String(nomAutor || '').trim();
  const potBloquejar = typeof onBloqueja === 'function' && Boolean(nomBloqueig);

  /* XAT-B01 (v1.2.25 · Lot G6, K-G6-PENDENT) · Una bombolla pròpia pendent es cancel·la, no s'elimina: amb
     onCancelaEnviament (XatContext.cancelaEnviament, via XatSection i Conversa), l'entrada diu «Cancel·la
     l'enviament» i la crida directament, sense el diàleg d'eliminar. Sense ella, «Elimina» de sempre: el
     rètol només promet el que fa el clic. */
  const potCancelarEnviament = estat === 'pendent' && typeof onCancelaEnviament === 'function'
    && !esborrat && missatge.id != null;
  const potEliminar = !potCancelarEnviament && typeof onElimina === 'function' && !esborrat && missatge.id != null;
  const potSeleccionar = typeof onSelecciona === 'function' && !esborrat && missatge.id != null;

  const teBloc1 = potRespondre || potRespondreEnPrivat || potReaccionar || potDestacar || potFixar || potReenviar || potCopiar;
  const teBloc2 = potEnviarPrivat || potDenunciar || potBloquejar;
  const teBloc3 = potCancelarEnviament || potEliminar || potSeleccionar;

  const teMenu = missatge.tipus !== 'sistema' && !missatge.bloquejat && !triable && !esborrat && (teBloc1 || teBloc2 || teBloc3);
  const menuVisible = menuObert && teMenu;
  const teExteriors = !triable && obertContingut && (potReaccionar || potReenviar);
  const paletaVisible = paletaOberta && potReaccionar && !triable;
  const capaFlotantOberta = menuVisible || paletaVisible;

  useEffect(() => {
    if (typeof onCapaFlotantCanvia !== 'function') return undefined;
    const clau = missatge.id ?? missatge.seq ?? null;
    if (clau == null) return undefined;
    onCapaFlotantCanvia(clau, capaFlotantOberta);
    return () => {
      if (capaFlotantOberta) onCapaFlotantCanvia(clau, false);
    };
  }, [onCapaFlotantCanvia, missatge.id, missatge.seq, capaFlotantOberta]);

  useEffect(() => { if (!teMenu && menuObert) setMenuObert(false); }, [teMenu, menuObert]);
  useEffect(() => {
    if ((!potReaccionar || triable) && (paletaOberta || catalegEmojisObert)) {
      setPaletaOberta(false);
      setCatalegEmojisObert(false);
    }
  }, [potReaccionar, triable, paletaOberta, catalegEmojisObert]);

  useEffect(() => {
    const node = arrelRef.current;
    if (!triable || !node) return undefined;
    const para = (e) => { if (typeof e.target?.pause === 'function') e.target.pause(); };
    node.querySelectorAll('audio, video').forEach((media) => media.pause());
    node.addEventListener('play', para, true);
    return () => node.removeEventListener('play', para, true);
  }, [triable]);

  const tancaMenu = useCallback(() => {
    setMenuObert(false);
    botoRef.current?.focus();
  }, []);
  const teCapaDamunt = useCapaEnrere(menuVisible, tancaMenu);

  const tancaPaleta = useCallback(() => {
    setCatalegEmojisObert(false);
    setPaletaOberta(false);
    (botoReaccioRef.current || botoRef.current)?.focus();
  }, []);
  const teCapaDamuntPaleta = useCapaEnrere(paletaVisible && !catalegEmojisObert, tancaPaleta);

  useEffect(() => {
    if (!menuVisible) return undefined;
    const node = menuRef.current;
    node?.querySelector('[role="menuitem"]')?.focus();
    const arrel = node?.getRootNode?.() || document;
    const tancaFora = (e) => { if (node && !node.contains(e.target)) setMenuObert(false); };
    const tancaEsc = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || teCapaDamunt()) return;
      e.preventDefault();
      tancaMenu();
    };
    arrel.addEventListener('pointerdown', tancaFora);
    arrel.addEventListener('keydown', tancaEsc);
    return () => {
      arrel.removeEventListener('pointerdown', tancaFora);
      arrel.removeEventListener('keydown', tancaEsc);
    };
  }, [menuVisible, tancaMenu, teCapaDamunt]);

  /* D-v128-2 · En obrir-se, el menú es mesura cap avall (el pintat de sempre). Si la llista o la
     pantalla el retallen, s'obri cap amunt o puja el just, abans del pintat (oberturaMenu.js).
     Amb onCapaFlotantCanvia (l'espècimen de /disseny) el pare ja li fa lloc i no es mou. */
  useLayoutEffect(() => {
    if (!menuVisible) { setMenuAmunt(false); return; }
    if (typeof onCapaFlotantCanvia === 'function') return;
    const menu = menuLlistaRef.current;
    const ancora = menuRef.current;
    const limits = menu ? limitsVisibles(menu) : null;
    if (!menu || !ancora || !limits) return;
    const ancoraDalt = ancora.getBoundingClientRect().top;
    const { amunt, dalt, sostre } = triaOberturaMenu({
      ancoraDalt,
      menuDalt: ancoraDalt + menu.offsetTop,
      alcada: menu.offsetHeight,
      limitDalt: limits.dalt,
      limitBaix: limits.baix,
      separacio: 4   // --sdp-space-1
    });
    if (dalt != null) menu.style.top = `${dalt}px`;
    if (sostre != null) menu.style.maxBlockSize = `${sostre}px`;
    if (!amunt) return;
    adoptaFullDiferit(menu, 'xat-menu', cssXatMenu);
    setMenuAmunt(true);
  }, [menuVisible, onCapaFlotantCanvia]);

  useEffect(() => {
    if (!paletaVisible) return undefined;
    const node = paletaRef.current;
    if (!catalegEmojisObert) {
      node?.querySelector('button')?.focus();
    }
    const arrel = node?.getRootNode?.() || document;
    const tancaFora = (e) => {
      if (node && !node.contains(e.target) && !botoReaccioRef.current?.contains?.(e.target)) {
        setCatalegEmojisObert(false);
        setPaletaOberta(false);
      }
    };
    const tancaEsc = (e) => {
      if (catalegEmojisObert || e.key !== 'Escape' || e.defaultPrevented || teCapaDamuntPaleta()) return;
      e.preventDefault();
      tancaPaleta();
    };
    arrel.addEventListener('pointerdown', tancaFora);
    arrel.addEventListener('keydown', tancaEsc);
    return () => {
      arrel.removeEventListener('pointerdown', tancaFora);
      arrel.removeEventListener('keydown', tancaEsc);
    };
  }, [paletaVisible, catalegEmojisObert, tancaPaleta, teCapaDamuntPaleta]);

  const alTeclatDelMenu = (e) => {
    if (mouFocusDelMenu(e)) return;
    if (e.key === 'Tab') tancaMenu();
  };
  /* Abans de cap retorn anticipat (regla dels hooks). Una nota de veu adopta el full del contenidor
     .sdp-xat-bombolla-wrap--veu; adoptar-lo de més és idempotent i no pinta res. */
  useFullDiferit(missatge.tipus === 'veu' ? arrelRef : null, 'xat-veu', cssXatVeu);

  const meuIdEfectiu = actorLlista?.id ?? usuariAdjunts ?? (meu ? missatge.usuariId : null) ?? null;
  const fontReaccions = reaccions ?? missatge.reaccions ?? missatge.metadades?.reaccions ?? null;
  const llistaReaccions = useMemo(
    () => (esborrat || tancat ? CAP_REACCIO : normalitzaReaccions(fontReaccions, meuIdEfectiu)),
    [esborrat, tancat, fontReaccions, meuIdEfectiu]
  );

  const esDestacat = Boolean(destacat || missatge.destacat || missatge.metadades?.destacat);
  const esFixat = Boolean(fixat || missatge.fixat || missatge.metadades?.fixat);

  const previaInterna = useMemo(
    () => (!esborrat && !tancat && (potReenviar || missatge.mostraPrevia === true) ? extreuPreviaInterna(text) : null),
    [esborrat, tancat, potReenviar, missatge.mostraPrevia, text]
  );

  if (missatge.tipus === 'sistema') {
    return (
      <li className="sdp-xat-sistema">
        <span className="sdp-xat-sistema__text">{textDeSistema(missatge, t)}</span>
      </li>
    );
  }

  if (missatge.bloquejat) {
    return (
      <li
        className="sdp-xat-item sdp-xat-item--altre"
        data-vist={missatge.seq ?? undefined}
        data-missatge={missatge.id ?? undefined}
        tabIndex={-1}
      >
        <p className="sdp-xat-bloquejat">{t('section.moderacio.bloquejat.missatge', 'Missatge amagat: has bloquejat esta persona.')}</p>
      </li>
    );
  }

  const hora = etiquetaHora(missatge.creatAl, locale);
  const triaDelMenu = (accio) => {
    setMenuObert(false);
    botoRef.current?.focus();
    accio(botoRef.current);
  };
  const triaEmojiReaccio = (emoji) => {
    setCatalegEmojisObert(false);
    setPaletaOberta(false);
    onReacciona?.(missatge, emoji);
    (botoReaccioRef.current || botoRef.current)?.focus();
  };

  const respostaA = missatge.respostaA ?? null;
  const rutesDeLaWiki = !meu && !triable && Boolean(missatge.is_ai) && esIAIA(missatge.usuariId);
  const llistaComu = esborrat || tancat ? null : llistaDeMissatge(missatge);
  const ubicacioMissatge = esborrat || tancat ? null : ubicacioDeMissatge(missatge);
  const hrefMapa = ubicacioMissatge ? urlMapaUbicacio(ubicacioMissatge) : null;

  const propsSeleccio = triable ? {
    role: 'checkbox',
    'aria-checked': triat,
    tabIndex: 0,
    onClick: () => seleccio.onAlterna(),
    onKeyDown: (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); seleccio.onAlterna(); }
    }
  } : {};

  const esVeu = !esborrat && !tancat && missatge.tipus === 'veu' && Boolean(missatge.metadades?.adjunt?.id);

  const itemClass = [
    'sdp-xat-item',
    meu ? 'sdp-xat-item--meu' : 'sdp-xat-item--altre',
    primerDelGrup ? null : 'sdp-xat-item--segueix',
    ressaltat ? 'sdp-xat-item--ressaltat' : null,
    triable ? 'sdp-xat-item--triable' : null,
    triat ? 'sdp-xat-item--triat' : null,
    capaFlotantOberta ? 'sdp-xat-item--obert' : null
  ].filter(Boolean).join(' ');

  const wrapClass = [
    'sdp-xat-bombolla-wrap',
    esVeu ? 'sdp-xat-bombolla-wrap--veu' : null,
    teExteriors ? 'sdp-xat-bombolla-wrap--amb-exteriors' : null
  ].filter(Boolean).join(' ');

  const bombollaClass = [
    'sdp-xat-bombolla',
    meu ? 'sdp-xat-bombolla--meu' : 'sdp-xat-bombolla--altre',
    primerDelGrup ? 'sdp-xat-bombolla--cua' : null,
    enError ? 'sdp-xat-bombolla--error' : null,
    llistaComu ? 'sdp-xat-bombolla--llista' : null,
    teMenu ? 'sdp-xat-bombolla--amb-pestanya' : null
  ].filter(Boolean).join(' ');

  const renderAvatarEspill = () => {
    if (esborrat) return null;
    if (!primerDelGrup) return <span className="sdp-xat-bombolla__espai-cara" aria-hidden="true" />;
    if (meu) {
      const nomMeu = String(nomPropi || actorLlista?.nom || missatge.author || t('section.xat.perfil.tu', 'Tu')).trim();
      const llavorMeua = String(meuIdEfectiu || nomMeu || 'jo');
      const rutaMeua = !triable
        ? (rutaPropia || (meuIdEfectiu ? rutaDAutoria({ tipus: 'persona', id: meuIdEfectiu }) : null) || RUTA_PERFIL_PROPI)
        : null;
      const avatarPropiNode = (
        <CaraXat
          nom={nomMeu}
          src={caraPropia}
          llavor={llavorMeua}
          mida="sm"
          alt=""
          className="sdp-xat-bombolla__avatar-grup"
        />
      );
      if (rutaMeua) {
        return (
          <Link
            className="sdp-xat-bombolla__cara sdp-xat-bombolla__cara--enllac"
            to={rutaMeua}
            aria-label={t('section.xat.perfil.obriMeu', 'Obri el meu perfil')}
          >
            {avatarPropiNode}
          </Link>
        );
      }
      return (
        <span className="sdp-xat-bombolla__cara" aria-hidden="true">
          {avatarPropiNode}
        </span>
      );
    }

    const autorCara = dadesAutorDeMissatge(missatge, triable, t, entitatId);
    const fontCara = caraAutor || (autorCara.esIA && esIAIA(missatge.usuariId) ? CARA_DE_LA_IAIA.src : null);
    const teEnllacAutorVisible = Boolean(autorCara.ruta && (esGrup || autorCara.esIA || autorCara.esEntitat));
    const avatarNode = (
      <CaraXat
        nom={autorCara.nom}
        src={fontCara}
        llavor={autorCara.llavor}
        mida="sm"
        alt=""
        className="sdp-xat-bombolla__avatar-grup"
      />
    );
    if (autorCara.ruta) {
      return (
        <Link
          className="sdp-xat-bombolla__cara sdp-xat-bombolla__cara--enllac"
          to={autorCara.ruta}
          tabIndex={teEnllacAutorVisible ? -1 : undefined}
          aria-hidden={teEnllacAutorVisible ? 'true' : undefined}
          aria-label={teEnllacAutorVisible
            ? undefined
            : t('section.xat.perfil.obri', 'Obri el perfil de {nom}').replace('{nom}', () => autorCara.nom)}
        >
          {avatarNode}
        </Link>
      );
    }
    return (
      <span className="sdp-xat-bombolla__cara" aria-hidden="true">
        {avatarNode}
      </span>
    );
  };

  return (
    <li
      className={itemClass}
      data-vist={!meu && missatge.seq != null ? missatge.seq : undefined}
      data-missatge={missatge.id ?? undefined}
      tabIndex={-1}
      ref={arrelRef}
      {...propsSeleccio}
    >
      <div className={wrapClass} data-sdp-e2ee={missatge.e2ee === true || missatge.seguretat?.xifrat === true || missatge.xifrat ? 'true' : undefined}>
        {triable ? (
          <span className="sdp-xat-marca-tria" aria-hidden="true">
            {triat ? <CheckCircle2 size={20} focusable="false" /> : <Circle size={20} focusable="false" />}
          </span>
        ) : null}
        {renderAvatarEspill()}
        <div className="sdp-xat-bombolla-col">
          <article className={bombollaClass}>
            {!meu && !esborrat && primerDelGrup ? (
              <AutorDeLaBombolla missatge={missatge} esGrup={esGrup} triable={triable} t={t} entitatId={entitatId} />
            ) : null}
            {!esborrat && respostaA != null ? (
              <CitaResposta citat={citat} onVes={onVesACita} interactiva={!triable} t={t} />
            ) : null}
            {previaInterna && !respostaA ? (
              <PreviaEnllacIntern previa={previaInterna} interactiu={!triable} />
            ) : null}
            {esborrat ? (
              <p className="sdp-xat-bombolla__text sdp-xat-bombolla__text--esborrat">
                {t('section.xat.missatge.esborrat', "S'ha esborrat este missatge")}
              </p>
            ) : tancat ? (
              <p className="sdp-xat-bombolla__text sdp-xat-bombolla__text--esborrat">{t(...textXifratTancat(missatge))}</p>
            ) : llistaComu ? (
              <TargetaLlistaComu llista={llistaComu} actor={actorLlista} interactiva={!triable} onMuta={onMutaLlista} />
            ) : ['imatge', 'video', 'veu', 'document'].includes(missatge.tipus) && missatge.metadades?.adjunt?.id ? (
              <>
                <AdjuntXat
                  key={missatge.tipus === 'veu' && triable ? 'veu-quieta' : 'adjunt'}
                  adjunt={missatge.metadades.adjunt}
                  tipus={missatge.tipus}
                  externalConfig={configAdjunts}
                  usuariId={usuariAdjunts}
                  locale={locale}
                  t={t}
                  interactiu={!triable}
                  onObriImatge={!triable && missatge.tipus === 'imatge' && typeof onObriImatge === 'function' ? (url, obridor) => onObriImatge(missatge, url, obridor) : null}
                />
                {String(text ?? '').trim() ? <p className="sdp-xat-bombolla__text" dir="auto"><TextAmbEnllacos text={text} t={t} rutesDeLaWiki={rutesDeLaWiki} interactiu={!triable} /></p> : null}
              </>
            ) : (
              <p className="sdp-xat-bombolla__text" dir="auto"><TextAmbEnllacos text={text} t={t} rutesDeLaWiki={rutesDeLaWiki} interactiu={!triable} /></p>
            )}
            {missatge.accioRegistre === true && !meu && !esborrat && !tancat ? <EnllacARegistre t={t} interactiu={!triable} /> : null}
            {hrefMapa ? (
            !triable ? (
              <a
                className="sdp-xat-ubicacio-xip"
                href={hrefMapa}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin size={15} aria-hidden="true" focusable="false" />
                <span>{t('section.xat.ubicacio.veureMapa', 'Veure al mapa')}</span>
              </a>
            ) : (
              <span className="sdp-xat-ubicacio-xip">
                <MapPin size={15} aria-hidden="true" focusable="false" />
                <span>{t('section.xat.ubicacio.veureMapa', 'Veure al mapa')}</span>
              </span>
            )
          ) : null}
          <span className="sdp-xat-bombolla__meta">
              {esFixat ? (
                <span className="sdp-xat-bombolla__insignia-estat" title={t('section.xat.missatge.fixatEtiqueta', 'Missatge fixat')}>
                  <Pin size={12} aria-hidden="true" focusable="false" />
                  <span className="sdp-nomes-lector">{t('section.xat.missatge.fixatEtiqueta', 'Missatge fixat')}</span>
                </span>
              ) : null}
              {esDestacat ? (
                <span className="sdp-xat-bombolla__insignia-estat" title={t('section.xat.missatge.destacat', 'Missatge destacat')}>
                  <Star size={12} aria-hidden="true" focusable="false" />
                  <span className="sdp-nomes-lector">{t('section.xat.missatge.destacat', 'Missatge destacat')}</span>
                </span>
              ) : null}
              {hora ? <time dateTime={missatge.creatAl || undefined}>{hora}</time> : null}
              {meu && !esborrat ? <MarquesEstat estat={estat} rebutsConeguts={missatge.rebutsConeguts !== false} t={t} /> : null}
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
          </article>

          {teMenu ? (
            <div className={menuObert ? 'sdp-xat-bombolla__accions sdp-xat-bombolla__accions--obert' : 'sdp-xat-bombolla__accions'} ref={menuRef}>
              <button
                ref={botoRef}
                type="button"
                className="sdp-xat-bombolla__pestanya"
                aria-label={t('section.xat.missatge.opcions', 'Opcions del missatge')}
                aria-haspopup="menu"
                aria-expanded={menuVisible}
                onClick={() => { setPaletaOberta(false); setCatalegEmojisObert(false); setMenuObert((obert) => !obert); }}
              >
                <span className="sdp-xat-bombolla__pestanya-disc" aria-hidden="true">
                  <ChevronDown size={16} focusable="false" />
                </span>
              </button>
              {menuVisible ? (
                <div ref={menuLlistaRef} className={menuAmunt ? 'sdp-xat-menu sdp-xat-menu--amunt' : 'sdp-xat-menu'} role="menu" onKeyDown={alTeclatDelMenu}>
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
                  {potRespondreEnPrivat ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="sdp-xat-menu__item"
                      onClick={() => { setMenuObert(false); onResponEnPrivat(missatge); }}
                    >
                      <MessageSquare size={18} aria-hidden="true" focusable="false" />
                      {t('section.xat.missatge.responPrivat', 'Respon en privat')}
                    </button>
                  ) : null}
                  {potReaccionar ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="sdp-xat-menu__item"
                      onClick={() => {
                        setMenuObert(false);
                        setCatalegEmojisObert(false);
                        setPaletaOberta(true);
                      }}
                    >
                      <Smile size={18} aria-hidden="true" focusable="false" />
                      {t('section.xat.missatge.reacciona', 'Reacciona')}
                    </button>
                  ) : null}
                  {potDestacar ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="sdp-xat-menu__item"
                      onClick={() => {
                        setMenuObert(false);
                        onDestaca(missatge, !esDestacat);
                        botoRef.current?.focus();
                      }}
                    >
                      <Star size={18} aria-hidden="true" focusable="false" />
                      {esDestacat
                        ? t('section.xat.missatge.desdestaca', 'Lleva dels destacats')
                        : t('section.xat.missatge.destaca', 'Destaca')}
                    </button>
                  ) : null}
                  {potFixar ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="sdp-xat-menu__item"
                      onClick={() => {
                        setMenuObert(false);
                        onFixa(missatge, !esFixat);
                        botoRef.current?.focus();
                      }}
                    >
                      <Pin size={18} aria-hidden="true" focusable="false" />
                      {esFixat
                        ? t('section.xat.missatge.desfixa', 'Desfixa')
                        : t('section.xat.missatge.fixa', 'Fixa')}
                    </button>
                  ) : null}
                  {potReenviar ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="sdp-xat-menu__item"
                      onClick={() => triaDelMenu((obridor) => onReenvia(missatge, obridor))}
                    >
                      <CornerUpRight size={18} aria-hidden="true" focusable="false" />
                      {t('section.xat.missatge.reenvia', 'Reenvia')}
                    </button>
                  ) : null}
                  {potCopiar ? (
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

                  {teBloc1 && teBloc2 ? <hr className="sdp-xat-menu__divisor" /> : null}

                  {potEnviarPrivat ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="sdp-xat-menu__item"
                      onClick={() => { setMenuObert(false); onEnviaPrivat(missatge); }}
                    >
                      <MessageSquare size={18} aria-hidden="true" focusable="false" />
                      {t('section.xat.missatge.enviaPrivat', 'Envia un missatge a {nom}').replace('{nom}', () => nomPersonaAltre)}
                    </button>
                  ) : null}
                  {potDenunciar ? (
                    <button type="button" role="menuitem" className="sdp-xat-menu__item" onClick={() => triaDelMenu(onDenuncia)}>
                      <Flag size={18} aria-hidden="true" focusable="false" />
                      {t('section.moderacio.denunciaMissatge', 'Denuncia el missatge')}
                    </button>
                  ) : null}
                  {potBloquejar ? (
                    <button type="button" role="menuitem" className="sdp-xat-menu__item" onClick={() => triaDelMenu(onBloqueja)}>
                      <Ban size={18} aria-hidden="true" focusable="false" />
                      {t('section.moderacio.bloqueja', 'Bloqueja {nom}').replace('{nom}', () => nomBloqueig)}
                    </button>
                  ) : null}

                  {(teBloc1 || teBloc2) && teBloc3 ? <hr className="sdp-xat-menu__divisor" /> : null}

                  {potCancelarEnviament ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="sdp-xat-menu__item sdp-xat-menu__item--perill"
                      onClick={() => triaDelMenu(() => onCancelaEnviament(missatge))}
                    >
                      <Trash2 size={18} aria-hidden="true" focusable="false" />
                      {textXatV1225(locale, 'missatge.cancellaEnviament')}
                    </button>
                  ) : null}
                  {potEliminar ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="sdp-xat-menu__item sdp-xat-menu__item--perill"
                      onClick={() => triaDelMenu((obridor) => onElimina(missatge, obridor))}
                    >
                      <Trash2 size={18} aria-hidden="true" focusable="false" />
                      {t('section.xat.missatge.elimina', 'Elimina')}
                    </button>
                  ) : null}
                  {potSeleccionar ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="sdp-xat-menu__item"
                      onClick={() => { setMenuObert(false); onSelecciona(missatge); }}
                    >
                      <ListChecks size={18} aria-hidden="true" focusable="false" />
                      {t('section.xat.missatge.selecciona', 'Selecciona missatges')}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {paletaVisible ? (
            <div
              className="sdp-xat-reaccions-paleta-wrap"
              ref={paletaRef}
            >
              <div
                className="sdp-xat-reaccions-paleta"
                role="toolbar"
                aria-label={t('section.xat.missatge.reaccionsRapides', 'Reaccions ràpides')}
              >
                {EMOJIS_REACCIO_RAPIDA.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="sdp-xat-reaccions-paleta__emoji"
                    aria-label={`${t('section.xat.missatge.reacciona', 'Reacciona')}: ${emoji}`}
                    onClick={() => triaEmojiReaccio(emoji)}
                  >
                    <span aria-hidden="true">{emoji}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="sdp-xat-reaccions-paleta__mes"
                  aria-label={t('section.xat.missatge.mesEmojis', 'Més emoticones')}
                  aria-expanded={catalegEmojisObert}
                  onClick={() => setCatalegEmojisObert((v) => !v)}
                >
                  <Plus size={18} aria-hidden="true" focusable="false" />
                </button>
              </div>
              {catalegEmojisObert ? (
                <div className="sdp-xat-reaccions-cataleg" role="dialog" aria-label={t('section.xat.emoticones.titol', 'Emoticones')}>
                  <SelectorEmoticones
                    id={idSelectorEmojis}
                    t={t}
                    enfocaEnObrir
                    onTria={(glif) => {
                      triaEmojiReaccio(glif);
                      return true;
                    }}
                    onTanca={() => setCatalegEmojisObert(false)}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {llistaReaccions.length > 0 ? (
            <div className={meu ? 'sdp-xat-reaccions sdp-xat-reaccions--meu' : 'sdp-xat-reaccions'}>
              {llistaReaccions.map(({ emoji, quants, meua }) => {
                const classePindola = meua
                  ? 'sdp-xat-reaccio-pindola sdp-xat-reaccio-pindola--meua'
                  : 'sdp-xat-reaccio-pindola';
                const contingutPindola = (
                  <>
                    <span className="sdp-xat-reaccio-pindola__emoji" aria-hidden="true">{emoji}</span>
                    <span className="sdp-xat-reaccio-pindola__num">{quants}</span>
                  </>
                );
                if (triable || !potReaccionar) {
                  return (
                    <span key={emoji} className={classePindola}>
                      {contingutPindola}
                    </span>
                  );
                }
                return (
                  <button
                    key={emoji}
                    type="button"
                    className={classePindola}
                    aria-pressed={meua}
                    aria-label={t('section.xat.missatge.reaccioPindola', 'Reacció {emoji}, {n}')
                      .replace('{emoji}', () => emoji)
                      .replace('{n}', String(quants))}
                    onClick={() => onReacciona(missatge, emoji)}
                  >
                    {contingutPindola}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {teExteriors ? (
          <div className="sdp-xat-bombolla__exteriors">
            {potReaccionar ? (
              <button
                ref={botoReaccioRef}
                type="button"
                className="sdp-xat-bombolla__exterior"
                aria-label={t('section.xat.missatge.reacciona', 'Reacciona')}
                aria-expanded={paletaVisible}
                onClick={() => {
                  setMenuObert(false);
                  setCatalegEmojisObert(false);
                  setPaletaOberta((v) => !v);
                }}
              >
                <span className="sdp-xat-bombolla__exterior-disc" aria-hidden="true">
                  <Smile size={18} focusable="false" />
                </span>
              </button>
            ) : null}
            {potReenviar ? (
              <button
                ref={botoReenviaRef}
                type="button"
                className="sdp-xat-bombolla__exterior"
                aria-label={t('section.xat.missatge.reenvia', 'Reenvia')}
                onClick={() => {
                  setMenuObert(false);
                  setPaletaOberta(false);
                  onReenvia(missatge, botoReenviaRef.current);
                }}
              >
                <span className="sdp-xat-bombolla__exterior-disc" aria-hidden="true">
                  <CornerUpRight size={18} focusable="false" />
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export default memo(Bombolla);
