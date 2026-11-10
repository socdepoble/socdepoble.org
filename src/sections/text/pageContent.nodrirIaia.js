export const IMATGE_NODRIR_IAIA = '/assets/ui/plugins/nodrir_la_iaia_vinyeta.webp';
export const RUTA_PAGINA_NODRIR_IAIA = '/page/la-iaia-sabuda';
export const DATA_NODRIR_IAIA = '2026-11-09T14:40:43.030Z';
/* R16b (tercera ronda) · Les etiquetes de la targeta del Panell, com les de les altres targetes de
   baix (registrePlugins.js, `classificacio`, i destiSnippet.js): una Categoria i una Etiqueta, en
   eixe ordre i sense enllaç, en les cinc llengües de l'App. Abans en portava tres, dues amb enllaç
   (una cap a /control, la mateixa pàgina on es pinta) i només en valencià. La pàgina
   /page/la-iaia-sabuda no les usa: les seues són les de la taxonomia canònica
   (classificacioPaginesPubliques.js), que ja ix en cinc llengües. */
const etiquetesDeLaTargeta = (categoria, etiqueta) => Object.freeze([
  Object.freeze({ text: categoria, className: 'sdp-badge-category' }),
  Object.freeze({ text: etiqueta, className: 'sdp-badge-tag' })
]);
export const ETIQUETES_NODRIR_IAIA = Object.freeze({
  ca: etiquetesDeLaTargeta('IAIA', 'Cultura'),
  es: etiquetesDeLaTargeta('IAIA', 'Cultura'),
  en: etiquetesDeLaTargeta('IAIA', 'Culture'),
  eu: etiquetesDeLaTargeta('IAIA', 'Kultura'),
  gl: etiquetesDeLaTargeta('IAIA', 'Cultura')
});

/* R16b · El títol i el subtítol de La IAIA Sabuda en les cinc llengües de l'App: l'única font de la
   targeta del Panell (ControlSection.jsx, TEXTOS_CONTROL) i del subtítol d'esta pàgina.
   R16b (tercera ronda) · El subtítol torna al neutre de R16a, amb les seues quatre traduccions: el
   lead diu que la curadoria encara no està activa, i el subtítol no pot afirmar cap acció. */
export const TEXTOS_IAIA_SABUDA = Object.freeze({
  ca: Object.freeze({ titol: 'La IAIA Sabuda', subtitol: 'Aportacions culturals amb curadoria humana' }),
  es: Object.freeze({ titol: 'La IAIA Sabia', subtitol: 'Aportaciones culturales con revisión humana' }),
  en: Object.freeze({ titol: 'The Wise IAIA', subtitol: 'Cultural contributions with human review' }),
  eu: Object.freeze({ titol: 'IAIA Jakintsua', subtitol: 'Kultura ekarpenak, giza berrikuspenarekin' }),
  gl: Object.freeze({ titol: 'A IAIA Sabia', subtitol: 'Achegas culturais con revisión humana' })
});

/* SEG-R15b-02 (R16b, C4-01) · El lead i el cos són els de R16a, honestos i en condicional: cap persona
   real com a cap de curadoria, cap detall intern del Node 0 i cap formulari que no es pinta.
   R16b · El text alternatiu ja no descriu cap taula de reunions llevada. */
