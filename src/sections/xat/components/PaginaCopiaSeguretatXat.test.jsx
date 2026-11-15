/* Onada R28 (pla 261115_0135, Lot C3) · Les dos pàgines de la còpia
   `.sdpbackup` dels Ajustos del Xat, amb el motor de veres (PBKDF2 de 600.000
   iteracions i AES-256-GCM):
     · Desa, en dos passos: la contrasenya curta o diferent es diu al camp, amb
       el focus, i el motor no corre; la bona només xifra («Prepara la còpia»)
       i el botó del pas 2 («Desa l’arxiu» o, dins de l'app, «Comparteix
       l’arxiu») crida desaArxiu… dins del seu propi clic, abans de cap espera
       (el full de compartir hi té una activació d'usuari emulada); l'arxiu té
       la capçalera de la sessió (descriuCopiaSeguretatXat) i torna a obrir-se
       sencer i sense cap secret; la credencial de la còpia porta un usuari
       propi i new-password; dins de l'app sense full de compartir, o amb un
       full que no admet un arxiu .sdpbackup (canShare, Onada R28 ·
       copia-xat-06), ho diu abans de demanar res; sense cap missatge
       carregat, un avís abans del formulari (copia-xat-03); sense WebCrypto,
       cap formulari (copia-xat-04).
     · Comprova: valida en memòria sense magatzem ni aplicaImportacio i sense
       cap funció de XatContext que escriga, i diu converses, missatges i
       dates; la clau incorrecta, l'arxiu d'un altre compte, el fet malbé o el
       massa gran es diuen al camp que toca.
   Les esperes de la xifra porten 10 s: PBKDF2 pot tardar en una màquina carregada. */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';
import {
  MIME_SDP_BACKUP, desaArxiuCopiaSeguretatXat, descriuCopiaSeguretatXat, exportaCopiaSeguretatXat, importaCopiaSeguretatXat,
} from '../../../data/xat/copiaSeguretatPortatil.js';
import { contingutDeLaCopia } from '../copiaSeguretatXat.js';
import { mapejaFil, mapejaMissatge } from '../missatges.js';
import PaginaCopiaSeguretatXat, { CosCopiaSeguretatXat, MOTOR_COPIA } from './PaginaCopiaSeguretatXat.jsx';

const mocks = vi.hoisted(() => ({ xat: {} }));
vi.mock('../XatContext', () => ({ useXat: () => mocks.xat }));
vi.mock('../../../app/contexts/UIContext', () => ({ useUIState: () => ({ locale: 'ca-ES' }) }));

const ESPERA = { timeout: 10000 };
const JO = '0b6a1f5e-6a2c-4f3e-9d1a-2b3c4d5e6f70';
const ROSA = '1c7b2a6f-7b3d-4a4f-8e2b-3c4d5e6f7081';
const TENANT = '2d8c3b70-8c4e-4b50-9f3c-4d5e6f708192';
const FIL_ROSA = '3e9d4c81-9d5f-4c61-8a4d-5e6f708192a3';
const FIL_GRUP = '4fae5d92-ae60-4d72-9b5e-6f708192a3b4';
const ABAST = Object.freeze({ usuariId: JO, tenantId: TENANT });
const AMBIT = JSON.stringify([`backend:${JSON.stringify(['supabase', 'https://exemple.supabase.co', TENANT, 'remote'])}`, JO, null]);
const CONTRASENYA = 'farcell de la iaia 2026';
const SECRET = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.c2lnbmF0dXJh';

/* La vista de XatContext (mapejaFil, mapejaMissatge), amb un secret enganxat
   al fil i a una bombolla: la còpia no l'ha de portar mai. */
const FILS_DE_LA_VISTA = [
  { ...mapejaFil({ id: FIL_ROSA, tipus: 'directe', altresNoms: ['Rosa'], ultimText: 'Fins demà', ultimSeq: 2 }), accessToken: SECRET },
  mapejaFil({ id: FIL_GRUP, tipus: 'grup', titol: 'Regants de la Torre', ultimSeq: 1 })
];
const MISSATGES_DE_LA_VISTA = {
  [FIL_ROSA]: [
    { ...mapejaMissatge({ id: '5a0b6ea3-0b71-4e83-8c6f-708192a3b4c5', filId: FIL_ROSA, seq: 1, usuariId: JO, text: 'Bon dia, Rosa!', creatAl: '2026-11-10T08:00:00.000Z' }, JO), refreshToken: SECRET },
    mapejaMissatge({ id: '6b1c7fb4-1c82-4f94-9d70-8192a3b4c5d6', filId: FIL_ROSA, seq: 2, usuariId: ROSA, autorNom: 'Rosa', text: 'Fins demà', creatAl: '2026-11-14T10:00:00.000Z' }, JO)
  ],
  [FIL_GRUP]: [
    mapejaMissatge({ id: 'c172d51a-72e8-4ffa-9dd6-e7f8091a2b3c', filId: FIL_GRUP, seq: 1, usuariId: ROSA, autorNom: 'Rosa', text: 'Demà toca tanda', creatAl: '2026-11-12T16:00:00.000Z' }, JO)
  ]
};
const getThreadMessages = (filId) => MISSATGES_DE_LA_VISTA[filId] || [];
const CONTINGUT = contingutDeLaCopia({ chatThreads: FILS_DE_LA_VISTA, getThreadMessages, joNom: 'Javi' });

