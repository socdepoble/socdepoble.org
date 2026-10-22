/**
 * SearchSection.jsx — /cerca, el cercador de Sóc de Poble (T45).
 *
 * Una sola caixa de cerca (UniversalSearch dins d'un form role=search) i els
 * filtres per tipus (PillToggle) amb recomptes. L'URL és l'única memòria:
 * ?q= s'escriu 250 ms després de l'última tecla (replace, perquè cada lletra
 * no siga una entrada de l'historial) i ?tipus= amb push (arrere torna al
 * filtre anterior). Tota la lògica de dades viu a useCercaGlobal i indexCerca.
 *
 * Estats: inicial (sense consulta), carregant (esquelet només si encara no hi
 * ha res), buit, error per font (la resta de resultats continua visible).
 *
 * Ordre del Mestre (261019 21:34, punt 9) ·
 *  · La caixa de cerca puja davall de l'H1 («Busca dins del contingut»), dins
 *    del bloc del títol: la ranura `accioPrincipal` de la Pàgina Universal
 *    (PageFrame, div.page-title-accio), davant del subtítol, dels filtres i
 *    dels resultats. Així es veu en el primer plec sense cap scroll. Continua
 *    sent l'única caixa (form role=search amb el seu nom).
 *  · Doble vista per a Persones, Entitats, Pobles i Mercat: la llista de
 *    sempre (per defecte) o targetes (?vista=graella, push com els filtres;
 *    targetaDeResultat.js), amb les mateixes dades i el mateix enllaç.
 */
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import {
  Alerta, Boto, Carregant, Centre, EstatBuit, Esquelet, GraellaTargetes, PillToggle, ResultatCerca, UniversalCard, UniversalSearch
} from '../../components/PedraSeca/index.js';
import { Link, useSearchParams } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { rutaDEntrada } from '../../config/rutaEntrada.js';
import { useResolvedAsset } from '../../hooks/useResolvedAsset.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';
import { TIPUS_CERCA, extracteDeResultat, partsRessaltades, tipusValid } from './indexCerca.js';
import { propsDeTargetaDeResultat, teVistaDeTargetes, vistaValida } from './targetaDeResultat.js';
import { useCercaGlobal } from './useCercaGlobal.js';

const MS_ESCRIPTURA = 250;
const PER_GRUP = 5;
const PER_PAGINA = 20;
const TIPUS_AMB_PERSONES = new Set(['tot', 'persones', 'entitats']);

const plantilla = (text, valors) => String(text).replace(/\{(\w+)\}/g, (marca, clau) => (clau in valors ? String(valors[clau]) : marca));

/** Les parts de partsRessaltades, amb les paraules buscades dins d'un <mark>. Mai innerHTML. */
function Ressaltat({ parts }) {
  return parts.map((part, i) => (
    part.marca ? <mark key={i}>{part.text}</mark> : <Fragment key={i}>{part.text}</Fragment>
  ));
}

/* Pla 261022_1955 (Cercador Universal, T2: «el seu logo») · Una entrada que
   només porta la referència del bucket públic de la seua foto (un logo pujat,
   indexCerca.js · avatarDeLEntrada) la demana al port, com AvatarResolt.
   Mentre es resol, o sense la capacitat 'mitjans', les inicials: mai la
   referència crua en un <img>. */
function ResultatAmbCara({ avatar, ...props }) {
  const url = useResolvedAsset(avatar && !avatar.src && avatar.ref ? avatar.ref : '');
  const cara = avatar && !avatar.src && url && !esMitjaOpac(url) ? { ...avatar, src: url } : avatar;
  return <ResultatCerca {...props} avatar={cara} />;
}

