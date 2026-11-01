// @vitest-environment node
/* P1-13 (C11-03; pla 261101_1246, T7) · L'ordre dels panys consultius de les
   organitzacions, sobre la definició VIGENT de cada funció (l'última migració
   que la crea). 2610281730 posa el pany del parell (sdp-orgmem) a
   desa_membre_organitzacio i 2610311500 hi afig el de l'organització
   (sdp-orgowner) abans de llegir l'autoritat; transfereix_propietat i
   lleva_membre prenen sdp-orgowner. Si una funció prenguera sdp-orgmem abans
   que sdp-orgowner, dues sessions es podrien esperar l'una a l'altra
   (interbloqueig): esta guarda estàtica ho fixa. La prova amb dues sessions en
   PostgreSQL real continua sent del Mestre (supabase/README.md). */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const MIGRACIONS = path.join(process.cwd(), 'supabase/migrations');
const FITXERS = readdirSync(MIGRACIONS).filter((nom) => /^\d{10}_.+\.sql$/.test(nom)).sort();
const OWNER = "'sdp-orgowner:'";
const MEM = "'sdp-orgmem:'";

/** La definició vigent d'una funció: el cos de l'última migració que la crea. */
function vigent(nom) {
  const patro = new RegExp(`create or replace function ${nom.replace('.', '\\.')}\\s*\\(`, 'i');
  let trobada = null;
  for (const fitxer of FITXERS) {
    const sql = readFileSync(path.join(MIGRACIONS, fitxer), 'utf8');
    const inici = sql.search(patro);
    if (inici < 0) continue;
    const obri = sql.indexOf('$$', inici);
    const tanca = sql.indexOf('$$', obri + 2);
    trobada = { fitxer, cos: sql.slice(obri + 2, tanca).replace(/--.*$/gm, '') };
  }
  return trobada;
}

describe('l’ordre dels panys de les organitzacions (sense interbloqueigs)', () => {
  test('desa_membre_organitzacio: sdp-orgowner abans de llegir l’autoritat i abans de sdp-orgmem', () => {
    const { fitxer, cos } = vigent('public.desa_membre_organitzacio');
    expect(fitxer >= '2610311500').toBe(true);
    const owner = cos.indexOf(OWNER);
    const mem = cos.indexOf(MEM);
    expect(owner).toBeGreaterThan(-1);
    expect(mem).toBeGreaterThan(owner);
    expect(cos.indexOf('private.can_manage_organization')).toBeGreaterThan(owner);
    /* Un sol pany de cada mena: cap segon sdp-orgowner després del del parell. */
    expect(cos.lastIndexOf(OWNER)).toBe(owner);
    expect(cos.indexOf(OWNER, mem)).toBe(-1);
  });

  test.each(['public.transfereix_propietat_organitzacio', 'public.lleva_membre_organitzacio'])('%s: sdp-orgowner, i cap sdp-orgmem abans', (nom) => {
    const { cos } = vigent(nom);
    const owner = cos.indexOf(OWNER);
    expect(owner).toBeGreaterThan(-1);
    const mem = cos.indexOf(MEM);
    expect(mem === -1 || mem > owner).toBe(true);
  });

  test('cap migració vigent pren sdp-orgmem abans que sdp-orgowner dins d’una mateixa funció', () => {
    for (const nom of ['public.desa_membre_organitzacio', 'public.transfereix_propietat_organitzacio', 'public.lleva_membre_organitzacio']) {
      const { cos } = vigent(nom);
      const mem = cos.indexOf(MEM);
      if (mem >= 0) expect(cos.slice(0, mem).includes(OWNER), nom).toBe(true);
    }
  });

  test('la sonda: un cos amb els panys girats fa caure el detector', () => {
    const girat = `perform pg_advisory_xact_lock(hashtextextended(${MEM} || x, 0)); perform pg_advisory_xact_lock(hashtextextended(${OWNER} || y, 0));`;
    const mem = girat.indexOf(MEM);
    expect(girat.slice(0, mem).includes(OWNER)).toBe(false);
  });
});
