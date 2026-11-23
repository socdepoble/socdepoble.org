import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  ESQUEMA_EDICIONS_HUMANES,
  analitzaPaquetEdicionsHumanes,
  avaluaFitxerEdicionsHumanes
} from './sentinella-edicions-humanes.mjs';
import { PAGE_COPY } from '../../src/sections/text/pageContent.js';

test('analitzaPaquetEdicionsHumanes: detecta pàgines de sistema amb canvis pendents vs ja consolidades', () => {
  const paquet = {
    esquema: ESQUEMA_EDICIONS_HUMANES,
    exportatEl: '2026-11-22T20:45:00.000Z',
    actives: {
      'sistema:descarregues': {
        camps: {
          title: 'Descàrregues v1.2.23 Editada pel Mestre',
          subtitle: PAGE_COPY.descarregues.subtitle
        },
        desadaEl: '2026-11-22T20:44:00.000Z'
      },
      'sistema:anima': {
        camps: {
          title: PAGE_COPY.anima.title,
          subtitle: PAGE_COPY.anima.subtitle
        },
        desadaEl: '2026-11-22T20:40:00.000Z'
      },
      'mur:manifest-de-poble': {
        camps: {
          title: 'Manifest revisat'
        },
        desadaEl: '2026-11-22T20:41:00.000Z'
      }
    },
    historial: {
      'sistema:descarregues': [
        { versio: 1, autorNom: 'Sóc de Poble', desadaEl: '2026-11-22T20:44:00.000Z' }
      ]
    }
  };

  const resultat = analitzaPaquetEdicionsHumanes(paquet, PAGE_COPY);
  assert.equal(resultat.valid, true);
  assert.equal(resultat.totalActives, 3);
  assert.equal(resultat.pendents.length, 2);
  assert.equal(resultat.sincronitzades.length, 1);
  assert.equal(resultat.sincronitzades[0].clau, 'sistema:anima');

  const descarregues = resultat.pendents.find((p) => p.clau === 'sistema:descarregues');
  assert.ok(descarregues);
  assert.deepEqual(descarregues.camps, ['title']);
  assert.equal(descarregues.autorNom, 'Sóc de Poble');
  assert.equal(descarregues.versions, 1);
});

test('analitzaPaquetEdicionsHumanes: rebutja esquemes desconeguts i filtra per --clau', () => {
  const invalid = analitzaPaquetEdicionsHumanes({ esquema: 'altre.v0' }, PAGE_COPY);
  assert.equal(invalid.valid, false);

  const paquet = {
    esquema: ESQUEMA_EDICIONS_HUMANES,
    actives: {
      'sistema:descarregues': { camps: { title: 'Nou títol' } },
      'sistema:projecte': { camps: { title: 'Projecte nou' } }
    }
  };
  const filtrat = analitzaPaquetEdicionsHumanes(paquet, PAGE_COPY, { filtreClau: 'descarregues' });
  assert.equal(filtrat.pendents.length, 1);
  assert.equal(filtrat.pendents[0].id, 'descarregues');
});

test('avaluaFitxerEdicionsHumanes + CLI (--json i --estricte): llig fitxer temporal i reporta codis d’eixida', async () => {
  const dirTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-sentinella-edicions-'));
  const fitxerJson = path.join(dirTmp, 'edicions.json');
  fs.writeFileSync(fitxerJson, JSON.stringify({
    esquema: ESQUEMA_EDICIONS_HUMANES,
    exportatEl: '2026-11-22T21:00:00.000Z',
    actives: {
      'sistema:descarregues': {
        camps: { lead: 'Entradeta viva del Mestre' },
        desadaEl: '2026-11-22T20:59:00.000Z'
      }
    },
    historial: {}
  }), 'utf8');

  const informe = await avaluaFitxerEdicionsHumanes({ fitxer: fitxerJson });
  assert.equal(informe.trobat, true);
  assert.equal(informe.valid, true);
  assert.equal(informe.pendents.length, 1);

  const scriptPath = path.resolve(import.meta.dirname, 'sentinella-edicions-humanes.mjs');
  const stdoutJson = execFileSync(process.execPath, [scriptPath, '--fitxer', fitxerJson, '--json'], { encoding: 'utf8' });
  const parsed = JSON.parse(stdoutJson);
  assert.equal(parsed.pendents[0].clau, 'sistema:descarregues');

  assert.throws(
    () => execFileSync(process.execPath, [scriptPath, '--fitxer', fitxerJson, '--estricte'], { encoding: 'utf8' }),
    (err) => err.status === 1
  );

  fs.rmSync(dirTmp, { recursive: true, force: true });
});

