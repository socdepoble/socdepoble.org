import fs from 'node:fs';
import path from 'node:path';

const LIMIT = Number(process.env.SDP_LIMIT_ARTEFACTES || 150);

export function comptaArtefactes(transcriptPath) {
  try {
    const brainDir = transcriptPath.split('/.system_generated')[0];
    const uploadedDir = path.join(brainDir, '.user_uploaded');
    
    let count = 0;
    
    // Compta els artefactes .md a l'arrel de la conversa (ex: task.md, implementation_plan.md)
    if (fs.existsSync(brainDir)) {
      const files = fs.readdirSync(brainDir);
      count += files.filter(f => f.endsWith('.md')).length;
    }
    
    // Compta tots els fitxers penjats per l'usuari (imatges, àudios, etc.)
    if (fs.existsSync(uploadedDir)) {
      count += fs.readdirSync(uploadedDir).length;
    }
    
    return count;
  } catch (err) {
    console.error("Error comptant artefactes:", err);
    return 0;
  }
}

export const MISSATGE = 'Javi, la memòria tèrmica està al límit (més de 150 artefactes). ' +
  'És millor tancar el xat i obrir-ne un de nou.';

export function avis(transcriptPath) {
  const n = comptaArtefactes(transcriptPath);
  return n > LIMIT ? { n, missatge: MISSATGE } : null;
}
