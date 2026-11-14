/**
 * isoglossesComarcals.js · Onada R23 («La Veu de Sóc de Poble») · Dades
 * dialectològiques i motor determinista d'afinitat comarcal del joc «D'on parles?».
 *
 * Basat en la geografia lingüística de l'Atles Lingüístic del Domini Català
 * (Joan Veny, IEC), els estudis de dialectologia valenciana de Jordi Colomina
 * (Universitat d'Alacant / AVL) i el Diccionari Normatiu Valencià (AVL).
 *
 * Disseny pur, congelat i sense efectes laterals.
 */

import { getVal, setVal } from '../../config/storage.js';

export const CLAU_APORTACIONS_LOCALS_ISOGLOSSES = 'sdp:aportacions_isoglosses_v1';
export const CLAU_VOTS_VARIANTS_ISOGLOSSES = 'sdp:vots_variants_isoglosses_v1';
export const CLAU_PERFIL_TERRITORI_JOC = 'sdp:joc_parla_perfil_territori_v1';

/**
 * Catàleg de comarques per a l'enquesta sociolingüística separada (Poble + Comarca),
 * vinculat a cadascuna de les 8 grans àrees dialectals del motor.
 */
export const COMARQUES_ENQUESTA = Object.freeze([
  Object.freeze({ id: 'alacanti', nom: 'L’Alacantí', areaId: 'alacanti_vinalopo' }),
  Object.freeze({ id: 'comtat', nom: 'El Comtat', areaId: 'comtat_alcoia_marina' }),
  Object.freeze({ id: 'alcoia', nom: 'L’Alcoià', areaId: 'comtat_alcoia_marina' }),
  Object.freeze({ id: 'marina_baixa', nom: 'La Marina Baixa', areaId: 'comtat_alcoia_marina' }),
  Object.freeze({ id: 'marina_alta', nom: 'La Marina Alta', areaId: 'comtat_alcoia_marina' }),
  Object.freeze({ id: 'vinalopo', nom: 'Les Valls del Vinalopó', areaId: 'alacanti_vinalopo' }),
  Object.freeze({ id: 'baix_vinalopo_segura', nom: 'El Baix Vinalopó / El Baix Segura', areaId: 'alacanti_vinalopo' }),
  Object.freeze({ id: 'vall_albaida', nom: 'La Vall d’Albaida', areaId: 'safor_costera_albaida_ribera' }),
  Object.freeze({ id: 'costera_canal', nom: 'La Costera / La Canal de Navarrés', areaId: 'safor_costera_albaida_ribera' }),
  Object.freeze({ id: 'safor', nom: 'La Safor', areaId: 'safor_costera_albaida_ribera' }),
  Object.freeze({ id: 'ribera', nom: 'La Ribera Alta i Baixa', areaId: 'safor_costera_albaida_ribera' }),
  Object.freeze({ id: 'horta', nom: 'L’Horta de València', areaId: 'horta_turia_morvedre' }),
  Object.freeze({ id: 'turia_morvedre', nom: 'Camp de Túria / Camp de Morvedre', areaId: 'horta_turia_morvedre' }),
  Object.freeze({ id: 'plana_alcalaten', nom: 'La Plana / L’Alcalatén / Alt Millars', areaId: 'plana_maestrat_ports' }),
  Object.freeze({ id: 'maestrat_ports', nom: 'El Maestrat / Els Ports', areaId: 'plana_maestrat_ports' }),
  Object.freeze({ id: 'ebre_ponent', nom: 'Terres de l’Ebre / Ponent', areaId: 'ebre_ponent' }),
  Object.freeze({ id: 'catalunya_central_girona', nom: 'Catalunya Central / Girona / Barcelona', areaId: 'catalunya_central_girona' }),
  Object.freeze({ id: 'illes_balears', nom: 'Illes Balears', areaId: 'illes_balears' }),
  Object.freeze({ id: 'no_ho_se', nom: 'No ho sé / Una altra comarca', areaId: '' }),
]);

/**
 * Opcions tipus enquesta per diferenciar localismes estrictes de poble respecte d'usos comarcals.
 */
export const OPCIONS_ABAST_COMARCAL = Object.freeze([
  Object.freeze({ id: 'nomes_poble', clau: 'patrimoni.jocParla.abast.nomesPoble', reserva: 'Només al meu poble' }),
  Object.freeze({ id: 'crec_comarca', clau: 'patrimoni.jocParla.abast.crecComarca', reserva: 'Crec que sí, a la comarca' }),
  Object.freeze({ id: 'alguns_veins', clau: 'patrimoni.jocParla.abast.algunsVeins', reserva: 'A alguns pobles veïns' }),
  Object.freeze({ id: 'no_ho_se', clau: 'patrimoni.jocParla.abast.noHoSe', reserva: 'No ho sé (que ho voten els veïns)' }),
]);

/**
 * Variants orals vives documentades al territori que obrin el consens participatiu
 * (ex. el debat real entre «Querilla» i «Queraïlla» a La Torre de les Maçanes, L’Alacantí).
 */
export const VARIANTS_POBLE_LLAVOR = Object.freeze([
  Object.freeze({
    preguntaId: 'q01_creilla',
    paraula: 'Querilla',
    poble: 'La Torre de les Maçanes',
    comarcaId: 'alacanti',
    comarcaNom: 'L’Alacantí',
    areaId: 'alacanti_vinalopo',
    abastComarcal: 'nomes_poble',
    votsBase: 1,
  }),
  Object.freeze({
    preguntaId: 'q01_creilla',
    paraula: 'Queraïlla',
    poble: 'La Torre de les Maçanes',
    comarcaId: 'alacanti',
    comarcaNom: 'L’Alacantí',
    areaId: 'alacanti_vinalopo',
    abastComarcal: 'alguns_veins',
    votsBase: 1,
  }),
  Object.freeze({
    preguntaId: 'q02_espencat',
    paraula: 'Aspencat',
    poble: 'La Torre de les Maçanes',
    comarcaId: 'alacanti',
    comarcaNom: 'L’Alacantí',
    areaId: 'alacanti_vinalopo',
    abastComarcal: 'alguns_veins',
    votsBase: 1,
  }),
  Object.freeze({
    preguntaId: 'q05_poal',
    paraula: 'Pual',
    poble: 'La Torre de les Maçanes',
    comarcaId: 'alacanti',
    comarcaNom: 'L’Alacantí',
    areaId: 'alacanti_vinalopo',
    abastComarcal: 'alguns_veins',
    votsBase: 1,
  }),
]);

/**
 * Les 8 grans àrees dialectals i comarcals que el motor pondera.
 */
