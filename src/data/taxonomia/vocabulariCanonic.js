/** Vocabulari i normalització necessaris a l’arrencada; les traduccions viuen a les vistes diferides. */
export const CATEGORIES_CANONIQUES_BASE=Object.freeze({
  "defensa-territori": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
  "recursos-locals": "🌾 Recursos Locals, Agricultura i Sobirania",
  "natura-excursions": "🌿 Natura i Patrimoni",
  "patrimoni-cultura": "🎭 Cultura, Música i Llengua",
  "comunitat-rural": "🤝 Món Rural",
  "tecnologia-lliure": "💻 Tecnologia Lliure, Dades Obertes i Disseny"
});
export const NOMS_CATEGORIES_CANONIQUES=Object.freeze(Object.values(CATEGORIES_CANONIQUES_BASE));
export const ETIQUETES_RETIRADES = Object.freeze(['Esdeveniments','Posant en Valor els Recursos Locals','Reivindicant','Noves Tecnologies','Projecte TIC','Gent de La Torre']);
export const NOMS_ETIQUETES_CANONIQUES_49 = Object.freeze([
 'Associacionisme','Activitats','Ajuntament de La Torre','Aplec pel Territori','Arbres Monumentals','Bioconstrucció','Brull Viu','Camí de Santiago','Cims per la llengua',
 "Coordinadora d'Estudis Eòlics del Comtat",'Desenvolupament Sostenible','Documentació','El Camí','El Carreró Centre Cultural i Tecnològic',"El Planet Centre Rural d'Experimentació",'El Rentonar','Esports','Rutes','Fadrins','Festes dels Pobles','Font Roja','Fotos','Gent que Fa Música','Gent Sostenible','Incendis','Llibres','Memfotisme','Noticies','Opinió','Patrimoni','Pla Eòlic','Plànols','Pou de neu','Projecte Sóc de Poble','Projectes','Propostes','Radar No','Rentonar Informa','Replantacions','Reunions','Sant Gregori','Serra dels Plans','Trobades','Vídeos',
 'Pedra Seca','Herbari','Llavors','NGI Fediversity','Node 0'
]);


const aliasesEtiquetes=Object.freeze({Productivitat:'Documentació',Tutorial:'Documentació',Manual:'Documentació',Document:'Documentació',Manteniment:'Node 0',Graf:'Node 0',Maquinari:'Node 0','Pedra en sec':'Pedra Seca','Pedra seca':'Pedra Seca',Esdeveniments:'Activitats',Excursions:'Rutes',Camins:'Rutes',Tracks:'Rutes',Associacions:'Associacionisme','Col·lectius':'Associacionisme',Comunitat:'Associacionisme',Arbres:'Arbres Monumentals',Monumentals:'Arbres Monumentals',Aplecs:'Aplec pel Territori','aplec-pel-territori-2':'Aplec pel Territori'});
const aliases=Object.freeze({'Productivitat':'tecnologia-lliure','Disseny UI':'tecnologia-lliure','Document':'tecnologia-lliure','Patrimoni':'natura-excursions','Noves tecnologies':'tecnologia-lliure','Noves Tecnologies':'tecnologia-lliure','Projecte TIC':'tecnologia-lliure','Reivindicant':'defensa-territori','Posant en Valor els Recursos Locals':'recursos-locals','🥾 Natura, Excursions i Camins':'natura-excursions','🏛️ Patrimoni, Cultura, Música i Llengua':'patrimoni-cultura','🤝 Comunitat, Associacionisme i Món Rural':'comunitat-rural'});
export function normalitzaValorTaxonomia(text,camp){
 if(camp==='etiquetes')return Object.hasOwn(aliasesEtiquetes,text)?aliasesEtiquetes[text]:(ETIQUETES_RETIRADES.some(name=>name.toLocaleLowerCase('ca')===text.toLocaleLowerCase('ca'))?null:text);

 return Object.hasOwn(aliases,text)?CATEGORIES_CANONIQUES_BASE[aliases[text]]??text:text;
}

