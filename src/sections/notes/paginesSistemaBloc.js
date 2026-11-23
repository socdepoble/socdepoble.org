/**
 * paginesSistemaBloc.js — R32.44 · IDEA-324 (part A) · Catàleg complet de les
 * pàgines de Sistema (`PAGE_COPY` + `core.pageCopy`) dins la carpeta `Sistema`
 * (`f-sistema`) del Workspace de l'entitat pilot `Sóc de Poble`.
 *
 *   · Cap pàgina nova s'afig al Mur públic (`D-IDEA-317`): totes viuen sota
 *     `seccio: 'sistema'` (`publicacio:sistema:<clau>`), separades del mirall
 *     de lectura de `f-mur` (`publicacio:mur:<clau>`).
 *   · Zero filtracions a comptes personals o altres entitats: només s'activa
 *     quan `esAliesDelProjecte(alies) === true`.
 *   · `PAGE_COPY` s'importa en diferit només quan l'actor actiu és `Sóc de Poble`,
 *     per no sumar ni un byte a l'arrencada síncrona.
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { resolvePageSlugPath } from '../../config/navigation.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { esPaginaVisible, SYSTEM_PAGES } from '../../config/systemPages.js';
import { ENTITAT_PILOT_ID } from '../../data/identitatsSeed.js';
import {
  revisaPaginaSistema,
  subscriuRevisionsEditorials,
  versioRevisionsEditorials
} from '../../data/revisionsEditorialsDelNavegador.js';
import { paginaPerAppNativa } from '../text/perAppNativa.js';
import { publicacioComANota } from './masDeLUsuari.js';

const CAP = Object.freeze([]);
let copiaLocalCache = null;
let promesaCopiaLocal = null;

function carregaCopiaLocal() {
  if (copiaLocalCache) return Promise.resolve(copiaLocalCache);
  if (!promesaCopiaLocal) {
    promesaCopiaLocal = import('../text/pageContent.js')
      .then((modul) => {
        copiaLocalCache = modul.PAGE_COPY || {};
        return copiaLocalCache;
      })
      .catch(() => null)
      .finally(() => { promesaCopiaLocal = null; });
  }
  return promesaCopiaLocal;
}

/** Ruta canònica pública d'una clau de `PAGE_COPY`. */
export function rutaCanonicaDePaginaSistema(clau) {
  const sys = SYSTEM_PAGES.find((item) => item.key === clau);
  if (sys?.href) return sys.href;
  return resolvePageSlugPath(clau) || `/page/${encodeURIComponent(clau)}`;
}

/**
 * Converteix un mapa de pàgines (`PAGE_COPY` fusionat amb `core.pageCopy`) en
 * els elements editables de la carpeta `f-sistema` per a `Sóc de Poble`.
 */
export function itemsDePaginesSistema(catalegPagines, { nativa = esAppNativa(), locale = 'ca-ES' } = {}) {
  if (!catalegPagines || typeof catalegPagines !== 'object') return CAP;
  const clausSistema = SYSTEM_PAGES.map((p) => p.key);
  const restants = Object.keys(catalegPagines).filter((k) => !clausSistema.includes(k));
  const ordre = [...clausSistema, ...restants];
  const eixida = [];

  for (const clau of ordre) {
    if (!Object.hasOwn(catalegPagines, clau)) continue;
    if (!esPaginaVisible(clau, { nativa })) continue;
    const base = paginaPerAppNativa(catalegPagines[clau], { nativa });
    if (!base || typeof base !== 'object') continue;
    const revisada = revisaPaginaSistema(clau, base);
    const mainHref = rutaCanonicaDePaginaSistema(clau);
    const baseItem = {
      ...base,
      id: clau,
      created_at: base.date,
      date: undefined,
      isSystemPage: true,
      mainHref,
      author_org_id: ENTITAT_PILOT_ID,
      author_name: 'Sóc de Poble'
    };
    const nota = publicacioComANota({
      ...revisada,
      id: clau,
      created_at: revisada.date,
      date: undefined,
      isSystemPage: true,
      mainHref,
      author_org_id: ENTITAT_PILOT_ID,
      author_name: 'Sóc de Poble'
    }, 'sistema', { locale });
    eixida.push({
      ...nota,
      data: { ...nota.data, baseCanonica: baseItem }
    });
  }

  return eixida.length ? Object.freeze(eixida) : CAP;
}

/** Hook reactiu per a `NotesSection`: retorna `{ items, status }` només quan `actiu === true`. */
export function usePaginesSistemaDelBloc(actiu, { forcat = false } = {}) {
  const core = useCoreContent();
  const teProveidorCore = forcat
    || typeof core?.refresh === 'function'
    || core?.status === 'ready'
    || Boolean(core?.pageCopy && Object.keys(core.pageCopy).length);
  const habilitat = Boolean(actiu && teProveidorCore);
  const versioRevisions = useSyncExternalStore(
    subscriuRevisionsEditorials,
    versioRevisionsEditorials,
    versioRevisionsEditorials
  );
  const [copiaLocal, setCopiaLocal] = useState(() => copiaLocalCache);
  const [errorCopia, setErrorCopia] = useState(false);

  useEffect(() => {
    if (!habilitat || copiaLocal) return undefined;
    let cancel = false;
    carregaCopiaLocal().then((resultat) => {
      if (cancel) return;
      if (resultat) setCopiaLocal(resultat);
      else setErrorCopia(true);
    });
    return () => { cancel = true; };
  }, [habilitat, copiaLocal]);

  const coreCarregant = typeof core?.refresh === 'function' && core.status === 'loading';
  const carregant = habilitat && (coreCarregant || (!copiaLocal && !errorCopia && !Object.keys(core?.pageCopy || {}).length));

  const items = useMemo(() => {
    void versioRevisions;
    if (!habilitat) return CAP;
    const pageCopy = core?.pageCopy && typeof core.pageCopy === 'object' ? core.pageCopy : {};
    const fusionat = copiaLocal ? { ...copiaLocal, ...pageCopy } : pageCopy;
    if (!Object.keys(fusionat).length) return CAP;
    return itemsDePaginesSistema(fusionat);
  }, [habilitat, copiaLocal, core?.pageCopy, versioRevisions]);

  return {
    items,
    status: !habilitat ? 'ready' : carregant ? 'loading' : 'ready'
  };
}
