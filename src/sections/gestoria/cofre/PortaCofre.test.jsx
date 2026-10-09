/* La porta del cofre xifrat (Onada 6, ordre del Mestre, 261009: cofre
   xifrat). El cofre és el de veres (cofre.js amb WebCrypto de Node) sobre un
   magatzem en memòria escrit ací, que fa el paper de magatzemCofre.js (el
   camí d'IndexedDB el mira cofre.test.js). L'entorn és fals (context segur,
   finestra i document com a EventTarget) i el temps de l'autobloqueig és
   simulat. Es mira el camí d'una persona: crear amb una frase prou bona,
   apuntar el codi, obrir, bloquejar, equivocar-se de frase, recuperar amb el
   codi, l'autobloqueig (també amb un codi sense confirmar), el canvi de frase
   amb rotació, la còpia xifrada, l'exportació en clar amb confirmació i que
   res no passa per l'emmagatzematge del navegador. El hook (useCofre.js) es
   prova a través de la porta. */
import { webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { creaCofreLocal } from './cofre.js';
import { mateixaMeta } from './magatzemCofre.js';
import PortaCofre from './PortaCofre.jsx';
import { AVIS_CODI_PERDUT } from './useCofre.js';

const FRASE = 'olivera vella del mas de dalt';
const NOVA = 'forn de pa de la plaça major';
const SENTINELLA = 'SENTINELLA-OPENAI-777';
const MINUT = 60 * 1000;
const clona = (valor) => (valor == null ? null : JSON.parse(JSON.stringify(valor)));
const ambCodi = (codi, missatge) => Object.assign(new Error(missatge), { codi });

/* El contracte de magatzemCofre.js, en memòria. */
function magatzemEnMemoria() {
  let meta = null;
  const files = new Map();
  const clau = (colleccio, id) => `${colleccio}|${id}`;
  const exigixMeta = (esperada) => {
    if (!mateixaMeta(meta, esperada)) throw ambCodi('COFRE_CANVIAT', 'Ha canviat.');
  };
  return {
    files,
    get meta() {
      return meta;
    },
    llegixMeta: async () => clona(meta),
    creaMeta: async (nova) => {
      if (meta) throw ambCodi('COFRE_EXISTENT', 'Ja hi ha un cofre.');
      meta = clona(nova);
    },
    substituixMeta: async (nova, anterior) => {
      exigixMeta(anterior);
      meta = clona(nova);
    },
    llegixRegistre: async (colleccio, id) => clona(files.get(clau(colleccio, id))),
    desaRegistre: async (fila, esperada) => {
      exigixMeta(esperada);
      files.set(clau(fila.colleccio, fila.id), clona(fila));
    },
    rota: async (nova, anterior, llegits, nous) => {
      exigixMeta(anterior);
      const ivs = new Map(llegits.map((r) => [clau(r.colleccio, r.id), r.iv]));
      if (files.size !== ivs.size || [...files].some(([k, f]) => ivs.get(k) !== f.iv)) throw ambCodi('COFRE_CANVIAT', 'Ha canviat.');
      files.clear();
      for (const r of nous) files.set(clau(r.colleccio, r.id), clona(r));
      meta = clona(nova);
      return nous.length;
    },
    esborraRegistre: async (colleccio, id) => files.delete(clau(colleccio, id)),
    registresDe: async (colleccio) => [...files.values()].filter((f) => f.colleccio === colleccio).map(clona),
    totsElsRegistres: async () => [...files.values()].map(clona),
    restaura: async (nova, registres) => {
      if (meta) throw ambCodi('COFRE_EXISTENT', 'Ja hi ha un cofre.');
      meta = clona(nova);
      files.clear();
      for (const r of registres) files.set(clau(r.colleccio, r.id), clona(r));
      return registres.length;
    },
    afegixSiFalten: async (registres, esperada) => {
      exigixMeta(esperada);
      let afegits = 0;
      for (const r of registres) {
        if (!files.has(clau(r.colleccio, r.id))) {
          files.set(clau(r.colleccio, r.id), clona(r));
          afegits += 1;
        }
      }
      return { afegits, conservats: registres.length - afegits };
    },
    tanca() {}
  };
}

function entornFals({ segur = true } = {}) {
  const finestra = new EventTarget();
  const doc = new EventTarget();
  doc.visibilityState = 'visible';
  finestra.document = doc;
  finestra.isSecureContext = segur;
  return finestra;
}

function creaTemporitzadors() {
  let ara = 1000000;
  let seguent = 1;
  const pendents = new Map();
  return {
    rellotge: () => ara,
    setTimeout: (fn, ms) => {
      const id = seguent++;
      pendents.set(id, { fn, quan: ara + Math.max(0, ms) });
      return id;
    },
    clearTimeout: (id) => {
      pendents.delete(id);
    },
    avanca(ms) {
      const fi = ara + ms;
      for (;;) {
        const proper = [...pendents].filter(([, t]) => t.quan <= fi).sort((a, b) => a[1].quan - b[1].quan)[0];
        if (!proper) break;
        pendents.delete(proper[0]);
        ara = proper[1].quan;
        proper[1].fn();
      }
      ara = fi;
    }
  };
}

const oberts = [];
function munta({ segur = true, contingut = null, magatzem = magatzemEnMemoria() } = {}) {
  const entorn = entornFals({ segur });
  const temporitzadors = creaTemporitzadors();
  const cofre = creaCofreLocal({ magatzem, cripto: webcrypto, entorn, iteracions: 1000, temporitzadors, rellotge: temporitzadors.rellotge });
  oberts.push(cofre);
  const descarrega = vi.fn();
  render(
    <PortaCofre cofre={cofre} descarrega={descarrega} rellotge={() => Date.UTC(2026, 9, 9, 2, 15)}>
      {contingut}
    </PortaCofre>
  );
  return { magatzem, entorn, temporitzadors, cofre, descarrega };
}

afterEach(() => {
  cleanup();
  oberts.splice(0).forEach((cofre) => cofre.tanca());
  vi.restoreAllMocks();
});

const escriu = (etiqueta, valor, dins = document.body) => fireEvent.change(within(dins).getByLabelText(etiqueta), { target: { value: valor } });
const porta = () => screen.getByRole('region', { name: 'Cofre xifrat' });

/* Crea el cofre per la pantalla i torna el codi mostrat (sense haver-lo confirmat encara). */
async function creaPerPantalla() {
  await screen.findByRole('button', { name: 'Crea el cofre' });
  escriu('Frase de pas nova', FRASE);
  escriu('Repetix la frase de pas', FRASE);
  fireEvent.click(screen.getByRole('button', { name: 'Crea el cofre' }));
  const codi = await screen.findByText(/^(?:[A-Z2-7]{4}-){6}[A-Z2-7]{2}$/);
  return codi.textContent;
}

async function confirmaCodi() {
  const continua = screen.getByRole('button', { name: 'Continua' });
  expect(continua.disabled).toBe(true);
  fireEvent.click(screen.getByLabelText('L’he apuntat en paper i el guarde en un lloc segur'));
  fireEvent.click(continua);
  await screen.findByText('El cofre és obert');
}

describe('la porta', () => {
  test('sense context segur, el cofre es nega a obrir-se i ho explica', async () => {
    munta({ segur: false });
    expect(await screen.findByText('El cofre no s’obri en esta adreça')).toBeTruthy();
    expect(within(porta()).getByText('No disponible')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Crea el cofre' })).toBeNull();
    expect(screen.queryByLabelText('Frase de pas nova')).toBeNull();
  });

  test('si el navegador no deixa obrir el magatzem (navegació privada), la porta ho diu i no oferix crear res', async () => {
    const privada = Object.assign(new Error('La base no està disponible.'), { name: 'InvalidStateError' });
    munta({ magatzem: { ...magatzemEnMemoria(), llegixMeta: async () => { throw privada; } } });
    expect(await screen.findByText('Este navegador no deixa desar el cofre')).toBeTruthy();
    expect(within(porta()).getByText('No disponible')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Crea el cofre' })).toBeNull();
  });

  test('crear: una frase feble o mal repetida no crea res; una bona mostra el codi UNA vegada', async () => {
    const { magatzem } = munta();
    await screen.findByRole('button', { name: 'Crea el cofre' });
    expect(within(porta()).getByText('Sense crear')).toBeTruthy();
    escriu('Frase de pas nova', 'curta');
    expect(screen.getByText('Massa curta')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Crea el cofre' }));
    expect(screen.getByLabelText('Frase de pas nova').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText(/almenys 12 caràcters o 4 paraules\./)).toBeTruthy();
    escriu('Frase de pas nova', FRASE);
    expect(screen.getByText('Molt bona')).toBeTruthy();
    escriu('Repetix la frase de pas', `${FRASE}!`);
    fireEvent.click(screen.getByRole('button', { name: 'Crea el cofre' }));
    expect(screen.getByText('Les dues frases no coincidixen.')).toBeTruthy();
    expect(magatzem.meta).toBeNull();
    escriu('Repetix la frase de pas', FRASE);
    fireEvent.click(screen.getByRole('button', { name: 'Crea el cofre' }));
    const codi = (await screen.findByText(/^(?:[A-Z2-7]{4}-){6}[A-Z2-7]{2}$/)).textContent;
    expect(screen.getByText('Apunta ara el codi de recuperació')).toBeTruthy();
    // Ni el codi ni la frase no es guarden enlloc.
    expect(JSON.stringify(magatzem.meta)).not.toContain(codi);
    expect(JSON.stringify(magatzem.meta)).not.toContain(FRASE);
    await confirmaCodi();
    expect(screen.queryByText(codi)).toBeNull();
    expect(within(porta()).getByText('Obert')).toBeTruthy();
  });

  test('obrir, bloquejar i equivocar-se de frase; el contingut només es pinta amb el cofre obert', async () => {
    munta({ contingut: () => <p>Contingut privat</p> });
    await creaPerPantalla();
    await confirmaCodi();
    expect(screen.getByText('Contingut privat')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Bloqueja' }));
    expect(await screen.findByText('Has bloquejat el cofre.')).toBeTruthy();
    expect(screen.queryByText('Contingut privat')).toBeNull();
    expect(within(porta()).getByText('Bloquejat')).toBeTruthy();
    const obri = screen.getByRole('button', { name: 'Obri el cofre' });
    expect(obri.disabled).toBe(true);
    escriu('Frase de pas', 'olivera vella del mas de baix');
    fireEvent.click(obri);
    expect((await screen.findByRole('alert')).textContent).toContain('La frase de pas no obri el cofre');
    escriu('Frase de pas', FRASE);
    fireEvent.click(screen.getByRole('button', { name: 'Obri el cofre' }));
    expect(await screen.findByText('Contingut privat')).toBeTruthy();
  });

  /* Integració de l'Onada 6 (261009): el contingut (l'Històric) no cap dins de la targeta del cofre. */
  test('obert: el contingut va fora de la targeta del cofre, i la gestió (còpies, frase i codi) en una targeta pròpia al final', async () => {
    munta({ contingut: () => <h2>Contingut privat</h2> });
    await creaPerPantalla();
    expect(screen.queryByText('Contingut privat')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Còpies i claus del cofre' })).toBeNull();
    await confirmaCodi();
    const contingut = screen.getByRole('heading', { name: 'Contingut privat' });
    const gestio = screen.getByRole('region', { name: 'Còpies i claus del cofre' });
    expect(porta().contains(contingut)).toBe(false);
    expect(gestio.contains(contingut)).toBe(false);
    expect(porta().compareDocumentPosition(contingut) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(contingut.compareDocumentPosition(gestio) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(porta()).getByRole('button', { name: 'Bloqueja' })).toBeTruthy();
    for (const seccio of ['Còpia de seguretat xifrada', 'Canvia la frase de pas', 'Codi de recuperació nou', 'Exporta sense xifrar']) {
      expect(within(gestio).getByRole('region', { name: seccio }), seccio).toBeTruthy();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Bloqueja' }));
    await screen.findByRole('button', { name: 'Obri el cofre' });
    expect(screen.queryByRole('region', { name: 'Còpies i claus del cofre' })).toBeNull();
    expect(screen.queryByText('Contingut privat')).toBeNull();
  });

  test('un cofre que ja és obert es pinta obert de seguida, sense «Comprovant el cofre…»', async () => {
    const entorn = entornFals();
    const temporitzadors = creaTemporitzadors();
    const cofre = creaCofreLocal({ magatzem: magatzemEnMemoria(), cripto: webcrypto, entorn, iteracions: 1000, temporitzadors, rellotge: temporitzadors.rellotge });
    oberts.push(cofre);
    await cofre.creaCofre(FRASE);
    render(<PortaCofre cofre={cofre}>{() => <p>Contingut privat</p>}</PortaCofre>);
    expect(screen.getByText('Contingut privat')).toBeTruthy();
    expect(screen.queryByText('Comprovant el cofre…')).toBeNull();
    expect(await screen.findByText('El cofre és obert')).toBeTruthy();
  });

  test('recuperar amb el codi: frase nova i codi nou, que es torna a mostrar una vegada', async () => {
    const { cofre } = munta();
    const primer = await creaPerPantalla();
    await confirmaCodi();
    fireEvent.click(screen.getByRole('button', { name: 'Bloqueja' }));
    fireEvent.click(await screen.findByRole('button', { name: 'He oblidat la frase de pas' }));
    escriu('Codi de recuperació', primer.toLowerCase());
    escriu('Frase de pas nova', NOVA);
    escriu('Repetix la frase de pas', NOVA);
    fireEvent.click(screen.getByRole('button', { name: 'Recupera el cofre' }));
    await screen.findByText('Apunta ara el codi de recuperació');
    const segon = screen.getByText(/^(?:[A-Z2-7]{4}-){6}[A-Z2-7]{2}$/).textContent;
    expect(segon).not.toBe(primer);
    expect(within(porta()).getByText(/clau de les dades renovada/)).toBeTruthy();
    await confirmaCodi();
    // El bloqueig següent torna a demanar la frase, no el codi.
    fireEvent.click(screen.getByRole('button', { name: 'Bloqueja' }));
    expect(await screen.findByRole('button', { name: 'Obri el cofre' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Recupera el cofre' })).toBeNull();
    await expect(cofre.obreCofre(FRASE)).rejects.toMatchObject({ codi: 'CONTRASENYA_ERRONIA' });
    await expect(cofre.obreAmbCodi(primer, FRASE)).rejects.toMatchObject({ codi: 'CODI_ERRONI' });
    await cofre.obreCofre(NOVA);
    expect(cofre.obert).toBe(true);
  });

  test('autobloqueig amb el codi sense confirmar: l’avís diu que s’ha perdut i, en tornar a obrir, demana fer-ne un altre', async () => {
    const { cofre, temporitzadors } = munta();
    const perdut = await creaPerPantalla();
    temporitzadors.avanca(10 * MINUT);
    const avis = await screen.findByText(/^El cofre s’ha bloquejat sol després de 10 minuts sense activitat\./);
    expect(avis.textContent).toContain(AVIS_CODI_PERDUT);
    expect(screen.queryByText(perdut)).toBeNull();
    escriu('Frase de pas', FRASE);
    fireEvent.click(screen.getByRole('button', { name: 'Obri el cofre' }));
    expect(await screen.findByText('Falta un codi de recuperació apuntat')).toBeTruthy();
    const seccio = screen.getByRole('region', { name: 'Codi de recuperació nou' });
    escriu('Frase de pas actual', FRASE, seccio);
    fireEvent.click(within(seccio).getByRole('button', { name: 'Fes un codi nou' }));
    const nou = (await screen.findByText(/^(?:[A-Z2-7]{4}-){6}[A-Z2-7]{2}$/)).textContent;
    expect(nou).not.toBe(perdut);
    await confirmaCodi();
    expect(screen.queryByText('Falta un codi de recuperació apuntat')).toBeNull();
    // El codi perdut ja no obri res; el nou, sí.
    cofre.bloqueja();
    await expect(cofre.obreAmbCodi(perdut, NOVA)).rejects.toMatchObject({ codi: 'CODI_ERRONI' });
    await cofre.obreAmbCodi(nou, NOVA);
    expect(cofre.obert).toBe(true);
  });

  test('canviar la frase amb la casella de sospita rota la clau i mostra un codi nou; sense, el codi continua', async () => {
    const { cofre } = munta();
    const primer = await creaPerPantalla();
    await confirmaCodi();
    let seccio = screen.getByRole('region', { name: 'Canvia la frase de pas' });
    escriu('Frase de pas actual', FRASE, seccio);
    escriu('Frase de pas nova', NOVA, seccio);
    escriu('Repetix la frase de pas', NOVA, seccio);
    fireEvent.click(within(seccio).getByRole('button', { name: 'Canvia la frase de pas' }));
    expect(await within(seccio).findByText(/^Frase de pas canviada\. Les dades no s’han tocat i el codi de recuperació continua valent/)).toBeTruthy();
    seccio = screen.getByRole('region', { name: 'Canvia la frase de pas' });
    escriu('Frase de pas actual', NOVA, seccio);
    escriu('Frase de pas nova', FRASE, seccio);
    escriu('Repetix la frase de pas', FRASE, seccio);
    fireEvent.click(within(seccio).getByLabelText(/^Algú pot conéixer la frase o el codi/));
    fireEvent.click(within(seccio).getByRole('button', { name: 'Canvia la frase de pas' }));
    await screen.findByText('Apunta ara el codi de recuperació');
    const segon = screen.getByText(/^(?:[A-Z2-7]{4}-){6}[A-Z2-7]{2}$/).textContent;
    expect(segon).not.toBe(primer);
    expect(within(porta()).getByText(/Frase de pas, clau de les dades i codi de recuperació renovats/)).toBeTruthy();
    await confirmaCodi();
    cofre.bloqueja();
    await expect(cofre.obreAmbCodi(primer, NOVA)).rejects.toMatchObject({ codi: 'CODI_ERRONI' });
    await expect(cofre.obreCofre(NOVA)).rejects.toMatchObject({ codi: 'CONTRASENYA_ERRONIA' });
    await cofre.obreCofre(FRASE);
    expect(cofre.obert).toBe(true);
  });

  test('autobloqueig: als 10 minuts sense activitat es tanca, ho diu, i el codi pendent desapareix', async () => {
    const { entorn, temporitzadors } = munta({ contingut: () => <p>Contingut privat</p> });
    await creaPerPantalla();
    await confirmaCodi();
    temporitzadors.avanca(10 * MINUT);
    expect(await screen.findByText('El cofre s’ha bloquejat sol després de 10 minuts sense activitat.')).toBeTruthy();
    expect(screen.queryByText('Contingut privat')).toBeNull();
    // Un codi nou a mig apuntar: pagehide el fa desaparéixer amb la clau.
    escriu('Frase de pas', FRASE);
    fireEvent.click(screen.getByRole('button', { name: 'Obri el cofre' }));
    await screen.findByText('El cofre és obert');
    const seccio = screen.getByRole('region', { name: 'Codi de recuperació nou' });
    escriu('Frase de pas actual', FRASE, seccio);
    fireEvent.click(within(seccio).getByRole('button', { name: 'Fes un codi nou' }));
    const codi = (await screen.findByText(/^(?:[A-Z2-7]{4}-){6}[A-Z2-7]{2}$/)).textContent;
    entorn.dispatchEvent(new Event('pagehide'));
    expect((await screen.findByText(/^El cofre s’ha bloquejat en eixir de la pàgina\./)).textContent).toContain(AVIS_CODI_PERDUT);
    expect(screen.queryByText(codi)).toBeNull();
  });
});

describe('còpies', () => {
  test('la còpia xifrada es descarrega sense res en clar', async () => {
    const { cofre, descarrega } = munta();
    await creaPerPantalla();
    await confirmaCodi();
    await cofre.desa('classificacions', '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b', { proveidor: SENTINELLA });
    fireEvent.click(screen.getByRole('button', { name: 'Descarrega la còpia xifrada' }));
    await waitFor(() => expect(descarrega).toHaveBeenCalledTimes(1));
    const [{ nom, tipus, dades }] = descarrega.mock.calls[0];
    expect(nom).toMatch(/^cofre-gestoria-\d{8}-\d{4}\.json$/);
    expect(tipus).toBe('application/json');
    const text = new TextDecoder().decode(dades);
    expect(text).toContain('sdp.gestoria.cofre.copia');
    expect(text).not.toContain(SENTINELLA);
    expect(await screen.findByText(/xifrada\. Guarda-la també fora d’este ordinador\./)).toBeTruthy();
  });

  test('l’exportació en clar demana la casella i la frase; sense, el botó no fa res', async () => {
    const { cofre, descarrega } = munta();
    await creaPerPantalla();
    await confirmaCodi();
    await cofre.desa('classificacions', '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b', { proveidor: SENTINELLA });
    const seccio = screen.getByRole('region', { name: 'Exporta sense xifrar' });
    const boto = within(seccio).getByRole('button', { name: 'Descarrega sense xifrar' });
    expect(boto.disabled).toBe(true);
    escriu('Frase de pas actual', FRASE, seccio);
    expect(boto.disabled).toBe(true);
    fireEvent.click(within(seccio).getByLabelText('Entenc que el fitxer ix sense xifrar'));
    expect(boto.disabled).toBe(false);
    fireEvent.click(boto);
    await waitFor(() => expect(descarrega).toHaveBeenCalledTimes(1));
    const [{ nom, dades }] = descarrega.mock.calls[0];
    expect(nom).toMatch(/^cofre-gestoria-SENSE-XIFRAR-\d{8}-\d{4}\.json$/);
    expect(new TextDecoder().decode(dades)).toContain(SENTINELLA);
  });

  test('res no passa per l’emmagatzematge del navegador ni per les galetes', async () => {
    const escriuStorage = vi.spyOn(Storage.prototype, 'setItem');
    munta();
    await creaPerPantalla();
    await confirmaCodi();
    fireEvent.click(screen.getByRole('button', { name: 'Bloqueja' }));
    escriu('Frase de pas', FRASE);
    fireEvent.click(await screen.findByRole('button', { name: 'Obri el cofre' }));
    await screen.findByText('El cofre és obert');
    expect(escriuStorage).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
  });
});
