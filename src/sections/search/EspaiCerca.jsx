/**
 * EspaiCerca.jsx — L'espai de cerca en tres columnes (IDEA-46, fase 1; B6-B3
 * de la marató 261101_2143): criteris (Tipus, Estat, Pobles, Data; l'Estat
 * és de les fitxes d'àmbit, IDEA-61, T0, prompt 261102_1532) · resultats ·
 * detall, sobre UniversalWorkspace i sense cap UniversalPage al voltant
 * (skill sdp-app-grid-shell §1). S'obri amb /cerca?mode=espai i cap enllaç
 * no hi porta (D-4): /cerca sense el mode és la de sempre.
 *
 * L'URL és l'única memòria, com a /cerca:
 *  · ?q= s'escriu 250 ms després de l'última tecla de la lupa (replace);
 *  · ?faceta= (el criteri actiu) i ?resultat= (la clau de l'entrada oberta):
 *    la tria de la persona fa push i la reconciliació de l'espai, replace.
 * La consulta la fa useCercaGlobal, sempre amb el tipus «tot» (el rànquing,
 * la I de les paraules i el padró): l'espai no filtra per subcadena
 * (filtraPerConsulta: false) i els criteris filtren pels categoryIds de
 * facetesCerca.js. Un criteri actiu cada vegada (fase 1).
 *
 * L'espai només llig la consulta en muntar: un ?q= que canvia des de fora
 * (Arrere, un enllaç) el torna a muntar (workspaceKey); el que escriu la
 * mateixa lupa, no (el camp no perd el focus).
 * El criteri actiu de l'URL es queda a la navegació encara que la consulta
 * nova no en porte cap resultat (recompte 0): si no, l'espai reconciliaria
 * cap al primer criteri i la persona veuria uns altres resultats sense
 * haver triat res.
 * Cap traductor de pàgina dins de l'espai: hi ha notes i converses privades
 * (com /cerca, que porta traduccio={false}).
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import AppGridColumn from '../../components/layout/AppGridColumn.jsx';
import { useAppGrid } from '../../components/layout/AppGridShell.jsx';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace.jsx';
import { ALL_CATEGORY_ID } from '../../components/universal/workspace/workspaceState.js';
import { isSafeUrl } from '../../components/universal/UniversalUtils.js';
import { Accions, Alerta, Boto, Carregant, EstatBuit, MarcColumna, ResultatCerca } from '../../components/PedraSeca/index.js';
import { Link, useSearchParams } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { rutaDEntrada } from '../../config/rutaEntrada.js';
import { useResolvedAsset } from '../../hooks/useResolvedAsset.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';
import { ESTATS_FACETA, GRUPS_FACETES, TRAMS_DATA, ambEtiquetes, grupsDeFacetes, idDeFaceta, itemsDeLEspai } from './facetesCerca.js';
import { TIPUS_CERCA, extracteDeResultat, partsRessaltades } from './indexCerca.js';
import { useCercaGlobal } from './useCercaGlobal.js';

/* El mateix retard que la caixa de /cerca (SearchSection.jsx · MS_ESCRIPTURA). */
const MS_ESCRIPTURA = 250;
/* L'hora local menys UTC de cada marca (CET = 60), per als trams de data:
   una funció i no un número, perquè una data d'estiu avaluada a l'hivern no
   caiga al dia d'abans (facetesCerca.js · tramsDeData). */
const desfasLocal = (ms) => -new Date(ms).getTimezoneOffset();
/* L'espai no tria cap resultat per la persona, i una tria que ja no és a la
   llista (una consulta nova) es conserva: és a l'URL. Fora del component,
   perquè l'espai compara la identitat de resolveItemId. */
const CAP_TRIA_AUTOMATICA = () => false;
const CONSERVA_LA_TRIA = async () => ({ status: 'found' });
/* El slug d'un poble a ?faceta=poble:… (facetesCerca.js · idDeFaceta). Un
   guionet entre trossos: cap retrocés. */
const SLUG_POBLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAXIM_FACETA = 160;
const TIPUS_DE_FACETA = TIPUS_CERCA.filter((tipus) => tipus.id !== 'tot');
const ORDRE_TIPUS = TIPUS_DE_FACETA.map((tipus) => idDeFaceta('tipus', tipus.id));
const ORDRE_DATA = TRAMS_DATA.map((tram) => idDeFaceta('data', tram.id));
const ORDRE_ESTAT = ESTATS_FACETA.map((estat) => idDeFaceta('estat', estat.id));

const plantilla = (text, valors) => String(text).replace(/\{(\w+)\}/g, (marca, clau) => (clau in valors ? String(valors[clau]) : marca));

