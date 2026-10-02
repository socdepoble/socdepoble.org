/* El panell de la porta d'aprovació amb el nucli de veres: magatzem en
   memòria, WebCrypto de Node, un catàleg de prova i, per a la signatura, un
   autenticador simulat (model: nucli/aprovacio.test.js). */
import { webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { base64url, concatena, desdeBase64url, sha256, utf8 } from './nucli/canonic.js';
import { preparaRegistre } from './nucli/aprovacio.js';
import { crearMagatzem, crearMagatzemMemoria } from './nucli/magatzem.js';
import { catalegTractors, empremtaDe } from './registreTractors.js';
import PanellTractors, { rebaixaTitols } from './PanellTractors.jsx';

/* La prova d'exportació substituïx els mètodes estàtics d'URL: es tornen tal com eren. */
const URL_ORIGINAL = ['createObjectURL', 'revokeObjectURL'].map((nom) => [nom, Object.getOwnPropertyDescriptor(URL, nom)]);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  for (const [nom, descriptor] of URL_ORIGINAL) {
    if (descriptor) Object.defineProperty(URL, nom, descriptor);
    else delete URL[nom];
  }
});

const subtle = webcrypto.subtle;
const RP_ID = 'app.example.org';
const ORIGEN = 'https://app.example.org';
const T0 = Date.UTC(2026, 9, 2, 8);
const rellotge = () => T0;

function manifest(canvis = {}) {
  return {
    schema: 'sdp.tractor.v1',
    id: 'prova.lector',
    nom: 'Lector de prova',
    versio: '1.0.0',
    descripcio: 'Llig una carpeta de prova i en fa un resum.',
    fitxa: 'src/sections/gestoria/fitxes/prova.md',
    fonts: ['src/sections/gestoria/nucli/lector.js'],
    llig: ['La carpeta que tries'],
    escriu: ['Res durant l’anàlisi', 'Un full de resum'],
    xarxa: 'cap',
    dadesPersonals: false,
    nivellMinim: 'confirmacio',
    caducitatDies: 90,
    ...canvis
  };
}
const FITXA = '# Lector de prova\n\nLlig la carpeta.\n\n## Què no fa mai\n\n- No envia res.\n\n```\n# açò és codi, no un títol\n```\n';
const GLOB = {
  '../gestoria/fitxes/prova.md': FITXA,
  '../gestoria/nucli/lector.js': 'export const lector = 1;\n'
};
const MANIFESTS = [
  manifest(),
  manifest({ id: 'prova.signat', nom: 'Signat de prova', nivellMinim: 'signatura', dadesPersonals: true }),
  manifest({ id: 'prova.incomplet', nom: 'Incomplet de prova', fonts: ['src/sections/gestoria/nucli/lector.js', 'src/sections/gestoria/nucli/absent.js'] })
];
const CATALEG = catalegTractors(MANIFESTS, GLOB);
const CATALEG_V2 = catalegTractors(MANIFESTS, { ...GLOB, '../gestoria/nucli/lector.js': 'export const lector = 2;\n' });
const ENTORN_SENSE = { location: { origin: ORIGEN, hostname: RP_ID }, navigator: {} };

