/**
 * anatomiaRural.js — Les dades de l'Anatomia d'Enginyeria Tradicional Rural
 * (IDEA-109, onada R7). Vuit estructures, cada una amb les seues peces
 * ordenades de baix a dalt (les verticals) i, al final, les laterals.
 *
 * Regles (R7G-13 i F1, límits de l'àrbitre):
 *  · Els TERMES surten de les fonts del Mestre, que viuen a
 *    _cultura_de_poble: «El lèxic de l'olivera, l'oliva i l'oli al Comtat» i
 *    «El lèxic del raïm i del vi al Comtat» (Josep Vicent Cascant), el llibre
 *    «Molí fariner elèctric de La Torre de les Maçanes» (Associació El
 *    Rentonar), l'article «El pou de la neu del Rentonar» (WP 3656, Josep
 *    Maria Segura Martí) i el catàleg «Gràfics de Poble» (Javi Llinares).
 *    Cap terme nou: el que el Mestre havia donat i les fonts no confirmen va
 *    a `aliesPendents` o és una peça `pendent`.
 *  · La DEFINICIÓ només diu allò que diu la font. On la font només dona el
 *    nom de la peça, la definició és DEFINICIO_PLANOL i la peça és pendent.
 *  · Cada xifra va a `cotes` amb la seua font i un `estat`: 'ok' (confirmada
 *    per una font), 'unica' (només una font la dona), 'discrepant' (les fonts
 *    no coincidixen: es mostren totes) o 'pendent' (cap font del disc la
 *    confirma). Cap xifra no s'inventa.
 *  · El dibuix és un esquema il·lustratiu: la posició i la forma de cada peça
 *    són orientatives (el visor ho avisa). Les alçades de la pila es
 *    normalitzen: són unitats de l'esquema, no mesures (les mesures reals
 *    són a `cotes`).
 *  · `documental.videoId` és l'identificador real d'un vídeo, amb l'autoria
 *    que YouTube hi consigna; sense vídeo, null i enllaç al canal.
 *
 * Les peces de `lateral` no s'apilen: se separen cap als costats (accessoris
 * o conceptes que no formen part de la pila). Les de tipus `marcador` no són
 * cap objecte: són conceptes (un transport, una cocció) i es dibuixen com un
 * punt amb un símbol.
 */

export const CANAL_MONESMA = 'https://www.youtube.com/@eugeniomonesma-documentales';
export const CANAL_SANGONERETA = 'https://www.youtube.com/@sangoneretagastronomia8519';

/** Marca de «sense font encara»: no s'inventa cap referència. */
export const FONT_PENDENT = 'font pendent';
export const FONT_OLI = 'El lèxic de l’olivera, l’oliva i l’oli al Comtat (Josep Vicent Cascant)';
export const FONT_POU = 'El pou de la neu del Rentonar (socdepoble.net, WP 3656; Josep Maria Segura Martí)';
export const FONT_MOLI_ELECTRIC = 'Molí fariner elèctric de La Torre de les Maçanes (Associació El Rentonar; text de Joan Domènech, edició de Javi Llinares)';
export const FONT_GRAFICS = 'Gràfics de Poble (Javi Llinares)';
export const FONT_MOLI_HIDRAULIC = 'Gràfics de Poble (Javi Llinares) i El lèxic del blat al Comtat (Josep Vicent Cascant)';
export const FONT_VI = 'Gràfics de Poble (Javi Llinares) i El lèxic del raïm i del vi al Comtat (Josep Vicent Cascant)';

export const DEFINICIO_PENDENT = 'Terme indicat pel Mestre. Funció pendent de contrastar amb la font.';
export const DEFINICIO_PLANOL = 'Peça del plànol de Gràfics de Poble. Funció pendent de contrastar amb la font.';

const CORPUS = 'corpus unificat, plànol de Gràfics de Poble';
const ARTICLE = 'WP 3656';

const documentalMonesma = (videoId = null, titol = null) => Object.freeze({
  canal: CANAL_MONESMA, autor: 'Eugenio Monesma', videoId, titol, llengua: titol ? 'es' : null
});
const documentalSangonereta = (videoId, titol) => Object.freeze({
  canal: CANAL_SANGONERETA, autor: 'Sangonereta Gastronomia', videoId, titol, llengua: 'ca'
});

const cota = (etiqueta, valor, font, estat = 'ok', nota = null) => Object.freeze({ etiqueta, valor, font, estat, nota });

/* ── Constructors de peces. `alt` és relativa: la pila es normalitza. ── */
const ALT_MAX_PILA = 170;
const v = (id, terme, definicio, classe, forma, extra = {}) => ({ id, terme, definicio, classe, forma, pendent: false, ...extra });
const l = (id, terme, definicio, classe, costat, forma, extra = {}) => ({ id, terme, definicio, classe, costat, forma, pendent: false, ...extra });
const cil = (r, alt, fileres = 0) => ({ f: 'cil', r, alt, fileres });
const pris = (w, d, alt, fileres = 0) => ({ f: 'pris', w, d, alt, fileres });
const con = (r1, r2, alt) => ({ f: 'con', r1, r2, alt });
const cup = (r, alt, fileres = 0) => ({ f: 'cup', r, alt, fileres });
const marca = (glif) => ({ f: 'marcador', glif });
const radiDe = (s) => ({ cil: s.r, pris: Math.max(s.w || 0, s.d || 0) * 0.6, con: Math.max(s.r1 || 0, s.r2 || 0), cup: s.r })[s.f] || 0;

