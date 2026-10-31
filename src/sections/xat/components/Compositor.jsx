/**
 * Compositor.jsx — el camp d'escriure (XAT-B01, XAT-B03, UX-A08).
 *
 *   · <textarea> que creix fins a 6 línies. El creixement és CSS pur: el
 *     contenidor és una graella amb un ::after que replica el text
 *     (data-valor) i marca l'alçada; cap style en línia ni mesura de DOM.
 *   · A l'escriptori, Retorn envia i Maj+Retorn fa salt de línia; en mode
 *     estret Retorn fa salt i s'envia amb el botó, com a les apps de
 *     missatgeria. Gauntlet 261025_0545 (XU-03): «estret» vol dir estret i
 *     tàctil; amb ratolí i teclat, Retorn envia a qualsevol amplària.
 *   · Límit de 4.096 caràcters amb comptador visible a partir de 3.900.
 *   · Barra única (pla 261028_1526, P1-66): [+] [camp amb la carona dins]
 *     [botó redó]. `adjunts` (el dona ControlsAdjunt, que en guarda l'estat)
 *     porta el + i el que fa el botó redó; sense (convidats, llavor, IAIA,
 *     només lectura, bloquejats) no hi ha + i el botó redó només envia text,
 *     com sempre. La interfície no promet el que no fa:
 *       - El + (aria-haspopup=menu) obri cap amunt un menú amb el que ja
 *         funciona («Fotos i vídeos», «Càmera» en tàctil) i la quota al peu.
 *         El focus entra a la primera opció; Escape, clicar fora o triar el
 *         tanquen i el focus torna al +. Triar crida l'opció dins del mateix
 *         gest (iOS només obri el selector de fitxers així).
 *       - El botó redó és un sol node que canvia de nom (el focus no cau):
 *         Grava àudio amb el camp buit, Atura mentre grava, Envia el fitxer
 *         amb un de preparat (el text es queda al camp) i Envia amb text.
 *       - El menú i el calaix d'emoticones no s'obrin mai alhora.
 *   · Xat de pàgina (T63.2, T67): amb `fil`, si no s'hi pot escriure (els
 *     Avisos per a qui no n'és administrador) el compositor dona pas a l'avís
 *     que ho diu; si el fil té subjecte i s'hi pot escriure, un avís menut
 *     damunt recorda que és el xat públic d'una pàgina.
 *   · D7 (ordre del Mestre, 260930): els Avisos són estrictament
 *     unidireccionals. Un canal només mostra el formulari si `potEscriure`
 *     és exactament true; si el camp no arriba, és de només lectura
 *     (esNomesLectura). El servidor i localXat també ho rebutgen (SDP-XAT-011).
 *     En mode llavor qualsevol persona amb sessió és propietària de l'entitat
 *     pilot i, per tant, escriu als Avisos (identitatsSeed.js): la regla no
 *     es toca ací.
 *   · Respostes (torn 260930, T1): `barra` (la BarraResposta) es pinta just
 *     damunt del formulari, i Escape dins del camp crida `onEscapa` (cancel·la
 *     la resposta) i queda consumit (preventDefault). `campRef` dona el
 *     textarea a Conversa, que hi porta el focus en triar «Respon».
 *   · Qui signa (pla 261014_1450, front C): una línia damunt del formulari
 *     diu amb quina veu ix el que s'envia (quiSigna). La decidix el servidor
 *     per fil, no la barra negra; `entitatActiva` (useXat, per Conversa) només
 *     servix perquè, si la barra diu una entitat i el fil el signa la persona,
 *     també es diga.
 *   · Emoticones (pla 261022_1425, paritat WhatsApp): la carona, dins del
 *     camp a l'esquerra (P1-66), obri el calaix gran (SelectorEmoticones)
 *     damunt del camp.
 *     L'emoticona entra on era el cursor (o en lloc del tros seleccionat) i
 *     el cursor queda just darrere. Es recorda l'última selecció del camp
 *     (select, blur, escriure): en mòbil, tocar el calaix el desenfoca.
 *       - Ample: el focus torna (o es queda) al camp per a continuar
 *         escrivint, i el calaix seguix obert per a posar-ne més, com a
 *         WhatsApp Web.
 *       - Tàctil (estret, o una tauleta: CONSULTA_TACTIL): com a WhatsApp al
 *         mòbil, el calaix fa de teclat. El focus no torna al camp (el
 *         teclat de la pantalla taparia el calaix): la carona es torna un
 *         teclat que el tanca i torna al camp, i tocar el camp també el tanca.
 *       - Amb el teclat dins del calaix, el focus s'hi queda (un segon Retorn
 *         no ha d'enviar el missatge) i un avís en viu diu què s'ha afegit.
 *     Es tanca amb Escape des de qualsevol lloc del compositor (abans que la
 *     resposta: el primer Escape és del calaix), en clicar fora (també fora
 *     de l'encastament, al web amfitrió) i en enviar. L'alçada del calaix no
 *     passa mai de l'espai que hi ha entre el compositor i la llista de
 *     missatges: la capçalera de la conversa no es tapa.
 *   · Negreta (IDEA-53, pla 261029_1605, Bloc B; comportament literal del
 *     pla): el botó [N], dins del camp a la dreta (la carona és a l'esquerra),
 *     i Cmd+B o Ctrl+B al camp, com diu el seu títol. Amb text seleccionat
 *     l'embolica amb `*…*` (o el desembolica si ja era negreta) i la selecció
 *     i el focus es queden al camp, sobre el mateix text; sense selecció,
 *     insereix `**` amb el cursor al mig (negreta.js, commutaNegreta). Cap
 *     embolcall automàtic de paraula ni barra flotant.
 *       - El botó no pren el focus al camp (onMouseDown, XU-01): el teclat
 *         del mòbil no es tanca. Si el focus era fora (Tab fins al botó),
 *         s'aplica a l'última selecció recordada i el focus torna al camp.
 *       - Mentre un IME compon, la drecera no fa res (va darrere de delIME).
 *         Mantindre la tecla premuda (e.repeat) es consumix però no commuta
 *         una volta i una altra.
 *       - El canvi el fa el codi, com les emoticones: es perd l'historial
 *         de desfer natiu del camp.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Building2, Keyboard, Megaphone, Plus, Send, Smile, UserRound, Users } from 'lucide-react';
import { useAppGrid } from '../../../components/layout/AppGridShell.jsx';
import { CONSULTA_TACTIL } from '../../../hooks/useBarresAmbScroll.js';
import { inserixAlCursor } from '../emoticonesXat.js';
import { commutaNegreta, esDreceraDeNegreta } from '../negreta.js';
import SelectorEmoticones from './SelectorEmoticones.jsx';

export const LIMIT_TEXT = 4096;
export const LLINDAR_COMPTADOR = 3900;
/* Pla 261014_1450 (front C) · Id estable de la línia de qui signa (n'hi ha un sol
   compositor a la pantalla, com el seu textarea, #xat-message-input). */