/* Autenticador simulat. */
function capcalera(major, n) {
  if (n < 24) return [(major << 5) | n];
  if (n < 0x100) return [(major << 5) | 24, n];
  return [(major << 5) | 25, n >> 8, n & 0xff];
}
function cbor(valor) {
  if (Number.isInteger(valor)) return valor >= 0 ? capcalera(0, valor) : capcalera(1, -1 - valor);
  if (typeof valor === 'string') return [...capcalera(3, utf8(valor).length), ...utf8(valor)];
  if (valor instanceof Uint8Array) return [...capcalera(2, valor.length), ...valor];
  return [...capcalera(5, valor.size), ...[...valor].flatMap(([k, v]) => [...cbor(k), ...cbor(v)])];
}
function crudaADer(crua) {
  const enter = (b) => {
    let i = 0;
    while (i < b.length - 1 && b[i] === 0) i++;
    let v = [...b.subarray(i)];
    if (v[0] & 0x80) v = [0, ...v];
    return [0x02, v.length, ...v];
  };
  const cos = [...enter(crua.subarray(0, 32)), ...enter(crua.subarray(32))];
  return new Uint8Array([0x30, cos.length, ...cos]);
}
const buffer = (bytes) => bytes.slice().buffer;
async function entornAmbWebAuthn() {
  const parell = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await subtle.exportKey('jwk', parell.publicKey);
  const id = webcrypto.getRandomValues(new Uint8Array(16));
  const credentials = {
    async get({ publicKey }) {
      const authenticatorData = concatena(await sha256(publicKey.rpId, subtle), new Uint8Array([0x05, 0, 0, 0, 1]));
      const clientDataJSON = utf8(JSON.stringify({ type: 'webauthn.get', challenge: base64url(publicKey.challenge), origin: ORIGEN, crossOrigin: false }));
      const crua = new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, parell.privateKey,
        concatena(authenticatorData, await sha256(clientDataJSON, subtle))));
      return { rawId: buffer(id), response: { authenticatorData: buffer(authenticatorData), clientDataJSON: buffer(clientDataJSON), signature: buffer(crudaADer(crua)) } };
    },
    async create({ publicKey }) {
      const cose = new Map([[1, 2], [3, -7], [-1, 1], [-2, desdeBase64url(jwk.x)], [-3, desdeBase64url(jwk.y)]]);
      const authData = concatena(await sha256(publicKey.rp.id, subtle), new Uint8Array([0x45, 0, 0, 0, 0]), new Uint8Array(16),
        new Uint8Array([0, id.length]), id, new Uint8Array(cbor(cose)));
      const attestationObject = new Uint8Array(cbor(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]])));
      const clientDataJSON = utf8(JSON.stringify({ type: 'webauthn.create', challenge: base64url(publicKey.challenge), origin: ORIGEN }));
      return { rawId: buffer(id), response: { attestationObject: buffer(attestationObject), clientDataJSON: buffer(clientDataJSON) } };
    }
  };
  class PKC {
    static async isUserVerifyingPlatformAuthenticatorAvailable() { return true; }
  }
  return { location: { origin: ORIGEN, hostname: RP_ID }, navigator: { credentials }, PublicKeyCredential: PKC };
}

async function munta({ magatzem = crearMagatzemMemoria(), tractors = CATALEG, entorn = ENTORN_SENSE } = {}) {
  const vista = render(<PanellTractors magatzem={magatzem} subtle={subtle} tractors={tractors} entorn={entorn} rellotge={rellotge} />);
  await screen.findByRole('list', { name: 'Tractors' });
  return { ...vista, magatzem };
}

const element = (nom) => screen.getByRole('button', { name: new RegExp(`^${nom}`) });
const detall = () => screen.getByRole('article');
const boto = (nom) => screen.getByRole('button', { name: nom });
const dialegAprovacio = (nom = 'Lector de prova') => screen.getByRole('dialog', { name: `Aprova «${nom}»` });

async function aprovaPerConfirmacio(nom = 'Lector de prova') {
  const curta = within(detall()).getByText(/^[0-9A-F]{4}-[0-9A-F]{4}$/).textContent;
  fireEvent.click(boto('Aprova esta versió'));
  const d = dialegAprovacio(nom);
  fireEvent.click(within(d).getByRole('checkbox', { name: /He llegit la fitxa sencera/ }));
  fireEvent.change(within(d).getByRole('textbox', { name: /Escriu l’empremta curta/ }), { target: { value: curta } });
  fireEvent.click(within(d).getByRole('button', { name: 'Aprova amb confirmació escrita' }));
  // WebCrypto de Node no resol en microtasques: s'espera el resultat visible.
  await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/^Aprovat: /));
  return curta;
}
const clica = async (nom, fet) => {
  fireEvent.click(boto(nom));
  await waitFor(fet);
};

