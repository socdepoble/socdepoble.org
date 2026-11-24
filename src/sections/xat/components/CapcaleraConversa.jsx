/**
 * CapcaleraConversa.jsx — la capçalera de la conversa oberta (UX-A06, UX-D03,
 * UX-D04, XAT-M01): fletxa d'arrere només en mode estret, avatar, nom i la
 * línia dels altres membres. Cap botó de trucada ni cap promesa que no es
 * complisca: el menú «⋯» només du «Seleccionar missatges».
 *
 * Lògica d'Usuari (T4): fora dels grups, avatar i nom enllacen al perfil
 * públic de l'altra part (persona, entitat o la IAIA). La línia secundària
 * diu quan s'actua en nom d'una entitat (canal compartit) o quan l'altra part
 * és una intel·ligència artificial.
 *
 * En mode de selecció es convertix en la barra de la tria (eixir + recompte).
 *
 * Xat de pàgina (T63.2, onada 3): un fil amb `subjecte` porta la línia
 * «Sobre: <títol>» i el recompte de participants («{n} participants») en
 * lloc de la llista de noms. No enllaça a cap perfil (el fil no és de
 * ningú): avatar, nom i línia fan l'enllaç a la Pàgina Universal
 * (subjecte.ruta), amb la mateixa zona tàctil que l'enllaç al perfil
 * (--sdp-touch, Pedra Seca §6) en lloc d'un text de 14px.
 *
 * Un canal («Avisos») porta el megàfon i un grup sense imatge, la icona de
 * grup, com a la llista (AvatarFil).
 *
 * Gauntlet 261016_1530 (Bloc 3.6.2; relleu F60, F61 i F63) · Ordre del
 * Mestre: la capçalera dels quatre actors porta a la seua pàgina canònica
 * (actorsDelXat.js · rutaCanonicaDelXat): Javi Llinares a /javillinares (també
 * el seu xat de només lectura, que abans no enllaçava), Sóc de Poble a
 * /socdepoble (un fil de la seua comunitat o un directe amb l'entitat) i la
 * IAIA a /iaia (també la seua conversa de mostra). «Gent de la Torre» ja hi
 * portava pel subjecte. La resta de converses, com sempre.
 *
 * Fase D (261020, tasca 2; pla 261020_1300 · Google Play UGC: denunciar
 * persones) · En un directe 1:1 amb una persona (Conversa, amb la moderació
 * de l'app), el menú «⋯» porta, darrere de «Seleccionar missatges», «Denuncia
 * {nom}» i «Bloqueja {nom}» o, si ja la tens bloquejada, «Desbloqueja {nom}»:
 * només els que arriben com a handler. Cada un tanca el menú, torna el focus
 * al «⋯» (botoRef: el diàleg el pren per obridor i, en tancar-se, l'hi torna;
 * crítica 261020, 13) i li'l passa. Sense els handlers, el menú de sempre.
 *
 * Ordre del Mestre (261021, pla 261021_0015 §8.5) · `onTornaAOrigen`: qui ha
 * entrat a esta conversa des d'una altra pàgina de l'app (/iaia, una fitxa de
 * perfil; XatSection, origenDelXat.js) hi torna amb la mateixa fletxa, ara
 * també en ample (sense d-mobile-only) i amb el seu nom («Torna a la pàgina
 * anterior»). Sense, la fletxa de sempre: només en estret i a la llista.
 *
 * P1-12 pas 17 (pla 261101_1246, T7 · S5) · `accioXifratge` ({ etiqueta, onTria }):
 * darrere de «Seleccionar missatges», l'entrada que obri l'estat del xifratge i el
 * número de seguretat. La porta Conversa només amb la bandera E2EE encesa (i
 * l'etiqueta hi viu, plegada per la bandera); sense, el menú de sempre, igual.
 *
 * B8 (marató 261101_2143; B8C-5) · `accioSilenci` ({ etiqueta, onTria }): darrere
 * de l'entrada del xifratge i davant de la moderació, «Silencia les
 * notificacions» o «Deixa de silenciar» (useSilenciDelFil). Com les altres,
 * tanca el menú i torna el focus al «⋯». Sense, el menú de sempre, igual.
 *
 * T7a (261104) · xat-ux-a11y-04: el menú «⋯» té el teclat del patró de menú
 * (mouFocusDelMenu, el del menú del + del Compositor): en obrir-lo, el focus
 * entra a la primera opció; les fletxes, Inici i Fi s'hi mouen en cercle, i
 * Tab el tanca i seguix des del «⋯». xat-ux-a11y-02: en entrar en la selecció
 * de missatges, el focus perdut va a la creu «Eixir de la selecció» i, en
 * eixir-ne, al «⋯» (les dues capçaleres porten `key`: React ja no reutilitza la
 * creu com a fletxa «Torna a la llista»).
 *
 * Gauntlet R21 (regressio_ui_xat-03 i -07, versions_i_portes-01) · El nom de la
 * conversa és l'encapçalament de nivell 1 de la vista del xat (R21-GC-04), en
 * les dues capçaleres (la de la selecció, només per al lector), però es pinta
 * com sempre: un <strong> amb role="heading" i aria-level, no un element H1.
 * L'H1 heretava de base.css el text-align:center i el letter-spacing dels
 * títols de pàgina (el nom ixia centrat i la línia de davall, a l'esquerra), i
 * la Regla de les Capçaleres (tooling/gates/design_guard.mjs) només admet l'H1
 * de pàgina dins de header.page-title. `nivellTitol` (1 per defecte; un enter
 * d'1 a 6, o null per a cap encapçalament) el baixa on la capçalera no és la
 * vista: l'espècimen del catàleg (EspecimenXat) en passa 5, davall dels seus
 * h4, i /disseny/fonaments/xat continua amb un sol H1, el de la pàgina.
 *
 * Onada R24 · IDEA-260 (a), CA-3 · `canals` (els fils de la fila plegada
 * d'una persona, unaFilaPerPersona.js) i `onTriaCanal(id)`: amb dues
 * identitats o més (la personal i la de cada entitat que gestiones), davall
 * de la capçalera, el selector «Personal · {entitat}» amb la fila de
 * píndoles del Xat (.sdp-xat-pindoles, la dels filtres: botons aria-pressed
 * de --sdp-touch, d'abast amb Tab i Enter). La premuda és la del fil obert;
 * una altra porta a /xat/<id> del seu canal. El Mestre va escriure «Hola
 * amic!» com a Sóc de Poble creient que era el seu xat personal: ara ho veu i
 * ho tria. Fora de la selecció de missatges. Sense, la capçalera de sempre.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, BellOff, Building2, MoreVertical, X } from 'lucide-react';
import { Link } from '../../../app/contexts/RouterContext';
import { RUTA_PERFIL_PROPI, rutaDePerfil } from '../../../config/navigation.js';
import { useCapaEnrere } from '../../../components/PedraSeca/hooks/useCapaEnrere.js';
import { AvatarFil } from './FilaConversa.jsx';
import { RUTA_DE_LA_IAIA, rutaCanonicaDelXat } from '../actorsDelXat.js';
import { mouFocusDelMenu, quiSigna } from './Compositor.jsx';
import IndicadorEscrivint from './IndicadorEscrivint.jsx';
import PastillaNoLlegits from './PastillaNoLlegits.jsx';
import { identitatsDeLaFila } from '../unaFilaPerPersona.js';

/* Onada R24 · CA-3 · El selector d'identitat d'una fila plegada: la mateixa
   fila de píndoles que els filtres de la llista (FiltreConverses).
   R24 · Gauntlet (G-client-4) · Cada identitat no premuda amb no llegits
   porta la PastillaNoLlegits del seu canal (amb el text per al lector de
   pantalla; grisa si el canal està silenciat): la fila diu «3» i el selector
   diu on són. */
