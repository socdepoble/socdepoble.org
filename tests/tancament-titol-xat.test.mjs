// R30 · Títol Termodinàmic suggerit per tancament.mjs: camp informatiu, determinista i no bloquejant.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ACTES_MARMOTA, LLARGARIA_TITOL_XAT, suggereixTitolXat, titolXatDesDeActa
} from '../tooling/gates/tancament.mjs';

const FORMAT = /^\d{6}_\d{4}(?:_r\d{1,3})?(?:_[a-z0-9]+)*$/;

function arrelAmbActes(t, noms) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-titol-xat-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, ACTES_MARMOTA);
  fs.mkdirSync(dir, { recursive: true });
  for (const nom of noms) fs.writeFileSync(path.join(dir, nom), '# acta\n');
  return { root, dir };
}

test('deriva aammdd_hhmm_rXX_slug de l’última Acta Marmota i descarta el farcit', () => {
  assert.equal(
    titolXatDesDeActa('261115_2034_acta_marmota_onada_r29_sobretaula_v1_2_2_4_carrils_i_preparacio_r30.md'),
    '261115_2034_r29_sobretaula_v1_2_2_4_carrils_preparacio_r30'
  );
  assert.equal(
    titolXatDesDeActa('261112_2152_acta_marmota_deploy_omnicanal_r21_segona_passada_i_emowe.md'),
    '261112_2152_r21_deploy_omnicanal_segona_passada_emowe'
  );
});

test('sense ona rXX conserva el format aammdd_hhmm_slug; un nom aliè no suggerix res', () => {
  assert.equal(titolXatDesDeActa('261030_0252_acta_marmota_guardia_nocturna.md'), '261030_0252_guardia_nocturna');
  assert.equal(titolXatDesDeActa('261008_1105_acta_tancament_onada_3.md'), null);
  assert.equal(titolXatDesDeActa('261115_2034_Acta_Marmota_R29.md'), null);
  assert.equal(titolXatDesDeActa('notes.md'), null);
});

test('mai passa de 70 caràcters i talla per paraules senceres', () => {
  const llarg = `261115_2359_acta_marmota_r30_${Array.from({ length: 30 }, (_, i) => `paraula${i}`).join('_')}.md`;
  const titol = titolXatDesDeActa(llarg);
  assert.ok(titol.length <= LLARGARIA_TITOL_XAT, titol);
  assert.match(titol, FORMAT);
  assert.ok(titol.startsWith('261115_2359_r30_paraula0_paraula1'));
  assert.ok(!titol.endsWith('_'));
  assert.match(titol, /_paraula\d+$/);
});

test('tria l’Acta Marmota més recent sense dependre de l’ordre del directori', (t) => {
  const noms = [
    '261115_1834_acta_marmota_codex_r29_sobretaula.md',
    '261115_2034_acta_marmota_onada_r29_sobretaula_v1_2_2_4_carrils_i_preparacio_r30.md',
    '261114_2214_acta_marmota_r26_farcellet.md',
    '261116_0900_auditoria_claude.md',
    '261116_0800_acta_tancament_onada_31.md'
  ];
  const a = arrelAmbActes(t, noms);
  const b = arrelAmbActes(t, [...noms].reverse());
  const esperat = '261115_2034_r29_sobretaula_v1_2_2_4_carrils_preparacio_r30';
  assert.equal(suggereixTitolXat(a.root), esperat);
  assert.equal(suggereixTitolXat(b.root), esperat);
  assert.equal(suggereixTitolXat(a.root), suggereixTitolXat(a.root));
});

test('només compten fitxers regulars: un directori o un enllaç amb nom d’acta no guanyen', (t) => {
  const { root, dir } = arrelAmbActes(t, ['261115_2034_acta_marmota_r29_sobretaula.md']);
  fs.mkdirSync(path.join(dir, '261231_2359_acta_marmota_r99_directori.md'));
  fs.symlinkSync(path.join(dir, '261115_2034_acta_marmota_r29_sobretaula.md'), path.join(dir, '261231_2358_acta_marmota_r98_enllac.md'));
  assert.equal(suggereixTitolXat(root), '261115_2034_r29_sobretaula');
});

test('sense 10_actes o sense cap Acta Marmota el camp és null i no llança', (t) => {
  const buit = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-titol-xat-buit-'));
  t.after(() => fs.rmSync(buit, { recursive: true, force: true }));
  assert.equal(suggereixTitolXat(buit), null);
  const { root } = arrelAmbActes(t, ['260923_1535_auditoria_claude.md']);
  assert.equal(suggereixTitolXat(root), null);
});