describe('llista i detall', () => {
  test('cada tractor amb la seua insígnia i el detall sencer del triat', async () => {
    const { container } = await munta();
    expect(element('Lector de prova').textContent).toContain('Pendent');
    expect(element('Lector de prova').getAttribute('aria-current')).toBe('true');
    expect(element('Signat de prova').textContent).toContain('Pendent');
    expect(element('Incomplet de prova').textContent).toContain('Incomplet');

    const article = within(detall());
    expect(article.getByRole('heading', { level: 3, name: 'Lector de prova' })).toBeTruthy();
    expect(article.getByText('Llig una carpeta de prova i en fa un resum.')).toBeTruthy();
    expect(article.getByText('La carpeta que tries')).toBeTruthy();
    expect(article.getByText('Un full de resum')).toBeTruthy();
    expect(article.getByText('Cap: no es connecta enlloc')).toBeTruthy();
    expect(article.getByText('No en tracta')).toBeTruthy();
    expect(article.getByText('Confirmació escrita de l’empremta curta')).toBeTruthy();
    expect(article.getByText('90 dies des de l’aprovació')).toBeTruthy();
    expect(article.getByText('Encara no hi ha cap registre.')).toBeTruthy();

    const { empremta, curta } = await empremtaDe(CATALEG[0], subtle);
    expect(article.getByText(curta).className).toBe('sdp-tractors-panell__curta');
    expect(article.getByText(empremta).tagName).toBe('CODE');

    const fonts = container.querySelector('details.sdp-tractors-panell__fonts');
    expect(fonts.querySelector('summary').textContent).toBe('Fonts que cobrix l’empremta (1)');
    expect(fonts.querySelector('pre code').textContent).toBe('export const lector = 1;\n');
  });

  test('la fitxa es pinta sanejada i penja de l\'h3: cap h1 ni h2 dins del panell', async () => {
    const { container } = await munta();
    const fitxa = within(screen.getByRole('region', { name: 'Fitxa explicativa' }));
    expect(fitxa.getByRole('heading', { level: 4, name: 'Lector de prova' })).toBeTruthy();
    expect(fitxa.getByRole('heading', { level: 5, name: 'Què no fa mai' })).toBeTruthy();
    expect(fitxa.getByText('No envia res.')).toBeTruthy();
    expect(fitxa.getByText('# açò és codi, no un títol')).toBeTruthy();
    expect(container.querySelector('h1')).toBeNull();
    // Fora dels diàlegs (cada <dialog> porta el seu h2), només el títol del panell.
    expect([...container.querySelectorAll('h2')].filter((h) => !h.closest('dialog')).map((h) => h.textContent))
      .toEqual(['Porta d’aprovació de tractors']);
  });

  test('rebaixaTitols no toca el codi i no passa de h6', () => {
    expect(rebaixaTitols('# Un\n## Dos\n##### Cinc\n```\n# codi\n```\n#sense-espai'))
      .toBe('### Un\n#### Dos\n###### Cinc\n```\n# codi\n```\n#sense-espai');
    expect(rebaixaTitols(null)).toBe('');
  });

  test('un tractor incomplet diu què falta i no es pot aprovar', async () => {
    await munta();
    fireEvent.click(element('Incomplet de prova'));
    const article = within(detall());
    expect(element('Incomplet de prova').getAttribute('aria-current')).toBe('true');
    expect(article.getByText('Versió incompleta')).toBeTruthy();
    expect(article.getAllByText('src/sections/gestoria/nucli/absent.js').length).toBeGreaterThan(0);
    expect(article.getByText('Absent')).toBeTruthy();
    expect(article.getByText('Sense empremta: no es pot aprovar.')).toBeTruthy();
    expect(boto('Aprova esta versió').disabled).toBe(true);
    expect(boto('Revoca').disabled).toBe(true);
  });
});