/* desaArxiuCopiaSeguretatXat de veres, amb un DOM de mentida: la descàrrega per enllaç. */
function desaDeProva(clic = vi.fn()) {
  const desa = vi.fn((text, opcions = {}) => desaArxiuCopiaSeguretatXat(text, {
    finestra: {},
    navegador: {},
    documentDom: { createElement: () => ({ click: clic }) },
    urlApi: { createObjectURL: () => 'blob:prova', revokeObjectURL: () => {} },
    ConstructorBlob: Blob,
    temporitzador: () => {},
    ...opcions
  }));
  return desa;
}

/* Un fitxer triat: el que llegix… necessita (size i arrayBuffer). */
function fitxer(nom, contingut) {
  const bytes = typeof contingut === 'string' ? new TextEncoder().encode(contingut) : contingut;
  return { name: nom, size: bytes.length, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
}

const camp = (etiqueta) => screen.getByLabelText(etiqueta);
const escriu = (etiqueta, valor) => fireEvent.change(camp(etiqueta), { target: { value: valor } });
const regioViva = () => document.querySelector('[aria-live="polite"]:not(.sdp-camp-fitxer__estat)');

afterEach(() => cleanup());

/* El pas 1 amb una contrasenya bona: la còpia queda xifrada i el botó del pas 2, enfocat. */
async function preparaLaCopia(nomBoto = 'Desa l’arxiu') {
  escriu('Contrasenya de la còpia', CONTRASENYA);
  escriu('Repetix la contrasenya', CONTRASENYA);
  fireEvent.click(screen.getByRole('button', { name: 'Prepara la còpia' }));
  const boto = await screen.findByRole('button', { name: nomBoto }, ESPERA);
  await waitFor(() => expect(document.activeElement).toBe(boto));
  return boto;
}

describe('Desa una còpia xifrada', () => {
  test('diu què hi va i quant, abans de demanar res', () => {
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} />);
    /* Onada R28 · copia-xat-05 · Llei 0: el que fa filEntraALaCopia, no el que
       pinta la llista (les converses on participes, també les que la llista
       amaga; cap de visitant). */
    const abast = screen.getByText(/^Hi van totes les converses on participes: també les arxivades, les de dins de les comunitats i les que encara no tenen cap missatge\./).textContent;
    expect(abast).toMatch(/Per això el recompte pot no coincidir amb les files de la llista\./);
    /* Pàgines de 50, les converses sense cap missatge carregat i el que no hi va. */
    expect(abast).toMatch(/De cada conversa hi van només els missatges que este dispositiu ha carregat en esta sessió\./);
    expect(abast).toMatch(/els 50 últims, i 50 més cada vegada que en carregues de més antics/);
    expect(abast).toMatch(/L’app també pot descarregar sola els nous d’algunes converses/);
    expect(abast).toMatch(/normalment, una que no has obert en esta sessió\) hi va sense missatges/);
    expect(abast).toMatch(/No hi van les fotos, els àudios, els vídeos, els missatges que encara no s’han enviat, els esborrats ni els de persones que has bloquejat\./);
    expect(abast).toMatch(/Tampoc no hi van els xats de pàgines que només has llegit, ni els xats de la IAIA si la tens apagada\.$/);
    expect(screen.getByText('Converses: 2 · Missatges: 3')).toBeTruthy();
    /* Totes dues converses tenen missatges: cap recompte de més ni cap avís. */
    expect(screen.queryByText(/^Converses amb missatges carregats/)).toBeNull();
    expect(screen.queryByText(/^Encara no s’ha carregat cap missatge/)).toBeNull();
    expect(screen.getByText(/Almenys 12 caràcters/)).toBeTruthy();
    /* Cap botó de desar abans de preparar la còpia. */
    expect(screen.queryByRole('button', { name: 'Desa l’arxiu' })).toBeNull();
  });

  test('una contrasenya curta es diu al camp, amb el focus, i el motor no corre', () => {
    const motor = { ...MOTOR_COPIA, exporta: vi.fn(), desa: vi.fn() };
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} motor={motor} />);
    escriu('Contrasenya de la còpia', 'curta-11ch');
    escriu('Repetix la contrasenya', 'curta-11ch');
    fireEvent.click(screen.getByRole('button', { name: 'Prepara la còpia' }));
    const control = camp('Contrasenya de la còpia');
    expect(control.getAttribute('aria-invalid')).toBe('true');
    const error = screen.getByText('La contrasenya ha de tindre almenys 12 caràcters.');
    expect(control.getAttribute('aria-describedby').split(' ')).toContain(error.closest('p').id);
    /* Icona i text: mai només el color. */
    expect(error.closest('p').querySelector('svg')).not.toBeNull();
    expect(document.activeElement).toBe(control);
    expect(motor.exporta).not.toHaveBeenCalled();
  });

  test('dues contrasenyes diferents es diuen al segon camp', () => {
    const motor = { ...MOTOR_COPIA, exporta: vi.fn(), desa: vi.fn() };
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} motor={motor} />);
    escriu('Contrasenya de la còpia', CONTRASENYA);
    escriu('Repetix la contrasenya', `${CONTRASENYA}!`);
    fireEvent.click(screen.getByRole('button', { name: 'Prepara la còpia' }));
    expect(screen.getByText('Les dues contrasenyes no són iguals.')).toBeTruthy();
    expect(camp('Repetix la contrasenya').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(camp('Repetix la contrasenya'));
    expect(motor.exporta).not.toHaveBeenCalled();
  });

  test('la credencial de la còpia va a banda de la del compte: usuari propi i new-password en els dos camps', () => {
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} />);
    const usuari = document.querySelector('input[autocomplete="username"]');
    expect(usuari).not.toBeNull();
    expect(usuari.value).toBe('Còpia del xat de Sóc de Poble');
    expect(usuari.readOnly).toBe(true);
    expect(usuari.getAttribute('type')).toBe('text');
    /* Amagat a la vista, fora de la tabulació i dels lectors de pantalla. */
    expect(usuari.getAttribute('tabindex')).toBe('-1');
    expect(usuari.getAttribute('aria-hidden')).toBe('true');
    expect(usuari.classList.contains('sdp-nomes-lector')).toBe(true);
    for (const etiqueta of ['Contrasenya de la còpia', 'Repetix la contrasenya']) {
      expect([etiqueta, camp(etiqueta).getAttribute('autocomplete')]).toEqual([etiqueta, 'new-password']);
      expect(camp(etiqueta).form).toBe(usuari.form);
    }
    expect(document.querySelectorAll('input[autocomplete="current-password"], input[autocomplete="off"][type="password"]')).toHaveLength(0);
  });

  test('dos passos a la web: «Prepara la còpia» només xifra; «Desa l’arxiu», dins del seu clic, llança la descàrrega d’un .sdpbackup que torna a obrir-se sencer i sense secrets', async () => {
    const clic = vi.fn();
    const desa = desaDeProva(clic);
    const exporta = vi.fn(MOTOR_COPIA.exporta);
    const motor = { ...MOTOR_COPIA, exporta, desa };
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} motor={motor} />);
    const boto = await preparaLaCopia();

    /* Pas 1: xifrada, sense cap arxiu encara; les contrasenyes ja no són a la pàgina. */
    expect(exporta).toHaveBeenCalledTimes(1);
    expect(desa).not.toHaveBeenCalled();
    expect(clic).not.toHaveBeenCalled();
    expect(within(regioViva()).getByText('Còpia xifrada preparada')).toBeTruthy();
    expect(within(regioViva()).getByText('Converses: 2 · Missatges: 3')).toBeTruthy();
    expect(within(regioViva()).getByText('Ara prem «Desa l’arxiu» per a guardar l’arxiu de la còpia.')).toBeTruthy();
    expect(screen.queryByLabelText('Contrasenya de la còpia')).toBeNull();
    expect(screen.queryByLabelText('Repetix la contrasenya')).toBeNull();

    /* Pas 2: el motor es crida dins del clic, abans de cap espera. */
    fireEvent.click(boto);
    expect(desa).toHaveBeenCalledTimes(1);
    expect(clic).toHaveBeenCalledTimes(1);
    expect(await within(regioViva()).findByText(/Ha començat la descàrrega de l’arxiu socdepoble-xat-complet-\d{8}-\d{4}\.sdpbackup/, {}, ESPERA)).toBeTruthy();
    expect(within(regioViva()).getByText(/prova-la a «Comprova una còpia» amb la mateixa contrasenya/)).toBeTruthy();
    expect(exporta).toHaveBeenCalledTimes(1);

    const [text, opcions] = desa.mock.calls[0];
    expect(opcions).toEqual({});
    const capcalera = await descriuCopiaSeguretatXat(text);
    expect(capcalera).toMatchObject({ usuariId: JO, tenantId: TENANT, mode: 'complet', xifrada: true });
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain('Bon dia');

    const resultat = await importaCopiaSeguretatXat(text, { usuariIdEsperat: JO, tenantIdEsperat: TENANT, contrasenya: CONTRASENYA });
    expect(resultat.fils).toHaveLength(2);
    expect(resultat.missatges.map((m) => m.text).sort()).toEqual(['Bon dia, Rosa!', 'Demà toca tanda', 'Fins demà']);
    const dades = JSON.stringify({ fils: resultat.fils, missatges: resultat.missatges });
    expect(dades).not.toContain(SECRET);
    expect(dades).not.toMatch(/"(accessToken|refreshToken|sender|estatEnviament|searchText)"/);
  });

  /* Onada R29 · R29-E2EE-03 · La vista només té les últimes d'una conversa llarga: la còpia no es pot
     declarar «complet» (diria que cobrix des de la seq 1). Abans la pàgina no passava cap cursor. */
  test('Onada R29 · amb només els últims missatges d’una conversa, la còpia ix «parcial», amb el seu punt de partida i totes les converses', async () => {
    const ultims = [98, 99, 100].map((seq) => mapejaMissatge({
      id: `a0000000-0000-4000-8000-${String(seq).padStart(12, '0')}`, filId: FIL_ROSA, seq, usuariId: ROSA, autorNom: 'Rosa', text: `missatge ${seq}`, creatAl: '2026-11-14T10:00:00.000Z'
    }, JO));
    const contingut = contingutDeLaCopia({ chatThreads: FILS_DE_LA_VISTA, getThreadMessages: (id) => (id === FIL_ROSA ? ultims : getThreadMessages(id)), joNom: 'Javi' });
    const desa = desaDeProva();
    const exporta = vi.fn(MOTOR_COPIA.exporta);
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={contingut} motor={{ ...MOTOR_COPIA, exporta, desa }} />);
    expect(screen.getByText('Converses: 2 · Missatges: 4')).toBeTruthy();
    fireEvent.click(await preparaLaCopia());
    expect(exporta.mock.calls[0][0].desDeSeqPerFil).toEqual({ [FIL_ROSA]: 97, [FIL_GRUP]: 0 });
    expect(await within(regioViva()).findByText(/Ha començat la descàrrega de l’arxiu socdepoble-xat-parcial-\d{8}-\d{4}\.sdpbackup/, {}, ESPERA)).toBeTruthy();
    const [text] = desa.mock.calls[0];
    expect(await descriuCopiaSeguretatXat(text)).toMatchObject({ mode: 'parcial', xifrada: true });
    const resultat = await importaCopiaSeguretatXat(text, { usuariIdEsperat: JO, tenantIdEsperat: TENANT, contrasenya: CONTRASENYA });
    expect(resultat.fils).toHaveLength(2);
    expect(resultat.manifest.cursors.desDeSeqPerFil).toEqual({ [FIL_ROSA]: 97, [FIL_GRUP]: 0 });
    expect(resultat.missatges.map((m) => m.seq).sort((a, b) => a - b)).toEqual([1, 98, 99, 100]);
  });

  test('cancel·lar el selector ho diu, no es dona per desada i es pot tornar a provar sense tornar a xifrar', async () => {
    const desa = vi.fn()
      .mockResolvedValueOnce({ metode: 'selector-fitxers', nomArxiu: 'x.sdpbackup', lliurat: false, motiu: 'cancellat' })
      .mockResolvedValueOnce({ metode: 'selector-fitxers', nomArxiu: 'x.sdpbackup', lliurat: true });
    const exporta = vi.fn(MOTOR_COPIA.exporta);
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} motor={{ ...MOTOR_COPIA, exporta, desa }} />);
    const boto = await preparaLaCopia();
    fireEvent.click(boto);
    expect(await screen.findByText('Has cancel·lat: no s’ha desat cap arxiu.', {}, ESPERA)).toBeTruthy();
    expect(screen.queryByText(/S’ha desat l’arxiu/)).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Desa l’arxiu' })));
    fireEvent.click(screen.getByRole('button', { name: 'Desa l’arxiu' }));
    expect(await screen.findByText('S’ha desat l’arxiu de la còpia on has triat.', {}, ESPERA)).toBeTruthy();
    expect(desa).toHaveBeenCalledTimes(2);
    expect(desa.mock.calls[1][0]).toBe(desa.mock.calls[0][0]);
    expect(exporta).toHaveBeenCalledTimes(1);
  });

  test('el selector de fitxers que sí que desa no promet cap nom: la persona l’ha pogut canviar', async () => {
    const motor = { ...MOTOR_COPIA, desa: vi.fn(async () => ({ metode: 'selector-fitxers', nomArxiu: 'socdepoble-xat-complet-20261115-0130.sdpbackup', lliurat: true })) };
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} motor={motor} />);
    fireEvent.click(await preparaLaCopia());
    expect(await screen.findByText('S’ha desat l’arxiu de la còpia on has triat.', {}, ESPERA)).toBeTruthy();
    expect(regioViva().textContent).not.toContain('socdepoble-xat-complet-20261115-0130.sdpbackup');
  });

  test('dins de l’app sense full de compartir, ho diu abans de demanar cap contrasenya', () => {
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} natiu navegador={{}} />);
    expect(screen.getByText(/En l’app d’este mòbil no es pot desar l’arxiu de la còpia/)).toBeTruthy();
    expect(screen.queryByLabelText('Contrasenya de la còpia')).toBeNull();
  });

  /* El full de compartir d'iOS (navigator.share) demana una activació d'usuari
     vigent. Ací s'emula: un clic l'obri i dura fins que l'esdeveniment acaba
     (la microtasca de després). Un share fora d'un clic rep NotAllowedError,
     com al navegador. */
  test('dins de l’app: «Comparteix l’arxiu» obri el full de compartir dins de la seua pròpia activació, mai després de la xifra', async () => {
    let activacio = false;
    const obri = () => { activacio = true; queueMicrotask(() => { activacio = false; }); };
    document.addEventListener('click', obri, true);
    try {
      const share = vi.fn(async () => {
        if (!activacio) throw new DOMException('Cal un gest de la persona.', 'NotAllowedError');
      });
      const navegador = { share, canShare: vi.fn(() => true) };
      const desa = vi.fn((text, opcions) => desaArxiuCopiaSeguretatXat(text, { finestra: {}, navegador, ...opcions }));
      render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} natiu navegador={navegador} motor={{ ...MOTOR_COPIA, desa }} />);
      const boto = await preparaLaCopia('Comparteix l’arxiu');
      /* El clic de «Prepara la còpia» no ha obert cap full. */
      expect(share).not.toHaveBeenCalled();
      expect(within(regioViva()).getByText('Ara prem «Comparteix l’arxiu» per a guardar l’arxiu de la còpia.')).toBeTruthy();

      fireEvent.click(boto);
      /* Ja dins del clic: share ha corregut amb l'activació encara oberta. */
      expect(share).toHaveBeenCalledTimes(1);
      expect(desa.mock.calls[0][1]).toEqual({ prefereixCompartir: true, documentDom: null });
      const [{ files }] = share.mock.calls[0];
      expect(files).toHaveLength(1);
      expect(files[0].name).toMatch(/^socdepoble-xat-complet-\d{8}-\d{4}\.sdpbackup$/);
      expect(await screen.findByText(/^S’ha obert el full per a compartir l’arxiu socdepoble-xat-complet-/, {}, ESPERA)).toBeTruthy();
      expect(screen.queryByText(/En l’app d’este mòbil no es pot desar/)).toBeNull();

      /* La prova de l'emulació: el mateix share fora d'un clic falla. */
      await expect(share({ files })).rejects.toMatchObject({ name: 'NotAllowedError' });
    } finally {
      document.removeEventListener('click', obri, true);
    }
  });

  /* Onada R28 · copia-xat-06 · canShare es pregunta en muntar, amb un arxiu
     .sdpbackup buit del mateix tipus que el motor compartirà: si no l'admet,
     l'avís ix ABANS de demanar la contrasenya i de xifrar. */
  test('dins de l’app amb full de compartir que no admet l’arxiu: l’avís honest abans de demanar la contrasenya, sense xifrar ni compartir res', () => {
    const navegador = { share: vi.fn(), canShare: vi.fn(() => false) };
    const exporta = vi.fn();
    const desa = vi.fn();
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} natiu navegador={navegador} motor={{ ...MOTOR_COPIA, exporta, desa }} />);
    expect(screen.getByText(/En l’app d’este mòbil no es pot desar l’arxiu de la còpia/)).toBeTruthy();
    expect(screen.queryByLabelText('Contrasenya de la còpia')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Prepara la còpia' })).toBeNull();
    expect(navegador.canShare).toHaveBeenCalled();
    const [{ files }] = navegador.canShare.mock.calls[0];
    expect(files).toHaveLength(1);
    expect(files[0]).toBeInstanceOf(File);
    expect(files[0].name).toMatch(/\.sdpbackup$/);
    expect(files[0].type).toBe(MIME_SDP_BACKUP);
    expect(files[0].size).toBe(0);
    expect(exporta).not.toHaveBeenCalled();
    expect(desa).not.toHaveBeenCalled();
    expect(navegador.share).not.toHaveBeenCalled();
  });

  test('dins de l’app, un canShare que falla en preguntar es pren per un no', () => {
    const navegador = { share: vi.fn(), canShare: vi.fn(() => { throw new TypeError('no'); }) };
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} natiu navegador={navegador} />);
    expect(screen.getByText(/En l’app d’este mòbil no es pot desar l’arxiu de la còpia/)).toBeTruthy();
    expect(screen.queryByLabelText('Contrasenya de la còpia')).toBeNull();
  });

  /* Onada R28 · revisió · La pregunta de l'entrada no ho garantix tot: un full
     que admet l'arxiu buit i no la còpia de veres (per la mida, per exemple)
     continua acabant en l'avís honest, sense cap descàrrega per enllaç. */
  test('dins de l’app, si el full admet l’arxiu buit però no la còpia de veres: cap descàrrega per enllaç, l’avís honest', async () => {
    const navegador = { share: vi.fn(), canShare: vi.fn(({ files }) => files[0].size === 0) };
    const desa = vi.fn((text, opcions) => desaArxiuCopiaSeguretatXat(text, { finestra: {}, navegador, ...opcions }));
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} natiu navegador={navegador} motor={{ ...MOTOR_COPIA, desa }} />);
    fireEvent.click(await preparaLaCopia('Comparteix l’arxiu'));
    expect(await screen.findByText(/En l’app d’este mòbil no es pot desar l’arxiu de la còpia/, {}, ESPERA)).toBeTruthy();
    expect(desa.mock.calls[0][1]).toEqual({ prefereixCompartir: true, documentDom: null });
    expect(navegador.canShare.mock.calls.some(([{ files }]) => files[0].size > 0)).toBe(true);
    expect(navegador.share).not.toHaveBeenCalled();
  });

  /* Onada R28 · copia-xat-03 · Les converses hi són, però cap missatge carregat. */
  test('amb converses però cap missatge carregat, un avís curt ho diu abans del formulari, que continua actiu', () => {
    const contingut = contingutDeLaCopia({ chatThreads: FILS_DE_LA_VISTA, getThreadMessages: () => [], joNom: 'Javi' });
    expect(contingut).toMatchObject({ missatges: [], filsAmbMissatges: 0 });
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={contingut} />);
    expect(screen.getByText('Converses: 2 · Missatges: 0')).toBeTruthy();
    const avis = screen.getByText('Encara no s’ha carregat cap missatge. La còpia només portaria la llista de converses, amb els noms i l’últim missatge de cada una. Obri les converses que vols guardar i torna ací.');
    const formulari = document.querySelector('form');
    /* Abans del formulari. */
    expect(avis.compareDocumentPosition(formulari) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(camp('Contrasenya de la còpia')).toBeTruthy();
    expect(screen.queryByText(/^Converses amb missatges carregats/)).toBeNull();
  });

  test('amb missatges només en algunes converses, el recompte diu en quantes (filsAmbMissatges)', () => {
    const contingut = contingutDeLaCopia({ chatThreads: FILS_DE_LA_VISTA, getThreadMessages: (id) => (id === FIL_GRUP ? MISSATGES_DE_LA_VISTA[FIL_GRUP] : []), joNom: 'Javi' });
    expect(contingut.filsAmbMissatges).toBe(1);
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={contingut} />);
    expect(screen.getByText('Converses: 2 · Missatges: 1')).toBeTruthy();
    expect(screen.getByText('Converses amb missatges carregats: 1 de 2')).toBeTruthy();
    expect(screen.queryByText(/^Encara no s’ha carregat cap missatge/)).toBeNull();
  });

  /* Onada R28 · copia-xat-04 · Sense WebCrypto (fora d'un context segur) el
     motor fallaria cada vegada: l'avís en lloc del formulari. */
  test('sense WebCrypto, cap formulari ni cap crida al motor: l’avís que no promet que reintentar ho arregle', () => {
    const exporta = vi.fn();
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} cripto={{}} motor={{ ...MOTOR_COPIA, exporta }} />);
    const avis = screen.getByText(/^Este navegador no deixa xifrar en esta pàgina\./);
    expect(avis.textContent).toMatch(/obri Sóc de Poble en una adreça segura\.$/);
    expect(avis.textContent).not.toMatch(/Torna-ho a provar/);
    expect(screen.queryByLabelText('Contrasenya de la còpia')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(exporta).not.toHaveBeenCalled();
  });

  test('sense cap conversa carregada no hi ha res per a copiar; sense compte, cap formulari', () => {
    const { unmount } = render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={{ fils: [], missatges: [] }} />);
    expect(screen.getByText(/encara no té cap conversa carregada/)).toBeTruthy();
    expect(screen.queryByLabelText('Contrasenya de la còpia')).toBeNull();
    unmount();
    render(<CosCopiaSeguretatXat accio="desa" abast={null} contingut={CONTINGUT} />);
    expect(screen.getByText('Entra al xat amb el teu compte per a fer o comprovar una còpia.')).toBeTruthy();
    expect(screen.queryByLabelText('Contrasenya de la còpia')).toBeNull();
  });

  test('en castellà: els textos del diccionari, amb els marcadors omplits', () => {
    render(<CosCopiaSeguretatXat accio="desa" abast={ABAST} contingut={CONTINGUT} t={createTranslator('es')} />);
    expect(screen.getByText('Conversaciones: 2 · Mensajes: 3')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Preparar la copia' })).toBeTruthy();
    expect(screen.getByLabelText('Contraseña de la copia')).toBeTruthy();
    expect(screen.getByText(/Al menos 12 caracteres/)).toBeTruthy();
    expect(document.querySelector('input[autocomplete="username"]').value).toBe('Copia del chat de Sóc de Poble');
  });
});

