import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { CATALEG_TELLADO_R3214, catalogaTellado, compleixObligacionsTellado, preparaRevisioTellado } from '../../lib/tellado-cataleg-r32_14.mjs';
import { avaluaPerimetreTellado, netejaComentarisLineal } from '../porta-perimetre-tellado.mjs';
import { analitzaVigilant } from '../tractor-vigilant.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const font = s => fs.readFileSync(path.join(ROOT, s.fontRevisada), 'utf8');
const net = (text, s) => netejaComentarisLineal(text, path.extname(s.fontRevisada));
const observacio = s => ({ tipus: s.tipus, regla: s.regla, linia: s.linia, fitxer: 'src/qualsevol_nom.js' });

// v1.2.26 · G26-3 · La 40 cataloga el Lector diferit de skills (LectorSkillWiki.jsx): 38 → 39.
test('R32.14 · catàleg exacte de 39 signatures (35 de R32.14, la 37 de la v1.2.23, L2-01, la 38 de la v1.2.24, la 39 del joc R32.86 i la 40 del Lector de skills G26-3; la 32 es va retirar amb F4D/P08-04), IDs únics, límits i cap certificació de destí', () => {
  assert.equal(CATALEG_TELLADO_R3214.length, 39);
  assert.equal(new Set(CATALEG_TELLADO_R3214.map(s=>s.id)).size, 39);
  assert.ok(CATALEG_TELLADO_R3214.every(s=>s.certificaDesti===false && s.limit.length>50));
});
for (const s of CATALEG_TELLADO_R3214) {
  test(`${s.id} · positiva: comportament i bytes revisats, independentment del nom de fitxer`, () => {
    const cru=font(s), n=net(cru,s), revisio=preparaRevisioTellado(cru,n);
    assert.ok(compleixObligacionsTellado(n,s));
    const resultat=catalogaTellado(observacio(s),revisio);
    assert.equal(resultat?.id,s.id);assert.equal(resultat?.certificaDesti,false);
  });
  test(`${s.id} · negatives: cada obligació retirada o traslladada a comentari revoca cobertura`, () => {
    const cru=font(s), n=net(cru,s);
    for (const literal of [s.embornal,...s.requisits]) {
      // Substituir TOTES les aparicions evita que una segona crida homònima
      // satisfaça la mateixa obligació. indexOf/split de patró fix són lineals.
      const mutat=n.split(literal).join('/* obligacio retirada */');
      assert.equal(compleixObligacionsTellado(mutat,s),false,literal);
      assert.equal(catalogaTellado(observacio(s),preparaRevisioTellado(mutat,mutat)),null,literal);
    }
    const alterat=`fetch('/nou');\n${cru}`;
    assert.equal(catalogaTellado(observacio(s),preparaRevisioTellado(alterat,net(alterat,s))),null);
  });
}

test('R32.14 · nom, línia, nom de variable i fragments de guarda no són una excepció', () => {
  for (const s of CATALEG_TELLADO_R3214) {
    const fals=`// ${s.requisits.join('\n// ')}\n${s.embornal}\n`;
    assert.equal(catalogaTellado({...observacio(s),fitxer:s.fontRevisada},preparaRevisioTellado(fals,net(fals,s))),null);
  }
});

// v1.2.26 · G26-3 · El Lector de skills afig un desconegut viu (39) que la 40 cataloga amb límit; cap pendent.
test('R32.14 · repo: 39 catalogades, 0 pendents i 0 infraccions; els 35 desconeguts originals vius, la lectura de la foto d’identitat (v1.2.23), la Caixa d’Estat dels Canals (v1.2.24), la importació del joc (R32.86), el Lector de skills (G26-3) i el veredicte es conserven', () => {
  const r=avaluaPerimetreTellado(ROOT);
  assert.equal(r.totalInfraccions,0);
  assert.equal(r.totalDesconeguts,39);
  assert.equal(r.veredicte,'desconegut');
  assert.equal(r.catalegDinamic.cobertes,39);
  assert.equal(r.catalegDinamic.pendents,0);
  assert.equal(r.catalegDinamic.certificaZeroExfiltracio,false);
});