export const AREES_DIALECTALS = Object.freeze([
  Object.freeze({
    id: 'alacanti_vinalopo',
    nom: 'L’Alacantí i les Valls del Vinalopó',
    poblesExemple: 'La Torre de les Maçanes, Xixona, Alacant, Sant Vicent del Raspeig, Agost, Novelda, Montfort i Guardamar',
    veuRecomanada: 'gina_valencia',
    descripcio: {
      ca: 'Parla valenciana alacantina, de muntanya i de mar: des dels bancals d’olivera de La Torre de les Maçanes i Xixona fins a Alacant i el Vinalopó, amb «eixir» (combinat amb «hui» a la serra i «avui» cap a la costa i les valls), «creïlla», «bresquilla», «tomaca» i l’«espencat» ben regat amb oli.',
      es: 'Habla valenciana alicantina, de montaña y de mar: desde los bancales de olivo de La Torre de les Maçanes y Xixona hasta Alicante y el Vinalopó, con «eixir» (junto a «hui» en la sierra y «avui» hacia la costa y los valles), «creïlla», «bresquilla», «tomaca» y el «espencat» bien regado con aceite.',
      en: 'Southern Alicante Valencian speech across mountain and coast—from the olive terraces of La Torre de les Maçanes and Xixona down to Alacant and the Vinalopó—pairing “eixir” (with “hui” in the hills and “avui” along the coast and valleys) with “creïlla”, “bresquilla”, “tomaca” and roasted “espencat”.',
      eu: 'Alacanteko valentziera bizia, mendikoa zein itsasertzekoa: La Torre de les Maçanes eta Xixonatik Alacant eta Vinalopóra, «eixir» («hui» mendian eta «avui» kostaldean), «creïlla», «bresquilla», «tomaca» eta olioz bustitako «espencat»-arekin.',
      gl: 'Fala valenciana alacantina, de montaña e de mar: dende os socalcos de oliveira de La Torre de les Maçanes e Xixona ata Alacant e o Vinalopó, con «eixir» («hui» na serra e «avui» cara á costa e aos vales), «creïlla», «bresquilla», «tomaca» e o «espencat» ben regado con aceite.',
    },
  }),
  Object.freeze({
    id: 'comtat_alcoia_marina',
    nom: 'El Comtat, l’Alcoià i la Marina',
    poblesExemple: 'Alcoi, Cocentaina, Muro, Agres, Banyeres, Dénia, Callosa i Xàbia',
    veuRecomanada: 'arnau_valencia',
    descripcio: {
      ca: 'Valencià meridional de muntanya i de vall oberta a la mar: terra de bancals d’olivera, «hui» i «eixir», «creïlla», «bresquilla», «espencat», «rabosa» i bon «comboi».',
      es: 'Valenciano meridional de montaña y de valle abierto al mar: tierra de bancales de olivo, «hui» y «eixir», «creïlla», «bresquilla», «espencat», «rabosa» y buen «comboi».',
      en: 'Mountain and coastal Southern Valencian from El Comtat, L’Alcoià and La Marina: olive terraces, “hui” and “eixir”, “creïlla”, “bresquilla”, “espencat” and warm “comboi”.',
      eu: 'Mendiko eta itsasoko hegoaldeko valentziera (El Comtat, l’Alcoià eta la Marina): olibondo-terrazak, «hui» eta «eixir», «creïlla», «bresquilla», «espencat» eta «comboi» ederra.',
      gl: 'Valenciano meridional de montaña e de val aberto ao mar: terra de socalcos de oliveira, «hui» e «eixir», «creïlla», «bresquilla», «espencat», «rabosa» e bo «comboi».',
    },
  }),
  Object.freeze({
    id: 'safor_costera_albaida_ribera',
    nom: 'La Safor, la Costera, la Vall d’Albaida i la Ribera',
    poblesExemple: 'Gandia, Xàtiva, Ontinyent, Bocairent, Alzira, Sueca i Tavernes',
    veuRecomanada: 'berta_valencia',
    descripcio: {
      ca: 'Cor del valencià meridional i de les comarques centrals del Xúquer i el Serpis: on el «comboi» és llei, es menja «espencat», es cullen «bresquilles» i es mira a l’«espill».',
      es: 'Corazón del valenciano meridional y de las comarcas centrales del Júcar y el Serpis: donde el «comboi» es ley, se come «espencat», se cogen «bresquilles» y uno se mira al «espill».',
      en: 'Heartland of Southern-Central Valencian along the Xúquer and Serpis valleys: where “comboi” rules, “espencat” is shared at table, and “bresquilles” ripen in summer.',
      eu: 'Xúquer eta Serpis ibarretako erdi-hegoaldeko valentzieraren bihotza: «comboi» lege den lekua, «espencat» jaten da eta «bresquilles» biltzen dira.',
      gl: 'Corazón do valenciano meridional e das comarcas centrais do Xúquer e o Serpis: onde o «comboi» é lei, cómese «espencat», cóllense «bresquilles» e mírase un no «espill».',
    },
  }),
  Object.freeze({
    id: 'horta_turia_morvedre',
    nom: 'L’Horta i el Camp de Túria i de Morvedre',
    poblesExemple: 'València, Torrent, Alboraia, Paterna, Llíria, Bétera i Sagunt',
    veuRecomanada: 'lluc_valencia',
    descripcio: {
      ca: 'Valencià central de l’Horta i les valls del Túria i Palància: bressol del «comboi», de la «creïlla», les «bajoques» i els «fesols» de la paella, amb «poal», «granera» i «hui».',
      es: 'Valenciano central de l’Horta y los valles del Turia y Palancia: cuna del «comboi», de la «creïlla», las «bajoques» y los «fesols», con «poal», «granera» y «hui».',
      en: 'Central Valencian (Apitxat and surrounding Horta/Túria): home of “comboi”, “creïlla”, “bajoques” and “fesols”, with “poal”, “granera” and “hui”.',
      eu: 'L’Hortako eta Túria zein Morvedreko erdialdeko valentziera: «comboi», «creïlla», «bajoques» eta «fesols» hitzen sorlekua, «poal», «granera» eta «hui»-rekin.',
      gl: 'Valenciano central da Horta e os vales do Turia e Palancia: berce do «comboi», da «creïlla», as «bajoques» e os «fesols», con «poal», «granera» e «hui».',
    },
  }),
  Object.freeze({
    id: 'plana_maestrat_ports',
    nom: 'La Plana, l’Alcalatén, el Maestrat i els Ports',
    poblesExemple: 'Castelló de la Plana, Vila-real, l’Alcora, Morella, Vinaròs i Benicarló',
    veuRecomanada: 'gina_valencia',
    descripcio: {
      ca: 'Valencià septentrional de secans d’olivera mil·lenària i mar: on la «pataca» i la «tomata» es donen la mà amb el «poal», la «granera», la «rabosa» i l’«espill».',
      es: 'Valenciano septentrional de secanos de olivo milenario y mar: donde la «pataca» y la «tomata» se dan la mano con el «poal», la «granera», la «rabosa» y el «espill».',
      en: 'Northern Valencian across La Plana, El Maestrat and Els Ports: ancient olive groves where “pataca” and “tomata” meet “poal”, “granera”, “rabosa” and “espill”.',
      eu: 'Iparraldeko valentziera (La Plana, el Maestrat eta els Ports): «pataca» eta «tomata» hitzek «poal», «granera», «rabosa» eta «espill»-ekin bat egiten duten lurra.',
      gl: 'Valenciano setentrional de secaños de oliveira milenaria e mar: onde a «pataca» e a «tomata» se dan a man co «poal», a «granera», a «rabosa» e o «espill».',
    },
  }),
  Object.freeze({
    id: 'ebre_ponent',
    nom: 'Terres de l’Ebre i Ponent',
    poblesExemple: 'Tortosa, Amposta, Gandesa, Lleida, Balaguer, Tàrrega i les Garrigues',
    veuRecomanada: 'emma_occidental',
    descripcio: {
      ca: 'Català nord-occidental i tortosí, pont germà entre el Maestrat, el Segre i l’Ebre: terra de «pataca» o «patata», «tomata», «rabosa», «cubell», «préssec» i «avui i sortir».',
      es: 'Catalán noroccidental y tortosino, puente hermano entre el Maestrazgo, el Segre y el Ebro: tierra de «pataca» o «patata», «tomata», «rabosa», «cubell», «préssec» y «avui i sortir».',
      en: 'North-Western Catalan across Terres de l’Ebre and Ponent: the living bridge along the Ebre and Segre rivers with “pataca”, “tomata”, “rabosa”, “cubell” and “préssec”.',
      eu: 'Ipar-mendebaldeko katalana (Ebroko Lurrak eta Ponent): «pataca», «tomata», «rabosa», «cubell», «préssec» eta «avui i sortir» biltzen dituen zubi bizia.',
      gl: 'Catalán noroccidental e tortosino, ponte irmá entre o Maestrazgo, o Segre e o Ebro: terra de «pataca» ou «patata», «tomata», «rabosa», «cubell», «préssec» e «avui i sortir».',
    },
  }),
  Object.freeze({
    id: 'catalunya_central_girona',
    nom: 'Catalunya Central, Girona i Pirineu Oriental',
    poblesExemple: 'Vic, Manresa, Barcelona, Girona, Olot, Figueres i Puigcerdà',
    veuRecomanada: 'elia_central',
    descripcio: {
      ca: 'Català oriental central i septentrional: terra d’«escalivada», «patata» o «trumfa», «préssec», «escombra», «galleda», «tomàquet», «pebrot», «guineu», «mongetes» i «mirall».',
      es: 'Catalán oriental central y septentrional: tierra de «escalivada», «patata» o «trumfa», «préssec», «escombra», «galleda», «tomàquet», «pebrot», «guineu», «mongetes» y «mirall».',
      en: 'Central and Northern Eastern Catalan: characterized by “escalivada”, “patata” or Pyrenean “trumfa”, “préssec”, “escombra”, “galleda”, “tomàquet”, “pebrot”, “guineu” and “mirall”.',
      eu: 'Ekialdeko katalan zentrala (Katalunia Erdialdea, Girona eta Ekialdeko Pirinioa): «escalivada», «trumfa» edo «patata», «préssec», «galleda», «pebrot», «guineu» eta «mirall».',
      gl: 'Catalán oriental central e setentrional: terra de «escalivada», «patata» ou «trumfa», «préssec», «escombra», «galleda», «tomàquet», «pebrot», «guineu», «mongetes» e «mirall».',
    },
  }),
  Object.freeze({
    id: 'illes_balears',
    nom: 'Illes Balears',
    poblesExemple: 'Palma, Manacor, Sóller, Ciutadella, Maó, Eivissa i Formentera',
    veuRecomanada: 'olga_balear',
    descripcio: {
      ca: 'Parla balear d’arrel antiga i marinera: inconfusible pel seu «trempó», la «tomàtiga», el «pebre bo», la «bauxa», i la germanor amb València en «poal» i «granera».',
      es: 'Habla balear de raíz antigua y marinera: inconfundible por su «trempó», la «tomàtiga», el «pebre bo», la «bauxa», y su hermandad con Valencia en «poal» y «granera».',
      en: 'Balearic speech of deep maritime roots: unmistakable for “trempó”, “tomàtiga”, “pebre bo” and “bauxa”, while sharing “poal” and “granera” across the sea with Valencia.',
      eu: 'Balearretako hizkera itsastar eta sustrai zaharrekoa: nahastezina bere «trempó», «tomàtiga», «pebre bo» eta «bauxa» hitzengatik, Valentziarekin «poal» eta «granera» partekatuz.',
      gl: 'Fala balear de raíz antiga e mariñeira: inconfundible polo seu «trempó», a «tomàtiga», o «pebre bo», a «bauxa», e a irmandade con Valencia en «poal» e «granera».',
    },
  }),
]);

