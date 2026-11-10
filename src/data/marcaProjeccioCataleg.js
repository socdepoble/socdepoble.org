/* PRODNM-01 (R15b) · La marca d'una projecció del catàleg, en una fulla sense
   imports: MurContext és de l'arrencada i no ha d'arrossegar-hi el contracte
   sencer (projeccionsCataleg.js, que la reexporta). Qualsevol fila que porte
   la marca (vàlida, invàlida o una retirada) és del port de les projeccions,
   mai de les llistes del Mur. */
export const portaMarcaProjeccioCataleg = item => item !== null && typeof item === 'object' && Object.hasOwn(item, 'projeccioCataleg');