const ID_SIGNA = 'xat-message-signa';
const ID_COMPTADOR = 'xat-message-comptador';
const ID_EMOTICONES = 'xat-message-emoticones';
/* P1-66 · El menú del + i el seu peu (la quota): ControlsAdjunt el reconeix
   per l'id quan decidix si el focus era als adjunts. */
export const ID_MENU_ADJUNTS = 'xat-message-adjunts';
const ID_PEU_ADJUNTS = 'xat-message-adjunts-peu';

/* Si el camp té el focus (també dins de l'arrel d'ombra de l'encastament). */
const teElFocus = (node) => Boolean(node) && node.getRootNode?.().activeElement === node;
/* Una pantalla sense ratolí (mòbil, tauleta): el calaix hi fa de teclat. */
const esTactil = () => Boolean(globalThis.matchMedia?.(CONSULTA_TACTIL)?.matches);
/* El calaix mai no es fa més baix que les pestanyes i una fila d'emoticones. */
const ALCADA_MINIMA = 112;
/* P1-66 · El menú del +, mai més baix que una opció (48px) i el seu coixí. */
const ALCADA_MINIMA_MENU = 64;
/* P1-66 · El botó redó és un node que canvia d'acció davall del dit. Ací, el
   que pot trobar el segon toc d'un doble toc per culpa del primer: enviar el
   text, o el fitxer, el fan «Grava àudio» (un fitxer enviat amb text al camp,
   «Envia»); Grava àudio, amb el permís ja donat, el fa «Atura», i Atura el fa
   «Envia el fitxer». Un toc així que arriba abans de MARGE_DOBLE_TOC (o el
   segon d'un doble clic) no la fa. */
const ACCIONS_SEGUENTS = Object.freeze({ text: ['grava'], envia: ['grava', 'text'], grava: ['atura'], atura: ['envia'] });
const MARGE_DOBLE_TOC = 600;
/* Gauntlet 261025_0545 (XU-16) · El comptador es veu a cada tecla, però el
   lector de pantalla només l'escolta en passar estos llindars. */
const LLINDARS_AVIS_COMPTADOR = [LLINDAR_COMPTADOR, 4000, LIMIT_TEXT];

/** Cert si al fil no s'hi pot escriure: potEscriure false o un canal sense permís explícit (D7). */
export function esNomesLectura(fil) {
  if (!fil) return false;
  return fil.potEscriure === false || (fil.tipus === 'canal' && fil.potEscriure !== true);
}

/**
 * Pla 261014_1450 (front C) · Qui signa el que s'envia en este fil, o null si
 * no cal dir-ho. No ho decidix la barra negra sinó el servidor, per fil:
 *   · on parles en nom d'una entitat (xat_participants.com_org_id →
 *     fil.comEntitat, amb fil.entitatNom) signa ella;
 *   · als Avisos (tipus 'canal'), qui hi pot escriure la gestiona i hi signa
 *     com ella (migració 2609282100; localXat.js, enviaMissatge), encara que
 *     la llavor no hi pose comEntitat;
 *   · a la resta signa la persona (xat_envia, migració 2610081543). Si la
 *     barra diu una entitat, es diu que ací no parles en nom seu.
 * Torna { tipus: 'entitat', nom } | { tipus: 'persona', entitat } | null.
 */
export function quiSigna(fil, entitatActiva = null) {
  if (!fil) return null;
  const nomEntitat = fil.entitatNom || null;
  /* El servidor diu que signa l'entitat però no en dona el nom: no es pot dir
     qui signa, i dir «com a tu» seria mentir. */
  if (fil.comEntitat === true) return nomEntitat ? { tipus: 'entitat', nom: nomEntitat } : null;
  /* Uns Avisos sense entitat no els pot signar cap entitat: signa la persona. */
  if (fil.tipus === 'canal' && fil.potEscriure === true && nomEntitat) return { tipus: 'entitat', nom: nomEntitat };
  if (entitatActiva?.nom) return { tipus: 'persona', entitat: entitatActiva.nom };
  return null;
}