/**
 * Les 12 preguntes filològiques canòniques (ALDC / AVL / Jordi Colomina).
 * Cada opció assigna punts d'afinitat (0..5) a les àrees on és genuïna.
 */
export const PREGUNTES_ISOGLOSSES = Object.freeze([
  Object.freeze({
    id: 'q01_creilla',
    enunciat: {
      ca: 'Com li dius al tubercle que fregim o posem al bullit i a l’olla?',
      es: '¿Cómo llamas al tubérculo que freímos o ponemos al hervido y a la olla?',
      en: 'What do you call the potato in your village kitchen?',
      eu: 'Nola deitzen diozu zure herrian patatari?',
      gl: 'Como lle chamas ao tubérculo que fritimos ou botamos ao cocido?',
    },
    opcions: Object.freeze([
      Object.freeze({
        id: 'creilla',
        etiqueta: 'Creïlla',
        detall: 'Forma clàssica valenciana meridional i central',
        pesos: Object.freeze({ alacanti_vinalopo: 5, comtat_alcoia_marina: 5, safor_costera_albaida_ribera: 5, horta_turia_morvedre: 5, plana_maestrat_ports: 2 }),
      }),
      Object.freeze({
        id: 'pataca',
        etiqueta: 'Pataca',
        detall: 'Viu al Maestrat, els Ports, la Plana i Terres de l’Ebre',
        pesos: Object.freeze({ plana_maestrat_ports: 5, ebre_ponent: 5 }),
      }),
      Object.freeze({
        id: 'patata',
        etiqueta: 'Patata',
        detall: 'General a Catalunya oriental, Ponent i les Illes',
        pesos: Object.freeze({ catalunya_central_girona: 4, illes_balears: 5, ebre_ponent: 3 }),
      }),
      Object.freeze({
        id: 'trumfa',
        etiqueta: 'Trumfa',
        detall: 'Tradicional d’Osona, el Berguedà, la Garrotxa i el Pirineu',
        pesos: Object.freeze({ catalunya_central_girona: 5, ebre_ponent: 2 }),
      }),
    ]),
  }),
  Object.freeze({
    id: 'q02_espencat',
    enunciat: {
      ca: 'Quan torrem pimentó (o pebrot) i albergínia al caliu, o preparem l’amanida d’horta d’estiu, quin nom ix a taula?',
      es: 'Cuando asamos pimiento y berenjena a la brasa o preparamos el plato de huerta de verano, ¿qué nombre sale a la mesa?',
      en: 'When roasting peppers and aubergines over embers or making the classic summer salad, what is it called?',
      eu: 'Udako piper eta alberjinia erreak edo baratze-entsalada mahaira ateratzean, zein izen erabiltzen duzue?',
      gl: 'Cando asamos pemento e berenxena na brasa ou facemos a ensalada de horta de verán, que nome sae á mesa?',
    },
    opcions: Object.freeze([
      Object.freeze({
        id: 'espencat',
        etiqueta: 'Espencat',
        detall: 'Esguerrat a tires amb les mans, oli nou i bacallà o tonyina',
        pesos: Object.freeze({ comtat_alcoia_marina: 5, alacanti_vinalopo: 5, safor_costera_albaida_ribera: 5, horta_turia_morvedre: 3 }),
      }),
      Object.freeze({
        id: 'escalivada',
        etiqueta: 'Escalivada',
        detall: 'Feta al caliu («escalivar»), general al nord i Catalunya',
        pesos: Object.freeze({ catalunya_central_girona: 5, ebre_ponent: 5, plana_maestrat_ports: 4, horta_turia_morvedre: 3 }),
      }),
      Object.freeze({
        id: 'trempo',
        etiqueta: 'Trempó',
        detall: 'Tomàtiga, pebre bo blanc i ceba ben trempats amb oli',
        pesos: Object.freeze({ illes_balears: 5 }),
      }),
    ]),
  }),
  Object.freeze({
    id: 'q03_bresquilla',
    enunciat: {
      ca: 'Com anomenes la fruita d’estiu de pell vellutada i pinyol rugós?',
      es: '¿Cómo llamas a la fruta de verano de piel aterciopelada y hueso rugoso?',
      en: 'What word do you use for a peach?',
      eu: 'Nola esaten diozu mertxikari zure eskualdean?',
      gl: 'Como lle chamas ao pexego na túa comarca?',
    },
    opcions: Object.freeze([
      Object.freeze({
        id: 'bresquilla',
        etiqueta: 'Bresquilla',
        detall: 'Del llatí persica; viva a les comarques centrals i del sud',
        pesos: Object.freeze({ alacanti_vinalopo: 5, comtat_alcoia_marina: 5, safor_costera_albaida_ribera: 5, horta_turia_morvedre: 3 }),
      }),
      Object.freeze({
        id: 'pressec',
        etiqueta: 'Préssec',
        detall: 'O «prèxec» a Ponent i l’Ebre; també viu als Ports',
        pesos: Object.freeze({ catalunya_central_girona: 5, ebre_ponent: 5, plana_maestrat_ports: 3 }),
      }),
      Object.freeze({
        id: 'melocoto',
        etiqueta: 'Melocotó',
        detall: 'O «melicotó» a les Illes; tradicional a la Plana i l’Horta',
        pesos: Object.freeze({ illes_balears: 5, plana_maestrat_ports: 4, horta_turia_morvedre: 4 }),
      }),
    ]),
  }),
  Object.freeze({
    id: 'q04_granera',
    enunciat: {
      ca: 'Amb quina eina agranes o escombres la porta de casa?',
      es: '¿Con qué herramienta barres la puerta de casa?',
      en: 'What do you call the broom used to sweep the doorway?',
      eu: 'Zein tresnarekin erraztatzen duzu etxeko ataria?',
      gl: 'Con que ferramenta varres a porta da casa?',
    },
    opcions: Object.freeze([
      Object.freeze({
        id: 'granera',
        etiqueta: 'Granera',
        detall: 'Per a agranar; general al País Valencià i les Illes Balears',
        pesos: Object.freeze({ alacanti_vinalopo: 5, comtat_alcoia_marina: 5, safor_costera_albaida_ribera: 5, horta_turia_morvedre: 5, plana_maestrat_ports: 5, illes_balears: 5 }),
      }),
      Object.freeze({
        id: 'escombra',
        etiqueta: 'Escombra',
        detall: 'Per a escombrar; general a Catalunya oriental i occidental',
        pesos: Object.freeze({ catalunya_central_girona: 5, ebre_ponent: 5 }),
      }),
    ]),
  }),
  Object.freeze({
    id: 'q05_poal',
    enunciat: {
      ca: 'Com li dius al recipient amb ansa per a traure aigua del pou o fregar?',
      es: '¿Cómo llamas al recipiente con asa para sacar agua del pozo o fregar?',
      en: 'What do you call a water bucket?',
      eu: 'Nola deitzen diozu ura ateratzeko edo garbitzeko ontzi kirtendunari?',
      gl: 'Como lle chamas ao caldeiro para tirar auga do pozo ou fregar?',
    },
    opcions: Object.freeze([
      Object.freeze({
        id: 'poal',
        etiqueta: 'Poal',
        detall: 'Derivat de «pou»; compartit de dalt a baix a València i Balears',
        pesos: Object.freeze({ alacanti_vinalopo: 5, comtat_alcoia_marina: 5, safor_costera_albaida_ribera: 5, horta_turia_morvedre: 5, plana_maestrat_ports: 5, illes_balears: 5 }),
      }),
      Object.freeze({
        id: 'galleda',
        etiqueta: 'Galleda',
        detall: 'Forma general del català central i gironí',
        pesos: Object.freeze({ catalunya_central_girona: 5, ebre_ponent: 2 }),
      }),
      Object.freeze({
        id: 'cubell',
        etiqueta: 'Cubell',
        detall: 'Molt viu a Ponent, Terres de l’Ebre i comarques d’interior',
        pesos: Object.freeze({ ebre_ponent: 5, plana_maestrat_ports: 2, catalunya_central_girona: 2 }),
      }),
    ]),
  }),
  Object.freeze({
    id: 'q06_tomaca',
    enunciat: {
      ca: 'Què grates o suques damunt la llesca de pa amb oli i sal?',
      es: '¿Qué rallas o restregas sobre la rebanada de pan con aceite y sal?',
      en: 'Which variant do you use for the tomato rubbed on bread with olive oil?',
      eu: 'Nola esaten diozu ogi oliodunaren gainean igurzten den tomateari?',
      gl: 'Que nome lle dás ao tomate que esfregas no pan con aceite e sal?',
    },
    opcions: Object.freeze([
      Object.freeze({
        id: 'tomaca',
        etiqueta: 'Tomaca',
        detall: 'Valencià meridional i gran part del central',
        pesos: Object.freeze({ alacanti_vinalopo: 5, comtat_alcoia_marina: 5, safor_costera_albaida_ribera: 5, horta_turia_morvedre: 4 }),
      }),
      Object.freeze({
        id: 'tomata',
        etiqueta: 'Tomata',
        detall: 'Castelló, Camp de Morvedre, Ebre, Ponent i comarques gironines',
        pesos: Object.freeze({ plana_maestrat_ports: 5, ebre_ponent: 5, horta_turia_morvedre: 3, catalunya_central_girona: 2 }),
      }),
      Object.freeze({
        id: 'tomaquet',
        etiqueta: 'Tomàquet',
        detall: 'Forma general de Barcelona i la Catalunya Central',
        pesos: Object.freeze({ catalunya_central_girona: 5 }),
      }),
      Object.freeze({
        id: 'tomatiga',
        etiqueta: 'Tomàtiga',
        detall: 'Especialment la de ramellet a Mallorca, Menorca i Pitiüses',
        pesos: Object.freeze({ illes_balears: 5 }),
      }),
    ]),
  }),
  Object.freeze({
    id: 'q07_pimento',
    enunciat: {
      ca: 'I l’hortalissa verda o roja que acompanya la tomaca a la paella, el mullador o el sofregit?',
      es: '¿Y la hortaliza verde o roja que acompaña al tomate en el sofrito o la salmuera?',
      en: 'And what do you call the sweet bell pepper in your garden?',
      eu: 'Eta nola deitzen diozu baratzean hazten den piper berde edo gorriari?',
      gl: 'E a hortaliza verde ou vermella que acompaña o tomate no rustrido?',
    },
    opcions: Object.freeze([
      Object.freeze({
        id: 'pimento',
        etiqueta: 'Pimentó (o pebrera)',
        detall: '«Pimentó» per al fruit dolç i «pebrera» per a la planta o el coent',
        pesos: Object.freeze({ alacanti_vinalopo: 5, comtat_alcoia_marina: 5, safor_costera_albaida_ribera: 5, horta_turia_morvedre: 5, plana_maestrat_ports: 5, ebre_ponent: 4 }),
      }),
      Object.freeze({
        id: 'pebrot',
        etiqueta: 'Pebrot',
        detall: 'Forma general a Catalunya oriental i part de Ponent',
        pesos: Object.freeze({ catalunya_central_girona: 5, ebre_ponent: 3 }),
      }),
      Object.freeze({
        id: 'pebre_bo',
        etiqueta: 'Pebre bo',
        detall: 'Forma genuïna de les Illes Balears',
        pesos: Object.freeze({ illes_balears: 5 }),
      }),
    ]),
  }),
  Object.freeze({
    id: 'q08_rabosa',
    enunciat: {
      ca: 'Com li diuen al teu poble al mamífer astut de cua peluda que ronda els galliners?',
      es: '¿Cómo llaman en tu pueblo al mamífero astuto de cola peluda que ronda los gallineros?',
      en: 'What is the traditional name in your village for the wild fox?',
      eu: 'Nola deitzen diote zure herrian oilategietara hurbiltzen den azeriari?',
      gl: 'Como lle chaman na túa aldea ao raposo que rolda os galiñeiros?',
    },
    opcions: Object.freeze([
      Object.freeze({
        id: 'rabosa',
        etiqueta: 'Rabosa',
        detall: 'Domina tot el bloc occidental, des de Guardamar fins a l’Ebre i Lleida',
        pesos: Object.freeze({ alacanti_vinalopo: 5, comtat_alcoia_marina: 5, safor_costera_albaida_ribera: 5, horta_turia_morvedre: 5, plana_maestrat_ports: 5, ebre_ponent: 5 }),
      }),
      Object.freeze({
        id: 'guineu',
        etiqueta: 'Guineu',
        detall: 'Predominant al català oriental i present a les Illes',
        pesos: Object.freeze({ catalunya_central_girona: 5, illes_balears: 4 }),
      }),
    ]),
  }),
  Object.freeze({
    id: 'q09_bajoques',
    enunciat: {
      ca: 'Quan parles dels llegums tendres verds i dels grans secs per a l’arròs o l’olla, com els separes?',
      es: 'Cuando hablas de las vainas tiernas verdes y de las alubias secas para el arroz o la olla, ¿cómo las nombras?',
      en: 'How do you name green beans and dry white beans for stews and rice?',
      eu: 'Nola bereizten dituzu leka berde samurrak eta eltzerako babarrun lehorrak?',
      gl: 'Como nomeas as vixetas tenras verdes e os feixóns secos para o arroz ou o pote?',
    },
    opcions: Object.freeze([
      Object.freeze({
        id: 'bajoques_i_fesols',
        etiqueta: 'Bajoques (tendres) i fesols',
        detall: 'Distinció clàssica valenciana i ebrenca entre la tavella tendra i el gra',
        pesos: Object.freeze({ alacanti_vinalopo: 5, comtat_alcoia_marina: 5, safor_costera_albaida_ribera: 5, horta_turia_morvedre: 5, plana_maestrat_ports: 5, ebre_ponent: 5, illes_balears: 2 }),
      }),
      Object.freeze({
        id: 'mongetes',
        etiqueta: 'Mongetes (tendres i seques)',
        detall: '«Mongeta tendra» i «mongeta seca» al català central i gironí',
        pesos: Object.freeze({ catalunya_central_girona: 5, illes_balears: 4, ebre_ponent: 2 }),
      }),
    ]),
  }),
  Object.freeze({
    id: 'q10_espill',
    enunciat: {
      ca: 'On et mires de matí abans d’eixir (o sortir) al carrer?',
      es: '¿Dónde te miras por la mañana antes de salir a la calle?',
      en: 'What word do you use for a mirror?',
      eu: 'Zein hitz erabiltzen duzu ispilua izendatzeko?',
      gl: 'Que palabra usas para o espello onde te miras pola mañá?',
    },
    opcions: Object.freeze([
      Object.freeze({
        id: 'espill',
        etiqueta: 'Espill',
        detall: 'Del llatí speculum; viu a tot el País Valencià i Terres de l’Ebre',
        pesos: Object.freeze({ alacanti_vinalopo: 5, comtat_alcoia_marina: 5, safor_costera_albaida_ribera: 5, horta_turia_morvedre: 5, plana_maestrat_ports: 5, ebre_ponent: 4 }),
      }),
      Object.freeze({
        id: 'mirall',
        etiqueta: 'Mirall',
        detall: 'General a Catalunya oriental, Ponent i les Illes Balears',
        pesos: Object.freeze({ catalunya_central_girona: 5, illes_balears: 5, ebre_ponent: 3 }),
      }),
    ]),
  }),
  Object.freeze({
    id: 'q11_hui_eixir',
    enunciat: {
      ca: 'Quina parella et surt de manera més natural en parlar amb la família?',
      es: '¿Qué pareja de palabras te sale de forma más natural al hablar en casa?',
      en: 'Which pair of everyday words (“today” and “to go out”) feels most natural to you?',
      eu: '«Gaur» eta «irten» esateko, zein bikote ateratzen zaizu berezkoen etxean?',
      gl: 'Que parella de palabras («hoxe» e «saír») che sae de xeito máis natural na casa?',
    },
    opcions: Object.freeze([
      Object.freeze({
        id: 'hui_eixir',
        etiqueta: 'Hui i eixir',
        detall: 'Tret general de la muntanya d’Alacant, el Comtat, la Marina, la Safor, l’Horta i la Plana',
        pesos: Object.freeze({ comtat_alcoia_marina: 5, safor_costera_albaida_ribera: 5, horta_turia_morvedre: 5, plana_maestrat_ports: 4, alacanti_vinalopo: 4 }),
      }),
      Object.freeze({
        id: 'avui_eixir',
        etiqueta: 'Avui i eixir',
        detall: 'Joia genuïna del valencià alacantí i les Valls del Vinalopó',
        pesos: Object.freeze({ alacanti_vinalopo: 6, comtat_alcoia_marina: 2 }),
      }),
      Object.freeze({
        id: 'avui_sortir',
        etiqueta: 'Avui i sortir',
        detall: 'General a l’Ebre, Ponent, Catalunya Central, Balears i nord del Maestrat',
        pesos: Object.freeze({ ebre_ponent: 5, catalunya_central_girona: 5, illes_balears: 5, plana_maestrat_ports: 3 }),
      }),
    ]),
  }),
  Object.freeze({
    id: 'q12_comboi',
    enunciat: {
      ca: 'Quan s’arma bon ambient, il·lusió i ganes de fer festa amb la quadrilla, com en dieu?',
      es: 'Cuando se arma buen ambiente, ilusión y ganas de fiesta con la cuadrilla, ¿cómo lo llamáis?',
      en: 'When excitement, togetherness and festive spirit build up among friends, what do you call it?',
      eu: 'Lagunartean giro ona, ilusioa eta festa-gogoa sortzen denean, nola deitzen diozue?',
      gl: 'Cando se arma bo ambiente, ilusión e ganas de troula coa cuadrilla, como lle chamades?',
    },
    opcions: Object.freeze([
      Object.freeze({
        id: 'comboi',
        etiqueta: 'Comboi',
        detall: 'Paraula reina d’entusiasme compartit a les comarques valencianes',
        pesos: Object.freeze({ safor_costera_albaida_ribera: 6, horta_turia_morvedre: 6, comtat_alcoia_marina: 4, plana_maestrat_ports: 4, alacanti_vinalopo: 4 }),
      }),
      Object.freeze({
        id: 'xerinola',
        etiqueta: 'Xerinola o gresca',
        detall: 'O «bureo» als Ports i Maestrat; «xerinola» i «gresca» al Principat',
        pesos: Object.freeze({ catalunya_central_girona: 5, ebre_ponent: 5, plana_maestrat_ports: 3, comtat_alcoia_marina: 2 }),
      }),
      Object.freeze({
        id: 'bauxa',
        etiqueta: 'Bauxa',
        detall: 'Anar de bauxa o fer bauxa, genuí de les Illes Balears',
        pesos: Object.freeze({ illes_balears: 6 }),
      }),
    ]),
  }),
]);

