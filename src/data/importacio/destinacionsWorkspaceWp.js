/** Destins del mateix registre editorial. El contingut original conserva la seua identitat. */
export const DESTINACIONS_WORKSPACE_WP = Object.freeze(['mur', 'arbres-monumentals', 'herbari', 'receptes', 'pagina']);
export const CLAU_PAGINES_IMPORTADES = 'importacions-editorials';

export function destinacioWorkspaceWp(valor, defecte = 'mur') {
  return typeof valor === 'string' && DESTINACIONS_WORKSPACE_WP.includes(valor) ? valor : defecte;
}

const RUTES = Object.freeze({ mur: '/mur', 'arbres-monumentals': '/page/arbres-monumentals',
  herbari: '/page/herbari', receptes: '/page/receptes', pagina: '/page/importacions-editorials' });

export function rutaWorkspaceWp(destinacio) {
  return destinacioWorkspaceWp(destinacio, null) === null ? null : RUTES[destinacio];
}
