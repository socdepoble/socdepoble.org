import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { closeHistory } from '@tiptap/pm/history';
import { createDocument, getHTMLFromFragment } from '@tiptap/core';
import { UniversalEditorShell } from './UniversalEditorShell';
import { SelectorVisibilitat, TEXTOS_VISIBILITAT } from './SelectorVisibilitat.jsx';
import BotoDretsAutor from './CopyrightSelector.jsx';
import { CopyrightPage } from './drets/CopyrightPage.jsx';
import DocumentPrintPreview from './DocumentPrintPreview.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { Boto, DateTimeControl, Dialeg } from '../PedraSeca/index.js';
import { dataHoraAra } from './barres/dataHoraBarra.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import {
  useUniversalRichText,
  useTipTapToolbarAdapter,
  UniversalRichTextToolbar,
  UniversalRichTextContent,
} from './richText';
import { extensionsRiques } from './richText/extensions';
/* T7 · Les peces de les targetes incrustades viuen en camins a banda: les
   proves que substituïxen './richText' i './richText/extensions' amb
   fàbriques tancades no les veuen. */
import { DialegTriaTargeta } from './richText/extensions/targetes/DialegTriaTargeta.jsx';
import { NOM_EXTENSIO_TARGETES, TargetesIncrustadesContext } from './richText/extensions/targetes/TargetesIncrustadesContext.js';
import { attrsDeEntrada } from './richText/extensions/targetes/formaDelGrup.js';
/* Correcció de la revisió (261016) · També pel seu camí: la plantilla verge
   s'esvaeix abans de qualsevol ordre que arriba de fora del cos. */
import { buidaLlavorVerge } from './richText/useUniversalRichText.js';
import { useUIActions } from '../../app/contexts/UIContext';
/* P1-64 · La casella de l'EXIF d'una foto de publicació (la del hero) i la precisió de sèrie. */
import { CasellaExif } from './enquadrament/DialegEnquadrament.jsx';
import { PRECISIO_PER_DEFECTE_PUBLICACIO } from './enquadrament/geolocalitzacio.js';

/* Bloc 3.8 (261016) · On un cos d'editor no es veu ni rep el focus: la
   mateixa regla que la guarda del focus de la closca (AppGridShell). */
const FORA_DE_LA_VISTA = '[inert], [aria-hidden="true"], [hidden]';

/* IDEA-41 · Els motius del motor de «Proposa Card»: alguna cosa a pujar, o
   text a l'inici que no complix cap regla. */
