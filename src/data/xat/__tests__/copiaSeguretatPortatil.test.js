import { describe, expect, it } from 'vitest';
import {
  CODI_CLAU_FEBLE,
  CODI_CLAU_INCORRECTA,
  CODI_COPIA_CORRUPTA,
  CODI_IDENTITAT_DIVERGENT,
  CODI_QR_INVALID,
  ESQUEMA_SDP_BACKUP,
  VERSIO_SDP_BACKUP,
  creaComprovadorSas,
  creaOfertaTraspasLocalQr,
  creaRespostaTraspasLocalQr,
  derivaSasTraspasLocalQr,
  exportaCopiaSeguretatXat,
  generaParellaEfimeraTraspas,
  importaCopiaSeguretatXat,
  validaOfertaTraspasLocalQr,
} from '../copiaSeguretatPortatil.js';

/* Contracte v2 (Onada R26). Respecte del kit R25.2: els MIME de les proves són
   els del xat (MIME_XAT), la incremental parteix del rebut de la base (la seq
   és de cada fil) i el SAS naix dels dos extrems. Cap assertió s'ha afluixat;
   les negatives comproven també el `motiu`, perquè no passen per una altra causa. */

const FILS_DEMO = [
  { id: 'fil-1', titol: 'Forn de Dalt' },
  { id: 'fil-2', titol: 'Comunitat de Regants' },
];

/* Ronda 2 R26: els missatges tenen la forma del DTO real (`text`, no la
   columna crua `cos`, que la llista blanca rebutja) i els adjunts són del tipus
   que declaren (abans, un PNG amb MIME image/webp i un PDF amb audio/ogg: la
   màgia positiva els rebutja). Cap assertió canvia. */
const MISSATGES_DEMO = [
  { id: 'm-1', filId: 'fil-1', seq: 1, text: 'Bon dia, guardeu-me una fogassa!', createdAt: '2026-11-10T08:00:00.000Z' },
  { id: 'm-2', filId: 'fil-1', seq: 2, text: 'Fet, passa a les 11 h.', createdAt: '2026-11-12T10:30:00.000Z' },
  { id: 'm-3', filId: 'fil-2', seq: 3, text: 'Demà toca tanda a l’horta.', createdAt: '2026-11-14T16:00:00.000Z' },
];

const ADJUNTS_DEMO = [
  { id: 'adj-1', missatgeId: 'm-2', mime: 'image/webp', nom: 'tiquet.webp', dadesBase64: 'UklGRhoAAABXRUJQVlA4IA4AAAAwAQCdASoBAA==' },
  { id: 'adj-2', missatgeId: 'm-3', mime: 'audio/ogg', nom: 'torn.ogg', dadesBase64: 'T2dnUwACAAAAAAAAAAAqAAAA' },
];

const CONTRASENYA_FORTA = 'olivera-centenaria-2026!';
const EMPREMTA_A = Array.from({ length: 32 }, (_, i) => (i + 16).toString(16).toUpperCase()).join(':');
const EMPREMTA_B = Array.from({ length: 32 }, (_, i) => (i + 160).toString(16).toUpperCase()).join(':');
const sdp = (ip, empremta) => `v=0\r\no=- 123 2 IN IP4 ${ip}\r\na=fingerprint:sha-256 ${empremta}\r\n`;

