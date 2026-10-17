import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  loadNotes,
  updateNote as apiUpdateNote,
  createNote as apiCreateNote,
  mouNota as apiMouNota,
  esborraNota as apiEsborraNota,
  getCurrentUser,
  getDefaultUserId,
  getRuntimeDataMode
} from '../../data/backendPort.js';

import { backendScope } from '../../config/backendConfig.js';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useSession } from '../../app/contexts/SessionContext.jsx';

let _hostPromise = null;
function assegurarHost(signal) {
  if (!_hostPromise) {
    _hostPromise = import('../../host.js').catch(err => {
      _hostPromise = null;
      throw err;
    });
  }
  return _hostPromise.then(hostModule => {
    const quanLlestFn = hostModule.quanLlest || (hostModule.default && hostModule.default.quanLlest);
    return quanLlestFn({ signal }).then(() => hostModule);
  });
}
import { useRecarregaExterna } from '../../app/contexts/useRecarregaExterna.jsx';
import { getDraftsForScope, draftFields, bgSaveManager } from './GlobalSaveManager.js';
import { entradaSessio } from '../../data/identitat.js';

const NotesDataContext = createContext(null);

const unavailable = async () => {
  throw new Error('El bloc de notes encara no està disponible.');
};

const BUIT = {
  status: 'loading',
  error: null,
  scopeKey: null,
  workspaceKey: null,
  notes: [],
  noteFolders: [],
  notesComplete: false,
  resolveNote: unavailable,
  updateNote: unavailable,
  creaNota: unavailable,
  mouNota: unavailable,
  esborraNota: unavailable,
  activate: () => () => {},
  refresh: () => {}
};

function abortError() {
  return new DOMException('Operació cancel·lada.', 'AbortError');
}

function applyDraft(note, drafts) {
  const draft = drafts?.[note.id];
  if (!draft) return note;

  const fields = draftFields(draft);
  // D01 · Un esborrany començat sobre una revisió anterior no es fusiona en
  // silenci: es mostra (és feina de la persona), però marcat, perquè la UI
  // demane una decisió explícita abans de sobreescriure res. Els esborranys
  // antics sense _baseRevision prenen la remota com a base: cap conflicte nou.
  const base = Number(draft._baseRevision ?? note.revision ?? 0);
  const remota = Number(note.revision ?? 0);
  /* T47 (ordre del Mestre, 260928) · Un camp en quarantena (_quarantena: el
     servidor no té la columna, p. ex. l'emoticona sense migració) no ha
     arribat mai al servidor: es mostra, però no obri cap conflicte. */
  const quarantena = new Set(Array.isArray(draft._quarantena) ? draft._quarantena : []);
  if (Object.keys(fields).some(camp => !quarantena.has(camp)) && base < remota) {
    return { ...note, ...fields, draftConflict: { baseRevision: base, remoteRevision: remota } };
  }
  return { ...note, ...fields };
}

/* T47b (ordre del Mestre, 260928) · L'adaptador marca amb `campsNoDesats` els
   camps que el servidor encara no admet (columna absent, p. ex. l'emoticona).
   La nota de la llista conserva el valor que la persona hi ha posat (la cua el
   guarda a l'esborrany) i no s'emporta la marca. */
function ambNoDesats(nota, entrada) {
  const noDesats = nota?.campsNoDesats;
  if (!Array.isArray(noDesats)) return nota;
  const neta = { ...nota };
  delete neta.campsNoDesats;
  for (const camp of noDesats) {
    if (entrada?.[camp] !== undefined) neta[camp] = entrada[camp];
  }
  return neta;
}

/* Un esborrany amb camps i sense conflicte D01: el servidor encara no el té i
   es pot tornar a enviar sense preguntar res a la persona. */
const esborranyPerReprendre = (note, drafts) => {
  const draft = drafts?.[note.id];
  if (!draft || !Object.keys(draftFields(draft)).length) return false;
  return !applyDraft(note, drafts).draftConflict;
};

/* Un camp que el resum no porta es conserva del detall; si el resum el porta
   (la fila en té la columna), mana el resum. */
const detallFora = (local, remote, camp) => (
  !Object.hasOwn(remote, camp) && local[camp] !== undefined ? { [camp]: local[camp] } : {}
);

