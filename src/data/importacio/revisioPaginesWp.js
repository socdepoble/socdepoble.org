import { sanitizeHtml } from '../../utils/sanitize.js';

const CAMPS = Object.freeze(['title', 'subtitle', 'lead', 'content', 'heroImage', 'copyright', 'categories', 'tags', 'folderId', 'fitxa']);
const fail = code => Object.assign(new Error(code), { code });
/** A UI guard, never a substitute for the existing authenticated backend. */
export function potRevisarPaginesWp(sessio, notes) {
  return Boolean(sessio?.currentUser?.id && sessio.estat === 'dins' && sessio.esSuperadmin === true
    && sessio.nivell === 'aal2' && notes?.teSessio && !notes.nomesLectura);
}
export function campsPrivatsPaginaWp(nota) {
  const fields = Object.fromEntries(CAMPS.filter(k => nota[k] !== undefined).map(k => [k, nota[k]]));
  fields.content = sanitizeHtml(fields.content || '', { imatgesPropies: true });
  if (fields.heroImage && (!/^\/assets\/[^\\\u0000-\u001f]+$/.test(fields.heroImage) || /(?:^|\/)\.\.(?:\/|$)/.test(fields.heroImage))) fields.heroImage = '';
  // No source-supplied owner, public flag, foreign submission id or role.
  return { ...fields, isPublished: false };
}
export const empremtaRevisioWp = nota => JSON.stringify(campsPrivatsPaginaWp(nota));

/** A review is bound to the visible content AND the current authority epoch.
 * All writes go through NotesContext, whose server/ownership checks remain.
 * No write is made until an explicit, current, approved publish action.
 */
export function creaPublicadorPaginaWp({ llig, nouId }) {
  let approval = null, running = null, adopted = null, candidate = null;
  const actual = () => {
    const state = llig();
    if (!state?.viu || !potRevisarPaginesWp(state.sessio, state.base)) throw fail('WP_REVISIO_PRIVADA');
    if (state.base.config?.dataMode === 'seed' || state.base.config?.dataMode === 'local') throw fail('WP_BACKEND_NO_PUBLICABLE');
    return state;
  };
  const fingerprint = state => `${state.ambit}\n${empremtaRevisioWp(state.nota)}`;
  return {
    invalida() { approval = null; },
    notaCreada() {
      try { return adopted?.ambit === actual().ambit ? adopted.id : null; } catch { return null; }
    },
    notaPerRecuperar() {
      try { return candidate?.ambit === actual().ambit ? candidate.id : null; } catch { return null; }
    },
    aprova() {
      const state = actual();
      if (candidate && !adopted) throw fail('WP_CREACIO_INCERTA');
      if (adopted?.publicationStarted) throw fail('WP_CONTINUA_AL_BLOC');
      if (!state.pagina?.publicable || state.pagina.imatgesPendents?.length) throw fail('WP_MITJANS_PENDENTS');
      approval = fingerprint(state);
      return 'aprovat';
    },
    estaAprovat() {
      try { return !(candidate && !adopted) && !adopted?.publicationStarted && approval !== null && approval === fingerprint(actual()); } catch { return false; }
    },
    publica(doc) {
      if (running) return running;
      const job = async () => {
        const state = actual(), mark = fingerprint(state);
        if (candidate && !adopted) throw fail('WP_CREACIO_INCERTA');
        if (adopted?.publicationStarted) throw fail('WP_CONTINUA_AL_BLOC');
        if (!state.pagina?.publicable || state.pagina.imatgesPendents?.length) throw fail('WP_MITJANS_PENDENTS');
        if (approval !== mark || (doc && empremtaRevisioWp(doc) !== empremtaRevisioWp(state.nota))) throw fail('WP_REVISIO_PENDENT');
        const assertCurrent = () => {
          if (fingerprint(actual()) !== mark || approval !== mark) throw fail('WP_REVISIO_CANVIADA');
        };
        const fields = campsPrivatsPaginaWp(state.nota);
        const rejection = state.base.rebuigDePublicacio?.({ id: state.nota.id, ...fields });
        if (rejection) throw rejection;
        if (!adopted) {
          if (typeof state.base.creaNota !== 'function') throw fail('WP_BACKEND_NO_DISPONIBLE');
          candidate = { ambit: state.ambit, id: nouId() };
          const created = await state.base.creaNota({ ...fields, id: candidate.id });
          if (String(created?.id) !== String(candidate.id)) throw fail('WP_CREACIO_INVALIDA');
          // Keep an explicitly created private note reusable on retry, only
          // inside its original scope. A later account never adopts it.
          adopted = { ambit: state.ambit, id: String(created.id), revision: created.revision ?? 0 };
          assertCurrent();
        }
        if (adopted.ambit !== state.ambit) throw fail('WP_REVISIO_CANVIADA');
        assertCurrent();
        if (typeof state.base.updateNote !== 'function' || typeof state.base.publishNote !== 'function') throw fail('WP_BACKEND_NO_DISPONIBLE');
        const saved = await state.base.updateNote(adopted.id, fields, adopted.revision);
        adopted = { ...adopted, revision: saved?.revision ?? adopted.revision + 1 };
        assertCurrent();
        // NotesContext performs its own CAS update when linking the public
        // row and returns a boolean, not the new revision. Hand the note to
        // the normal Bloc after this boundary (even on an uncertain error),
        // never retry with an invented/stale expectedRevision.
        adopted.publicationStarted = true;
        approval = null;
        return state.base.publishNote({ ...fields, coverImage: fields.heroImage || '', id: adopted.id, revision: adopted.revision });
      };
      running = Promise.resolve().then(job).finally(() => { running = null; });
      return running;
    }
  };
}