function formaVertical(s, z, h) {
  const base = s.fileres ? { fileres: s.fileres } : {};
  if (s.f === 'cil') return { tipus: 'cilindre', cx: 0, cy: 0, r: s.r, z, h, ...base };
  if (s.f === 'pris') return { tipus: 'prisma', x: -s.w / 2, y: -s.d / 2, w: s.w, d: s.d, z, h, ...base };
  if (s.f === 'con') return { tipus: 'con', cx: 0, cy: 0, r1: s.r1, r2: s.r2, z, h };
  return { tipus: 'cupula', cx: 0, cy: 0, r: s.r, z, h, ...base };
}

/** De les especificacions, les peces amb `forma` (z acumulada) i, les laterals, amb `lateral`. */
function munta(especificacions) {
  const verticals = especificacions.filter((s) => !s.costat);
  const total = verticals.reduce((suma, s) => suma + s.forma.alt, 0);
  const escala = total > ALT_MAX_PILA ? ALT_MAX_PILA / total : 1;
  const radi = Math.max(60, ...verticals.map((s) => radiDe(s.forma)));
  const separacioX = radi + 34;
  const files = { esquerra: 0, dreta: 0 };
  let z = 0;
  return especificacions.map(({ forma, costat, ...peca }) => {
    if (!costat) {
      const h = Math.max(6, Math.round(forma.alt * escala));
      const resultat = { ...peca, forma: formaVertical(forma, z, h) };
      z += h;
      return resultat;
    }
    const signe = costat === 'dreta' ? 1 : -1;
    const u = -26 * files[costat];
    files[costat] += 1;
    const x = signe * separacioX + u;
    const y = u;
    const lateral = { dx: signe * 90, dy: 0 };
    if (forma.f === 'marcador') return { ...peca, lateral, forma: { tipus: 'marcador', x, y, z: 14, glif: forma.glif } };
    return { ...peca, lateral, forma: { tipus: 'prisma', x, y, w: 26, d: 18, z: 0, h: 20 } };
  });
}

const estructura = (dades) => Object.freeze({ ...dades, peces: Object.freeze(munta(dades.peces).map(Object.freeze)) });

