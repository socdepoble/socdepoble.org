/* R24 · G-sql-3 (Gauntlet R24, onada 3) · El llibre canònic
   (supabase/README.md) i el comentari del mode local (src/data/localXat.js)
   han de descriure la mateixa regla D-1 que aplica 20261114061000: el MÍNIM
   dels destinataris vigents, com public.xat_ritme, amb el MÀXIM com a
   alternativa (helper i xat_ritme alhora). Abans, el README la donava per
   decidida i deia MÀXIM als canals d'entitat. Onada R24.2 · el Mestre la
   decidix el 14-11-2026 (decisió D2): el MÍNIM; README i migració ho diuen
   amb la mateixa decisió.
   Prova estàtica; cap base de dades. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('R24 · README, migració i mode local diuen la mateixa regla D-1', () => {
  const migracio = read('supabase/migrations/20261114061000_r24_xat_rebuts_entrega.sql');
  assert.match(migracio, /Regla D-1 \(integrador R24; decidida pel Mestre el 14-11-2026 a les\n--\s+15:48, decisió D2 de l'Onada R24\.2\): el MÍNIM/);
  assert.doesNotMatch(migracio, /pendent de decisió del Mestre/);
  assert.match(migracio, /coalesce\(min\(p\.rebut_fins_seq\), 0\)/);
  assert.match(migracio, /coalesce\(min\(p\.llegit_fins_seq\), 0\)/);
  assert.doesNotMatch(migracio, /\bmax\(p\.(rebut|llegit)_fins_seq\)/);

  const entrada = read('supabase/README.md').split('\n').filter(l => l.includes('Crea `private.xat_cursors_altres'));
  assert.equal(entrada.length, 1, 'una sola entrada narrativa de 20261114061000');
  assert.doesNotMatch(entrada[0], /\*\*màxim\*\* dels gestors/, 'el README diu MÀXIM per als canals d’entitat; la migració aplica el MÍNIM');
  assert.doesNotMatch(entrada[0], /decisió del Mestre, D-xat_entrega-1/, 'la fórmula antiga que la donava per decidida sense la decisió');
  assert.match(entrada[0], /Regla D-1 \(decidida pel Mestre el 14-11-2026, decisió D2 de l'Onada R24\.2/);
  assert.doesNotMatch(entrada[0], /pendent de decisió del Mestre/);
  assert.match(entrada[0], /\*\*mínim\*\*/);
  assert.match(entrada[0], /`xat_ritme`/);
  assert.match(entrada[0], /alternativa/);

  const local = read('src/data/localXat.js');
  assert.doesNotMatch(local, /porta el màxim dels\s+gestors, com la regla D-1 del servidor/, 'el comentari del mode local atribuïx el màxim al servidor');
});