test('R32.14 · nou sink extern no queda silenciat; conservació del desconegut i del límit', t => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-tellado-cataleg-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'src'));
  fs.writeFileSync(path.join(root,'src/nou.js'),'export const f=url=>fetch(url);\n');
  const r=avaluaPerimetreTellado(root);
  assert.equal(r.totalDesconeguts,1);
  assert.equal(r.catalegDinamic.cobertes,0);
  assert.equal(r.catalegDinamic.pendents,1);
  assert.equal(r.veredicte,'infraccions'); // també falten capçaleres del fixture
});

test('R32.14 · Vigilant exposa el catàleg amb estat informa, sense verd de destí', () => {
  const r=analitzaVigilant(ROOT), c=r.comprovacions.find(x=>x.id==='VIG-11');
  assert.equal(c.estat,'informa');assert.equal(c.avis,true);
  assert.equal(r.catalegDinamic.cobertes,39);
  assert.match(c.proposta,/39 destins\/signatures continuen desconeguts/);
});

test('R32.14 · cost lineal: font adversarial de 8 MiB, molts tokens repetits sense backtracking', () => {
  const cru='fetch('.repeat(Math.floor(8*1024*1024/6));
  const inici=performance.now();
  const r=preparaRevisioTellado(cru,cru);
  assert.equal(r.size,0);
  assert.ok(performance.now()-inici<1000);
});

test('R32.15 · recatàleg xat conserva totes les obligacions de xarxa i exigeix porta binària', () => {
  const previous = ["getResolvedConfig(config)", "jwtPerBackend(config)", "redirect: 'error'", "comprova()", "Authorization: `Bearer ${jwt}`"];
  // És una obligació de la font revisada, no una importació d’este test.
  const binaryImport = ["const { validaFitxerMedia } = await ", 'im', 'port', "('../../utils/validadorContenidorsMedia.js')"].join('');
  const binary = [binaryImport, 'await validaFitxerMedia(fitxer, { signal: config.signal })'];
  for (const id of ['TELLADO-R3214-11', 'TELLADO-R3214-12']) {
    const s = CATALEG_TELLADO_R3214.find(s => s.id === id), cru = font(s), cleaned = net(cru, s);
    assert.notEqual(s.sha256, 'e78a4315bc05184b583d835198af745132ae32d66745f107df6b7522538cf4e5');
    assert.equal(s.requisits.length, previous.length + binary.length);
    for (const obligation of [...previous, ...binary]) {
      assert.ok(s.requisits.includes(obligation), obligation);
      const mutant = cleaned.split(obligation).join('');
      assert.equal(compleixObligacionsTellado(mutant, s), false);
      assert.equal(catalogaTellado(observacio(s), preparaRevisioTellado(mutant, mutant)), null);
    }
    assert.equal(s.certificaDesti, false);
  }
});

// v1.2.26 · G26-3 · La 40 no es pot afluixar: camí acotat, cap credencial, cap redirecció i les dues eixides sanejades.
test('v1.2.26 · G26-3 · el Lector de skills exigix camí /md/skills/, credentials omit, redirect error i sanitizeHtml', () => {
  const s = CATALEG_TELLADO_R3214.find(x => x.id === 'TELLADO-R3214-40');
  assert.equal(s?.fontRevisada, 'src/sections/wiki-de-poble/LectorSkillWiki.jsx');
  assert.equal(s.regla, 'window.fetch');
  for (const obligacio of ['esUrlSkillSegura(skill.url)', "credentials: 'omit'", "redirect: 'error'", 'res.text()']) {
    assert.ok(s.requisits.some(r => r.includes(obligacio)), obligacio);
  }
  assert.equal(s.requisits.filter(r => r.startsWith('__html: sanitizeHtml(')).length, 2);
  assert.equal(s.certificaDesti, false);
});

test('R32.15 · anomenar un nou sink fetchAmbResolucioPublica no li atorga cobertura', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-tellado-new-guard-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'src/guard.js'), 'export function fetchAmbResolucioPublica(url, init) { return fetch(url, init); }\n');
  const r = avaluaPerimetreTellado(root);
  assert.equal(r.totalDesconeguts, 1); assert.equal(r.catalegDinamic.cobertes, 0); assert.equal(r.catalegDinamic.pendents, 1);
  assert.equal(r.catalegDinamic.certificaZeroExfiltracio, false);
});
