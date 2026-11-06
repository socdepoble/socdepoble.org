import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '../../app/contexts/RouterContext.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { useIdentitatOReserva } from '../../app/contexts/useIdentitatOReserva.js';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace.jsx';
import { CanalAmbitContext } from '../../components/universal/ambits/canalAmbit.js';
import { CATEGORIA_GENERAL } from '../../components/universal/classificacio/model.js';
import { carregaPaginaImportadaPerRevisio } from '../../utils/transformadorEditorialWpBlogger.js';
import { creaPublicadorPaginaWp, potRevisarPaginesWp } from '../../data/importacio/revisioPaginesWp.js';
import { NotesContext } from './objectesDeContext.js';
import { useNotes } from './NotesContext.jsx';
import { nouIdDeNota } from './notaPreparada.js';
import NotesEditor from './NotesEditor.jsx';

function EsborranyWp({ pagina, base, sessio, ambit, authority }) {
  const [nota, setNota] = useState(() => ({
    id: `wp-revisio-${pagina.slug}`, title: pagina.title, subtitle: '', lead: '', content: pagina.htmlNet,
    heroImage: '', copyright: `Font: socdepoble.net · WP #${pagina.wp_id} · Data original: ${pagina.created_at} · Drets de l’original pendents de verificar.`,
    folderId: 'f-mur', categories: [CATEGORIA_GENERAL], tags: [], isPublished: false, revision: 0, contentLoaded: true,
    createdAt: pagina.created_at
  }));
  const [approved, setApproved] = useState(false), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [pendent, setPendent] = useState('mur');
  const live = useRef({ viu: true });
  live.current = { ...live.current, nota, pagina, base, sessio, ambit };
  useEffect(() => {
    live.current.viu = true;
    return () => { live.current.viu = false; };
  }, []);
  const publisher = useMemo(() => creaPublicadorPaginaWp({ llig: () => ({
    ...live.current,
    base: authority.current.base, sessio: authority.current.sessio,
    viu: live.current.viu && authority.current.ambit === ambit
  }), nouId: nouIdDeNota }), [authority, ambit]);
  const escriu = useCallback((id, field, value) => {
    if (!live.current.viu || String(id) !== live.current.nota.id) return;
    publisher.invalida();
    setApproved(false);
    const next = { ...live.current.nota, [field]: value };
    live.current.nota = next;
    setNota(next);
  }, [publisher]);
  const publica = useCallback(async doc => {
    setBusy(true); setMessage('');
    try {
      const result = await publisher.publica(doc);
      if (live.current.viu) setMessage(result === false ? 'El servidor ha rebutjat la publicació.' : 'Publicació enviada pel canal habitual del Bloc de notes.');
      return result;
    } catch (error) {
      if (live.current.viu) setMessage(`La publicació continua bloquejada: ${error.code || error.message}`);
      throw error;
    } finally {
      if (live.current.viu) { setBusy(false); setCreatedId(publisher.notaPerRecuperar()); }
    }
  }, [publisher]);
  const value = useMemo(() => ({
    ...base, notes: [nota], notesComplete: true, scopeKey: null, workspaceKey: `wp-revisio:${ambit}`,
    setLocalNoteField: escriu,
    saveNoteField: (id, field, next) => { escriu(id, field, next); return Promise.resolve(true); },
    publishNote: publica, compartirNota: null, canviaEstatPublicacio: undefined,
    creaNota: undefined, updateNote: undefined, mouNota: undefined, esborraNota: undefined, potEsborrar: false
  }), [base, nota, ambit, escriu, publica]);
  const canal = useMemo(() => ({ pendent, consumix: () => setPendent(null) }), [pendent]);
  const model = useMemo(() => ({ status: 'ready', itemsComplete: true, canCreate: false,
    categories: [{ id: 'f-mur', label: 'Mur · revisió privada' }],
    items: [{ id: nota.id, title: nota.title, categoryIds: ['f-mur'], data: nota }]
  }), [nota]);
  const aprova = () => {
    try { publisher.aprova(); setApproved(true); setMessage('Revisió aprovada per a esta versió i esta sessió.'); }
    catch (error) { setMessage(`No es pot aprovar: ${error.code || error.message}`); }
  };
  return <>
    <div className="sdp-admin-taxonomia__panel" aria-label="Revisió editorial privada">
      <p>{createdId ? 'L’intent continua al Bloc de notes amb el seu UUID estable.' : 'Esborrany en memòria: no s’ha creat cap nota.'} <Link to="/notes">Torna al Bloc de notes</Link></p>
      <p role="status">{approved && publisher.estaAprovat() ? 'Estat de revisió: aprovat.' : 'Estat de revisió: pendent_admin.'} {pagina.imatgesPendents.length} imatges pendents de còpia pròpia verificada.</p>
      <p>Revisa l’autoria, els drets, les dates originals i tot el contingut abans d’aprovar. Les imatges pendents impedixen aprovar i publicar.</p>
      <button type="button" className="sdp-boto sdp-boto--secundari" disabled={!pagina.publicable || busy || Boolean(createdId)} onClick={aprova}>Aprova esta revisió</button>
      {message && <p role="status">{message}</p>}
      {createdId && <p><Link to={`/notes?nota=${encodeURIComponent(createdId)}`}>Recupera l’esborrany d’este intent al Bloc</Link>. Si la creació no s’ha confirmat, la nota podria no existir. El Bloc consultarà el servidor abans de continuar; este importador no crearà cap altre UUID.</p>}
    </div>
    {!createdId && <NotesContext.Provider value={value}>
      <CanalAmbitContext.Provider value={canal}>
        <UniversalWorkspace model={model} initialSelection={{ categoryId: 'f-mur', itemId: nota.id }}
          labels={{ items: 'ESBORRANY EN REVISIÓ', categories: 'DESTÍ', empty: 'Cap esborrany' }}
          amagaRodaAjustos renderDetail={() => <NotesEditor activeNote={nota} />} />
      </CanalAmbitContext.Provider>
    </NotesContext.Provider>}
  </>;
}

