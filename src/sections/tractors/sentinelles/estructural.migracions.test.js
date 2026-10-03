// @vitest-environment node
/* Capa estàtica del Sentinella Estructural (candidata al pre-commit): cada
   fet del contracte de la Connexió Universal cita una migració i el text
   exacte que el sosté. Si una migració nova el canvia o el retira, esta prova
   cau i el contracte s'ha de tornar a derivar abans que el sentinella diga
   res fals. Només llig fitxers del repositori. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { CONTRACTE_CONNEXIO } from './estructural.js';

const ARREL = process.cwd();
const espais = (text) => text.replace(/\s+/g, ' ');

describe('el contracte de la Connexió Universal ve de les migracions', () => {
  test('té fets, cada un amb un id únic, una regla i una evidència', () => {
    expect(CONTRACTE_CONNEXIO.fets.length).toBeGreaterThanOrEqual(8);
    expect(new Set(CONTRACTE_CONNEXIO.fets.map((f) => f.id)).size).toBe(CONTRACTE_CONNEXIO.fets.length);
    for (const fet of CONTRACTE_CONNEXIO.fets) {
      expect(fet.regla.length, fet.id).toBeGreaterThan(10);
      expect(fet.evidencia.length, fet.id).toBeGreaterThan(10);
    }
  });

  test.each(CONTRACTE_CONNEXIO.fets.map((fet) => [fet.id, fet]))('%s: la migració existix i porta l’evidència', (_id, fet) => {
    const ruta = path.join(ARREL, fet.fitxer);
    expect(existsSync(ruta), fet.fitxer).toBe(true);
    expect(espais(readFileSync(ruta, 'utf8'))).toContain(espais(fet.evidencia));
  });

  test('la reparació que proposa és la funció que les migracions concedixen a les persones autenticades', () => {
    const fet = CONTRACTE_CONNEXIO.fets.find((f) => f.id === 'reparacio-autenticats');
    expect(fet.evidencia).toContain(`function public.${CONTRACTE_CONNEXIO.reparacio}(`);
  });

  test('el límit del nom és el de la migració', () => {
    const fet = CONTRACTE_CONNEXIO.fets.find((f) => f.id === 'perfil-nom');
    expect(fet.evidencia).toContain(`between 1 and ${CONTRACTE_CONNEXIO.nomMaxim}`);
  });
});