/* ═══════════════════════ 1 · POU DE NEU «EL RENTONAR» ═══════════════════════ */
const POU = estructura({
  id: 'pou-de-neu',
  nom: 'Pou de neu o cava',
  font: FONT_POU,
  resum: 'El pou de neu del Rentonar, a La Torre de les Maçanes: un dipòsit de pedra on s’emmagatzemava la neu dels ventisquers, capa a capa, per a l’estiu.',
  documental: documentalMonesma('3RQv3xjVr-M', 'Los EMPOZADORES y las NEVERAS naturales de HIELO. Conservación ancestral de la NIEVE para el verano'),
  cotes: [
    cota('Cota del pou', '1.160 m s/n/m, al ventisquer orientat a llevant', ARTICLE),
    cota('Cim dels Plans', '1.330 m', CORPUS, 'unica', 'L’article només diu que el pou és «baix del cim».'),
    /* Loop 3 (R11) · Les cotes són les de Josep Mª Segura Martí (Eines 7-8, 1987), que reproduïx
       l'article: les mateixes de pouNeuRentonar.js. Les xifres de l'esbós divulgatiu 76150
       (sense autor ni escala) només queden com a nota de discrepància. */
    cota('Fondària des de les finestres superiors', '13,75 m', ARTICLE, 'ok',
      'Damunt, una falsa cúpula hemisfèrica de filades. L’esbós divulgatiu 76150 (sense autor ni escala) diu 18 m d’alçada total (15 m de pou i 3 m de falsa volta): no concorda amb Segura.'),
    cota('Diàmetre interior', '9,80 m', ARTICLE, 'ok', 'L’esbós 76150 hi posa 9,75 m i, a la llegenda, 10 m d’amplària: sense escala.'),
    cota('Gruix del mur', '1,50 m, mesurat a la finestra de l’oest', ARTICLE),
    cota('Capacitat estimada', '1.030 m³', ARTICLE, 'ok', 'El corpus de síntesi diu més de 1.100 m³, sense cap font primària.'),
    cota('Capacitat històrica', '20.000 arroves, calculades per Manuel Rico García (1880)', ARTICLE),
    cota('Túnel d’accés sud', '9,10 m de longitud, amb volta rebaixada de maçoneria: boca de 2,35 m d’ample i ingrés d’1,35 × 1,55 m a +10,00 m sobre el fons', ARTICLE),
    cota('Galeria d’escorredor, a l’est', '29 m en línia recta, de 0,50 m d’ample per 0,70 m d’altura', ARTICLE, 'ok',
      'L’esbós 76150 la parteix en 24 m i 5 m i hi dona una boca de 43 cm.'),
    cota('Finestres superiors', '3 (nord, oest i est), d’1,55 m d’ample i 1,70 m d’altura màxima; hui només la de l’oest és oberta', ARTICLE),
    cota('Estreps d’arcs', '4, que formen 2 arcs creuats (NE-SW i NW-SE)', ARTICLE),
    cota('Època', 'bastit entre els segles XVII i XVIII; documentat de 1724 a 1880', ARTICLE)
  ],
  peces: [
    v('pouet-drenatge', 'pouet de drenatge',
      'Pou xicotet de drenatge: l’aigua s’hi escorre. Terme indicat pel Mestre; l’article només descriu un desguàs en forma de galeria.',
      'pedra', cil(22, 20), { pendent: true }),
    v('neu-piconada', 'capes de neu piconada amb maces',
      'Dins del pou, una quadrilla xafava la neu amb maces de fusta, des del centre cap a les parets, fins a expulsar l’aire i fer-ne glaç compacte.',
      'neu', cil(70, 60), { nota: 'Només el corpus ho conta; l’article no ho detalla.' }),
    v('palla', 'palla',
      'Capa de palla (també argilaga o boll) entre les capes de neu premsada: aïlla i facilita el tall a l’estiu.',
      'palla', cil(70, 10), { nota: 'Només el corpus ho conta; l’article no ho detalla.' }),
    v('estreps', 'estreps d’arcs creuats',
      'Restes de quatre estreps d’arcs de carreus embotits al mur, entre l’ingrés sud i les finestres: dos arcs creuats (NE-SW i NW-SE) que sostenien l’antiga coberta.',
      'pedra', cil(72, 14)),
    v('finestres', 'finestres superiors',
      'Tres ingressos superiors (nord, oest i est), quasi tots cegats; el de l’oest és obert, d’1,55 m d’amplària per 1,70 m d’altura, en un mur d’1,50 m de gruix.',
      'pedra', cil(78, 16)),
    v('cupula', 'cúpula de pedra en sec',
      'Falsa volta: coberta hemisfèrica bastida per aproximació successiva de filades de pedra, sense arcs que la sostinguen.',
      'pedra', cup(78, 70, 3), { alies: ['falsa volta'], nota: 'La fàbrica en sec és el terme del Mestre; l’article diu «filades de pedra» sense precisar el morter.' }),
    v('boca', 'boca d’entrada', 'Boca d’entrada de la cava.', 'pedra', pris(30, 30, 24)),
    l('galeria', 'galeria d’escorredor',
      'Estret passadís a l’est que, des del punt més baix del pou, desemboca a l’exterior: uns 29 m en línia recta, la major part excavat en terra (tap) i, al principi i al final, amb el sostre enllosat de grans pedres planes.',
      'pedra', 'dreta', pris(0, 0, 0), { alies: ['desguàs'], nota: 'El plànol dona 24 m i 5 m amb una boca de 43 cm; l’article, 29 m i 0,50 × 0,70 m.' }),
    l('tunel-sud', 'túnel d’accés sud',
      'Túnel amb volta rebaixada de maçoneria, de 9,10 m de longitud, que s’estreta fins a l’ingrés (1,35 m d’ample per 1,55 m d’altura), a 10 m damunt del fons del pou.',
      'pedra', 'esquerra', pris(0, 0, 0)),
    l('sarries', 'sàrries',
      'Senalles en què les bèsties dels arriers portaven la neu dels pous durant els mesos d’estiu.',
      'fusta', 'dreta', pris(0, 0, 0)),
    l('ventisquer', 'ventisquer',
      'Lloc on s’arreplegava la neu durant l’hivern, amb pales, rastrons i cabassos, per portar-la al pou.',
      'marcador', 'esquerra', marca('❄'), { nota: 'Pales, rastrons i cabassos: només el corpus.' }),
    l('transport-nocturn', 'transport nocturn amb matxos',
      'A l’estiu, el glaç es tallava en blocs, s’embolicava amb palla i es duia de nit a llom de matxos.',
      'marcador', 'dreta', marca('☾'), { nota: 'Només el corpus ho conta; l’article parla dels arriers i les bèsties.' })
  ]
});