function SelectorDeCanal({ identitats, actiu, onTria, t }) {
  return (
    <div className="sdp-xat-pindoles" role="group" aria-label={t('section.xat.canals.selector', 'Escrius com a')}>
      {identitats.map(({ clau, nom, detall, fil }) => {
        const premut = String(fil.id) === actiu;
        return (
          <button
            key={clau}
            type="button"
            className="sdp-xat-pindoles__boto"
            aria-pressed={premut}
            onClick={() => { if (!premut) onTria(fil.id); }}
          >
            {nom || t('section.xat.canals.personal', 'Personal')}
            {detall ? ` · ${detall}` : null}
            {premut ? null : <PastillaNoLlegits quants={fil.noLlegits} silenciada={Boolean(fil.silenciat)} t={t} />}
          </button>
        );
      })}
    </div>
  );
}

/* «{n} participants» (o «1 participant»); res si el backend no ho diu. */
function participantsDe(n, t) {
  const quants = Number(n);
  if (n == null || !Number.isFinite(quants) || quants < 0) return '';
  if (quants === 1) return t('section.xat.pagina.participant', '1 participant');
  return t('section.xat.pagina.participants', '{n} participants').replace('{n}', String(quants));
}

/* Gauntlet R21 · Els atributs d'encapçalament del nom: res si el nivell no
   és un enter d'1 a 6 (el nom es pinta igual, sense encapçalament). */
