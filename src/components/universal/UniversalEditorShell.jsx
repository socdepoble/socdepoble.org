import { Image as ImageIcon, Crop, SlidersHorizontal } from 'lucide-react';
import { DateTimeControl, Alerta, Boto, SelectorDataHora } from '../PedraSeca/index.js';
import { BotoVisibilitat } from './barres/BotoVisibilitat.jsx';
import { ETIQUETA_RESERVA_ARA, dataHoraEdicio } from './barres/dataHoraBarra.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { extractPlainText } from '../../utils/contentAdapter.js';
import useHeroImageHandler, { validaFitxerImatge } from '../../hooks/useHeroImageHandler.js';
import { useResolvedAsset } from '../../hooks/useResolvedAsset.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { Component, useRef, useCallback, useEffect, useId, useLayoutEffect, useState } from 'react';
import { useContent } from './ContentProvider.jsx';
import { useToast } from './NotificationContext.jsx';
import { IconaEstatDesament, RegioEstatDesament } from './EstatDesament.jsx';
import { DialegEnquadrament } from './enquadrament/DialegEnquadrament.jsx';
import { FORMATS } from './enquadrament/enquadrament.js';
import { configDeForma, costatDeSortida } from './enquadrament/useEnquadramentImatge.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { TEXTOS_LLAVOR } from './textosLlavor.js';
import { FORASTER } from './UniversalUtils';

/* T36 (ordre del Mestre, 260928) · Mentre s'edita, Comentar, Compartir i
   Connectar es veuen com a la publicació però no fan la seua acció; Índex i
   Traduir continuen vius.
   T7 (P7) · Els tres porten aria-disabled="true" (BarraBlava) i continuen
   enfocables i clicables. El clic ja no pinta cap avís en línia que empenga
   el contingut cap avall: mostra un missatge ràpid (useToast, el patró de
   VistaEnConstruccio) propi de cada botó, que se'n va sol als
   DURADA_AVIS_ACCIONS mil·lisegons. */
/* Gauntlet 261016 (Bloc 3.9; verificació de la MCR) · Traduir tampoc no és
   operatiu: en edició portava a /traduccions (UniversalPage) i treia la
   persona de l'editor sense cap avís. Ara es pinta igual, porta
   aria-disabled i el clic diu el seu missatge (BarraBlava · traduirInoperatiu). */
export const AVISOS_ACCIONS_EDICIO = Object.freeze({
  comentar: 'Comentar no està operatiu mentre edites. Quan es publique, obrirà el xat per a comentar-ho.',
  compartir: 'Compartir no està operatiu mentre edites. Quan es publique, servirà per a enviar-ne l’enllaç.',
  connectar: 'Connectar no està operatiu mentre edites. Quan es publique, servirà per a guardar-ho al Bloc de Notes.',
  traduir: 'Traduir no està operatiu mentre edites. Quan es publique, servirà per a llegir-ho en una altra llengua.',
});
export const DURADA_AVIS_ACCIONS = 5000;