/* ═══════════════════════ 2 · ALMÀSSERA (19 PECES) ═══════════════════════ */
const ALMASSERA = estructura({
  id: 'almassera',
  nom: 'Almàssera o tafona d’oli',
  font: FONT_OLI,
  resum: 'L’almàssera de sang i l’elèctrica o hidràulica: els 19 elements numerats del plànol de Javi Llinares, amb el lèxic de Josep Vicent Cascant.',
  documental: documentalSangonereta('_knm0PiGE9A', 'L’olivera i l’oli al Comtat (1990)'),
  cotes: [
    cota('Elements del plànol', '19, numerats', CORPUS),
    cota('Barcella', '12,5 kg; l’armut (almud) és la quarta part: 3,125 kg', FONT_OLI),
    cota('Cànter o arrova', '12,5 litres; el quarteró, 3,125 litres (la màquila)', FONT_OLI),
    cota('Gerra de test', '20 arroves, 250 litres', FONT_OLI),
    cota('Peu d’esportins', '15–20 esportins apilats', FONT_OLI),
    cota('Una parada', '8 hores de premsa; 150–300 kg d’olives', FONT_OLI)
  ],
  peces: [
    v('bassetes', 'bassetes de decantació',
      'Bassetes on arribava l’oli per canaletes: el trastellador parava la canaleta i omplia cada basseta. La primera dona la flor de l’oli; l’última, a un nivell inferior, l’infern, on va la morca.',
      'pedra', pris(120, 40, 18, 2), { num: 16, alies: ['alcasseries', 'bassetes de l’infern'], aliesPendents: ['bassons de decantació'] }),
    v('jac', 'jaç o safa de pedra',
      'Plataforma circular de pedra on es mol l’oliva.',
      'pedra', cil(75, 14), { num: 6, alies: ['safa', 'curro (a Gaianes)'] }),
    v('molo', 'moló, rutló, mola o trompellot',
      'Pedra de molí, troncocònica, que passa sobre l’oliva del jaç, la desfà i en fa la pasta d’oliva.',
      'pedra', con(36, 26, 44), { num: 7, alies: ['moló', 'rutló', 'mola', 'trompellot'], aliesPendents: ['rull troncocònic de pedra'] }),
    v('gronsa', 'gronsa o tremuja',
      'Mena d’embut o dipòsit que dosificava la caiguda de l’oliva al jaç de pedra.',
      'fusta', con(14, 34, 26), { num: 2, alies: ['tremuja', 'tolva'], aliesPendents: ['tramuja'] }),
    v('esportins', 'esportins',
      'Cabassos plans d’espart, de dos discs cosits, amb un buit central per on s’hi posa la pasta d’oliva. De 15 a 20 apilats formen el peu de la premsa.',
      'palla', cil(26, 14, 3), { num: 8, alies: ['esportí', 'peu', 'esportins d’espart'] }),
    v('premses', 'premses',
      'Estrenyien els esportins i en despullaven l’oli: de biga, de barra, de ferro d’un fusell (o dos, o caragol) o de carraca. El fusell feia baixar el plat entre les cuixeres.',
      'fusta', pris(150, 16, 14), { num: 10, alies: ['premsa de biga', 'fusell', 'cuixeres', 'plat'], aliesPendents: ['premsa de biga i quintar'] }),
    v('barra', 'barra de fusta',
      'Palanca de fusta que s’introduïa per fer quarts de volta i estrènyer la premsa.',
      'fusta', pris(150, 8, 8), { num: 11 }),
    l('barcella', 'bàscula o barcella',
      'Es pesaven les olives abans de moldre-les. La barcella és la mesura bàsica: 12,5 kg.',
      'palla', 'esquerra', pris(0, 0, 0), { num: 1, alies: ['barcella', 'bàscula'] }),
    l('matxo', 'matxo o motor elèctric',
      'L’almasserer nugava el matxo a una barra de fusta que feia girar el moló sobre el jaç; a les almàsseres elèctriques i hidràuliques ho feia un motor.',
      'marcador', 'dreta', marca('M'), { num: 3 }),
    l('pessebre', 'pessebre',
      'Quadra, en un racó de l’almàssera, on descansava i menjava el matxo després de fer voltes al jaç.',
      'fusta', 'esquerra', pris(0, 0, 0), { num: 4 }),
    l('arbre', 'arbre',
      'Eix vertical que aguantava tota l’estructura i transmetia el gir.',
      'fusta', 'dreta', pris(0, 0, 0), { num: 5, alies: ['albre'] }),
    l('vagoneta', 'vagoneta',
      'A les premses hidràuliques, vagoneta amb raïls on s’introduïen els esportins; pujava fins a tocar el plat perquè despullaren l’oli.',
      'fusta', 'esquerra', pris(0, 0, 0), { num: 9, nota: 'El Vulcano, de Rodes Hermanos (Alcoi), és l’exemple que cita el corpus.' }),
    l('clau', 'clau', DEFINICIO_PLANOL, 'fusta', 'dreta', pris(0, 0, 0), { num: 12, pendent: true }),
    l('argue', 'argue o gat, i triturador',
      'L’argue és una barra de fusta vertical on s’enrotllava una corda connectada a la premsa; el gat n’és la variant moderna, amb rodes dentades i maneta. El triturador, un molinet manual, desfeia el pinyol de la primera premsada.',
      'fusta', 'esquerra', pris(0, 0, 0), { num: 13, alies: ['argue', 'gat', 'triturador'], aliesPendents: ['àrguens'] }),
    l('foguer', 'foguer amb caldera',
      'Servia per escalfar aigua quan la pasta era massa eixuta, i afegir-la als esportins de la segona premsada perquè l’oli despullara millor.',
      'pedra', 'dreta', pris(0, 0, 0), { num: 14 }),
    l('pou-aigua', 'pou d’aigua',
      'El pou amb l’aigua que es feia servir quan feia falta.',
      'pedra', 'esquerra', pris(0, 0, 0), { num: 15 }),
    l('fangs', 'fangs', DEFINICIO_PLANOL, 'pedra', 'dreta', pris(0, 0, 0), { num: 17, pendent: true }),
    l('morca-pinyol', 'morca i pinyol',
      'La morca és el solatge del fons de les bassetes, la ronya de la mòlta; l’oli brut servia per untar paelles o fer sabó. El pinyol són les sobres de la pasta premsada, que es venien a les fàbriques.',
      'palla', 'esquerra', pris(0, 0, 0), { num: 18 }),
    l('gerres', 'dipòsits, gerres de test i cànters',
      'L’oli es trastombava amb carabassí i embut als cànters, es duia a casa amb anganells i s’hi decantava a gerres de test de 20 arroves.',
      'pedra', 'dreta', pris(0, 0, 0), { num: 19, alies: ['gerra de test', 'cànter', 'anganells'] }),
    l('bassa', 'bassa', DEFINICIO_PENDENT, 'pedra', 'esquerra', marca('?'), { pendent: true }),
    l('escalda', 'escaldà', DEFINICIO_PENDENT, 'marcador', 'dreta', marca('?'), { pendent: true })
  ]
});

