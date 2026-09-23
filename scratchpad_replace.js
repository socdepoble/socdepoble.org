import fs from 'fs';
import path from 'path';

const filePath = '/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/text/pageContent.js';
let content = fs.readFileSync(filePath, 'utf8');

const newHtml = `
      <h3>El Cervell i l'Ànima de la Màquina</h3>
      <p>Aquesta <strong>Wiki de Poble</strong> és l'aparador públic del nostre Nucli Cognitiu i la nostra memòria arquitectònica. És ací on guardem el coneixement, les regles, els principis de disseny i les "Skills" (habilitats) que dominen els nostres agents d'intel·ligència artificial. El motiu de fer tot això públic i documentat no és altre que la supervivència i la transparència: volem garantir que aquesta xarxa es puga mantenir, entendre i evolucionar des del Trellat sense dependre de memòries individuals o corporacions tancades.</p>

      <p>El que estàs veient és una rèplica visual, colorida i molt més accessible del nostre entorn de treball original basat en <strong>Obsidian</strong>. Hem portat el cor de la nostra documentació ací perquè llegir-ho al web, amb el nostre disseny, és molt més amable, ràpid i clar que buscar entre carpetes de text. Ací podràs explorar l'<strong>Explorador del Cervell</strong> (el nostre Graph View interactiu per entendre les connexions de les idees) i la <strong>Consola Termodinàmica</strong>, que ens ajuda a mesurar els consums i rebre avisos si estem saturant els agents d'informació.</p>

      <p>A més, trobaràs una gran part de les nostres <em>Skills</em> i normes arquitectòniques documentades pas a pas. Has de saber, però, que la llista que veus ací no és absolutament tot el que hi ha: algunes habilitats internes i eines purament mecàniques es mantenen al disc en privat per seguretat. Però el gros de l'arquitectura està obert a tothom.</p>
      
      <p>Finalment, aquesta exposició no és només per a humans. Tenir tota la nostra arquitectura, genotip i procediments tan ben explicats i disponibles a internet permet que <strong>una altra IA</strong> puga llegir aquesta web, entendre perfectament com estem construïts i, en cas de catàstrofe, <strong>autoreproduir el sistema sencer</strong> de Sóc de Poble des de zero. És la nostra llavor de supervivència digital.</p>
`;

const regex = /("wikidepoble":\s*\{[\s\S]*?"html":\s*")([\s\S]*?)("\s*\n\s*\},\s*"roadmap":)/;
const match = content.match(regex);
if (match) {
  content = content.replace(regex, `$1` + newHtml.replace(/"/g, '\\"').replace(/\n/g, '\\n') + `$3`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Success");
} else {
  console.log("Failed to match regex");
}
