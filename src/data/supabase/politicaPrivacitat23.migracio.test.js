// @vitest-environment node
/* T11-05 (Gemini, Tall 11; marató 261101_2143, torn torn_3d9af83b) · Prova
   estàtica de la migració 2611012257_politica_privacitat_2_3.sql: la primera
   versió 2.x segellada a public.politiques_privacitat (fins ara només hi havia
   la 'v1', sense empremta). No hi ha cap base de dades: es llig el SQL.
   · La migració de la 2.3 es comprova per dins, sense mirar el /legal d'avui:
     capçalera, llista tancada de sentències, l'empremta és el SHA-256 del text
     que segella, i la versió i la data són les del rètol d'eixe text. Així, una
     versió nova legítima (la 2.4, en una migració nova) no la fa caure mai: una
     migració aplicada no es reescriu (SDP-RGPD-021). El detector
     `problemesPolitica` es prova també contra mutacions.
   · La guarda general és la §18 de /legal («No modifiquem aquest document en
     silenci») feta prova, per a qualsevol versió: la darrera migració que
     segella, per nom, porta el text que /legal servix hui i la versió del seu
     rètol; cada versió es segella una sola vegada, amb dates creixents. Editar
     legalContent.js sense una versió nova i la seua migració fa fallar la prova.
   El comportament (CHECK, idempotència i immutabilitat) es va provar en PGlite
   0.3.16 fora del repositori (evidència no versionada del torn torn_3d9af83b). */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { legalContent } from '../../sections/text/legalContent.js';

const ARREL = process.cwd();
const NOM = '2611012257_politica_privacitat_2_3.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const ORDRE = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
const llig = (fitxer) => readFileSync(path.join(MIGRACIONS, fitxer), 'utf8');
const SQL = llig(NOM);
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
const HTML = legalContent.html;
const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

const DELIM = '$politica_2_3$';
const MESOS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
const NET = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
/* Una inserció que segella: la llista de columnes porta text_complet (la 'v1' de 2609261500 no la porta). */
const INSERCIO_SEGELLADA = /insert\s+into\s+public\.politiques_privacitat\s*\([^)]*\btext_complet\b[^)]*\)/i;

/** La versió i la data (AAAA-MM-DD) del rètol d'un text de /legal: «Versió X · En vigor des de l'1 de novembre de 2026». */
function rotulDe(html) {
  const m = String(html).match(/<p><em>Versió (\S+) · En vigor des (?:de l'|del )(\d{1,2}) (?:de |d')([a-zç]+) de (\d{4})\./);
  if (!m) return null;
  const mes = MESOS.indexOf(m[3]) + 1;
  return { versio: m[1], data: `${m[4]}-${String(mes).padStart(2, '0')}-${m[2].padStart(2, '0')}`, mesValid: mes > 0 };
}

/** Les sentències del codi, en ordre: primer es pleguen els cossos $…$ (el text de /legal), després
    es lleven els comentaris (porten apòstrofs) i, al final, es pleguen les cadenes '…'. */
function sentencies(sql) {
  const plegat = sql
    .replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, () => '$$cos$$')
    .split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n')
    .replace(/'(?:[^']|'')*'/g, () => "'txt'");
  return plegat.split(';').map(NET).filter(Boolean);
}

const SENTENCIES_ESPERADES = [
  'begin',
  "set local lock_timeout = 'txt'",
  "set local statement_timeout = 'txt'",
  "insert into public.politiques_privacitat (versio, vigent_des_de, url, text_sha256, text_complet, mecanisme, resum_canvis) values ( 'txt', timestamptz 'txt', 'txt', 'txt', $$cos$$, 'txt', 'txt' ) on conflict (versio) do nothing",
  'commit'
];

/** La fila que segella una migració (qualsevol delimitador $etiqueta$): versió, data, url, empremta, text, mecanisme i resum. */
function filaDe(sql) {
  const insercio = sql.search(INSERCIO_SEGELLADA);
  const valors0 = insercio < 0 ? -1 : sql.indexOf('values (', insercio);
  if (valors0 < 0) return null;
  const obertura = /\$\w+\$/.exec(sql.slice(valors0));
  if (!obertura) return null;
  const delim = obertura[0];
  const inici = valors0 + obertura.index;
  const fi = sql.indexOf(delim, inici + delim.length);
  if (fi < 0) return null;
  const valors = [...sql.slice(valors0, inici).matchAll(/'((?:[^']|'')*)'/g)].map((m) => m[1]);
  const conflicte = sql.indexOf('on conflict', fi);
  const despres = [...sql.slice(fi + delim.length, conflicte < 0 ? undefined : conflicte).matchAll(/'((?:[^']|'')*)'/g)].map((m) => m[1].replace(/''/g, "'"));
  const [versio, data, url, empremta] = valors;
  return { versio, data, url, empremta, delim, text: sql.slice(inici + delim.length, fi), mecanisme: despres[0], resum: despres[1] };
}