/* ═══════════════════════ 3 · MOLÍ FARINER HIDRÀULIC ═══════════════════════ */
const MOLI_HIDRAULIC = estructura({
  id: 'moli-hidraulic',
  nom: 'Molí fariner hidràulic',
  font: FONT_MOLI_HIDRAULIC,
  resum: 'El molí d’aigua: la casa del molí o sala de moles, a dalt, i el cacau, la volta subterrània per on l’aigua fa girar la roda.',
  documental: documentalSangonereta('VBzEBQq_4LA', 'El blat i els molins de farina (1988)'),
  cotes: [
    cota('Anys del molí hidràulic de La Torre', '1925–2022', 'cap font del disc', 'pendent',
      'Les fonts donen 1932 per a l’elèctric i 2022 com a any de la 2a edició del llibre; per al hidràulic no hi ha cap any.')
  ],
  peces: [
    v('seq-eixida', 'sèquia d’eixida d’aigua', 'Sèquia per on l’aigua torna al riu. Funció pendent de contrastar amb la font.', 'pedra', pris(110, 30, 14), { pendent: true }),
    v('viga', 'viga o banc', DEFINICIO_PLANOL, 'fusta', pris(100, 20, 12), { pendent: true }),
    v('roda-alems', 'roda d’àlems o rodet', DEFINICIO_PLANOL, 'fusta', cil(50, 20, 2), { pendent: true, alies: ['rodet'] }),
    v('mola-solera', 'mola solera o sotana',
      'La mola fixa, de les dues pedres circulars del molí; damunt gira l’altra. Cada mola té parts picades: el rompent, el molent, les ratlles i les regates.',
      'pedra', cil(70, 16), { alies: ['mola sotana', 'jussana'] }),
    v('mola-volandera', 'mola volandera o sobirana',
      'La mola alta, que es fa rodar damunt la fixa. Es pot alçar o abaixar amb l’alçador, segons la farina que es vol fer.',
      'pedra', cil(70, 16), { alies: ['mola corredora', 'mola sobirana'] }),
    v('gronsa-moli', 'gronsa o tremuja',
      'Tremuja del molí d’oli o de gra.',
      'fusta', con(14, 34, 26), { alies: ['tremuja'] }),
    l('cacau', 'cacau',
      'El buit on està el rodet del molí d’aigua: canal ample que va des de la roda fins a la paret del molí, per on l’aigua s’escola.',
      'pedra', 'esquerra', pris(0, 0, 0)),
    l('segitia', 'segitia o canal',
      'Canal estreta per on cau l’aigua de la presa al rodet.',
      'pedra', 'dreta', pris(0, 0, 0), { alies: ['sagetia', 'canal'] }),
    l('alcador', 'alçador o paleta',
      'Palanca per graduar l’alçada de les moles, segons la farina que es vol fer.',
      'fusta', 'esquerra', pris(0, 0, 0), { alies: ['paleta'] }),
    l('arbre-moli', 'arbre', DEFINICIO_PLANOL, 'fusta', 'dreta', pris(0, 0, 0), { pendent: true }),
    l('templador', 'templador', DEFINICIO_PLANOL, 'fusta', 'esquerra', pris(0, 0, 0), { pendent: true }),
    l('dau', 'dau', DEFINICIO_PLANOL, 'pedra', 'dreta', pris(0, 0, 0), { pendent: true }),
    l('agulla', 'agulla', DEFINICIO_PLANOL, 'fusta', 'esquerra', pris(0, 0, 0), { pendent: true }),
    l('volant', 'volant', DEFINICIO_PLANOL, 'fusta', 'dreta', pris(0, 0, 0), { pendent: true }),
    l('cabra', 'cabra', 'Grua per alçar la mola.', 'fusta', 'esquerra', pris(0, 0, 0)),
    l('sedas', 'sedàs', DEFINICIO_PLANOL, 'palla', 'dreta', pris(0, 0, 0), { pendent: true }),
    l('canalet', 'canalet', DEFINICIO_PLANOL, 'fusta', 'esquerra', pris(0, 0, 0), { pendent: true }),
    l('burro', 'burro', DEFINICIO_PLANOL, 'fusta', 'dreta', pris(0, 0, 0), { pendent: true }),
    l('riscle', 'riscle', DEFINICIO_PLANOL, 'fusta', 'esquerra', pris(0, 0, 0), { pendent: true }),
    l('ull', 'ull', DEFINICIO_PLANOL, 'pedra', 'dreta', pris(0, 0, 0), { pendent: true }),
    l('nailla', 'nailla', DEFINICIO_PLANOL, 'fusta', 'esquerra', pris(0, 0, 0), { pendent: true, alies: ['nadilla'] }),
    l('farinel', 'farinel', DEFINICIO_PLANOL, 'fusta', 'dreta', pris(0, 0, 0), { pendent: true }),
    l('coll-ferro', 'coll-ferro', DEFINICIO_PLANOL, 'fusta', 'esquerra', pris(0, 0, 0), { pendent: true }),
    l('banc-moli', 'banc', DEFINICIO_PLANOL, 'fusta', 'dreta', pris(0, 0, 0), { pendent: true }),
    l('farinera', 'farinera', DEFINICIO_PLANOL, 'fusta', 'esquerra', pris(0, 0, 0), { pendent: true }),
    l('seq-entrada', 'sèquia d’entrada d’aigua', 'Per ací entra l’aigua al molí; el plànol l’anomena també bassa.', 'pedra', 'dreta', pris(0, 0, 0), { alies: ['bassa'] }),
    l('cup-pressio', 'cup de pressió', DEFINICIO_PLANOL, 'pedra', 'esquerra', pris(0, 0, 0), { pendent: true })
  ]
});

