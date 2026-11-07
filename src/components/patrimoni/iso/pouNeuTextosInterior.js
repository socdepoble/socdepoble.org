/**
 * pouNeuTextosInterior.js — IDEA-165 + IDEA-160 (Onada R11) · Els textos dels
 * modes nous del visor en les cinc llengües, amb les mateixes claus a totes:
 * els rètols (de pouNeuEtiquetesVisor.js, que la targeta importa tot sol) i,
 * ací, els noms i els relats de les estacions guiades. Només l'importa
 * PouNeuInterior.jsx: els relats viatgen amb el tros diferit de l'interior,
 * no amb el de la targeta (CP-15d).
 *  · Els relats només diuen el que diu Josep Mª Segura Martí (Eines 7-8, 1987;
 *    corpus del Rentonar, l. 980-1035). El que és pràctica general dels pous de
 *    neu i no de este pou ho diu així: «Segura no ho detalla per a este pou».
 *  · Les dades d'altres fonts duen la font al costat: l'Associació Rentonar
 *    (2020 i 2023). Els 1.200 m van «segons la Biblioteca del Node 0, sense
 *    document BRL consultat» (decisió D-4): cap fitxa BRL del disc no dona
 *    l'altitud, i la inscripció BRL situa el pou a Benifallim per error.
 *  · Les xifres són les de pouNeuRentonar.js.
 */
import { POU_NEU_ETIQUETES_VISOR } from './pouNeuEtiquetesVisor.js';

