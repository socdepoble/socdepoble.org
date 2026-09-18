import UniversalToolbar from '../UniversalToolbar';
import { SCHEMA_VISIBLE, ESTAT_BUIT, EXEC_BUIT } from './toolbarContract.js';

/**
 * Barra muda. No rep `editor`, no importa cap motor, no fa cap crida
 * d'edició. Rep dades (`state`) i una porta (`exec`), i itera l'esquema.
 *
 * La projecció cap a les cinc ranures de UniversalToolbar és mecànica i
 * la declara l'esquema (`slot`), no este component: quan UniversalToolbar
 * accepte una llista de botons, este bucle es queda igual i el `slot`
 * desapareix.
 */
export function UniversalRichTextToolbar({
  state = ESTAT_BUIT,
  exec = EXEC_BUIT,
  onPublish,
  publishDisabled,

  t = (key, def) => def
}) {
  const formatState = {};
  const formatActions = {};

  for (const boto of SCHEMA_VISIBLE) {
    formatState[boto.slot.estat] = Boolean(state.actiu?.[boto.id]);
    if (state.disponible && state.pot?.[boto.id]) {
      formatActions[boto.slot.accio] = () => exec(boto.id);
    }
  }

  return (
    <UniversalToolbar
      onPublish={onPublish}
      publishDisabled={publishDisabled}

      formatState={formatState}
      formatActions={formatActions}
      t={t}
    />
  );
}