describe('aprovar i revocar', () => {
  test('aprovació per confirmació: insígnia, avís, historial i caducitat', async () => {
    const { magatzem } = await munta();
    const curta = await aprovaPerConfirmacio();
    expect(element('Lector de prova').textContent).toContain('Aprovat');
    expect(screen.getByRole('status').textContent).toBe(`Aprovat: Lector de prova, versió 1.0.0 (${curta}).`);
    // Tancat, el <dialog> ix de l'arbre d'accessibilitat.
    expect(screen.queryByRole('dialog', { name: 'Aprova «Lector de prova»' })).toBeNull();
    expect(within(detall()).getByText(/^Aprovat el .* \(confirmació escrita de l’empremta curta\)\.$/)).toBeTruthy();
    const linia = detall().querySelector('.sdp-tractors-panell__historial li');
    expect(linia.textContent).toContain('Aprovat · Confirmació escrita de l’empremta curta · versió 1.0.0 · ');
    expect(linia.querySelector('time').getAttribute('dateTime')).toBe(new Date(T0).toISOString());
    expect(within(detall()).getByText(/caduca el/)).toBeTruthy();
    expect(await magatzem.registres('prova.lector')).toHaveLength(1);
  });

  test('revocar deixa «Revocat» i el botó es torna a desactivar', async () => {
    await munta();
    await aprovaPerConfirmacio();
    expect(boto('Revoca').disabled).toBe(false);
    await clica('Revoca', () => expect(element('Lector de prova').textContent).toContain('Revocat'));
    expect(screen.getByRole('status').textContent).toBe('Aprovació revocada: Lector de prova ja no s’executa.');
    expect(boto('Revoca').disabled).toBe(true);
    expect(detall().querySelectorAll('.sdp-tractors-panell__historial li')).toHaveLength(2);
  });

  test('una aprovació d\'una altra versió es veu com «Versió canviada»', async () => {
    const magatzem = crearMagatzemMemoria();
    const { empremta } = await empremtaDe(CATALEG[0], subtle);
    await magatzem.afegixRegistre(preparaRegistre({
      manifest: CATALEG[0].manifest, empremta, decisio: 'aprovat', nivell: 'confirmacio', ara: T0 - 1000
    }));
    await munta({ magatzem, tractors: CATALEG_V2 });
    expect(element('Lector de prova').textContent).toContain('Versió canviada');
    expect(within(detall()).getByText(/el codi o la fitxa han canviat/)).toBeTruthy();
    expect(boto('Revoca').disabled).toBe(false);
  });

  test('un tractor de signatura sense WebAuthn no es pot aprovar per confirmació', async () => {
    await munta();
    fireEvent.click(element('Signat de prova'));
    expect(within(detall()).getByText('Signatura amb Touch ID o clau de pas')).toBeTruthy();
    fireEvent.click(boto('Aprova esta versió'));
    const d = dialegAprovacio('Signat de prova');
    fireEvent.click(within(d).getByRole('checkbox', { name: /He llegit la fitxa sencera/ }));
    expect(within(d).getByRole('button', { name: 'Aprova amb confirmació escrita' }).disabled).toBe(true);
    expect(within(d).getByText('Este navegador no pot signar')).toBeTruthy();
  });

  test('amb WebAuthn simulat: signa, queda aprovat i l\'historial ho diu', async () => {
    const { magatzem } = await munta({ entorn: await entornAmbWebAuthn() });
    fireEvent.click(element('Signat de prova'));
    fireEvent.click(boto('Aprova esta versió'));
    const d = dialegAprovacio('Signat de prova');
    const signa = await within(d).findByRole('button', { name: 'Signa amb Touch ID o clau de pas' });
    fireEvent.click(within(d).getByRole('checkbox', { name: /He llegit la fitxa sencera/ }));
    fireEvent.click(signa);
    await waitFor(() => expect(element('Signat de prova').textContent).toContain('Aprovat'));
    expect(detall().querySelector('.sdp-tractors-panell__historial li').textContent)
      .toContain('Aprovat · Signatura amb Touch ID o clau de pas');
    expect(await magatzem.claus()).toHaveLength(1);
  });
});

