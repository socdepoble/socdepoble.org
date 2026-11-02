/** IDEA-62 · Política compartida pel publicador i la porta. Només inspecciona noms. */
export function motiuContaminacio(cami, { wordpress = false } = {}) {
  const parts = String(cami).replaceAll('\\', '/').split('/');
  const nom = parts.at(-1);
  if (parts.some(p => /^(?:\.git|\.svn|\.DS_Store|__MACOSX|\.env(?:\..*)?)$/i.test(p))) return 'metadades locals o entorn privat';
  if (parts.some(p => /^(?:__tests__|__fixtures__|fixtures|coverage|node_modules)$/i.test(p))) return 'carpeta de desenvolupament';
  if (/\.(?:test|spec)\.[cm]?[jt]sx?$/i.test(nom) || /\.(?:map|sql|log|bak|orig|rej)$/i.test(nom)) return 'fitxer de desenvolupament';
  // Només l'arrel assets de l'adaptador: les fotos de contingut poden dir-se screenshot.
  if (wordpress && /^assets\/(?:banner-\d+x\d+|screenshot-\d+|icon(?:-\d+x\d+)?)\.(?:png|jpe?g|gif|webp|svg)$/i.test(parts.join('/'))) return 'actiu de la vitrina WordPress.org';
  return null;
}

export function comprovaHigienePaquet(camins, opcions) {
  const incidencies = camins.flatMap(cami => {
    const motiu = motiuContaminacio(cami, opcions);
    return motiu ? [`${cami}: ${motiu}`] : [];
  });
  if (incidencies.length) throw new Error(`IDEA-62: contingut alié al paquet instal·lable:\n- ${incidencies.join('\n- ')}`);
}
