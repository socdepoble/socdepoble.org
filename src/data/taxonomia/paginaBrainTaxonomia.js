/** La targeta de la Consola i la seua pàgina compartixen aquest text. Com la resta
 *  de la Consola, és text en valencià (decisió del Mestre 261030): la pàgina en
 *  declara la llengua (llenguaDelContingut) i no passa pel Traductor. */
export const PAGINA_BRAIN_TAXONOMIA = Object.freeze({
  title: 'Categories i etiquetes',
  subtitle: 'Relacions documentades i decisions en prova',
  lead: 'Explora els noms canònics, comprova quins documents els connecten i compara propostes abans de decidir.',
  ruta: '/consola/taxonomia',
  /* El bloc del tauler (/consola): el seu H2 i la navegació de la targeta. */
  etiquetaSeccio: 'Categories i etiquetes de la Consola',
  etiquetaNav: 'Brain de taxonomia',
  obrint: 'Obrint el Brain de taxonomia…',
});

/** /consola/taxonomia: el comodí de la Consola, amb o sense barra final. */
export const esRutaBrainTaxonomia = (comodi) => String(comodi ?? '').replace(/^\/+|\/+$/g, '') === 'taxonomia';
