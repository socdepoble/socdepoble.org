/** Localització de la taxonomia, compartida amb les vistes que ja es carreguen de manera diferida. */
import {CATEGORIES_CANONIQUES_BASE,NOMS_ETIQUETES_CANONIQUES_49} from './vocabulariCanonic.js';
export {NOMS_CATEGORIES_CANONIQUES,NOMS_ETIQUETES_CANONIQUES_49,ETIQUETES_RETIRADES,normalitzaValorTaxonomia} from './vocabulariCanonic.js';
export const IDIOMES_TAXONOMIA=Object.freeze(["ca","es","en","eu","gl"]);
const traduccionsCategories=[
  [
    "⚖️ Defensa del Territorio, Ecología y Reivindicación",
    "⚖️ Territory, Ecology and Advocacy",
    "⚖️ Lurraldearen Defentsa, Ekologia eta Aldarrikapena",
    "⚖️ Defensa do Territorio, Ecoloxía e Reivindicación"
  ],
  [
    "🌾 Recursos Locales, Agricultura y Soberanía",
    "🌾 Local Resources, Agriculture and Sovereignty",
    "🌾 Tokiko Baliabideak, Nekazaritza eta Burujabetza",
    "🌾 Recursos Locais, Agricultura e Soberanía"
  ],
  [
    "🌿 Naturaleza y Patrimonio",
    "🌿 Nature and Heritage",
    "🌿 Natura eta Ondarea",
    "🌿 Natureza e Patrimonio"
  ],
  [
    "🎭 Cultura, Música y Lengua",
    "🎭 Culture, Music and Language",
    "🎭 Kultura, Musika eta Hizkuntza",
    "🎭 Cultura, Música e Lingua"
  ],
  [
    "🤝 Mundo Rural",
    "🤝 Rural Communities",
    "🤝 Landa Mundua",
    "🤝 Mundo Rural"
  ],
  [
    "💻 Tecnología Libre, Datos Abiertos y Diseño",
    "💻 Free Technology, Open Data and Design",
    "💻 Teknologia Librea, Datu Irekiak eta Diseinua",
    "💻 Tecnoloxía Libre, Datos Abertos e Deseño"
  ]
];
export const CATEGORIES_CANONIQUES=Object.freeze(Object.entries(CATEGORIES_CANONIQUES_BASE).map(([id,label],i)=>Object.freeze({id,labels:Object.freeze(Object.fromEntries(IDIOMES_TAXONOMIA.map((language,j)=>[language,j===0?label:traduccionsCategories[i][j-1]])))})));
const traducco = Object.freeze({
 'Associacionisme':['Asociacionismo','Community associations','Elkartegintza','Asociacionismo'],
 'Activitats':['Actividades','Activities','Jarduerak','Actividades'],
 'Arbres Monumentals':['Árboles Monumentales','Monumental Trees','Zuhaitz Monumentalak','Árbores Monumentais'],
 'Bioconstrucció':['Bioconstrucción','Natural Building','Bioeraikuntza','Bioconstrución'],
 'Desenvolupament Sostenible':['Desarrollo Sostenible','Sustainable Development','Garapen Jasangarria','Desenvolvemento Sostible'],
 'Documentació':['Documentación','Documentation','Dokumentazioa','Documentación'],
 'Esports':['Deportes','Sports','Kirolak','Deportes'],
 'Rutes':['Rutas','Routes','Ibilbideak','Rutas'],
 'Festes dels Pobles':['Fiestas de los Pueblos','Village Celebrations','Herrietako Jaiak','Festas das Aldeas'],
 'Fotos':['Fotos','Photos','Argazkiak','Fotos'],
 'Gent que Fa Música':['Gente que Hace Música','People Making Music','Musika Egiten Duen Jendea','Xente que Fai Música'],
 'Incendis':['Incendios','Wildfires','Suteak','Incendios'],
 'Llibres':['Libros','Books','Liburuak','Libros'],
 'Noticies':['Noticias','News','Albisteak','Novas'],
 'Opinió':['Opinión','Opinion','Iritzia','Opinión'],
 'Patrimoni':['Patrimonio','Heritage','Ondarea','Patrimonio'],
 'Plànols':['Planos','Plans','Planoak','Planos'],
 'Pou de neu':['Pozo de nieve','Snow Well','Elur-zuloa','Pozo de neve'],
 'Projectes':['Proyectos','Projects','Proiektuak','Proxectos'],
 'Propostes':['Propuestas','Proposals','Proposamenak','Propostas'],
 'Replantacions':['Replantaciones','Replanting','Birlandaketak','Replantacións'],
 'Reunions':['Reuniones','Meetings','Bilerak','Reunións'],
 'Trobades':['Encuentros','Gatherings','Topaketak','Encontros'],
 'Vídeos':['Vídeos','Videos','Bideoak','Vídeos'],
 'Pedra Seca':['Piedra Seca','Dry Stone','Harri Lehorra','Pedra Seca'],
 'Herbari':['Herbario','Herbarium','Herbarioa','Herbario'],
 'Llavors':['Semillas','Seeds','Haziak','Sementes']
});
const estructurals=Object.freeze({Sistema:['Sistema','System','Sistema','Sistema'],Mur:['Muro','Wall','Horma','Muro']});
const indexIdioma=idioma=>Math.max(0,IDIOMES_TAXONOMIA.indexOf(idioma));
export function nomCategoriaCanonica(id,idioma='ca'){return CATEGORIES_CANONIQUES.find(c=>c.id===id)?.labels[IDIOMES_TAXONOMIA[indexIdioma(idioma)]]??null;}
export function nomEtiquetaCanonica(name,idioma='ca'){const i=indexIdioma(idioma);return i===0?name:traducco[name]?.[i-1]??name;}
export function nomEstructural(name,idioma='ca'){const i=indexIdioma(idioma);return i===0?name:estructurals[name]?.[i-1]??name;}