function propsDeTitol(nivell) {
  return Number.isInteger(nivell) && nivell >= 1 && nivell <= 6
    ? { role: 'heading', 'aria-level': nivell }
    : {};
}

/* Només les rutes internes de l'aplicació: mai un enllaç a fora des d'ací. */
const esRutaInterna = (ruta) => typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//');

/**
 * R32.6 (P0-120) · Resol la ruta del perfil públic de la capçalera en converses
 * 1:1 i d'entitat, incloent els casos on `fil.altres` arriba buit però la fila
 * plegada (`canals`), `fil.entitatId` o els missatges rebuts (`contrapartReserva`)
 * identifiquen unívocament l'interlocutor.
 */
export function resolRutaPerfilCapcalera(fil, { canals = null, contrapartReserva = null } = {}) {
  if (!fil || fil.subjecte) return null;
  const canonica = rutaCanonicaDelXat(fil);
  if (canonica) return canonica;
  if (fil.tipus === 'grup') return null;
  if (fil.esPropi) return RUTA_PERFIL_PROPI;

  let contrapart = null;
  if (Array.isArray(fil.altres) && fil.altres.length === 1) {
    [contrapart] = fil.altres;
  } else if (Array.isArray(fil.participants) && fil.participants.length === 1 && (fil.tipus || 'directe') === 'directe') {
    [contrapart] = fil.participants;
  } else if (Array.isArray(canals)) {
    for (const canal of canals) {
      if (Array.isArray(canal?.altres) && canal.altres.length === 1 && canal.altres[0]?.id != null) {
        [contrapart] = canal.altres;
        break;
      }
    }
  }
  if (!contrapart && !fil.comEntitat && fil.entitatId != null && String(fil.entitatId) !== '') {
    contrapart = { tipus: 'entitat', id: fil.entitatId };
  }
  if (!contrapart && contrapartReserva?.id != null && String(contrapartReserva.id) !== '') {
    contrapart = contrapartReserva;
  }
  if (!contrapart) {
    return fil.esIA || fil.tipus === 'ia' ? RUTA_DE_LA_IAIA : null;
  }

  const id = contrapart.id ?? contrapart.usuariId ?? contrapart.usuari_id ?? null;
  if (id == null || String(id) === '') return null;
  const tipusCru = contrapart.tipus || (fil.esIA ? 'ia' : 'persona');
  const tipus = tipusCru === 'iaia' ? 'ia' : tipusCru;
  const canonicaSintetica = rutaCanonicaDelXat({ ...fil, tipus: fil.tipus || 'directe', altres: [{ ...contrapart, id, tipus }] });
  return canonicaSintetica || rutaDePerfil(tipus, id);
}

/* xat-ux-a11y-02 (T7a, 261104) · El focus s'ha perdut: el control que el tenia
   s'ha desmuntat (cau a <body>, o a res dins d'un shadow root). El mateix
   criteri que la selecció de xats (XatSection, focusPerdut): mai no es roba a
   qui és en una casella o en un altre lloc. */