const RELATS = {
  ca: {
    nomsCameres: { galeria: 'Galeria d’escorredor', fons: 'Fons del pou', arcs: 'Estreps dels arcs', 'ingres-10m': 'Ingrés sud a 10 m', 'boca-tunel': 'Túnel d’accés sud', 'finestra-oest': 'Finestra de l’oest', fora: 'Des de fora' },
    relats: {
      galeria: 'La galeria d’escorredor ix cap a l’est des del punt més baix del pou: 29 m en línia recta i amb un cert pendent, de 0,50 m d’ample per 0,70 m d’alt. La major part és excavada en el tap; al principi i al final té el sostre de grans lloses planes, com un alcavó. És massa estreta per a una persona: la recorrem en vol.',
      fons: 'Al fons, 9,80 m de diàmetre interior. Mira amunt: 13,75 m de mur de maçoneria lluïda amb morter fins a les finestres, i damunt la falsa cúpula hemisfèrica feta per aproximació de filades. Segura n’estima la capacitat en uns 1.030 m³.',
      arcs: 'Entre l’ingrés (10 m) i les finestres (13,75 m) queden, embotits al mur, quatre estreps de carreus de dos arcs creuats (NE-SW i NW-SE) que devien sostindre el trespol de teula de la primera coberta. La cúpula d’ara no té arcs.',
      'ingres-10m': 'L’ingrés sud s’obri a 10 m damunt del fons, d’1,35 m d’ample per 1,55 m d’alt. Davall, a la paret, hi ha uns esglaons buidats.',
      'boca-tunel': 'El túnel d’accés sud fa 9,10 m, amb volta rebaixada de maçoneria: té 2,35 m d’ample a la boca i es va estretint cap a dins. Als pous de neu, la neu se solia traure a l’estiu per un accés com este; Segura no ho detalla per a este pou.',
      'finestra-oest': 'Dels tres ingressos superiors (nord, oest i est), segons Segura (dades d’Eines, 1987) només el de l’oest era obert; l’Associació anomena «finestra sud» o «sud-est» l’accés del túnel (2020-2023). La de l’oest fa 1,55 m d’ample per 1,70 m d’alt, en un mur d’1,50 m, bastida en carreus. Als pous de neu, la neu s’hi solia tirar per les boques de dalt; Segura no ho detalla per a este pou.',
      fora: 'Als estreps orientals dels Plans, al Rentonar, a 1.160 m (1.200 m segons la Biblioteca del Node 0, sense document BRL consultat), amb el ventisquer orientat a llevant: el pou aprofita el desnivell de l’est, on les terres de l’excavació i un paredó circular fan de talús.',
    },
  },
  es: {
    nomsCameres: { galeria: 'Galería de desagüe', fons: 'Fondo del pozo', arcs: 'Estribos de los arcos', 'ingres-10m': 'Ingreso sur a 10 m', 'boca-tunel': 'Túnel de acceso sur', 'finestra-oest': 'Ventana del oeste', fora: 'Desde fuera' },
    relats: {
      galeria: 'La galería de desagüe sale hacia el este desde el punto más bajo del pozo: 29 m en línea recta y con cierta pendiente, de 0,50 m de ancho por 0,70 m de alto. La mayor parte está excavada en la tierra; al principio y al final la cubren grandes losas planas, como una mina de agua (alcavó). Es demasiado estrecha para una persona: la recorremos en vuelo.',
      fons: 'En el fondo, 9,80 m de diámetro interior. Mira arriba: 13,75 m de muro de mampostería enlucida con mortero hasta las ventanas, y encima la falsa cúpula hemisférica hecha por aproximación de hiladas. Segura estima su capacidad en unos 1.030 m³.',
      arcs: 'Entre el ingreso (10 m) y las ventanas (13,75 m) quedan, empotrados en el muro, cuatro estribos de sillares de dos arcos cruzados (NE-SO y NO-SE) que debían de sostener el tejado de teja de la primera cubierta. La cúpula actual no tiene arcos.',
      'ingres-10m': 'El ingreso sur se abre a 10 m sobre el fondo, de 1,35 m de ancho por 1,55 m de alto. Debajo, en la pared, hay unos peldaños excavados.',
      'boca-tunel': 'El túnel de acceso sur mide 9,10 m, con bóveda rebajada de mampostería: tiene 2,35 m de ancho en la boca y se va estrechando hacia dentro. En los pozos de nieve, la nieve solía sacarse en verano por un acceso como este; Segura no lo detalla para este pozo.',
      'finestra-oest': 'De los tres ingresos superiores (norte, oeste y este), según Segura (datos de Eines, 1987) solo el del oeste estaba abierto; la Asociación llama «ventana sur» o «sudeste» al acceso del túnel (2020-2023). La del oeste mide 1,55 m de ancho por 1,70 m de alto, en un muro de 1,50 m, construida en sillería. En los pozos de nieve, la nieve solía echarse por las bocas de arriba; Segura no lo detalla para este pozo.',
      fora: 'En las estribaciones orientales de Els Plans, en el Rentonar, a 1.160 m (1.200 m según la Biblioteca del Node 0, sin documento BRL consultado), con el ventisquero orientado a levante: el pozo aprovecha el desnivel del este, donde las tierras de la excavación y un muro circular (paredón) hacen de talud.',
    },
  },
  en: {
    nomsCameres: { galeria: 'Drain gallery', fons: 'Bottom of the well', arcs: 'Arch springers', 'ingres-10m': 'South entrance at 10 m', 'boca-tunel': 'South access tunnel', 'finestra-oest': 'West window', fora: 'From outside' },
    relats: {
      galeria: 'The drain gallery runs east from the lowest point of the well: 29 m in a straight line, on a slight slope, 0.50 m wide and 0.70 m high. Most of it is dug into the earth; at the start and at the end it is roofed with large flat slabs, like an alcavó (water mine). It is too narrow for a person: we travel it flying.',
      fons: 'At the bottom, 9.80 m across inside. Look up: 13.75 m of rubble masonry rendered with mortar up to the windows, and above it the hemispherical corbelled dome. Segura estimates its capacity at about 1,030 m³.',
      arcs: 'Between the entrance (10 m) and the windows (13.75 m), four ashlar springers remain set into the wall, from two crossed arches (NE-SW and NW-SE) that must have carried the tiled roof of the first cover. Today’s dome has no arches.',
      'ingres-10m': 'The south entrance opens 10 m above the floor, 1.35 m wide and 1.55 m high. Below it, steps are cut into the wall.',
      'boca-tunel': 'The south access tunnel is 9.10 m long, with a segmental masonry vault: it is 2.35 m wide at the mouth and narrows inwards. At snow wells, snow was usually taken out in summer through an access like this one; Segura does not detail it for this well.',
      'finestra-oest': 'Of the three upper openings (north, west and east), according to Segura (data from Eines, 1987) only the west one was open; the Association calls the tunnel access the “south” or “south-east window” (2020-2023). The west one is 1.55 m wide and 1.70 m high, in a 1.50 m wall, built of ashlar. At snow wells, snow was usually thrown in through the upper openings; Segura does not detail it for this well.',
      fora: 'On the eastern foothills of Els Plans, at the Rentonar, at 1,160 m (1,200 m according to the Node 0 Library, with no BRL document consulted), with the snowdrift slope facing east: the well uses the drop to the east, where the excavated earth and a circular retaining wall form an embankment.',
    },
  },
  eu: {
    nomsCameres: { galeria: 'Hustubide-galeria', fons: 'Putzuaren hondoa', arcs: 'Arkuen abiapuntuak', 'ingres-10m': 'Hegoaldeko sarrera 10 m-ra', 'boca-tunel': 'Hegoaldeko sarbide-tunela', 'finestra-oest': 'Mendebaldeko leihoa', fora: 'Kanpotik' },
    relats: {
      galeria: 'Hustubide-galeria ekialderantz ateratzen da putzuaren punturik baxuenetik: 29 m lerro zuzenean, malda txiki batekin, 0,50 m zabal eta 0,70 m garai. Gehiena lurrean induskatua dago; hasieran eta amaieran sabaia harlauza handi lauez estalia du, ur-meategi (alcavó) baten antzera. Pertsona batentzat estuegia da: hegan ibiltzen dugu.',
      fons: 'Hondoan, 9,80 m-ko barne-diametroa. Begiratu gora: 13,75 m morteroz zarpiatutako harlangaitzezko horma leihoetaraino, eta gainean ilarak hurbilduz egindako kupula faltsu hemisferikoa. Seguraren arabera, 1.030 m³ inguru hartzen zituen.',
      arcs: 'Sarreraren (10 m) eta leihoen (13,75 m) artean, horman txertatuta, bi arku gurutzaturen (IE-HM eta IM-HE) harlanduzko lau abiapuntu geratzen dira; lehen estalkiaren teila-estalkiari eutsiko zioten seguruenik. Gaurko kupulak ez du arkurik.',
      'ingres-10m': 'Hegoaldeko sarrera hondotik 10 m-ra irekitzen da, 1,35 m zabal eta 1,55 m garai. Azpian, horman, maila batzuk daude zulatuta.',
      'boca-tunel': 'Hegoaldeko sarbide-tunelak 9,10 m ditu, harlangaitzezko ganga beheratuarekin: ahoan 2,35 m zabal da eta barrurantz estutzen da. Elur-putzuetan, udan horrelako sarbide batetik ateratzen zen elurra; Segurak ez du hori zehazten putzu honetarako.',
      'finestra-oest': 'Goiko hiru sarreretatik (iparra, mendebaldea eta ekialdea), Seguraren arabera (Einesen datuak, 1987) mendebaldekoa baino ez zegoen irekita; Elkarteak «hegoaldeko» edo «hego-ekialdeko leihoa» deitzen dio tunelaren sarbideari (2020-2023). Mendebaldekoak 1,55 m zabal eta 1,70 m garai ditu, 1,50 m-ko horman, harlanduz egina. Elur-putzuetan, goiko ahoetatik botatzen zen elurra; Segurak ez du hori zehazten putzu honetarako.',
      fora: 'Els Planseko ekialdeko mendi-oinetan, Rentonarren, 1.160 m-ra (1.200 m Node 0ko Liburutegiaren arabera, BRL dokumenturik kontsultatu gabe), ekialdera begira dagoen elurtzarekin: putzuak ekialdeko maldaz baliatzen da, induskatutako lurrek eta horma zirkular batek ezponda egiten duten tokian.',
    },
  },
  gl: {
    nomsCameres: { galeria: 'Galería de desaugue', fons: 'Fondo do pozo', arcs: 'Arranques dos arcos', 'ingres-10m': 'Ingreso sur a 10 m', 'boca-tunel': 'Túnel de acceso sur', 'finestra-oest': 'Fiestra do oeste', fora: 'Desde fóra' },
    relats: {
      galeria: 'A galería de desaugue sae cara ao leste desde o punto máis baixo do pozo: 29 m en liña recta e con certa pendente, de 0,50 m de ancho por 0,70 m de alto. A maior parte está escavada na terra; ao principio e ao final cóbrena grandes lousas planas, coma unha mina de auga (alcavó). É estreita de máis para unha persoa: percorrémola en voo.',
      fons: 'No fondo, 9,80 m de diámetro interior. Mira arriba: 13,75 m de muro de cachotaría revocada con morteiro ata as fiestras, e enriba a falsa cúpula hemisférica feita por aproximación de fiadas. Segura estima a súa capacidade nuns 1.030 m³.',
      arcs: 'Entre o ingreso (10 m) e as fiestras (13,75 m) quedan, encaixados no muro, catro arranques de cantería de dous arcos cruzados (NE-SO e NO-SE) que debían soster o tellado de tella da primeira cuberta. A cúpula actual non ten arcos.',
      'ingres-10m': 'O ingreso sur ábrese a 10 m sobre o fondo, de 1,35 m de ancho por 1,55 m de alto. Debaixo, na parede, hai uns chanzos escavados.',
      'boca-tunel': 'O túnel de acceso sur mide 9,10 m, con bóveda rebaixada de cachotaría: ten 2,35 m de ancho na boca e vaise estreitando cara a dentro. Nos pozos de neve, a neve adoitaba sacarse no verán por un acceso coma este; Segura non o detalla para este pozo.',
      'finestra-oest': 'Dos tres ingresos superiores (norte, oeste e leste), segundo Segura (datos de Eines, 1987) só o do oeste estaba aberto; a Asociación chama «fiestra sur» ou «sueste» ao acceso do túnel (2020-2023). A do oeste mide 1,55 m de ancho por 1,70 m de alto, nun muro de 1,50 m, feita de cantería. Nos pozos de neve, a neve adoitaba botarse polas bocas de arriba; Segura non o detalla para este pozo.',
      fora: 'Nas estribacións orientais de Els Plans, no Rentonar, a 1.160 m (1.200 m segundo a Biblioteca do Node 0, sen documento BRL consultado), co ventisqueiro orientado ao levante: o pozo aproveita o desnivel do leste, onde as terras da escavación e un muro circular fan de noiro.',
    },
  },
};

/** Els rètols i els relats de cada llengua, junts (les mateixes claus a totes). */
export const POU_NEU_INTERIOR_TEXT = Object.freeze(Object.fromEntries(Object.entries(POU_NEU_ETIQUETES_VISOR)
  .map(([lang, etiquetes]) => [lang, Object.freeze({ ...etiquetes, ...RELATS[lang] })])));