export const PAGINA_NODRIR_IAIA = {
  'la-iaia-sabuda': {
    title: 'La IAIA Sabuda · L’Escriptori sota l’Olivera i la curadoria cultural',
    subtitle: TEXTOS_IAIA_SABUDA.ca.subtitol,
    date: DATA_NODRIR_IAIA,
    image: IMATGE_NODRIR_IAIA,
    imageAlt: 'Vinyeta del portal del Mas de pedra seca amb el sol de matí, l’olivera davant, l’embut i la tremuja de la cultura popular i la IAIA MarIA asseguda amb la cullera de fusta a la mà mentre els veïns porten llibres i rondalles',
    lead: 'Un espai per a compartir memòria oral, lèxic i receptes amb autoria i permisos. Quan estiga actiu, la revisió serà humana, la farà una persona amb rol de curadoria, i aprovar una aportació no la publicarà ni la incorporarà al coneixement de la IAIA.',
    html: '<h3>Una escola de saviesa compartida</h3><p>Quan el servidor tinga activa la curadoria cultural, les aportacions arribaran a una safata privada i una persona amb rol de curadoria en revisarà l’autoria, els permisos i la qualitat. Mentre no estiga activa, esta pàgina ho indica i no recull cap aportació.</p>',
    translations: {
      es: {
        title: 'La IAIA Sabia · El Escritorio bajo el Olivo y la curaduría cultural',
        subtitle: TEXTOS_IAIA_SABUDA.es.subtitol,
        imageAlt: 'Viñeta del portal del Mas de piedra seca con el sol de la mañana, el olivo delante, el embudo y la tolva de la cultura popular y la IAIA MarIA sentada con la cuchara de madera en la mano mientras los vecinos traen libros y rondallas',
        lead: 'Un espacio para compartir memoria oral, léxico y recetas con autoría y permisos. Cuando esté activo, la revisión será humana, la hará una persona con rol de curaduría, y aprobar una aportación no la publicará ni la incorporará al conocimiento de la IAIA.',
        html: '<h3>Una escuela de sabiduría compartida</h3><p>Cuando el servidor tenga activa la curaduría cultural, las aportaciones llegarán a una bandeja privada y una persona con rol de curaduría revisará su autoría, sus permisos y su calidad. Mientras no esté activa, esta página lo indica y no recoge ninguna aportación.</p>'
      },
      en: {
        title: 'The Wise IAIA · The Desk under the Olive Tree and cultural curation',
        subtitle: TEXTOS_IAIA_SABUDA.en.subtitol,
        imageAlt: 'Cartoon of the dry-stone doorway of El Mas in the morning sun, the olive tree in front, the folk culture hopper and IAIA MarIA sitting with a wooden spoon in hand while neighbours bring books and tales',
        lead: 'A space for sharing oral history, vocabulary and recipes with attribution and permission. Once it is active, review will be done by a person with a curator role, and approving a contribution will not publish it or add it to IAIA’s knowledge.',
        html: '<h3>A school of shared wisdom</h3><p>Once the server has cultural curation enabled, contributions will enter a private queue and a person with a curator role will check their attribution, permissions and quality. Until then, this page says so and does not collect any contributions.</p>'
      },
      eu: {
        title: 'IAIA Jakintsua · Olibondoaren azpiko Mahaia eta kultura-zaintza',
        subtitle: TEXTOS_IAIA_SABUDA.eu.subtitol,
        imageAlt: 'Harri lehorrezko Mas-eko atariaren bineta goizeko eguzkitan, olibondoa aurrean, herri-kulturaren inbutua eta tolba, eta IAIA MarIA egurrezko koilara eskuan eserita dagoela auzokideek liburuak eta ipuinak dakartzaten bitartean',
        lead: 'Ahozko memoria, hiztegia eta errezetak egiletza eta baimenekin partekatzeko gunea. Aktibatzen denean, berrikuspena pertsona batek egingo du, kultura-arduradun rolarekin, eta ekarpen bat onartzeak ez du argitaratuko, ezta IAIAren jakintzara gehituko ere.',
        html: '<h3>Jakintza partekatuaren eskola</h3><p>Zerbitzariak kultura-berrikuspena aktibatuta duenean, ekarpenak ilara pribatu batera iritsiko dira, eta kultura-arduradun rola duen pertsona batek haien egiletza, baimenak eta kalitatea berrikusiko ditu. Aktibatuta ez dagoen bitartean, orri honek hala adierazten du eta ez du ekarpenik jasotzen.</p>'
      },
      gl: {
        title: 'A IAIA Sabia · O Escritorio baixo a Oliveira e a curadoría cultural',
        subtitle: TEXTOS_IAIA_SABUDA.gl.subtitol,
        imageAlt: 'Viñeta do portal do Mas de pedra seca co sol da mañá, a oliveira diante, o funil e a tremoia da cultura popular e a IAIA MarIA sentada coa culler de madeira na man mentres a veciñanza trae libros e rondallas',
        lead: 'Un espazo para compartir memoria oral, léxico e receitas con autoría e permisos. Cando estea activo, a revisión será humana, farana unha persoa con rol de curadoría, e aprobar unha achega non a publicará nin a incorporará ao coñecemento da IAIA.',
        html: '<h3>Unha escola de sabedoría compartida</h3><p>Cando o servidor teña activa a curadoría cultural, as achegas chegarán a unha bandexa privada e unha persoa con rol de curadoría revisará a súa autoría, os seus permisos e a súa calidade. Mentres non estea activa, esta páxina indícao e non recolle ningunha achega.</p>'
      }
    }
  }
};
