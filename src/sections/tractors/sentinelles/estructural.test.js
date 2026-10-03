// @vitest-environment node
/* Sentinella 1 · Estructural, amb instantànies sintètiques: UUID inventats,
   cap persona real. Casos que disparen i casos que no. */
import { describe, expect, test } from 'vitest';
import { SENTINELLA_ESTRUCTURAL, observaEstructural } from './estructural.js';

const ARA = Date.UTC(2026, 9, 2, 8);
const UID = '11111111-2222-4333-8444-555555555555';
const POBLE = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const ALTRE_POBLE = 'ffffffff-bbbb-4ccc-8ddd-eeeeeeeeeeee';

function bona(canvis = {}) {
  return {
    sessio: { user: { id: UID }, expires_at: Math.floor(ARA / 1000) + 3600 },
    perfil: { id: UID, full_name: 'Veí de Prova', visibility: 'private', consentiment_rgpd_at: '2026-09-01T10:00:00Z', baixa_demanada_at: null },
    pertinences: [{ town_id: POBLE, user_id: UID, role: 'member' }],
    pobles: [{ id: POBLE, is_open: true }],
    tenantId: POBLE,
    ...canvis
  };
}
const codis = (eixida) => eixida.avisos.map((a) => a.codi);
const observa = (entrada) => observaEstructural(entrada, { ara: ARA });

describe('una connexió bona', () => {
  test('cap bandera i cap reparació proposada', () => {
    const eixida = observa(bona());
    expect(eixida.avisos).toEqual([]);
    expect(eixida.informe).toMatch(/Cap reparació necessària/);
  });

  test('sense sessió és una visita: només informa', () => {
    expect(observa({ sessio: null }).avisos).toEqual([expect.objectContaining({ codi: 'EST-SENSE-SESSIO', severitat: 'info' })]);
    expect(codis(observa(undefined))).toEqual(['EST-SENSE-SESSIO']);
  });
});