/* ═══════════════════════ 4 · MOLÍ FARINER ELÈCTRIC (5 FASES) ═══════════════════════ */
const MOLI_ELECTRIC = estructura({
  id: 'moli-electric',
  nom: 'Molí fariner elèctric',
  font: FONT_MOLI_ELECTRIC,
  resum: 'El molí fariner elèctric de La Torre de les Maçanes: un edifici de dues plantes i soterrani on el blat no es tocava mai amb les mans, de la bàscula a l’ensacadora, en cinc fases.',
  documental: documentalSangonereta('VBzEBQq_4LA', 'El blat i els molins de farina (1988)'),
  cotes: [
    cota('Any d’instal·lació', '1932', FONT_MOLI_ELECTRIC),
    cota('Ampliació', '1934: un cilindre més, de «Francés y Berenguer Hermanos» (Alacant)', FONT_MOLI_ELECTRIC),
    cota('Tancament', 'dècada dels 80; l’últim calendari penjat a l’oficina és de desembre de 1986', `${FONT_MOLI_ELECTRIC}; ${CORPUS}`, 'unica', 'El llibre només parla de la dècada dels 80; el mes i l’any són al corpus.'),
    cota('Molins de cilindres', '3, a la primera planta, amb 4 parells de cilindres de trituració i 1 parell de cilindres compressors cadascun', FONT_MOLI_ELECTRIC),
    cota('Dipòsits de repòs', 'entre 16 i 18 hores segons la duresa del gra', FONT_MOLI_ELECTRIC),
    cota('Plansichter', 'el producte hi passa 4 vegades', FONT_MOLI_ELECTRIC),
    cota('Autoria del llibre', 'redacció de Joan Domènech; edició i maquetació de Javi Llinares; 2a edició, març de 2022', FONT_MOLI_ELECTRIC)
  ],
  peces: [
    v('fase-1', 'fase 1 · recepció del gra',
      'El blat arribava a granel i es pesava a la bàscula; s’hi registrava l’entrada a l’oficina i es buidava a la tolva amb una malla de preneteja. Queia a la tolva del soterrani i els elevadors de catúfols el pujaven a la segona planta.',
      'pedra', pris(110, 70, 30)),
    v('fase-2', 'fase 2 · neteja del gra en dos passos',
      'Primer pas: tarara o desterradora, despedregadora, triarvejón, despuntadora, rentadora-assecadora, dipòsits de repòs i dipòsit de volteig. Segon pas: separador magnètic i satinadora, sedàs de repàs, polvoritzador i dipòsits d’espera i d’oreig.',
      'pedra', pris(110, 70, 36)),
    v('fase-3', 'fase 3 · mòlta del gra',
      'Tres molins de cilindres (Ph. Lafon, José Mª Verdú i Francés y Berenguer), pel motor elèctric, trituren el gra per cisallament amb quatre parells de cilindres estriats i un parell de cilindres compressors completament llisos.',
      'fusta', pris(110, 70, 30)),
    v('fase-4', 'fase 4 · tamisat i classificació',
      'El plansichter, el sasor, el cernedor centrífug i la raspalladora separen les sèmoles, la farina i el segó; un recol·lector de mànigues múltiples filtra l’aire de la mòlta.',
      'pedra', pris(110, 70, 36)),
    v('fase-5', 'fase 5 · empaquetat i envasat',
      'L’ensacadora omplia els sacs de farina de primera, farina baixa, de tercera, segó, germen i pellorfa; una bàscula servia per a la venda al detall.',
      'palla', pris(110, 70, 26)),
    l('elevadors', 'elevadors', 'Sénies i catúfols: culleres que pujaven el cereal i el passaven d’una màquina a una altra.', 'fusta', 'esquerra', pris(0, 0, 0), { alies: ['sénies', 'catúfols'] }),
    l('comunicadors', 'comunicadors', 'Conductes que funcionaven per la força de la gravetat.', 'pedra', 'dreta', pris(0, 0, 0)),
    l('sense-fi', 'transportador sense fi', 'Transportava el producte en horitzontal entre diferents màquines.', 'fusta', 'esquerra', pris(0, 0, 0)),
    l('ciclo', 'cicló', 'Gran sifó on conductes d’aire duien les impureses i la pols de les màquines de neteja, per empaquetar-les al recol·lector de residus.', 'pedra', 'dreta', pris(0, 0, 0))
  ]
});

