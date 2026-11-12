const TEXTOS = {
  ca: ['Catàlegs', 'Arbres', 'Presentació general', 'Portada del llibre',
    'Cerca per nom, espècie o paratge', 'Tria un llibre de la llibreria.', 'Cap exemplar coincidix amb la cerca.',
    'Carregant la portada del llibre…', 'La portada no s’ha pogut carregar.', 'Reintentar', 'Torna a la portada del llibre',
    'Herbari', 'Rutes i camins'],
  es: ['Catálogos', 'Árboles', 'Presentación general', 'Portada del libro',
    'Busca por nombre, especie o paraje', 'Elige un libro de la biblioteca.', 'Ningún ejemplar coincide con la búsqueda.',
    'Cargando la portada del libro…', 'No se ha podido cargar la portada.', 'Reintentar', 'Vuelve a la portada del libro',
    'Herbario', 'Rutas y caminos'],
  en: ['Catalogues', 'Trees', 'General introduction', 'Book cover',
    'Search by name, species or location', 'Choose a book from the library.', 'No specimen matches the search.',
    'Loading the book cover…', 'The book cover could not be loaded.', 'Retry', 'Back to the book cover',
    'Herbarium', 'Routes and paths'],
  gl: ['Catálogos', 'Árbores', 'Presentación xeral', 'Portada do libro',
    'Busca por nome, especie ou paraxe', 'Escolle un libro da biblioteca.', 'Ningún exemplar coincide coa busca.',
    'Cargando a portada do libro…', 'Non se puido cargar a portada.', 'Reintentar', 'Volve á portada do libro',
    'Herbario', 'Rutas e camiños'],
  eu: ['Katalogoak', 'Zuhaitzak', 'Aurkezpen orokorra', 'Liburuaren azala',
    'Bilatu izenez, espeziez edo lekuz', 'Hautatu liburu bat liburutegian.', 'Ez dago bilaketarekin bat datorren alerik.',
    'Liburuaren azala kargatzen…', 'Ezin izan da liburuaren azala kargatu.', 'Saiatu berriro', 'Itzuli liburuaren azalera',
    'Herbarioa', 'Ibilbideak eta bideak']
};

export function textosArbresWorkspace(language = 'ca') {
  const [llibreria, exemplars, general, portada, cerca, buit, senseResultats, carregant, errorPortada, reintenta,
    tornaLlibre, herbari, rutes] = TEXTOS[language] || TEXTOS.ca;
  const [tots, monumentals, emblematics, acces, seguiment] = ({
    ca: ['Tots els arbres', 'Monumentals (Llei 4/2006)', 'Emblemàtics d’Interés Local', 'Accés lliure públic', 'Seguiment fotogràfic 2020'],
    es: ['Todos los árboles', 'Monumentales (Ley 4/2006)', 'Emblemáticos de Interés Local', 'Acceso libre público', 'Seguimiento fotográfico 2020'],
    en: ['All trees', 'Monumental (Law 4/2006)', 'Emblematic of Local Interest', 'Free public access', 'Photographic monitoring 2020'],
    gl: ['Todas as árbores', 'Monumentais (Lei 4/2006)', 'Emblemáticas de Interese Local', 'Acceso libre público', 'Seguimento fotográfico 2020'],
    eu: ['Zuhaitz guztiak', 'Monumentalak (4/2006 Legea)', 'Tokiko intereseko enblematikoak', 'Sarbide publiko librea', 'Argazki-jarraipena 2020']
  })[language] || ['Tots els arbres', 'Monumentals (Llei 4/2006)', 'Emblemàtics d’Interés Local', 'Accés lliure públic', 'Seguiment fotogràfic 2020'];
  return { tots, monumentals, emblematics, acces, seguiment, language: Object.hasOwn(TEXTOS, language) ? language : 'ca',
    llibreria, exemplars, general, portada, cerca, buit, senseResultats, carregant, errorPortada, reintenta,
    tornaLlibre, herbari, rutes };
}
