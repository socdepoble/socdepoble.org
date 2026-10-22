/**
 * Compositor.jsx — el camp d'escriure (XAT-B01, XAT-B03, UX-A08).
 *
 *   · <textarea> que creix fins a 6 línies. El creixement és CSS pur: el
 *     contenidor és una graella amb un ::after que replica el text
 *     (data-valor) i marca l'alçada; cap style en línia ni mesura de DOM.
 *   · A l'escriptori, Retorn envia i Maj+Retorn fa salt de línia; en mode
 *     estret Retorn fa salt i s'envia amb el botó, com a les apps de
 *     missatgeria.
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
 *       - Estret: com a WhatsApp al mòbil, el calaix fa de teclat. El focus
 *         no torna al camp (el teclat de la pantalla taparia el calaix): la
 *         carona es torna un teclat que el tanca i torna al camp, i tocar
 *         el camp també el tanca.
 *     Es tanca amb Escape (abans que la resposta: el primer Escape és del
 *     calaix), en clicar fora del compositor i en enviar.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Building2, Keyboard, Megaphone, Send, Smile, UserRound, Users } from 'lucide-react';
import { useAppGrid } from '../../../components/layout/AppGridShell.jsx';
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
      <span>
        {signa.tipus === 'entitat'
          ? t('section.xat.signa.entitat', 'Escrius com a {nom}.').replace('{nom}', signa.nom)
          : t('section.xat.signa.persona', 'Escrius com a tu: en esta conversa no parles en nom de {entitat}.').replace('{entitat}', signa.entitat)}
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
        <span>{t('section.xat.pagina.avisPublic', 'Escrius al xat públic de «{titol}».').replace('{titol}', titolPublic)}</span>
      </p>
      {formulari}
    </>
  );
}

function Formulari({ valor, onCanvia, onEnvia, t, desactivat, onEscapa, campRef, idSigna = null }) {
  const { mida } = useAppGrid();
  const estret = mida === 'estret';
  const buit = !String(valor ?? '').trim();
  const llargada = String(valor ?? '').length;
  const mostraComptador = llargada >= LLINDAR_COMPTADOR;
  /* Pla 261014_1450 (front C) · Qui signa i el comptador, cadascun només si es
     pinta: cap id penjat a un element que no existix. */
  const descritPer = [idSigna, mostraComptador ? ID_COMPTADOR : null].filter(Boolean).join(' ') || undefined;

  /* Pla 261022_1425 · El calaix d'emoticones: null tancat; obert, si el focus
     hi ha d'entrar (amb el teclat, o en estret per a amagar el de la pantalla). */
  const [calaix, setCalaix] = useState(null);
  const obert = Boolean(calaix) && !desactivat;
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

  const tanca = useCallback((enfoca) => {
    setCalaix(null);
    if (enfoca) camp.current?.focus();
  }, []);

  /* Clicar fora del compositor tanca el calaix i no mou el focus (MenuLlista:
     a l'arrel del node, també dins de l'arrel d'ombra de l'encastament). */
  useEffect(() => {
    if (!obert) return undefined;
    const node = formulari.current;
    const arrel = node?.getRootNode?.() || document;
    const fora = (e) => { if (node && !node.contains(e.target)) setCalaix(null); };
    arrel.addEventListener('pointerdown', fora);
    return () => arrel.removeEventListener('pointerdown', fora);
  }, [obert]);

  const recordaSeleccio = (e) => {
    seleccio.current = { inici: e.currentTarget.selectionStart, fi: e.currentTarget.selectionEnd };
  };

  /* Estable: escriure amb el calaix obert no torna a pintar les seues llistes
     (Persones en porta 2.430). Llig el valor de l'últim pintat. */
  const actual = useRef({ valor, estret, onCanvia });
  useLayoutEffect(() => { actual.current = { valor, estret, onCanvia }; });
  const inserix = useCallback((glif) => {
    const { valor: text, estret: enEstret, onCanvia: canvia } = actual.current;
    const node = camp.current;
    const lloc = teElFocus(node) ? { inici: node.selectionStart, fi: node.selectionEnd } : seleccio.current;
    const resultat = inserixAlCursor(text, glif, lloc?.inici, lloc?.fi, LIMIT_TEXT);
    if (!resultat) return;
    seleccio.current = { inici: resultat.cursor, fi: resultat.cursor };
    valorPropi.current = resultat.valor;
    pendent.current = { valor: resultat.valor, posicio: resultat.cursor, enfoca: !enEstret };
    canvia(resultat.valor);
  }, []);
  const tancaAmbEscape = useCallback(() => tanca(true), [tanca]);
  /* Estret: tocar el camp per a escriure tanca el calaix (hi torna el teclat). */
  const tancaEnEntrar = estret && obert ? () => setCalaix(null) : undefined;

  /* La carona obri i tanca. Amb el ratolí (detail ≥ 1), en ample el focus es
     queda al camp; amb el teclat, o en estret, entra al calaix. Tancar-lo amb
     ella torna al camp (en estret, és el teclat de la pantalla que torna). */
  const commuta = (e) => {
    if (obert) tanca(true);
    else setCalaix({ enfoca: estret || e.detail === 0 });
  };

  const envia = () => {
    if (buit || desactivat) return;
    setCalaix(null);
    onEnvia();
  };

  const alTeclat = (e) => {
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
    if (e.key !== 'Enter' || estret || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.nativeEvent?.isComposing) return;
    e.preventDefault();
    envia();
  };

  /* --comptador: amb la barra de resposta damunt, el compositor reserva
     l'alçada del comptador perquè no es pinte damunt de la cita (revisió
     adversarial 260930, #13; modules.css). Sense barra no canvia res. */
  return (
    <form
      ref={formulari}
      className={`sdp-xat-compositor${mostraComptador ? ' sdp-xat-compositor--comptador' : ''}`}
      onSubmit={(e) => { e.preventDefault(); envia(); }}
    >
      <button
        type="button"
        className="sdp-xat-compositor__emojis"
        aria-label={t('section.xat.emoticones.etiqueta', 'Emoticones')}
        aria-haspopup="dialog"
        aria-expanded={obert}
        aria-controls={obert ? ID_EMOTICONES : undefined}
        onMouseDown={estret ? undefined : (e) => e.preventDefault()}
        onClick={commuta}
        disabled={desactivat}
      >
        {obert && estret
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
          retenFocus={!estret}
          estret={estret}
        />
      ) : null}
      <div className="sdp-xat-compositor__camp" data-valor={valor}>
        <textarea
          ref={posaCamp}
          id="xat-message-input"
          name="message"
          className="sdp-xat-compositor__textarea"
          rows={1}
          value={valor}
          maxLength={LIMIT_TEXT}
          onChange={(e) => {
            recordaSeleccio(e);
            valorPropi.current = e.target.value;
            onCanvia(e.target.value);
          }}
          onSelect={recordaSeleccio}
          onBlur={recordaSeleccio}
          onFocus={tancaEnEntrar}
          onKeyDown={alTeclat}
          placeholder={t('section.xat.composePlaceholder', 'Escriu un missatge...')}
          aria-label={t('section.xat.compositor.etiqueta', 'Escriu un missatge')}
          aria-describedby={descritPer}
          enterKeyHint={estret ? 'enter' : 'send'}
          disabled={desactivat}
        />
        {mostraComptador ? (
          <span
            id={ID_COMPTADOR}
            className={`sdp-xat-compositor__comptador${llargada >= LIMIT_TEXT ? ' sdp-xat-compositor__comptador--limit' : ''}`}
            aria-live="polite"
          >
            {t('section.xat.compositor.comptador', '{n} de {max} caràcters')
              .replace('{n}', String(llargada))
              .replace('{max}', String(LIMIT_TEXT))}
          </span>
        ) : null}
      </div>
      <button
        type="submit"
        className="sdp-xat-compositor__envia"
        aria-label={t('section.xat.compositor.envia', 'Envia')}
        disabled={buit || desactivat}
      >
        <Send size={20} aria-hidden="true" focusable="false" />
      </button>
    </form>
  );
}
