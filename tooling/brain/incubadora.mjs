#!/usr/bin/env node
/** D7 · Safata d'Incubació (v1.2.26, Pacte de les 8 Decisions, aprovat pel Mestre el 25-11-2026 a les 20:37 CET).
 *
 *  Tota millora o correcció repetida d'una skill entra primer ací, mai directament a una skill segellada.
 *  `.agents/incubacio/propostes.jsonl` és un registre d'esdeveniments només d'afegir (una línia JSON per
 *  esdeveniment): una proposta naix «incubant» i només el Mestre la pot passar a «aprovada» o «rebutjada».
 *  Aprovar-la no edita cap skill: l'edició va després pel circuit governat (executor de mutacions i
 *  `segella.mjs --update`), i la prova que la posa roja ha d'existir abans (principi 7 del paper).
 *
 *  Gauntlet 261126 (lent A): cada línia porta `cadena`, el SHA-256 de tot el registre anterior (una edició o un
 *  esborrat al mig trenca la relectura); la relectura valida cada decisió (només «Mestre», estats i data); els
 *  camins d'evidència i de prova han de ser dins del repositori; i `--decidix` des de la línia d'ordres només
 *  s'accepta en un terminal interactiu amb la frase «Sóc el Mestre». No és una signatura: la defensa final és
 *  que el registre és versionat i el seu diff es revisa.
 *
 *  Ús:
 *    node tooling/brain/incubadora.mjs [--llista] [--json]
 *    node tooling/brain/incubadora.mjs --proposa --skill=NOM --motiu=TEXT --evidencia=CAMI[:LINIA] [--evidencia=…]
 *                                      --prova=CAMI --retira=TEXT --autor=NOM
 *    node tooling/brain/incubadora.mjs --decidix --id=ID --estat=aprovada|rebutjada --per=Mestre --data=AAAA-MM-DD --motiu=TEXT
 *  Opció comuna: --arrel=DIR.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const REGISTRE = '.agents/incubacio/propostes.jsonl';
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const SKILL = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = (v, max = 2000) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const FRASE_HUMANA = 'Sóc el Mestre';

/** Un camí relatiu, sense «..», «~» ni absoluts, que resol dins del repositori (amb :LINIA opcional). */
function dinsDelRepositori(arrel, cami, { existix = true } = {}) {
  if (!text(cami, 300)) return false;
  const net = cami.replace(/:\d+$/, '');
  if (path.isAbsolute(net) || net.startsWith('~') || net.split(/[\\/]/).includes('..')) return false;
  const abs = path.resolve(arrel, net);
  if (!abs.startsWith(path.resolve(arrel) + path.sep)) return false;
  return !existix || fs.existsSync(abs);
}

export function llegix(arrel) {
  const cami = path.join(arrel, REGISTRE);
  if (!fs.existsSync(cami)) return [];
  const brut = fs.readFileSync(cami, 'utf8');
  if (brut && !brut.endsWith('\n')) throw new Error(`${REGISTRE} no acaba en salt de línia: registre incomplet`);
  const linies = brut.split('\n').filter(Boolean);
  let previ = '';
  return linies.map((l, i) => {
    let e;
    try { e = JSON.parse(l); } catch { throw new Error(`${REGISTRE}:${i + 1} no és JSON`); }
    if (e.cadena !== sha(previ)) throw new Error(`${REGISTRE}:${i + 1} trenca la cadena: el registre anterior s'ha editat o esborrat`);
    previ += `${l}\n`;
    return e;
  });
}

/** Estat de cada proposta a partir dels esdeveniments, en ordre. */
export function estat(esdeveniments) {
  const propostes = new Map();
  for (const e of esdeveniments) {
    if (e.tipus === 'proposta') {
      if (propostes.has(e.id)) throw new Error(`proposta repetida: ${e.id}`);
      propostes.set(e.id, { ...e, estat: 'incubant', decisio: null });
    } else if (e.tipus === 'decisio') {
      if (e.per !== 'Mestre' || !['aprovada', 'rebutjada'].includes(e.estat) || !DATA.test(e.data ?? '') || !text(e.motiu)) throw new Error(`decisió invàlida per a ${e.id}: només el Mestre aprova o rebutja, amb data i motiu`);
      const p = propostes.get(e.id);
      if (!p) throw new Error(`decisió d'una proposta absent: ${e.id}`);
      if (p.estat !== 'incubant') throw new Error(`la proposta ${e.id} ja està ${p.estat}`);
      p.estat = e.estat; p.decisio = e;
    } else throw new Error(`esdeveniment desconegut: ${e.tipus}`);
  }
  return [...propostes.values()];
}

