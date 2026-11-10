const TEXTOS = {
  ca: ['Llista', 'Rajola quadrada', 'Pàgina principal', 'Pàgina de destinació', 'Obri la pàgina', 'Obri fitxa', '{n} elements', 'Referències publicades', 'Referència pendent de sincronitzar.', 'Referència publicada. La fitxa original conserva les seues dades i permisos.', 'Obri la fitxa original', 'Herbari', 'Banc de llavors', 'Receptes', 'Rebost', 'El Bar', 'qui ha publicat esta referència', 'El Mas és obert en una altra pestanya: tanca-la per a desar els destins.'],
  es: ['Lista', 'Baldosa cuadrada', 'Página principal', 'Página de destino', 'Abre la página', 'Abre la ficha', '{n} elementos', 'Referencias publicadas', 'Referencia pendiente de sincronizar.', 'Referencia publicada. La ficha original conserva sus datos y permisos.', 'Abre la ficha original', 'Herbario', 'Banco de semillas', 'Recetas', 'Despensa', 'El Bar', 'quien ha publicado esta referencia', 'El Mas está abierto en otra pestaña: ciérrala para guardar los destinos.'],
  en: ['List', 'Square tiles', 'Main page', 'Destination page', 'Open page', 'Open details', '{n} items', 'Published references', 'Reference waiting to synchronize.', 'Reference published. The original entry retains its data and permissions.', 'Open the original entry', 'Herbarium', 'Seed bank', 'Recipes', 'Pantry', 'The Bar', 'the person who published this reference', 'The Mas is open in another tab: close it to save the destinations.'],
  eu: ['Zerrenda', 'Lauza karratuak', 'Orrialde nagusia', 'Helmugako orrialdea', 'Ireki orrialdea', 'Ireki fitxa', '{n} elementu', 'Argitaratutako erreferentziak', 'Erreferentzia sinkronizatzeko zain.', 'Erreferentzia argitaratu da. Jatorrizko fitxak bere datuak eta baimenak gordetzen ditu.', 'Ireki jatorrizko fitxa', 'Herbarioa', 'Hazien bankua', 'Errezetak', 'Jakitegia', 'Taberna', 'erreferentzia hau argitaratu duena', 'Mas beste fitxa batean dago irekita: itxi ezazu helmugak gordetzeko.'],
  gl: ['Lista', 'Baldosa cadrada', 'Páxina principal', 'Páxina de destino', 'Abre a páxina', 'Abre a ficha', '{n} elementos', 'Referencias publicadas', 'Referencia pendente de sincronizar.', 'Referencia publicada. A ficha orixinal conserva os seus datos e permisos.', 'Abre a ficha orixinal', 'Herbario', 'Banco de sementes', 'Receitas', 'Despensa', 'O Bar', 'quen publicou esta referencia', 'O Mas está aberto noutra lapela: péchaa para gardar os destinos.']
};
export function textosCatalegWorkspace(llengua = 'ca') {
  const [llista, rajola, principal, desti, obri, fitxa, count, publishedLabel, pendingReference, publishedReference, openOriginal,
    herbari, llavors, receptes, nevera, bar, autoriaReferencia, altraPestanya] = TEXTOS[llengua] || TEXTOS.ca;
  /* PRODNM-02 · Els noms dels destins de navegació, per font (rutaFontCataleg). */
  return { llista, rajola, principal, desti, obri, fitxa, count, publishedLabel, pendingReference, publishedReference, openOriginal,
    destins: { herbari, llavors, receptes, nevera, bar },
    /* PRIVADESA-01 (R15b) · El nom de qui signa una referència d'altri al menú de denúncia i bloqueig: la fila no
       porta cap nom fiable (el títol no ho és). PRODUCCIO-01 · El desament que no es pot fer perquè una altra
       pestanya del Mas té el magatzem (NOMES_LECTURA). */
    autoriaReferencia, altraPestanya };
}