/* ═══════════════════════ 5 · FORN DE CALÇ ═══════════════════════ */
const FORN = estructura({
  id: 'forn-de-calc',
  nom: 'Forn de calç',
  font: FONT_GRAFICS,
  resum: 'El forn on la pedra calcària es coïa per a obtindre calç: les peces del plànol de Gràfics de Poble, de baix a dalt.',
  documental: documentalMonesma(),
  cotes: [
    cota('Temperatura de cocció', 'uns 1.000 °C', CORPUS, 'unica', 'Només el catàleg ho diu; cap font del disc no hi afegeix cotes ni mesures.')
  ],
  peces: [
    v('caldera', 'caldera', 'Cambra de combustió inferior, on cremaven les argilagues i la llenya a uns 1.000 °C.', 'pedra', cil(54, 30)),
    v('corredora', 'corredora', DEFINICIO_PLANOL, 'pedra', pris(60, 30, 14), { pendent: true }),
    v('porta', 'porta', DEFINICIO_PLANOL, 'fusta', pris(50, 30, 24), { pendent: true }),
    v('banc', 'banc', 'Repisa perimetral interior.', 'pedra', cil(60, 14), { aliesPendents: ['bancada o seti'] }),
    v('armadores', 'armadores', DEFINICIO_PLANOL, 'pedra', cil(54, 14), { pendent: true }),
    v('volta', 'volta', 'Arc de pedra calcària viva que sosté la càrrega.', 'pedra', cup(54, 44, 2), { alies: ['volta de pedra viva calcària'] }),
    v('matxaca', 'matxaca', 'Pedra menuda superior.', 'pedra', cil(38, 20)),
    v('tapafocs', 'tapafocs', DEFINICIO_PLANOL, 'pedra', cil(30, 10), { pendent: true }),
    v('cop', 'cop', DEFINICIO_PLANOL, 'pedra', cil(22, 12), { pendent: true }),
    l('baluarts', 'baluarts', 'Contraforts exteriors de pedra en sec.', 'pedra', 'dreta', pris(0, 0, 0)),
    l('argilagues', 'argilagues', 'Combustible del forn: les argilagues i la llenya cremaven a la cambra inferior.', 'palla', 'esquerra', pris(0, 0, 0)),
    l('carrega', 'càrrega i cocció a uns 1.000 °C', 'Càrrega del forn i cocció de la pedra calcària a uns 1.000 °C.', 'calc', 'dreta', marca('♨')),
    l('boquera', 'boquera', DEFINICIO_PENDENT, 'pedra', 'esquerra', pris(0, 0, 0), { pendent: true }),
    l('olla', 'olla', DEFINICIO_PENDENT, 'pedra', 'dreta', pris(0, 0, 0), { pendent: true })
  ]
});

/* ═══════════════════════ 6 · CARBONERA ═══════════════════════ */
const CARBONERA = estructura({
  id: 'carbonera',
  nom: 'Carbonera',
  font: FONT_GRAFICS,
  resum: 'La carbonera de muntanya: la pila de llenya coberta de cisca, fulles i terra on es feia el carbó, segons el plànol de Gràfics de Poble.',
  documental: documentalMonesma(),
  cotes: [],
  peces: [
    v('llit', 'llit', DEFINICIO_PLANOL, 'pedra', cil(70, 12), { pendent: true }),
    v('llenya', 'llenya', 'Llenya apilada verticalment en pisos.', 'fusta', cil(60, 60, 3)),
    v('cisca-fulles', 'cisca i fulles', 'Capa de cisca i fulles que cobreix la llenya.', 'palla', cil(66, 14)),
    v('terra', 'terra', 'Cobriment exterior de terra.', 'pedra', cup(70, 34, 2)),
    v('pedra-tapadora', 'pedra tapadora', DEFINICIO_PLANOL, 'pedra', cil(18, 8), { pendent: true }),
    v('boca-carbonera', 'boca', 'Boca superior central.', 'pedra', cil(14, 14), { alies: ['boca superior'] }),
    l('fumerals', 'fumerals', 'Laterals d’evacuació controlada del fum.', 'marcador', 'dreta', marca('≋')),
    l('escala', 'escala', 'Escala d’accés.', 'fusta', 'esquerra', pris(0, 0, 0)),
    l('gatera', 'gatera', DEFINICIO_PLANOL, 'pedra', 'dreta', pris(0, 0, 0), { pendent: true })
  ]
});

/* ═══════════════════════ 7 · CUP, PREMSA DE CAPELLA, ALAMBÍ I CELLER ═══════════════════════ */
const CUP = estructura({
  id: 'cup-i-premsa',
  nom: 'Cup, premsa de capella i alambí',
  font: FONT_VI,
  resum: 'De la verema al celler: xafigat, maceració i fermentació, premsat i trascolat, i l’alambí, la bóta, la garrafa d’espart i el porró.',
  documental: documentalSangonereta('vpTVDipdXi4', 'La tradició vinatera del Comtat (1995)'),
  cotes: [],
  peces: [
    v('xafigat', 'fase I · xafigat',
      'Entrada de la verema i taules damunt del cup. Antigament, el raïm s’abocava al taulat del cup.',
      'palla', pris(100, 60, 24)),
    v('maceracio', 'fase II · maceració i fermentació',
      'Al cup, el most es transforma en vi. El catàleg hi situa el cup i el xorrador.',
      'pedra', cil(56, 50)),
    v('premsat', 'fase III · premsat amb la premsa de capella',
      'Les peces de la premsa de capella són el braç, l’anou, el cargol, el banc, la femella, la barra, el barret, els esportins, el peu i la cassola.',
      'fusta', pris(110, 50, 44), { alies: ['premsa de capella'], nota: 'Només els noms de les peces són al catàleg; cap font del disc no en defineix cap.' }),
    v('trascolat', 'fase IV · trascolat', 'Trascolat, amb la trascoladora i el xorrador, segons el catàleg.', 'pedra', cil(40, 24)),
    l('cup', 'cup', 'Recipient sobre el qual hom trepitja el raïm i on el most es transforma en vi.', 'pedra', 'esquerra', pris(0, 0, 0)),
    l('alambi', 'alambí', DEFINICIO_PLANOL, 'pedra', 'dreta', pris(0, 0, 0), { pendent: true }),
    l('bota', 'bóta', DEFINICIO_PLANOL, 'fusta', 'esquerra', pris(0, 0, 0), { pendent: true }),
    l('garrafa', 'garrafa d’espart', DEFINICIO_PLANOL, 'palla', 'dreta', pris(0, 0, 0), { pendent: true }),
    l('porro', 'porró', DEFINICIO_PLANOL, 'calc', 'esquerra', pris(0, 0, 0), { pendent: true })
  ]
});