function mergeNotes(current, incoming, complete = false) {
  const remaining = new Map(
    current.map((note) => [String(note.id), note])
  );

  const merged = incoming.map((remote) => {
    const id = String(remote.id);
    const local = remaining.get(id);
    remaining.delete(id);

    if (local && local.revision > remote.revision) return local;
    // Una pàgina de resums no elimina un detall de la mateixa revisió: ni el
    // cos ni l'origen (T5), que només viatgen en resoldre per id. Tampoc
    // l'emoticona (T23) ni la data de publicació (T40): no són a
    // SUMMARY_COLUMNS i, sense elles, publishNote publicaria sense la data.
    if (local && local.revision === remote.revision && remote.contentLoaded === false
        && local.contentLoaded !== false) {
      return {
        ...remote,
        ...detallFora(local, remote, 'icon'),
        ...detallFora(local, remote, 'publishDate'),
        content: local.content, contentLoaded: true, origen: local.origen ?? remote.origen ?? null
      };
    }
    return remote;
  });

  return complete ? merged : [...merged, ...remaining.values()];
}

export function NotesDataProvider({ children, config }) {
  const { actorKey } = useIdentitat();
  const { estat, currentUser } = useSession();

  // Preserve personal draft keys; shared entity actors also need the auth user.
  const draftActor = actorKey === `persona::${currentUser?.id}`
    ? actorKey : `${currentUser?.id || 'anonymous'}_${actorKey}`;
  const scopeKey =
    `${backendScope(config)}_${draftActor}_`
    + `${config?.tenantId || 'global'}`;

  /* T47b (ordre del Mestre, 260928) · L'àmbit és l'ENTRADA de sessió, no la
     generació del servei, com a PerfilProvider: la renovació del JWT que fa
     SdP amb el seu refresh token (desaSessio amb `renovacio`) mou la
     generació però és la mateixa sessió. Abans buidava la llista, esborrava el
     que s'estava escrivint (overrides de NotesContext) i remuntava l'editor
     (NotesEditor fa servir workspaceKey de clau). Eixir, tornar a entrar o
     canviar de compte mouen l'entrada: ací sí que canvia tot. useSession fa
     que es torne a calcular en cada canvi de sessió.
     PENDENT (no resolt ací): en mode incrustat, l'amfitrió sense refresh token
     torna a injectar la sessió abans de `exp` (host.js, injectaSessio), i
     identitat.desaSessio compta cada injecció com una entrada nova, també la
     del mateix `sub`. Eixa reinjecció SÍ que mou workspaceKey i remunta
     l'editor; el text no es perd (és a l'esborrany), però un desat en curs
     torna AbortError i pot eixir un D01 fals. Ho fixa
     NotesDataContext.amfitrio.test.jsx; arreglar-ho és cosa d'identitat.js. */
  const entrada = entradaSessio();
  const workspaceKey = JSON.stringify([scopeKey, entrada]);

  /* Auditoria 261007 (B) · La càrrega espera la sessió resolta, però no la
     consulta del rol. L'`estat` efectiu de useSession passa a 'comprovant'
     també amb la persona ja dins i el rol 'desconegut' (cada renovació del
     JWT): com a dependència, la càrrega s'avortava i tornava a recórrer totes
     les pàgines en cada renovació. Sense usuari (la restauració de D6)
     continua esperant; quan arriba, l'entrada i el token canvien igual que
     abans. */
  const sessioResolta = estat !== 'comprovant' || Boolean(currentUser?.id);

  // Una resposta antiga no pot entrar en una sessió nova,
  // encara que després tornem al mateix tenant i actor.
  const token = useMemo(
    () => ({ scopeKey, entrada, config }),
    [scopeKey, entrada, config]
  );

  /* L'updateNote de l'operació viva, per a reprendre esborranys des de la càrrega. */
  const updateNoteRef = useRef(null);
  const operationRef = useRef(null);
  const loadGen = useRef(0);
  const [tick, setTick] = useState(0);
  const [consumers, setConsumers] = useState(0);
  const activate = useCallback(() => {
    setConsumers(value => value + 1);
    return () => setConsumers(value => value - 1);
  }, []);
  /* Auditoria 261007 (B) · Qui mira el Bloc (/notes) no és dependència de la
     càrrega: com a dependència, eixir de /notes tornava a demanar la pàgina 0
     perquè no la mirara ningú. La càrrega llig el nombre de consumidors per
     una ref (per a saber si seguix paginant) i, de qui mira el Bloc, només
     depén d'`activacions`, que puja quan es passa de cap consumidor a algun
     (el flanc de baixada no la toca). Entrar a /notes, doncs, continua
     revalidant des de la pàgina 0 i recorrent-les totes, com abans (el
     «Carregant…» del Bloc buit i el que ha canviat en un altre dispositiu es
     continuen veient); eixir-ne ja no demana res. */
  const consumersRef = useRef(0);
  const [activacions, setActivacions] = useState(0);
  const ambConsumidors = consumers > 0;
  useLayoutEffect(() => { consumersRef.current = consumers; }, [consumers]);
  useEffect(() => {
    if (ambConsumidors) setActivacions(value => value + 1);
  }, [ambConsumidors]);

  const [data, setData] = useState({
    token: null,
    status: 'loading',
    error: null,
    payload: null
  });

  useLayoutEffect(() => {
    const operation = { token };
    operationRef.current = operation;

    return () => {
      if (operationRef.current === operation) {
        operationRef.current = null;
      }
    };
  }, [token]);

  useEffect(() => {
    const operation = operationRef.current;
    const generation = ++loadGen.current;
    const controller = new AbortController();

    const isCurrent = () =>
      !controller.signal.aborted
      && operationRef.current === operation
      && generation === loadGen.current;

    /* T47b (ordre del Mestre, 260928) · Un esborrany sense conflicte que el
       servidor encara no té (una pestanya tancada abans de confirmar, un
       reintent que no va arribar) ix ja, sense esperar cap tecla. Abans
       applyDraft el pintava i ningú l'enviava. Els que tenen draftConflict
       esperen la decisió de la persona (D01). */
    const reprenEsborranys = (remotes, drafts) => {
      const update = updateNoteRef.current;
      if (!update || !isCurrent()) return;
      for (const remote of remotes) {
        if (!esborranyPerReprendre(remote, drafts)) continue;
        try {
          bgSaveManager.repren(scopeKey, remote.id, { update, getBase: () => ({ revision: remote.revision }) });
        } catch (error) {
          console.warn('[Notes] No s’ha pogut reprendre un esborrany:', error);
        }
      }
    };

    setData((previous) => ({
      token,
      status: previous.token === token && previous.payload
        ? 'revalidating'
        : 'loading',
      error: null,
      payload: previous.token === token ? previous.payload : null
    }));

    const informa = (error) => {
      // Una càrrega cancel·lada (doble muntatge de StrictMode, canvi d'àmbit) no és cap error.
      if (error?.name === 'AbortError') return;
      console.error('[Notes] No s’ha pogut carregar el Bloc de Notes:', error);
      if (!isCurrent()) { return; }

      setData((previous) => previous.token === token
        ? { ...previous, status: 'error', error }
        : previous
      );
    };

    let ownerId = null;
    let drafts = null;
    let collected = [];
    let pagines = 0;
    const seen = new Set();

    /* Recorre les pàgines des de la 0 mentre algú mire el Bloc. Sense cap
       consumidor s'atura després de la pàgina rebuda (Auditoria 261007 (B):
       ho llig de consumersRef, no d'una dependència de l'efecte). */
    async function recorre() {
      let cursor = null;
      for (;;) {
        if (cursor !== null) {
          if (seen.has(cursor)) throw new Error('El cursor de Notes no avança.');
          seen.add(cursor);
        }
        // Pressupost de recorregut: 1.024 pàgines, mai un bucle sense final.
        if (pagines >= 1024) throw new Error('S’ha arribat al límit de pàgines de Notes; cal acotar la consulta.');
        pagines += 1;
        const payload = await loadNotes(ownerId, {
          ...config, ...(cursor === null ? {} : { cursor }), signal: controller.signal
        });
        if (!isCurrent()) return;
        if (!Array.isArray(payload?.notes)) throw new Error('Resposta de Notes amb un format inesperat.');
        collected = mergeNotes(collected, payload.notes.map(note => applyDraft(note, drafts)));
        setData(previous => {
          if (!isCurrent() || previous.token !== token) return previous;
          return { token, status: 'ready', error: null, payload: {
            ...payload,
            notes: mergeNotes(previous.payload?.notes || [], collected, payload.notesComplete === true)
          } };
        });
        reprenEsborranys(payload.notes, drafts);
        if (payload.notesComplete === true || payload.nextCursor == null || !consumersRef.current) return;
        cursor = payload.nextCursor;
      }
    }

    async function load() {
      if (!sessioResolta) return; // espera la sessió (D6), no el rol

      try {
        await assegurarHost(controller.signal);

        if (!isCurrent()) return;

        // El cami `seed` serveix contingut d'exemple sense mirar la sessio.
        // El guarda d'aci baix nomes te sentit quan les dades son remotes.
        ownerId = getCurrentUser()?.id
          || (getRuntimeDataMode(config) !== 'remote' ? getDefaultUserId() : null);
        if (!ownerId) {
          setData((previous) => {
            if (!isCurrent() || previous.token !== token) return previous;
            return {
              token,
              status: 'ready',
              error: null,
              payload: { notes: [], noteFolders: [], notesComplete: true }
            };
          });
          return;
        }

        drafts = await getDraftsForScope(scopeKey);
        if (!isCurrent()) return;
        await recorre();
      } catch (error) {
        informa(error);
      }
    }

    void load();
    return () => controller.abort();
  }, [token, tick, activacions, config, scopeKey, sessioResolta]);

  const refresh = useCallback(() => {
    if (operationRef.current?.token !== token) return;

    setData((previous) => previous.token === token
      ? {
          ...previous,
          status: previous.payload ? 'revalidating' : 'loading',
          error: null
        }
      : previous
    );

    setTick((value) => value + 1);
  }, [token]);

  const resolveNote = useCallback(async (id, { signal } = {}) => {
    const requestedId = String(id);
    const operation = operationRef.current;

    const assertCurrent = () => {
      if (
        signal?.aborted
        || !operation
        || operation.token !== token
        || operationRef.current !== operation
      ) {
        throw abortError();
      }
    };

    assertCurrent();

    await assegurarHost(signal);

    assertCurrent();

    const userId = getCurrentUser()?.id || (getRuntimeDataMode(config) !== 'remote' ? getDefaultUserId() : null);
    if (!userId) {
      return { status: 'not-found' };
    }

    const payload = await loadNotes(userId, {
      ...config,
      noteId: requestedId,
      signal
    });

    assertCurrent();

    const resolution = payload?.noteResolution;

    if (
      resolution?.id !== requestedId
      || !['found', 'not-found'].includes(resolution.status)
      || !Array.isArray(payload.notes)
    ) {
      throw new Error(
        'El backend no implementa el contracte de resolució per ID.'
      );
    }

    const remoteNote = payload.notes.find(
      (note) => String(note.id) === requestedId
    );

    if (resolution.status === 'not-found') {
      if (remoteNote) {
        throw new Error('Resposta contradictòria en resoldre la nota.');
      }

      return { status: 'not-found' };
    }

    if (!remoteNote) {
      throw new Error('El backend declara una nota que no ha retornat.');
    }

    const drafts = await getDraftsForScope(scopeKey);
    assertCurrent();

    const note = applyDraft(remoteNote, drafts);

    /* T47b · El detall d'una nota fora de la primera pàgina també repren el seu esborrany. */
    if (updateNoteRef.current && esborranyPerReprendre(remoteNote, drafts)) {
      try {
        bgSaveManager.repren(scopeKey, remoteNote.id, {
          update: updateNoteRef.current, getBase: () => ({ revision: remoteNote.revision })
        });
      } catch (error) {
        console.warn('[Notes] No s’ha pogut reprendre un esborrany:', error);
      }
    }

    setData((previous) => {
      if (
        signal?.aborted
        || operationRef.current !== operation
        || previous.token !== token
      ) {
        return previous;
      }

      return {
        ...previous,
        payload: {
          ...(previous.payload || {}),
          notes: mergeNotes(
            previous.payload?.notes || [],
            [note]
          )
        }
      };
    });

    // El Workspace espera que l'adaptador transforme aquesta nota
    // i la incorpore a `items`; no selecciona el primer element mentrestant.
    return { status: 'found' };
  }, [config, scopeKey, token]);

  const updateNote = useCallback(async (id, updates, revision) => {
    const operation = operationRef.current;

    if (!operation || operation.token !== token) {
      throw abortError();
    }

    try {
      const updated = await apiUpdateNote(
        id, updates, revision, config
      );
      // T47b · La llista es queda amb el valor que el servidor no ha pogut desar.
      const guardada = ambNoDesats(updated, updates);

      if (operationRef.current === operation) {
        setData((previous) => {
          if (
            operationRef.current !== operation
            || previous.token !== token
            || !previous.payload
          ) {
            return previous;
          }

          return {
            ...previous,
            payload: {
              ...previous.payload,
              notes: previous.payload.notes.map((note) =>
                String(note.id) === String(id) ? guardada : note
              )
            }
          };
        });
      }

      if (operationRef.current !== operation) throw abortError();
      return updated;
    } catch (error) { 
      if (
        operationRef.current === operation
        && (
          error?.status === 409
          || error?.name === 'TimeoutError'
        )
      ) {
        refresh();
      }

      throw error;
    }
  }, [config, token, refresh]);

  useLayoutEffect(() => {
    updateNoteRef.current = updateNote;
  }, [updateNote]);

  const creaNota = useCallback(async (input = {}) => {
    const operation = operationRef.current;

    if (!operation || operation.token !== token) {
      throw abortError();
    }

    const created = ambNoDesats(await apiCreateNote(input, config), input);

    if (operationRef.current === operation) {
      setData((previous) => {
        if (
          operationRef.current !== operation
          || previous.token !== token
        ) {
          return previous;
        }

        return {
          ...previous,
          payload: {
            ...(previous.payload || {}),
            notes: [
              created,
              ...(previous.payload?.notes || []).filter(
                (note) => String(note.id) !== String(created.id)
              )
            ]
          }
        };
      });
    }

    if (operationRef.current !== operation) throw abortError();
    return created;
  }, [config, token]);

  /* Paperera, arxiu i esborrat definitiu (capacitat 'cicleNotes'). En els tres
     casos la nota ix del Bloc, que només mostra les actives. Un 409 vol dir
     que la llista és vella: es torna a carregar, com fa updateNote. */
  const retiraNota = useCallback(async (id, crida) => {
    const operation = operationRef.current;

    if (!operation || operation.token !== token) {
      throw abortError();
    }

    try {
      const resultat = await crida();

      if (operationRef.current === operation) {
        setData((previous) => {
          if (
            operationRef.current !== operation
            || previous.token !== token
            || !previous.payload
          ) {
            return previous;
          }

          return {
            ...previous,
            payload: {
              ...previous.payload,
              notes: previous.payload.notes.filter(
                (note) => String(note.id) !== String(id)
              )
            }
          };
        });
      }

      if (operationRef.current !== operation) throw abortError();
      return resultat;
    } catch (error) {
      if (
        operationRef.current === operation
        && (
          error?.status === 409
          || error?.name === 'TimeoutError'
        )
      ) {
        refresh();
      }

      throw error;
    }
  }, [token, refresh]);

  const mouNota = useCallback(
    (id, estat, revision) => retiraNota(id, () => apiMouNota(id, estat, revision, config)),
    [retiraNota, config]
  );

  const esborraNota = useCallback(
    (id, revision) => retiraNota(id, () => apiEsborraNota(id, revision, config)),
    [retiraNota, config]
  );

  useRecarregaExterna(refresh);

  const value = useMemo(() => {
    const current = data.token === token;
    const payload = current ? data.payload : null;

    return {
      status: current ? data.status : 'loading',
      error: current ? data.error : null,
      scopeKey,
      workspaceKey,
      config,
      canCreate: (Boolean(currentUser?.id) || config?.dataMode === 'seed' || config?.dataMode === 'local') && current && data.status === 'ready',
      notes: payload?.notes || [],
      noteFolders: payload?.noteFolders || [],
      notesComplete:
        current
        && data.status === 'ready'
        && payload?.notesComplete === true,
      activate,
      resolveNote,
      updateNote,
      creaNota,
      mouNota,
      esborraNota,
      refresh
    };
  }, [
    data, token, scopeKey, workspaceKey, config, currentUser,
    resolveNote, updateNote, creaNota, mouNota, esborraNota, refresh, activate
  ]);

  return (
    <NotesDataContext.Provider value={value}>
      {children}
    </NotesDataContext.Provider>
  );
}

export function useNotesData() {
  return useContext(NotesDataContext) || BUIT;
}