function focusPerdut(node) {
  const arrel = node?.getRootNode?.() || (typeof document !== 'undefined' ? document : null);
  if (!arrel) return false;
  const actiu = arrel.activeElement;
  return !actiu || actiu.isConnected === false || actiu === arrel.body
    || (typeof document !== 'undefined' && actiu === document.body);
}

export default function CapcaleraConversa({
  fil, onTorna, onSeleccionar, seleccio = null, t,
  onDenunciaPersona = null, onBloqueja = null, onDesbloqueja = null, nomContrapart = '',
  onTornaAOrigen = null, accioXifratge = null, accioSilenci = null, accioArxiva = null,
  accioContingutCompartit = null, accioOblit = null, escrivint = 0,
  nivellTitol = 1, canals = null, onTriaCanal = null, contrapartReserva = null
}) {
  const [menuObert, setMenuObert] = useState(false);
  const menuRef = useRef(null);
  const botoRef = useRef(null);
  const creuRef = useRef(null);
  const idSub = useId();
  /* Fase D (261020, tasca 2) · Tanca el menú, torna el focus al «⋯» i li'l passa. */
  const triaDelMenu = (accio) => {
    setMenuObert(false);
    botoRef.current?.focus();
    accio(botoRef.current);
  };
  const nomDeLaContrapart = String(nomContrapart || '').trim();
  const ambNom = (clau, reserva) => t(clau, reserva).replace('{nom}', () => nomDeLaContrapart);

  /* Escape i Arrere tornen al botó obridor, també si el focus era dins del menú. */
  const tancaMenu = useCallback(() => {
    setMenuObert(false);
    botoRef.current?.focus();
  }, []);
  const menuVisible = menuObert && !seleccio;
  useEffect(() => { if (seleccio && menuObert) setMenuObert(false); }, [seleccio, menuObert]);
  /* P0-24b (T2c, prompt 261102_1532) · Mentre el menú és obert, és a la pila de
     l'Arrere d'Android (config/pilaEnrere.js) amb el camí de l'Escape (ARB-T2B-04:
     damunt de la selecció o de la resposta, l'Arrere el tanca a ell primer). */
  const teCapaDamunt = useCapaEnrere(menuVisible, tancaMenu);

  /* El menú es tanca en clicar fora o amb Escape, sense tocar el cos del document.
     L'Escape que el tanca queda consumit (preventDefault): la selecció de
     xats de la llista, que també l'escolta, no l'ha de rebre dos vegades.
     P0-24b (Onada R21) · L'escolta és a l'arrel: un Escape ja consumit o amb
     una capa damunt a la pila (un altre menú obert amb el teclat) no és seu;
     abans un sol Escape tancava els dos menús. */
  useEffect(() => {
    if (!menuVisible) return undefined;
    const node = menuRef.current;
    /* xat-ux-a11y-04 (T7a, 261104) · En obrir, el focus entra a la primera
       opció, com al menú de la bombolla i al del +. */
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
  /* xat-ux-a11y-04 (T7a, 261104) · Les fletxes, Inici i Fi es mouen per les
     opcions; Tab tanca el menú i seguix des del «⋯», sense consumir-lo.
     L'Escape és de l'escolta de l'arrel, com fins ara. */
  const alTeclatDelMenu = (e) => {
    if (mouFocusDelMenu(e)) return;
    if (e.key === 'Tab') tancaMenu();
  };

  /* xat-ux-a11y-02 (T7a, 261104) · Focus coherent, com la selecció de xats
     (XatSection, T68 i P1-36): en entrar en la selecció, a la creu «Eixir de
     la selecció» (l'opció del menú s'ha desmuntat); en eixir-ne (la creu,
     l'Escape o l'Arrere), al «⋯». Només si el focus s'ha perdut. */
  const enSeleccio = Boolean(seleccio);
  const seleccioPrevia = useRef(enSeleccio);
  useEffect(() => {
    if (seleccioPrevia.current === enSeleccio) return;
    seleccioPrevia.current = enSeleccio;
    const desti = (enSeleccio ? creuRef : botoRef).current;
    if (desti && focusPerdut(desti)) desti.focus();
  }, [enSeleccio]);

  const nomBase = fil?.name || fil?.title || t('section.xat.conversaSenseNom', 'Conversa');
  const sufixTu = `(${t('section.xat.rail.tu', 'Tu')})`;
  const nom = fil?.esPropi && !nomBase.endsWith(sufixTu)
    ? t('section.xat.nou.tu', '{nom} (Tu)').replace('{nom}', () => nomBase)
    : nomBase;

  if (seleccio) {
    const { quants, onEixir } = seleccio;
    const recompte = quants === 0
      ? t('section.xat.seleccio.tria', 'Tria els missatges')
      : quants === 1
        ? t('section.xat.seleccio.triat', '1 triat')
        : t('section.xat.seleccio.triats', '{n} triats').replace('{n}', String(quants));
    const etiquetaEixir = t('section.xat.seleccio.eixir', 'Eixir de la selecció');
    return (
      <header key="seleccio" className="sdp-xat-capcalera sdp-xat-capcalera--seleccio">
        <button ref={creuRef} type="button" className="sdp-xat-icona" onClick={onEixir} aria-label={etiquetaEixir} title={etiquetaEixir}>
          <X size={24} aria-hidden="true" focusable="false" />
        </button>
        <strong className="sdp-sr-only" {...propsDeTitol(nivellTitol)}>{nom}</strong>
        <strong className="sdp-xat-capcalera__info" aria-live="polite">{recompte}</strong>
      </header>
    );
  }

  const altres = Array.isArray(fil?.altresNoms) ? fil.altresNoms : [];
  const esGrup = fil?.tipus === 'grup';
  const subjecte = fil?.subjecte || null;
  const esCanalDEntitat = !subjecte && !fil?.esPropi && !(esGrup || altres.length > 1)
    && Boolean(fil?.comEntitat && fil?.entitatNom);
  /* Gauntlet R22 (xat-06) · R21.8 va retirar «Escrius com a…» de damunt del
     compositor perquè la fila i la capçalera ja ho deien, però la capçalera
     només ho deia en el canal 1:1 d'una entitat. Als Avisos (un canal amb
     subjecte), als grups i als fils de pàgina on el que escrius ix amb la veu
     d'una entitat (quiSigna: comEntitat del servidor, o qui pot escriure als
     Avisos d'una entitat), ara ho diu ací, compacte, amb la mateixa marca. */
  const signa = esCanalDEntitat ? null : quiSigna(fil);
  const signaEntitat = signa?.tipus === 'entitat' && signa.nom
    ? t('section.xat.signa.entitat', 'Escrius com a {nom}.').replace('{nom}', () => signa.nom)
    : '';
  /* Gauntlet 261025_0545 (TE-03) · Els noms i els títols entren amb una
     funció de reemplaç: un «Bar $` Co» es pinta tal qual (moderacio.js, omple). */
  let linia = '';
  if (subjecte) linia = participantsDe(fil?.participants, t);
  else if (fil?.esPropi) linia = t('section.xat.nou.tuMateix', "Envia't missatges a tu mateix");
  else if (esGrup || altres.length > 1) linia = altres.join(', ');
  else if (esCanalDEntitat) linia = t('section.xat.entitat.canal', 'Canal de {nom}').replace('{nom}', () => fil.entitatNom);
  else if (fil?.esIA) linia = t('section.xat.ia.avis', 'Intel·ligència artificial en proves');

  /* L'altra part, amb id i tipus: només llavors hi ha perfil on anar. Un fil
     de pàgina no és de ningú: el seu enllaç va a la pàgina. */
  const rutaCanonica = rutaCanonicaDelXat(fil);
  const rutaPerfil = resolRutaPerfilCapcalera(fil, { canals, contrapartReserva });

  const titolSubjecte = subjecte ? subjecte.titol || nom : '';
  const rutaSubjecte = subjecte ? rutaCanonica || (esRutaInterna(subjecte.ruta) ? subjecte.ruta : null) : null;
  const sobre = subjecte ? (
    <span className="sdp-xat-capcalera__sobre">{t('section.xat.pagina.sobre', 'Sobre: {titol}').replace('{titol}', () => titolSubjecte)}</span>
  ) : null;

  const identitat = (
    <>
      <AvatarFil fil={fil} nom={nomBase} mida="sm" />
      <div className="sdp-xat-capcalera__info">
        {fil?.silenciat ? (
          <span className="sdp-xat-capcalera__titol-fila">
            <strong className="sdp-xat-capcalera__nom" {...propsDeTitol(nivellTitol)}>{nom}</strong>
            <span className="sdp-xat-capcalera__silenci">
              <BellOff size={14} aria-hidden="true" focusable="false" />
              <span className="sdp-nomes-lector">{t('section.xat.silenciada', 'Silenciada')}</span>
            </span>
          </span>
        ) : (
          <strong className="sdp-xat-capcalera__nom" {...propsDeTitol(nivellTitol)}>{nom}</strong>
        )}
        {escrivint > 0 ? <IndicadorEscrivint quants={escrivint} t={t} /> : null}
        {!escrivint && (sobre || linia || signaEntitat) ? (
          <span className="sdp-xat-capcalera__sub" id={idSub}>
            {/* xat-06 · Primer qui signa: la línia es retalla per la dreta en una pantalla estreta. */}
            {signaEntitat ? (
              <span className="sdp-xat-capcalera__entitat">
                <Building2 size={14} aria-hidden="true" focusable="false" />
                <span>{signaEntitat}</span>
              </span>
            ) : null}
            {signaEntitat && (sobre || linia) ? ' · ' : null}
            {sobre}
            {sobre && linia ? ' · ' : null}
            {esCanalDEntitat ? (
              <span className="sdp-xat-capcalera__entitat">
                <Building2 size={14} aria-hidden="true" focusable="false" />
                <span>{linia}</span>
              </span>
            ) : linia}
          </span>
        ) : null}
      </div>
    </>
  );

  let capIdentitat = identitat;
  if (rutaPerfil) {
    capIdentitat = (
      <Link
        className="sdp-xat-capcalera__enllac"
        to={rutaPerfil}
        aria-label={t('section.xat.perfil.obri', 'Obri el perfil de {nom}').replace('{nom}', () => nom)}
      >
        {identitat}
      </Link>
    );
  } else if (rutaSubjecte) {
    /* El nom accessible diu on porta; «Sobre: …» i els participants en són
       la descripció, perquè el lector no els perda. */
    capIdentitat = (
      <Link
        className="sdp-xat-capcalera__enllac"
        to={rutaSubjecte}
        aria-label={t('section.xat.pagina.obri', 'Obri la pàgina {titol}').replace('{titol}', () => titolSubjecte)}
        aria-describedby={idSub}
      >
        {identitat}
      </Link>
    );
  }

  /* §8.5 · Amb origen, la fletxa és a totes les amplàries i hi torna. */
  const etiquetaTornaOrigen = t('section.xat.conversa.tornaOrigen', 'Torna a la pàgina anterior');
  const etiquetaTornaLlista = t('section.xat.conversa.torna', 'Torna a la llista');
  const etiquetaOpcions = t('section.xat.conversa.opcions', 'Opcions de la conversa');
  const fletxa = typeof onTornaAOrigen === 'function' ? (
    <button type="button" className="sdp-xat-icona" onClick={onTornaAOrigen} aria-label={etiquetaTornaOrigen} title={etiquetaTornaOrigen}>
      <ArrowLeft size={24} aria-hidden="true" focusable="false" />
    </button>
  ) : (
    <button type="button" className="sdp-xat-icona d-mobile-only" onClick={onTorna} aria-label={etiquetaTornaLlista} title={etiquetaTornaLlista}>
      <ArrowLeft size={24} aria-hidden="true" focusable="false" />
    </button>
  );

  /* Onada R24 · CA-3 · Dues identitats o més: el selector, davall. */
  const identitats = typeof onTriaCanal === 'function' ? identitatsDeLaFila(canals, fil?.id, { totsElsFils: true }) : [];
  const selector = identitats.length > 1
    ? <SelectorDeCanal identitats={identitats} actiu={String(fil?.id ?? '')} onTria={onTriaCanal} t={t} />
    : null;

  const capcalera = (
    <header key="conversa" className="sdp-xat-capcalera">
      {fletxa}
      {capIdentitat}
      <div className="sdp-xat-capcalera__menu" ref={menuRef}>
        <button
          ref={botoRef}
          type="button"
          className="sdp-xat-icona"
          aria-label={etiquetaOpcions}
          title={etiquetaOpcions}
          aria-haspopup="menu"
          aria-expanded={menuObert}
          onClick={() => setMenuObert((obert) => !obert)}
        >
          <MoreVertical size={24} aria-hidden="true" focusable="false" />
        </button>
        {menuObert ? (
          <div className="sdp-xat-menu" role="menu" onKeyDown={alTeclatDelMenu}>
            <button
              type="button"
              role="menuitem"
              className="sdp-xat-menu__item"
              onClick={() => { setMenuObert(false); onSeleccionar?.(); }}
            >
              {t('section.xat.conversa.seleccionar', 'Seleccionar missatges')}
            </button>
            {typeof accioContingutCompartit?.onTria === 'function' && accioContingutCompartit.etiqueta ? (
              <button type="button" role="menuitem" className="sdp-xat-menu__item" onClick={() => triaDelMenu(accioContingutCompartit.onTria)}>
                {accioContingutCompartit.etiqueta}
              </button>
            ) : null}
            {typeof accioXifratge?.onTria === 'function' && accioXifratge.etiqueta ? (
              <button type="button" role="menuitem" className="sdp-xat-menu__item" onClick={() => triaDelMenu(accioXifratge.onTria)}>
                {accioXifratge.etiqueta}
              </button>
            ) : null}
            {typeof accioSilenci?.onTria === 'function' && accioSilenci.etiqueta ? (
              <button type="button" role="menuitem" className="sdp-xat-menu__item" onClick={() => triaDelMenu(accioSilenci.onTria)}>
                {accioSilenci.etiqueta}
              </button>
            ) : null}
            {typeof accioArxiva?.onTria === 'function' && accioArxiva.etiqueta ? (
              <button type="button" role="menuitem" className="sdp-xat-menu__item" onClick={() => triaDelMenu(accioArxiva.onTria)}>
                {accioArxiva.etiqueta}
              </button>
            ) : null}
            {typeof accioOblit?.onTria === 'function' && accioOblit.etiqueta ? (
              <button type="button" role="menuitem" className="sdp-xat-menu__item" onClick={() => triaDelMenu(accioOblit.onTria)}>
                {accioOblit.etiqueta}
              </button>
            ) : null}
            {typeof onDenunciaPersona === 'function' && nomDeLaContrapart ? (
              <button type="button" role="menuitem" className="sdp-xat-menu__item" onClick={() => triaDelMenu(onDenunciaPersona)}>
                {ambNom('section.moderacio.denunciaPersona', 'Denuncia {nom}')}
              </button>
            ) : null}
            {typeof onBloqueja === 'function' && nomDeLaContrapart ? (
              <button type="button" role="menuitem" className="sdp-xat-menu__item" onClick={() => triaDelMenu(onBloqueja)}>
                {ambNom('section.moderacio.bloqueja', 'Bloqueja {nom}')}
              </button>
            ) : null}
            {typeof onDesbloqueja === 'function' && nomDeLaContrapart ? (
              <button type="button" role="menuitem" className="sdp-xat-menu__item" onClick={() => triaDelMenu(onDesbloqueja)}>
                {ambNom('section.moderacio.desbloqueja', 'Desbloqueja {nom}')}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
  /* Sempre un fragment: la capçalera no es torna a muntar quan apareix o
     desapareix el selector (el menú obert no es tanca). */
  return <>{capcalera}{selector}</>;
}