// Error Boundary per protegir l'editor i evitar tombar la pàgina hoste
class EditorErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("EditorErrorBoundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="sdp-estat sdp-estat--error">
          <div className="sdp-estat__contenidor">
            <h3 className="sdp-estat__titol">L'editor ha fallat</h3>
            <p className="sdp-estat__descripcio">S'ha produït un error inesperat dins del motor d'edició. Torna a carregar la pàgina per a continuar.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* A3 · Un camp que la persona ha buidat es desa com a cadena buida. El
   contenteditable hi deixa restes (<br>, salts, espais, &nbsp;) que es
   pintarien com a línies en blanc a la targeta i al Mur. */
function valorDelCamp(html) {
  const net = sanitizeHtml(html);
  return (extractPlainText(net, Infinity) || /<img\b/i.test(net)) ? net : '';
}

/* T47 (ordre del Mestre, 260928) · Els avisos en línia dels camps, davall de
   l'H2 i l'entradilla (just després de .page-intro): l'error persistent
   (role=alert, amb les seues eixides) i, a partir del 80 % del límit, el
   comptador. Sense avisos no es pinta res. T66 · `icon`, l'emoticona del
   Perfil: un rebuig del servidor (sense columna, validació) també es veu. */
const ETIQUETES_CAMP = Object.freeze({
  title: 'Títol', subtitle: 'Subtítol', lead: 'Entradilla', content: 'Cos',
  heroImage: 'Capçalera', logoImage: 'Avatar', copyright: 'Drets d’autor', icon: 'Emoticona',
});
const CAMPS_AMB_AVIS = Object.keys(ETIQUETES_CAMP);

/* Poliment T47 (ordre del Mestre, 260928) · On torna el focus després d'una
   acció d'avís: el botó premut sol desaparéixer amb l'avís i el focus cauria
   al body. Cada camp té un destí estable dins de la closca (el camp, l'editor
   del cos, la capçalera, l'avatar, el disparador dels drets); si no n'hi ha
   cap, el títol, que és el primer camp del document. T66b · L'emoticona torna
   al botó de l'espai central de la barra taronja (EmoticonaBarra), que és
   dins de la closca; en lectura no hi ha botó i el focus va al títol.
   Ordre del Mestre (261007, ordre E) · L'avatar redó del Perfil (PageFrame,
   avatarAutor amb onCanvia) és el botó de l'avatar quan no hi ha ranura.
   Decisió del Mestre (261008) · El disparador dels drets és el que porta
   data-sdp-drets: la píndola de davall del títol (BotoDretsAutor) i, en
   edició, el copyright de la capçalera (PageFrame). La píndola va primer al
   DOM. La classe d'abans (.sdp-copyright-selector) ja no la porta cap
   disparador: el focus queia al títol.
   Gauntlet 261016 (Bloc 3.9) · Amb «Edició avançada» la capçalera, el
   logotip, els drets i el botó «Emojis XL» de la botonera (l'últim) viuen
   dins del desplegable: cada destí afig el seu lloc d'allí, i el focus
   l'obri abans d'enfocar (el contingut d'un <details> plegat no rep el
   focus). Sense el desplegable, els selectors de sempre casen primer. */
const DESTINS_FOCUS = Object.freeze({
  title: '.editor-title-input',
  subtitle: '.editor-subtitle-input',
  lead: '.editor-lead-input',
  content: '.ProseMirror[contenteditable="true"]',
  heroImage: '.hero-image [role="button"], .hero-image button:not(:disabled), .sdp-edicio-avancada__capcalera [role="button"], .sdp-edicio-avancada__capcalera button:not(:disabled)',
  /* Encàrrec d'harmonització (261018) · L'avatar redó del Perfil també viu dins
     del desplegable (.sdp-edicio-avancada__identitat). */
  logoImage: '.page-title-logo-personalitzat [role="button"], .page-title-logo-personalitzat button:not(:disabled), .page-title .page-title-avatar--canvia, .sdp-edicio-avancada__identitat .page-title-avatar--canvia, .sdp-edicio-avancada__logotip [role="button"], .sdp-edicio-avancada__logotip button:not(:disabled)',
  copyright: '[data-sdp-drets]',
  icon: '.bar-orange > button.sdp-emoticona-barra--boto, .sdp-edicio-avancada .sdp-classificacio-botonera > button:last-child',
});

/* Bloc 3.9 · El text del desplegable. */
export const ETIQUETA_EDICIO_AVANCADA = 'Edició avançada';

function AvisosCamps({ avisos, onAccio }) {
  const camps = CAMPS_AMB_AVIS.filter((camp) => avisos?.[camp]?.error || avisos?.[camp]?.comptador);
  if (!camps.length) return null;
  /* Correcció de la revisió · role=alert és assertiu i atòmic: el lector el
     relleu sencer a cada canvi. La xifra viva va al comptador (línia no viva,
     primer fill, sempre al mateix lloc) i l'alerta porta un text estable:
     s'anuncia una vegada en aparéixer, no a cada tecla. */
  return (
    <ul className="sdp-avisos-camps">
      {camps.map((camp) => {
        const { error, comptador } = avisos[camp];
        const accions = error?.accions?.length ? error.accions.map((accio) => (
          <Boto key={accio.text} varietat="secundari" onClick={() => onAccio(camp, accio)}>{accio.text}</Boto>
        )) : null;
        return (
          <li key={camp}>
            {comptador ? (
              <p className="sdp-avis-camp__comptador">
                {`${ETIQUETES_CAMP[camp]}: ${comptador.llargaria} de ${comptador.maxim} caràcters`}
              </p>
            ) : null}
            {error ? (
              <Alerta to="error" titol={ETIQUETES_CAMP[camp]} accions={accions} className="sdp-avis-camp">
                <p>{error.missatge}</p>
              </Alerta>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function EditableField({ html, placeholder, onChange, onBlur, className }) {
  /* A2 · Mentre el camp té el focus, el DOM és de qui escriu. Si el valor que
     torna del pare es reinjectara a cada tecla, React reescriuria el contingut,
     el cursor tornaria a l'inici i «Hola» eixiria «aloH». El camp pinta un
     valor «mostrat» que només seguix `html` quan no té el focus. Els hooks van
     abans del return null perquè l'ordre no canvie entre renders. */
  const [enfocat, setEnfocat] = useState(false);
  const [mostrat, setMostrat] = useState(html);
  if (!enfocat && mostrat !== html) setMostrat(html);
  if (html === null) return null;
  return (
    <span
      className={className}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setEnfocat(true)}
      onInput={(e) => onChange?.(valorDelCamp(e.currentTarget.innerHTML))}
      onBlur={(e) => {
        const valor = valorDelCamp(e.currentTarget.innerHTML);
        // Buit de veres (sense el <br> que deixa el navegador): així el
        // placeholder ix amb :empty, sense dependre de :has().
        if (!valor) e.currentTarget.replaceChildren();
        setEnfocat(false);
        onBlur?.(valor);
      }}
      data-placeholder={placeholder}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(mostrat || '') }}
    />
  );
}

/* Línia I1 de l'Onada 4 (pla 261008_1201) · El text d'ajuda de sèrie de les
   dues ranures d'imatge (capçalera i logotip). Abans era escrit dues voltes
   al codi; ara n'és la reserva de heroEditHelp i de logoEditHelp. */
export const AJUDA_IMATGE_PER_DEFECTE = "Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.";
/* L'ajuda d'una ranura sense imatge mentre la seua imatge encara puja. */
export const AJUDA_IMATGE_PUJANT = 'Encara s’està desant la imatge. Quan acabe, la podràs tornar a canviar.';

/* Gauntlet 261016 (Bloc 1, Llei del Quadrat; pla §0.1.1) · La capçalera d'un
   document i la seua targeta (la miniatura del llistat i la del Mur) són la
   MATEIXA imatge: un quadrat de 1.200 × 1.200 exactes. El diàleg T46 de la
   closca ja no oferix «Original», «Apaisat» ni «Panoràmic» (una capçalera
   apaïsada no seria la imatge de la targeta): només la fila del quadrat del
   model, amb una ajuda pròpia, com l'avatar (FORMATS_AVATAR). El fitxer ix
   amb la forma i la mida de la capçalera del Perfil (FORMES.capcalera de
   useEnquadramentImatge, una sola constant per a les dues), també si cal
   ampliar el retall, i sempre recodificat. La panoràmica del poble (secció
   Pobles), l'única capçalera apaïsada, no passa per esta closca. */
const CAPCALERA = configDeForma('capcalera');
const QUADRAT_CAPCALERA = FORMATS.find((f) => f.valor === CAPCALERA.formatInicial) || CAPCALERA.formats[0];
export const AJUDA_FORMA_CAPCALERA = 'La capçalera sempre és quadrada: la miniatura del llistat i la targeta del Mur ensenyen la mateixa imatge. Si la nota ja és al Mur, la targeta no canvia fins que la tornes a publicar.';
export const FORMATS_CAPCALERA = Object.freeze([Object.freeze({ ...QUADRAT_CAPCALERA, ajuda: AJUDA_FORMA_CAPCALERA })]);
/* Sense «Tria la forma» (la de sèrie del diàleg): només n'hi ha una. */
export const DESCRIPCIO_ENQUADRAMENT_CAPCALERA = 'Mou la foto i amplia-la fins que el que importa quede dins del quadrat. Només es guarda el que hi ha dins.';
/** L'eixida exacta del diàleg de la capçalera per a una foto (File) o una adreça ja resolta. */
export const sortidaCapcalera = (font) => CAPCALERA.sortida(font);

export function UniversalEditorShell({
  id,
  titleHtml,
  subtitleHtml,
  leadHtml,
  onSaveField,
  onLocalChange,
  heroImage,
  logoImage,
  topBar,
  /* D13 · On va la barra d'eines. 'dalt' (per defecte): la fila d'eines
     damunt del document, com sempre. 'davall-entradilla': dins de l'article,
     just després de l'H2 i l'entradilla, i la barra blava passa a ser el
     primer element de la columna. Qualsevol altre valor es comporta com 'dalt'. */
  posicioEines = 'dalt',
  children,
  labels,
  isPublished = false,
  onImageUpload = null,
  formattedTime,
  formattedDate,
  barAuthorAvatar: propBarAuthorAvatar,
  barAuthorName: propBarAuthorName,
  barAuthorLocation: propBarAuthorLocation,
  /* Ordre del Mestre (261007) · «Quan isquen, les barres taronges han de
     portar a la pàgina de l'autor que l'ha creada». La ruta de la pàgina de
     qui signa (DocumentEditor, clau barAuthorHref): amb ella, l'autoria de la
     barra taronja és un enllaç. Sense, la topBarData de sempre. */
  barAuthorHref = null,
  showStatusToggle = true,
  showLogoUpload = true,
  /* T35 · Punt d'extensió genèric: amb `onHeroEdit`, el botó de la capçalera
     crida el pare ({ acaba }) en lloc d'obrir el selector de fitxers. Només
     el Perfil el passa (PerfilEditor); la resta de seccions no canvien. */
  heroEditLabel = 'Editar capçalera',
  heroEditHelp = AJUDA_IMATGE_PER_DEFECTE,
  onHeroEdit = null,
  /* Esmena 1 del pla 261007_1645 i ordre del Mestre (261007, ordre E) · El
     mirall exacte d'onHeroEdit per al logotip damunt de l'H1: amb
     `onLogoEdit`, el botó de la ranura crida el pare ({ acaba }) en lloc
     d'obrir el selector de fitxers, i `logoEditLabel` en dona el nom. Només
     el Perfil els passa (l'avatar d'una persona o d'un agent IA, que
     s'enquadra al diàleg); el Bloc de Notes continua amb «Editar logotip». */
  logoEditLabel = 'Editar logotip',
  onLogoEdit = null,
  /* Línia I1 de l'Onada 4 (pla 261008_1201) · Props opcionals que demanen
     els consumidors (el Perfil, que puja les imatges pel seu camí,
     useImatgeDeFitxa). Cap té efecte quan falta: el DOM de sempre.
     · `logoPujant` / `heroPujant`: la imatge de la fitxa puja fora del
       handler de la closca. Mentre puja, el control es bloqueja com amb la
       guarda pròpia (botó, «Esborrar» i «Enquadrar» desactivats, cap fitxer
       nou ni cap enquadrament). Quan acaba, si el focus s'ha perdut (Escape
       a mitja pujada), torna al botó (useFocusEnAcabarLaPujada).
     · `logoEditHelp`: el text d'ajuda de la ranura del logotip; per
       defecte, el de sempre (AJUDA_IMATGE_PER_DEFECTE).
     · `ajudaAmbImatge`: amb una imatge desada (capçalera o logotip) i
       onHeroEdit o onLogoEdit, una línia .sdp-camp__ajuda davall del botó en
       repòs, dins del seu mateix camp (el límit, dit abans de triar), i
       lligada al botó (aria-describedby). Mentre puja, AJUDA_IMATGE_PUJANT.
       Sense la prop, res. */
  logoPujant = false,
  heroPujant = false,
  logoEditHelp = AJUDA_IMATGE_PER_DEFECTE,
  ajudaAmbImatge = null,
  statusIcon = null,
  /* T41 (ordre del Mestre, 260928) · La bola del món (o el cadenat) de la
     barra taronja és un <button> que obri el selector de visibilitat del
     pare (DocumentEditor). Sense `onObriVisibilitat` no es pinta: cap botó
     que no fa res. `visibilitatOberta` dona l'aria-expanded. */
  onObriVisibilitat = null,
  etiquetaVisibilitat = '',
  visibilitatOberta = false,
  /* T40 (ordre del Mestre, 260928) · Amb `onPublishDateChange`, la pastilla
     de data és clicable i obri el calendari (SelectorDataHora); `publishDate`
     (ISO | null) és la data triada. Sense, la pastilla de sempre (<time>).
     `avisDataPublicacio` (text | null): avís honest dins del calendari quan la
     data no es desa com la resta (p. ex. una columna en quarantena). */
  publishDate = null,
  onPublishDateChange = null,
  avisDataPublicacio = null,
  /* Gauntlet 261017 (Bloc 0.1) · Sense `onToast`, els avisos de la capçalera
     i del logotip van pel mateix canal que els de les accions inoperants
     (useToast), no a la consola. */
  onToast = null,
  className = '',
  /* T47 (ordre del Mestre, 260928) · Opcionals. `estatDesament` = { estat,
     detall, accions?, reintentant? } pinta l'indicador de l'autodesament (EstatDesament) com a PRIMER element de la barra
     taronja (línia I1, pla 261008_1201: `reintentant` arriba a la icona, que
     pinta el check quan un error que la cua torna a provar passa a 'net');
     `avisosCamps` = { [camp]: { error?: { missatge, accions }, comptador? } }
     pinta els avisos en línia davall de l'entradilla. Sense elles, el DOM
     és el de sempre. */
  estatDesament = null,
  avisosCamps = null,
  /* T51 (ordre del Mestre, 260928) · L'espai central de la barra taronja.
     `emoticona` és el camp CRU del document; amb `onObriEmoticona`, el botó
     (ploma blanca o l'emoticona triada) obri el diàleg del pare. Sense
     `onObriEmoticona` (les fitxes d'organització i d'agent, que encara no en
     tenen columna), la cel·la en lectura. */
  emoticona = '',
  onObriEmoticona = null,
  /* Gauntlet 261016 (Bloc 3.9) · Opcionals, i sense elles el DOM de sempre
     (Perfil i catàleg).
     · `placeholderTitol`: el placeholder de l'H1 (el Bloc de Notes hi posa
       «Nota sense títol», el de la targeta). Per defecte, TEXTOS_LLAVOR.titol.
     · `edicioAvancada`: un <details> natiu PLEGAT «Edició avançada», dins de
       l'article, entre els avisos dels camps i la barra d'eines, que agrupa
       «Editar capçalera», «Editar logotip» i la ranura `classificacio` (la
       botonera, els drets i les vistes A4 i portada). Plegat, el flux és el
       bàsic: Títol → Subtítol → Entradilla → eines → text. El que es
       configura es veu al seu lloc real, com en lectura: la capçalera desada
       dalt (heroImage) i el logotip desat damunt de l'H1 (logoEntitat).
       Decisió de direcció (Gauntlet 261016): entre l'H1 i el Subtítol no es
       pinten ni la línia del copyright ni les píndoles; la llicència es tria
       dins del desplegable, i en lectura la línia continua igual. */
  placeholderTitol = null,
  edicioAvancada = false,
  /* Encàrrec d'harmonització (261018, ordre del Mestre: «fitxa neta; la gestió
     d'imatges va dins d'Edició avançada») · Opcionals, i sense elles el DOM de
     sempre (el Bloc de Notes no en passa cap):
     · `identitatEdicioAvancada`: un node que es pinta el primer dins del
       desplegable (el Perfil hi posa l'avatar redó amb «Avatar» i «Llevar
       l'avatar», que abans anaven damunt de l'H1);
     · `logoAlTitol` (true): amb false, el logotip desat no es repinta damunt
       de l'H1 (a la persona, el logotip és l'avatar, i ja va a la barra
       taronja);
     · `resumEdicioAvancada`: una línia davall del títol del desplegable que
       diu què hi ha dins;
     · `titolEdicioAvancada`: el títol del desplegable (per defecte, «Edició
       avançada»). Amb títol o resum, la barra porta també la icona. */
  identitatEdicioAvancada = null,
  logoAlTitol = true,
  resumEdicioAvancada = null,
  titolEdicioAvancada = null,
  classificacio,
  copyright,
  onCanviaCopyright,
  ...rest
}) {
  const debounceTimeouts = useRef({});
  const onSaveFieldRef = useRef(onSaveField);
  const onLocalChangeRef = useRef(onLocalChange);
  const { showToast } = useToast();

  onSaveFieldRef.current = onSaveField;
  onLocalChangeRef.current = onLocalChange;

  const flushField = useCallback((field) => {
    const pending = debounceTimeouts.current[field];
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    delete debounceTimeouts.current[field];
    onSaveFieldRef.current?.(field, pending.value, pending.id);
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    onLocalChangeRef.current?.(field, value, id);

    const previous = debounceTimeouts.current[field];
    if (previous) {
      clearTimeout(previous.timeoutId);
    }
    const timeoutId = setTimeout(() => flushField(field), 800);
    debounceTimeouts.current[field] = { timeoutId, value, id };
  }, [flushField, id]);

  const handleFieldBlur = useCallback((field, value) => {
    const pending = debounceTimeouts.current[field];
    if (pending) {
      pending.value = value;
      flushField(field);
      return;
    }
    onSaveFieldRef.current?.(field, value, id);
  }, [flushField, id]);

  /* T47 (ordre del Mestre, 260928) · El buidatge en desmuntar va en la
     NETEJA D'UN useLayoutEffect, no d'un useEffect. React 18 executa les
     netejes d'un arbre esborrat de pare a fill, i totes les de layout (fase
     de mutació) abans de cap de passiva. En eixir de la ruta, PerfilScope
     posava mounted=false en una neteja passiva ABANS que la closca buidara
     la cua, i el desat pendent moria amb un AbortError silenciós: l'H2
     (amb blur) arribava i l'entradilla (sense) es perdia. Des d'una neteja
     de layout, el desat ix quan tots els avantpassats encara són vius. Les
     proves *.autodesament.test.jsx en són la guarda: no el torneu a passiu. */
  useLayoutEffect(() => () => {
    Object.keys(debounceTimeouts.current).forEach(flushField);
  }, [id, flushField]);

  /* Després d'«Retallar» o «Tornar al que hi ha desat», el focus torna al
     camp, quan ja pinta el valor nou (un camp enfocat congela el que mostra).
     Per als camps que no són de text, al seu destí estable (DESTINS_FOCUS). */
  const arrelRef = useRef(null);
  const [campAEnfocar, setCampAEnfocar] = useState(null);
  useEffect(() => {
    if (!campAEnfocar) return;
    const arrel = arrelRef.current;
    const desti = arrel?.querySelector(DESTINS_FOCUS[campAEnfocar]) || arrel?.querySelector(DESTINS_FOCUS.title);
    /* Bloc 3.9 · Un destí dins de l'«Edició avançada» plegada: primer s'obri. */
    const plegat = desti?.closest?.('details.sdp-edicio-avancada:not([open])');
    if (plegat) plegat.open = true;
    desti?.focus();
    setCampAEnfocar(null);
  }, [campAEnfocar]);
  const executaAccioDeCamp = useCallback((camp, accio) => {
    accio.onClick?.();
    if (DESTINS_FOCUS[camp]) setCampAEnfocar(camp);
  }, []);

  useEffect(() => {
    const flushAllFields = () => {
      Object.keys(debounceTimeouts.current).forEach(flushField);
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flushAllFields();
    };

    window.addEventListener('pagehide', flushAllFields);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      window.removeEventListener('pagehide', flushAllFields);
      document.removeEventListener('visibilitychange', flushWhenHidden);
    };
  }, [flushField]);

  const shellData = useEditorShell({
    onSaveField: (field, value) => onSaveFieldRef.current?.(field, value, id),
    onImageUpload,
    heroImage,
    logoImage,
    isPublished,
    formattedTime,
    formattedDate,
    showStatusToggle,
    showLogoUpload,
    heroEditLabel,
    heroEditHelp,
    onHeroEdit,
    logoEditLabel,
    onLogoEdit,
    logoPujant,
    heroPujant,
    logoEditHelp,
    ajudaAmbImatge,
    statusIcon,
    onObriVisibilitat,
    etiquetaVisibilitat,
    visibilitatOberta,
    publishDate,
    onPublishDateChange,
    avisDataPublicacio,
    estatDesament,
    onToast: onToast || showToast
  });

  const contentContext = useContent();
  const config = contentContext?.config || {};
  /* Correcció D2 (revisió de T50 i de W3B1) · Qualsevol valor EXPLÍCIT
     decidix: null o '' vol dir «sense avatar» (una persona sense foto; el
     Perfil hi passa ''), i la barra taronja pinta la silueta com la targeta
     viva. Només sense la prop (undefined) cau a l'avatar de l'amfitrió. El
     poble, dues línies més avall, coincidix per a '' però no per a null (usa ??). */
  const barAuthorAvatar = propBarAuthorAvatar === undefined ? (config.barAuthorAvatar || '') : (propBarAuthorAvatar || '');
  const barAuthorName = propBarAuthorName || config.barAuthorName || FORASTER.name;
  /* Una cadena buida explícita vol dir «sense poble» (la fitxa d'una persona que
     encara no en té): no s'hi inventa el del Foraster. Sense la prop, com sempre. */
  const barAuthorLocation = propBarAuthorLocation ?? config.barAuthorLocation ?? FORASTER.location;

  /* Amb 'davall-entradilla' les eines es pinten dins de l'article, en un
     embolcall sticky dins del contenidor de scroll (.sdp-editor-eines). Els
     dos fills de l'article van sempre en la mateixa posició: canviar de mode
     no remunta el cos (TipTap). Amb 'dalt' el DOM és el de sempre. */
  const einesDavall = posicioEines === 'davall-entradilla' && topBar != null;

  /* T7 (P7) · El missatge del botó premut. El temporitzador és del
     NotificationProvider: un clic nou substituïx el missatge viu, i desmuntar
     la closca no deixa cap compte pendent ací. */
  const interceptaClicsInoperatius = useCallback((accio) => {
    const missatge = AVISOS_ACCIONS_EDICIO[accio];
    if (missatge) showToast(missatge, 'info', DURADA_AVIS_ACCIONS);
  }, [showToast]);

  /* Gauntlet 261016 (Bloc 3.9) · Amb «Edició avançada», les ranures de la
     capçalera, el logotip i la classificació no van a la UniversalPage sinó
     al desplegable; la pàgina rep el resultat (la capçalera i el logotip
     desats, i les categories i etiquetes assignades) al seu lloc de lectura.
     Sense, les props de sempre, també quan no hi són (cap clau nova). */
  const capcaleraDesada = edicioAvancada ? (heroImage || '') : null;
  const logoDesat = edicioAvancada && logoAlTitol ? shellData.logoDeLectura : null;
  const deLaRanura = edicioAvancada ? null : {
    ...(classificacio !== undefined ? { classificacio } : null),
    ...(copyright !== undefined ? { copyright } : null),
    ...(onCanviaCopyright !== undefined ? { onCanviaCopyright } : null),
  };
  const desplegable = edicioAvancada ? (
    <details className="sdp-edicio-avancada">
      <summary className="sdp-edicio-avancada__resum">
        {resumEdicioAvancada || titolEdicioAvancada ? (
          <>
            <span className="sdp-edicio-avancada__icona" aria-hidden="true">
              <SlidersHorizontal size={24} focusable="false" />
            </span>
            <span className="sdp-edicio-avancada__rotul">
              <span className="sdp-edicio-avancada__titol">{titolEdicioAvancada || ETIQUETA_EDICIO_AVANCADA}</span>
              {resumEdicioAvancada ? <span className="sdp-edicio-avancada__subtitol">{resumEdicioAvancada}</span> : null}
            </span>
          </>
        ) : ETIQUETA_EDICIO_AVANCADA}
      </summary>
      <div className="sdp-edicio-avancada__cos">
        {identitatEdicioAvancada ? <div className="sdp-edicio-avancada__identitat">{identitatEdicioAvancada}</div> : null}
        <div className="sdp-edicio-avancada__imatge sdp-edicio-avancada__capcalera">{shellData.topBarData.heroComponent}</div>
        {shellData.topBarData.logoComponent ? (
          <div className="sdp-edicio-avancada__imatge sdp-edicio-avancada__logotip">{shellData.topBarData.logoComponent}</div>
        ) : null}
        {classificacio ? <div className="page-title-classificacio">{classificacio}</div> : null}
      </div>
    </details>
  ) : null;

  return (
    <EditorErrorBoundary>
      <div ref={arrelRef} className={`sdp-editor-shell-atomic ${className || ''}`.trim()}>
        {einesDavall ? null : topBar}
        <div className="sdp-editor-document">
          <UniversalPage
            chrome="context"
            layout="contained"
            {...rest}
            {...deLaRanura}
            {...(logoDesat ? { logoEntitat: logoDesat } : null)}
            /* T36 · després de ...rest: cap adaptador (Notes, Perfil) ho desfà.
               T7 · Cap avís en línia davall de la barra blava (tampoc d'un
               adaptador): el missatge és el ràpid de cada botó.
               Bloc 3.9 (261016) · Traduir també és inoperatiu, amb el seu avís. */
            accionsInoperatives
            onClickInoperatiu={interceptaClicsInoperatius}
            traduirInoperatiu
            avisAccions={null}
            topBarData={{
              ...(edicioAvancada
                ? { heroImage: capcaleraDesada, heroAlt: 'Capçalera' }
                : {
                  heroComponent: shellData.topBarData.heroComponent,
                  isEmptyHero: !heroImage && !shellData.heroImage,
                  logoComponent: shellData.topBarData.logoComponent
                }),
              barActions: shellData.topBarData.barActions,
              authorName: barAuthorName,
              authorLocation: barAuthorLocation,
              authorAvatar: barAuthorAvatar,
              ...(barAuthorHref ? { authorHref: barAuthorHref } : null),
              /* T51 · La data va dins de barActions (useEditorShell), amb el
                 seu dateTime ISO quan n'hi ha. Ací abans arribava un text de
                 pantalla (formattedDate) com a dateTime. */
              emoticona,
              onObriEmoticona
            }}
            title={
              <EditableField
                key={`${id}-title`}
                className="editor-title-input"
                html={titleHtml}
                placeholder={placeholderTitol || TEXTOS_LLAVOR.titol}
                onChange={(val) => handleFieldChange('title', val)}
                onBlur={(val) => handleFieldBlur('title', val)}
              />
            }
            subtitle={
              <EditableField
                key={`${id}-subtitle`}
                className="editor-subtitle-input"
                html={subtitleHtml}
                placeholder={TEXTOS_LLAVOR.subtitol}
                onChange={(val) => handleFieldChange('subtitle', val)}
                onBlur={(val) => handleFieldBlur('subtitle', val)}
              />
            }
            lead={
              <EditableField
                key={`${id}-lead`}
                className="editor-lead-input"
                html={leadHtml}
                placeholder={TEXTOS_LLAVOR.entradilla}
                onChange={(val) => handleFieldChange('lead', val)}
                onBlur={(val) => handleFieldBlur('lead', val)}
              />
            }
            /* Correcció de la revisió (261016; ordre del Mestre del Bloc 3.9.3:
               el que es configura a l'«Edició avançada», «per exemple […]
               assigna categories», «s'ubica al seu lloc visible real») · Les
               categories i les etiquetes assignades, també amb el desplegable:
               com que la ranura de classificació hi viu, PageFrame les pinta
               davall de l'H1 com en lectura. Sense res assignat (una nota
               nova), cap píndola: el flux bàsic queda net. */
            labels={labels}
          >
            {/* T47 · Sempre en esta posició (null sense avisos): el cos no es remunta. */}
            {avisosCamps ? <AvisosCamps avisos={avisosCamps} onAccio={executaAccioDeCamp} /> : null}
            {/* Bloc 3.9 (261016) · «Edició avançada», just damunt de les eines.
                També sempre en esta posició (null sense la prop): el cos no es remunta. */}
            {desplegable}
            {einesDavall ? <div className="sdp-editor-eines">{topBar}</div> : null}
            {children}
          </UniversalPage>
        </div>
        {/* Correcció C13 (260928) · La regió viva de l'autodesament, a l'arrel i fora
            de la barra taronja: Notes amaga la barra en mòbil i en columna
            estreta (display:none) i el lector no anunciaria cap error de desat. */}
        {estatDesament ? <RegioEstatDesament estat={estatDesament.estat} detall={estatDesament.detall} /> : null}
        {/* T46 (ordre del Mestre, 260928) · El diàleg d'enquadrament només es
            munta obert: tancat, la closca té els mateixos fills de sempre. */}
        {shellData.dialegEnquadrament}
      </div>
    </EditorErrorBoundary>
  );
}

/* Correcció de la revisió (261008) · El nom de la imatge desada quan el botó
   de davall crida el pare (onEdit): diu que obri les opcions (Enrere,
   Esborrar), no el canvi. */
export const NOM_OPCIONS_CAPCALERA = 'Opcions de la capçalera';
export const NOM_OPCIONS_LOGOTIP = 'Opcions del logotip';

/* Esmena 1 del pla 261007_1645 (un sol editor) · La capçalera i el logotip
   damunt de l'H1 pinten el MATEIX control: la imatge clicable amb el seu
   botó i, en edició, el selector, l'ajuda i les accions. Només canvien els
   textos, la classe de la imatge, «Enquadrar» (només la capçalera, T46) i
   qui rep el clic del botó: amb `onEdit` (onHeroEdit o onLogoEdit, T35) el
   pare, en lloc del selector de fitxers.
   Ordre del Mestre (261007, ordre E) · La guarda de pujada de T46 val per als
   dos controls: mentre la imatge puja, el botó i «Esborrar» es desactiven,
   l'ajuda ho diu i un altre fitxer no es processa. Abans el logotip no la
   tenia i un segon fitxer triat a mitja pujada trepitjava el primer (el
   desat que acaba l'últim mana, useHeroImageHandler). En repòs, el DOM de
   sempre.
   Pla 261008_1201 (un sol clic) · Amb `onEdit`, el botó de davall de la
   imatge desada crida el pare directament: abans calia un primer clic que
   només obria el panell i un segon per a canviar-la. Clicar la imatge
   continua obrint el panell (Enrere, Esborrar). Sense `onEdit` (Notes), el
   botó obri el panell, com sempre.
   Correcció de la revisió (261008) · Amb `onEdit`, la imatge i el botó ja no
   fan el mateix, i al Perfil tots dos es deien «Capçalera» (o «Logotip»): la
   imatge porta un nom que diu què obri (NOM_OPCIONS_*, WCAG 2.4.6). Sense
   `onEdit`, cap atribut nou.
   Línia I1 de l'Onada 4 (pla 261008_1201) · Amb `onEdit` i `ajudaAmbImatge`
   (un text no buit), el camp en repòs porta davall del botó la mateixa
   línia .sdp-camp__ajuda que el camp sense imatge: el que s'admet es diu
   abans de triar, també quan ja n'hi ha una. El text és el que passa el
   consumidor; mentre la imatge puja, AJUDA_IMATGE_PUJANT, el mateix
   criteri que la línia del camp sense imatge (correcció de la revisió de
   la línia I1: la línia no deia res de la pujada en curs).
   Sense `onEdit` o sense el text, el DOM de sempre.
   Correcció de la revisió de la línia I1 · Amb `onEdit` (només el Perfil),
   la línia d'ajuda va lligada al botó amb aria-describedby, com el Camp de
   Pedra Seca (formulari.jsx: `${id}-ajuda`): el lector diu el límit en
   arribar al botó, abans de triar. Val per a la línia de sempre i per a la
   de repòs. Sense `onEdit` (Notes), cap id ni cap atribut nou.
   `botoRef` és el botó que crida el pare o obri el selector (n'hi ha un de
   muntat cada vegada): la closca hi torna el focus quan acaba la pujada del
   consumidor (useFocusEnAcabarLaPujada). Un ref no canvia el DOM. */
function ImageUploaderUI({
  image, handler, resolvedImage, isLogo,
  editLabel, editHelp, imgRef, potEnquadrar,
  triaFitxer, pujant = false, fontExistent, obriEnquadrament, onEdit,
  ajudaAmbImatge = null, botoRef = null
}) {
  const idBase = useId();
  const altText = isLogo ? "Logotip" : "Capçalera";
  const nomDeLaImatge = onEdit ? (isLogo ? NOM_OPCIONS_LOGOTIP : NOM_OPCIONS_CAPCALERA) : undefined;
  const cssImgClass = isLogo ? "sdp-logo-personalitzat sdp-logo-personalitzat--editable" : "sdp-hero__imatge";
  const titleText = isLogo ? "Clica per canviar el logotip" : "Clica per canviar la imatge";
  const uploadText = pujant ? AJUDA_IMATGE_PUJANT : editHelp;
  const ajudaEnRepos = onEdit && typeof ajudaAmbImatge === 'string' && ajudaAmbImatge.trim()
    ? (pujant ? AJUDA_IMATGE_PUJANT : ajudaAmbImatge) : null;
  const idAjuda = onEdit ? `${idBase}-ajuda` : undefined;
  /* Un fitxer triat mentre l'anterior encara puja no es processa: l'input es
     buida i el desat en curs continua sent l'únic. La capçalera amb
     enquadrament ja té la seua guarda (triaHero). */
  const triaSenseTrepitjar = (e) => {
    if (pujant) {
      e.target.value = '';
      return undefined;
    }
    return handler.handleFileChange(e);
  };
  const changeHandler = !isLogo && potEnquadrar ? triaFitxer : triaSenseTrepitjar;

  if (image && !handler.isEditing) {
    return (
      <>
        <img
          ref={imgRef}
          src={resolvedImage || (image.startsWith('sdp-media://') ? undefined : resolRecursPropi(image))}
          alt={altText}
          aria-label={nomDeLaImatge}
          className={cssImgClass}
          role="button"
          tabIndex="0"
          onClick={handler.startEdit}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handler.startEdit())}
          title={titleText}
        />
        <div className="sdp-alerta__accions sdp-camp sdp-camp--centrat">
          <button ref={botoRef} type="button" className="sdp-boto sdp-boto--secundari" disabled={pujant}
            aria-describedby={ajudaEnRepos ? idAjuda : undefined}
            onClick={onEdit ? () => onEdit({ acaba: handler.cancelEdit }) : handler.startEdit}>
            <ImageIcon size={16} aria-hidden="true" /> {editLabel}
          </button>
          {ajudaEnRepos ? <p id={idAjuda} className="sdp-camp__ajuda">{ajudaEnRepos}</p> : null}
        </div>
      </>
    );
  }

  return (
    <div className="sdp-alerta__accions sdp-camp sdp-camp--centrat">
      <input type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" ref={handler.fileInputRef} onChange={changeHandler} className="sdp-nomes-lector" />
      <button ref={botoRef} type="button" className="sdp-boto sdp-boto--secundari" disabled={pujant} aria-describedby={idAjuda}
        onClick={() => (onEdit ? onEdit({ acaba: handler.cancelEdit }) : handler.fileInputRef.current?.click())}>
        <ImageIcon size={16} /> {editLabel}
      </button>
      <p id={idAjuda} className="sdp-camp__ajuda">{uploadText}</p>
      {image && (
        <div className="sdp-alerta__accions">
          {/* T46 · Sense una font que es puga llegir (sdp-media sense resoldre), cap botó. */}
          {!isLogo && potEnquadrar && fontExistent ? (
            <button type="button" className="sdp-boto sdp-boto--secundari" aria-haspopup="dialog" disabled={pujant} onClick={() => obriEnquadrament(fontExistent)}>
              <Crop size={16} aria-hidden="true" focusable="false" /> Enquadrar
            </button>
          ) : null}
          <button type="button" className="sdp-boto sdp-boto--fantasma" onClick={handler.cancelEdit}>Enrere</button>
          {/* Esborrar mentre puja: la foto que arribara després la tornaria a posar. */}
          <button type="button" className="sdp-boto sdp-boto--perill" disabled={pujant} onClick={handler.handleDelete}>Esborrar</button>
        </div>
      )}
    </div>
  );
}

/* Correcció de la revisió de la línia I1 (pla 261008_1201) · Escape a mitja
   pujada. El consumidor (el Perfil, useImatgeDeFitxa) deixa tancar la
   finestra de retall mentre la imatge puja; la finestra torna el focus a qui
   l'havia oberta, el botó de la closca, que en eixe moment està desactivat
   (heroPujant o logoPujant): focus() no fa res i el focus cau al body. Quan
   la pujada del consumidor acaba (la prop passa de true a false), si el
   focus encara és perdut (al body, o enlloc), torna al botó. Si la persona
   ja és en un altre lloc, no se li roba. Només compta la pujada que diu el
   consumidor: sense heroPujant ni logoPujant (Notes), res no canvia. Un
   botó desmuntat (la ranura que dona lloc a l'avatar redó) no fa res: allí
   el focus el porta el consumidor. Torna el ref del botó. */
function useFocusEnAcabarLaPujada(pujantDeFora) {
  const botoRef = useRef(null);
  const pujava = useRef(false);
  useEffect(() => {
    const acabada = pujava.current && !pujantDeFora;
    pujava.current = pujantDeFora;
    const boto = botoRef.current;
    if (!acabada || !boto?.isConnected || boto.disabled) return;
    // Dins del Web Component, l'arrel és el shadow root: és qui sap on és el focus.
    const actiu = boto.getRootNode().activeElement ?? document.activeElement;
    if (!actiu || actiu === document.body) boto.focus();
  }, [pujantDeFora]);
  return botoRef;
}

function useEditorShell({
  onSaveField,
  onImageUpload = null,
  heroImage,
  logoImage,
  isPublished,
  formattedTime,
  formattedDate,
  showStatusToggle = true,
  showLogoUpload = true,
  heroEditLabel = 'Editar capçalera',
  heroEditHelp = AJUDA_IMATGE_PER_DEFECTE,
  onHeroEdit = null,
  logoEditLabel = 'Editar logotip',
  onLogoEdit = null,
  logoPujant = false,
  heroPujant = false,
  logoEditHelp = AJUDA_IMATGE_PER_DEFECTE,
  ajudaAmbImatge = null,
  statusIcon = null,
  onObriVisibilitat = null,
  etiquetaVisibilitat = '',
  visibilitatOberta = false,
  publishDate = null,
  onPublishDateChange = null,
  avisDataPublicacio = null,
  estatDesament = null,
  onToast = () => {}
}) {
  /* T46 · L'últim error de la capçalera, per a ensenyar-lo també dins del
     diàleg d'enquadrament: el modal tapa el toast. */
  const errorHeroRef = useRef(null);
  const heroHandler = useHeroImageHandler({
    onSaveField,
    fieldName: 'heroImage',
    onImageUpload,
    onError: (msg) => {
      errorHeroRef.current = msg;
      onToast(msg, 'error');
    },
    onConfirmDelete: () => {
      onToast("Imatge esborrada", "success");
      return true;
    }
  });

  const logoHandler = useHeroImageHandler({
    onSaveField,
    fieldName: 'logoImage',
    onImageUpload,
    onError: (msg) => onToast(msg, 'error'),
    onConfirmDelete: () => {
      onToast("Logotip esborrat", "success");
      return true;
    }
  });

  /* T5 · La URL resolta arriba en un efecte: el primer render pinta la
     reserva, i el navegador ja la demana. Un '/assets/…' hi passa per la base
     de l'amfitrió (resolRecursPropi), perquè cap petició vaja a l'arrel del
     domini. Sense base, la reserva de sempre. */
  const resolvedHeroImage = useResolvedAsset(heroImage);
  const resolvedLogoImage = useResolvedAsset(logoImage);

  /* T46 (ordre del Mestre, 260928) · Re-enquadrament de la capçalera (la
     mateixa heroImage que pinten ItemMedia i la targeta del Mur). Una foto
     nova passa pel diàleg abans de desar-se; una d'existent s'hi obri amb
     «Enquadrar». L'enquadrament es cou dins de l'arxiu: el diàleg torna un
     File i el desa processaFitxer, el camí de sempre. El Perfil (onHeroEdit)
     queda igual: ni diàleg ni botó. */
  const potEnquadrar = typeof onHeroEdit !== 'function';
  const [enquadrament, setEnquadrament] = useState(null);
  const [enfocaHero, setEnfocaHero] = useState(false);
  const heroImgRef = useRef(null);
  const fontExistent = resolvedHeroImage || (heroImage && !heroImage.startsWith('sdp-media://') ? resolRecursPropi(heroImage) : '');

  /* Poliment T46 (ordre del Mestre, 260928) · Escape tanca el diàleg encara
     que estiga desant, i el desat continua. Mentre la capçalera puja no s'obri
     cap altre enquadrament ni es tria cap fitxer (els botons es desactiven i
     l'ajuda ho diu): un desat antic no pot trepitjar-ne un de més nou.
     Línia I1 (pla 261008_1201) · `heroPujant` hi suma la pujada que el
     consumidor fa pel seu camí: el botó, triaHero i obriEnquadrament
     respecten la mateixa guarda. */
  const pujant = heroHandler.isUploading || Boolean(heroPujant);
  /* Correcció de la revisió de la línia I1 · El focus torna al botó de la
     capçalera o del logotip quan acaba la pujada del consumidor. */
  const heroBotoRef = useFocusEnAcabarLaPujada(Boolean(heroPujant));
  const logoBotoRef = useFocusEnAcabarLaPujada(Boolean(logoPujant));

  /* T51 (decisió del Mestre, 260928) · En EDICIÓ la pastilla mai queda buida:
     la data de publicació triada al calendari (T40, publishDate) si n'hi ha;
     si no, la data i l'hora d'ara (barres/dataHoraBarra.js). MAI la de
     l'última edició (formattedTime/formattedDate no hi entren). Val també per
     a la pastilla sense calendari (DateTimeControl). */
  const dataBarra = dataHoraEdicio({ publicat: publishDate });

  const obriEnquadrament = (font) => {
    if (pujant) return;
    setEnfocaHero(false);
    /* Cada obertura és una sessió pròpia (objecte nou): el desat tanca només la seua.
       Gauntlet 261016 (Bloc 1) · Amb l'eixida exacta de la capçalera (sortidaCapcalera). */
    setEnquadrament({ font, sortida: sortidaCapcalera(font) });
  };

  const triaHero = (e) => {
    const fitxer = e.target.files?.[0];
    e.target.value = '';
    if (!fitxer || pujant) return;
    // Un fitxer que no es pot processar ix pel camí de sempre, amb el mateix avís.
    if (validaFitxerImatge(fitxer)) {
      void heroHandler.processaFitxer(fitxer);
      return;
    }
    obriEnquadrament(fitxer);
  };

  /* Gauntlet 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) · El diàleg
     oferix la casella «Conserva la ubicació i la data de la foto» quan la
     foto en porta; la seua tria (metadades.exif) va a la pujada.
     Gauntlet 261016 (Bloc 1, Llei del Quadrat) · processaFitxer rep també la
     forma ('capcalera', el contracte opcions.forma de useHeroImageHandler) i
     el costat del retall que ja ix exacte (costatDeSortida): la foto es
     comprimix a eixa mateixa mida, dins del pressupost, sense dependre del nom
     del camp. */
  const desaEnquadrament = async (fitxer, info, metadades) => {
    // La sessió d'este diàleg: en acabar es tanca ella, mai una altra.
    const sessio = enquadrament;
    errorHeroRef.current = null;
    const fet = await heroHandler.processaFitxer(fitxer, { forma: 'capcalera', midaMaxima: costatDeSortida('capcalera'), ...metadades?.exif });
    if (!fet) throw new Error(errorHeroRef.current || "No s'ha pogut desar la imatge.");
    setEnquadrament((actual) => (actual === sessio ? null : actual));
    setEnfocaHero(true);
    return true;
  };

  /* Desat l'enquadrament, el botó que obria el diàleg ja no existix: el focus
     va a la capçalera nova quan ja es pinta. Poliment T46 · Només si el focus
     és al body o dins de la capçalera (on era el disparador): si mentrestant
     s'escriu en un altre camp, no se li roba, i queda desarmat.
     Gauntlet 261016 (Bloc 3.9) · Amb «Edició avançada», la ranura de la
     capçalera viu dins del desplegable: el seu lloc compta igual. */
  useEffect(() => {
    if (!enfocaHero || !heroImgRef.current) return;
    const imatge = heroImgRef.current;
    const actiu = imatge.getRootNode().activeElement ?? document.activeElement;
    const lliure = !actiu || actiu === document.body || Boolean(imatge.closest('.hero-image, .sdp-edicio-avancada__capcalera')?.contains(actiu));
    if (lliure) imatge.focus();
    setEnfocaHero(false);
  }, [enfocaHero, heroImage, heroHandler.isEditing]);

  /* Gauntlet 261016 (Bloc 3.9) · El logotip desat com el pinta la lectura
     (logoEntitat de PageFrame, damunt de l'H1, que el resol amb
     resolveAsset): la URL que ha resolt el port per a un sdp-media://, o la
     referència tal qual. Un sdp-media:// que encara no s'ha resolt no es
     pinta. Sense logotip, null. */
  const srcLogoDeLectura = logoImage
    ? (resolvedLogoImage || (logoImage.startsWith('sdp-media://') ? '' : logoImage))
    : '';
  const logoDeLectura = srcLogoDeLectura ? { clar: srcLogoDeLectura, alt: 'Logotip' } : null;

  return {
    heroImage,
    logoImage,
    logoDeLectura,
    isPublished,
    formattedTime,
    formattedDate,
    topBarData: {
      /* Ordre del Mestre (261007, ordre E) · El logotip porta la seua pròpia
         guarda de pujada (logoHandler.isUploading), independent de la de la
         capçalera: cada control només es bloqueja mentre puja la seua imatge.
         Línia I1 (pla 261008_1201) · `logoPujant` hi suma la pujada del
         consumidor, i `logoEditHelp` en dona l'ajuda (la de sempre per defecte). */
      logoComponent: showLogoUpload ? <ImageUploaderUI
        image={logoImage} handler={logoHandler} resolvedImage={resolvedLogoImage}
        isLogo={true} editLabel={logoEditLabel} editHelp={logoEditHelp}
        pujant={logoHandler.isUploading || Boolean(logoPujant)} onEdit={onLogoEdit}
        ajudaAmbImatge={ajudaAmbImatge} botoRef={logoBotoRef}
      /> : null,
      heroComponent: <ImageUploaderUI
        image={heroImage} handler={heroHandler} resolvedImage={resolvedHeroImage}
        isLogo={false} editLabel={heroEditLabel} editHelp={heroEditHelp} imgRef={heroImgRef}
        potEnquadrar={potEnquadrar} triaFitxer={triaHero} pujant={pujant}
        fontExistent={fontExistent} obriEnquadrament={obriEnquadrament} onEdit={onHeroEdit}
        ajudaAmbImatge={ajudaAmbImatge} botoRef={heroBotoRef}
      />,
      barActions: (
        <>
          {/* T47 · L'indicador de l'autodesament, primer i a part (T51: ja no és
              una ploma, que queda per al botó d'emoticona de l'espai central).
              Només la icona: la regió viva és a l'arrel de la closca (C13).
              Línia I1 (pla 261008_1201) · `reintentant` (un error que la cua
              torna a provar sola) arriba a la icona: el seu pas a 'net' pinta
              el check. Sense la clau, false, com abans. */}
          {estatDesament ? <IconaEstatDesament estat={estatDesament.estat} detall={estatDesament.detall} accions={estatDesament.accions}
            reintentant={Boolean(estatDesament.reintentant)} /> : null}
          {/* T41 (ordre del Mestre, 260928) · Un sol <button> real (sense el
              Dropdown informatiu ni interactius niats): obri el selector de
              visibilitat, el mateix que obri PUBLICAR (barres/BotoVisibilitat). */}
          {showStatusToggle && onObriVisibilitat ? (
            <BotoVisibilitat publicat={Boolean(isPublished)} icona={statusIcon} etiqueta={etiquetaVisibilitat}
              obert={visibilitatOberta} onObri={onObriVisibilitat} />
          ) : null}
          {/* T40 (ordre del Mestre, 260928) · La data clicable obri el calendari.
              La identitat ja no viu ací: és a la barra negra (TopBar).
              T51 · La reserva és dataBarra: mai buida en edició. */}
          {onPublishDateChange
            ? <SelectorDataHora valor={publishDate} onTria={onPublishDateChange} reserva={{ time: dataBarra.time, date: dataBarra.date }}
                etiquetaReserva={dataBarra.esAra ? ETIQUETA_RESERVA_ARA : undefined} avisDesament={avisDataPublicacio} />
            : <DateTimeControl time={dataBarra.time} date={dataBarra.date} dateTime={dataBarra.dateTime} />}
        </>
      )
    },
    /* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · Només el quadrat
       (FORMATS_CAPCALERA) i l'eixida exacta de 1.200 × 1.200 de la sessió. */
    dialegEnquadrament: enquadrament ? (
      <DialegEnquadrament font={enquadrament.font} formatInicial={CAPCALERA.formatInicial} formats={FORMATS_CAPCALERA}
        descripcio={DESCRIPCIO_ENQUADRAMENT_CAPCALERA} sortida={enquadrament.sortida}
        onTanca={() => setEnquadrament(null)} onDesa={desaEnquadrament} ofereixConservarExif />
    ) : null
  };
}

export default UniversalEditorShell;
