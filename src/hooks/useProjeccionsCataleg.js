import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUIStateOpcional } from '../app/contexts/UIContext.jsx';
import { useSessioOpcional } from '../app/contexts/SessionContext.jsx';
import { useIdentitatOReserva } from '../app/contexts/useIdentitatOReserva.js';
import { esIdentitatDeLectura } from '../app/contexts/identitatDeReserva.js';
import { backendScope, normalizeBackendConfig } from '../config/backendConfig.js';
import { appendSectionSubmissionNetworkOnly, loadProjeccionsCataleg, teCapacitat } from '../data/backendPort.js';
import { capturaSessio } from '../data/identitat.js';
import { creaServeiProjeccionsCataleg, filesDeRegistreProjeccio, registreProjeccioPendent } from '../data/projeccionsCatalegServei.js';
import { clauFontCataleg, errorProjeccioCataleg } from '../data/projeccionsCataleg.js';

const EMPTY = Object.freeze({}), NONE = Object.freeze([]);
const disponible = () => { try { return teCapacitat('projeccionsCataleg'); } catch { return false; } };

/** A lazy consumer connection; neither the root entry nor catalogue sources
 * acquire another publication store. Public reads also work without a session.
 * Account/actor changes hide old rows during render and close every listener.
 * PRODUCCIO-01 (R15b) · `escriptura: false` (el Mur i el Mercat, que només
 * lligen): el servei és lector (creaServeiProjeccionsCataleg · lectora), no
 * agafa el bloqueig d'escriptura de les altres pestanyes, no sincronitza la cua
 * i `desa` rebutja. Les referències pendents es publiquen des del catàleg.
 * PROVES-03 (R15b) · Un backend sense la capacitat 'projeccionsCataleg' no té
 * res a llegir: sense sessió no és cap lectura fallida (estat buit, sense error).
 */