export default function Compositor({
  valor, onCanvia, onEnvia, t, desactivat = false, fil = null,
  barra = null, onEscapa = null, campRef = null, entitatActiva = null, adjunts = null
}) {
  if (esNomesLectura(fil)) {
    /* Gauntlet 261016 (Bloc 3.6.1) · Un fil de només lectura que no és uns
       Avisos (el xat de Javi Llinares per a qui no s'ha registrat, al xat de
       mostra) porta el seu avís ja traduït (`avisNomesLectura`): la mateixa
       línia i la mateixa classe, amb la icona de persona.
       Ordre del Mestre (261020, 23:30) · L'accés directe a la pàgina de
       registre des del peu del xat. Gauntlet 261022_0225 (XAT-4) · El fa la
       parella «Connectar-se» / «Registrar-se» (AccesAlXat, XatSection: pel
       router, cada una amb el seu mode i la tornada). L'enllaç cru «Registra't»
       d'ací obria «Entrar», recarregava la pàgina i repetia el nom del botó
       que crea el compte: ja no hi és.
       Pla 261027_0845 (Guarda Nocturna), P1-54 · La parella viu només a
       l'aterratge genèric del Xat: un fil de mostra o de només lectura ja no
       en porta, i este avís no hi afig cap botó. */
    const avisPropi = typeof fil.avisNomesLectura === 'string' && fil.avisNomesLectura ? fil.avisNomesLectura : null;
    return (
      <div className="sdp-xat-compositor-barra-avis">
        <p className="sdp-xat-compositor sdp-xat-compositor--avis" role="status">
          {avisPropi
            ? <UserRound size={20} aria-hidden="true" focusable="false" />
            : <Megaphone size={20} aria-hidden="true" focusable="false" />}
          <span>{avisPropi || t('section.xat.canal.nomesAdmins', 'En Avisos només escriuen els administradors.')}</span>
        </p>
      </div>
    );
  }
  const titolPublic = fil?.subjecte ? (fil.subjecte.titol || fil.name || fil.title || '') : '';
  /* Pla 261014_1450 (front C) · Qui signa, amb la classe de l'avís públic.
     La línia descriu el camp: el textarea la cita
     a aria-describedby, i el lector de pantalla diu amb quina veu escrius en
     entrar-hi. Sense línia, el camp no cita cap id. */
  const signa = quiSigna(fil, entitatActiva);
  const camp = (
    <Formulari
      valor={valor} onCanvia={onCanvia} onEnvia={onEnvia} t={t} desactivat={desactivat}
      onEscapa={onEscapa} campRef={campRef} idSigna={signa ? ID_SIGNA : null} adjunts={adjunts}
    />
  );
  const avisSigna = signa ? (
    <p className="sdp-xat-avis-public" id={ID_SIGNA}>
      {signa.tipus === 'entitat'
        ? <Building2 size={16} aria-hidden="true" focusable="false" />
        : <UserRound size={16} aria-hidden="true" focusable="false" />}
      {/* Gauntlet 261025_0545 (TE-03) · Els noms van amb una funció de
          reemplaç: un «$&» o un «$'» del nom es pinta tal qual (moderacio.js, omple). */}
      <span>
        {signa.tipus === 'entitat'
          ? t('section.xat.signa.entitat', 'Escrius com a {nom}.').replace('{nom}', () => signa.nom)
          : t('section.xat.signa.persona', 'Escrius com a tu: en esta conversa no parles en nom de {entitat}.').replace('{entitat}', () => signa.entitat)}
      </span>
    </p>
  ) : null;
  /* Sempre el mateix arbre (la barra i l'avís de qui signa poden ser null):
     si canviara de forma en obrir o tancar la resposta, React tornaria a
     muntar el textarea i el focus es perdria en enviar o en cancel·lar.
     L'avís de qui signa va sempre primer, i el camp no canvia de lloc quan
     la línia apareix o desapareix dins del mateix àmbit: el nom de l'entitat
     que arriba tard (el de la barra o el del fil) o el fil que refresca
     comEntitat. Canviar d'actor a la barra negra no passa per ací: canvia
     ambitEstable (XatContext.jsx) i XatSection torna a muntar l'espai sencer
     per key. */
  const formulari = <>{avisSigna}{barra}{camp}</>;
  if (!fil?.subjecte) return formulari;
  return (
    <>
      <p className="sdp-xat-avis-public">
        <Users size={16} aria-hidden="true" focusable="false" />
        <span>{t('section.xat.pagina.avisPublic', 'Escrius al xat públic de «{titol}».').replace('{titol}', () => titolPublic)}</span>
      </p>
      {formulari}
    </>
  );
}

