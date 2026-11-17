import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { diagnosticar, validaComponentPortable } from '../tooling/sentinella/sentinella-jarvis-espai.mjs';
function fixture(t) {
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r32-jarvis-')));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const cache = path.join(home, '.npm/_cacache'); fs.mkdirSync(cache, { recursive: true });
  fs.writeFileSync(path.join(cache, 'bloc'), '1234567');
  return { home, cache };
}
/* R32.3 · Peix R32.2 (P3): purge() està bloquejat sempre, així que «0 bytes eliminats» és cert per
   construcció. Cada frontera comprova la guarda concreta i que no ha entrat res a l'inventari. */
function bloquejatPer(r, error) {
  assert.equal(r.bosses[0].estat, 'bloquejat'); assert.equal(r.bosses[0].error, error); assert.equal(r.bosses[0].bytes, null);
}
test('lectura per defecte i neteja bloquejada honestament sense primitiva atòmica', (t) => {
  const { home, cache } = fixture(t);
  assert.equal(diagnosticar({ home }).bosses[0].bytes, 7); assert.ok(fs.existsSync(path.join(cache, 'bloc')));
  const r = diagnosticar({ home, neteja: true });
  assert.equal(r.bytesEliminats, 0); assert.equal(r.bytesAlliberats, null); assert.equal(r.bosses[0].estat, 'bloquejat');
  assert.equal(r.bosses[0].error, 'NETEJA_ATOMICA_NO_DISPONIBLE'); assert.ok(r.avisos.includes('NETEJA_ATOMICA_NO_DISPONIBLE'));
  assert.equal(fs.readFileSync(path.join(cache, 'bloc'), 'utf8'), '1234567');
  assert.equal(diagnosticar({ home, neteja: true }).bytesEliminats, 0);
});
test('symlink al root de cache bloqueja i deixa la nota externa intacta', (t) => {
  const { home, cache } = fixture(t); fs.rmSync(cache, { recursive: true });
  const sacred = path.join(home, 'notes'); fs.mkdirSync(sacred); fs.writeFileSync(path.join(sacred, 'nota'), 'sagrada');
  fs.symlinkSync(sacred, cache);
  const r = diagnosticar({ home, neteja: true }); assert.equal(r.bytesEliminats, 0); bloquejatPer(r, 'DIRECTORI_NO_REGULAR');
  bloquejatPer(diagnosticar({ home }), 'DIRECTORI_NO_REGULAR');
  assert.equal(fs.readFileSync(path.join(sacred, 'nota'), 'utf8'), 'sagrada');
});
test('symlink intermedi o fill: zero neteja parcial prèvia a validació', (t) => {
  const { home, cache } = fixture(t); const outside = path.join(home, 'fora'); fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'nota'), 'pendent'); fs.symlinkSync(outside, path.join(cache, 'zz'));
  const r = diagnosticar({ home, neteja: true }); bloquejatPer(r, 'SYMLINK_PROHIBIT');
  assert.equal(fs.readFileSync(path.join(cache, 'bloc'), 'utf8'), '1234567');
  assert.equal(fs.readFileSync(path.join(outside, 'nota'), 'utf8'), 'pendent');
});
test('backup i repositori dins la cache són intocables', (t) => {
  const { home, cache } = fixture(t); fs.writeFileSync(path.join(cache, 'copia.sdpbackup'), 'backup');
  assert.equal(diagnosticar({ home, neteja: true }).bytesEliminats, 0); bloquejatPer(diagnosticar({ home }), 'DADA_SAGRADA');
  fs.unlinkSync(path.join(cache, 'copia.sdpbackup')); fs.mkdirSync(path.join(cache, '.git'));
  assert.equal(diagnosticar({ home, neteja: true }).bytesEliminats, 0); bloquejatPer(diagnosticar({ home }), 'DADA_SAGRADA');
  assert.ok(fs.existsSync(path.join(cache, 'bloc')));
});
test('hardlink no es toca', (t) => {
  const { home, cache } = fixture(t); fs.linkSync(path.join(cache, 'bloc'), path.join(home, 'nota'));
  assert.equal(diagnosticar({ home, neteja: true }).bytesEliminats, 0); assert.ok(fs.existsSync(path.join(home, 'nota')));
  bloquejatPer(diagnosticar({ home }), 'FULL_NO_REGULAR_O_HARDLINK');
});
test('noms Windows reservats es rebutgen també en macOS/Linux', (t) => {
  const { home, cache } = fixture(t);
  for (const name of ['CON', 'nul.txt', 'COM1', 'LPT¹', 'fitxer:ads', 'final.', 'final ']) {
    assert.throws(() => validaComponentPortable(name));
    const file = path.join(cache, name); fs.writeFileSync(file, 'intocable');
    assert.equal(diagnosticar({ home, neteja: true }).bytesEliminats, 0, name);
    bloquejatPer(diagnosticar({ home }), 'COMPONENT_NO_PORTABLE'); fs.unlinkSync(file);
  }
});
test('Unix no pot seguir symlink en un ancestre', (t) => {
  const { home } = fixture(t); const alias = `${home}-alias`; fs.symlinkSync(home, alias); t.after(() => fs.unlinkSync(alias));
  const r = diagnosticar({ home: alias, neteja: true }); assert.equal(r.bytesEliminats, 0); assert.ok(r.avisos.length);
  // R32.3 · El codi del helper arriba a l'avís (abans «INVENTARI_NO_DISPONIBLE:Error») i no hi ha inventari.
  assert.ok(r.avisos.includes('INVENTARI_NO_DISPONIBLE:DIRECTORI_NO_REGULAR'), r.avisos.join()); assert.deepEqual(r.bosses, []);
});
test('Windows retorna quota real si disponible i bloqueig honest de neteja', (t) => {
  const { home, cache } = fixture(t); const r = diagnosticar({ home, plataforma: 'win32', neteja: true });
  assert.equal(r.bytesEliminats, 0); assert.ok(r.avisos.includes('NETEJA_NO_DISPONIBLE_EN_AQUESTA_PLATAFORMA')); assert.ok(fs.existsSync(path.join(cache, 'bloc')));
});

test('el helper Python públic tampoc pot eliminar ni un fitxer, encara que config.neteja=True', (t) => {
  const { home, cache } = fixture(t);
  const source = path.resolve('tooling/sentinella/sentinella-posix.py');
  const code = `import importlib.util,sys,json
s=importlib.util.spec_from_file_location('sentinella',sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
mutacions=[]
def prohibit(*args,**kwargs):
 mutacions.append('unlink');raise RuntimeError('MUTACIO_NO_AUTORITZADA')
m.os.unlink=prohibit
r=m.run({'home':sys.argv[2],'neteja':True})
try:
 m.purge(None,[],{})
except ValueError as e:
 directe=str(e)
print(json.dumps({'r':r,'mutacions':mutacions,'directe':directe}))`;
  const result=JSON.parse(execFileSync('python3',['-B','-c',code,source,home],{encoding:'utf8'}));
  assert.deepEqual(result.mutacions,[]);assert.equal(result.directe,'NETEJA_ATOMICA_NO_DISPONIBLE');
  assert.equal(result.r[0].estat,'bloquejat');assert.equal(result.r[0].error,'NETEJA_ATOMICA_NO_DISPONIBLE');
  assert.equal(fs.readFileSync(path.join(cache,'bloc'),'utf8'),'1234567');
});