export function useProjeccionsCataleg({ enabled = true, escriptura = true } = {}) {
  const ui = useUIStateOpcional(), session = useSessioOpcional(), identitat = useIdentitatOReserva();
  const config = ui?.externalConfig ?? EMPTY;
  const ownerId = session?.currentUser?.id?.toLowerCase() ?? null;
  const autoritzat = Boolean(enabled && ownerId && session?.estat === 'dins' && !esIdentitatDeLectura(identitat));
  const capacitat = enabled && disponible();
  const backendId = JSON.stringify([backendScope(config), identitat.actorKey]);
  const scopeKey = JSON.stringify([backendId, ownerId, autoritzat, capacitat, enabled, escriptura]);
  const viu = useRef(scopeKey); viu.current = scopeKey;
  const [state, setState] = useState({ scopeKey: null, projeccions: NONE, estat: 'carregant', error: null, persistent: false });
  const connexioActual = useRef(null);
  const creaConnexio = useMemo(() => () => {
    const checkSession = capturaSessio(), remote = { rows: [], ok: false }, active = new Set();
    let closed = false, queue = [], preparation = null;
    const controller = new AbortController();
    const check = () => { checkSession(); if (closed || viu.current !== scopeKey || controller.signal.aborted) throw new DOMException('Sessió canviada.', 'AbortError'); };
    const abast = autoritzat ? { tenantId: normalizeBackendConfig(config).tenantId, ownerId, backendId } : null;
    // Missing/invalid tenant is a configuration error, never a guest scope.
    let service = null, configurationError = null;
    if (abast) {
      try {
        service = creaServeiProjeccionsCataleg({ abast, comprovaSessio: check, lectora: !escriptura,
          publica: submission => appendSectionSubmissionNetworkOnly({ ...submission,
            actor: { tipus: identitat.actor?.tipus === 'entitat' ? 'entitat' : 'persona', id: identitat.actor?.id ?? identitat.actorId ?? ownerId } }, { ...config, signal: controller.signal }) });
      } catch (error) { configurationError = error; }
    }
    const publishState = error => {
      if (closed || viu.current !== scopeKey) return;
      const rows = new Map(remote.rows.map(row => [row.id, row]));
      for (const row of queue) {
        // An acknowledged cache cannot resurrect a remote deletion/revocation.
        if (remote.ok && !active.has(row.clau) && !registreProjeccioPendent(row)) continue;
        for (const item of filesDeRegistreProjeccio(row, abast)) rows.set(item.id, item);
      }
      setState({ scopeKey, projeccions: [...rows.values()], persistent: service?.persistent === true,
        estat: queue.some(registreProjeccioPendent) ? 'pendent' : error ? 'error' : 'sincronitzat', error: error ?? null });
    };
    const update = async error => {
      if (service) { const next = await service.llista(); check(); queue = next; }
      publishState(error);
    };
    const loadAudience = async audiencia => {
      const rows = [], seen = new Set(); let cursor = null;
      do {
        check();
        const page = await loadProjeccionsCataleg({ audiencia, cursor, limit: 100 }, { ...config, signal: controller.signal });
        check();
        if (!page || !Array.isArray(page.items) || (page.cursor !== null && typeof page.cursor !== 'string')) throw errorProjeccioCataleg('resposta-invalida');
        rows.push(...page.items);
        if (page.cursor !== null && (seen.has(page.cursor) || page.cursor === cursor)) throw errorProjeccioCataleg('cursor-sense-progres');
        cursor = page.cursor; seen.add(cursor);
        // Explicit failure, never silently certify a truncated collection.
        if (rows.length > 10000 || seen.size > 1000) throw errorProjeccioCataleg('colleccio-massa-gran');
      } while (cursor !== null);
      return rows;
    };
    const sync = async () => {
      check(); if (!service) throw configurationError ?? errorProjeccioCataleg('sense-permis');
      try {
        if (!capacitat) throw errorProjeccioCataleg('no-disponible');
        await service.sincronitza(); check(); await update(null);
      }
      catch (cause) {
        const error = Object.assign(errorProjeccioCataleg(cause?.codi ?? cause?.code ?? 'sincronitzacio-error', cause),
          { desatLocal: true, ...(cause?.name === 'AbortError' ? { name: 'AbortError' } : {}) });
        if (error.name !== 'AbortError') await update(error);
        throw error;
      }
    };
    return {
      check, controller,
      async prepara() {
        if (preparation) return preparation;
        preparation = (async () => {
          try {
            if (configurationError) throw configurationError;
            if (service) { await service.prepara(); queue = await service.llista(); check(); for (const row of queue) if (registreProjeccioPendent(row)) active.add(row.clau); }
            publishState(null);
            if (capacitat) {
              const rows = await Promise.all([loadAudience('publica'), ...(autoritzat ? [loadAudience('privada')] : [])]);
              check(); remote.rows = rows.flat(); remote.ok = true; publishState(null);
            }
            if (service && escriptura && queue.some(registreProjeccioPendent)) await sync();
          } catch (error) { if (error?.name !== 'AbortError') publishState(error); }
        })();
        return preparation;
      },
      async desa(font, destins) {
        await this.prepara(); check();
        if (!service || !escriptura) throw configurationError ?? errorProjeccioCataleg('sense-permis');
        const row = await service.desa(font, destins); check(); active.add(clauFontCataleg(font)); await update(null);
        await sync(); return row;
      },
      sync,
      subscriu() { return service?.subscriu(() => { update(null).catch(error => { if (error?.name !== 'AbortError') publishState(error); }); }) ?? (() => {}); },
      tanca() { closed = true; controller.abort(); service?.tanca(); }
    };
  }, [scopeKey, config, ownerId, autoritzat, backendId, identitat.actor, identitat.actorId, capacitat, escriptura]);
  useEffect(() => {
    if (!enabled) return undefined;
    const connection = creaConnexio();
    connexioActual.current = { scopeKey, connection };
    const unsubscribe = connection.subscriu();
    connection.prepara();
    const online = () => { if (autoritzat && escriptura) connection.sync().catch(() => {}); };
    globalThis.window?.addEventListener('online', online);
    return () => { unsubscribe(); globalThis.window?.removeEventListener('online', online); connection.tanca(); if (connexioActual.current?.connection === connection) connexioActual.current = null; };
  }, [creaConnexio, autoritzat, scopeKey, enabled, escriptura]);
  const desa = useCallback((font, destins) => {
    const actual = connexioActual.current;
    if (!actual || actual.scopeKey !== scopeKey) return Promise.reject(errorProjeccioCataleg('sense-permis'));
    return actual.connection.desa(font, destins);
  }, [scopeKey]);
  return { ...(enabled && state.scopeKey === scopeKey ? state : { projeccions: NONE, estat: enabled ? 'carregant' : 'inactiu', error: null, persistent: false }), desa, autoritzat, ownerId };
}