describe('el que dispara', () => {
  test('sense perfil: roja i proposa completa_la_meua_alta amb el poble de la configuració', () => {
    const eixida = observa(bona({ perfil: null }));
    const avis = eixida.avisos.find((a) => a.codi === 'EST-SENSE-PERFIL');
    expect(avis).toMatchObject({ severitat: 'roja', font: 'perfil' });
    expect(avis.missatge).toContain(`completa_la_meua_alta('${POBLE}')`);
    expect(eixida.informe).toMatch(/la fa la persona des de l’app; el sentinella no la fa/);
  });

  test('sense pertinença: roja; sense tenant, la reparació va sense argument', () => {
    const eixida = observa(bona({ pertinences: [], tenantId: null }));
    const avis = eixida.avisos.find((a) => a.codi === 'EST-SENSE-POBLE');
    expect(avis.severitat).toBe('roja');
    expect(avis.missatge).toContain('completa_la_meua_alta()');
  });

  test('el poble de la configuració no és cap dels seus: groga', () => {
    expect(codis(observa(bona({ tenantId: ALTRE_POBLE })))).toEqual(['EST-POBLE-CONFIG']);
  });

  test('un tenant que no és UUID: roja, i no es proposa amb ell', () => {
    const eixida = observa(bona({ tenantId: 'tenant-A', pertinences: [] }));
    expect(codis(eixida)).toEqual(['EST-TENANT-INVALID', 'EST-SENSE-POBLE']);
    expect(eixida.avisos[1].missatge).toContain('completa_la_meua_alta()');
  });

  test('perfil d’altri, nom buit, visibilitat pública, sense consentiment i baixa demanada', () => {
    const eixida = observa(bona({
      perfil: { id: ALTRE_POBLE, full_name: '   ', visibility: 'public', consentiment_rgpd_at: null, baixa_demanada_at: '2026-09-30T10:00:00Z' }
    }));
    expect(codis(eixida)).toEqual(['EST-PERFIL-ALIE', 'EST-NOM-INVALID', 'EST-VISIBILITAT', 'EST-SENSE-CONSENTIMENT', 'EST-BAIXA']);
    expect(eixida.avisos.map((a) => a.severitat)).toEqual(['roja', 'groga', 'roja', 'groga', 'info']);
  });

  test('un nom de 121 caràcters també és invàlid; el de 120, no', () => {
    expect(codis(observa(bona({ perfil: { ...bona().perfil, full_name: 'x'.repeat(121) } })))).toEqual(['EST-NOM-INVALID']);
    expect(codis(observa(bona({ perfil: { ...bona().perfil, full_name: 'x'.repeat(120) } })))).toEqual([]);
  });

  test('sessió caducada (segons o ISO) i usuari sense UUID', () => {
    expect(codis(observa(bona({ sessio: { user: { id: UID }, expires_at: Math.floor(ARA / 1000) - 1 } })))).toEqual(['EST-SESSIO-CADUCADA']);
    expect(codis(observa(bona({ sessio: { user: { id: UID }, expires_at: '2026-10-01T00:00:00Z' } })))).toEqual(['EST-SESSIO-CADUCADA']);
    const sensUuid = observa(bona({ sessio: { user: { id: 'u1' } } }));
    expect(codis(sensUuid)).toContain('EST-USUARI-INVALID');
  });

  test('pertinences d’altri, repetides, sense rol i en un poble tancat', () => {
    const eixida = observa(bona({
      pertinences: [
        { town_id: POBLE, user_id: UID, role: 'member' },
        { town_id: POBLE, user_id: UID, role: '' },
        { town_id: ALTRE_POBLE, user_id: ALTRE_POBLE, role: 'member' }
      ],
      pobles: [{ id: POBLE, is_open: false }]
    }));
    expect(codis(eixida)).toEqual(['EST-PERTINENCA-ALIENA', 'EST-PERTINENCA-REPETIDA', 'EST-ROL-BUIT', 'EST-POBLE-TANCAT']);
  });

  test('el poble de la configuració està tancat: no proposa unir-la amb ell, avisa i proposa la crida sense poble', () => {
    const eixida = observa(bona({ pertinences: [], pobles: [{ id: POBLE, is_open: false }] }));
    expect(codis(eixida)).toEqual(['EST-POBLE-CONFIG-TANCAT', 'EST-SENSE-POBLE']);
    expect(eixida.avisos[0].missatge).toMatch(/tancat/);
    expect(eixida.avisos[0].missatge).toMatch(/reobrir/);
    const sensePoble = eixida.avisos[1].missatge;
    expect(sensePoble).not.toContain(`completa_la_meua_alta('${POBLE}')`);
    expect(sensePoble).toContain('completa_la_meua_alta()');
    expect(sensePoble).toMatch(/poble per defecte/);
    const reparacio = eixida.informe.split('\n').find((l) => l.startsWith('Reparació proposada'));
    expect(reparacio).toContain('completa_la_meua_alta()');
    expect(reparacio).not.toContain(POBLE);
  });

  test('amb un poble tancat a la configuració i pertinences en altres, no proposa cap crida per a eixe poble', () => {
    const eixida = observa(bona({
      tenantId: ALTRE_POBLE, pobles: [{ id: POBLE, is_open: true }, { id: ALTRE_POBLE, is_open: false }]
    }));
    expect(codis(eixida)).toEqual(['EST-POBLE-CONFIG-TANCAT']);
    expect(eixida.informe).toMatch(/Cap reparació necessària/);
  });

  test('sense perfil i amb el poble de la configuració tancat, la reparació va sense poble', () => {
    const eixida = observa(bona({ perfil: null, pertinences: [], pobles: [{ id: POBLE, is_open: false }] }));
    expect(eixida.avisos.find((a) => a.codi === 'EST-SENSE-PERFIL').missatge).toContain('completa_la_meua_alta()');
  });

  test('una incidència d’alta pendent: groga amb el seu codi', () => {
    const eixida = observa(bona({ incidenciaAlta: { codi: 'SDP-REG-001' } }));
    expect(eixida.avisos).toEqual([expect.objectContaining({ codi: 'EST-INCIDENCIA-ALTA', severitat: 'groga' })]);
    expect(eixida.avisos[0].missatge).toContain('SDP-REG-001');
  });
});

describe('l’entrada', () => {
  test('prepara llig un JSON triat; un JSON il·legible és ENTRADA_INVALIDA', () => {
    const { prepara } = SENTINELLA_ESTRUCTURAL.entrada;
    const bytes = new TextEncoder().encode(JSON.stringify(bona()));
    expect(prepara([{ nom: 'connexio.json', bytes }])).toEqual(bona());
    expect(() => prepara([{ nom: 'trencat.json', text: '{ no' }])).toThrow(expect.objectContaining({ codi: 'ENTRADA_INVALIDA' }));
    expect(() => prepara([])).toThrow(/Tria almenys un fitxer/);
  });
});
