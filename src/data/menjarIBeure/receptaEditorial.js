/** View of the canonical book record for calculations; no copied editorial corpus.
 * PDF identity is the same original pinned by the editorial generator. */
export const SHA256_PDF_QUE_DINEM = '399d2f54abdba0fb4c75f0e4d1b60744f2b19ed0bdf781ae186e5758bc86fddd';
export function adaptaReceptaEditorial(recepta, obra) {
  if (!recepta || !Number.isSafeInteger(recepta.numero) || recepta.numero < 1 || typeof recepta.slug !== 'string' || !obra?.pdf) throw new TypeError('Cal una recepta editorial i la seua obra.');
  const linies = blocs => {
    if (!Array.isArray(blocs) || blocs.some(bloc => !Array.isArray(bloc?.linies) || bloc.linies.some(linia => typeof linia !== 'string'))) throw new TypeError('Blocs editorials no vàlids.');
    return Object.freeze(blocs.flatMap(bloc => bloc.linies));
  };
  return Object.freeze({
    id: `qd-${String(recepta.numero).padStart(3, '0')}-${recepta.slug}`,
    slug: recepta.slug, nom: recepta.titol, paginaPdf: recepta.pagina,
    ingredients: linies(recepta.ingredients), preparacio: linies(recepta.preparacio),
    imatgeUrl: recepta.lamina, youtubeId: recepta.youtubeId,
    notes: recepta.notes, blocsIngredients: recepta.ingredients, blocsPreparacio: recepta.preparacio,
    editorial: recepta,
    font: Object.freeze({ document: obra.pdf, sha256: SHA256_PDF_QUE_DINEM, pagina: recepta.pagina,
      pagines: recepta.pagines, derivat: 'src/data/patrimoni/queDinem.js', estat: 'transcripcio-editorial' })
  });
}