export default function SearchSection() {
  const { t } = useUIActions();
  const [params, setParams] = useSearchParams();
  const qURL = params.get('q') || '';
  const q = qURL.trim();
  const tipus = tipusValid(params.get('tipus'));
  /* La vista dels resultats d'un tipus que en té dues (targetaDeResultat.js):
     ?vista=graella, les targetes; si no, la llista. En els altres tipus i a
     la vista Tot, sempre la llista. */
  const vista = vistaValida(params.get('vista'));
  const ambVistes = teVistaDeTargetes(tipus);
  const enTargetes = ambVistes && vista === 'graella';
  const idBase = useId();

  /* El text de la caixa va per davant de l'URL mentre s'escriu. `escrita`
     recorda l'última consulta que hem posat a l'URL: si l'URL en porta una
     altra (arrere, un enllaç), és la persona qui ha navegat i es resincronitza. */
  const [text, setText] = useState(qURL);
  const escrita = useRef(q);
  useEffect(() => {
    if (q === escrita.current) return;
    escrita.current = q;
    setText(qURL);
  }, [q, qURL]);

  const aplica = useCallback((valor, opcions, extra = {}) => {
    const net = String(valor || '').trim();
    escrita.current = net;
    setParams({ q: net || null, ...extra }, opcions);
  }, [setParams]);

  useEffect(() => {
    if (text.trim() === escrita.current) return undefined;
    const temporitzador = setTimeout(() => aplica(text, { replace: true }), MS_ESCRIPTURA);
    return () => clearTimeout(temporitzador);
  }, [text, aplica]);

  /* Quan el control activat desapareix amb el canvi de vista («Vore'ls tots»,
     «Busca a tot arreu»), el focus va a un destí estable: la capçalera de la
     vista d'un tipus o, si no n'hi ha (la vista Tot), el recompte. */
  const enfocaCapcalera = useRef(false);
  const capcaleraRef = useRef(null);
  const estatRef = useRef(null);
  const canviaTipus = useCallback((valor, { enfoca = false } = {}) => {
    const nou = tipusValid(valor);
    if (nou === tipus) return;
    enfocaCapcalera.current = enfoca;
    aplica(text, { replace: false }, { tipus: nou === 'tot' ? null : nou });
  }, [aplica, text, tipus]);
  useEffect(() => {
    if (!enfocaCapcalera.current) return;
    enfocaCapcalera.current = false;
    (capcaleraRef.current || estatRef.current)?.focus();
  }, [tipus]);

  /* Canviar de vista fa push, com els filtres (arrere torna a la d'abans).
     Només s'escriu ?vista=: la consulta i el filtre de la URL es queden. La
     per defecte (la llista) no s'escriu. El selector no desapareix amb el
     canvi: el focus es queda on és. */
  const canviaVista = useCallback((valor) => {
    const nova = vistaValida(valor);
    if (nova === vista) return;
    setParams({ vista: nova === 'llista' ? null : nova }, { replace: false });
  }, [setParams, vista]);

  /* En mòbil els filtres són una fila que es desplaça: el filtre actiu (p. ex.
     un ?tipus= que arriba per enllaç) ha de quedar a la vista. Només es mou
     la fila, mai la pàgina (el focus de «Vore'ls tots» ja la porta on toca). */
  const filtresRef = useRef(null);
  useEffect(() => {
    const fila = filtresRef.current?.querySelector('.sdp-pindola');
    const actiu = fila?.querySelector('[aria-pressed="true"]');
    if (!fila || !actiu || fila.scrollWidth <= fila.clientWidth) return;
    const caixa = fila.getBoundingClientRect();
    const boto = actiu.getBoundingClientRect();
    if (boto.left < caixa.left || boto.right > caixa.right) {
      fila.scrollLeft += boto.left - caixa.left - (caixa.width - boto.width) / 2;
    }
  }, [tipus]);

  const { resultats, errors, carregant, senseSessio } = useCercaGlobal({ q, tipus });
  const { llista, perTipus, total, fitxes } = resultats;

  /* Paginació de la vista d'un tipus: es reinicia amb cada consulta o filtre. */
  const clauVista = `${q}|${tipus}`;
  const [pagina, setPagina] = useState({ clau: clauVista, n: PER_PAGINA });
  const visibles = pagina.clau === clauVista ? pagina.n : PER_PAGINA;
  const llistaRef = useRef(null);
  const primerNou = useRef(null);
  const mostraMes = () => {
    primerNou.current = visibles;
    setPagina({ clau: clauVista, n: visibles + PER_PAGINA });
  };
  /* El focus va al primer resultat nou: a la llista, el seu enllaç; a les
     targetes, l'enllaç de la targeta (data-element) o, si no n'hi ha, el
     primer enllaç que porta. */
  useEffect(() => {
    if (primerNou.current == null) return;
    const index = primerNou.current;
    primerNou.current = null;
    const contenidor = llistaRef.current;
    const nou = contenidor?.tagName === 'OL' ? contenidor.children[index] : contenidor?.querySelectorAll('.sp-card')[index];
    (nou?.querySelector('[data-element]') || nou?.querySelector('a'))?.focus();
  }, [visibles]);

  /* Els grups de la vista Tot i el ressaltat (extracte i <mark>) de cada
     resultat que es pinta depenen de la llista, les fitxes i els visibles,
     mai del text de la caixa: escriure no els torna a calcular. */
  const grups = useMemo(() => TIPUS_CERCA.filter((tp) => tp.id !== 'tot')
    .map((tp) => ({ id: tp.id, items: llista.filter((e) => e.tipus === tp.id) }))
    .filter((grup) => grup.items.length > 0), [llista]);
  const ressaltats = useMemo(() => {
    const pintats = tipus === 'tot' ? grups.flatMap((grup) => grup.items.slice(0, PER_GRUP)) : llista.slice(0, visibles);
    const perClau = new Map();
    for (const e of pintats) {
      const extracte = extracteDeResultat(e, fitxes);
      perClau.set(e.clau, {
        titol: partsRessaltades(e.titol, fitxes),
        extracte: extracte ? partsRessaltades(extracte, fitxes) : null
      });
    }
    return perClau;
  }, [grups, llista, fitxes, tipus, visibles]);

  const etiquetaDe = (id) => {
    const tp = TIPUS_CERCA.find((element) => element.id === id);
    return tp ? t(tp.clau, tp.text) : id;
  };

  const opcionsFiltre = TIPUS_CERCA.map((tp) => ({
    valor: tp.id,
    text: q
      ? <>{t(tp.clau, tp.text)} <span className="sdp-cerca__recompte">{perTipus[tp.id] ?? 0}</span></>
      : t(tp.clau, tp.text)
  }));

  const textEstat = !q ? '' : (carregant && total === 0)
    ? t('section.search.buscant', 'Buscant…')
    : plantilla(total === 1
      ? t('section.search.recompteU', "S'ha trobat 1 resultat per a «{q}»")
      : t('section.search.recompte', "S'han trobat {n} resultats per a «{q}»"), { n: total, q });

  /* Auditoria 261007 (B) · El botó diu «Entra»: obri /registre en el mode
     d'entrar, per la forma única de totes les portes (rutaEntrada.js). Abans
     l'enllaç es construïa a mà, sense mode, i OnboardingSection obria «Crear
     compte». La tornada es valida allà (tornadaSegura). */
  const rutaEntra = rutaDEntrada({ mode: 'entrar', tornar: q ? `/cerca?q=${encodeURIComponent(q)}` : '/cerca' });
  const enllacEntra = (
    <Link className="sdp-boto sdp-boto--secundari" to={rutaEntra}>
      {t('section.search.entra', 'Entra per a buscar gent del poble')}
    </Link>
  );

  /* La meta i l'acció d'un resultat, les mateixes a la fila i a la targeta. */
  const metaDe = (e) => {
    const propia = e.propia === 'persona'
      ? t('section.search.elTeuPerfil', 'El teu perfil')
      : e.propia === 'entitat' ? t('section.search.laGestiones', 'La gestiones tu') : null;
    return propia ? [propia, ...e.meta] : e.meta;
  };
  const accioDe = (e) => (e.accio?.tipus === 'escriu' ? (
    <Link className="sdp-boto sdp-boto--secundari" to={e.accio.href}
      aria-label={plantilla(t('section.search.escriuliA', 'Escriu-li a {nom}'), { nom: e.titol })}>
      {t('section.search.escriuli', 'Escriu-li')}
    </Link>
  ) : null);

  const pintaResultat = (e) => {
    const { titol, extracte } = ressaltats.get(e.clau);
    return (
      <ResultatAmbCara
        titol={<Ressaltat parts={titol} />}
        href={e.href}
        meta={metaDe(e)}
        avis={e.privada ? t('section.search.privada', 'Privada: només la veus tu') : null}
        extracte={extracte ? <Ressaltat parts={extracte} /> : null}
        imatge={e.imatge}
        avatar={e.avatar}
        headingLevel={4}
        accio={accioDe(e)}
      />
    );
  };

  /* La vista «Targetes» (ordre del Mestre, 261019 21:34, punt 9): la
     UniversalCard de cada resultat dins de la graella canònica
     (GraellaTargetes), amb l'extracte ressaltat com a la fila. El títol de la
     targeta és text (també és el nom de l'enllaç de tota la targeta). */
  const pintaTargeta = ({ id, entrada: e }) => {
    const { extracte } = ressaltats.get(e.clau);
    return (
      <UniversalCard
        key={id}
        {...propsDeTargetaDeResultat(e, { meta: metaDe(e) })}
        headingLevel="h4"
        body={extracte ? <Ressaltat parts={extracte} /> : undefined}
        accio={accioDe(e)}
      />
    );
  };
  const opcionsVista = [
    { valor: 'llista', text: t('section.search.vistaLlista', 'Llista'), icona: <List size={20} aria-hidden="true" focusable="false" /> },
    { valor: 'graella', text: t('section.search.vistaTargetes', 'Targetes'), icona: <LayoutGrid size={20} aria-hidden="true" focusable="false" /> }
  ];

  let cos = null;
  if (!q) {
    cos = (
      <EstatBuit icona={Search} titol={t('section.search.inicial.titol', 'Què vols buscar?')} accio={senseSessio ? enllacEntra : null}>
        {t('section.search.inicial.text', "Escriu un nom o unes paraules. Busquem en la gent i les entitats del poble, els pobles, el Mur, l'agenda, el mercat, la multimèdia i les pàgines. També en les teues notes i converses, que només veus tu: de les notes carregades, el títol, el subtítol, l'entradilla i les etiquetes (el text de dins, només de les que ja has obert); de les converses, el nom, qui hi parla i l'últim missatge.")}
      </EstatBuit>
    );
  } else if (total === 0 && carregant) {
    cos = <Esquelet linies={2} ambMedia etiqueta={t('section.search.buscant', 'Buscant…')} />;
  } else if (total === 0) {
    cos = (
      <EstatBuit
        icona={Search}
        titol={plantilla(t('section.search.buit.titol', 'Cap resultat per a «{q}»'), { q })}
        accio={tipus !== 'tot' ? (
          <Boto varietat="secundari" onClick={() => canviaTipus('tot', { enfoca: true })}>{t('section.search.buscaTot', 'Busca a tot arreu')}</Boto>
        ) : null}
      >
        {t('section.search.buit.consell', 'Revisa com ho has escrit o prova amb menys paraules: només ixen els resultats que les contenen totes.')}
      </EstatBuit>
    );
  } else if (tipus === 'tot') {
    cos = grups.map(({ id, items }) => {
      const idTitol = `${idBase}-grup-${id}`;
      return (
        <section key={id} className="sdp-cerca__grup" aria-labelledby={idTitol}>
          <h3 id={idTitol} className="sdp-cerca__grup-titol">
            {etiquetaDe(id)} <span className="sdp-cerca__grup-recompte">({items.length})</span>
          </h3>
          <ol className="sdp-cerca__llista">
            {items.slice(0, PER_GRUP).map((e) => <li key={e.clau}>{pintaResultat(e)}</li>)}
          </ol>
          {items.length > PER_GRUP ? (
            <Boto className="sdp-cerca__mes" onClick={() => canviaTipus(id, { enfoca: true })}>
              {plantilla(t('section.search.voreTots', "Vore'ls tots ({n})"), { n: items.length })}
            </Boto>
          ) : null}
        </section>
      );
    });
  } else {
    const idTitol = `${idBase}-vista`;
    cos = (
      <section className="sdp-cerca__grup" aria-labelledby={idTitol}>
        <h3 id={idTitol} ref={capcaleraRef} tabIndex={-1} className="sdp-cerca__grup-titol">
          {etiquetaDe(tipus)} <span className="sdp-cerca__grup-recompte">({total})</span>
        </h3>
        {ambVistes ? (
          <PillToggle
            className="sdp-pindola--centrada"
            etiqueta={t('section.search.vista', 'Vista dels resultats')}
            opcions={opcionsVista}
            valor={vista}
            onCanvi={canviaVista}
          />
        ) : null}
        {enTargetes ? (
          <div ref={llistaRef}>
            <GraellaTargetes elements={llista.slice(0, visibles).map((e) => ({ id: e.clau, entrada: e }))}>
              {pintaTargeta}
            </GraellaTargetes>
          </div>
        ) : (
          <ol ref={llistaRef} className="sdp-cerca__llista">
            {llista.slice(0, visibles).map((e) => <li key={e.clau}>{pintaResultat(e)}</li>)}
          </ol>
        )}
        {total > visibles ? (
          <Boto className="sdp-cerca__mes" onClick={mostraMes}>{t('section.search.mostraMes', "Mostra'n més")}</Boto>
        ) : null}
      </section>
    );
  }

  /* Ordre del Mestre (261019 21:34, punt 9: «elevar-lo directament davall de
     l'H1 … en el primer plec visual sense cap scroll») · La caixa va a la
     ranura del bloc del títol (accioPrincipal: davall de l'H1, dins de
     div.page-title-accio), no al cos: abans quedava davall del subtítol.
     Revisió adversarial (Llei del Píxel) · Dins del bloc del títol la caixa
     prenia tota l'amplada del bloc (861 px a 1280, desalineada de la columna
     dels filtres i dels resultats, 622 px). Centre (la primitiva de
     composició, .sdp-centre: la mesura de lectura i centrada) li torna
     l'amplada i el lloc de la columna de .sdp-cerca. En mòbil el bloc ja és
     més estret que la mesura: no hi canvia res. */
  const formulari = (
    <Centre>
      <form
        role="search"
        className="sdp-cerca__formulari"
        aria-label={t('section.search.formulari', 'Cerca a Sóc de Poble')}
        onSubmit={(event) => { event.preventDefault(); aplica(text, { replace: true }); }}
      >
        <UniversalSearch
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t('section.search.searchPlaceholder', 'Cerca persones, pobles, posts...')}
          ariaLabel={t('section.search.searchPlaceholder', 'Cerca persones, pobles, posts...')}
        />
      </form>
    </Centre>
  );

  return (
    <UniversalPage
      title={t('section.search.title', 'Cercador Universal')}
      subtitle={t('section.search.subtitle', 'Busca persones, pobles, publicacions i pàgines en un sol lloc')}
      chrome="system"
      showLogos
      accioPrincipal={formulari}
    >
      <div className="sdp-cerca">
        <div ref={filtresRef}>
          <PillToggle
            className="sdp-cerca__filtres"
            etiqueta={t('section.search.filtres', 'Filtra per tipus')}
            opcions={opcionsFiltre}
            valor={tipus}
            onCanvi={(valor) => canviaTipus(valor)}
          />
        </div>

        <p role="status" ref={estatRef} tabIndex={-1} className="sdp-cerca__estat">{textEstat}</p>

        {q && senseSessio && TIPUS_AMB_PERSONES.has(tipus) ? (
          <Alerta to="info" accions={enllacEntra}>
            {t('section.search.senseSessio', 'Sense entrar, la cerca no veu la gent registrada al poble.')}
          </Alerta>
        ) : null}

        {errors.map((font) => (
          <Alerta
            key={font.id}
            to="avis"
            titol={plantilla(t('section.search.errorFont', "No s'ha pogut buscar en {font}"), { font: font.etiqueta })}
            accions={font.reintenta ? (
              <Boto varietat="secundari" onClick={() => { estatRef.current?.focus(); font.reintenta(); }}>{t('section.search.reintenta', 'Torna-ho a provar')}</Boto>
            ) : null}
          >
            {font.error}
          </Alerta>
        ))}

        {q && carregant && total > 0 ? (
          <Carregant className="sdp-cerca__carregant" etiqueta={t('section.search.encaraCarrega', "Encara arriben resultats d'algunes fonts…")} />
        ) : null}

        {cos}
      </div>
    </UniversalPage>
  );
}
