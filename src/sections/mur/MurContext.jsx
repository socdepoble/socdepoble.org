import { backendScope } from '../../config/backendConfig.js';
import { useScopedResource } from '../../app/contexts/useScopedResource.js';
import React, { createContext, useCallback, useContext, useMemo, useLayoutEffect, useRef, useState } from 'react';
import { loadMur, loadSeccioPage, appendSectionSubmissionNetworkOnly, teCapacitat } from '../../data/backendPort.js';
import { SECCIONS_PAGINABLES } from '../../data/contracte.js';
import { sortPinnedContent } from '../../config/contentHelpers';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useRecarregaExterna } from '../../app/contexts/useRecarregaExterna.jsx';

import { useSession } from '../../app/contexts/SessionContext.jsx';

const MurContext = createContext(null);

/* ── Decisió 4 del Mestre (261007) · «Tall de 50 publicacions: CARREGA
   PROGRESSIVA (LOAD MORE). Un límit inicial de 50 és sa, però s'ha
   d'implementar un botó de "Carregar-ne més" o infinite scroll per a no
   deixar l'usuari a mitges.» (ADR-2026-11-PAGINACIO-SECCIONS)
   La primera pàgina continua sent la de loadMur (useScopedResource). Les
   següents (loadSeccioPage, capacitat 'paginacioSeccions') es guarden ací,
   per secció, amb el seu cursor. Dos regles, les de la Decisió 2:
   · AÏLLAMENT (backend, persona, actor, configuració): les pàgines extres i
     els cursors són de l'àmbit on s'han carregat. Un canvi d'àmbit les amaga
     en el mateix pintat (com el payload) i les buida en l'efecte de l'àmbit
     (com useScopedResource), avorta la petició en vol i descarta qualsevol
     resposta que arribe tard.
   · FRESCOR (renovació del JWT, refresh després de publicar): la primera
     pàgina nova es fusiona per id amb les extres, que es conserven. Si la cua
     de la primera pàgina no ha canviat (el mateix cursor), «Mostra més»
     continua des de la pàgina més fonda; si ha canviat (publicacions noves
     que n'han empès d'altres avall), torna a partir de la cua nova, perquè
     cap publicació empesa quede sense camí, i les empeses que ja es veien
     no se'n van del mig de la llista (extresVigents). Els duplicats es
     fusionen per id.
   Límit conegut (ADR): les pàgines extres no es revaliden; una publicació
   esborrada en una d'elles continua fins al canvi d'àmbit o la recàrrega. ── */
const SENSE_PAGINES = Object.freeze({});
const SENSE_ESTAT = Object.freeze({ ambit: null, seccions: SENSE_PAGINES });

/* Com SessionContext (teCapacitatSegura): un port sense adaptador encara
   instal·lat és «sense capacitat», mai una excepció en pintar. */
function potPaginar() {
  try { return teCapacitat('paginacioSeccions') === true; } catch { return false; }
}

/* El cursor de la primera pàgina d'una secció (el camp additiu `paginacio`
   de loadMur, contracte.js). */
function cursorDeLaPrimera(payload, seccio) {
  const cursor = payload?.paginacio?.[seccio];
  return typeof cursor === 'string' && cursor ? cursor : null;
}

/* La primera pàgina mana; de les extres, només les que no hi són. */
function ambExtres(primera, extres) {
  if (!extres?.length) return primera;
  const ids = new Set(primera.map((element) => String(element?.id)));
  const noves = extres.filter((element) => !ids.has(String(element?.id)));
  return noves.length ? [...primera, ...noves] : primera;
}

/* Una pàgina nova damunt de les extres: sense duplicats; la versió nova
   mana i cada element conserva el lloc on va aparéixer primer. */
function afegixPagina(extres = [], pagina = []) {
  const perId = new Map(extres.map((element) => [String(element?.id), element]));
  for (const element of pagina) perId.set(String(element?.id), element);
  return [...perId.values()];
}

/* Relleu 261008 (revisió adversarial) · Decisions 2 i 4 · Les extres que es
   veuen d'una secció. Amb la mateixa cua de la primera pàgina, les desades.
   Si una revalidació de FRESCOR ha mogut la cua (publicacions noves dalt),
   també la primera pàgina del moment en què es van desar: les que la nova ha
   empés avall ja no eren a la primera ni a cap extra, i desapareixien del mig
   de la llista fins al clic següent. Tenen el límit de les extres (no es
   revaliden), i només cobrix les empeses per menys de 50 publicacions noves
   entre dos clics: la resta torna amb el «Mostra més» següent (ADR). */
function extresVigents(extra, base) {
  if (!extra) return [];
  return extra.base === base ? (extra.elements ?? []) : afegixPagina(extra.primera, extra.elements);
}