/**
 * El criteri de ?faceta=, si n'és un: { grup, ordre, opcio } amb l'opció de
 * recompte 0 que s'afig a la navegació quan els resultats no la porten. El
 * nom d'un poble és el que s'hi ha vist (`retolPoble`) o, si cap resultat no
 * l'ha portat mai (un enllaç), el del seu slug. null per a qualsevol altre
 * valor (l'espai mostra «Tots els resultats»).
 */
function criteriDeLaUrl(faceta, retolPoble = null) {
  if (typeof faceta !== 'string' || !faceta || faceta.length > MAXIM_FACETA) return null;
  const dos = faceta.indexOf(':');
  if (dos <= 0) return null;
  const prefix = faceta.slice(0, dos);
  const valor = faceta.slice(dos + 1);
  if (prefix === 'tipus') {
    const tipus = TIPUS_DE_FACETA.find((candidat) => candidat.id === valor);
    return tipus ? { grup: 'tipus', ordre: ORDRE_TIPUS, opcio: { id: faceta, clau: tipus.clau, text: tipus.text, count: 0 } } : null;
  }
  if (prefix === 'data') {
    const tram = TRAMS_DATA.find((candidat) => candidat.id === valor);
    return tram ? { grup: 'data', ordre: ORDRE_DATA, opcio: { id: faceta, clau: tram.clau, text: tram.text, count: 0 } } : null;
  }
  /* IDEA-61 (T0, prompt 261102_1532) · estat:<estat> d'una fitxa d'àmbit. */
  if (prefix === 'estat') {
    const estat = ESTATS_FACETA.find((candidat) => candidat.id === valor);
    return estat ? { grup: 'estat', ordre: ORDRE_ESTAT, opcio: { id: faceta, clau: estat.clau, text: estat.text, count: 0 } } : null;
  }
  if (prefix === 'poble' && SLUG_POBLE.test(valor)) {
    const text = retolPoble?.id === faceta && retolPoble.text ? retolPoble.text : valor.split('-').join(' ');
    return { grup: 'pobles', ordre: null, opcio: { id: faceta, text, count: 0 } };
  }
  return null;
}

/* Els grups amb el criteri actiu dins, al seu lloc (tipus i data en l'ordre
   canònic; un poble, al final del seu grup), i els grups en l'ordre de
   GRUPS_FACETES. Si ja hi és, els mateixos grups. */
function ambCriteriActiu(grups, criteri) {
  if (!criteri || grups.some((grup) => grup.options.some((opcio) => opcio.id === criteri.opcio.id))) return grups;
  const definicio = GRUPS_FACETES.find((grup) => grup.id === criteri.grup);
  const propi = grups.find((grup) => grup.id === criteri.grup);
  const options = [...(propi?.options ?? []), criteri.opcio];
  if (criteri.ordre) options.sort((a, b) => criteri.ordre.indexOf(a.id) - criteri.ordre.indexOf(b.id));
  const nou = { id: definicio.id, clau: definicio.clau, text: definicio.text, options };
  const tots = propi ? grups.map((grup) => (grup === propi ? nou : grup)) : [...grups, nou];
  return GRUPS_FACETES.map((d) => tots.find((grup) => grup.id === d.id)).filter(Boolean);
}

/** Les parts de partsRessaltades, amb les paraules buscades dins d'un <mark>. Mai innerHTML. */
function Ressaltat({ parts }) {
  return parts.map((part, i) => (
    part.marca ? <mark key={i}>{part.text}</mark> : <Fragment key={i}>{part.text}</Fragment>
  ));
}

/* La foto d'una entrada que només porta la referència del bucket (un logo
   pujat) es demana al port, com a /cerca (SearchSection.jsx ·
   ResultatAmbCara): mai la referència crua en un <img>. */
function ResultatAmbCara({ avatar, ...props }) {
  const url = useResolvedAsset(avatar && !avatar.src && avatar.ref ? avatar.ref : '');
  const cara = avatar && !avatar.src && url && !esMitjaOpac(url) ? { ...avatar, src: url } : avatar;
  return <ResultatCerca {...props} avatar={cara} />;
}

/* El marc del detall. En estret (el mestre-detall), la fletxa ← torna a la
   llista, com la dels estats propis de l'espai (UniversalWorkspace ·
   TornadaDelDetall): el detall de la cerca sempre el pinta la secció. Fora
   d'estret, cap capçalera. */
function MarcDelDetall({ tornaLlista, children }) {
  const { tornaDelDetall } = useAppGrid();
  const capcalera = tornaDelDetall ? (
    <AppGridColumn
      esquerra={(
        <button type="button" className="app-grid-col-header__accio-icon" onClick={() => tornaDelDetall()}
          aria-label={tornaLlista} title={tornaLlista}>
          <ArrowLeft size={24} aria-hidden="true" focusable="false" />
        </button>
      )}
    />
  ) : null;
  return <MarcColumna capcalera={capcalera}>{children}</MarcColumna>;
}

