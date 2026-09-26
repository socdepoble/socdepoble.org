import { useCallback, useEffect, useRef, useState } from 'react';
import { backendScope } from '../../config/backendConfig.js';
import { getDraftsForScope, mutateDraft } from './GlobalSaveManager.js';
import { sanitizeHtml, netejaText } from '../../utils/sanitize.js';

/** The guest editor has the same durable, scoped draft store as signed-in Notes. */
export function useLocalSandbox(initial, config, onError) {
  const key = `sandbox:${backendScope(config)}`;
  const [state, setState] = useState({ key, note: initial });
  const dirty = useRef(new Map());
  const errorRef = useRef(onError);
  errorRef.current = onError;
  useEffect(() => {
    let active = true;
    getDraftsForScope(key).then(drafts => {
      if (active) setState({ key, note: { ...initial, ...drafts[initial.id], ...dirty.current.get(key) } });
    }).catch(error => { if (active) errorRef.current?.(error.message); });
    return () => { active = false; };
  }, [key, initial]);
  const update = useCallback((id, field, value) => {
    const clean = ['title', 'subtitle', 'lead', 'content'].includes(field) ? sanitizeHtml(value)
      : field === 'copyright' ? netejaText(value).slice(0, 256) : value;
    dirty.current.set(key, { ...dirty.current.get(key), [field]: clean });
    setState(previous => ({ key, note: { ...(previous.key === key ? previous.note : initial), [field]: clean } }));
    mutateDraft(`${key}:${id}`, previous => ({ ...previous, [field]: clean }))
      .catch(error => errorRef.current?.(error.message));
  }, [key, initial]);
  return [state.key === key ? state.note : initial, update];
}