describe('copiaSeguretatPortatil (.sdpbackup · IDEA-267)', () => {
  it('exporta i restaura amb AES-256-GCM + PBKDF2-SHA256 (>=600.000 iteracions), finsAlDia i mode incremental', async () => {
    // 1. Còpia amb tall finsAlDia = 2026-11-12 (exclou m-3 i adj-2 del dia 14)
    const arxiuTall = await exportaCopiaSeguretatXat({
      usuariId: 'usr-javi',
      tenantId: 'la-torre-de-les-macanes',
      fils: FILS_DEMO,
      missatges: MISSATGES_DEMO,
      adjunts: ADJUNTS_DEMO,
      contrasenya: CONTRASENYA_FORTA,
      finsAlDia: '2026-11-12',
    });

    expect(arxiuTall).not.toContain('fogassa'); // xifrat real: zero text pla exposat
    expect(arxiuTall).not.toContain('fil-1'); // els cursors i els ids també van dins de l'AEAD
    const sobre = JSON.parse(arxiuTall);
    expect(sobre.esquema).toBe(ESQUEMA_SDP_BACKUP);
    expect(sobre.versio).toBe(VERSIO_SDP_BACKUP);
    expect(sobre.capcalera.kdf.iteracions).toBeGreaterThanOrEqual(600000);

    const estatRestaurat = [];
    const res1 = await importaCopiaSeguretatXat(arxiuTall, {
      usuariIdEsperat: 'usr-javi',
      tenantIdEsperat: 'la-torre-de-les-macanes',
      contrasenya: CONTRASENYA_FORTA,
      aplicaImportacio: async (lot) => {
        estatRestaurat.push(...lot.missatges);
      },
    });

    expect(res1.manifest.mode).toBe('complet');
    expect(res1.autenticada).toBe(true);
    expect(res1.missatges.map((m) => m.id)).toEqual(['m-1', 'm-2']);
    expect(res1.adjunts.map((a) => a.id)).toEqual(['adj-1']);
    expect(estatRestaurat).toHaveLength(2);
    expect(res1.rebut.ultimSeqPerFil).toEqual({ 'fil-1': 2 });

    // 2. Còpia incremental sobre la base (cursors per fil: fil-1 des de 2) -> només m-3, fil-2 i adj-2
    const arxiuIncremental = await exportaCopiaSeguretatXat({
      usuariId: 'usr-javi',
      tenantId: 'la-torre-de-les-macanes',
      fils: FILS_DEMO,
      missatges: MISSATGES_DEMO,
      adjunts: ADJUNTS_DEMO,
      contrasenya: CONTRASENYA_FORTA,
      base: res1.rebut,
    });

    const resInc = await importaCopiaSeguretatXat(arxiuIncremental, {
      usuariIdEsperat: 'usr-javi',
      tenantIdEsperat: 'la-torre-de-les-macanes',
      contrasenya: CONTRASENYA_FORTA,
      estatLocal: { copies: new Map([[res1.rebut.backupId, res1.rebut]]) },
    });

    expect(resInc.manifest.mode).toBe('incremental');
    expect(resInc.manifest.baseId).toBe(res1.rebut.backupId);
    expect(resInc.fils.map((f) => f.id)).toEqual(['fil-2']);
    expect(resInc.missatges.map((m) => m.id)).toEqual(['m-3']);
    expect(resInc.adjunts.map((a) => a.id)).toEqual(['adj-2']);
  });

  it('rebutja ATÒMICAMENT arxius amb clau feble/errònia, identitat divergent o adjunts/lots manipulats sense mutar res', async () => {
    await expect(
      exportaCopiaSeguretatXat({
        usuariId: 'usr-javi',
        tenantId: 'la-torre',
        contrasenya: 'curta',
      }),
    ).rejects.toMatchObject({ codi: CODI_CLAU_FEBLE, motiu: 'contrasenya-curta' });

    const arxiuValid = await exportaCopiaSeguretatXat({
      usuariId: 'usr-javi',
      tenantId: 'la-torre',
      fils: FILS_DEMO,
      missatges: MISSATGES_DEMO,
      adjunts: ADJUNTS_DEMO,
      contrasenya: CONTRASENYA_FORTA,
    });

    let mutacions = 0;
    const espiaMutacio = async () => {
      mutacions += 1;
    };

    // Clau errònia
    await expect(
      importaCopiaSeguretatXat(arxiuValid, {
        usuariIdEsperat: 'usr-javi',
        tenantIdEsperat: 'la-torre',
        contrasenya: 'una-altra-clau-diferent-999',
        aplicaImportacio: espiaMutacio,
      }),
    ).rejects.toMatchObject({ codi: CODI_CLAU_INCORRECTA, motiu: 'aead' });

    // Altre usuari o poble (bloquejat per la capçalera i per l'AAD GCM)
    await expect(
      importaCopiaSeguretatXat(arxiuValid, {
        usuariIdEsperat: 'usr-intrus',
        tenantIdEsperat: 'la-torre',
        contrasenya: CONTRASENYA_FORTA,
        aplicaImportacio: espiaMutacio,
      }),
    ).rejects.toMatchObject({ codi: CODI_IDENTITAT_DIVERGENT, motiu: 'ambit' });

    // Xifrat truncat o alterat
    const objManipulat = JSON.parse(arxiuValid);
    objManipulat.xifrat = `${objManipulat.xifrat.startsWith('AAAA') ? 'BBBB' : 'AAAA'}${objManipulat.xifrat.slice(4)}`;
    await expect(
      importaCopiaSeguretatXat(JSON.stringify(objManipulat), {
        usuariIdEsperat: 'usr-javi',
        tenantIdEsperat: 'la-torre',
        contrasenya: CONTRASENYA_FORTA,
        aplicaImportacio: espiaMutacio,
      }),
    ).rejects.toMatchObject({ codi: CODI_CLAU_INCORRECTA, motiu: 'aead' });

    // Corrupció interna en mode de prova sense xifrar (adjunt truncat respecte al manifest)
    const arxiuPlaProva = await exportaCopiaSeguretatXat({
      usuariId: 'usr-javi',
      tenantId: 'la-torre',
      fils: FILS_DEMO,
      missatges: MISSATGES_DEMO,
      adjunts: ADJUNTS_DEMO,
      permetSenseXifrar: true,
    });
    const plaCorrupte = JSON.parse(arxiuPlaProva);
    plaCorrupte.pla.dades.adjunts[0].dadesBase64 = 'dHJ1bmNhdA==';

    await expect(
      importaCopiaSeguretatXat(JSON.stringify(plaCorrupte), {
        usuariIdEsperat: 'usr-javi',
        tenantIdEsperat: 'la-torre',
        permetSenseXifrar: true,
        aplicaImportacio: espiaMutacio,
      }),
    ).rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'adjunt-truncat' });

    expect(mutacions).toBe(0);
  });

  it('valida l’emparellament efímer per QR LAN P2P (Mòbil Nou i Tauleta Espill) amb SAS de 6 dígits dels dos extrems i expiració <= 5 minuts', async () => {
    const ara = 1_790_000_000_000;
    const tauleta = await generaParellaEfimeraTraspas();
    const mobil = await generaParellaEfimeraTraspas();
    const oferta = await creaOfertaTraspasLocalQr({
      modeDispositiu: 'tauleta_espill_casa',
      usuariId: 'usr-javi',
      tenantId: 'la-torre',
      sdpOffer: sdp('192.168.1.44', EMPREMTA_A),
      clauPublicaEfimeraJwk: tauleta.clauPublicaJwk,
      araMs: ara,
    });
    expect(oferta).not.toHaveProperty('codiVerificacioSas'); // un SAS d'un sol extrem no autentica res

    const validat = await validaOfertaTraspasLocalQr(JSON.stringify(oferta), {
      usuariIdEsperat: 'usr-javi',
      tenantIdEsperat: 'la-torre',
      araMs: ara + 60_000,
      sessionsConsumides: new Set(),
    });
    expect(validat.ok).toBe(true);

    // SAS de 6 dígits, igual als dos aparells
    const consumMobil = new Set();
    const resposta = await creaRespostaTraspasLocalQr(oferta, {
      usuariId: 'usr-javi',
      tenantId: 'la-torre',
      sdpAnswer: sdp('192.168.1.45', EMPREMTA_B),
      clauPublicaEfimeraJwk: mobil.clauPublicaJwk,
      araMs: ara + 61_000,
      sessionsConsumides: consumMobil,
    });
    const sasTauleta = await derivaSasTraspasLocalQr({ oferta, resposta, clauPrivadaEfimera: tauleta.clauPrivada, rol: 'oferent', araMs: ara + 62_000, sessionsConsumides: new Set() });
    const sasMobil = await derivaSasTraspasLocalQr({ oferta, resposta, clauPrivadaEfimera: mobil.clauPrivada, rol: 'responent', araMs: ara + 62_000 });
    expect(sasTauleta.codiVerificacioSas).toMatch(/^\d{6}$/);
    expect(sasMobil.codiVerificacioSas).toBe(sasTauleta.codiVerificacioSas);
    expect(creaComprovadorSas({ codiVerificacioSas: sasTauleta.codiVerificacioSas }).comprova(sasMobil.codiVerificacioSas)).toBe(true);

    // Caducat passats més de 5 minuts (registre nou: ha de fallar per caducitat, no per consum)
    await expect(
      validaOfertaTraspasLocalQr(oferta, {
        usuariIdEsperat: 'usr-javi',
        tenantIdEsperat: 'la-torre',
        araMs: ara + 301_000,
        sessionsConsumides: new Set(),
      }),
    ).rejects.toMatchObject({ codi: CODI_QR_INVALID, motiu: 'caducat' });

    // Manipulació del SDP -> bloquejat per l'empremta del QR
    await expect(
      validaOfertaTraspasLocalQr(
        { ...oferta, sdpOffer: sdp('10.6.6.6', EMPREMTA_A) },
        { usuariIdEsperat: 'usr-javi', tenantIdEsperat: 'la-torre', araMs: ara + 10_000, sessionsConsumides: new Set() },
      ),
    ).rejects.toMatchObject({ codi: CODI_QR_INVALID, motiu: 'empremta' });

    // Consum únic anti-replay (sessionsConsumides) i sostre anti-DoS PBKDF2 > 10.000.000
    const consumides = new Set();
    await expect(
      validaOfertaTraspasLocalQr(oferta, {
        usuariIdEsperat: 'usr-javi',
        tenantIdEsperat: 'la-torre',
        araMs: ara + 20_000,
        sessionsConsumides: consumides,
      }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      validaOfertaTraspasLocalQr(oferta, {
        usuariIdEsperat: 'usr-javi',
        tenantIdEsperat: 'la-torre',
        araMs: ara + 21_000,
        sessionsConsumides: consumides,
      }),
    ).rejects.toMatchObject({ codi: CODI_QR_INVALID, motiu: 'reutilitzat' });

    await expect(
      importaCopiaSeguretatXat(
        JSON.stringify({
          esquema: ESQUEMA_SDP_BACKUP,
          versio: VERSIO_SDP_BACKUP,
          capcalera: {
            backupId: 'AAAAAAAAAAAAAAAAAAAAAA',
            baseId: null,
            baseEmpremta: null,
            mode: 'complet',
            usuariId: 'usr-javi',
            tenantId: 'la-torre',
            creatAt: '2026-11-14T18:00:00.000Z',
            proteccio: 'xifrada',
            kdf: { algoritme: 'PBKDF2-HMAC-SHA256', iteracions: 99_999_999, sal: 'AAAAAAAAAAAAAAAAAAAAAA' },
            aead: { algoritme: 'AES-256-GCM', etiquetaBits: 128, iv: 'AAAAAAAAAAAAAAAA' },
          },
          xifrat: 'AAAAAAAAAAAAAAAAAAAAAAAA',
        }),
        { usuariIdEsperat: 'usr-javi', tenantIdEsperat: 'la-torre', contrasenya: CONTRASENYA_FORTA },
      ),
    ).rejects.toMatchObject({ codi: CODI_CLAU_FEBLE, motiu: 'kdf-fora-de-rang' });
  });
});
