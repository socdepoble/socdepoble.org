/**
 * Corpus 6 · Productes comercials del Mercat i de la Botiga / Nevera.
 * Projecció local, pura i conservadora sobre el contracte de matriuDeProducte.
 *
 * El catàleg no és una fitxa d'envàs acreditada: ni el nom, ni la marca,
 * ni la categoria, ni la prosa nutricional, ni una URL, ni fontAlergens
 * aportada pel payload acrediten composició, absències o traces d'un lot.
 * El corpus actual no inclou cap envàs acreditat. Per això esta API NO
 * accepta declaracions ni booleans de verificació en temps d'execució.
 * Incorporar evidència futura requerix una font d'envàs revisada, vinculada
 * a la referència / versió comercial i amb l'abast de cada declaració explícit.
 *
 * Marc de referència: Reglament (UE) 1169/2011, Annex II; AESAN,
 * «Etiquetado de sustancias que causan alergias e intolerancias».
 * https://www.boe.es/buscar/doc.php?id=DOUE-L-2011-82311
 * https://www.aesan.gob.es/es/seguridad-alimentaria/informacion-alimentaria/etiquetado-sustancias
 */
export { AVIS_ALERGENS_COMERCIALS, producteBotigaAmbAlergens, alimentMercat, matriuProducteBotiga, matriuAlimentMercat } from '../../utils/alergensComercials.js';