describe('exportar i oblidar', () => {
  test('sense registres no descarrega res; amb registres, un JSONL amb enllaç temporal', async () => {
    let n = 0;
    const crea = vi.fn(() => `blob:prova-${++n}`);
    const allibera = vi.fn();
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: crea },
      revokeObjectURL: { configurable: true, value: allibera }
    });
    const clics = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      clics.push({ href: this.getAttribute('href'), download: this.download, dins: this.isConnected });
    });
    const { container } = await munta();
    await clica('Exporta el registre', () => expect(screen.getByRole('status').textContent).toBe('No hi ha cap registre que exportar.'));
    expect(crea).not.toHaveBeenCalled();

    await aprovaPerConfirmacio();
    await clica('Exporta el registre', () => expect(clics).toHaveLength(1));
    expect(clics).toEqual([{ href: 'blob:prova-1', download: expect.stringMatching(/^registre_aprovacions_tractors_\d{4}-\d{2}-\d{2}\.jsonl$/), dins: true }]);
    expect(container.querySelector('a[download]')).toBeNull();
    expect(allibera).not.toHaveBeenCalled();
    const blob = crea.mock.calls[0][0];
    const text = await new Promise((resol) => {
      const lector = new FileReader();
      lector.onload = () => resol(lector.result);
      lector.readAsText(blob);
    });
    const linies = text.trim().split('\n').map((l) => JSON.parse(l));
    expect(linies.map((l) => l.tipus)).toEqual(['registre']);
    expect(linies[0].valor.tractor).toBe('prova.lector');
    expect(screen.getByRole('status').textContent).toMatch(/sense cap dada personal/);

    // L'URL anterior es revoca en tornar a exportar, i la darrera en desmuntar.
    await clica('Exporta el registre', () => expect(allibera).toHaveBeenCalledWith('blob:prova-1'));
    cleanup();
    expect(allibera).toHaveBeenLastCalledWith('blob:prova-2');
  });

  test('oblidar demana confirmació i torna tots els tractors a «pendent»', async () => {
    const { magatzem } = await munta();
    await aprovaPerConfirmacio();
    fireEvent.click(boto('Oblida les aprovacions d’este navegador'));
    const d = screen.getByRole('dialog', { name: 'Vols oblidar les aprovacions d’este navegador?' });
    fireEvent.click(within(d).getByRole('button', { name: 'Cancel·lar' }));
    expect(element('Lector de prova').textContent).toContain('Aprovat');

    fireEvent.click(boto('Oblida les aprovacions d’este navegador'));
    fireEvent.click(within(d).getByRole('button', { name: 'Sí, oblida-les' }));
    await waitFor(() => expect(element('Lector de prova').textContent).toContain('Pendent'));
    expect(d.hasAttribute('open')).toBe(false);
    expect(await magatzem.registres()).toEqual([]);
    expect(screen.getByRole('status').textContent).toBe('Aprovacions oblidades: tots els tractors tornen a «pendent».');
  });

  test('si el magatzem no és persistent, avisa', async () => {
    await munta();
    expect(screen.getByText('Este navegador no pot guardar les aprovacions')).toBeTruthy();
  });

  test('si IndexedDB existix però no es deixa obrir, també avisa, sense error i amb els tractors a la vista', async () => {
    const idb = {
      open() {
        const peticio = { error: new Error('InvalidStateError') };
        setTimeout(() => peticio.onerror?.(), 0);
        return peticio;
      }
    };
    await munta({ magatzem: crearMagatzem({ idb }) });
    expect(screen.getByText('Este navegador no pot guardar les aprovacions')).toBeTruthy();
    expect(screen.queryByText(/No s'han pogut llegir les aprovacions/)).toBeNull();
    expect(element('Lector de prova').textContent).toContain('Pendent');
    expect(screen.getByText('Les aprovacions no es guarden enlloc.')).toBeTruthy();
  });
});

describe('el que diu de l’empremta és exacte', () => {
  test('cobrix les fonts llistades (tractor, la seua interfície i la porta), no els components comuns', async () => {
    const { container } = await munta();
    const intro = container.querySelector('.sdp-tractors-panell__titol').nextElementSibling.textContent;
    expect(intro).toMatch(/cada línia de les fonts llistades/);
    expect(intro).toMatch(/el codi del tractor, el de la seua interfície i el d’esta porta/);
    expect(intro).toMatch(/Els components comuns de l’app .* no hi entren/);
  });
});
