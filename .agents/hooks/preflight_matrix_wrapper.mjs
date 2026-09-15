import fs from 'fs';
import { execFileSync } from 'child_process';

try {
  const inputRaw = fs.readFileSync(0, 'utf-8');
  if (!inputRaw.trim()) {
    console.log(JSON.stringify({ injectSteps: [] }));
    process.exit(0);
  }
  const input = JSON.parse(inputRaw);

  // Només ho executem en la primera invocació del torn
  if (input.invocationNum !== 1) {
    console.log(JSON.stringify({ injectSteps: [] }));
    process.exit(0);
  }

  // Extraure el darrer missatge de l'usuari del transcript
  const transcriptRaw = fs.readFileSync(input.transcriptPath, 'utf-8');
  const lines = transcriptRaw.trim().split('\n');
  let lastUserInput = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const step = JSON.parse(lines[i]);
      if (step.type === 'USER_INPUT') {
        lastUserInput = step.content || '';
        break;
      }
    } catch (e) {}
  }

  if (!lastUserInput.trim()) {
    console.log(JSON.stringify({ injectSteps: [] }));
    process.exit(0);
  }

  try {
    // Tractors Cognitius - Acte Reflex de Z
    // Executa el reflex_plantilles.mjs i obté l'stdout
    const stdout = execFileSync('node', ['tooling/brain/reflex_plantilles.mjs', lastUserInput], { encoding: 'utf-8', cwd: process.cwd() });
    
    const injectSteps = [];
    
    // Si ha escopit alguna cosa, és que ha trobat plantilla obligatòria. Ho injectem directament!
    if (stdout && stdout.trim().length > 0) {
      injectSteps.push({
        ephemeralMessage: stdout
      });
    }
    
    console.log(JSON.stringify({ injectSteps }));
    
  } catch (err) {
    // Si hi ha error (exit 1), el reflex avorta el torn injectant el missatge de bloqueig.
    const stderr = err.stderr || '';
    console.log(JSON.stringify({
      injectSteps: [
        {
          ephemeralMessage: `[REFLEX ROIG] El tractor dels reflexos ha bloquejat l'execució.\n${stderr}`
        }
      ]
    }));
  }
} catch (e) {
  console.log(JSON.stringify({ injectSteps: [] }));
}