/* v1.2.23 · L8-06 (Gauntlet R1) · El contracte cosit entre el productor i la sentinella: el paquet és el que fa
   exportaRevisionsHumanes (el que descarrega «Exportar per a la IAIA»), no una forma escrita a mà. Abans tot fitxer
   real es rebutjava amb «Esquema invàlid» (la sentinella llegia `esquema` i `actives`, i el productor escriu `schema`,
   `generatEl` i `revisions`). */
test('v1.2.23 · L8-06 · el paquet real d’exportaRevisionsHumanes és vàlid: pendents, autor, data i --estricte', async () => {
  const historial = await import('../../src/data/historialRevisionsEditorials.js');
  assert.equal(historial.ESQUEMA_EDICIONS_HUMANES, ESQUEMA_EDICIONS_HUMANES, 'productor i sentinella diuen el mateix esquema');
  assert.equal(historial.desaRevisioEditorialAmbHistorial('sistema', 'descarregues', { title: 'Descàrregues editades pel Mestre' }, { autorNom: 'Javi' }), true);
  assert.equal(historial.desaRevisioEditorialAmbHistorial('sistema', 'anima', { title: PAGE_COPY.anima.title }, { autorNom: 'Javi' }), true);
  const paquet = historial.exportaRevisionsHumanes();
  assert.deepEqual(Object.keys(paquet).sort(), ['generatEl', 'historial', 'revisions', 'schema']);

  const resultat = analitzaPaquetEdicionsHumanes(paquet, PAGE_COPY);
  assert.equal(resultat.valid, true, resultat.error);
  assert.equal(resultat.exportatEl, paquet.generatEl);
  assert.equal(resultat.totalActives, 2);
  assert.deepEqual(resultat.pendents.map((p) => [p.clau, p.camps, p.autorNom, p.versions]), [['sistema:descarregues', ['title'], 'Javi', 1]]);
  assert.equal(resultat.pendents[0].desadaEl, paquet.revisions['sistema:descarregues'].desadaEl);
  assert.deepEqual(resultat.sincronitzades.map((p) => p.clau), ['sistema:anima']);

  const dirTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-sentinella-edicions-real-'));
  try {
    const fitxerJson = path.join(dirTmp, 'edicions_humanes_sdp.json');
    fs.writeFileSync(fitxerJson, JSON.stringify(paquet), 'utf8');
    const scriptPath = path.resolve(import.meta.dirname, 'sentinella-edicions-humanes.mjs');
    const informe = JSON.parse(execFileSync(process.execPath, [scriptPath, '--fitxer', fitxerJson, '--json'], { encoding: 'utf8' }));
    assert.deepEqual([informe.trobat, informe.valid, informe.pendents[0]?.clau, informe.pendents[0]?.autorNom], [true, true, 'sistema:descarregues', 'Javi']);
    assert.throws(
      () => execFileSync(process.execPath, [scriptPath, '--fitxer', fitxerJson, '--estricte'], { encoding: 'utf8' }),
      (err) => err.status === 1 && /1 edicions humanes pendents/.test(err.stdout)
    );
  } finally {
    fs.rmSync(dirTmp, { recursive: true, force: true });
  }
});