function Formulari({ valor, onCanvia, onEnvia, t, desactivat, onEscapa, campRef, idSigna = null, adjunts = null }) {
  const { mida } = useAppGrid();
  const estret = mida === 'estret';
  /* Pla 261022_1425 · Mòbil o tauleta: el calaix fa de teclat (la mida només
     decidix l'alçada del calaix i el Retorn). */
  const pantallaTactil = esTactil();
  const tactil = estret || pantallaTactil;
  /* Gauntlet 261025_0545 (XU-03) · Retorn envia llevat d'una pantalla
     estreta i tàctil (el mòbil, on fa salt i s'envia amb el botó). Una
     columna de WordPress o mitja finestra amb ratolí i teclat ja no es queda
     sense manera d'enviar amb el teclat; en ample, com sempre. */
  const retornEnvia = !estret || !pantallaTactil;
  const buit = !String(valor ?? '').trim();
  const llargada = String(valor ?? '').length;
  const mostraComptador = llargada >= LLINDAR_COMPTADOR;
  /* Gauntlet 261025_0545 (XU-16) · L'avís del comptador per al lector: el
     text del llindar que s'acaba de passar (cap amunt o cap avall), fix fins
     al llindar següent; buit per davall del primer. */
  const nivellComptador = LLINDARS_AVIS_COMPTADOR.filter((llindar) => llargada >= llindar).length;
  const textComptador = (n) => t('section.xat.compositor.comptador', '{n} de {max} caràcters')
    .replace('{n}', String(n))
    .replace('{max}', String(LIMIT_TEXT));
  const [avisComptador, setAvisComptador] = useState({ nivell: 0, text: '' });
  if (avisComptador.nivell !== nivellComptador) {
    setAvisComptador({ nivell: nivellComptador, text: nivellComptador ? textComptador(llargada) : '' });
  }
  /* Pla 261014_1450 (front C) · Qui signa i el comptador, cadascun només si es
     pinta: cap id penjat a un element que no existix. */
  const descritPer = [idSigna, mostraComptador ? ID_COMPTADOR : null].filter(Boolean).join(' ') || undefined;

  /* Pla 261022_1425 · El calaix d'emoticones: null tancat; obert, si el focus
     hi ha d'entrar (amb el teclat, o en tàctil per a amagar el de la pantalla).
     P1-66 · Una sola superposició: { tipus: 'emojis', enfoca } o
     { tipus: 'adjunts' } (el menú del +); obrir-ne una tanca l'altra. */
  const [superposicio, setSuperposicio] = useState(null);
  const calaix = superposicio?.tipus === 'emojis' ? superposicio : null;
  const obert = Boolean(calaix) && !desactivat;
  /* El menú es tanca tot sol quan els adjunts es bloquegen (preparant,
     gravant, enviant) o se'n van. */
  const menuObert = superposicio?.tipus === 'adjunts' && Boolean(adjunts) && !adjunts.bloquejat && !desactivat;
  if (superposicio?.tipus === 'adjunts' && !menuObert) setSuperposicio(null);
  /* L'avís en viu de l'emoticona afegida quan el focus no és al camp. */
  const [afegida, setAfegida] = useState('');
  useEffect(() => { if (!obert) setAfegida(''); }, [obert]);
  const formulari = useRef(null);
  const camp = useRef(null);
  /* L'última selecció coneguda del camp ({ inici, fi }), o null: al final. */
  const seleccio = useRef(null);
  /* L'últim valor que ha eixit d'ací (escriure o una emoticona): un altre
     (enviar, l'esborrany d'un altre fil) fa oblidar la selecció. */
  const valorPropi = useRef(valor);
  /* La selecció ({ inici, fi }) que toca posar quan el valor amb l'emoticona
     o amb la negreta torne del pare. */
  const pendent = useRef(null);

  const posaCamp = useCallback((node) => {
    camp.current = node;
    if (typeof campRef === 'function') campRef(node);
    else if (campRef) campRef.current = node;
  }, [campRef]);

  useLayoutEffect(() => {
    const cursor = pendent.current;
    pendent.current = null;
    if (valor !== valorPropi.current) {
      seleccio.current = null;
      return;
    }
    if (!cursor || cursor.valor !== valor || !cursor.enfoca) return;
    const node = camp.current;
    if (!node) return;
    node.focus({ preventScroll: true });
    node.setSelectionRange(cursor.inici, cursor.fi);
  }, [valor]);

  /* Tornar al camp des de fora (el calaix, la carona, un altre lloc): el
     cursor torna on era (darrere de l'última emoticona: React l'havia portat
     al final en canviar el valor) o, si no se sap, al final, com a WhatsApp
     (un camp que no ha tingut mai el focus el posaria al principi). Si ja hi
     era, no es toca: dins de l'arrel d'ombra el `select` de React no arriba
     i la selecció recordada podria ser vella. */
  const tornaAlCamp = useCallback(() => {
    const node = camp.current;
    if (!node || teElFocus(node)) {
      node?.focus();
      return;
    }
    node.focus();
    const lloc = seleccio.current;
    const fi = node.value.length;
    if (lloc && lloc.fi <= fi) node.setSelectionRange(lloc.inici, lloc.fi);
    else node.setSelectionRange(fi, fi);
  }, []);

  const tanca = useCallback((enfoca) => {
    setSuperposicio(null);
    if (enfoca) tornaAlCamp();
  }, [tornaAlCamp]);

  /* Clicar fora del compositor tanca el calaix i no mou el focus (el patró de
     MenuLlista, retirat el 261026, que hui porten FiltreConverses i CapcaleraConversa:
     a l'arrel del node, també dins de l'arrel d'ombra de l'encastament). Dins
     d'una arrel d'ombra, el web amfitrió no hi arriba: el document també
     escolta, i tot el que hi arriba des de dins del giny porta de destí
     l'amfitrió (arrel.host), que ja ha mirat l'escolta de l'arrel. */
  useEffect(() => {
    if (!obert) return undefined;
    const node = formulari.current;
    const doc = node?.ownerDocument || document;
    const arrel = node?.getRootNode?.() || doc;
    const fora = (e) => { if (node && !node.contains(e.target)) setSuperposicio(null); };
    const foraDelGiny = (e) => { if (e.target !== arrel.host) setSuperposicio(null); };
    arrel.addEventListener('pointerdown', fora);
    if (arrel !== doc) doc.addEventListener('pointerdown', foraDelGiny);
    return () => {
      arrel.removeEventListener('pointerdown', fora);
      if (arrel !== doc) doc.removeEventListener('pointerdown', foraDelGiny);
    };
  }, [obert]);

  /* P1-66 · El menú del +, amb el patró del «⋯» de la bombolla: en obrir, el
     focus entra a la primera opció; clicar fora del menú i del + el tanca
     sense moure el focus (també dins de l'arrel d'ombra i al web amfitrió,
     com el calaix). */
  const menuAdjunts = useRef(null);
  const botoAdjunta = useRef(null);
  const refBotoAdjunts = adjunts?.refBoto ?? null;
  const posaAdjunta = useCallback((node) => {
    botoAdjunta.current = node;
    if (refBotoAdjunts) refBotoAdjunts.current = node;
  }, [refBotoAdjunts]);
  useEffect(() => {
    if (!menuObert) return undefined;
    const menu = menuAdjunts.current;
    menu?.querySelector('[role="menuitem"]')?.focus();
    const doc = menu?.ownerDocument || document;
    const arrel = menu?.getRootNode?.() || doc;
    const fora = (e) => {
      if (menu?.contains(e.target) || botoAdjunta.current?.contains(e.target)) return;
      /* El focus era a una opció: abans que el menú se'n vaja, passa al + (un
         destí que no pren el focus, com el botó redó, el deixaria a <body>). */
      if (menu?.contains(arrel.activeElement ?? doc.activeElement)) botoAdjunta.current?.focus({ preventScroll: true });
      setSuperposicio(null);
    };
    const foraDelGiny = (e) => { if (e.target !== arrel.host) setSuperposicio(null); };
    arrel.addEventListener('pointerdown', fora);
    if (arrel !== doc) doc.addEventListener('pointerdown', foraDelGiny);
    return () => {
      arrel.removeEventListener('pointerdown', fora);
      if (arrel !== doc) doc.removeEventListener('pointerdown', foraDelGiny);
    };
  }, [menuObert]);
  const tancaMenu = () => {
    setSuperposicio(null);
    botoAdjunta.current?.focus();
  };
  const commutaMenu = () => {
    if (!adjunts || adjunts.bloquejat || desactivat) return;
    /* Tancar-lo amb el mateix + torna el focus al +: Safari no enfoca un
       botó en clicar-lo, i el focus que era a una opció quedaria a <body>. */
    if (menuObert) {
      tancaMenu();
      return;
    }
    setSuperposicio({ tipus: 'adjunts' });
  };
  /* Triar tanca, torna el focus al + i crida l'opció ací mateix: res
     d'asíncron entre el toc i input.click(). */
  const triaOpcio = (opcio) => {
    tancaMenu();
    opcio.onTria();
  };
  /* Les fletxes, Inici i Fi es mouen per les opcions; Escape tanca (consumit:
     la resposta espera el segon) i Tab tanca i seguix des del +. */
  const alTeclatDelMenu = (e) => {
    const opcions = [...e.currentTarget.querySelectorAll('[role="menuitem"]')];
    const ara = opcions.indexOf(e.target);
    let seguent = null;
    if (e.key === 'ArrowDown') seguent = opcions[(ara + 1) % opcions.length];
    else if (e.key === 'ArrowUp') seguent = opcions[(ara - 1 + opcions.length) % opcions.length];
    else if (e.key === 'Home') seguent = opcions[0];
    else if (e.key === 'End') seguent = opcions.at(-1);
    else if (e.key === 'Escape') {
      e.preventDefault();
      tancaMenu();
      return;
    } else if (e.key === 'Tab') {
      tancaMenu();
      return;
    }
    if (!seguent) return;
    e.preventDefault();
    seguent.focus();
  };

  /* El calaix no passa de l'espai entre el seu peu (la vora de dalt del
     compositor) i el cap de la llista de missatges: amb poc espai (mòbil
     apaïsat, el peu d'accés davall), el CSS sol el faria pujar damunt de la
     capçalera. Es mesura en obrir i quan canvia la conversa o el compositor;
     sense llista (l'espècimen de Disseny) o sense layout, mana el CSS.
     P1-66 · El menú del + fa igual, fins a la vora de dalt de la conversa: és
     curt i passatger, pot tapar la capçalera però no s'ha de retallar (mòbil
     apaïsat); sense llista, també mana el CSS (a l'espècimen, la conversa
     comença al compositor i el sostre el deixaria en 64px). Mana l'alçada de
     maquetació (offsetHeight): l'entrada l'escala a 0,96 i el rectangle del
     primer frame és més baix. */
  useLayoutEffect(() => {
    if (!obert && !menuObert) return undefined;
    const node = formulari.current;
    const conversa = node?.closest('.sdp-xat-conversa');
    const flotant = obert ? node?.querySelector(`#${ID_EMOTICONES}`) : menuAdjunts.current;
    const llista = conversa?.querySelector('.sdp-xat-missatges');
    const sostre = llista && (obert ? llista : conversa);
    const minim = obert ? ALCADA_MINIMA : ALCADA_MINIMA_MENU;
    if (!flotant || !sostre) return undefined;
    const ajusta = () => {
      flotant.style.removeProperty('max-block-size');
      const caixa = flotant.getBoundingClientRect();
      const alcada = flotant.offsetHeight || caixa.height;
      const espai = Math.floor(caixa.bottom - sostre.getBoundingClientRect().top);
      if (!alcada || !(espai < alcada)) return;
      flotant.style.maxBlockSize = `${Math.max(espai, minim)}px`;
    };
    ajusta();
    const vista = node.ownerDocument.defaultView;
    const observa = typeof vista?.ResizeObserver === 'function' ? new vista.ResizeObserver(ajusta) : null;
    observa?.observe(conversa);
    observa?.observe(node);
    vista?.addEventListener('resize', ajusta);
    return () => {
      observa?.disconnect();
      vista?.removeEventListener('resize', ajusta);
    };
  }, [obert, menuObert]);

  const recordaSeleccio = (e) => {
    seleccio.current = { inici: e.currentTarget.selectionStart, fi: e.currentTarget.selectionEnd };
  };

  /* Estable: escriure amb el calaix obert no torna a pintar les seues llistes
     (Persones en porta 2.430). Llig el valor de l'últim pintat. Torna false
     si l'emoticona no hi cap (el calaix no la posa a les recents). */
  const actual = useRef({ valor, tactil, onCanvia, t });
  useLayoutEffect(() => { actual.current = { valor, tactil, onCanvia, t }; });
  const inserix = useCallback((glif, nom) => {
    const { valor: text, tactil: enTactil, onCanvia: canvia, t: tradueix } = actual.current;
    const node = camp.current;
    const actiu = node?.getRootNode?.().activeElement;
    const lloc = actiu === node ? { inici: node.selectionStart, fi: node.selectionEnd } : seleccio.current;
    const resultat = inserixAlCursor(text, glif, lloc?.inici, lloc?.fi, LIMIT_TEXT);
    if (!resultat) return false;
    /* Amb el teclat dins del calaix (o en tàctil) el focus no se'n va. */
    const dinsDelCalaix = Boolean(actiu?.closest?.(`#${ID_EMOTICONES}`));
    const enfoca = !enTactil && !dinsDelCalaix;
    seleccio.current = { inici: resultat.cursor, fi: resultat.cursor };
    valorPropi.current = resultat.valor;
    pendent.current = { valor: resultat.valor, inici: resultat.cursor, fi: resultat.cursor, enfoca };
    canvia(resultat.valor);
    if (!enfoca) {
      /* Un espai dur alterna: dues iguals seguides també s'anuncien. */
      const avis = tradueix('section.xat.emoticones.afegida', 'Afegida: {nom}').replace('{nom}', nom || glif);
      setAfegida((abans) => (abans === avis ? `${avis}\u00A0` : avis));
    }
    return true;
  }, []);
  const tancaAmbEscape = useCallback(() => tanca(true), [tanca]);
  /* IDEA-53 · [N] i Cmd/Ctrl+B: la selecció viva del camp (o la recordada,
     si el focus és fora) passa per commutaNegreta. El text nou torna del
     pare i l'efecte de dalt hi posa la selecció i el focus. Si no hi cap
     (LIMIT_TEXT), no canvia res. */
  const aplicaNegreta = useCallback(() => {
    const { valor: text, onCanvia: canvia } = actual.current;
    const node = camp.current;
    if (!node || node.disabled) return;
    const lloc = teElFocus(node) ? { inici: node.selectionStart, fi: node.selectionEnd } : seleccio.current;
    const resultat = commutaNegreta(text, lloc?.inici, lloc?.fi, LIMIT_TEXT);
    if (!resultat) return;
    seleccio.current = { inici: resultat.inici, fi: resultat.fi };
    if (resultat.valor === text) {
      node.focus({ preventScroll: true });
      node.setSelectionRange(resultat.inici, resultat.fi);
      return;
    }
    valorPropi.current = resultat.valor;
    pendent.current = { valor: resultat.valor, inici: resultat.inici, fi: resultat.fi, enfoca: true };
    canvia(resultat.valor);
  }, []);
  /* Tàctil: tocar el camp per a escriure tanca el calaix (hi torna el teclat).
     Tornar al camp amb el menú del + obert també el tanca (només el menú: la
     carona hi porta el focus en obrir el calaix). */
  const tancaEnEntrar = (tactil && obert) || menuObert
    ? () => setSuperposicio((ara) => (ara?.tipus === 'adjunts' || (tactil && ara?.tipus === 'emojis') ? null : ara))
    : undefined;

  /* La carona obri i tanca. Amb el ratolí (detail ≥ 1), en ample el focus va
     (o es queda) al camp, com a WhatsApp Web; amb el teclat, o en tàctil,
     entra al calaix. Tancar-lo amb ella torna al camp (en tàctil, és el
     teclat de la pantalla que torna). */
  const commuta = (e) => {
    if (obert) {
      tanca(true);
      return;
    }
    const perTeclat = e.detail === 0;
    setSuperposicio({ tipus: 'emojis', enfoca: tactil || perTeclat });
    if (!tactil && !perTeclat) tornaAlCamp();
  };

  /* Gauntlet 261025_0545 (XU-01) · Enviar no treu el focus del camp: el
     ratolí i el dit no el donen al botó (onMouseDown) i el teclat del mòbil
     no es tanca a cada missatge. Amb el teclat (Tab fins al botó i Retorn),
     el focus torna al camp: el botó es desactiva en buidar-se el camp i el
     focus cauria a <body>. Si era en un altre lloc (el calaix), no es toca. */
  const botoEnvia = useRef(null);
  const refPrimari = adjunts?.refPrimari ?? null;
  const posaPrimari = useCallback((node) => {
    botoEnvia.current = node;
    if (refPrimari) refPrimari.current = node;
  }, [refPrimari]);
  /* P1-66 · L'última acció que ha fet el botó redó ({ clau, temps }; 'text'
     és enviar el text, també amb Retorn). El segon toc d'un doble toc que hi
     troba la seua conseqüència (ACCIONS_SEGUENTS) no la fa: ni obri el
     micròfon ni envia una nota sense escoltar-la. Repetir la mateixa acció
     (reintentar l'enviament) sí. */
  const darreraAccio = useRef(null);
  const envia = () => {
    if (buit || desactivat) return;
    const boto = botoEnvia.current;
    const desDelBoto = Boolean(boto) && boto.getRootNode?.().activeElement === boto;
    setSuperposicio(null);
    onEnvia();
    darreraAccio.current = { clau: 'text', temps: Date.now() };
    if (desDelBoto) camp.current?.focus({ preventScroll: true });
  };
  /* P1-66 · El que fa el botó redó ara: l'acció dels adjunts (Grava àudio
     només amb el camp buit) o, si no n'hi ha, enviar el text. */
  const accio = adjunts?.primari && (!adjunts.primari.nomesBuit || buit) ? adjunts.primari : null;
  const IconaPrimari = accio?.icona ?? Send;
  const alClicarPrimari = (e) => {
    const clau = accio?.clau ?? 'text';
    const abans = darreraAccio.current;
    if (ACCIONS_SEGUENTS[abans?.clau]?.includes(clau) && (e.detail > 1 || Date.now() - abans.temps < MARGE_DOBLE_TOC)) {
      e.preventDefault(); // tampoc no envia el formulari
      return;
    }
    // Sense acció, el submit de sempre: envia() l'apunta.
    if (!accio || accio.ariaDisabled) return;
    darreraAccio.current = { clau, temps: Date.now() };
    accio.onClick();
  };

  /* Gauntlet 261025_0545 (XU-06) · Mentre un IME compon (xinés, japonés,
     coreà), Retorn i Escape són seus: ni s'envia ni es cancel·la res. Safari
     dispara compositionend abans del keydown que la confirma (isComposing
     false, keyCode 229): per això també el 229.
     Revisió 261025 · Cap marge de temps després de compositionend: Chrome
     amb l'IME coreà i Gboard hi envien un Retorn de veres (13), que és de
     qui escriu i envia. Eixir del camp desfà una composició que no ha dit
     mai compositionend, perquè Retorn i Escape no queden morts. */
  const compon = useRef(false);
  const delIME = (e) => compon.current || Boolean(e.nativeEvent?.isComposing) || e.keyCode === 229;

  const alTeclat = (e) => {
    if (delIME(e)) return;
    if (esDreceraDeNegreta(e)) {
      e.preventDefault();
      if (!e.repeat) aplicaNegreta();
      return;
    }
    if (e.key === 'Escape' && (obert || menuObert)) {
      e.preventDefault();
      tanca(true);
      return;
    }
    if (e.key === 'Escape' && typeof onEscapa === 'function') {
      e.preventDefault();
      onEscapa();
      return;
    }
    if (e.key !== 'Enter' || !retornEnvia || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    envia();
  };

  /* Escape des de la carona o des del botó d'enviar també tanca el calaix
     (el camp i el calaix ja l'han consumit abans: defaultPrevented). Amb el
     menú del + obert, el tanca i el focus torna al +. */
  const alTeclatDelFormulari = (e) => {
    if (e.key !== 'Escape' || !(obert || menuObert) || e.defaultPrevented || delIME(e)) return;
    e.preventDefault();
    if (menuObert) tancaMenu();
    else tanca(true);
  };

  /* --comptador: amb la barra de resposta damunt, el compositor reserva
     l'alçada del comptador perquè no es pinte damunt de la cita (revisió
     adversarial 260930, #13; modules.css). Sense barra no canvia res.
     --emojis: amb el calaix obert, el compositor puja damunt del botó «Baixa
     al final», que si no tapava (i es menjava) les emoticones de la vora.
     --adjunts: igual, amb el menú del + obert. */
  const classes = ['sdp-xat-compositor', mostraComptador && 'sdp-xat-compositor--comptador', obert && 'sdp-xat-compositor--emojis', menuObert && 'sdp-xat-compositor--adjunts'];
  /* El + porta aria-disabled (no disabled) mentre els adjunts estan ocupats:
     el focus que hi torna no cau a <body>. */
  const adjuntaInactiu = Boolean(adjunts?.bloquejat) || desactivat;
  return (
    <form
      ref={formulari}
      className={classes.filter(Boolean).join(' ')}
      onSubmit={(e) => { e.preventDefault(); envia(); }}
      onKeyDown={alTeclatDelFormulari}
    >
      {adjunts ? (
        <button
          ref={posaAdjunta}
          type="button"
          className="sdp-xat-compositor__adjunta"
          aria-label={adjunts.etiqueta}
          aria-haspopup="menu"
          aria-expanded={menuObert}
          aria-controls={menuObert ? ID_MENU_ADJUNTS : undefined}
          aria-disabled={adjuntaInactiu || undefined}
          onClick={commutaMenu}
        >
          <Plus size={24} aria-hidden="true" focusable="false" />
        </button>
      ) : null}
      {menuObert ? (
        <div className="sdp-xat-menu sdp-xat-menu--adjunts" ref={menuAdjunts}>
          <div id={ID_MENU_ADJUNTS} role="menu" aria-label={adjunts.etiquetaMenu} aria-describedby={adjunts.peuMenu.length ? ID_PEU_ADJUNTS : undefined} onKeyDown={alTeclatDelMenu}>
            {adjunts.opcions.map((opcio) => {
              const Icona = opcio.icona;
              return (
                <button key={opcio.id} type="button" role="menuitem" className="sdp-xat-menu__item" onClick={() => triaOpcio(opcio)}>
                  <Icona size={20} aria-hidden="true" focusable="false" />
                  {opcio.etiqueta}
                </button>
              );
            })}
          </div>
          {adjunts.peuMenu.length ? (
            <div className="sdp-xat-menu__peu" id={ID_PEU_ADJUNTS}>
              {adjunts.peuMenu.map((linia) => <p key={linia}>{linia}</p>)}
            </div>
          ) : null}
        </div>
      ) : null}
      {obert ? (
        <SelectorEmoticones
          id={ID_EMOTICONES}
          t={t}
          onTria={inserix}
          onTanca={tancaAmbEscape}
          enfocaEnObrir={calaix.enfoca}
          retenFocus={!tactil}
          estret={estret}
        />
      ) : null}
      {/* Només amb el calaix obert (la conversa ja té el seu status): naix
          buida en obrir i el text canvia després, i així s'anuncia. */}
      {obert ? <span className="sdp-nomes-lector" role="status" aria-live="polite">{afegida}</span> : null}
      {/* Gauntlet 261025_0545 (XU-16) · Sempre muntat i buit per davall de
          3.900: el text només canvia en passar un llindar, i així s'anuncia. */}
      <span className="sdp-nomes-lector" aria-live="polite">{avisComptador.text}</span>
      {/* P1-66 · La carona viu dins del camp, a l'esquerra (el modificador
          --carona: ConsultaIAIA usa el mateix camp sense carona). IDEA-53 ·
          [N], a la dreta (el modificador --negreta). */}
      <div className="sdp-xat-compositor__camp sdp-xat-compositor__camp--carona sdp-xat-compositor__camp--negreta" data-valor={valor}>
        <button
          type="button"
          className="sdp-xat-compositor__emojis"
          aria-label={t('section.xat.emoticones.etiqueta', 'Emoticones')}
          aria-haspopup="dialog"
          aria-expanded={obert}
          aria-controls={obert ? ID_EMOTICONES : undefined}
          onMouseDown={tactil ? undefined : (e) => e.preventDefault()}
          onClick={commuta}
          disabled={desactivat}
        >
          {obert && tactil
            ? <Keyboard size={22} aria-hidden="true" focusable="false" />
            : <Smile size={22} aria-hidden="true" focusable="false" />}
        </button>
        {/* Gauntlet 261025_0545 (XU-14) · dir="auto": un text en àrab o en
            hebreu s'escriu de dreta a esquerra. (XU-06) La composició de l'IME. */}
        <textarea
          ref={posaCamp}
          id="xat-message-input"
          name="message"
          className="sdp-xat-compositor__textarea"
          dir="auto"
          rows={1}
          value={valor}
          maxLength={LIMIT_TEXT}
          onChange={(e) => {
            recordaSeleccio(e);
            valorPropi.current = e.target.value;
            onCanvia(e.target.value);
          }}
          onSelect={recordaSeleccio}
          onBlur={(e) => { compon.current = false; recordaSeleccio(e); }}
          onFocus={tancaEnEntrar}
          onKeyDown={alTeclat}
          onCompositionStart={() => { compon.current = true; }}
          onCompositionEnd={() => { compon.current = false; }}
          placeholder={t('section.xat.composePlaceholder', 'Escriu un missatge...')}
          aria-label={t('section.xat.compositor.etiqueta', 'Escriu un missatge')}
          aria-describedby={descritPer}
          enterKeyHint={retornEnvia ? 'send' : 'enter'}
          disabled={desactivat}
        />
        {/* IDEA-53 · [N]: mai no pren el focus al camp (XU-01) i el teclat
            del mòbil no es tanca. La lletra és decorativa: el nom és «Negreta». */}
        <button
          type="button"
          className="sdp-xat-compositor__negreta"
          aria-label={t('section.xat.negreta.etiqueta', 'Negreta')}
          title={t('section.xat.negreta.titol', 'Negreta (⌘B / Ctrl+B)')}
          aria-keyshortcuts="Meta+B Control+B"
          onMouseDown={(e) => e.preventDefault()}
          onClick={aplicaNegreta}
          disabled={desactivat}
        >
          <span className="sdp-xat-compositor__negreta-lletra" aria-hidden="true">{t('section.xat.negreta.lletra', 'N')}</span>
        </button>
        {mostraComptador ? (
          <span
            id={ID_COMPTADOR}
            className={llargada >= LIMIT_TEXT ? 'sdp-xat-compositor__comptador sdp-xat-compositor__comptador--limit' : 'sdp-xat-compositor__comptador'}
          >
            {textComptador(llargada)}
          </span>
        ) : null}
      </div>
      {/* P1-66 · Un sol botó redó: amb una acció dels adjunts és type=button i
          en porta el nom (aria-disabled mentre puja, perquè el focus no caiga);
          sense, és el d'enviar text de sempre (submit, desactivat amb el camp
          buit). Mai no pren el focus al camp amb el ratolí o el dit (XU-01), i
          el segon toc d'un doble toc no fa l'acció nova (alClicarPrimari). */}
      <button
        ref={posaPrimari}
        type={accio ? 'button' : 'submit'}
        className="sdp-xat-compositor__envia"
        data-accio={accio?.clau}
        aria-label={accio ? accio.etiqueta : t('section.xat.compositor.envia', 'Envia')}
        aria-disabled={accio?.ariaDisabled || undefined}
        aria-busy={accio?.ocupat || undefined}
        aria-describedby={accio?.descritPer}
        onMouseDown={(e) => e.preventDefault()}
        onClick={alClicarPrimari}
        disabled={accio ? desactivat : buit || desactivat}
      >
        <IconaPrimari size={20} aria-hidden="true" focusable="false" />
      </button>
    </form>
  );
}
