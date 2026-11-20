import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { desaDenunciaEnCuaLocal } from '../../../components/universal/i18nDenunciaContingut.js';
import { setVal } from '../../../config/storage.js';
import {
  CODIS_IDIOMA_SAFATA_LSSI,
  DICCIONARI_SAFATA_LSSI,
  textosSafataLssi
} from './i18nSafataDenunciesDiligents.js';
import {
  aplicaRevisioDenunciaDiligent,
  coaccionaFilaSafataRemota
} from './serveiSafataDenunciesDiligents.js';
import { SafataDenunciesDiligentsAdmin } from './SafataDenunciesDiligentsAdmin.jsx';

const TENANT = '0b6d6f9e-6c1f-4b8e-9a51-2f6c1d7e8a90';
const CONFIG_REMOT = {
  backendId: 'supabase',
  dataMode: 'remote',
  supabaseUrl: 'https://socdepoble.supabase.co',
  supabaseAnonKey: 'anon-test-key',
  tenantId: TENANT
};

const ID_DENUNCIA = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const ID_PUB = '11111111-2222-4333-8444-555555555555';

describe('Onada R32.17 · Lot 02 (D-R32.15-2) · Safata d’administració LSSI i ampliacions', () => {
  beforeEach(() => {
    if (!globalThis.crypto?.randomUUID) {
      Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
    }
    setVal('moderacio:cua_denuncies_lssi_v1', []);
  });

  afterEach(() => {
    cleanup();
    setVal('moderacio:cua_denuncies_lssi_v1', []);
  });

  test('paritat 100 % en 5 llengües, Llei 32, zero taules P0-128 i zero literals prohibits de lssi antic en JSX', () => {
    const jsxSrc = readFileSync(
      resolve(process.cwd(), 'src/sections/profile/admin/SafataDenunciesDiligentsAdmin.jsx'),
      'utf8'
    );
    expect(jsxSrc).not.toMatch(/registraDenunciaPublica|adminSafataDenuncies|adminRevisaDenuncia|supabase\/lssi/);
    expect(jsxSrc).not.toMatch(/<table\b/i);

    const cssSrc = readFileSync(resolve(process.cwd(), 'src/css/diferit-denuncies-lssi.css'), 'utf8');
    expect(cssSrc).not.toContain(':has(');
    expect(cssSrc).toContain('min-block-size: 3rem;');
    expect(cssSrc).toContain('[data-sdp-senior="true"] .sdp-safata-lssi__boto');

    const clausCa = Object.keys(DICCIONARI_SAFATA_LSSI.ca).sort();
    for (const lang of CODIS_IDIOMA_SAFATA_LSSI) {
      const tx = textosSafataLssi(lang);
      expect(Object.keys(tx).sort()).toEqual(clausCa);
      const tot = Object.values(tx).join(' ');
      expect(tot).toContain('Sóc de Poble');
      expect(tot).not.toMatch(/sobir[aà]|soberan|sovereign|burujabe/i);
      expect(tot).not.toMatch(/servidor del poble|servidor del pueblo/i);
    }
  });

  test('coacciona primitivament el DTO remot sense spread JSONB insegur i preserva ampliacions i recompte', () => {
    const ambPrototipMalicios = Object.create(null);
    ambPrototipMalicios.id = ID_DENUNCIA;
    ambPrototipMalicios.publicacioId = ID_PUB;
    ambPrototipMalicios.motiu = 'spam_frau';
    ambPrototipMalicios.detall = '[LSSI-16:suplantacio] Compte falsificat al mur';
    ambPrototipMalicios.estat = 'rebuda';
    ambPrototipMalicios.versio = 2;
    ambPrototipMalicios.recompte = 3;
    ambPrototipMalicios.creatAl = '2026-11-19T20:00:00Z';
    ambPrototipMalicios.ampliacions = [
      { detall: 'Segon testimoni veïnal', creatAl: '2026-11-19T20:15:00Z', injectat: 'ignora' }
    ];
    ambPrototipMalicios.campAliens = { perill: true };

    const neta = coaccionaFilaSafataRemota(ambPrototipMalicios);
    expect(neta).toEqual({
      id: ID_DENUNCIA,
      publicacioId: ID_PUB,
      motiu: 'spam_frau',
      submotiuLssi: 'suplantacio',
      detall: 'Compte falsificat al mur',
      detallCru: '[LSSI-16:suplantacio] Compte falsificat al mur',
      estat: 'rebuda',
      versio: 2,
      creatAl: '2026-11-19T20:00:00Z',
      recompte: 3,
      ampliacions: [{ detall: 'Segon testimoni veïnal', creatAl: '2026-11-19T20:15:00Z' }]
    });
    expect(Object.hasOwn(neta, 'campAliens')).toBe(false);
    expect(Object.hasOwn(neta.ampliacions[0], 'injectat')).toBe(false);
  });

  test('mode sense capacitat remota: informa honestament i mostra els avisos pendents de la cua local', async () => {
    desaDenunciaEnCuaLocal({
      tipus: 'publicacio',
      recursId: ID_PUB,
      titol: 'Anunci sospitós',
      motiu: 'spam',
      detall: 'Enllaç fraudulent repetit',
      estatSincronitzacio: 'cua-local',
      operacioId: '99999999-8888-4777-8666-555555555555'
    });

    const portLocal = {
      teCapacitat: () => false,
      llistaDenunciesDiligents: vi.fn(),
      revisaDenunciaDiligent: vi.fn()
    };

    render(<SafataDenunciesDiligentsAdmin idioma="ca" config={{ dataMode: 'local' }} port={portLocal} />);

    expect(await screen.findByTestId('avis-safata-lssi-mode-local')).toBeTruthy();
    expect(screen.getByTestId('bloc-cua-local-denuncies').textContent).toContain('Anunci sospitós');
    expect(portLocal.llistaDenunciesDiligents).not.toHaveBeenCalled();
  });

  test('filtra estats, exigeix justificació motivada accessible i reutilitza el mateix operacioId UUID en reintents', async () => {
    const cridesLlista = [];
    const cridesRevisa = [];
    let fallarPrimerCop = true;

    const portRemot = {
      teCapacitat: (cap) => cap === 'denunciesDiligents',
      llistaDenunciesDiligents: vi.fn(async ({ estat }) => {
        cridesLlista.push(estat);
        if (estat === 'rebuda') {
          return [
            {
              id: ID_DENUNCIA,
              publicacioId: ID_PUB,
              motiu: 'ofensiu',
              detall: '[LSSI-16:assetjament] Insults reiterats',
              estat: 'rebuda',
              versio: 1,
              recompte: 2,
              ampliacions: [{ detall: 'Ampliació veïnal addicional', creatAl: '2026-11-19T21:00:00Z' }]
            }
          ];
        }
        return [];
      }),
      revisaDenunciaDiligent: vi.fn(async (payload) => {
        cridesRevisa.push(payload);
        if (fallarPrimerCop) {
          fallarPrimerCop = false;
          throw new Error('Tall puntual de xarxa');
        }
        return {
          id: payload.id,
          estat: payload.estat,
          versio: payload.versio + 1,
          repetida: false
        };
      })
    };

    render(<SafataDenunciesDiligentsAdmin idioma="ca" config={CONFIG_REMOT} port={portRemot} />);

    const fitxa = await screen.findByTestId(`fitxa-denuncia-lssi-${ID_DENUNCIA}`);
    expect(fitxa.textContent).toContain('v1');
    expect(fitxa.textContent).toContain('Ampliació veïnal addicional');
    expect(screen.queryByRole('table')).toBeNull();

    const textarea = fitxa.querySelector('textarea');
    expect(textarea.getAttribute('aria-invalid')).toBe('false');

    // Sense justificació: bloqueja enviament, marca aria-invalid="true" i enfoca el camp
    fireEvent.click(screen.getByTestId(`accio-lssi-${ID_DENUNCIA}-en_revisio`));
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(cridesRevisa).toHaveLength(0);

    // En escriure, es neteja aria-invalid="false"
    fireEvent.change(textarea, {
      target: { value: 'S’inicia revisió cautelar després de verificar els dos avisos rebuts.' }
    });
    expect(textarea.getAttribute('aria-invalid')).toBe('false');

    // 1r intent falla per xarxa; 2n intent amb el mateix text reutilitza EXACTAMENT el mateix operacioId UUID!
    fireEvent.click(screen.getByTestId(`accio-lssi-${ID_DENUNCIA}-en_revisio`));
    await waitFor(() => expect(cridesRevisa).toHaveLength(1));

    fireEvent.click(screen.getByTestId(`accio-lssi-${ID_DENUNCIA}-en_revisio`));
    await waitFor(() => expect(cridesRevisa).toHaveLength(2));

    expect(cridesRevisa[0].operacioId).toMatch(/^[0-9a-f-]{36}$/);
    expect(cridesRevisa[1].operacioId).toBe(cridesRevisa[0].operacioId);
    expect(cridesRevisa[1]).toMatchObject({
      id: ID_DENUNCIA,
      estatEsperat: 'rebuda',
      versio: 1,
      estat: 'en_revisio'
    });

    // Canvi de filtre a 'retirada' consulta 'ocultacio_cautelar' i 'resolta'
    fireEvent.click(screen.getByTestId('filtre-safata-lssi-retirada'));
    await waitFor(() => {
      expect(cridesLlista).toContain('ocultacio_cautelar');
      expect(cridesLlista).toContain('resolta');
    });

    // Verificació directa d'aplicaRevisioDenunciaDiligent per a transició invàlida
    await expect(
      aplicaRevisioDenunciaDiligent(
        {
          id: ID_DENUNCIA,
          estatEsperat: 'rebuda',
          versio: 1,
          estat: 'resolta',
          justificacio: 'Salt directe no permés pel contracte',
          config: CONFIG_REMOT
        },
        portRemot
      )
    ).rejects.toMatchObject({ code: 'TRANSICIO_INVALIDA' });
  });
});