export default function EspaiCerca() {
  const { t } = useUIActions();
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') || '').trim();
  const faceta = params.get('faceta') || '';
  const resultat = params.get('resultat') || '';

  /* setParams pot canviar d'identitat amb cada navegació: el temporitzador
     de la lupa no s'ha de reiniciar per això. */
  const setParamsRef = useRef(setParams);
  useEffect(() => { setParamsRef.current = setParams; }, [setParams]);

  /* La consulta. `escrita` és l'última que hem posat a l'URL; un ?q= que no
     ho és ve de fora (Arrere, un enllaç) i torna a muntar l'espai amb ella.
     `pendent` és el text de la lupa que encara no hi és. */
  const escrita = useRef(q);
  const [generacio, setGeneracio] = useState(0);
  const [pendent, setPendent] = useState(null);
  useEffect(() => {
    if (q === escrita.current) return;
    escrita.current = q;
    setPendent(null);
    setGeneracio((n) => n + 1);
  }, [q]);
  useEffect(() => {
    if (pendent === null) return undefined;
    const net = pendent.trim();
    if (net === escrita.current) return undefined;
    const temporitzador = setTimeout(() => {
      escrita.current = net;
      setParamsRef.current({ q: net || null }, { replace: true });
    }, MS_ESCRIPTURA);
    return () => clearTimeout(temporitzador);
  }, [pendent]);
  const enConsulta = useCallback((consulta) => setPendent(typeof consulta === 'string' ? consulta : ''), []);

  const { resultats, errors, carregant, senseSessio } = useCercaGlobal({ q, tipus: 'tot' });
  const { llista, total, fitxes } = resultats;

  /* Els criteris i els elements, una vegada per llista de resultats. `ara`
     és el moment en què arriba la llista. */
  const facetes = useMemo(() => {
    const opcions = { ara: Date.now(), desfasMinuts: desfasLocal };
    return { grups: grupsDeFacetes(llista, opcions), items: itemsDeLEspai(llista, opcions) };
  }, [llista]);
  /* El nom del poble del criteri actiu, l'últim que n'han portat els
     resultats: si la consulta nova ja no en porta cap, la navegació el
     continua pintant com la persona l'ha triat («Benifallim», no el slug). */
  const [retolPoble, setRetolPoble] = useState(null);
  useEffect(() => {
    const vist = facetes.grups.find((grup) => grup.id === 'pobles')?.options.find((opcio) => opcio.id === faceta);
    if (vist?.text) setRetolPoble((abans) => (abans?.id === vist.id && abans.text === vist.text ? abans : { id: vist.id, text: vist.text }));
  }, [facetes.grups, faceta]);
  const criteri = useMemo(() => criteriDeLaUrl(faceta, retolPoble), [faceta, retolPoble]);
  const navigationGroups = useMemo(
    () => ambEtiquetes(ambCriteriActiu(facetes.grups, criteri), t),
    [facetes.grups, criteri, t]
  );

  const model = useMemo(() => ({
    status: carregant && total === 0 ? 'loading' : 'ready',
    workspaceKey: generacio,
    itemsComplete: false,
    resolveItemId: CONSERVA_LA_TRIA,
    canAutoSelect: CAP_TRIA_AUTOMATICA,
    filtraPerConsulta: false,
    onQueryChange: enConsulta,
    navigationGroups,
    items: facetes.items
  }), [carregant, total, generacio, enConsulta, navigationGroups, facetes.items]);

  /* Mana la URL: la tria de la persona fa push; la reconciliació i les
     fletxes del teclat, replace. Una tria que ja hi és no escriu res. */
  const facetaActiva = criteri ? faceta : null;
  const enTriar = useCallback(({ categoryId, itemId } = {}, meta) => {
    const nova = {
      faceta: categoryId == null || categoryId === ALL_CATEGORY_ID ? null : String(categoryId),
      resultat: itemId == null ? null : String(itemId)
    };
    if (nova.faceta === (faceta || null) && nova.resultat === (resultat || null)) return;
    setParamsRef.current(nova, { replace: meta?.reason !== 'user' });
  }, [faceta, resultat]);

  const etiquetes = useMemo(() => ({
    categories: t('section.search.espai.navegacio', 'CRITERIS'),
    items: t('section.search.espai.llista', 'RESULTATS'),
    all: t('section.search.espai.tots', 'Tots els resultats'),
    search: t('section.search.formulari', 'Cerca a Sóc de Poble'),
    loading: t('section.search.buscant', 'Buscant…'),
    select: t('section.search.espai.tria', "Tria un resultat per a vore'l ací."),
    count: (n) => n === 1
      ? t('section.search.espai.recompteU', '{n} resultat')
      : t('section.search.espai.recompte', '{n} resultats'),
    empty: q
      ? plantilla(t('section.search.buit.titol', 'Cap resultat per a «{q}»'), { q })
      : t('section.search.inicial.titol', 'Què vols buscar?')
  }), [t, q]);

  /* La meta i l'acció d'un resultat, les de /cerca. */
  const metaDe = useCallback((e) => {
    const propia = e.propia === 'persona'
      ? t('section.search.elTeuPerfil', 'El teu perfil')
      : e.propia === 'entitat' ? t('section.search.laGestiones', 'La gestiones tu') : null;
    const meta = Array.isArray(e.meta) ? e.meta : [];
    return propia ? [propia, ...meta] : meta;
  }, [t]);
  const accioDe = useCallback((e) => (e.accio?.tipus === 'escriu' ? (
    <Link className="sdp-boto sdp-boto--secundari" to={e.accio.href}
      aria-label={plantilla(t('section.search.escriuliA', 'Escriu-li a {nom}'), { nom: e.titol })}>
      {t('section.search.escriuli', 'Escriu-li')}
    </Link>
  ) : null), [t]);

  /* El detall: damunt, els avisos de /cerca (sense sessió, una font que
     falla, fonts que encara carreguen); davall, l'estat inicial, «Tria un
     resultat» o el resultat obert amb «Obri». */
  const renderDetail = useCallback(({ item }) => {
    const entrada = item?.entrada ?? null;
    const enllacEntra = (
      <Link className="sdp-boto sdp-boto--secundari"
        to={rutaDEntrada({ mode: 'entrar', tornar: q ? `/cerca?mode=espai&q=${encodeURIComponent(q)}` : '/cerca?mode=espai' })}>
        {t('section.search.entra', 'Entra per a buscar gent del teu poble')}
      </Link>
    );
    const avisos = (
      <>
        {q && senseSessio ? (
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
              <Boto varietat="secundari" onClick={() => font.reintenta()}>{t('section.search.reintenta', 'Torna-ho a provar')}</Boto>
            ) : null}
          >
            {font.error}
          </Alerta>
        ))}
        {q && carregant && total > 0 ? (
          <Carregant etiqueta={t('section.search.encaraCarrega', "Encara arriben resultats d'algunes fonts…")} />
        ) : null}
      </>
    );
    let cos;
    if (!q) {
      cos = (
        <EstatBuit icona={Search} titol={t('section.search.inicial.titol', 'Què vols buscar?')} accio={senseSessio ? enllacEntra : null}>
          {t('section.search.inicial.text', "Escriu un nom o unes paraules. Busquem en la gent i les entitats del teu poble, els pobles, el Mur, l'agenda, el mercat, la multimèdia i les pàgines. També en les teues notes i converses, que només veus tu: de les notes carregades, el títol, el subtítol, l'entradilla i les etiquetes (el text de dins, només de les que ja has obert); de les converses, el nom, qui hi parla i l'últim missatge.")}
        </EstatBuit>
      );
    } else if (!entrada) {
      cos = <EstatBuit icona={Search} titol={t('section.search.espai.tria', "Tria un resultat per a vore'l ací.")} />;
    } else {
      const extracte = extracteDeResultat(entrada, fitxes);
      const obri = typeof entrada.href === 'string' && isSafeUrl(entrada.href) ? entrada.href : null;
      cos = (
        <>
          <ResultatAmbCara
            titol={<Ressaltat parts={partsRessaltades(entrada.titol, fitxes)} />}
            href={entrada.href}
            meta={metaDe(entrada)}
            avis={entrada.privada ? t('section.search.privada', 'Privada: només la veus tu') : null}
            extracte={extracte ? <Ressaltat parts={partsRessaltades(extracte, fitxes)} /> : null}
            imatge={entrada.imatge}
            avatar={entrada.avatar}
            headingLevel={2}
            accio={accioDe(entrada)}
          />
          {obri ? (
            <Accions>
              <Link className="sdp-boto sdp-boto--primari" to={obri}>{t('section.search.espai.obri', 'Obri')}</Link>
            </Accions>
          ) : null}
        </>
      );
    }
    return (
      <MarcDelDetall tornaLlista={t('workspace.detall.tornaLlista', 'Tornar a la llista')}>
        {avisos}
        {cos}
      </MarcDelDetall>
    );
  }, [q, t, senseSessio, errors, carregant, total, fitxes, metaDe, accioDe]);

  return (
    <UniversalWorkspace
      idEspai="cerca"
      mestreDetall={{ clau: 'cerca', element: resultat || null }}
      model={model}
      initialSelection={{ categoryId: facetaActiva, itemId: resultat || null, query: q }}
      selection={{ categoryId: facetaActiva, itemId: resultat || null }}
      onSelectionChange={enTriar}
      labels={etiquetes}
      tagFilter={false}
      renderDetail={renderDetail}
    />
  );
}
