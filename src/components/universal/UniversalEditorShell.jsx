import { Image as ImageIcon, Crop } from 'lucide-react';
import { DateTimeControl, Alerta, Boto, SelectorDataHora } from '../PedraSeca/index.js';
import { BotoVisibilitat } from './barres/BotoVisibilitat.jsx';
import { ETIQUETA_RESERVA_ARA, dataHoraEdicio } from './barres/dataHoraBarra.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { extractPlainText } from '../../utils/contentAdapter.js';
import useHeroImageHandler, { validaFitxerImatge } from '../../hooks/useHeroImageHandler.js';
import { useResolvedAsset } from '../../hooks/useResolvedAsset.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import React, { Component, useRef, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useContent } from './ContentProvider.jsx';
import { useToast } from './NotificationContext.jsx';
import { IconaEstatDesament, RegioEstatDesament } from './EstatDesament.jsx';
import { DialegEnquadrament } from './enquadrament/DialegEnquadrament.jsx';
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
export const AVISOS_ACCIONS_EDICIO = Object.freeze({
  comentar: 'Comentar no està operatiu mentre edites. Quan es publique, obrirà el xat per a comentar-ho.',
  compartir: 'Compartir no està operatiu mentre edites. Quan es publique, servirà per a enviar-ne l’enllaç.',
  connectar: 'Connectar no està operatiu mentre edites. Quan es publique, servirà per a guardar-ho al Bloc de Notes.',
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
   dins de la closca; en lectura no hi ha botó i el focus va al títol. */
const DESTINS_FOCUS = Object.freeze({
  title: '.editor-title-input',
  subtitle: '.editor-subtitle-input',
  lead: '.editor-lead-input',
  content: '.ProseMirror[contenteditable="true"]',
  heroImage: '.hero-image [role="button"], .hero-image button:not(:disabled)',
  logoImage: '.page-title-logo-personalitzat [role="button"], .page-title-logo-personalitzat button:not(:disabled)',
  copyright: '.sdp-copyright-selector',
  icon: '.bar-orange > button.sdp-emoticona-barra--boto',
});

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
  showStatusToggle = true,
  showLogoUpload = true,
  /* T35 · Punt d'extensió genèric: amb `onHeroEdit`, el botó de la capçalera
     crida el pare ({ acaba }) en lloc d'obrir el selector de fitxers. Només
     el Perfil el passa (PerfilEditor); la resta de seccions no canvien. */
  heroEditLabel = 'Editar capçalera',
  heroEditHelp = "Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.",
  onHeroEdit = null,
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
  onToast = (msg, type) => console.log(`[Toast ${type}] ${msg}`),
  className = '',
  /* T47 (ordre del Mestre, 260928) · Opcionals. `estatDesament` = { estat,
     detall, accions? } pinta l'indicador de l'autodesament (EstatDesament) com a PRIMER element de la barra
     taronja; `avisosCamps` = { [camp]: { error?: { missatge, accions }, comptador? } }
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
    statusIcon,
    onObriVisibilitat,
    etiquetaVisibilitat,
    visibilitatOberta,
    publishDate,
    onPublishDateChange,
    avisDataPublicacio,
    estatDesament,
    onToast
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

  return (
    <EditorErrorBoundary>
      <div ref={arrelRef} className={`sdp-editor-shell-atomic ${className || ''}`.trim()}>
        {einesDavall ? null : topBar}
        <div className="sdp-editor-document">
          <UniversalPage
            chrome="context"
            layout="contained"
            {...rest}
            /* T36 · després de ...rest: cap adaptador (Notes, Perfil) ho desfà.
               T7 · Cap avís en línia davall de la barra blava (tampoc d'un
               adaptador): el missatge és el ràpid de cada botó. */
            accionsInoperatives
            onClickInoperatiu={interceptaClicsInoperatius}
            avisAccions={null}
            topBarData={{
              heroComponent: shellData.topBarData.heroComponent,
              isEmptyHero: !heroImage && !shellData.heroImage,
              logoComponent: shellData.topBarData.logoComponent,
              barActions: shellData.topBarData.barActions,
              authorName: barAuthorName,
              authorLocation: barAuthorLocation,
              authorAvatar: barAuthorAvatar,
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
                placeholder={TEXTOS_LLAVOR.titol}
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
            labels={labels}
          >
            {/* T47 · Sempre en esta posició (null sense avisos): el cos no es remunta. */}
            {avisosCamps ? <AvisosCamps avisos={avisosCamps} onAccio={executaAccioDeCamp} /> : null}
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

export function useEditorShell({
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
  heroEditHelp = "Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.",
  onHeroEdit = null,
  statusIcon = null,
  onObriVisibilitat = null,
  etiquetaVisibilitat = '',
  visibilitatOberta = false,
  publishDate = null,
  onPublishDateChange = null,
  avisDataPublicacio = null,
  estatDesament = null,
  onToast = console.log
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
     l'ajuda ho diu): un desat antic no pot trepitjar-ne un de més nou. */
  const pujant = heroHandler.isUploading;

  /* T51 (decisió del Mestre, 260928) · En EDICIÓ la pastilla mai queda buida:
     la data de publicació triada al calendari (T40, publishDate) si n'hi ha;
     si no, la data i l'hora d'ara (barres/dataHoraBarra.js). MAI la de
     l'última edició (formattedTime/formattedDate no hi entren). Val també per
     a la pastilla sense calendari (DateTimeControl). */
  const dataBarra = dataHoraEdicio({ publicat: publishDate });

  const obriEnquadrament = (font) => {
    if (pujant) return;
    setEnfocaHero(false);
    // Cada obertura és una sessió pròpia (objecte nou): el desat tanca només la seua.
    setEnquadrament({ font });
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

  const desaEnquadrament = async (fitxer) => {
    // La sessió d'este diàleg: en acabar es tanca ella, mai una altra.
    const sessio = enquadrament;
    errorHeroRef.current = null;
    const fet = await heroHandler.processaFitxer(fitxer);
    if (!fet) throw new Error(errorHeroRef.current || "No s'ha pogut desar la imatge.");
    setEnquadrament((actual) => (actual === sessio ? null : actual));
    setEnfocaHero(true);
    return true;
  };

  /* Desat l'enquadrament, el botó que obria el diàleg ja no existix: el focus
     va a la capçalera nova quan ja es pinta. Poliment T46 · Només si el focus
     és al body o dins de la capçalera (on era el disparador): si mentrestant
     s'escriu en un altre camp, no se li roba, i queda desarmat. */
  useEffect(() => {
    if (!enfocaHero || !heroImgRef.current) return;
    const imatge = heroImgRef.current;
    const actiu = imatge.getRootNode().activeElement ?? document.activeElement;
    const lliure = !actiu || actiu === document.body || Boolean(imatge.closest('.hero-image')?.contains(actiu));
    if (lliure) imatge.focus();
    setEnfocaHero(false);
  }, [enfocaHero, heroImage, heroHandler.isEditing]);

  return {
    heroImage,
    logoImage,
    isPublished,
    formattedTime,
    formattedDate,
    topBarData: {
      logoComponent: showLogoUpload ? ((logoImage && !logoHandler.isEditing) ? (
        <>
          <img
            src={resolvedLogoImage || (logoImage.startsWith('sdp-media://') ? undefined : resolRecursPropi(logoImage))}
            alt="Logotip"
            className="sdp-logo-personalitzat sdp-logo-personalitzat--editable"
            role="button"
            tabIndex="0"
            onClick={logoHandler.startEdit}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), logoHandler.startEdit())}
            title="Clica per canviar el logotip"
          />
          <div className="sdp-alerta__accions sdp-camp sdp-camp--centrat">
            <button type="button" className="sdp-boto sdp-boto--secundari" onClick={logoHandler.startEdit}>
              <ImageIcon size={16} aria-hidden="true" /> Editar logotip
            </button>
          </div>
        </>
      ) : (
        <div className="sdp-alerta__accions sdp-camp sdp-camp--centrat">
          <input type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" ref={logoHandler.fileInputRef} onChange={logoHandler.handleFileChange} className="sdp-nomes-lector" />
          <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => logoHandler.fileInputRef.current?.click()}>
            <ImageIcon size={16} /> Editar logotip
          </button>
          <p className="sdp-camp__ajuda">Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.</p>
          {logoImage && (
            <div className="sdp-alerta__accions">
              <button type="button" className="sdp-boto sdp-boto--fantasma" onClick={logoHandler.cancelEdit}>Enrere</button>
              <button type="button" className="sdp-boto sdp-boto--perill" onClick={logoHandler.handleDelete}>Esborrar</button>
            </div>
          )}
        </div>
      )) : null,
      heroComponent: (heroImage && !heroHandler.isEditing) ? (
        <>
          <img
            ref={heroImgRef}
            src={resolvedHeroImage || (heroImage.startsWith('sdp-media://') ? undefined : resolRecursPropi(heroImage))}
            alt="Capçalera"
            className="sdp-hero__imatge"
            role="button"
            tabIndex="0"
            onClick={heroHandler.startEdit}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), heroHandler.startEdit())}
            title="Clica per canviar la imatge"
          />
          <div className="sdp-alerta__accions sdp-camp sdp-camp--centrat">
            <button type="button" className="sdp-boto sdp-boto--secundari" disabled={pujant} onClick={heroHandler.startEdit}>
              <ImageIcon size={16} aria-hidden="true" /> {heroEditLabel}
            </button>
          </div>
        </>
      ) : (
        <div className="sdp-alerta__accions sdp-camp sdp-camp--centrat">
          <input type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" ref={heroHandler.fileInputRef} onChange={potEnquadrar ? triaHero : heroHandler.handleFileChange} className="sdp-nomes-lector" />
          <button type="button" className="sdp-boto sdp-boto--secundari" disabled={pujant} onClick={() => (onHeroEdit ? onHeroEdit({ acaba: heroHandler.cancelEdit }) : heroHandler.fileInputRef.current?.click())}>
            <ImageIcon size={16} /> {heroEditLabel}
          </button>
          <p className="sdp-camp__ajuda">{pujant ? 'Encara s’està desant la imatge. Quan acabe, la podràs tornar a canviar.' : heroEditHelp}</p>
          {heroImage && (
            <div className="sdp-alerta__accions">
              {/* T46 · Sense una font que es puga llegir (sdp-media sense resoldre), cap botó. */}
              {potEnquadrar && fontExistent ? (
                <button type="button" className="sdp-boto sdp-boto--secundari" aria-haspopup="dialog" disabled={pujant} onClick={() => obriEnquadrament(fontExistent)}>
                  <Crop size={16} aria-hidden="true" focusable="false" /> Enquadrar
                </button>
              ) : null}
              <button type="button" className="sdp-boto sdp-boto--fantasma" onClick={heroHandler.cancelEdit}>Enrere</button>
              {/* Esborrar mentre puja: la foto que arribara després la tornaria a posar. */}
              <button type="button" className="sdp-boto sdp-boto--perill" disabled={pujant} onClick={heroHandler.handleDelete}>Esborrar</button>
            </div>
          )}
        </div>
      ),
      barActions: (
        <>
          {/* T47 · L'indicador de l'autodesament, primer i a part (T51: ja no és
              una ploma, que queda per al botó d'emoticona de l'espai central).
              Només la icona: la regió viva és a l'arrel de la closca (C13). */}
          {estatDesament ? <IconaEstatDesament estat={estatDesament.estat} detall={estatDesament.detall} accions={estatDesament.accions} /> : null}
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
    dialegEnquadrament: enquadrament ? (
      <DialegEnquadrament font={enquadrament.font} onTanca={() => setEnquadrament(null)} onDesa={desaEnquadrament} />
    ) : null
  };
}

export default UniversalEditorShell;