describe('Comprova una còpia', () => {
  let textCopia = '';
  beforeEach(async () => {
    if (!textCopia) textCopia = await exportaCopiaSeguretatXat({ ...ABAST, ...CONTINGUT, contrasenya: CONTRASENYA, araIso: '2026-11-15T01:30:00.000Z' });
  });

  const tria = (f) => fireEvent.change(camp('Arxiu de la còpia'), { target: { files: [f] } });

  test('la desxifra en memòria, sense magatzem ni aplicaImportacio, i diu què porta', async () => {
    const importa = vi.fn(MOTOR_COPIA.importa);
    render(<CosCopiaSeguretatXat accio="comprova" abast={ABAST} motor={{ ...MOTOR_COPIA, importa }} />);
    expect(screen.getByText('Cap arxiu triat')).toBeTruthy();
    tria(fitxer('casa.sdpbackup', textCopia));
    expect(await screen.findByText('Arxiu triat: casa.sdpbackup', {}, ESPERA)).toBeTruthy();
    /* El pas següent: la contrasenya. */
    await waitFor(() => expect(document.activeElement).toBe(camp('Contrasenya de la còpia')));
    escriu('Contrasenya de la còpia', CONTRASENYA);
    fireEvent.click(screen.getByRole('button', { name: 'Comprova la còpia' }));

    expect(await screen.findByText('La còpia s’obri i està intacta', {}, ESPERA)).toBeTruthy();
    const avis = within(regioViva());
    expect(avis.getByText('Converses: 2 · Missatges: 3')).toBeTruthy();
    expect(avis.getByText(/^Missatges del .*2026.* al .*2026/)).toBeTruthy();
    expect(avis.getByText(/^Còpia feta el .*2026/)).toBeTruthy();
    expect(avis.getByText('Restaurar una còpia dins de l’app encara no és possible: ara la pots desar i comprovar.')).toBeTruthy();
    expect(importa).toHaveBeenCalledTimes(1);
    const [, opcions] = importa.mock.calls[0];
    expect(Object.keys(opcions).sort()).toEqual(['contrasenya', 'tenantIdEsperat', 'usuariIdEsperat']);
    expect(camp('Contrasenya de la còpia').value).toBe('');
  });

  /* Onada R28 · copia-xat-04 · descriu i importa també necessiten WebCrypto. */
  test('sense WebCrypto, ni el camp de l’arxiu: l’avís, abans de triar res', () => {
    const llegix = vi.fn();
    render(<CosCopiaSeguretatXat accio="comprova" abast={ABAST} cripto={null} motor={{ ...MOTOR_COPIA, llegix }} />);
    expect(screen.getByText(/^Este navegador no deixa xifrar en esta pàgina\. Sense xifrar no es pot fer ni comprovar cap còpia\./)).toBeTruthy();
    expect(screen.queryByLabelText('Arxiu de la còpia')).toBeNull();
    expect(llegix).not.toHaveBeenCalled();
  });

  test('la mateixa credencial a banda: usuari propi i current-password', () => {
    render(<CosCopiaSeguretatXat accio="comprova" abast={ABAST} />);
    const usuari = document.querySelector('input[autocomplete="username"]');
    expect(usuari.value).toBe('Còpia del xat de Sóc de Poble');
    expect(usuari.readOnly).toBe(true);
    expect(usuari.getAttribute('tabindex')).toBe('-1');
    expect(usuari.getAttribute('aria-hidden')).toBe('true');
    expect(camp('Contrasenya de la còpia').getAttribute('autocomplete')).toBe('current-password');
    expect(camp('Contrasenya de la còpia').form).toBe(usuari.form);
  });

  test('una contrasenya incorrecta es diu al camp de la contrasenya', async () => {
    render(<CosCopiaSeguretatXat accio="comprova" abast={ABAST} />);
    tria(fitxer('casa.sdpbackup', textCopia));
    await screen.findByText('Arxiu triat: casa.sdpbackup', {}, ESPERA);
    escriu('Contrasenya de la còpia', 'no és la bona, ni de lluny');
    fireEvent.click(screen.getByRole('button', { name: 'Comprova la còpia' }));
    const error = await screen.findByText(/Esta contrasenya no obri la còpia/, {}, ESPERA);
    const control = camp('Contrasenya de la còpia');
    expect(control.getAttribute('aria-invalid')).toBe('true');
    expect(control.getAttribute('aria-describedby').split(' ')).toContain(error.closest('p').id);
    await waitFor(() => expect(document.activeElement).toBe(control));
    expect(screen.queryByText('La còpia s’obri i està intacta')).toBeNull();
  });

  test('sense arxiu o sense contrasenya, ho diu al seu camp', async () => {
    const importa = vi.fn();
    render(<CosCopiaSeguretatXat accio="comprova" abast={ABAST} motor={{ ...MOTOR_COPIA, importa }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Comprova la còpia' }));
    expect(screen.getByText('Tria primer l’arxiu de la còpia.')).toBeTruthy();
    expect(camp('Arxiu de la còpia').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Arxiu de la còpia: Tria l’arxiu' }));
    tria(fitxer('casa.sdpbackup', textCopia));
    await screen.findByText('Arxiu triat: casa.sdpbackup', {}, ESPERA);
    fireEvent.click(screen.getByRole('button', { name: 'Comprova la còpia' }));
    expect(screen.getByText('Escriu la contrasenya de la còpia.')).toBeTruthy();
    expect(importa).not.toHaveBeenCalled();
  });

  test('la còpia d’un altre compte es diu en triar-la, sense demanar la contrasenya', async () => {
    const alie = await exportaCopiaSeguretatXat({ usuariId: ROSA, tenantId: TENANT, ...CONTINGUT, contrasenya: CONTRASENYA });
    const importa = vi.fn();
    render(<CosCopiaSeguretatXat accio="comprova" abast={ABAST} motor={{ ...MOTOR_COPIA, importa }} />);
    tria(fitxer('rosa.sdpbackup', alie));
    expect(await screen.findByText('Esta còpia és d’un altre compte o d’un altre poble.', {}, ESPERA)).toBeTruthy();
    expect(screen.getByText('Cap arxiu triat')).toBeTruthy();
    expect(importa).not.toHaveBeenCalled();
  });

  test('un arxiu que no és una còpia, o massa gran, es diu al camp de l’arxiu', async () => {
    render(<CosCopiaSeguretatXat accio="comprova" abast={ABAST} />);
    tria(fitxer('llista-de-la-compra.txt', 'tomaques, pa i oli'));
    expect(await screen.findByText('Este arxiu no és una còpia del xat de Sóc de Poble o està fet malbé.', {}, ESPERA)).toBeTruthy();
    tria({ name: 'enorme.sdpbackup', size: 70 * 1024 * 1024, arrayBuffer: async () => new ArrayBuffer(0) });
    expect(await screen.findByText('L’arxiu està buit o és massa gran per a ser una còpia del xat.', {}, ESPERA)).toBeTruthy();
  });
});

describe('PaginaCopiaSeguretatXat · amb les dades de XatContext', () => {
  const ESCRIPTURES = ['sendChatMessage', 'sendChatMedia', 'reintenta', 'descartaFallit', 'marcaVist', 'obriFil', 'creaFil', 'recarrega',
    'obriFilDePagina', 'marcaLlegides', 'consumixEntrada', 'silenciaFil', 'arxivaFil', 'recarregaFil', 'carregaMesAntics', 'reintentaOblitXat'];
  let espies = {};
  beforeEach(() => {
    espies = Object.fromEntries(ESCRIPTURES.map((nom) => [nom, vi.fn()]));
    mocks.xat = { joId: JO, joNom: 'Javi', ambitEstable: AMBIT, chatThreads: FILS_DE_LA_VISTA, getThreadMessages: vi.fn(getThreadMessages), ...espies };
  });

  test('Desa compta el que el dispositiu té carregat', () => {
    render(<PaginaCopiaSeguretatXat accio="desa" />);
    expect(screen.getByText('Converses: 2 · Missatges: 3')).toBeTruthy();
    expect(mocks.xat.getThreadMessages).toHaveBeenCalledWith(FIL_ROSA);
  });

  test('Comprova amb el motor de veres no crida cap funció de XatContext que escriga', async () => {
    const text = await exportaCopiaSeguretatXat({ ...ABAST, ...CONTINGUT, contrasenya: CONTRASENYA });
    render(<PaginaCopiaSeguretatXat accio="comprova" />);
    fireEvent.change(camp('Arxiu de la còpia'), { target: { files: [fitxer('casa.sdpbackup', text)] } });
    await screen.findByText('Arxiu triat: casa.sdpbackup', {}, ESPERA);
    escriu('Contrasenya de la còpia', CONTRASENYA);
    fireEvent.click(screen.getByRole('button', { name: 'Comprova la còpia' }));
    expect(await screen.findByText('La còpia s’obri i està intacta', {}, ESPERA)).toBeTruthy();
    for (const [nom, espia] of Object.entries(espies)) expect([nom, espia.mock.calls.length]).toEqual([nom, 0]);
  });

  test('sense persona al xat, només l’avís', () => {
    mocks.xat = { joId: null, ambitEstable: '', chatThreads: [] };
    render(<PaginaCopiaSeguretatXat accio="comprova" />);
    expect(screen.getByText('Entra al xat amb el teu compte per a fer o comprovar una còpia.')).toBeTruthy();
    expect(screen.queryByLabelText('Arxiu de la còpia')).toBeNull();
  });
});
