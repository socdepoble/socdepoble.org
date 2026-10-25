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
 *   · Cap botó d'adjuntar ni de micròfon: són F1 i la interfície no promet el
 *     que no fa.
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
 *   · Emoticones (pla 261022_1425, paritat WhatsApp): la carona a l'esquerra
 *     del camp obri el calaix gran (SelectorEmoticones) damunt del camp.
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
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Building2, Keyboard, Megaphone, Send, Smile, UserRound, Users } from 'lucide-react';
import { useAppGrid } from '../../../components/layout/AppGridShell.jsx';
import { CONSULTA_TACTIL } from '../../../hooks/useBarresAmbScroll.js';
import { inserixAlCursor } from '../emoticonesXat.js';
import SelectorEmoticones from './SelectorEmoticones.jsx';

export const LIMIT_TEXT = 4096;
export const LLINDAR_COMPTADOR = 3900;
/* Pla 261014_1450 (front C) · Id estable de la línia de qui signa (n'hi ha un sol
   compositor a la pantalla, com el seu textarea, #xat-message-input). */
const ID_SIGNA = 'xat-message-signa';
const ID_COMPTADOR = 'xat-message-comptador';
const ID_EMOTICONES = 'xat-message-emoticones';

/* Si el camp té el focus (també dins de l'arrel d'ombra de l'encastament). */
const teElFocus = (node) => Boolean(node) && node.getRootNode?.().activeElement === node;
/* Una pantalla sense ratolí (mòbil, tauleta): el calaix hi fa de teclat. */
const esTactil = () => Boolean(globalThis.matchMedia?.(CONSULTA_TACTIL)?.matches);
/* El calaix mai no es fa més baix que les pestanyes i una fila d'emoticones. */
const ALCADA_MINIMA = 112;
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
  barra = null, onEscapa = null, campRef = null, entitatActiva = null
}) {
  if (esNomesLectura(fil)) {
    /* Gauntlet 261016 (Bloc 3.6.1) · Un fil de només lectura que no és uns
       Avisos (el xat de Javi Llinares per a qui no s'ha registrat, al xat de
       mostra) porta el seu avís ja traduït (`avisNomesLectura`): la mateixa
       línia i la mateixa classe, amb la icona de persona.
       Ordre del Mestre (261020, 23:30) · L'accés directe a la pàgina de
       registre des del peu del xat. Gauntlet 261022_0225 (XAT-4) · El fa la
       parella «Connectar-se» / «Registrar-se» del peu de la conversa
       (AccesAlXat, XatSection: pel router, cada una amb el seu mode i la
       tornada). L'enllaç cru «Registra't» d'ací obria «Entrar», recarregava
       la pàgina i repetia el nom del botó que crea el compte: ja no hi és. */
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
      onEscapa={onEscapa} campRef={campRef} idSigna={signa ? ID_SIGNA : null}
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

function Formulari({ valor, onCanvia, onEnvia, t, desactivat, onEscapa, campRef, idSigna = null }) {
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
     hi ha d'entrar (amb el teclat, o en tàctil per a amagar el de la pantalla). */
  const [calaix, setCalaix] = useState(null);
  const obert = Boolean(calaix) && !desactivat;
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
  /* El cursor que toca posar quan el valor amb l'emoticona torne del pare. */
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
    node.setSelectionRange(cursor.posicio, cursor.posicio);
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
    setCalaix(null);
    if (enfoca) tornaAlCamp();
  }, [tornaAlCamp]);

  /* Clicar fora del compositor tanca el calaix i no mou el focus (MenuLlista:
     a l'arrel del node, també dins de l'arrel d'ombra de l'encastament). Dins
     d'una arrel d'ombra, el web amfitrió no hi arriba: el document també
     escolta, i tot el que hi arriba des de dins del giny porta de destí
     l'amfitrió (arrel.host), que ja ha mirat l'escolta de l'arrel. */
  useEffect(() => {
    if (!obert) return undefined;
    const node = formulari.current;
    const doc = node?.ownerDocument || document;
    const arrel = node?.getRootNode?.() || doc;
    const fora = (e) => { if (node && !node.contains(e.target)) setCalaix(null); };
    const foraDelGiny = (e) => { if (e.target !== arrel.host) setCalaix(null); };
    arrel.addEventListener('pointerdown', fora);
    if (arrel !== doc) doc.addEventListener('pointerdown', foraDelGiny);
    return () => {
      arrel.removeEventListener('pointerdown', fora);
      if (arrel !== doc) doc.removeEventListener('pointerdown', foraDelGiny);
    };
  }, [obert]);

  /* El calaix no passa de l'espai entre el seu peu (la vora de dalt del
     compositor) i el cap de la llista de missatges: amb poc espai (mòbil
     apaïsat, el peu d'accés davall), el CSS sol el faria pujar damunt de la
     capçalera. Es mesura en obrir i quan canvia la conversa o el compositor;
     sense llista (l'espècimen de Disseny) o sense layout, mana el CSS. */
  useLayoutEffect(() => {
    if (!obert) return undefined;
    const node = formulari.current;
    const calaixNode = node?.querySelector(`#${ID_EMOTICONES}`);
    const conversa = node?.closest('.sdp-xat-conversa');
    const llista = conversa?.querySelector('.sdp-xat-missatges');
    if (!calaixNode || !llista) return undefined;
    const ajusta = () => {
      calaixNode.style.removeProperty('max-block-size');
      const caixa = calaixNode.getBoundingClientRect();
      const espai = Math.floor(caixa.bottom - llista.getBoundingClientRect().top);
      if (!caixa.height || !(espai < caixa.height)) return;
      calaixNode.style.maxBlockSize = `${Math.max(espai, ALCADA_MINIMA)}px`;
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
  }, [obert]);

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
    pendent.current = { valor: resultat.valor, posicio: resultat.cursor, enfoca };
    canvia(resultat.valor);
    if (!enfoca) {
      /* Un espai dur alterna: dues iguals seguides també s'anuncien. */
      const avis = tradueix('section.xat.emoticones.afegida', 'Afegida: {nom}').replace('{nom}', nom || glif);
      setAfegida((abans) => (abans === avis ? `${avis}\u00A0` : avis));
    }
    return true;
  }, []);
  const tancaAmbEscape = useCallback(() => tanca(true), [tanca]);
  /* Tàctil: tocar el camp per a escriure tanca el calaix (hi torna el teclat). */
  const tancaEnEntrar = tactil && obert ? () => setCalaix(null) : undefined;

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
    setCalaix({ enfoca: tactil || perTeclat });
    if (!tactil && !perTeclat) tornaAlCamp();
  };

  /* Gauntlet 261025_0545 (XU-01) · Enviar no treu el focus del camp: el
     ratolí i el dit no el donen al botó (onMouseDown) i el teclat del mòbil
     no es tanca a cada missatge. Amb el teclat (Tab fins al botó i Retorn),
     el focus torna al camp: el botó es desactiva en buidar-se el camp i el
     focus cauria a <body>. Si era en un altre lloc (el calaix), no es toca. */
  const botoEnvia = useRef(null);
  const envia = () => {
    if (buit || desactivat) return;
    const boto = botoEnvia.current;
    const desDelBoto = Boolean(boto) && boto.getRootNode?.().activeElement === boto;
    setCalaix(null);
    onEnvia();
    if (desDelBoto) camp.current?.focus({ preventScroll: true });
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
    if (e.key === 'Escape' && obert) {
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
     (el camp i el calaix ja l'han consumit abans: defaultPrevented). */
  const alTeclatDelFormulari = (e) => {
    if (e.key !== 'Escape' || !obert || e.defaultPrevented || delIME(e)) return;
    e.preventDefault();
    tanca(true);
  };

  /* --comptador: amb la barra de resposta damunt, el compositor reserva
     l'alçada del comptador perquè no es pinte damunt de la cita (revisió
     adversarial 260930, #13; modules.css). Sense barra no canvia res.
     --emojis: amb el calaix obert, el compositor puja damunt del botó «Baixa
     al final», que si no tapava (i es menjava) les emoticones de la vora. */
  const classes = ['sdp-xat-compositor', mostraComptador && 'sdp-xat-compositor--comptador', obert && 'sdp-xat-compositor--emojis'];
  return (
    <form
      ref={formulari}
      className={classes.filter(Boolean).join(' ')}
      onSubmit={(e) => { e.preventDefault(); envia(); }}
      onKeyDown={alTeclatDelFormulari}
    >
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
      <div className="sdp-xat-compositor__camp" data-valor={valor}>
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
        {mostraComptador ? (
          <span
            id={ID_COMPTADOR}
            className={llargada >= LIMIT_TEXT ? 'sdp-xat-compositor__comptador sdp-xat-compositor__comptador--limit' : 'sdp-xat-compositor__comptador'}
          >
            {textComptador(llargada)}
          </span>
        ) : null}
      </div>
      <button
        ref={botoEnvia}
        type="submit"
        className="sdp-xat-compositor__envia"
        aria-label={t('section.xat.compositor.envia', 'Envia')}
        onMouseDown={(e) => e.preventDefault()}
        disabled={buit || desactivat}
      >
        <Send size={20} aria-hidden="true" focusable="false" />
      </button>
    </form>
  );
}