export default function ImportacioPaginaWpNotes({ clau }) {
  const base = useNotes(), sessio = useSessioOpcional(), { actorId } = useIdentitatOReserva();
  // Increment an epoch on every account, actor, backend, or scope transition,
  // including A→B→A. A stale promise cannot revive a previous review.
  const epoch = useRef({ value: 0, keys: null });
  const keys = [sessio?.currentUser?.id, sessio?.generacio, sessio?.estat, sessio?.esSuperadmin, sessio?.nivell, actorId,
    base?.scopeKey, base?.workspaceKey, base?.config, base?.nomesLectura, clau];
  if (!epoch.current.keys || keys.some((key, index) => key !== epoch.current.keys[index])) epoch.current = { value: epoch.current.value + 1, keys };
  const ambit = String(epoch.current.value);
  const allowed = potRevisarPaginesWp(sessio, base);
  const authority = useRef(null);
  authority.current = { ambit, base, sessio };
  const [loaded, setLoaded] = useState(null), [error, setError] = useState(null);
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    carregaPaginaImportadaPerRevisio(clau, { signal: controller.signal }).then(
      pagina => { if (!controller.signal.aborted) setLoaded({ ambit, pagina }); },
      reason => { if (!controller.signal.aborted) setError({ ambit, code: reason.code || 'WP_CARREGA_FALLIDA' }); }
    );
    return () => controller.abort();
  }, [allowed, ambit, clau]);
  if (!allowed) return <p role="status">Cal una sessió d’administració amb segon factor per obrir la revisió privada.</p>;
  if (error?.ambit === ambit) return <p role="alert">No s’ha pogut verificar la font: {error.code}</p>;
  if (!loaded || loaded.ambit !== ambit) return <p role="status">Verificant la pàgina original…</p>;
  if (!loaded.pagina) return <p role="alert">Pàgina fora del corpus verificat.</p>;
  return <EsborranyWp key={ambit} pagina={loaded.pagina} base={base} sessio={sessio} ambit={ambit} authority={authority} />;
}
