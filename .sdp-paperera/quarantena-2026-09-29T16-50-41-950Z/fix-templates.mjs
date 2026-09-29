import fs from 'fs';
import path from 'path';

const normativeContext = `Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.`;

const p = JSON.parse(fs.readFileSync('.agents/protocolledge.json', 'utf8'));
p.rutes.forEach(r => {
  if (r.id === 'prompt.local') return;
  const tPath = r.plantilla;
  if (fs.existsSync(tPath)) {
    let content = fs.readFileSync(tPath, 'utf8');
    if (content.includes('## Context\n\n[pendent]')) {
      content = content.replace('## Context\n\n[pendent]', '## Context\n\n' + normativeContext);
      fs.writeFileSync(tPath, content);
      r.blocsFixos = ['Context'];
    }
  }
});
fs.writeFileSync('.agents/protocolledge.json', JSON.stringify(p, null, 2) + '\n');