const MOTIU_PROPOSTA = 'proposta';
const MOTIU_RES = 'res';
/* El text d'un camp per a comparar-lo: sense etiquetes, entitats ni espais de més. */
const textDelCamp = (html) => String(html ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();
/* Els camps que encara diuen `de` passen a dir `a`; un camp que la persona ha tocat després, no. */
function campsQueTornen(actual, de, a) {
  const valors = {};
  for (const camp of Object.keys(a)) if (textDelCamp(actual?.[camp]) === textDelCamp(de[camp])) valors[camp] = a[camp];
  return valors;
}

/**
 * Interfície Adapter requerida:
 * {
 *   document: Object, // El document actual. Si és null, mostra l'estat buit.
 *   updateLocal: (id, field, value) => void, // Cridat immediatament a cada input.
 *   saveRemote: (id, field, value) => void, // Cridat amb debounce o a l'onBlur.
 *   publish: (document) => void, // Reserva: sense `visibilitat`, triar «pública» al
 *                              // selector el crida. PUBLICAR ja no publica directament.
 *   visibilitat: { textos, onTria(publica, document), bloqueig, comNom } // Opcional (T41).
 *                            // PUBLICAR i la bola del món obrin el SelectorVisibilitat;
 *                            // confirmar crida onTria i el consumidor decidix.
 *   ambDataPublicacio: Boolean // Opcional (T40, false). La pastilla de data obri el
 *                            // calendari i desa el camp 'publishDate' (ISO | null).
 *   avisDataPublicacio: String|null // Opcional (T40). Avís honest dins del calendari
 *                            // quan la data no es desa com la resta (columna en quarantena).
 *   uploadMedia: async (file) => String, // Lògica de pujada d'imatges (retorna URL).
 *   labels: Array, // Etiquetes visuals del document (ex: estat, lloc).
 *   emptyPlaceholder: String, // Text per a l'estat buit (títol de reserva).
 *   emptyDocument: Object, // Opcional. Document de benvinguda per a l'estat buit
 *                          // ({ title, subtitle, lead, heroImage, content, labels, copyright,
 *                          //    logoEntitat?, avatarAutor? }). Ordre del Mestre (261007,
 *                          // ordre E): logoEntitat i avatarAutor ({ src, alt }) pinten
 *                          // damunt de l'H1 el mateix que la fitxa pública, en lectura.
 *                          // Gauntlet 261030 (cicle 3, traduir-perfil-lectura-fitxa-no-
 *                          // publica) · `traduccio: true` si el document és públic i
 *                          // Traduir el pot enviar al motor; sense, Traduir avisa i no
 *                          // envia res (fallada tancada, TC3.2).
 *   classificacio: ReactNode // Opcional. Botonera de classificació (Carpetes, Categories,
 *                            // Etiquetes) davall del títol, al lloc de les píndoles.
 *   llicencia: ReactNode // Opcional. Ranura del botó de llicència, davall de la botonera.
 *   dretsAutor: { ambit, perDefecte, autor } // Opcional (T39). «Elegir drets d'autor»
 *                            // obri la vista a pantalla completa (CopyrightPage) dins
 *                            // de la columna. ambit: 'publicacio'|'perfil'|'neutre'
 *                            // (per defecte) tria l'avís d'herència; perDefecte, la
 *                            // llicència heretada; autor (per defecte barAuthorName),
 *                            // el nom de «© autor». Es desa pel camí de sempre.
 *   dretsTriats: String|null // Opcional (correcció de la revisió, 261008). La
 *                            // llicència TRIADA de veres, per a la píndola dels
 *                            // drets, quan document.copyright no ho és: el Perfil hi
 *                            // posa el «© Nom» de lectura encara que no se n'haja
 *                            // triat cap. Amb la clau mana ella (null o '' = cap
 *                            // triada: «Elegir drets d'autor»); la línia de la
 *                            // capçalera i la vista de drets continuen amb
 *                            // document.copyright. Sense la clau, document.copyright
 *                            // (Notes i el catàleg, el DOM de sempre).
 *   ambDrets: Boolean        // Opcional (Directiva de Dignitat Humana, pla
 *                            // 261015_1900; true). Amb false, el document no porta
 *                            // drets d'autor enlloc: ni la píndola de davall del
 *                            // títol (i, amb ella, «Vista A4 / PDF», que viu a la
 *                            // mateixa ranura), ni la línia de la capçalera (tampoc
 *                            // la reserva «© Sóc de Poble»), ni la vista de drets.
 *                            // La fitxa d'una persona (PerfilEditor): una persona no
 *                            // és una obra. Sense la clau, el DOM de sempre.
 *   statusIcon: ReactNode // Opcional. Icona del botó d'estat de la barra taronja.
 *   barAuthorAvatar, barAuthorName, barAuthorLocation: String // Opcionals. Autoria
 *                            // de la barra taronja (i de l'estat buit).
 *   barAuthorHref: String|null // Opcional. Ordre del Mestre (261007): «Quan
 *                            // isquen, les barres taronges han de portar a la
 *                            // pàgina de l'autor que l'ha creada». La ruta de
 *                            // la pàgina de qui signa: amb ella, l'avatar i el
 *                            // nom de la barra taronja són un enllaç (també a
 *                            // l'estat buit). Sense la clau, el DOM de sempre.
 *   seedContent: String|String[]|null // Opcional. Llavor del cos: mentre el
 *                            // cos és exactament esta llavor es buida en rebre el
 *                            // focus. Bloc 3.9 (261016) · Es compara amb el
 *                            // document de l'editor (useUniversalRichText ·
 *                            // esLlavorVerge), no amb la cadena, i pot ser una
 *                            // llista: el Bloc de Notes hi passa la llavor d'ara i
 *                            // la d'abans (llavorNota.js · LLAVORS_NOTA).
 *                            // Correcció de la revisió (261016) · Les ordres que
 *                            // arriben de fora del cos (un botó de la barra, la
 *                            // inserció de registraInsercio, una targeta triada)
 *                            // la buiden ABANS de la cadena (buidaLlavorVerge):
 *                            // també són el primer clic.
 *                            // Gauntlet 261017 (C06, auditoria Codex) · Sense la
 *                            // clau, cap llavor (null), com la fitxa del Perfil:
 *                            // el component universal ja no importa la secció de
 *                            // Notes (el cicle DocumentEditor → NotesSection →
 *                            // NotesDetail → NotesEditor → DocumentEditor). Qui
 *                            // vol una plantilla la passa: el Bloc, LLAVORS_NOTA.
 *   posicioEines: 'dalt'|'davall-entradilla' // Opcional ('dalt'). On va la barra
 *                            // d'eines; qualsevol altre valor es comporta com 'dalt'.
 *   emoticona: String        // Opcional (T51). El camp CRU d'emoticona del document
 *                            // ('' | un emoji): l'espai central de la barra taronja.
 *                            // També a l'estat buit (T66b), sempre en lectura.
 *   onObriEmoticona: () => void // Opcional (T51). Amb ell, l'espai central és el
 *                            // botó que obri el diàleg d'emoticona del consumidor
 *                            // (ploma blanca sense emoticona). Sense, cel·la de lectura.
 *                            // Bloc 3.9 (261016) · El Bloc de Notes ja no el passa:
 *                            // la barra taronja queda en lectura i el diàleg s'obri
 *                            // des del botó «Emojis XL» de la botonera.
 *   ambVistes: Boolean       // Opcional (CONTRACTE-3, pla 261008_1201; true). Amb
 *                            // false, davall del títol (.sdp-copyright-control) no es
 *                            // pinten «Vista A4 / PDF» i «Crear portada»
 *                            // (DocumentPrintPreview): el consumidor les porta a un
 *                            // altre apartat. El botó dels drets es queda. Sense la
 *                            // clau, el DOM de sempre (Notes i el catàleg).
 *   targetaViva, avisTargetaViva // RETIRADES (T50 · Bloc 3.4 del Gauntlet, 261016).
 *                            // L'aside de la targeta viva a la dreta i el seu xip
 *                            // «Vista targeta» ja no tenien cap consumidor (Notes
 *                            // els va llevar a P4; el Perfil, al pla 261015). La
 *                            // closca és sempre filla directa del contenidor; la
 *                            // targeta viva viu a la fitxa de la llista (NotaFitxa,
 *                            // PerfilShell) i a «Les vistes» (DetallVistes). Una
 *                            // clau vella que encara arribe passa per ...rest i
 *                            // PageFrame no la llig: el DOM de sempre.
 *   targetes: { cerca(consulta) } // Opcional (T7, 261004). Targetes incrustades al
 *                            // cos: l'ordre «/» «Targeta» obri el selector, que
 *                            // busca amb cerca() (entrades d'indexCerca: Model B).
 *                            // Ha de ser CONSTANT durant la vida de l'adaptador:
 *                            // l'esquema de TipTap es fixa en crear l'editor.
 *                            // Sense la clau, el DOM és el de sempre.
 *   peuDePagina: ReactNode   // Opcional. Esmena 2 del pla 261007_1645 (ordre del
 *   etiquetaPeuDePagina: String // Mestre, 261007: llistar el que l'avatar actiu ja
 *                            // té publicat «per tot el sistema»). El peu de la
 *                            // pàgina de l'editor: no es desestructura ací, passa
 *                            // per ...rest a UniversalEditorShell i d'ací a la
 *                            // UniversalPage i a PageFrame, que el pinta després
 *                            // de l'article, dins del contenidor que fa scroll, en
 *                            // un section amb nom (etiquetaPeuDePagina). Fora de
 *                            // l'article: l'Índex de la nota no el recull. Va
 *                            // l'últim i sempre en la mateixa posició: aparéixer o
 *                            // canviar no remunta TipTap. L'estat buit
 *                            // (EmptyDocumentPage) no el rep. Ha de ser un node
 *                            // memoritzat pel consumidor (NotesEditor ·
 *                            // useMemo): un JSX nou a cada pintada refaria
 *                            // l'adaptador. Sense la clau, el DOM de sempre.
 *   registraInsercio: (inserix, { pot }) => (() => void)|void // Opcional (Bloc
 *                            // 3.8 del Gauntlet, 261016). Quan l'editor és viu,
 *                            // el registra: inserix(text) → Boolean escriu el
 *                            // text (un node de text) al cursor del cos, amb
 *                            // el focus de tornada, i torna true; pot() →
 *                            // Boolean ho pregunta sense escriure. Tots dos
 *                            // tornen false si no hi ha document, el cos no és
 *                            // editable o és fora de la vista (dins d'un
 *                            // [inert], un [aria-hidden="true"] o un [hidden], o
 *                            // amb la vista de drets oberta), i qui crida
 *                            // decidix què fer (el Bloc copia). La funció que
 *                            // torna, si en torna, el desregistra en
 *                            // desmuntar-se o en canviar d'editor. No passa
 *                            // per ...rest.
 *   obreEmojis: () => void   // Opcional (Bloc 3.8). Amb ella, l'ordre «/» Emoji
 *                            // (extensions · creaOrdres ambEmojis) l'obri,
 *                            // per una ref: les extensions no es refan si la
 *                            // funció canvia. Sense la clau, les ordres i les
 *                            // extensions de sempre. No passa per ...rest.
 *   fotosDePublicacio: Boolean // Opcional (P1-64, pla 261028_1526 §3.1.1;
 *                            // Mestre 261028, decisió 8; false). Només el cos
 *                            // d'una PUBLICACIÓ (el Bloc de Notes): l'ordre
 *                            // «/» Imatge rep demanaExif (estable) i, si la
 *                            // foto porta la ubicació o la data, ho pregunta
 *                            // en un diàleg menut, germà de la closca: la
 *                            // casella «Conserva la ubicació i la data de la
 *                            // foto» (marcada de sèrie, com el hero), les
 *                            // píndoles de la precisió (l'exacta de sèrie) i
 *                            // «Inserir». Cancel·lar no inserix res. Revisió
 *                            // adversarial 261028 · Opt-in: el text del Perfil
 *                            // (identitat) i el catàleg no la porten i la foto
 *                            // del cos hi entra neta, com sempre. Sense la
 *                            // clau, la crida i el DOM de sempre. Les fotos
 *                            // enganxades o arrossegades entren sempre netes.
 *   proposaCard: (contingut, { previsio }) => { motiu, camps, cos } // Opcional
 *                            // (IDEA-41, Mestre 261028; Bloc H). El motor pur
 *                            // del consumidor (el Bloc: sections/notes/
 *                            // proposaCard.js; el component universal no
 *                            // importa cap secció, C06): rep { title, subtitle,
 *                            // lead, content } i torna motiu ('proposta' si hi
 *                            // ha res a pujar), els camps buits que s'omplin i
 *                            // el cos sense les línies pujades. Amb
 *                            // ell i updateLocal, la barra d'eines porta
 *                            // «🎴 Proposa Card», apagat si no hi ha res a
 *                            // proposar. Sense la clau, la barra i el DOM de
 *                            // sempre (Perfil i catàleg). No passa per ...rest.
 *   placeholderTitol: String|null // Opcional (Bloc 3.9 del Gauntlet, 261016).
 *                            // El placeholder de l'H1 de la closca i el títol de
 *                            // reserva de la Vista A4 / PDF. El Bloc de Notes hi
 *                            // posa «Nota sense títol» (TITOL_NOTA_PREPARADA, el
 *                            // mateix de la targeta). Sense la clau,
 *                            // TEXTOS_LLAVOR.titol i el DOM de sempre.
 *   edicioAvancada: Boolean  // Opcional (Bloc 3.9, 261016; false). Amb true, la
 *                            // closca agrupa en un desplegable plegat «Edició
 *                            // avançada», just damunt de la barra d'eines, la
 *                            // capçalera, el logotip, la botonera, els drets i
 *                            // les vistes (UniversalEditorShell). Sense la clau,
 *                            // el DOM de sempre (Perfil i catàleg).
 *   ...rest // La resta (heroEditLabel, estatDesament…) passa a UniversalEditorShell.
 *           // Ordre del Mestre (261007, ordre E): també onLogoEdit i logoEditLabel
 *           // (la ranura del logotip, mirall d'onHeroEdit) i avatarAutor, que
 *           // la closca deixa passar fins a PageFrame (l'avatar redó damunt de l'H1).
 *
 * T40 (ordre del Mestre, 260928) · La identitat ja no va a la barra taronja
 * (cap `identityActions`): viu a la barra negra (TopBar).
 * }
 *
 * Amb 'dalt' la columna de l'editor només té una fila pròpia, la de les eines,
 * i la barra blava de la pàgina ocupa la fila 2, alineada amb la dels controls
 * de les altres columnes (skill sdp-app-grid-shell §2). Amb 'davall-entradilla'
 * (D13) la barra blava és la fila 1 i les eines baixen dins del document, just
 * davall de l'entradilla.
 */

/* Estat buit: una UniversalPage completa (barra blava, capçalera, barra taronja,
   bloc blanc del títol i cos de lectura) en lloc d'un simple "Obre un solc".
   T51 (decisió del Mestre, 260928) · La pastilla porta la data i l'hora d'ara
   (abans només l'hora), amb el seu dateTime: mai buida.
   T66b (sdp-pedra-seca §10) · L'estat buit és LECTURA: l'espai central porta
   l'emoticona triada que dona l'adaptador (una fitxa en baixa o de reserva)
   i, sense, la cel·la buida. Mai el botó: onObriEmoticona no hi arriba.
   Ordre del Mestre (261007) · Amb barAuthorHref, l'autoria porta a la pàgina
   de qui signa; sense, la topBarData de sempre (cap clau authorHref).
   Ordre del Mestre (261007, ordre E) · Damunt de l'H1, el mateix que la fitxa
   pública (PerfilPublicSection; derogació del showLogos={false}, 261004):
   `logoEntitat` (el logotip d'una entitat) o `avatarAutor` (l'avatar redó
   d'una persona o d'un agent IA), les claus de PageFrame. És LECTURA: de
   l'avatar només passen src i alt, mai onCanvia. Sense les claus, cap prop
   nova i el DOM de sempre.
   Gauntlet 261030 (cicle 3, traduir-perfil-lectura-fitxa-no-publica; TC3.2)
   · Traduir només és actiu si l'adaptador diu que el document és públic
   (`traduccio: true`: la nota de benvinguda del Bloc, una fitxa publicada).
   La fitxa en lectura d'una entitat només per als membres no ix cap al
   motor. Sense la marca, tampoc (fallada tancada). El botó no canvia (Llei
   del Píxel): PageFrame avisa (AVIS_PAGINA_SENSE_TRADUCCIO). */
function EmptyDocumentPage({ emptyDocument, emptyPlaceholder, barAuthorAvatar, barAuthorName, barAuthorLocation, barAuthorHref, emoticona, t }) {
  const doc = emptyDocument || {};
  const title = doc.title || emptyPlaceholder || t('editor.open', 'Obre un document');
  const rawHtml = doc.content || '';
  const capDeLectura = {
    ...(doc.logoEntitat ? { logoEntitat: doc.logoEntitat } : null),
    ...(doc.avatarAutor ? { avatarAutor: { src: doc.avatarAutor.src, alt: doc.avatarAutor.alt } } : null),
  };

  return (
    <div className="sdp-editor-shell-atomic">
      <div className="sdp-editor-document">
        <UniversalPage
          chrome="context"
          layout="contained"
          traduccio={doc.traduccio === true}
          title={title}
          subtitle={doc.subtitle}
          lead={doc.lead}
          heroImage={doc.heroImage}
          heroAlt={doc.heroAlt || ''}
          showLogos={Boolean(doc.showLogos)}
          {...capDeLectura}
          labels={doc.labels || []}
          copyright={doc.copyright}
          topBarData={{
            authorName: barAuthorName,
            authorLocation: barAuthorLocation,
            authorAvatar: barAuthorAvatar,
            ...(barAuthorHref ? { authorHref: barAuthorHref } : null),
            emoticona,
            /* Per barActions i sense onClick: un <time>, com abans (UniversalPage
               faria de la pastilla per defecte un botó cap al Mur). */
            barActions: <DateTimeControl {...dataHoraAra()} />
          }}
        >
          {rawHtml ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(rawHtml) }} /> : null}
        </UniversalPage>
      </div>
    </div>
  );
}
export function DocumentEditor({ adapter, onToast }) {
  const { t } = useUIActions();
  const { 
    document, 
    updateLocal, 
    saveRemote, 
    publish,
    /* T5 · «Compartir» per a una nota connectada; sense valor, «Publicar». */
    publishLabel = null,
    uploadMedia,
    deleteDocument,
    labels,
    emptyPlaceholder,
    emptyDocument,
    /* T41 · el selector de visibilitat (null: textos genèrics i `publish` de reserva). */
    visibilitat = null,
    /* T40 · la pastilla de data obri el calendari de publicació. */
    ambDataPublicacio = false,
    avisDataPublicacio = null,
    classificacio = null,
    llicencia = null,
    /* T39 · la vista de drets d'autor (null: sense avís d'herència). */
    dretsAutor = null,
    /* Correcció de la revisió (261008) · la llicència triada de veres (undefined: document.copyright). */
    dretsTriats = undefined,
    /* Directiva de Dignitat Humana (261015) · false: cap rastre de drets d'autor. */
    ambDrets = true,
    seedContent = null,
    posicioEines = 'dalt',
    statusIcon,
    barAuthorAvatar,
    barAuthorName,
    barAuthorLocation,
    /* Ordre del Mestre (261007) · la ruta de la pàgina de qui signa (null: sense enllaç). */
    barAuthorHref = null,
    /* T51 · l'espai central de la barra taronja (camp cru i obertura del diàleg). */
    emoticona = '',
    onObriEmoticona = null,
    /* CONTRACTE-3 (261008) · false: les vistes (A4 i portada) no van davall del títol. */
    ambVistes = true,
    /* T7 · la font de les targetes incrustades (null: el cos de sempre). */
    targetes = null,
    /* Bloc 3.8 (261016) · el canal d'inserció al cursor i l'ordre «/» Emoji. */
    registraInsercio = null,
    obreEmojis = null,
    /* Bloc 3.9 (261016) · el placeholder de l'H1 (null: el de sempre). */
    placeholderTitol = null,
    /* Bloc 3.9 (261016) · el desplegable «Edició avançada» (false: el DOM de sempre). */
    edicioAvancada = false,
    /* P1-64 (261028) · la pregunta de l'EXIF de les fotos del cos (false: netes, com sempre). */
    fotosDePublicacio = false,
    /* IDEA-41 (261028) · el motor de «🎴 Proposa Card» (null: cap botó). */
    proposaCard = null,
    /* P1-59 (a) (261030) · el text fantasma del cos buit (null: cap, com sempre). */
    placeholderCos = null,
    ...rest
  } = adapter;

  const ambTargetes = Boolean(targetes);
  /* Bloc 3.8 · Per una ref, com onToast: l'extensió es fixa en crear l'editor. */
  const ambEmojis = typeof obreEmojis === 'function';
  const obreEmojisRef = useRef(obreEmojis);
  obreEmojisRef.current = obreEmojis;
  const obreEmojisDelCos = useCallback(() => {
    if (typeof obreEmojisRef.current === 'function') obreEmojisRef.current();
  }, []);
  /* Ordre del Mestre (261007, ordre E) · L'ordre «/» Imatge avisa pel mateix
     canal que la capçalera (onToast) quan la pujada es rebutja o el fitxer no
     és una imatge. Per una ref: les extensions han de ser CONSTANTS (useMemo,
     richText/extensions) i un onToast nou a cada render reconstruiria TipTap.
     Auditoria 261007 (retocs de l'ordre E) · Sense onToast, un console.warn
     amb el mateix missatge de l'avís (també per a un fitxer que no és una
     imatge). */
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;
  const avisaDelCos = useCallback((missatge, tipus) => {
    if (typeof onToastRef.current === 'function') onToastRef.current(missatge, tipus);
    else console.warn(`[slash] ${missatge}`);
  }, []);
  /* P1-64 (pla 261028_1526 §3.1.1) · La pregunta de l'EXIF d'una foto del cos
     (l'ordre «/» Imatge): { exif, conserva, precisio } mentre és oberta, i la
     resposta per la ref (una promesa que es resol una sola vegada). Si
     l'editor es desmunta amb la pregunta oberta, es cancel·la. */
  const [preguntaExif, setPreguntaExif] = useState(null);
  const preguntaExifRef = useRef(null);
  const respostaExif = useCallback((resposta) => {
    const resol = preguntaExifRef.current;
    preguntaExifRef.current = null;
    setPreguntaExif(null);
    resol?.(resposta);
  }, []);
  const demanaExifDelCos = useCallback((_original, exif) => new Promise((resol) => {
    preguntaExifRef.current?.(null);
    preguntaExifRef.current = resol;
    setPreguntaExif({ exif, conserva: true, precisio: PRECISIO_PER_DEFECTE_PUBLICACIO });
  }), []);
  useEffect(() => () => { preguntaExifRef.current?.(null); }, []);
  /* Sense obreEmojis ni fotosDePublicacio, la crida de sempre (cap clau nova).
     Revisió adversarial 261028 · demanaExif només amb fotosDePublicacio === true:
     el text d'una persona al Perfil és identitat i la foto hi entra neta. */
  const ambExifDelCos = fotosDePublicacio === true;
  /* P1-59 (a) · El text fantasma del cos, només amb un text no buit (sense,
     cap clau nova a la crida). Un text, no un objecte: el memo no es refà. */
  const textFantasma = typeof placeholderCos === 'string' && placeholderCos.trim() ? placeholderCos : null;
  const extensions = useMemo(
    () => extensionsRiques({
      onImageUpload: uploadMedia, ambTargetes, onToast: avisaDelCos,
      ...(ambEmojis ? { obreEmojis: obreEmojisDelCos } : {}),
      ...(ambExifDelCos ? { demanaExif: demanaExifDelCos } : {}),
      ...(textFantasma ? { placeholderCos: textFantasma } : {}),
    }),
    [uploadMedia, ambTargetes, avisaDelCos, ambEmojis, obreEmojisDelCos, ambExifDelCos, demanaExifDelCos, textFantasma],
  );

  const desaLocal = useCallback(
    (field, val, id) => {
      if (id != null && updateLocal) updateLocal(id, field, val);
    },
    [updateLocal],
  );

  const desaCamp = useCallback(
    (field, val, id) => {
      if (id != null && saveRemote) saveRemote(id, field, val);
    },
    [saveRemote],
  );

  /* IDEA-41 · L'últim cos que ha emés l'editor: mentre document.content siga
     eixe, la previsió de «Proposa Card» el llig tal qual (hiHaProposta). */
  const cosEmes = useRef(null);
  const handleChange = useCallback(
    (html, id) => {
      cosEmes.current = html;
      desaLocal('content', html, id);
    },
    [desaLocal],
  );

  const handleSave = useCallback(
    (html, id) => desaCamp('content', html, id),
    [desaCamp],
  );

  const editor = useUniversalRichText({
    content: document?.content || '',
    id: document?.id,
    extensions,
    onChange: handleChange,
    onSave: handleSave,
    debounceMs: 800,
    seedContent,
  });

  const { state, exec } = useTipTapToolbarAdapter(editor);

  /* T41 (ordre del Mestre, 260928) · PUBLICAR i la bola del món ja no canvien
     res en silenci: obrin el selector de visibilitat. L'estat guarda l'id del
     document que l'ha obert, no un booleà: al Perfil DocumentEditor no porta
     key per identitat, i un canvi d'identitat el tanca sol en lloc d'aplicar
     la tria a una altra fitxa. Tots els hooks van abans del retorn primerenc. */
  const [visibilitatDe, setVisibilitatDe] = useState(null);
  /* Un altre document: el selector s'oblida (tornar a A no el reobri). */
  if (visibilitatDe != null && visibilitatDe !== document?.id) setVisibilitatDe(null);
  const obreVisibilitat = useCallback(() => {
    if (document) setVisibilitatDe(document.id);
  }, [document]);
  const tancaVisibilitat = useCallback(() => setVisibilitatDe(null), []);
  /* Confirmar: el consumidor decidix (visibilitat.onTria). Sense adaptador de
     visibilitat, «pública» crida el `publish` de sempre i «privada» no fa res. */
  const triaVisibilitat = useCallback((publicaTriada) => {
    if (!document) return true;
    if (visibilitat?.onTria) return visibilitat.onTria(publicaTriada, document);
    return publicaTriada && publish ? publish(document) : true;
  }, [document, visibilitat, publish]);

  /* T40 (ordre del Mestre, 260928) · La data triada es desa com qualsevol
     altre camp: al moment (updateLocal) i pel canal d'autodesament (saveRemote). */
  const triaDataPublicacio = useCallback((iso) => {
    if (!document) return;
    desaLocal('publishDate', iso, document.id);
    desaCamp('publishDate', iso, document.id);
  }, [document, desaLocal, desaCamp]);

  /* Abans del retorn primerenc: un hook condicional canvia l'ordre dels hooks
     quan el document passa de buit a carregat i React llança. */
  const esborra = useCallback(() => {
    if (document && deleteDocument) deleteDocument(document);
  }, [deleteDocument, document]);

  /* T39 (ordre del Mestre, 260928) · «Elegir drets d'autor» obri una vista a
     pantalla completa DINS de la columna (CopyrightPage), no un diàleg. La
     closca s'amaga amb una classe però continua MUNTADA: TipTap, els camps i
     la cua d'autodesament no es desmunten ni perden res. Com el selector de
     visibilitat, l'estat guarda l'id del document que l'ha obert. */
  const [dretsDe, setDretsDe] = useState(null);
  if (dretsDe != null && dretsDe !== document?.id) setDretsDe(null);
  const dretsOberts = dretsDe != null && dretsDe === document?.id;
  /* On tornar en tancar: el botó i la posició de scroll de la pàgina (amb la
     closca en display:none, el navegador la perd). */
  const retornDrets = useRef(null);
  const obreDrets = useCallback((event) => {
    if (!document) return;
    const boto = event?.currentTarget ?? null;
    const contenidor = boto?.closest?.('.sdp-universal-page-container') ?? null;
    retornDrets.current = { boto, contenidor, scroll: contenidor?.scrollTop ?? 0 };
    setDretsDe(document.id);
  }, [document]);
  /* Poliment T39 · T47 (ordre del Mestre, 260928) · L'esborrany de la vista
     (tria i text lliure) es guarda per document a cada canvi: Escape dins del
     text lliure, «Tornar al document» o canviar de document no perden el que
     s'hi ha escrit, i en reobrir torna. Desar o «Cancel·lar» (renúncia
     explícita) el descarten. La casella de CC0 no s'hi guarda mai. És memòria
     d'esta pantalla, no del document: res no es desa fins a «Desar autoria». */
  const esborranysDrets = useRef(new Map());
  const guardaEsborranyDrets = useCallback((esborrany) => {
    if (document) esborranysDrets.current.set(document.id, esborrany);
  }, [document]);
  const tancaDrets = useCallback((motiu) => {
    if (motiu === 'boto' && document) esborranysDrets.current.delete(document.id);
    setDretsDe(null);
  }, [document]);
  const desaDrets = useCallback((valor) => {
    if (!document) return;
    esborranysDrets.current.delete(document.id);
    /* El camí de sempre: al moment (updateLocal) i per l'autodesament (saveRemote). */
    desaLocal('copyright', valor, document.id);
    desaCamp('copyright', valor, document.id);
    setDretsDe(null);
  }, [document, desaLocal, desaCamp]);
  /* En tancar (desar, cancel·lar, tornar o Escape), abans de pintar: la
     pàgina torna on era i el focus, al botó que l'ha oberta. */
  useLayoutEffect(() => {
    if (dretsOberts) return;
    const retorn = retornDrets.current;
    if (!retorn) return;
    retornDrets.current = null;
    if (retorn.contenidor?.isConnected) retorn.contenidor.scrollTop = retorn.scroll;
    if (retorn.boto?.isConnected) retorn.boto.focus({ preventScroll: true });
  }, [dretsOberts]);

  /* T7 (ordre del Mestre, prompt 261004_0515) · Targetes incrustades al cos.
     L'ordre de l'editor (obreSelectorDeTargeta) obri el selector pel magatzem
     de l'extensió; el selector i l'avís de previsualització són UN sol
     diàleg cadascun, germans de la closca, mai dins del contenteditable.
     Abans del retorn primerenc, com la resta de hooks. */
  const [selectorTargetaObert, setSelectorTargetaObert] = useState(false);
  const [avisTargetaObert, setAvisTargetaObert] = useState(false);
  useEffect(() => {
    const magatzem = ambTargetes && editor && !editor.isDestroyed ? editor.storage?.[NOM_EXTENSIO_TARGETES] : null;
    if (!magatzem) return undefined;
    const obre = () => setSelectorTargetaObert(true);
    magatzem.obreSelector = obre;
    return () => {
      if (magatzem.obreSelector === obre) magatzem.obreSelector = null;
    };
  }, [ambTargetes, editor]);
  const tancaSelectorTargeta = useCallback(() => setSelectorTargetaObert(false), []);
  const triaTargeta = useCallback((entrada) => {
    setSelectorTargetaObert(false);
    const attrs = attrsDeEntrada(entrada);
    if (!attrs || !editor || editor.isDestroyed) return;
    buidaLlavorVerge(editor);
    editor.chain().focus().inserirTargeta(attrs).run();
  }, [editor]);
  const avisaTargeta = useCallback(() => setAvisTargetaObert(true), []);
  const tancaAvisTargeta = useCallback(() => setAvisTargetaObert(false), []);
  const contextTargetes = useMemo(
    () => (ambTargetes ? { avisa: avisaTargeta, t } : null),
    [ambTargetes, avisaTargeta, t],
  );

  /* Bloc 3.8 del Gauntlet (261016) · Inserir al cursor des de fora del cos
     (la graella d'emojis del Bloc: la icona de NOTES i l'ordre «/» Emoji).
     Un efecte, no les extensions (han de ser constants): registra l'editor
     viu i el desregistra en desmuntar-se o en canviar d'editor. El document i
     la vista de drets es lligen per una ref: el registre no es refà a cada
     tecla. S'inserix un node de text, mai HTML. Si el cos no es pot escriure
     o no es veu (el detall tapat i inert del mestre-detall en estret, la
     closca amagada per la vista de drets), torna false i qui crida decidix.
     Correcció de la revisió (261016) · Sobre una nota nova, l'emoji és el
     primer gest: la plantilla verge s'esvaeix abans (buidaLlavorVerge) i
     l'emoji queda sol al cos, també a Safari, on el focus de la cadena és
     immediat. */
  const insercioViva = useRef({ document: null, dretsOberts: false });
  insercioViva.current = { document, dretsOberts };
  useEffect(() => {
    if (typeof registraInsercio !== 'function' || !editor) return undefined;
    const pot = () => {
      if (editor.isDestroyed || !editor.isEditable) return false;
      const viu = insercioViva.current;
      if (!viu.document || viu.dretsOberts) return false;
      let cos = null;
      try {
        cos = editor.view.dom;
      } catch {
        cos = null;
      }
      return Boolean(cos?.isConnected) && !cos.closest(FORA_DE_LA_VISTA);
    };
    const inserix = (text) => {
      const net = typeof text === 'string' ? text : '';
      if (!net || !pot()) return false;
      buidaLlavorVerge(editor);
      return editor.chain().focus().insertContent({ type: 'text', text: net }).run();
    };
    const desregistra = registraInsercio(inserix, { pot });
    return () => {
      if (typeof desregistra === 'function') desregistra();
    };
  }, [registraInsercio, editor]);

  /* IDEA-41 (Llibre Mestre; Mestre 261028, Bloc H: determinista, sense IA) ·
     «🎴 Proposa Card» a la barra d'eines. El motor és del consumidor
     (adapter.proposaCard, pur) i ací només s'aplica, d'una sola passada:
       · el cos, en UNA transacció de TipTap amb l'historial tancat davant i
         darrere (closeHistory): Cmd/Ctrl+Z la desfà sencera i sola, sense
         ajuntar-la amb el que s'havia escrit just abans ni amb el que vinga;
       · els camps buits que s'omplin, pel camí de sempre (updateLocal i
         saveRemote).
     Els camps no són de TipTap: quan el cos torna exactament al d'abans de la
     proposta (Cmd/Ctrl+Z, o el mateix botó, que diu «Desfés la proposta»
     mentre ningú no ha tocat el cos), els camps que encara diuen el que s'hi
     va pujar tornen al que eren; si es refà (Cmd/Ctrl+Maj+Z), es tornen a
     omplir els que no s'han tocat. Un camp que la persona ha canviat després
     no es toca mai. La disponibilitat (el botó apagat quan no hi ha res a
     proposar) és la previsió del motor sobre els camps i el cos que ja
     arriben a cada tecla per updateLocal. Sense updateLocal, cap botó: no hi
     ha on escriure els camps.
     Revisió adversarial 261028 · Es recorden totes les propostes del
     document, no només l'última: Cmd/Ctrl+Z fins al principi desfà també els
     camps de les d'abans (cap línia no queda al cos i al camp alhora). I
     «Desfés la proposta» posa el cos d'abans en un pas propi, no l'últim pas
     de l'historial: escriure i esborrar torna al mateix cos amb dos passos
     damunt de la proposta. */
  const ambProposta = typeof proposaCard === 'function' && Boolean(updateLocal);
  const proposaCardRef = useRef(proposaCard);
  proposaCardRef.current = proposaCard;
  const documentViu = useRef(document);
  documentViu.current = document;
  const propostesFetes = useRef([]);
  const [, repintaProposta] = useReducer((n) => n + 1, 0);
  const teDocument = Boolean(document);
  const titolDelDocument = document?.title;
  const subtitolDelDocument = document?.subtitle;
  const entradillaDelDocument = document?.lead;
  const cosDelDocument = document?.content;
  /* Revisió adversarial 261028 · El clic llig el cos de l'editor (getHTML),
     que TipTap normalitza: un cos desat en text pla o dins d'un <div> pot
     tindre proposta encara que la cadena no en tinga. Un cos que no ha eixit
     de l'editor (el que es carrega, o una sincronia) es llig normalitzat amb
     l'esquema de l'editor, sense tocar-lo, una sola vegada per cos: teclejar
     al títol, al subtítol o a l'entradeta no el torna a llegir (un cos de 2 MB
     costava ~65 ms per tecla); el que ja ha emés ell no costa res de més. */
  const cosNormalitzat = useMemo(() => {
    if (!ambProposta || !editor || editor.isDestroyed || typeof cosDelDocument !== 'string' || cosDelDocument === cosEmes.current) return null;
    try {
      return getHTMLFromFragment(createDocument(cosDelDocument, editor.schema).content, editor.schema);
    } catch {
      return null;
    }
  }, [ambProposta, cosDelDocument, editor]);
  const hiHaProposta = useMemo(() => {
    if (!ambProposta || !teDocument) return false;
    const preveu = (content) => proposaCard({
      title: titolDelDocument, subtitle: subtitolDelDocument, lead: entradillaDelDocument, content
    }, { previsio: true })?.motiu;
    try {
      const motiu = preveu(cosDelDocument);
      if (motiu === MOTIU_PROPOSTA) return true;
      if (motiu !== MOTIU_RES || cosNormalitzat === null) return false;
      return preveu(cosNormalitzat) === MOTIU_PROPOSTA;
    } catch {
      return false;
    }
  }, [ambProposta, proposaCard, teDocument, titolDelDocument, subtitolDelDocument, entradillaDelDocument, cosDelDocument, cosNormalitzat]);
  const escriuCamps = useCallback((id, valors) => {
    for (const [camp, valor] of Object.entries(valors)) {
      desaLocal(camp, valor, id);
      desaCamp(camp, valor, id);
    }
  }, [desaLocal, desaCamp]);
  /* Cmd/Ctrl+Z i Cmd/Ctrl+Maj+Z (i el botó «Desfés la proposta»): els camps
     seguixen el cos quan torna al d'abans o al de després de la proposta. */
  useEffect(() => {
    if (!ambProposta || !editor) return undefined;
    const seguix = () => {
      if (!propostesFetes.current.length || editor.isDestroyed) return;
      const actual = documentViu.current;
      // Les propostes d'un altre document ja no tenen res a seguir.
      propostesFetes.current = propostesFetes.current.filter((feta) => actual && feta.id === actual.id);
      const doc = editor.state.doc;
      for (const feta of propostesFetes.current) {
        if (!feta.desfeta && doc.eq(feta.docAbans)) {
          escriuCamps(feta.id, campsQueTornen(actual, feta.camps, feta.abans));
          feta.desfeta = true;
        } else if (feta.desfeta && doc.eq(feta.docDespres)) {
          escriuCamps(feta.id, campsQueTornen(actual, feta.abans, feta.camps));
          feta.desfeta = false;
        }
      }
      repintaProposta();
    };
    editor.on('update', seguix);
    return () => {
      editor.off('update', seguix);
    };
  }, [ambProposta, editor, escriuCamps]);
  const proposaOdesfes = useCallback(() => {
    const actual = documentViu.current;
    const motor = proposaCardRef.current;
    if (!actual || !editor || editor.isDestroyed || !editor.isEditable || typeof motor !== 'function') return;
    const feta = propostesFetes.current[propostesFetes.current.length - 1];
    if (feta && !feta.desfeta && feta.id === actual.id && editor.state.doc.eq(feta.docDespres)) {
      /* «Desfés la proposta»: el cos d'abans, en un pas propi tancat davant i
         darrere (el de dalt de la pila pot ser un altre); seguix() hi torna
         els camps i Cmd/Ctrl+Z la torna a aplicar. */
      editor.chain()
        .command(({ tr }) => {
          closeHistory(tr);
          tr.replaceWith(0, tr.doc.content.size, feta.docAbans.content);
          return true;
        })
        .run();
      editor.chain().command(({ tr }) => { closeHistory(tr); return true; }).run();
      return;
    }
    let proposta = null;
    try {
      proposta = motor({ title: actual.title, subtitle: actual.subtitle, lead: actual.lead, content: editor.getHTML() });
    } catch {
      proposta = null;
    }
    if (proposta?.motiu !== MOTIU_PROPOSTA || typeof proposta.cos !== 'string') {
      onToastRef.current?.(t('editor.proposaCard.res', 'No hi ha res a proposar: els camps de la targeta ja són plens o el cos no comença amb text.'));
      return;
    }
    const docAbans = editor.state.doc;
    editor.chain()
      .command(({ tr }) => { closeHistory(tr); return true; })
      .setContent(proposta.cos, { emitUpdate: true })
      .run();
    editor.chain().command(({ tr }) => { closeHistory(tr); return true; }).run();
    const camps = { ...proposta.camps };
    const abans = Object.fromEntries(Object.keys(camps).map((camp) => [camp, actual[camp] ?? '']));
    propostesFetes.current = [
      ...propostesFetes.current.filter((f) => f.id === actual.id),
      { id: actual.id, docAbans, docDespres: editor.state.doc, camps, abans, desfeta: false }
    ];
    escriuCamps(actual.id, camps);
    onToastRef.current?.(t('editor.proposaCard.feta', 'Card proposada. Per a tornar-la arrere: «Desfés la proposta» o Cmd/Ctrl+Z.'));
    repintaProposta();
  }, [editor, escriuCamps, t]);

  if (!document) {
    return (
      <EmptyDocumentPage
        emptyDocument={emptyDocument}
        emptyPlaceholder={emptyPlaceholder}
        barAuthorAvatar={barAuthorAvatar}
        barAuthorName={barAuthorName}
        barAuthorLocation={barAuthorLocation}
        barAuthorHref={barAuthorHref}
        emoticona={emoticona}
        t={t}
      />
    );
  }

  const esPublica = Boolean(document.isPublished);
  const textosVisibilitat = visibilitat?.textos || TEXTOS_VISIBILITAT;
  /* Sense adaptador, un document ja públic no es pot tornar privat: cap
     consumidor futur queda amb un botó que menteix. */
  const bloqueigVisibilitat = visibilitat
    ? (visibilitat.bloqueig ?? null)
    : (esPublica ? { opcio: 'privada', motiu: 'Este document encara no es pot tornar a fer privat.' } : null);
  const visibilitatOberta = visibilitatDe != null && visibilitatDe === document.id;
  const etiquetaVisibilitat = `${esPublica ? textosVisibilitat.publica.etiqueta : textosVisibilitat.privada.etiqueta}: canviar la visibilitat`;

  /* IDEA-41 · «Desfés la proposta» mentre el cos és el que va deixar la proposta. */
  const propostaViva = propostesFetes.current[propostesFetes.current.length - 1];
  const propostaDesfeible = Boolean(ambProposta && propostaViva && !propostaViva.desfeta && propostaViva.id === document.id
    && editor && !editor.isDestroyed && editor.state.doc.eq(propostaViva.docDespres));

  const topBar = (
    <UniversalRichTextToolbar
      state={state}
      exec={exec}
      onPublish={obreVisibilitat}
      publishPopup="dialog"
      publishLabel={publishLabel}
      onDelete={deleteDocument ? esborra : undefined}
      /* IDEA-41 · Sense motor, cap clau nova: la barra de sempre. */
      {...(ambProposta ? {
        onProposaCard: proposaOdesfes,
        proposaCardDisabled: !propostaDesfeible && !hiHaProposta,
        proposaCardDesfer: propostaDesfeible
      } : null)}
      t={t}
    />
  );

  const copyrightValue = document.copyright || '© Sóc de Poble';

  /* Davall del títol: la botonera de classificació i, davall d'ella, la
     ranura de la llicència. Sense botonera, PageFrame pinta les píndoles.
     Decisió del Mestre (261008) · potTriarDrets és la condició de la
     píndola (cap ranura pròpia de llicència i un document que es pot
     editar): amb ella, també el copyright de la capçalera obri la vista de
     drets (onCanviaCopyright de PageFrame) en lloc de portar a /page/drets-autor.
     La píndola rep la llicència triada de veres (document.copyright), mai
     la reserva «© Sóc de Poble».
     Correcció de la revisió (261008) · Amb la clau dretsTriats, mana ella:
     el Perfil hi posa el «© Nom» de lectura (perfilCamps) encara que ningú
     no n'haja triat cap, i la píndola el donava per triat. Un valor que no
     és text (null) és «cap triada».
     Directiva de Dignitat Humana (261015) · Amb ambDrets={false} no es pot
     triar res (potTriarDrets fals) i la capçalera no porta cap copyright. */
  const potTriarDrets = ambDrets && !llicencia && Boolean(updateLocal);
  const llicenciaTriada = dretsTriats === undefined
    ? (document.copyright || '')
    : (typeof dretsTriats === 'string' ? dretsTriats : '');
  const copyrightSelector = (ambDrets ? llicencia : null) || (potTriarDrets ? <BotoDretsAutor valor={copyrightValue} triada={llicenciaTriada} onClick={obreDrets} /> : null);
  /* CONTRACTE-3 (261008) · Amb ambVistes={false}, ni Vista A4 / PDF ni Crear
     portada: el botó dels drets es queda.
     T50 · Bloc 3.4 (261016) · El xip «Vista targeta» ja no és d'esta ranura:
     el control només porta els drets i, darrere, les vistes. */
  const ranuraClassificacio = classificacio || copyrightSelector ? (
    <>
      {classificacio}
      {copyrightSelector ? (
        <div className="sdp-copyright-control">
          {copyrightSelector}
          {ambVistes ? <DocumentPrintPreview document={document} author={barAuthorName} {...(placeholderTitol ? { titolReserva: placeholderTitol } : null)} /> : null}
        </div>
      ) : null}
    </>
  ) : null;

  /* T39 · Amb la vista de drets oberta, la closca s'amaga (però no es desmunta). */
  const classeCloscat = [rest.className, dretsOberts ? 'sdp-editor-shell-atomic--amagat' : null].filter(Boolean).join(' ');

  const closca = (
    <UniversalEditorShell
      key={document.id}
      id={document.id}
      topBar={topBar}
      posicioEines={posicioEines}
      titleHtml={document.title ?? ''}
      subtitleHtml={document.subtitle ?? ''}
      leadHtml={document.lead ?? ''}
      heroImage={document.heroImage}
      logoImage={document.logoImage}
      isPublished={document.isPublished}
      formattedTime={document.formattedTime}
      formattedDate={document.formattedDate}
      labels={labels || []}
      onImageUpload={uploadMedia}
      onLocalChange={desaLocal}
      onSaveField={desaCamp}
      onToast={onToast}
      barAuthorAvatar={barAuthorAvatar}
      barAuthorName={barAuthorName}
      barAuthorLocation={barAuthorLocation}
      barAuthorHref={barAuthorHref}
      statusIcon={statusIcon}
      emoticona={emoticona}
      onObriEmoticona={onObriEmoticona}
      onObriVisibilitat={obreVisibilitat}
      etiquetaVisibilitat={etiquetaVisibilitat}
      visibilitatOberta={visibilitatOberta}
      publishDate={ambDataPublicacio ? (document.publishDate ?? null) : null}
      onPublishDateChange={ambDataPublicacio ? triaDataPublicacio : null}
      avisDataPublicacio={ambDataPublicacio ? avisDataPublicacio : null}
      {...rest}
      /* Bloc 3.9 (261016) · Opt-in: sense les claus, cap prop nova a la closca. */
      {...(placeholderTitol ? { placeholderTitol } : null)}
      {...(edicioAvancada ? { edicioAvancada: true } : null)}
      className={classeCloscat}
      classificacio={ranuraClassificacio}
      copyright={ambDrets ? copyrightValue : undefined}
      /* Decisió del Mestre (261008) · Després de ...rest: cap adaptador ho
         desfà. Sense potTriarDrets (una connexió, sense updateLocal), el
         copyright continua sent l'enllaç de lectura. Amb ambDrets={false}
         (261015), cap línia de copyright. */
      onCanviaCopyright={potTriarDrets ? obreDrets : undefined}
    >
      {/* T7 · Els NodeViews de les targetes es munten com a portals dins del
          cos i llegixen este context (avisa i t). Sense targetes, el cos de sempre. */}
      {contextTargetes ? (
        <TargetesIncrustadesContext.Provider value={contextTargetes}>
          <UniversalRichTextContent editor={editor} />
        </TargetesIncrustadesContext.Provider>
      ) : <UniversalRichTextContent editor={editor} />}
    </UniversalEditorShell>
  );

  return (
    <>
      {/* T39 · Germana ABANS de la closca: la posició de la closca no canvia i
          React no la remunta en obrir o tancar la vista. */}
      {dretsOberts && ambDrets ? (
        <CopyrightPage
          valor={copyrightValue}
          autor={dretsAutor?.autor ?? barAuthorName ?? ''}
          ambit={dretsAutor?.ambit ?? 'neutre'}
          perDefecte={dretsAutor?.perDefecte ?? null}
          esborrany={esborranysDrets.current.get(document.id) ?? null}
          onEsborrany={guardaEsborranyDrets}
          onDesa={desaDrets}
          onTanca={tancaDrets}
        />
      ) : null}
      {/* T50 · Bloc 3.4 (261016) · La closca, sempre filla directa: cap
          embolcall ni aside de la targeta viva al costat de l'editor. */}
      {closca}
      {/* T41 · Una sola instància, germana de la closca: l'obrin la bola del
          món (barra taronja) i PUBLICAR (barra d'eines), també en mòbil, on
          T38 amaga la taronja. */}
      <SelectorVisibilitat
        obert={visibilitatOberta}
        onTanca={tancaVisibilitat}
        esPublica={esPublica}
        onTria={triaVisibilitat}
        textos={textosVisibilitat}
        bloqueig={bloqueigVisibilitat}
        comNom={visibilitat?.comNom || null}
      />
      {/* T7 · El selector de targetes i l'avís de previsualització, germans de
          la closca i només amb targetes: sense la clau, el DOM de sempre. */}
      {ambTargetes ? (
        <>
          <DialegTriaTargeta
            obert={selectorTargetaObert}
            onTanca={tancaSelectorTargeta}
            cerca={targetes?.cerca}
            onTria={triaTargeta}
            t={t}
          />
          <Dialeg
            obert={avisTargetaObert}
            onTanca={tancaAvisTargeta}
            titol={t('editor.targetes.avis.titol', 'Esta targeta és una previsualització')}
            descripcio={t('editor.targetes.avis.descripcio', 'Esta targeta està incrustada al document que edites. Els seus botons —connectar, traduir, comentar i compartir— només funcionen quan es llig el document publicat.')}
            mida="m"
            accions={<Boto varietat="accent" onClick={tancaAvisTargeta}>{t('editor.targetes.avis.entesos', 'Entesos')}</Boto>}
          />
        </>
      ) : null}
      {/* P1-64 · La pregunta de l'EXIF d'una foto del cos: només mentre és oberta. */}
      {preguntaExif ? (
        <Dialeg
          obert
          onTanca={() => respostaExif(null)}
          titol={t('editor.imatge.exif.titol', 'Esta foto porta la seua ubicació o la data')}
          descripcio={t('editor.imatge.exif.descripcio', 'Decidix si es publiquen amb la foto i, la ubicació, amb quina precisió.')}
          mida="s"
          accions={(
            <>
              <Boto varietat="secundari" onClick={() => respostaExif(null)}>{t('editor.imatge.exif.cancela', 'Cancel·lar')}</Boto>
              <Boto varietat="primari" onClick={() => respostaExif({ conserva: preguntaExif.conserva, precisio: preguntaExif.precisio })}>
                {t('editor.imatge.exif.inserir', 'Inserir')}
              </Boto>
            </>
          )}
        >
          <CasellaExif dades={preguntaExif.exif} conserva={preguntaExif.conserva}
            onConserva={(conserva) => setPreguntaExif((p) => (p ? { ...p, conserva } : p))}
            precisio={preguntaExif.precisio} onPrecisio={(precisio) => setPreguntaExif((p) => (p ? { ...p, precisio } : p))} />
        </Dialeg>
      ) : null}
    </>
  );
}

export default DocumentEditor;
