/** Prototip de política de presentació. L'autorització real continua al servidor. */
export function estatModul(manifest, context) {
  if (context.enabled[manifest.id] !== true) return 'disabled';
  if (!manifest.requires.every(cap => context.capabilities.has(cap))) return 'unavailable';
  if (manifest.entitlement && !context.entitlements.has(manifest.entitlement)) return 'unsubscribed';
  return 'available';
}

export function accionsWorkspace(manifest, context, { ready = false, busy = false } = {}) {
  if (estatModul(manifest, context) !== 'available') return [];
  return manifest.actions.flatMap(action => {
    // Ordenar/cercar són presentació; les escriptures requerixen un grant explícit.
    const allowed = action.kind === 'view' ||
      (action.kind === 'write' && context.session === 'authenticated' &&
       typeof action.permission === 'string' && context.permissions.has(action.permission));
    if (!allowed) return [];
    return [{ ...action, disabled: !ready || (action.kind === 'write' && busy) }];
  });
}