/** Cadena R11, Loop 3 (L2-09) · Per a les targetes i els detalls del Mur, el Mercat i els actes (text
 * d'altri): només les 6 categories mares, que porten emoji i no xoquen amb cap text lliure, passen a la
 * llengua de la interfície. Una etiqueta lliure («Muro», «Planos») es queda tal qual (L2-17). Sense canvis,
 * el mateix array. */
export function localitzaCategoriesMares(labels,idioma='ca'){
 if(!Array.isArray(labels))return labels;
 let changed=false;
 const result=labels.map(label=>{
  if(!label||typeof label!=='object')return label;
  const cat=CATEGORIES_CANONIQUES.find(c=>Object.values(c.labels).includes(label.text));
  const text=cat?nomCategoriaCanonica(cat.id,idioma):null;
  if(!text||text===label.text)return label;changed=true;return {...label,text};
 });
 return changed?result:labels;
}

/** Traduïx només etiquetes conegudes, sense atribuir una traducció al cos de la pàgina. */
export function localitzaEtiquetesCanoniques(labels,idioma='ca'){
 if(!Array.isArray(labels))return labels;
 let changed=false;
 const result=labels.map(label=>{
  if(!label||typeof label!=='object')return label;
  const cat=CATEGORIES_CANONIQUES.find(c=>Object.values(c.labels).includes(label.text));
  const tag=NOMS_ETIQUETES_CANONIQUES_49.find(name=>IDIOMES_TAXONOMIA.some(lang=>nomEtiquetaCanonica(name,lang)===label.text));
  const structural=Object.keys(estructurals).find(name=>IDIOMES_TAXONOMIA.some(lang=>nomEstructural(name,lang)===label.text));
  const text=cat?nomCategoriaCanonica(cat.id,idioma):tag?nomEtiquetaCanonica(tag,idioma):structural?nomEstructural(structural,idioma):label.text;
  if(text===label.text)return label;changed=true;return {...label,text};
 });
 return changed?result:labels;
}