/* ═══════════════════════ 8 · SÉNIA DE SANG ═══════════════════════ */
const SENIA = estructura({
  id: 'senia-de-sang',
  nom: 'Sénia de sang',
  font: FONT_GRAFICS,
  resum: 'La sénia de sang: un matxo gira la barra i, per l’arbre i l’engranatge, la roda fa pujar l’aigua del pou amb els catúfols.',
  documental: documentalMonesma(),
  cotes: [],
  peces: [
    v('pou-senia', 'pou', DEFINICIO_PLANOL, 'pedra', cil(40, 40), { pendent: true }),
    v('roda-hidraulica', 'roda hidràulica', DEFINICIO_PLANOL, 'fusta', cil(66, 24, 2), { pendent: true }),
    v('engranatge', 'engranatge cònic', 'Llanterna o roda dentada que transmet el gir.', 'fusta', con(40, 20, 30), { alies: ['llanterna'] }),
    v('arbre-senia', 'arbre vertical', DEFINICIO_PLANOL, 'fusta', cil(10, 50), { pendent: true }),
    v('biga', 'biga', DEFINICIO_PLANOL, 'fusta', pris(100, 12, 12), { pendent: true }),
    v('capcal', 'capçal', DEFINICIO_PLANOL, 'fusta', pris(30, 30, 14), { pendent: true }),
    v('barra', 'barra o balancí', DEFINICIO_PLANOL, 'fusta', pris(130, 8, 8), { pendent: true, alies: ['balancí'] }),
    l('catufols', 'catúfols', DEFINICIO_PLANOL, 'pedra', 'esquerra', pris(0, 0, 0), { pendent: true }),
    l('matxo-senia', 'matxo', DEFINICIO_PLANOL, 'marcador', 'dreta', marca('M'), { pendent: true }),
    l('pastera', 'pastera de recepció d’aigua', DEFINICIO_PLANOL, 'pedra', 'esquerra', pris(0, 0, 0), { pendent: true }),
    l('sequia', 'sèquia', DEFINICIO_PLANOL, 'pedra', 'dreta', pris(0, 0, 0), { pendent: true }),
    l('freatic', 'nivell freàtic', DEFINICIO_PLANOL, 'marcador', 'esquerra', marca('≈'), { pendent: true })
  ]
});

/* ═══════════════════════ 9 · CARRO VALENCIÀ O D'ESCALA ═══════════════════════ */
const CARRO = estructura({
  id: 'carro-valencia',
  nom: 'Carro valencià',
  font: FONT_GRAFICS,
  resum: 'El carro valencià o d’escala i els ormeigs de sang: la caixa, la roda, els guarniments del matxo i la capçana.',
  documental: documentalMonesma(),
  cotes: [],
  peces: [
    v('roda-pego', 'roda i pegó o boixa',
      'Cèrcol (llanta de ferro), clàviga, eix, cabasset, botó i radis.',
      'fusta', cil(66, 30, 2), { alies: ['pegó', 'boixa'] }),
    v('caixa-estructura', 'caixa i estructura',
      'Barana, varals, escala, contratirant, torn, fre, pujador i vara.',
      'fusta', pris(130, 70, 40)),
    l('guarniments', 'guarniments del matxo',
      'Tafarra, reculant, alitranca, silló, corretjí, francalet, collera, galga o mosso, singla, ramal i tirant.',
      'palla', 'esquerra', pris(0, 0, 0)),
    l('capcana', 'capçana', 'Cabeçó, frontalera, antoixos, galtera, morrera i serretó.', 'palla', 'dreta', pris(0, 0, 0)),
    l('llaurant', 'llaurant amb el matxo', 'El forcat romà i la xaruga (amb pala giratòria), i la garrafa d’espart (fent trena per cordar-la).', 'fusta', 'esquerra', pris(0, 0, 0))
  ]
});

export const ESTRUCTURES = Object.freeze([POU, ALMASSERA, MOLI_HIDRAULIC, MOLI_ELECTRIC, FORN, CARBONERA, CUP, SENIA, CARRO]);

export const IDS_ESTRUCTURES = Object.freeze(ESTRUCTURES.map((estructura) => estructura.id));

/** L'estructura amb eixe id; sense coincidència, la primera. */
export function estructuraPerId(id) {
  return ESTRUCTURES.find((estructura) => estructura.id === id) || ESTRUCTURES[0];
}