export function MurProvider({ children, config }) {
  const { actorId, actorKey, actor } = useIdentitat();
  const { currentUser } = useSession();
  /* Decisió 2 del Mestre (261007) · Renovació silenciosa del Mur, el Mercat i
     el Calendari. La clau d'àmbit és la d'AÏLLAMENT (backend, persona, actor),
     sense `generacio`: renovar el JWT ja no buida les targetes ni pinta
     «Carregant»; useScopedResource conserva el payload en 'ready' i el torna a
     demanar en segon pla. L'`operation` de publicar hereta esta clau: una
     renovació ja no avorta una publicació en vol (l'AbortError fals de Notes),
     i un canvi real de persona, actor o backend l'avorta com sempre. */
  const scopeKey = JSON.stringify([backendScope(config),
    currentUser?.id, actorKey]);
  const data = useScopedResource(loadMur, actorId, scopeKey, config);
  /* Decisió 2 · Pendent del relleu, aplicat amb la peça de paginació: el
     valor es memoritza sobre camps i no sobre `data`, com a Core i
     Multimèdia. La marca `revalidant` fa un `data` nou en cada renovació i
     cada refresh, i amb `[data]` es tornava a pintar cada consumidor de
     useMur sense cap dada nova. `revalidant` no s'exposa (cap consumidor no
     la llig); `errorRevalidacio` sí, a banda de `status`. */
  const { status, payload, error, errorRevalidacio, refresh } = data;

  /* I2 · Qui signa la publicació: la identitat activa. El port en trau
     author_org_id quan és una entitat; el servidor ho torna a comprovar. */
  const actorTipus = actor?.tipus === 'entitat' ? 'entitat' : 'persona';
  const actorSignant = actor?.id ?? actorId ?? null;
  const autoria = useMemo(() => ({ tipus: actorTipus, id: actorSignant }), [actorTipus, actorSignant]);

  const operation = useMemo(() => ({ scopeKey, config }), [scopeKey, config]);
  const currentOperation = useRef(null);
  useLayoutEffect(() => {
    currentOperation.current = operation;
    return () => { if (currentOperation.current === operation) currentOperation.current = null; };
  }, [operation]);

  /* Auditoria 261007 (B) · Publicar no depén de la LECTURA del Mur.
     appendSectionSubmissionNetworkOnly no usa cap dada del payload: l'única
     guarda del client és l'àmbit (currentOperation) i la RLS del servidor
     decidix si es pot escriure. Abans el mètode real només existia amb el
     Mur 'ready', i publicar des de Notes fallava mentre el Mur carregava
     (també just després de cada publicació, pel refresh) o si la lectura
     havia fallat. El callback ara és estable entre 'loading' i 'ready'.
     `refresh` ja és estable (useScopedResource.js). */
  const sendSectionSubmission = useCallback(async (sub) => {
    const assertCurrent = () => {
      if (currentOperation.current !== operation) throw new DOMException('Sessió canviada.', 'AbortError');
    };
    assertCurrent();
    const saved = await appendSectionSubmissionNetworkOnly({ ...sub, actor: autoria }, config);
    assertCurrent();
    refresh();
    return saved;
  }, [operation, config, autoria, refresh]);

  /* Decisió 4 · L'àmbit d'AÏLLAMENT de les pàgines extres: el mateix que
     buida useScopedResource (la clau d'àmbit, la configuració i l'actor de la
     petició). El controlador viu amb l'àmbit: un canvi l'avorta. */
  const ambit = useMemo(() => ({ scopeKey, config, actorId }), [scopeKey, config, actorId]);
  const ambitViu = useRef(null);
  const [pagines, setPagines] = useState(SENSE_ESTAT);
  useLayoutEffect(() => {
    const controlador = new AbortController();
    ambitViu.current = { ambit, senyal: controlador.signal };
    /* Relleu 261008 (revisió adversarial) · AÏLLAMENT · Les extres de l'àmbit
       vell (carregades amb el JWT d'una altra persona, actor o backend) no
       es queden en memòria fins al pròxim «Mostra més»: es buiden ací, com
       useScopedResource purga el seu estat en l'efecte. El mateix àmbit (el
       primer muntatge, el doble efecte de StrictMode) no canvia res. */
    setPagines((previ) => (previ.ambit === null || previ.ambit === ambit ? previ : SENSE_ESTAT));
    return () => {
      controlador.abort();
      if (ambitViu.current?.ambit === ambit) ambitViu.current = null;
    };
  }, [ambit]);

  const paginable = potPaginar();
  // Les extres d'un altre àmbit no es pinten mai, ni un sol pintat.
  const extres = pagines.ambit === ambit ? pagines.seccions : SENSE_PAGINES;
  const llest = status === 'ready' && Boolean(payload);

  /* Per secció: els elements (primera pàgina + extres), el cursor de la
     pàgina següent i l'estat de la càrrega. */
  const seccions = useMemo(() => Object.fromEntries(Object.entries(SECCIONS_PAGINABLES).map(([seccio, clau]) => {
    if (!llest) return [seccio, { elements: [], primera: [], cursor: null, base: null, carregant: false, error: null }];
    const primera = payload[clau] || [];
    const base = paginable ? cursorDeLaPrimera(payload, seccio) : null;
    const extra = extres[seccio];
    if (!extra) return [seccio, { elements: primera, primera, cursor: base, base, carregant: false, error: null }];
    const mateixaCua = extra.base === base;
    return [seccio, {
      elements: ambExtres(primera, extresVigents(extra, base)),
      primera,
      cursor: mateixaCua ? extra.cursor : base,
      base,
      carregant: extra.carregant,
      /* Relleu 261008 (revisió adversarial) · L'error és del cursor que ha
         fallat. Amb una cua nova, o cap (la secció ha quedat completa), ja no
         queda res d'eixe cursor per reintentar: l'avís se'n va, i no es
         queda per sempre amb un «Torna-ho a provar» que no fa res. */
      error: mateixaCua ? extra.error : null
    }];
  })), [llest, payload, paginable, extres]);

  const seccionsVives = useRef(seccions);
  useLayoutEffect(() => { seccionsVives.current = seccions; }, [seccions]);
  const enCurs = useRef(new Map());

  /* Decisió 4 · Carrega la pàgina següent d'una secció ('mur', 'events',
     'mercat'). Resol true si l'ha afegida i false si no hi havia res a
     carregar, ja en carregava una, ha fallat (l'error queda a errorMes) o
     l'àmbit ha canviat entretant (la resposta es descarta). Mai rebutja. */
  const carregaMes = useCallback(async (seccio) => {
    const viu = ambitViu.current;
    const estat = seccionsVives.current?.[seccio];
    if (!Object.hasOwn(SECCIONS_PAGINABLES, seccio) || !viu || viu.ambit !== ambit || !estat?.cursor || !potPaginar()) return false;
    if (enCurs.current.get(seccio) === ambit) return false;
    enCurs.current.set(seccio, ambit);
    const { cursor, base, primera } = estat;
    const posa = (canvi) => setPagines((previ) => {
      const actuals = previ.ambit === ambit ? previ.seccions : SENSE_PAGINES;
      return { ambit, seccions: { ...actuals, [seccio]: canvi(actuals[seccio]) } };
    });
    /* Mentre carrega, el cursor és el mateix: el botó continua, desactivat.
       Relleu 261008 · Les extres que es veuen ara (extresVigents, amb les
       empeses avall si la cua ha canviat) passen a ser les desades, amb la
       primera pàgina d'ara: la pròxima revalidació partix d'ací. */
    posa((previ) => ({ elements: extresVigents(previ, base), primera, cursor, base, carregant: true, error: null }));
    try {
      const pagina = await loadSeccioPage({ seccio, cursor, signal: viu.senyal }, config);
      if (ambitViu.current?.ambit !== ambit) return false;
      if (!Array.isArray(pagina?.elements) || typeof pagina.complete !== 'boolean') throw new Error('Pàgina de la secció amb un format inesperat.');
      posa((previ) => ({ ...previ, elements: afegixPagina(previ?.elements, pagina.elements),
        cursor: pagina.complete ? null : (pagina.nextCursor || null), carregant: false, error: null }));
      return true;
    } catch (errorDeCarrega) {
      if (ambitViu.current?.ambit !== ambit) return false;
      posa((previ) => ({ ...previ, carregant: false, error: errorDeCarrega }));
      return false;
    } finally {
      if (enCurs.current.get(seccio) === ambit) enCurs.current.delete(seccio);
    }
  }, [ambit, config]);

  /* Decisió 4 · hiHaMes ja inclou teCapacitat('paginacioSeccions'): sense la
     capacitat, cap secció en té més i la interfície no pinta el botó. */
  const hiHaMes = useCallback((seccio) => paginable && Boolean(seccions[seccio]?.cursor), [paginable, seccions]);
  const carregantMes = useCallback((seccio) => seccions[seccio]?.carregant === true, [seccions]);
  const errorMes = useCallback((seccio) => seccions[seccio]?.error ?? null, [seccions]);

  const value = useMemo(() => {
    const { mur, events, mercat } = seccions;
    return {
      status,
      error,
      errorRevalidacio,
      feedPosts: mur.elements,
      events: events.elements,
      marketItems: mercat.elements,
      sortedFeedPosts: sortPinnedContent(mur.elements),
      sortedEvents: sortPinnedContent(events.elements),
      sortedMarketItems: sortPinnedContent(mercat.elements),
      sendSectionSubmission,
      refresh,
      carregaMes,
      hiHaMes,
      carregantMes,
      errorMes
    };
  }, [status, error, errorRevalidacio, seccions, sendSectionSubmission, refresh, carregaMes, hiHaMes, carregantMes, errorMes]);

  useRecarregaExterna(refresh);

  return <MurContext.Provider value={value}>{children}</MurContext.Provider>;
}

export function useMur() {
  return useContext(MurContext) || {
    status: 'loading', feedPosts: [], events: [], marketItems: [], sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: [],
    sendSectionSubmission: async () => { throw new Error('El Mur no està llest o no té dades disponibles.'); },
    carregaMes: async () => false, hiHaMes: () => false, carregantMes: () => false, errorMes: () => null
  };
}