function afig(arrel, nou) {
  const cami = path.join(arrel, REGISTRE);
  fs.mkdirSync(path.dirname(cami), { recursive: true });
  const previs = llegix(arrel);
  const esdeveniment = { ...nou, cadena: sha(fs.existsSync(cami) ? fs.readFileSync(cami) : '') };
  estat([...previs, esdeveniment]);
  const fd = fs.openSync(cami, fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_NOFOLLOW, 0o644);
  try { fs.writeFileSync(fd, `${JSON.stringify(esdeveniment)}\n`); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  return esdeveniment;
}

export function proposa(arrel, { skill, motiu, evidencia = [], prova, retira, autor, ara = new Date() }) {
  if (!SKILL.test(skill ?? '') || !fs.existsSync(path.join(arrel, '.agents/skills', skill, 'SKILL.md'))) throw new Error(`skill desconeguda: ${skill}`);
  if (!text(motiu) || !text(retira) || !text(autor, 80)) throw new Error('cal --motiu, --retira (què ix o es compacta a canvi) i --autor');
  if (!evidencia.length || !evidencia.every((e) => dinsDelRepositori(arrel, e))) throw new Error('cal almenys una --evidencia existent dins del repositori (camí relatiu, sense «..» ni «~»)');
  if (!dinsDelRepositori(arrel, prova)) throw new Error('cal --prova amb el camí d\'una prova existent dins del repositori que la pose roja');
  return afig(arrel, { tipus: 'proposta', id: randomUUID(), quan: ara.toISOString(), skill, motiu: motiu.trim(), evidencia, prova, retira: retira.trim(), autor: autor.trim() });
}

export function decidix(arrel, { id, estat: nou, per, data, motiu, ara = new Date(), confirmacioHumana }) {
  if (typeof confirmacioHumana !== 'function' || confirmacioHumana() !== true) throw new Error('una decisió necessita la confirmació humana del Mestre');
  if (!['aprovada', 'rebutjada'].includes(nou)) throw new Error('--estat ha de ser aprovada o rebutjada');
  if (per !== 'Mestre') throw new Error('només el Mestre decidix una proposta (--per=Mestre)');
  if (!DATA.test(data ?? '') || !text(motiu)) throw new Error('cal --data=AAAA-MM-DD i --motiu');
  return afig(arrel, { tipus: 'decisio', id, quan: ara.toISOString(), estat: nou, per, data, motiu: motiu.trim() });
}

function main(argv) {
  const opcio = (nom) => argv.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3);
  const totes = (nom) => argv.filter((a) => a.startsWith(`--${nom}=`)).map((a) => a.slice(nom.length + 3));
  const arrel = opcio('arrel') || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  if (argv.includes('--proposa')) {
    const e = proposa(arrel, { skill: opcio('skill'), motiu: opcio('motiu'), evidencia: totes('evidencia'), prova: opcio('prova'), retira: opcio('retira'), autor: opcio('autor') });
    process.stdout.write(`Proposta ${e.id} incubant per a ${e.skill}.\n`); return 0;
  }
  if (argv.includes('--decidix')) {
    const confirmacioHumana = () => {
      if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('--decidix només s\'accepta en un terminal interactiu del Mestre');
      process.stdout.write(`Per a decidir la proposta ${opcio('id')}, escriu «${FRASE_HUMANA}»: `);
      const buf = Buffer.alloc(256); const n = fs.readSync(0, buf, 0, buf.length, null);
      return buf.subarray(0, n).toString('utf8').trim() === FRASE_HUMANA;
    };
    const e = decidix(arrel, { id: opcio('id'), estat: opcio('estat'), per: opcio('per'), data: opcio('data'), motiu: opcio('motiu'), confirmacioHumana });
    process.stdout.write(`Proposta ${e.id}: ${e.estat} pel ${e.per} (${e.data}).\n`); return 0;
  }
  const llista = estat(llegix(arrel));
  if (argv.includes('--json')) process.stdout.write(`${JSON.stringify(llista, null, 2)}\n`);
  else if (!llista.length) process.stdout.write('La incubadora és buida.\n');
  else for (const p of llista) process.stdout.write(`${p.estat.padEnd(9)} ${p.id} · ${p.skill} · ${p.motiu}\n`);
  return 0;
}

const principal = (() => { try { return process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; } })();
if (principal) { try { process.exitCode = main(process.argv.slice(2)); } catch (e) { process.stderr.write(`incubadora: ${e.message}\n`); process.exitCode = 1; } }
