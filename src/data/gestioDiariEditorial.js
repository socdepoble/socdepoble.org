/** Deferred maintenance and paged open-format extraction; never clears data. */
import {getOperacionsEditorials} from '../config/storage.js';
import {PREFIX_REVISIONS,PREFIX_HISTORIAL} from './diariRevisionsEditorials.js';
import {gestionaRevisionsEditorials,pendentsRevisionsEditorials,estatConfirmacionsEditorials} from './escriptorRevisionsEditorials.js';
import {gestionaHistorialEditorial,pendentsHistorialEditorial} from './historialRevisionsEditorials.js';
import {diagnosticCompactacioEditorial} from './escripturaDiariEditorial.js';
export function gestionaDiariEditorial(){
 return {revisions:gestionaRevisionsEditorials(),historial:gestionaHistorialEditorial()};
}
export function exportaDiariEditorial({canal='revisions',tipus='registres',pagina=0,mida=50}={}){
 if(!['revisions','historial'].includes(canal)||!['registres','pendents'].includes(tipus)
  ||!Number.isSafeInteger(pagina)||pagina<0||!Number.isSafeInteger(mida)||mida<1||mida>100||!Number.isSafeInteger(pagina*mida))throw TypeError('Pàgina editorial invàlida.');
 const prefix=canal==='revisions'?PREFIX_REVISIONS:PREFIX_HISTORIAL;
 const raw=getOperacionsEditorials(prefix),records=[];let total=0;
 const entries=tipus==='registres'?raw.items.map(([key,text])=>({key,text}))
  :canal==='revisions'?pendentsRevisionsEditorials():pendentsHistorialEditorial();
 for(const entry of entries){if(total>=pagina*mida&&records.length<mida)records.push(entry);total++;}
 return {format:'sdp.editorial.extract.v1',canal,tipus,pagina,mida,total,seguent:(pagina+1)*mida<total?pagina+1:null,
  inventariComplet:raw.disponible,charsFisics:raw.chars,confirmacions:estatConfirmacionsEditorials(),diagnostic:diagnosticCompactacioEditorial(prefix),records};
}
