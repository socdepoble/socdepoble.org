/**
 * useTaxonomiaPaginaOverlay.js — IDEA-375 (v1.2.26 · Consum del port C26-3).
 *
 * Llig l'overlay de taxonomia d'una pàgina (`lligTaxonomiaPagina`) si el backend
 * declara la capacitat `taxonomiaPagines`, manté una cau reactiva en memòria per
 * actualitzar la vista a l'instant en desar i projecta l'overlay en `labels` i
 * `geografia` compatibles amb UniversalCard i UniversalPage.
 */
import { useEffect, useState } from 'react';
import { useUIActionsOpcional, useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import { lligTaxonomiaPagina, teCapacitat } from '../../data/backendPort.js';
import { labelsSistema } from '../../data/taxonomia/taxonomiaCanonica.js';
import { rutaDePindola } from '../../components/PedraSeca/organismes/rutaDePindola.js';
import { elementsTerritorialsDe } from '../../data/taxonomia/taxonomiaGeografica.js';
import { capturaIdPagina } from '../../data/taxonomia/taxonomiaPagina.js';

const cauOverlays = new Map();
const oients = new Set();

function notificaCanvi(idPagina) {
  for (const fn of oients) fn(idPagina);
}

export function registraOverlayTaxonomiaLocal(idPagina, overlay) {
  if (!idPagina) return;
  if (overlay) cauOverlays.set(idPagina, overlay);
  else cauOverlays.delete(idPagina);
  notificaCanvi(idPagina);
}

export function resetOverlaysTaxonomiaPerTests() {
  cauOverlays.clear();
  notificaCanvi(null);
}

/* objectesDeContext.test.jsx · Els objectes de context només els importen els
   .jsx del seu context: les peces de taxonomia lligen l'estat (externalConfig,
   language) i les accions (language) d'UIContext pels seus hooks públics. Dins
   d'un try, com useLlenguaDeLaUI.js: fora d'UIProvider, o amb una prova que
   simula UIContext sense eixes exportacions, null. */
export function useEstatUITaxonomia() {
  try {
    return useUIStateOpcional();
  } catch {
    return null;
  }
}

export function useAccionsUITaxonomia() {
  try {
    return useUIActionsOpcional();
  } catch {
    return null;
  }
}

export function idPaginaValidTaxonomia(id) {
  try {
    return capturaIdPagina(id);
  } catch {
    return null;
  }
}

export function projectaOverlayALabels(overlay, labelsBase = [], idioma = 'ca') {
  if (!overlay || typeof overlay !== 'object') return labelsBase;
  const sistema = labelsSistema(overlay.categoriesSistema || [], idioma);
  const tematiques = (overlay.categoriesTematiques || []).map((text) => ({
    text,
    className: 'sdp-badge-category',
    href: rutaDePindola({ text, className: 'sdp-badge-category' })
  }));
  const etiquetes = (overlay.etiquetes || []).map((text) => ({
    text,
    className: 'sdp-badge-tag',
    href: rutaDePindola({ text, className: 'sdp-badge-tag' })
  }));
  const tots = [...sistema, ...tematiques, ...etiquetes];
  return tots.length > 0 ? tots : labelsBase;
}

export function projectaOverlayATerritori(overlay, itemBase, towns = []) {
  if (overlay?.geografia && Object.values(overlay.geografia).some((l) => Array.isArray(l) && l.length > 0)) {
    return elementsTerritorialsDe(itemBase, towns, overlay.geografia);
  }
  return elementsTerritorialsDe(itemBase, towns, null);
}

export function useTaxonomiaPaginaOverlay(idPaginaCru, externalConfig = null) {
  const idPagina = idPaginaValidTaxonomia(idPaginaCru);
  const [overlay, setOverlay] = useState(() => (idPagina ? (cauOverlays.get(idPagina) ?? null) : null));
  const [versioSub, setVersioSub] = useState(0);

  useEffect(() => {
    const escolta = (canviat) => {
      if (!canviat || canviat === idPagina) {
        setOverlay(idPagina ? (cauOverlays.get(idPagina) ?? null) : null);
        setVersioSub((v) => v + 1);
      }
    };
    oients.add(escolta);
    return () => oients.delete(escolta);
  }, [idPagina]);

  useEffect(() => {
    if (!idPagina) {
      setOverlay(null);
      return undefined;
    }
    if (cauOverlays.has(idPagina)) {
      setOverlay(cauOverlays.get(idPagina));
      return undefined;
    }
    if (typeof lligTaxonomiaPagina !== 'function') return undefined;
    try {
      if (typeof teCapacitat === 'function' && !teCapacitat('taxonomiaPagines', externalConfig)) {
        return undefined;
      }
    } catch {
      return undefined;
    }
    let viu = true;
    Promise.resolve(lligTaxonomiaPagina(idPagina, externalConfig))
      .then((res) => {
        if (!viu) return;
        const fila = res?.overlay ?? res ?? null;
        if (fila && typeof fila === 'object' && Array.isArray(fila.categoriesSistema)) {
          cauOverlays.set(idPagina, fila);
          setOverlay(fila);
        }
      })
      .catch(() => {});
    return () => { viu = false; };
  }, [idPagina, externalConfig, versioSub]);

  return overlay;
}
