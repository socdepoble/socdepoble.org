/* Finestreta · la vista «Identitat i Finestreta» darrere del cofre xifrat.
   Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H). Tot de veres, com
   historic/HistoricCofre.test.jsx: l'export per defecte, la porta i el hook
   del cofre, cofre.js amb WebCrypto de Node i el magatzem de producció damunt
   d'un IndexedDB fals (tests/helpers/idbFals.js), la porta d'aprovació amb el
   catàleg del manifest i un autenticador WebAuthn simulat. Es mira: sense
   cofre obert, res; sense aprovació, «Cal aprovar el tractor»; la taula abans
   de llegir, amb els opacs marcats de colp sense llegir-ne cap; els valors
   amagats fins a l'ull; confirmar desa xifrat i només
   el confirmat; la Finestreta copia dins del clic i imprimix un esborrany; el
   bloqueig ho buida; cap títol porta dades; i (Front 6) «D’on ix» amb el
   tipus, la data, la regla i l'empremta de cada paper, i els dos passos per a
   obrir-lo. Papers sintètics; el NIF es genera calculant-ne la lletra. */
import { createHash, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext';
import { creaAutenticadorSimulat } from '../../../../tests/helpers/autenticadorSimulat.js';
import { creaIdbFals } from '../../../../tests/helpers/idbFals.js';
import { crearMagatzemMemoria } from '../../tractors/nucli/magatzem.js';
import { construixTractor, empremtaDe } from '../../tractors/registreTractors.js';
import { ID_UNIC, creaCofreLocal, persistenciaDelCofre } from '../cofre/cofre.js';
import { NOM_BD_COFRE } from '../cofre/magatzemCofre.js';
import { TRACTOR_IDENTITAT } from '../tractors.js';
import Finestreta, {
  AVIS_SENSE_SIGNAR, COLLECCIO_IDENTITAT, ETIQUETES_CAMPS, ETIQUETES_TIPUS_PAPER, TITULAR_FINESTRETA, autorDe, valorEnText
} from './Finestreta.jsx';
import { TIPUS_DOCUMENT_IDENTITAT } from './nucli/filtreDocuments.js';
import { afegixRepresentacio, afegixTitular, entraAMa, fitxaBuida, nouIdFitxa, perAlCofre } from './nucli/fitxaIdentitat.js';
import { FORMULARIS, VERIFICAR } from './nucli/formularisFinestreta.js';
import { LIMITS_IDENTITAT } from './nucli/tractorIdentitat.js';
import { CAMPS_IDENTITAT } from './nucli/validadorsIdentitat.js';

const subtle = webcrypto.subtle;
const ARA = Date.UTC(2026, 9, 13, 14, 0, 0);
const rellotge = () => ARA;
const FRASE = 'olivera vella del mas de dalt';
const autenticador = await creaAutenticadorSimulat({ subtle });
const TEXTOS = new Map([...TRACTOR_IDENTITAT.fonts, TRACTOR_IDENTITAT.fitxa].map((ruta) => [ruta, readFileSync(path.join(process.cwd(), ruta), 'utf8')]));
const TRACTORS = Object.freeze([construixTractor(TRACTOR_IDENTITAT, TEXTOS)]);
const INFO = await empremtaDe(TRACTORS[0], subtle);
const entornTractors = { location: { origin: autenticador.origen, hostname: autenticador.rpId }, crypto: webcrypto };

const LLETRES = 'TRWAGMYFPDXBNJZSQVHLCKE';
const dni = (n) => `${String(n).padStart(8, '0')}${LLETRES[n % 23]}`;
const PERSONA = dni(16180339);
const VIDA_LABORAL = [
  'INFORME DE VIDA LABORAL',
  'TEXT SENTINELLA PRIVAT',
  'Nombre y apellidos: FERRANDO PUIG, ROSA',
  `D.N.I.: ${PERSONA}`,
  'Fecha de nacimiento: 15/03/1975'
].join('\n');
const RUTES = Object.freeze({
  vida: '01_Identitat_Legal/251003_vida_laboral.txt',
  opac: '01_Identitat_Legal/escanejat_0001.txt',
  salut: '01_Identitat_Legal/informe_medico.txt'
});
/* Un segon opac, fora de RUTES: la prova del front D compta cada nom de RUTES a la taula. */
const OPAC2 = '01_Identitat_Legal/escanejat_0002.txt';
const PRIVATS = ['ROSA', 'FERRANDO', 'PUIG', PERSONA, 'SENTINELLA'];
const fitxer = (ruta, text) => {
  const dades = new TextEncoder().encode(text);
  return { name: ruta.split('/').pop(), size: dades.length, webkitRelativePath: `gestoria/${ruta}`, arrayBuffer: vi.fn(async () => dades.slice().buffer) };
};

/* La finestra i el document del cofre, amb els esdeveniments de veres. */
function entornCofre() {
  const finestra = new EventTarget();
  const doc = new EventTarget();
  doc.visibilityState = 'visible';
  finestra.document = doc;
  finestra.isSecureContext = true;
  return finestra;
}
/* Temporitzadors que no avancen sols: l'autobloqueig no salta durant la prova. */
const temporitzadors = { setTimeout: () => 0, clearTimeout: () => {} };

const oberts = [];
function creaCofre() {
  const idb = creaIdbFals();
  const cofre = creaCofreLocal({ idb, cripto: webcrypto, entorn: entornCofre(), iteracions: 1000, temporitzadors, rellotge });
  oberts.push(cofre);
  return { cofre, idb };
}

afterEach(() => {
  cleanup();
  oberts.splice(0).forEach((cofre) => cofre.tanca());
  vi.restoreAllMocks();
});

async function magatzemAprovat() {
  const magatzem = crearMagatzemMemoria();
  await magatzem.afegixClau(autenticador.clau);
  await magatzem.afegixRegistre(await autenticador.signa({
    manifest: TRACTOR_IDENTITAT, empremta: INFO.empremta, ara: ARA - 60000, nonce: new Uint8Array(16).fill(6)
  }));
  return magatzem;
}

async function munta({ cofre, magatzem, titular = null, entorn = entornTractors } = {}) {
  const copia = vi.fn(() => Promise.resolve());
  const imprimix = vi.fn();
  const obriPaper = vi.fn();
  const vista = render(
    <MemoryRouter rutaInicial="/app/gestoria/identitat">
      <Finestreta cofre={cofre} titular={titular} magatzem={magatzem ?? await magatzemAprovat()} subtle={subtle} tractors={TRACTORS}
        entorn={entorn} rellotge={rellotge} copia={copia} imprimix={imprimix} obriPaper={obriPaper} />
    </MemoryRouter>
  );
  return { ...vista, copia, imprimix, obriPaper };
}

async function cofreObert() {
  const propi = creaCofre();
  await propi.cofre.creaCofre(FRASE);
  return propi;
}

const ETIQUETA_CARPETA = 'Tria la carpeta arrel de la Gestoria';

/* Tria la carpeta, marca l'opac i llig: fins a les propostes. */
async function lligPapers() {
  const input = await screen.findByLabelText(ETIQUETA_CARPETA, {}, { timeout: 5000 });
  const llista = [fitxer(RUTES.vida, VIDA_LABORAL), fitxer(RUTES.opac, VIDA_LABORAL), fitxer(RUTES.salut, VIDA_LABORAL)];
  fireEvent.change(input, { target: { files: llista } });
  const casella = await screen.findByRole('checkbox', { name: `Llig-lo: ${RUTES.opac}` }, { timeout: 5000 });
  fireEvent.click(casella);
  fireEvent.click(screen.getByRole('button', { name: 'Llig els 2 papers' }));
  await screen.findByRole('heading', { level: 2, name: 'Propostes per revisar' }, { timeout: 5000 });
  return llista;
}

/* Revisió adversarial 13-10-2026, troballa A11Y-1 (WCAG 2.5.3, «Label in Name»): el nom accessible de cada
   control amb aria-label comença pel text que es veu (el del botó o el de l'etiqueta de la casella), perquè
   qui dona ordres de veu («clica Llig-lo») el trobe. L'única altra forma admesa és la del botó de CampFitxer,
   «etiqueta del camp: verb», que comença per l'etiqueta visible del camp i acaba pel text del botó. Torna els
   que no ho complixen. */
const textNet = (text) => text.replace(/\s+/g, ' ').trim();
function nomsSenseEtiquetaVisible(container) {
  const etiquetes = [...container.querySelectorAll('label')].map((l) => textNet(l.textContent)).filter(Boolean);
  const fallades = [];
  for (const control of container.querySelectorAll('button, input, select, textarea')) {
    const nom = control.getAttribute('aria-label');
    if (nom === null) continue;
    const visible = textNet(control.matches('button') ? control.textContent : [...(control.labels ?? [])].map((l) => l.textContent).join(' '));
    const delCamp = nom.endsWith(`: ${visible}`) && etiquetes.some((etiqueta) => nom.startsWith(`${etiqueta}: `) || nom.startsWith(`${etiqueta} (obligatori): `));
    if (visible && !nom.startsWith(visible) && !delCamp) fallades.push(`«${visible}» → «${nom}»`);
  }
  return fallades;
}

/* Cap títol (h1-h6) porta un nom de paper ni cap valor: l'Índex els escriu a l'adreça. */
function titolsNets() {
  for (const titol of screen.getAllByRole('heading')) {
    for (const privat of [...PRIVATS, '01_Identitat_Legal', '.txt']) expect(titol.textContent, privat).not.toContain(privat);
  }
}

describe('les peces pures de la vista', () => {
  test('cada camp de la fitxa té el seu nom en valencià', () => {
    expect(Object.keys(CAMPS_IDENTITAT).filter((camp) => !ETIQUETES_CAMPS[camp])).toEqual([]);
  });

  test('cada tipus de paper del filtre té el seu nom en valencià a «D’on ix», i cap més', () => {
    expect(Object.keys(ETIQUETES_TIPUS_PAPER).sort()).toEqual([...TIPUS_DOCUMENT_IDENTITAT].sort());
  });

  test('l’autoria: la persona de la sessió amb la seua pàgina, o la veritat sense configurar', () => {
    expect(autorDe(null)).toBe(TITULAR_FINESTRETA);
    expect(autorDe({ nom: '  ' })).toBe(TITULAR_FINESTRETA);
    expect(autorDe({ nom: 'Rosa Ferrando', poble: 'La Torre de les Maçanes', avatar: null }))
      .toEqual({ nom: 'Rosa Ferrando', poble: 'La Torre de les Maçanes', avatar: null, href: '/el-meu-perfil' });
  });

  test('els valors en text: imports en euros, dates dd/mm/aaaa, la resta tal qual', () => {
    expect(valorEnText('seguretatSocial.baseCotitzacio', 123456)).toBe('1.234,56 €');
    expect(valorEnText('identificacio.dataNaixement', '1975-03-15')).toBe('15/03/1975');
    expect(valorEnText('identificacio.nom', 'Rosa')).toBe('Rosa');
  });
});

describe('les portes', () => {
  test('sense cofre: només el títol i la porta del cofre; la boina diu la veritat', async () => {
    const { cofre } = creaCofre();
    const { container } = await munta({ cofre });
    expect(await screen.findByRole('button', { name: 'Crea el cofre' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Identitat i Finestreta');
    expect(screen.getByRole('region', { name: 'Cofre xifrat' })).toBeTruthy();
    expect(screen.queryByLabelText(ETIQUETA_CARPETA)).toBeNull();
    expect(screen.queryByText('Cal aprovar el tractor')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Mostra les dades' })).toBeNull();
    expect(container.textContent).toContain('Titular sense configurar');
  });

  test('la persona de la sessió signa la boina', async () => {
    const { cofre } = await cofreObert();
    const { container } = await munta({ cofre, titular: { nom: 'Rosa Ferrando', poble: 'La Torre de les Maçanes', avatar: null } });
    await screen.findByLabelText(ETIQUETA_CARPETA, {}, { timeout: 5000 });
    expect(container.textContent).toContain('Rosa Ferrando');
    expect(container.textContent).not.toContain('Titular sense configurar');
  });

  test('amb el cofre obert i sense l’aprovació: «Cal aprovar el tractor» i cap selector', async () => {
    const { cofre } = await cofreObert();
    await munta({ cofre, magatzem: crearMagatzemMemoria() });
    expect(await screen.findByText('Cal aprovar el tractor', {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.queryByLabelText(ETIQUETA_CARPETA)).toBeNull();
    /* La fitxa i la Finestreta són codi del tractor: sense l'aprovació, tampoc es pinten. */
    expect(screen.queryByRole('heading', { level: 2, name: 'La teua fitxa' })).toBeNull();
    expect(screen.queryByRole('heading', { level: 2, name: 'Finestreta' })).toBeNull();
  });
});

describe('de la carpeta a la fitxa', () => {
  test('la taula abans de llegir, els valors amagats fins a l’ull, i confirmar desa xifrat només el confirmat', async () => {
    const { cofre, idb } = await cofreObert();
    const { container } = await munta({ cofre });
    const input = await screen.findByLabelText(ETIQUETA_CARPETA, {}, { timeout: 5000 });
    const llista = [fitxer(RUTES.vida, VIDA_LABORAL), fitxer(RUTES.opac, VIDA_LABORAL), fitxer(RUTES.salut, VIDA_LABORAL)];
    fireEvent.change(input, { target: { files: llista } });
    const taula = await screen.findByRole('region', { name: 'Els papers de la carpeta i la decisió' }, { timeout: 5000 });
    expect(within(taula).getByText(RUTES.salut).closest('tr').textContent).toContain('No s’obrirà');
    expect(within(taula).getByText(RUTES.vida).closest('tr').textContent).toContain('Es llegirà');
    /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D): en la pàgina sencera (text i atributs), el nom de
       cada paper només és a la taula de la decisió; la línia d'estat del selector (CampFitxer, nomsVisibles={false})
       només en diu el recompte. */
    const vegades = (node, nom) => new XMLSerializer().serializeToString(node).split(nom).length - 1;
    for (const ruta of Object.values(RUTES)) {
      const nom = ruta.split('/').pop();
      expect(vegades(taula, nom), nom).toBeGreaterThan(0);
      expect(vegades(container, nom), nom).toBe(vegades(taula, nom));
      expect(container.textContent.split(nom).length - 1, nom).toBe(taula.textContent.split(nom).length - 1);
    }
    expect(screen.getByLabelText(ETIQUETA_CARPETA).closest('.sdp-camp-fitxer').querySelector('.sdp-camp-fitxer__estat').textContent)
      .toBe('3 fitxers');
    expect(llista.some((f) => f.arrayBuffer.mock.calls.length)).toBe(false);
    fireEvent.click(screen.getByRole('checkbox', { name: `Llig-lo: ${RUTES.opac}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Llig els 2 papers' }));
    await screen.findByRole('heading', { level: 2, name: 'Propostes per revisar' }, { timeout: 5000 });
    expect(llista.map((f) => f.arrayBuffer.mock.calls.length)).toEqual([1, 1, 0]);

    /* Amb l'ull tancat, cap valor és al DOM. */
    for (const privat of PRIVATS) expect(container.textContent, privat).not.toContain(privat);
    expect(screen.getAllByText('Valor amagat').length).toBeGreaterThan(3);
    const ull = screen.getByRole('button', { name: 'Mostra les dades' });
    expect(ull.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(ull);
    expect(container.textContent).toContain('FERRANDO');
    titolsNets();

    fireEvent.click(screen.getByRole('button', { name: 'Confirma Nom' }));
    const fitxa = await screen.findByRole('region', { name: 'La teua fitxa · Persona titular' });
    expect(within(fitxa).getByText('ROSA')).toBeTruthy();
    const persistencia = persistenciaDelCofre(cofre, COLLECCIO_IDENTITAT);
    await waitFor(async () => {
      const desada = await persistencia.llig();
      expect(Object.keys(desada?.titulars?.[0]?.camps ?? {})).toEqual(['identificacio.nom']);
    }, { timeout: 5000 });
    const desada = await persistencia.llig();
    expect(desada.titulars[0].camps['identificacio.nom']).toMatchObject({ valor: 'ROSA', estat: 'confirmat' });
    expect(JSON.stringify(desada)).not.toContain(PERSONA);
    /* A l'IndexedDB, només bytes xifrats. */
    const registres = idb.files(NOM_BD_COFRE, 'registres');
    expect(registres.map((r) => [r.colleccio, r.id])).toEqual([[COLLECCIO_IDENTITAT, ID_UNIC]]);
    const bolcat = JSON.stringify([...idb.bases.keys()].map((nom) => [nom, idb.files(nom, 'meta'), idb.files(nom, 'registres')]));
    for (const clar of ['FERRANDO', 'identificacio', 'Persona titular', 'confirmat', RUTES.vida, PERSONA]) expect(bolcat, clar).not.toContain(clar);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    titolsNets();
  });

  test('els opacs de colp: «Marca tots els pendents» i «Desmarca tots», amb l’anunci, el focus al germà i cap casella per al de salut', async () => {
    const { cofre } = await cofreObert();
    const { container } = await munta({ cofre });
    const input = await screen.findByLabelText(ETIQUETA_CARPETA, {}, { timeout: 5000 });
    const llista = [fitxer(RUTES.vida, VIDA_LABORAL), fitxer(RUTES.opac, VIDA_LABORAL), fitxer(OPAC2, VIDA_LABORAL), fitxer(RUTES.salut, VIDA_LABORAL)];
    fireEvent.change(input, { target: { files: llista } });
    const grup = await screen.findByRole('group', { name: 'Papers de nom opac' }, { timeout: 5000 });
    const casella = (ruta) => screen.getByRole('checkbox', { name: `Llig-lo: ${ruta}` });
    const boto = (nom) => within(grup).getByRole('button', { name: nom });
    expect(boto('Desmarca tots').disabled).toBe(true);

    /* Amb un opac marcat a mà, el botó compta només els pendents. */
    fireEvent.click(casella(RUTES.opac));
    expect(boto('Marca tots els pendents (1)').disabled).toBe(false);
    fireEvent.click(casella(RUTES.opac));

    const marca = boto('Marca tots els pendents (2)');
    marca.focus();
    fireEvent.click(marca);
    expect(casella(RUTES.opac).checked).toBe(true);
    expect(casella(OPAC2).checked).toBe(true);
    expect(screen.getByRole('button', { name: 'Llig els 3 papers' })).toBeTruthy();
    expect(boto('Marca tots els pendents (0)').disabled).toBe(true);
    const anunci = screen.getByText('Marcats 2 papers de nom opac: encara no se n’ha llegit cap.');
    expect(anunci.getAttribute('role')).toBe('status');
    /* El botó clicat s'ha desactivat: el focus passa al germà, no al body. */
    expect(document.activeElement).toBe(boto('Desmarca tots'));
    /* Marcar no és llegir; el de salut no té casella; cap nom de paper al grup ni a l'anunci. */
    expect(llista.some((f) => f.arrayBuffer.mock.calls.length)).toBe(false);
    const taula = screen.getByRole('region', { name: 'Els papers de la carpeta i la decisió' });
    expect(within(within(taula).getByText(RUTES.salut).closest('tr')).queryByRole('checkbox')).toBeNull();
    for (const ruta of [...Object.values(RUTES), OPAC2]) {
      const nom = ruta.split('/').pop();
      expect(grup.textContent, nom).not.toContain(nom);
      expect(anunci.textContent, nom).not.toContain(nom);
    }
    expect(nomsSenseEtiquetaVisible(container)).toEqual([]);

    fireEvent.click(boto('Desmarca tots'));
    expect(casella(RUTES.opac).checked).toBe(false);
    expect(casella(OPAC2).checked).toBe(false);
    expect(screen.getByRole('button', { name: 'Llig el paper' })).toBeTruthy();
    expect(anunci.textContent).toBe('Desmarcats tots els papers de nom opac.');
    expect(boto('Desmarca tots').disabled).toBe(true);
    expect(document.activeElement).toBe(boto('Marca tots els pendents (2)'));
    expect(llista.some((f) => f.arrayBuffer.mock.calls.length)).toBe(false);
  });

  test('més papers dels que es lligen de colp: la nota al costat de «Llig…», també a l’anunci, i cap llegit', async () => {
    const { cofre } = await cofreObert();
    await munta({ cofre });
    const input = await screen.findByLabelText(ETIQUETA_CARPETA, {}, { timeout: 5000 });
    const n = LIMITS_IDENTITAT.fitxers + 1;
    const ruta = (i) => `01_Identitat_Legal/escanejat_${String(i).padStart(4, '0')}.txt`;
    const llista = Array.from({ length: n }, (_, i) => fitxer(ruta(i), 'res'));
    fireEvent.change(input, { target: { files: llista } });
    const grup = await screen.findByRole('group', { name: 'Papers de nom opac' }, { timeout: 5000 });
    fireEvent.click(within(grup).getByRole('button', { name: `Marca tots els pendents (${n})` }));
    const avis = `Com a molt ${LIMITS_IDENTITAT.fitxers} papers de colp: n’hi ha ${n} per llegir. Desmarca’n algun.`;
    const nota = screen.getByText(avis);
    expect(screen.getByRole('button', { name: `Llig els ${n} papers` }).getAttribute('aria-describedby')).toBe(nota.id);
    expect(screen.getByText(`Marcats ${n} papers de nom opac: encara no se n’ha llegit cap. ${avis}`).getAttribute('role')).toBe('status');
    expect(llista.some((f) => f.arrayBuffer.mock.calls.length)).toBe(false);

    /* Un de menys i ja hi cap: la nota se'n va. */
    fireEvent.click(screen.getByRole('checkbox', { name: `Llig-lo: ${ruta(0)}` }));
    expect(document.getElementById(nota.id)).toBeNull();
    expect(screen.getByRole('button', { name: `Llig els ${LIMITS_IDENTITAT.fitxers} papers` }).hasAttribute('aria-describedby')).toBe(false);
  });

  test('la Finestreta: copia dins del clic, l’esborrany només amb l’ull obert, i diu que no signa ni presenta', async () => {
    const { cofre } = await cofreObert();
    const { copia, imprimix, container } = await munta({ cofre });
    await lligPapers();
    fireEvent.click(screen.getByRole('button', { name: 'Confirma Nom' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirma Primer cognom' }));
    await screen.findByRole('region', { name: 'La teua fitxa · Persona titular' });
    expect(container.textContent).toContain(AVIS_SENSE_SIGNAR);
    expect(container.textContent).toContain(VERIFICAR);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(FORMULARIS.map((f) => f.nom));

    const imprimir = screen.getByRole('button', { name: 'Esborrany per imprimir' });
    expect(imprimir.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Copia «Nom»' }));
    /* Dins del mateix clic: el porta-retalls ja s'ha demanat, amb el valor encara amagat a la pantalla. */
    expect(copia).toHaveBeenCalledWith('ROSA');
    expect(await screen.findByText('Copiat: Nom.')).toBeTruthy();
    expect(container.textContent).not.toContain('ROSA');
    /* Els camps que no són confirmats no tenen «Copia». */
    expect(screen.queryByRole('button', { name: 'Copia «NIF o NIE»' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Mostra les dades' }));
    expect(screen.getByRole('button', { name: 'Esborrany per imprimir' }).disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Esborrany per imprimir' }));
    expect(imprimix).toHaveBeenCalledTimes(1);
    titolsNets();
  });

  test('la representació només omple el formulari de l’entitat: als altres, la persona no és la seua pròpia representant', async () => {
    const { cofre } = await cofreObert();
    const ara = new Date(ARA).toISOString();
    const persona = nouIdFitxa('tit', new Uint8Array(8).fill(1));
    const entitat = nouIdFitxa('tit', new Uint8Array(8).fill(2));
    const representacio = nouIdFitxa('rep', new Uint8Array(8).fill(4));
    let fitxa = afegixTitular(fitxaBuida(), { id: persona, tipus: 'persona', ambit: 'LLAR', alies: 'Persona titular' }, { ara });
    fitxa = afegixTitular(fitxa, { id: entitat, tipus: 'entitat', ambit: 'ENTITAT', alies: 'Entitat representada' }, { ara });
    fitxa = afegixRepresentacio(fitxa, { id: representacio, representant: persona, representat: entitat }, { ara });
    fitxa = entraAMa(fitxa, { titular: persona, camp: 'identificacio.nif', valor: PERSONA }, { ara });
    fitxa = entraAMa(fitxa, { titular: representacio, camp: 'representacio.carrec', valor: 'president' }, { ara });
    await persistenciaDelCofre(cofre, COLLECCIO_IDENTITAT).desa(perAlCofre(fitxa));
    const { copia } = await munta({ cofre });
    await screen.findByRole('region', { name: 'La teua fitxa · Persona titular' }, { timeout: 5000 });
    /* La sol·licitud genèrica (la pestanya activa): el NIF de la persona sí; el del representant, no. */
    const generica = screen.getByRole('region', { name: `Camps · ${FORMULARIS[0].nom}` });
    expect(within(generica).getByText('NIF del representant (opcional)').closest('tr').textContent).toContain('Falta a la fitxa');
    expect(within(generica).queryByRole('button', { name: 'Copia «NIF del representant»' })).toBeNull();
    fireEvent.click(within(generica).getByRole('button', { name: 'Copia «NIF o NIE»' }));
    expect(copia).toHaveBeenLastCalledWith(PERSONA);
    /* El de la representació d'una entitat sí que porta la persona com a representant. */
    const entitatForm = FORMULARIS.find((f) => f.id === 'representacio-entitat');
    fireEvent.click(screen.getByRole('tab', { name: entitatForm.nom }));
    const delEntitat = screen.getByRole('region', { name: `Camps · ${entitatForm.nom}` });
    fireEvent.click(within(delEntitat).getByRole('button', { name: 'Copia «NIF del representant»' }));
    expect(copia).toHaveBeenLastCalledWith(PERSONA);
    expect(within(delEntitat).getByText('Càrrec').closest('tr').textContent).toContain('Llest');
  });

  test('A11Y-1: el nom accessible de cada control comença pel text que es veu (WCAG 2.5.3)', async () => {
    const { cofre } = await cofreObert();
    const ara = new Date(ARA).toISOString();
    const persona = nouIdFitxa('tit', new Uint8Array(8).fill(1));
    let fitxa = afegixTitular(fitxaBuida(), { id: persona, tipus: 'persona', ambit: 'LLAR', alies: 'Persona titular' }, { ara });
    fitxa = entraAMa(fitxa, { titular: persona, camp: 'identificacio.nom', valor: 'MARIA' }, { ara });
    await persistenciaDelCofre(cofre, COLLECCIO_IDENTITAT).desa(perAlCofre(fitxa));
    const { container } = await munta({ cofre });
    await screen.findByRole('region', { name: 'La teua fitxa · Persona titular' }, { timeout: 5000 });

    /* La taula «Què llegiré i què no», amb la casella «Llig-lo» del paper opac. */
    const input = await screen.findByLabelText(ETIQUETA_CARPETA, {}, { timeout: 5000 });
    fireEvent.change(input, { target: { files: [fitxer(RUTES.vida, VIDA_LABORAL), fitxer(RUTES.opac, VIDA_LABORAL)] } });
    const casella = await screen.findByRole('checkbox', { name: `Llig-lo: ${RUTES.opac}` }, { timeout: 5000 });
    /* I els botons de la marca de colp, que es diuen pel seu text. */
    expect(screen.getByRole('group', { name: 'Papers de nom opac' })).toBeTruthy();
    expect(nomsSenseEtiquetaVisible(container)).toEqual([]);

    /* Els papers diuen un altre nom que el confirmat: «Confirma este» i «Rebutja’l» a la fitxa, i les propostes. */
    fireEvent.click(casella);
    fireEvent.click(screen.getByRole('button', { name: 'Llig els 2 papers' }));
    await screen.findByRole('heading', { level: 2, name: 'Propostes per revisar' }, { timeout: 5000 });
    expect(screen.getByRole('button', { name: 'Confirma este: valor nou de Nom' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rebutja’l: valor nou de Nom' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Confirma Primer cognom' })).toBeTruthy();
    expect(nomsSenseEtiquetaVisible(container)).toEqual([]);
  });

  test('un valor corregit a mà queda confirmat; un NIF en un camp de nom no hi entra', async () => {
    const { cofre } = await cofreObert();
    await munta({ cofre });
    await lligPapers();
    fireEvent.click(screen.getByRole('button', { name: 'Corregix Primer cognom' }));
    const camp = screen.getByLabelText('Valor correcte: Primer cognom');
    fireEvent.change(camp, { target: { value: PERSONA } });
    fireEvent.click(screen.getByRole('button', { name: 'Desa’l a mà' }));
    expect(await screen.findByText(/no té una forma vàlida|identificador personal/)).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'La teua fitxa · Persona titular' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Valor correcte: Primer cognom'), { target: { value: 'Ferrando' } });
    fireEvent.click(screen.getByRole('button', { name: 'Desa’l a mà' }));
    const fitxa = await screen.findByRole('region', { name: 'La teua fitxa · Persona titular' });
    expect(within(fitxa).getByText('Entrat a mà')).toBeTruthy();
  });
});

/* Front 6 (ordre del Mestre del 14-10-2026, pla 261013_1930: «Fitxa + obrir el PDF», per a resoldre els camps en
   conflicte): a «D’on ix», cada paper és un <details> amb la ruta (mai en un títol), el tipus, la data del nom, la
   regla i l'empremta curta; i dos passos, «Comprova el paper» (asíncron) i «Obri’l en una pestanya» (obriPaper DINS
   del clic), tots dos desactivats amb l'ull tancat. L'URL de l'entorn és falsa: es veu què es crea i què es revoca. */
const empremta = (text) => createHash('sha256').update(new TextEncoder().encode(text)).digest('hex');
function urlFals() {
  let n = 0;
  return { createObjectURL: vi.fn(() => `blob:paper-${++n}`), revokeObjectURL: vi.fn() };
}
/* El <details> d'un paper a la fila d'un camp de les propostes, obert (el desplegament no és cosa de la prova). */
function paperDe(etiqueta, ruta) {
  const fila = within(screen.getByRole('region', { name: 'Propostes · Persona titular' })).getByText(etiqueta).closest('tr');
  const detalls = [...fila.querySelectorAll('details')].find((d) => d.querySelector('summary').textContent === ruta);
  detalls.open = true;
  return detalls;
}
const dadesDe = (detalls) => Object.fromEntries([...detalls.querySelectorAll('dt')].map((dt) => [dt.textContent, dt.nextElementSibling.textContent]));
const PAPER_CANVIAT = 'Este paper no és el que es va llegir: ha canviat o és d’una altra carpeta.';

describe('«D’on ix»: el paper d’on ix cada valor (Front 6)', () => {
  test('cada paper és un <details> amb la ruta al <summary>, mai en un títol, i a dins el tipus, la data, la regla i l’empremta curta', async () => {
    const { cofre } = await cofreObert();
    const { container } = await munta({ cofre });
    await lligPapers();
    const vida = paperDe('NIF o NIE', RUTES.vida);
    const opac = paperDe('NIF o NIE', RUTES.opac);
    expect(vida.closest('h1, h2, h3, h4, h5, h6')).toBeNull();
    expect(dadesDe(vida)).toEqual({
      Paper: 'Vida laboral', 'Data del paper': '03/10/2025', 'Regla que l’ha trobat': 'nif-persona', Empremta: empremta(VIDA_LABORAL).slice(0, 8)
    });
    /* El paper de nom opac no porta data al nom. */
    expect(dadesDe(opac)).toEqual({
      Paper: 'Paper de tipus desconegut (nom opac)', 'Regla que l’ha trobat': 'nif-persona', Empremta: empremta(VIDA_LABORAL).slice(0, 8)
    });
    /* Amb l'ull tancat, cap valor de la persona: la ruta ja hi era, i la resta és de la font. */
    for (const privat of PRIVATS) expect(container.textContent, privat).not.toContain(privat);
    titolsNets();
  });

  test('dos passos: «Comprova el paper» i «Obri’l en una pestanya», que crida obriPaper dins del clic; tots dos desactivats amb l’ull tancat', async () => {
    const { cofre } = await cofreObert();
    const url = urlFals();
    const { container, obriPaper } = await munta({ cofre, entorn: { ...entornTractors, URL: url } });
    await lligPapers();
    const vida = paperDe('NIF o NIE', RUTES.vida);
    const comprova = within(vida).getByRole('button', { name: `Comprova el paper: ${RUTES.vida}` });
    const obri = within(vida).getByRole('button', { name: `Obri’l en una pestanya: ${RUTES.vida}` });
    expect(comprova.disabled).toBe(true);
    expect(obri.disabled).toBe(true);
    expect(vida.textContent).toContain('Obri l’ull de la barra per a comprovar-lo i obrir-lo.');

    const ull = screen.getByRole('button', { name: 'Mostra les dades' });
    fireEvent.click(ull);
    expect(comprova.disabled).toBe(false);
    expect(obri.disabled).toBe(true);
    comprova.focus();
    fireEvent.click(comprova);
    await waitFor(() => expect(obri.disabled).toBe(false), { timeout: 5000 });
    expect(url.createObjectURL).toHaveBeenCalledTimes(1);
    expect(url.createObjectURL.mock.calls[0][0].type).toBe('text/plain;charset=utf-8');
    expect(screen.getByText('Paper comprovat: és el que es va llegir. Ja el pots obrir en una pestanya.').getAttribute('role')).toBe('status');
    /* El botó que ara toca rep el focus. */
    expect(document.activeElement).toBe(obri);
    expect(obriPaper).not.toHaveBeenCalled();

    fireEvent.click(obri);
    /* Dins del mateix clic: obriPaper ja s'ha cridat, sense cap espera pel mig. */
    expect(obriPaper).toHaveBeenCalledTimes(1);
    expect(obriPaper).toHaveBeenCalledWith('blob:paper-1');
    expect(screen.getByText('Paper obert en una pestanya nova. No es tanca quan bloqueges el cofre ni amb «Oblida»: tanca-la tu.')
      .getAttribute('role')).toBe('status');
    expect(nomsSenseEtiquetaVisible(container)).toEqual([]);
    titolsNets();

    /* L'ull tancat els torna a desactivar. */
    fireEvent.click(ull);
    expect(comprova.disabled).toBe(true);
    expect(obri.disabled).toBe(true);
  });

  test('«Oblida la carpeta» revoca la URL comprovada; a la fitxa, sense carpeta, la nota en lloc dels botons', async () => {
    const { cofre } = await cofreObert();
    const url = urlFals();
    await munta({ cofre, entorn: { ...entornTractors, URL: url } });
    await lligPapers();
    fireEvent.click(screen.getByRole('button', { name: 'Confirma Nom' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mostra les dades' }));
    fireEvent.click(within(paperDe('NIF o NIE', RUTES.vida)).getByRole('button', { name: `Comprova el paper: ${RUTES.vida}` }));
    await waitFor(() => expect(url.createObjectURL).toHaveBeenCalledTimes(1), { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: 'Oblida la carpeta' }));
    expect(url.revokeObjectURL).toHaveBeenCalledWith('blob:paper-1');
    const fitxa = await screen.findByRole('region', { name: 'La teua fitxa · Persona titular' });
    const papers = [...within(fitxa).getByText('Nom').closest('tr').querySelectorAll('details')];
    /* La recepta del nom no mira els papers de nom opac: només la vida laboral n'és font. */
    expect(papers.map((d) => d.querySelector('summary').textContent)).toEqual([RUTES.vida]);
    for (const detalls of papers) {
      expect(detalls.textContent).toContain('Tria la carpeta on és el paper per a obrir-lo.');
      expect(detalls.querySelector('button')).toBeNull();
    }
  });
});

/* Proves [DEFECTE]: passen reproduint un deute conegut, previ al Front 6, que no s'arregla ací. Es conserven a part de
   les regressions perquè qui l'arregle sàpiga quina asserció ha de girar. */
describe('[DEFECTE] deute previ conegut', () => {
  test('[DEFECTE useFinestreta.js planifica] una carpeta nova no buida les propostes de l’anterior; l’empremta n’evita l’obertura: PAPER_CANVIAT visible i anunciat', async () => {
    const { cofre } = await cofreObert();
    const url = urlFals();
    const { obriPaper } = await munta({ cofre, entorn: { ...entornTractors, URL: url } });
    await lligPapers();
    /* Una altra carpeta, amb un paper del mateix nom i un altre contingut. */
    fireEvent.change(screen.getByLabelText(ETIQUETA_CARPETA), { target: { files: [fitxer(RUTES.vida, `${VIDA_LABORAL}\nUna línia de més`)] } });
    await screen.findByRole('button', { name: 'Llig el paper' }, { timeout: 5000 });
    /* El DEFECTE: les propostes de la carpeta d'abans continuen a la pantalla. */
    expect(screen.getByRole('heading', { level: 2, name: 'Propostes per revisar' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Mostra les dades' }));
    const vida = paperDe('NIF o NIE', RUTES.vida);
    const comprova = within(vida).getByRole('button', { name: `Comprova el paper: ${RUTES.vida}` });
    fireEvent.click(comprova);
    const motiu = await within(vida).findByText(PAPER_CANVIAT, {}, { timeout: 5000 });
    expect(comprova.getAttribute('aria-describedby')).toBe(motiu.id);
    expect(screen.getByText(`No s’ha pogut comprovar el paper. ${PAPER_CANVIAT}`).getAttribute('role')).toBe('status');
    expect(within(vida).getByRole('button', { name: `Obri’l en una pestanya: ${RUTES.vida}` }).disabled).toBe(true);
    expect(url.createObjectURL).not.toHaveBeenCalled();
    expect(obriPaper).not.toHaveBeenCalled();
  });
});

describe('el cofre', () => {
  test('«Bloqueja» ho buida tot; en tornar a obrir, la fitxa confirmada torna i les propostes no', async () => {
    const { cofre } = await cofreObert();
    const { container } = await munta({ cofre });
    await lligPapers();
    fireEvent.click(screen.getByRole('button', { name: 'Confirma Nom' }));
    await waitFor(async () => {
      expect((await persistenciaDelCofre(cofre, COLLECCIO_IDENTITAT).llig())?.titulars?.length).toBe(1);
    }, { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: 'Bloqueja' }));
    expect(await screen.findByRole('button', { name: 'Obri el cofre' })).toBeTruthy();
    expect(cofre.obert).toBe(false);
    expect(screen.queryByRole('heading', { name: 'Propostes per revisar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Mostra les dades' })).toBeNull();
    for (const privat of PRIVATS) expect(container.textContent, privat).not.toContain(privat);

    fireEvent.change(await screen.findByLabelText('Frase de pas'), { target: { value: FRASE } });
    fireEvent.click(screen.getByRole('button', { name: 'Obri el cofre' }));
    const fitxa = await screen.findByRole('region', { name: 'La teua fitxa · Persona titular' }, { timeout: 5000 });
    expect(within(fitxa).getByText('Valor amagat')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Propostes per revisar' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Mostra les dades' }).getAttribute('aria-pressed')).toBe('false');
  });

  test('en eixir de la vista, el cofre es bloqueja', async () => {
    const { cofre } = await cofreObert();
    const { unmount } = await munta({ cofre });
    await screen.findByLabelText(ETIQUETA_CARPETA, {}, { timeout: 5000 });
    expect(cofre.obert).toBe(true);
    unmount();
    expect(cofre.obert).toBe(false);
    await expect(persistenciaDelCofre(cofre, COLLECCIO_IDENTITAT).llig()).rejects.toMatchObject({ codi: 'COFRE_BLOQUEJAT' });
  });
});