/* Càlcul del màxim teòric assolible per cada àrea sobre les 12 preguntes,
   perquè el percentatge de coincidència siga matemàticament just (0..100 %). */
const MAXIM_PER_AREA = Object.freeze((() => {
  const maxims = {};
  for (const area of AREES_DIALECTALS) {
    let suma = 0;
    for (const pregunta of PREGUNTES_ISOGLOSSES) {
      let millor = 0;
      for (const opcio of pregunta.opcions) {
        const punts = opcio.pesos[area.id] || 0;
        if (punts > millor) millor = punts;
      }
      suma += millor;
    }
    maxims[area.id] = Math.max(suma, 1);
  }
  return maxims;
})());

function normalitzaClauMot(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function infereixAreaDesDeText(comarcaId = '', pobleText = '') {
  const comarcaObj = COMARQUES_ENQUESTA.find((c) => c.id === comarcaId);
  if (comarcaObj?.areaId) return comarcaObj.areaId;
  const text = normalitzaClauMot(`${comarcaId} ${pobleText}`);
  if (/torre_de_les_macanes|xixona|alacant|sant_vicent|agost|novelda|vinalopo|elx|guardamar/.test(text)) return 'alacanti_vinalopo';
  if (/alcoi|cocentaina|muro|agres|comtat|banyeres|denia|xabia|callosa|marina/.test(text)) return 'comtat_alcoia_marina';
  if (/gandia|xativa|ontinyent|bocairent|alzira|safor|costera|albaida|ribera/.test(text)) return 'safor_costera_albaida_ribera';
  if (/valencia|horta|torrent|lliria|sagunt|paterna|turia|morvedre/.test(text)) return 'horta_turia_morvedre';
  if (/castello|vila_real|morella|vinaros|plana|maestrat|ports|alcora/.test(text)) return 'plana_maestrat_ports';
  if (/tortosa|amposta|lleida|ebre|ponent/.test(text)) return 'ebre_ponent';
  if (/mallorca|menorca|eivissa|formentera|palma|balear/.test(text)) return 'illes_balears';
  if (/barcelona|girona|vic|manresa|olot/.test(text)) return 'catalunya_central_girona';
  return '';
}

export function llegeixPerfilTerritoriJoc() {
  const obj = getVal(CLAU_PERFIL_TERRITORI_JOC, null);
  if (!obj || typeof obj !== 'object') return { poble: '', comarcaId: '' };
  return {
    poble: typeof obj.poble === 'string' ? obj.poble.slice(0, 80) : '',
    comarcaId: typeof obj.comarcaId === 'string' ? obj.comarcaId.slice(0, 40) : '',
  };
}

export function desaPerfilTerritoriJoc({ poble = '', comarcaId = '' } = {}) {
  const net = {
    poble: typeof poble === 'string' ? poble.replace(/\s+/g, ' ').trim().slice(0, 80) : '',
    comarcaId: typeof comarcaId === 'string' ? comarcaId.trim().slice(0, 40) : '',
  };
  setVal(CLAU_PERFIL_TERRITORI_JOC, net);
  return net;
}

function llegeixVotsLocalsMapa() {
  const obj = getVal(CLAU_VOTS_VARIANTS_ISOGLOSSES, null);
  return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
}

function extreuPreguntaDeVivaId(opcioVivaId) {
  if (typeof opcioVivaId !== 'string' || !opcioVivaId.startsWith('viva:')) return '';
  const trossos = opcioVivaId.split(':');
  return trossos.length >= 3 ? trossos[1] : '';
}

/**
 * Registra de manera idempotent la selecció del dispositiu per a una pregunta
 * concreta (`R23-U03`). Tornar arrere i clicar la mateixa o una altra opció mai
 * infla artificialment el comptador local: substitueix la selecció d'eixa pregunta.
 */
export function registraSeleccioPreguntaLocal(preguntaId, opcioId) {
  const pregNeta = typeof preguntaId === 'string' ? preguntaId.trim() : '';
  if (!pregNeta || typeof opcioId !== 'string' || !opcioId) return;
  const mapa = llegeixVotsLocalsMapa();
  const perPregunta = mapa.perPregunta && typeof mapa.perPregunta === 'object' && !Array.isArray(mapa.perPregunta)
    ? { ...mapa.perPregunta }
    : {};
  perPregunta[pregNeta] = opcioId;
  const seguent = { ...mapa, perPregunta };
  setVal(CLAU_VOTS_VARIANTS_ISOGLOSSES, seguent);
}

export function votaVariantVivaLocal(opcioVivaId, preguntaIdOpcional = '') {
  if (typeof opcioVivaId !== 'string' || !opcioVivaId.startsWith('viva:')) return;
  const pregId = preguntaIdOpcional || extreuPreguntaDeVivaId(opcioVivaId);
  if (pregId) {
    registraSeleccioPreguntaLocal(pregId, opcioVivaId);
  }
}

function teVotLocalIdempotent(mapaVots, preguntaId, opcioVivaId) {
  const perPregunta = mapaVots?.perPregunta;
  if (perPregunta && typeof perPregunta === 'object' && preguntaId in perPregunta) {
    return perPregunta[preguntaId] === opcioVivaId ? 1 : 0;
  }
  /* Compatibilitat amb entrades numèriques anteriors capades estrictament a 0 o 1 */
  return Number(mapaVots?.[opcioVivaId]) > 0 ? 1 : 0;
}

function afegeixCubellTerritorial(registre, {
  poble = '',
  comarcaId = '',
  comarcaNom = '',
  areaId = '',
  abastComarcal = 'no_ho_se',
  vots = 0,
  esLlavor = false,
}) {
  const pes = Math.max(0, Number(vots) || 0);
  if (pes <= 0) return;
  const pobleNet = typeof poble === 'string' ? poble.trim() : '';
  const comarcaIdNeta = typeof comarcaId === 'string' && comarcaId !== 'no_ho_se' ? comarcaId.trim() : '';
  const comarcaObj = COMARQUES_ENQUESTA.find((c) => c.id === comarcaIdNeta);
  const comarcaNomNet = comarcaNom || comarcaObj?.nom || '';
  const areaInferida = areaId || infereixAreaDesDeText(comarcaIdNeta, pobleNet);
  const clauCubell = `${comarcaIdNeta || '_'}|${normalitzaClauMot(pobleNet) || '_'}`;

  const cubellExistent = registre.cubells.get(clauCubell);
  if (cubellExistent) {
    cubellExistent.vots += pes;
    if (!cubellExistent.poble && pobleNet) cubellExistent.poble = pobleNet;
    if (!cubellExistent.comarcaNom && comarcaNomNet) cubellExistent.comarcaNom = comarcaNomNet;
    if (!cubellExistent.areaId && areaInferida) cubellExistent.areaId = areaInferida;
    if (cubellExistent.abastComarcal === 'no_ho_se' && abastComarcal && abastComarcal !== 'no_ho_se') {
      cubellExistent.abastComarcal = abastComarcal;
    }
  } else {
    registre.cubells.set(clauCubell, {
      poble: pobleNet,
      comarcaId: comarcaIdNeta,
      comarcaNom: comarcaNomNet,
      areaId: areaInferida,
      abastComarcal: abastComarcal || 'no_ho_se',
      vots: pes,
      esLlavor,
    });
  }

  if (areaInferida) {
    registre.pesosArea[areaInferida] = (registre.pesosArea[areaInferida] || 0) + pes;
  }
}

function seleccionaCubellDominant(cubellsMap) {
  const llista = [...cubellsMap.values()];
  if (llista.length === 0) {
    return { poble: '', comarcaId: '', comarcaNom: '', areaId: '', abastComarcal: 'no_ho_se' };
  }
  llista.sort((a, b) => {
    if (b.vots !== a.vots) return b.vots - a.vots;
    const completA = (a.poble ? 1 : 0) + (a.comarcaNom ? 1 : 0);
    const completB = (b.poble ? 1 : 0) + (b.comarcaNom ? 1 : 0);
    if (completB !== completA) return completB - completA;
    if (a.esLlavor !== b.esLlavor) return a.esLlavor ? -1 : 1;
    return 0;
  });
  return llista[0];
}

/**
 * Construeix les opcions vives aportades pel poble per a una pregunta concreta,
 * fusionant la llavor documentada, el resum remot coherent per comarca quan
 * estiga disponible al port neutral (`R23-U05`) i les aportacions i la selecció
 * idempotent del dispositiu (`R23-U03`).
 */
export function construeixOpcionsVivesPregunta(preguntaId, aportacionsLocals = [], resumRemot = []) {
  if (!preguntaId) return [];
  const votsMapa = llegeixVotsLocalsMapa();
  const agrupades = new Map();

  const obtinguesOCrea = (clau, etiquetaInicial) => {
    let reg = agrupades.get(clau);
    if (!reg) {
      reg = {
        id: `viva:${preguntaId}:${clau}`,
        clauMot: clau,
        etiqueta: etiquetaInicial || clau,
        votsLlavor: 0,
        votsRemots: 0,
        votsAportatsLocals: 0,
        cubells: new Map(),
        pesosArea: {},
      };
      agrupades.set(clau, reg);
    }
    return reg;
  };

  for (const llavor of VARIANTS_POBLE_LLAVOR) {
    if (llavor.preguntaId !== preguntaId) continue;
    const clau = normalitzaClauMot(llavor.paraula);
    if (!clau) continue;
    const pesLlavor = Math.max(1, Number(llavor.votsBase) || 1);
    const reg = obtinguesOCrea(clau, llavor.paraula);
    reg.votsLlavor += pesLlavor;
    afegeixCubellTerritorial(reg, {
      poble: llavor.poble,
      comarcaId: llavor.comarcaId || '',
      comarcaNom: llavor.comarcaNom,
      areaId: llavor.areaId,
      abastComarcal: llavor.abastComarcal,
      vots: pesLlavor,
      esLlavor: true,
    });
  }

  const llistaRemota = Array.isArray(resumRemot) ? resumRemot : [];
  for (const fila of llistaRemota) {
    const pregRem = fila?.pregunta_id || fila?.preguntaId || '';
    if (pregRem !== preguntaId) continue;
    const paraulaFila = fila?.paraula_etiqueta || fila?.paraula || '';
    const clau = normalitzaClauMot(fila?.variant_clau || paraulaFila);
    if (!clau) continue;
    const votsRemots = Math.max(0, Number(fila?.total_vots ?? fila?.vots) || 0);
    if (votsRemots <= 0) continue;
    const poble = fila?.poble_exemple || fila?.poble || '';
    const comarcaId = fila?.comarca_id || fila?.comarcaId || '';
    const reg = obtinguesOCrea(clau, paraulaFila || clau);
    reg.votsRemots += votsRemots;
    afegeixCubellTerritorial(reg, {
      poble,
      comarcaId,
      vots: votsRemots,
      esLlavor: false,
    });
  }

  const llista = Array.isArray(aportacionsLocals) ? aportacionsLocals : [];
  for (const ap of llista) {
    const pregAp = ap?.preguntaId || (normalitzaClauMot(ap?.paraula).includes('quer') ? 'q01_creilla' : '');
    if (pregAp !== preguntaId) continue;
    const clau = normalitzaClauMot(ap?.paraula);
    if (!clau) continue;
    const poble = ap?.poble || ap?.pobleComarca || '';
    const reg = obtinguesOCrea(clau, ap.paraula);
    reg.votsAportatsLocals += 1;
    afegeixCubellTerritorial(reg, {
      poble,
      comarcaId: ap?.comarcaId || '',
      comarcaNom: ap?.comarcaNom || '',
      areaId: ap?.areaId || '',
      abastComarcal: ap?.abastComarcal || 'no_ho_se',
      vots: 1,
      esLlavor: false,
    });
  }

  const items = [...agrupades.values()].map((reg) => {
    const votSeleccioLocal = reg.votsAportatsLocals > 0
      ? 0
      : teVotLocalIdempotent(votsMapa, preguntaId, reg.id);
    const votsLocalsDispositiu = reg.votsAportatsLocals + votSeleccioLocal;
    const vots = reg.votsLlavor + reg.votsRemots + votsLocalsDispositiu;
    const dominant = seleccionaCubellDominant(reg.cubells);
    const detallDominant = dominant.comarcaNom && dominant.poble && !dominant.poble.includes(dominant.comarcaNom)
      ? `${dominant.poble} (${dominant.comarcaNom})`
      : (dominant.poble || dominant.comarcaNom || '');
    const nombreComarquesDistintes = new Set(
      [...reg.cubells.values()].map((c) => c.comarcaId).filter(Boolean)
    ).size;
    const detall = nombreComarquesDistintes > 1 && detallDominant
      ? `${detallDominant} +${nombreComarquesDistintes - 1}`
      : detallDominant;

    return {
      id: reg.id,
      clauMot: reg.clauMot,
      etiqueta: reg.etiqueta,
      poble: dominant.poble,
      comarcaId: dominant.comarcaId,
      comarcaNom: dominant.comarcaNom,
      areaId: dominant.areaId,
      abastComarcal: dominant.abastComarcal,
      pesosArea: { ...reg.pesosArea },
      votsLlavor: reg.votsLlavor,
      votsRemots: reg.votsRemots,
      votsLocalsDispositiu,
      vots,
      detall,
    };
  }).sort((a, b) => b.vots - a.vots);

  const totalVots = items.reduce((acc, item) => acc + item.vots, 0) || 1;
  return items.map((item) => ({
    ...item,
    percentatgeConsens: Math.round((item.vots / totalVots) * 100),
  }));
}

/**
 * Construeix la ruta canònica SPA per debatre al Xat de Poble una paraula del
 * joc o el resultat general sobre el fil públic de «La Veu de Sóc de Poble».
 */
export function rutaDebatXatParaula(pregunta = null) {
  const etiquetes = Array.isArray(pregunta?.opcions)
    ? pregunta.opcions.slice(0, 3).map((o) => o.etiqueta).filter(Boolean).join(' / ')
    : '';
  const titol = etiquetes
    ? `La Veu de Sóc de Poble · ${etiquetes}`
    : 'La Veu de Sóc de Poble · D’on parles?';
  const params = new URLSearchParams({
    sobre: 'publicacio:la-veu-de-soc-de-poble',
    titol: titol.slice(0, 180),
    ruta: '/mur/la-veu-de-soc-de-poble',
  });
  return `/xat?${params.toString()}`;
}

/**
 * Calcula el rànquing determinista d'afinitat comarcal a partir de les respostes
 * `{ [preguntaId]: opcioId }`, incloent variants vives de poble (`viva:...`).
 *
 * @param {Record<string, string>} respostes
 * @param {Array<object>} [aportacionsLocals]
 * @param {Array<object>} [resumRemot]
 * @returns {{ guanyadora: object, ranquing: Array<{ area: object, punts: number, percentatge: number }> }}
 */
export function calculaAfinitatComarcal(respostes = {}, aportacionsLocals = [], resumRemot = []) {
  const entrades = respostes && typeof respostes === 'object' ? respostes : {};
  const puntsPerArea = {};
  for (const area of AREES_DIALECTALS) puntsPerArea[area.id] = 0;

  for (const pregunta of PREGUNTES_ISOGLOSSES) {
    const triada = entrades[pregunta.id];
    if (typeof triada !== 'string') continue;
    if (triada.startsWith('viva:')) {
      const vives = construeixOpcionsVivesPregunta(pregunta.id, aportacionsLocals, resumRemot);
      const viva = vives.find((v) => v.id === triada);
      const entradesPesos = viva?.pesosArea
        ? Object.entries(viva.pesosArea).filter(([areaId, vots]) => areaId in puntsPerArea && vots > 0)
        : [];
      const sumaPesos = entradesPesos.reduce((acc, [, vots]) => acc + vots, 0);
      if (sumaPesos > 0) {
        for (const [areaId, vots] of entradesPesos) {
          puntsPerArea[areaId] += (vots / sumaPesos) * 6;
        }
      } else if (viva?.areaId && viva.areaId in puntsPerArea) {
        puntsPerArea[viva.areaId] += 6;
      }
      continue;
    }
    const opcio = pregunta.opcions.find((o) => o.id === triada);
    if (!opcio) continue;
    for (const [areaId, valor] of Object.entries(opcio.pesos)) {
      if (areaId in puntsPerArea) puntsPerArea[areaId] += valor;
    }
  }

  const ranquing = AREES_DIALECTALS.map((area) => {
    const punts = puntsPerArea[area.id] || 0;
    const maxim = MAXIM_PER_AREA[area.id] || 1;
    const percentatge = Math.min(100, Math.round((punts / maxim) * 100));
    return { area, punts, percentatge };
  }).sort((a, b) => (b.percentatge - a.percentatge) || (b.punts - a.punts));

  return {
    guanyadora: ranquing[0]?.area || AREES_DIALECTALS[0],
    ranquing,
  };
}

/** Construeix el missatge de compartició per WhatsApp amb URL canònica. */
export function construeixTextCompartirWhatsApp(resultat, urlCanonica = 'https://socdepoble.org/mur/la-veu-de-soc-de-poble') {
  const millor = resultat?.ranquing?.[0];
  if (!millor) return `Descobreix d’on ve la teua parla a Sóc de Poble: ${urlCanonica}`;
  return `🗣️ Al joc «D’on parles?» de Sóc de Poble m’ha eixit un ${millor.percentatge} % d’afinitat amb ${millor.area.nom}! Prova-ho i mira quina veu et trau: ${urlCanonica}`;
}

/** Construeix l'URL directa `wa.me` amb el resultat del joc d'isoglosses. */
export function urlCompartirWhatsappIsoglosses(resultat, urlCanonica = 'https://socdepoble.org/mur/la-veu-de-soc-de-poble') {
  return `https://wa.me/?text=${encodeURIComponent(construeixTextCompartirWhatsApp(resultat, urlCanonica))}`;
}

export const AREES_COMARCALS = AREES_DIALECTALS;

/** Llig les variants lèxiques proposades localment en este dispositiu. */
export function llegeixAportacionsIsoglossesLocals() {
  const llista = getVal(CLAU_APORTACIONS_LOCALS_ISOGLOSSES, null);
  return Array.isArray(llista) ? llista.slice(0, 50) : [];
}

/** Saneja i desa una variant lèxica proposada per l'usuari (coacció estricta, amb Poble + Comarca + Abast separats). */
export function desaAportacioIsoglossaLocal({
  paraula,
  poble = '',
  comarcaId = '',
  abastComarcal = 'no_ho_se',
  pobleComarca = '',
  preguntaId = '',
  consentiment = false,
} = {}) {
  if (consentiment !== true) return { ok: false, motiu: 'consentiment' };
  const motNet = typeof paraula === 'string' ? paraula.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
  const pobleSol = typeof poble === 'string' && poble.trim()
    ? poble.replace(/\s+/g, ' ').trim().slice(0, 80)
    : (typeof pobleComarca === 'string' ? pobleComarca.replace(/\s+/g, ' ').trim().slice(0, 120) : '');
  const comarcaValida = COMARQUES_ENQUESTA.find((c) => c.id === comarcaId) || null;
  const comarcaNom = comarcaValida && comarcaValida.id !== 'no_ho_se' ? comarcaValida.nom : '';
  const abastValid = OPCIONS_ABAST_COMARCAL.some((o) => o.id === abastComarcal) ? abastComarcal : 'no_ho_se';
  const preguntaNeta = typeof preguntaId === 'string' ? preguntaId.trim().slice(0, 80) : '';
  if (motNet.length < 2 || pobleSol.length < 2) return { ok: false, motiu: 'camps' };

  const etiquetaTerritori = comarcaNom && !pobleSol.includes(comarcaNom)
    ? `${pobleSol} · ${comarcaNom}`
    : pobleSol;
  const clauMot = normalitzaClauMot(motNet);
  const opcioVivaId = preguntaNeta && clauMot ? `viva:${preguntaNeta}:${clauMot}` : '';

  const registre = {
    id: `iso-${Date.now()}`,
    paraula: motNet,
    poble: pobleSol,
    comarcaId: comarcaValida?.id || '',
    comarcaNom,
    areaId: infereixAreaDesDeText(comarcaValida?.id || '', pobleSol),
    abastComarcal: abastValid,
    pobleComarca: etiquetaTerritori,
    preguntaId: preguntaNeta,
    opcioVivaId,
    consentimentArxiuObert: true,
    consentimentVersio: 'cc-by-sa-4.0-v1',
    consentimentAcceptatAt: new Date().toISOString(),
  };

  if (pobleSol) {
    desaPerfilTerritoriJoc({ poble: pobleSol, comarcaId: comarcaValida?.id || '' });
  }

  const actuals = llegeixAportacionsIsoglossesLocals();
  const noves = [registre, ...actuals].slice(0, 50);
  if (typeof window !== 'undefined' && !setVal(CLAU_APORTACIONS_LOCALS_ISOGLOSSES, noves)) {
    /* Honestedat Llei 0 (R23-U02): si falla la persistència local, no mentim mai dient que s'ha guardat. */
    return { ok: false, motiu: 'emmagatzematge', registre, opcioVivaId };
  }
  return { ok: true, registre, opcioVivaId, totalLocals: noves.length };
}