/** Els problemes de la migració de la 2.3, mirada per dins (sense el /legal d'avui); [] vol dir que és la decidida. */
function problemesPolitica(sql) {
  const problemes = [];
  if (!/NO aplicada: l'aplica el Mestre, mai\n-- un agent\./.test(sql)) problemes.push('capçalera sense «NO aplicada»');
  for (const clau of ['ABANS (lectura):', 'DESPRÉS (lectura):', 'INVERSA:', 'ORDRE:']) if (!sql.includes(`-- ${clau}`)) problemes.push(`capçalera sense ${clau}`);
  const reals = sentencies(sql);
  if (JSON.stringify(reals) !== JSON.stringify(SENTENCIES_ESPERADES)) problemes.push(`sentències: ${reals.join(' | ')}`);
  if (sql.split(DELIM).length !== 3) problemes.push('el delimitador no hi és exactament dues vegades');
  const fila = filaDe(sql);
  if (!fila) return [...problemes, 'sense fila'];
  const rotul = rotulDe(fila.text);
  if (!rotul?.mesValid) problemes.push('el rètol del text segellat no es pot llegir');
  if (!/^[0-9a-f]{64}$/.test(fila.empremta ?? '')) problemes.push('empremta sense format');
  if (fila.empremta !== sha256(fila.text)) problemes.push('l’empremta no és la del text segellat');
  if (fila.versio !== '2.3') problemes.push(`versió ${fila.versio}: esta migració és la de la 2.3`);
  if (fila.versio !== rotul?.versio) problemes.push(`versió ${fila.versio} i rètol del text ${rotul?.versio}`);
  if (fila.data !== `${rotul?.data} 00:00:00+01`) problemes.push(`data ${fila.data} i rètol del text ${rotul?.data}`);
  if (fila.url !== '/legal') problemes.push(`url ${fila.url}`);
  if (!sql.includes(`select text_sha256 = '${fila.empremta}' as segellada_2_3`)) problemes.push('la consulta «Després» no porta l’empremta');
  if (!fila.mecanisme || fila.mecanisme.length > 2000 || !fila.resum || fila.resum.length > 2000) problemes.push('mecanisme o resum buits o massa llargs');
  if (fila.text.length > 200000) problemes.push('text massa llarg per al CHECK politiques_text_llargaria');
  return problemes;
}

/* «AAAA-MM-DD hh:mm:ss±hh» → mil·lisegons (NaN si no es pot llegir). */
const instant = (data) => Date.parse(String(data).replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'));

/**
 * La §18 de /legal feta prova, per a qualsevol ordre de migracions i qualsevol
 * /legal: [] vol dir que cada versió es segella una sola vegada, amb el seu
 * rètol, la seua empremta i dates creixents, i que la darrera (per nom) és la
 * que /legal servix.
 */
function problemesParagraf18(fitxers, llegeix, html) {
  const files = fitxers.filter((f) => INSERCIO_SEGELLADA.test(llegeix(f))).map((f) => ({ f, fila: filaDe(llegeix(f)) }));
  if (!files.length) return ['cap migració no segella cap versió de /legal'];
  const problemes = [];
  const vistes = new Map();
  let anterior = -Infinity;
  for (const { f, fila } of files) {
    if (!fila) { problemes.push(`${f}: no es pot llegir la fila`); continue; }
    if (rotulDe(fila.text)?.versio !== fila.versio) problemes.push(`${f}: segella la ${fila.versio}, però el seu text diu ${rotulDe(fila.text)?.versio}`);
    if (fila.empremta !== sha256(fila.text)) problemes.push(`${f}: l’empremta no és la del seu text`);
    if (vistes.has(fila.versio)) problemes.push(`${f}: la ${fila.versio} ja la segella ${vistes.get(fila.versio)}`);
    vistes.set(fila.versio, f);
    const ara = instant(fila.data);
    if (!(ara > anterior)) problemes.push(`${f}: vigent_des_de ${fila.data} no és posterior a la de la versió anterior`);
    anterior = ara;
  }
  const { f: darrera, fila } = files.at(-1);
  if (!fila) return problemes;
  if (fila.empremta !== sha256(html)) {
    problemes.push(`/legal no és el text que segella ${darrera} (versió ${fila.versio}). Si ${darrera} ja s'ha aplicat o la seua versió ja és pública, no es toca (SDP-RGPD-021): puja la versió del rètol de /legal i segella-la en una migració nova. Només si encara no s'ha aplicat ni publicat, es corregix (text i empremta).`);
  }
  if (rotulDe(html)?.versio !== fila.versio) problemes.push(`el rètol de /legal diu ${rotulDe(html)?.versio} i la darrera versió segellada és la ${fila.versio} (${darrera})`);
  return problemes;
}

/* Una versió nova legítima, en memòria: el /legal de hui amb un altre rètol i la seua migració, feta a partir de la de la 2.3. */
function versioNova({ versio = '2.4', dia = 20, html = HTML } = {}) {
  const rotulVell = rotulDe(html);
  const nou = html.replace(/<p><em>Versió \S+ · En vigor des d[^.]*\./, `<p><em>Versió ${versio} · En vigor des del ${dia} de novembre de 2026.`);
  const fila = filaDe(SQL);
  const etiqueta = `$politica_${versio.replace(/\W/g, '_')}$`;
  const cos = SQL.slice(0, SQL.indexOf(DELIM)) + etiqueta + nou + etiqueta + SQL.slice(SQL.lastIndexOf(DELIM) + DELIM.length);
  const sql = cos.split(fila.empremta).join(sha256(nou))
    .replace(`  '${fila.versio}',\n`, `  '${versio}',\n`)
    .replace(`timestamptz '${fila.data}'`, `timestamptz '2026-11-${String(dia).padStart(2, '0')} 00:00:00+01'`);
  expect([rotulVell?.versio, rotulDe(nou)?.versio, filaDe(sql)?.versio]).toEqual([rotulVell?.versio, versio, versio]);
  return { html: nou, sql };
}

describe('2611012257 · la política de privacitat 2.3 segellada (T11-05)', () => {
  test('és la migració decidida: el text que segella, la seua empremta, i la versió i la data del seu rètol', () => {
    expect(problemesPolitica(SQL)).toEqual([]);
    const fila = filaDe(SQL);
    expect(rotulDe(fila.text)).toEqual({ versio: '2.3', data: '2026-11-01', mesValid: true });
    expect([fila.delim, fila.versio, fila.data, fila.url, fila.empremta]).toEqual([DELIM, '2.3', '2026-11-01 00:00:00+01', '/legal', sha256(fila.text)]);
  });

  test('el detector mossega: un caràcter, una altra versió, sense on conflict, una sentència de més, una altra data', () => {
    const empremta = filaDe(SQL).empremta;
    const casos = {
      caracter: SQL.replace('Versió 2.3 · En vigor', 'Versió 2.3 · En vigoR'),
      textSenseEmpremta: SQL.replace('Edat mínima: 16 anys.', 'Edat mínima: 15 anys.'),
      versio: SQL.replace("  '2.3',\n", "  '2.4',\n"),
      senseConflicte: SQL.replace('on conflict (versio) do nothing;', ';'),
      actualitza: SQL.replace('on conflict (versio) do nothing;', 'on conflict (versio) do update set text_complet = excluded.text_complet;'),
      sentencia: SQL.replace('commit;', "delete from public.politiques_privacitat where versio = 'v1';\ncommit;"),
      data: SQL.replace("timestamptz '2026-11-01 00:00:00+01'", "timestamptz '2026-11-15 00:00:00+01'"),
      empremta: SQL.replace(`  '${empremta}',\n`, `  '${sha256(`${HTML} `)}',\n`),
      despres: SQL.replace(`select text_sha256 = '${empremta}'`, `select text_sha256 = '${'0'.repeat(64)}'`),
      url: SQL.replace("  '/legal',\n", "  '/privacitat',\n"),
      capcalera: SQL.replace("NO aplicada: l'aplica el Mestre", 'Aplicada')
    };
    for (const [nom, mutada] of Object.entries(casos)) {
      expect(mutada, nom).not.toBe(SQL);
      expect(problemesPolitica(mutada).length, nom).toBeGreaterThan(0);
    }
  });

  test('§18 de /legal: la darrera migració que segella porta el text que /legal servix hui', () => {
    expect(problemesParagraf18(ORDRE, llig, HTML)).toEqual([]);
    // I un /legal editat sense versió nova: la guarda ho diu, i no demana reescriure una migració aplicada.
    const darrera = ORDRE.filter((f) => INSERCIO_SEGELLADA.test(llig(f))).at(-1);
    const editat = problemesParagraf18(ORDRE, llig, `${HTML}<p>Un retoc sense versió nova.</p>`);
    expect(editat).toHaveLength(1);
    expect(editat[0].startsWith(`/legal no és el text que segella ${darrera} (versió ${filaDe(llig(darrera)).versio}). `)).toBe(true);
    expect(editat[0]).toMatch(/puja la versió del rètol de \/legal i segella-la en una migració nova/);
  });

  /* El món de la 2.3, fix: les migracions fins a esta i el text que segella. No depén del /legal d'avui. */
  const MON_23 = ORDRE.filter((f) => f <= NOM);
  const TEXT_23 = filaDe(SQL).text;

  test('una versió nova legítima (la 2.4, en una migració nova) no fa caure ni la 2.3 ni la §18', () => {
    expect(problemesParagraf18(MON_23, llig, TEXT_23)).toEqual([]);
    const { html, sql } = versioNova({ html: TEXT_23 });
    const NOU = '2611200000_politica_privacitat_2_4.sql';
    const llegeix = (f) => (f === NOU ? sql : llig(f));
    expect(problemesParagraf18([...MON_23, NOU], llegeix, html)).toEqual([]);
    expect(problemesPolitica(SQL)).toEqual([]);
    // Però la 2.4 sense la seua migració, o amb una data anterior a la de la 2.3, o tornant a segellar la 2.3, sí.
    expect(problemesParagraf18(MON_23, llig, html).join(' ')).toMatch(/el rètol de \/legal diu 2\.4/);
    const enrere = versioNova({ dia: 1, html: TEXT_23 }).sql.replace("timestamptz '2026-11-01 00:00:00+01'", "timestamptz '2026-10-31 00:00:00+01'");
    expect(problemesParagraf18([...MON_23, NOU], (f) => (f === NOU ? enrere : llig(f)), html).join(' ')).toMatch(/no és posterior/);
    const repetida = versioNova({ versio: '2.3', dia: 21, html: TEXT_23 });
    expect(problemesParagraf18([...MON_23, NOU], (f) => (f === NOU ? repetida.sql : llig(f)), repetida.html).join(' ')).toMatch(/la 2\.3 ja la segella 2611012257/);
  });

  test('el delimitador no apareix dins del text segellat, i el text cap al CHECK de llargària', () => {
    const { text } = filaDe(SQL);
    expect(text.includes(DELIM)).toBe(false);
    expect(text.length).toBeLessThanOrEqual(200000);
  });

  test('supabase/README.md: vinyeta, fila del catàleg i pas de l’ordre obligatori', () => {
    const empremta = filaDe(SQL).empremta;
    expect(README).toContain(`- \`migrations/${NOM}\``);
    expect(README).toMatch(new RegExp(`^\\| \\d+ \\| \`2611012257\` \\| \`${NOM}\` \\| \\*\\*NO aplicada: l'aplica el Mestre\\*\\* \\| [^|]+ \\|$`, 'm'));
    const vinyeta = README.slice(README.indexOf(`- \`migrations/${NOM}\``), README.indexOf('- `seed.sql`'));
    expect(vinyeta).toContain('src/data/supabase/politicaPrivacitat23.migracio.test.js');
    expect(vinyeta).toContain(empremta);
    expect(vinyeta).toMatch(/NO aplicada: l'aplica el Mestre, mai un agent/);
    const ordre = README.slice(README.indexOf("### Nota d'auditoria `DF-06`"), README.indexOf('### Taula canònica'));
    expect(ordre).toMatch(/^ {2}\d+\. Primer el desplegament web amb el text final de `\/legal`; després `2611012257`/m);
    // Els dist/ vells porten una altra «Versió 2.3»: el pas diu que cal tornar a construir i comprovar l'empremta.
    expect(ordre).toMatch(/2611012257[^\n]*tornar a construir[^\n]*empremta/);
  });
});
