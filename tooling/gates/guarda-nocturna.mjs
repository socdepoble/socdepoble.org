#!/usr/bin/env node
import { esMain } from '../lib/arrel.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, options } from '../documental/cli.mjs';

const FITXER_GUARDA = '.agents/runtime/guarda_nocturna.json';

/**
 * Gestor mecànic del cicle de vida de la Guàrdia Nocturna i Co-working d'IAs.
 * Evita crons zombi i assegura que quan Claude o l'Auditoria acaben,
 * TOTES les IAs i temporitzadors s'aturen immediatament.
 */

export function obrirGuarda(root, { onada = 'guarda-nocturna', maxHores = 6, objectiu = '' } = {}) {
  const ruta = path.join(root, FITXER_GUARDA);
  const ara = new Date();
  const expira = new Date(ara.getTime() + maxHores * 60 * 60 * 1000);

  const dada = {
    activa: true,
    onada,
    objectiu,
    inici: ara.toISOString(),
    expira: expira.toISOString(),
    maxHores,
    estat_claude: 'pendent',
    estat_auditoria: 'pendent',
    ultim_check: ara.toISOString(),
    finalitzada: false,
    motiu_finalitzacio: null,
  };

  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, JSON.stringify(dada, null, 2), 'utf8');
  return dada;
}

export function aturarGuarda(root, motiu = 'Aturada manualment') {
  const ruta = path.join(root, FITXER_GUARDA);
  let dada = { activa: false, finalitzada: true };
  if (fs.existsSync(ruta)) {
    try {
      dada = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    } catch {
      // Ignorar lectura corrupta
    }
  }
  dada.activa = false;
  dada.finalitzada = true;
  dada.motiu_finalitzacio = motiu;
  dada.tancat_a = new Date().toISOString();

  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, JSON.stringify(dada, null, 2), 'utf8');
  return dada;
}

export function comprovarGuarda(root) {
  const ruta = path.join(root, FITXER_GUARDA);
  const ara = new Date();

  let dada = null;
  if (fs.existsSync(ruta)) {
    try {
      dada = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    } catch {
      dada = null;
    }
  }

  // Comprovar fitxers a l'escriptori per determinar si l'Onada ha acabat
  const dirEscriptori = path.join(root, '_wiki_de_poble/04_escriptori');
  let hiHaAuditoriaAprovada = false;
  let hiHaInformeClaudeTancat = false;
  let detalls = [];

  if (fs.existsSync(dirEscriptori)) {
    const fitxers = fs.readdirSync(dirEscriptori);
    for (const f of fitxers) {
      if (f.endsWith('.md')) {
        const fullPath = path.join(dirEscriptori, f);
        try {
          const contingut = fs.readFileSync(fullPath, 'utf8');
          if (f.includes('auditoria_gemini') || f.includes('auditoria_codex')) {
            if (
              contingut.includes("DICTAMEN D'APROVACIÓ TOTAL") ||
              contingut.includes('100% en verd') ||
              (contingut.includes('status: canonic') && contingut.includes('APROVAT'))
            ) {
              hiHaAuditoriaAprovada = true;
              detalls.push(`Auditoria aprovada trobada: ${f}`);
            }
          }
          if (f.includes('auditoria_claude') || f.includes('informe_claude')) {
            if (
              contingut.includes('Commit consolidat') ||
              contingut.includes('feat(llancament)') ||
              contingut.includes('32eabf12') ||
              contingut.includes('4d67f7ab')
            ) {
              hiHaInformeClaudeTancat = true;
              detalls.push(`Informe Claude tancat trobat: ${f}`);
            }
          }
        } catch {
          // Ignorar error de lectura de fitxers concrets
        }
      }
    }
  }

  // Comprovar si el temps ha expirat
  let tempsExpirat = false;
  if (dada && dada.expira) {
    tempsExpirat = ara.getTime() > new Date(dada.expira).getTime();
  }

  const deuriaParar =
    (hiHaAuditoriaAprovada && hiHaInformeClaudeTancat) ||
    tempsExpirat ||
    (dada && !dada.activa);

  let motiu = null;
  if (hiHaAuditoriaAprovada && hiHaInformeClaudeTancat) {
    motiu = "Tasca i auditoria completades amb èxit (100% verd i commit segellat). S'HAN D'ATURAR TOTES LES IAS.";
  } else if (tempsExpirat) {
    motiu = "Temps màxim de guàrdia assolit (TTL expirat). S'han d'aturar els crons per seguretat.";
  } else if (dada && !dada.activa) {
    motiu = dada.motiu_finalitzacio || "La guàrdia ja està marcada com a inactiva.";
  }

  if (deuriaParar && dada && dada.activa) {
    dada.activa = false;
    dada.finalitzada = true;
    dada.motiu_finalitzacio = motiu;
    dada.tancat_a = ara.toISOString();
    fs.writeFileSync(ruta, JSON.stringify(dada, null, 2), 'utf8');
  }

  return {
    activa: dada ? dada.activa : false,
    finalitzada: deuriaParar,
    deuriaParar,
    motiu,
    hiHaAuditoriaAprovada,
    hiHaInformeClaudeTancat,
    detalls,
    dadaGuarda: dada,
  };
}

async function main() {
  const o = options();
  const root = path.resolve(o.arrel || ROOT);

  if (o.inici) {
    const res = obrirGuarda(root, {
      onada: o.onada || 'guarda-nocturna',
      maxHores: Number(o['max-hores'] || 6),
      objectiu: o.objectiu || '',
    });
    console.log(JSON.stringify({ valid: true, accio: 'inici', guarda: res }, null, 2));
    return;
  }

  if (o.aturar || o.stop) {
    const res = aturarGuarda(root, o.motiu || 'Aturada expressa via CLI');
    console.log(JSON.stringify({ valid: true, accio: 'aturar', guarda: res }, null, 2));
    return;
  }

  const estat = comprovarGuarda(root);
  console.log(JSON.stringify({ valid: true, accio: 'estat', estat }, null, 2));
  if (estat.deuriaParar) {
    process.exitCode = 0; // 0 significa que deuria parar o està finalitzada
  } else {
    process.exitCode = 2; // 2 significa que encara continua en curs
  }
}

if (esMain(import.meta.url)) {
  main().catch((e) => {
    console.error(JSON.stringify({ valid: false, error: e.message }));
    process.exitCode = 1;
  });
}
