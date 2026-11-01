/* T3.2-UI (marató 261101) · La «Fitxa de memòria oral (OKF v0.2)» de
   «🎴 Proposa Card», amb fitxes de veres de l'estructurador local
   (sections/notes/memoriaOral.js): el que es veu, la revisió anunciada, la
   descàrrega sense xarxa, el quadre per a copiar dins de l'app nativa, el
   text curt quan no hi ha fitxa i (Gauntlet 261101, B2-04) la correcció de
   les etiquetes i del poble abans de signar. Gauntlet 2 (261101): la
   descripció, el resum i el fitxer sencer abans de signar (G2-MO-03), i els
   avisos i les etiquetes pel traductor amb la reserva del motor (G2-MO-07).
   Els relats estan escrits per a esta prova: no són el testimoni de cap
   persona real. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { FitxaMemoriaOral, nomDeLaFitxa } from './FitxaMemoriaOral.jsx';
import { AVISOS_MEMORIA, VOCABULARI_RURAL, estructuraMemoriaOral, marcaRevisioHumana } from '../../sections/notes/memoriaOral.js';
import { LLAVOR_NOTA } from '../../sections/notes/llavorNota.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const t = (_clau, reserva) => reserva;
const ARA = '2026-11-01T03:00:00Z';
const RELAT = 'A la Torre de les Maçanes, quan arribava la collita de les olives, tot el poble anava al molí. '
  + 'Les dones cantaven albades i els xiquets jugaven a la plaça. De Xixona baixava la banda de música per a les festes.';
const FITXA = estructuraMemoriaOral(RELAT, { ara: ARA });
/* Com l'adaptador del Bloc: la correcció del diàleg passa; qui signa i quan, els posa la prova. */
const revisaPer = (persona) => vi.fn((fitxa, correccio) => marcaRevisioHumana(fitxa, {
  etiquetes: correccio?.etiquetes, municipi: correccio?.municipi, persona, ara: '2026-11-01T03:10:00Z'
}));

/* jsdom no té URL.createObjectURL: sense, el component ja fa com dins de
   l'app (el quadre per a copiar). Les proves de la descàrrega el posen. */
const URL_SENSE_BLOBS = !('createObjectURL' in URL);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete window.Capacitor;
  if (URL_SENSE_BLOBS) {
    delete URL.createObjectURL;
    delete URL.revokeObjectURL;
  }
});

const pinta = (props = {}) => {
  const onTanca = vi.fn();
  const res = render(<FitxaMemoriaOral obert onTanca={onTanca} fitxa={FITXA} t={t} {...props} />);
  return { onTanca, dialeg: screen.getByRole('dialog', { name: 'Fitxa de memòria oral (OKF v0.2)' }), ...res };
};
/* Les parelles del <dl>: «Títol» → «…». */
const dades = (dialeg) => Object.fromEntries([...dialeg.querySelectorAll('dt')].map((dt) => [dt.textContent, dt.nextElementSibling.textContent]));
/* Les parelles que porta sempre una fitxa amb resum: títol, descripció i resum. */
const fitxaEnDades = (fitxa) => ({ 'Títol': fitxa.titol, 'Descripció': fitxa.descripcio, 'Resum': fitxa.resum });
/* G2-MO-03 · El <details> del fitxer sencer i el seu quadre. */
const detallsFitxa = (dialeg) => [...dialeg.querySelectorAll('details')].find((d) => d.querySelector('summary')?.textContent === 'Veure la fitxa sencera') ?? null;
const quadreFitxa = (dialeg) => within(detallsFitxa(dialeg)).getByRole('textbox', { name: 'La fitxa, en Markdown' });
/* La correcció: el grup del poble (ràdios) i el de les etiquetes (caselles). */
const grupPoble = (dialeg) => within(dialeg).getByRole('group', { name: 'Poble del relat' });
const grupEtiquetes = (dialeg) => within(dialeg).getByRole('group', { name: 'Etiquetes' });
const pobleTriat = (dialeg) => within(grupPoble(dialeg)).getAllByRole('radio').find((r) => r.checked)?.labels[0].textContent ?? null;
const etiquetesMarcades = (dialeg) => within(grupEtiquetes(dialeg)).getAllByRole('checkbox').filter((c) => c.checked).map((c) => c.labels[0].textContent);
const textEtiqueta = (e) => `${e.nom} (${e.proves.join(', ')})`;
const CORRECCIO = 'Abans de marcar «L’he revisada», desmarca les etiquetes que no hi toquen i tria el poble del relat. La correcció entra a la fitxa quan la marques com a revisada; fins aleshores, la que descarregues és la proposta de la màquina.';
/* Captura la descàrrega: el Blob, el nom i que l'enllaç es clica. */
function capturaDescarrega() {
  const captura = { blobs: [], noms: [], revocades: [] };
  URL.createObjectURL = vi.fn((blob) => { captura.blobs.push(blob); return `blob:prova/${captura.blobs.length}`; });
  URL.revokeObjectURL = vi.fn((url) => captura.revocades.push(url));
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { captura.noms.push([this.download, this.getAttribute('href'), this.rel]); });
  return captura;
}

describe('FitxaMemoriaOral · amb fitxa OKF', () => {
  test('el títol, el poble triat entre els candidats, les etiquetes amb les seues paraules i els avisos; la Card, a la descripció', () => {
    expect(FITXA.okf).not.toBeNull();
    const { dialeg } = pinta({ descripcio: 'Card proposada.' });
    expect(dialeg.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.getElementById(dialeg.getAttribute('aria-describedby')).textContent).toBe('Card proposada.');
    expect(dades(dialeg)).toEqual(fitxaEnDades(FITXA));
    // El poble: els candidats de la màquina, i cap; triat, el que ella proposa.
    expect(within(grupPoble(dialeg)).getAllByRole('radio').map((r) => r.labels[0].textContent))
      .toEqual(['La Torre de les Maçanes', 'Xixona', 'Cap d’estos pobles']);
    expect(pobleTriat(dialeg)).toBe('La Torre de les Maçanes');
    // Les etiquetes: totes marcades, amb les paraules del relat.
    const etiquetes = etiquetesMarcades(dialeg);
    expect(etiquetes).toEqual(FITXA.etiquetes.map(textEtiqueta));
    expect(etiquetes.length).toBeGreaterThan(0);
    // Sense ningú que signe (revisa absent), es veu però no es toca, i no es demana cap correcció.
    expect(within(grupPoble(dialeg)).getAllByRole('radio').every((r) => r.matches(':disabled'))).toBe(true);
    expect(within(grupEtiquetes(dialeg)).getAllByRole('checkbox').every((c) => c.matches(':disabled'))).toBe(true);
    expect(within(dialeg).queryByText(CORRECCIO)).toBeNull();
    // Dos pobles: l'avis del motor, tal qual.
    expect(FITXA.avisos).toContain("El relat esmenta més d'un poble: cal confirmar el municipi.");
    expect(within(dialeg).getByText('Avisos')).toBeTruthy();
    for (const avis of FITXA.avisos) expect(within(dialeg).getByText(avis)).toBeTruthy();
  });

  test('sense poble ni etiquetes ni avisos, ho diu i no pinta cap avís', () => {
    const fitxa = estructuraMemoriaOral('Això ho va dir ell una vesprada qualsevol, i després ningú no en va parlar mai més en tota la vida.', { ara: ARA });
    expect([fitxa.municipi, fitxa.etiquetes.length, fitxa.avisos.length]).toEqual([null, 0, 0]);
    const { dialeg } = pinta({ fitxa });
    const parelles = dades(dialeg);
    expect(parelles['Poble detectat']).toBe('Cap dels pobles que coneix l’aplicació');
    expect(parelles.Etiquetes).toBe('Cap del vocabulari rural');
    expect(within(dialeg).queryByText('Avisos')).toBeNull();
    // Res a corregir: cap grup ni cap text de correcció (el <details> del fitxer no és cap correcció).
    expect(within(dialeg).queryAllByRole('group').filter((g) => g.localName !== 'details')).toEqual([]);
    cleanup();
    expect(within(pinta({ fitxa, revisa: revisaPer('u-1') }).dialeg).queryByText(CORRECCIO)).toBeNull();
  });

  test('«L’he revisada» crida la revisió, anuncia l’estat i, desmarcada, torna a l’esborrany', () => {
    const revisa = revisaPer('u-1');
    const { dialeg } = pinta({ revisa });
    const casella = within(dialeg).getByRole('checkbox', { name: /L’he revisada/ });
    const estat = within(dialeg).getByRole('status');
    expect([casella.checked, casella.disabled]).toEqual([false, false]);
    expect(estat.textContent).toBe('Estat: esborrany, pendent de revisió humana.');
    fireEvent.click(casella);
    expect(revisa).toHaveBeenCalledTimes(1);
    // Sense tocar res, la correcció és la proposta de la màquina.
    expect(revisa).toHaveBeenCalledWith(FITXA, { etiquetes: FITXA.etiquetes.map((e) => e.id), municipi: 'la-torre-de-les-macanes' });
    expect(casella.checked).toBe(true);
    expect(estat.textContent).toBe('Estat: revisada per una persona.');
    fireEvent.click(casella);
    expect(casella.checked).toBe(false);
    expect(estat.textContent).toBe('Estat: esborrany, pendent de revisió humana.');
    expect(revisa).toHaveBeenCalledTimes(1);
  });

  test('sense ningú que signe, la casella va apagada i diu per què', () => {
    const { dialeg } = pinta({ revisa: null });
    const casella = within(dialeg).getByRole('checkbox', { name: /L’he revisada/ });
    expect(casella.disabled).toBe(true);
    expect(document.getElementById(casella.getAttribute('aria-describedby')).textContent)
      .toBe('Per a signar la revisió cal entrar amb el teu compte.');
  });

  test('si la revisió falla, la fitxa continua en esborrany i ho anuncia', () => {
    const revisa = vi.fn(() => { throw new TypeError('cap'); });
    const { dialeg } = pinta({ revisa });
    const casella = within(dialeg).getByRole('checkbox', { name: /L’he revisada/ });
    fireEvent.click(casella);
    expect(casella.checked).toBe(false);
    expect(within(dialeg).getByRole('status').textContent).toBe('No s’ha pogut signar la revisió: la fitxa continua en esborrany.');
  });

  test('«Descarrega la fitxa» desa el markdown OKF amb el nom del seu camí, sense xarxa; revisada, el de la revisió', async () => {
    const captura = capturaDescarrega();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { dialeg } = pinta({ revisa: revisaPer('u-1') });
    const boto = within(dialeg).getByRole('button', { name: 'Descarrega la fitxa' });
    // Fora de l'app nativa, el fitxer sencer es veu, plegat, dins del <details> (G2-MO-03).
    expect(detallsFitxa(dialeg).open).toBe(false);
    expect(quadreFitxa(dialeg).value).toBe(FITXA.okf.markdown);
    vi.useFakeTimers();
    try {
      fireEvent.click(boto);
      // L'URL temporal es revoca un segon després del clic.
      expect(captura.revocades).toEqual([]);
      act(() => { vi.advanceTimersByTime(1000); });
      expect(captura.revocades).toEqual(['blob:prova/1']);
    } finally {
      vi.useRealTimers();
    }
    expect(captura.noms).toEqual([[nomDeLaFitxa(FITXA.okf.cami), 'blob:prova/1', 'noopener']]);
    expect(captura.noms[0][0]).toBe(FITXA.okf.cami.replaceAll('/', '_'));
    expect(captura.noms[0][0]).toMatch(/^memoria-oral_la-torre-de-les-macanes_.+\.md$/);
    expect(captura.blobs[0].type).toBe('text/markdown;charset=utf-8');
    expect(await captura.blobs[0].text()).toBe(FITXA.okf.markdown);
    expect(FITXA.okf.markdown).toMatch(/\nstatus: draft\n/);
    // Revisada: el fitxer porta status stable i verified.
    fireEvent.click(within(dialeg).getByRole('checkbox', { name: /L’he revisada/ }));
    fireEvent.click(boto);
    const revisat = await captura.blobs[1].text();
    expect(revisat).toMatch(/\nstatus: stable\n/);
    expect(revisat).toMatch(/\nverified:\n {2}- by: "human:u-1"\n/);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('dins de l’app nativa, cap botó que no faria res: el markdown en un quadre de només lectura', () => {
    // Encara que el WebView tinga createObjectURL: dins de l'app, l'enllaç blob: no desa res.
    const captura = capturaDescarrega();
    window.Capacitor = { isNativePlatform: () => true };
    const { dialeg } = pinta({ revisa: revisaPer('u-1') });
    expect(captura.blobs).toEqual([]);
    expect(within(dialeg).queryByRole('button', { name: 'Descarrega la fitxa' })).toBeNull();
    // El mateix <details>, obert: és l'única manera d'endur-se'n el fitxer.
    expect(detallsFitxa(dialeg).open).toBe(true);
    const quadre = quadreFitxa(dialeg);
    expect(quadre.readOnly).toBe(true);
    expect(quadre.value).toBe(FITXA.okf.markdown);
    expect(document.getElementById(quadre.getAttribute('aria-describedby')).textContent).toBe('Ací no es pot desar com a fitxer: copia’n el text.');
    fireEvent.click(within(dialeg).getByRole('checkbox', { name: /L’he revisada/ }));
    expect(quadre.value).toMatch(/\nstatus: stable\n/);
  });

  test('B2-04 · desmarca etiquetes i tria un altre poble abans de signar: la fitxa segellada (i descarregada) ho porta', async () => {
    const captura = capturaDescarrega();
    const revisa = revisaPer('u-1');
    const { dialeg } = pinta({ revisa });
    expect(within(dialeg).getByText(CORRECCIO)).toBeTruthy();
    const [primera, segona] = FITXA.etiquetes;
    fireEvent.click(within(grupEtiquetes(dialeg)).getByRole('checkbox', { name: textEtiqueta(primera) }));
    fireEvent.click(within(grupPoble(dialeg)).getByRole('radio', { name: 'Xixona' }));
    expect(pobleTriat(dialeg)).toBe('Xixona');
    // Abans de signar, la fitxa i el títol són els de la màquina.
    expect(dades(dialeg)['Títol']).toBe(FITXA.titol);
    fireEvent.click(within(dialeg).getByRole('checkbox', { name: /L’he revisada/ }));
    const queden = FITXA.etiquetes.slice(1).map((e) => e.id);
    expect(revisa).toHaveBeenCalledWith(FITXA, { etiquetes: queden, municipi: 'xixona' });
    const segellada = revisa.mock.results[0].value;
    expect(segellada.okf.frontmatter.tags).toEqual(queden);
    expect(segellada.okf.frontmatter.municipi).toBe('xixona');
    // La pantalla pinta la fitxa segellada, i la correcció queda tancada mentre és revisada.
    expect(within(dialeg).getByRole('status').textContent).toBe('Estat: revisada per una persona.');
    expect(dades(dialeg)['Títol']).toBe(segellada.titol);
    expect(segellada.titol).toMatch(new RegExp(`^${segona.titol}.* a Xixona$`));
    expect(within(dialeg).queryByText(CORRECCIO)).toBeNull();
    expect(within(grupPoble(dialeg)).getAllByRole('radio').every((r) => r.matches(':disabled'))).toBe(true);
    expect(within(grupEtiquetes(dialeg)).getAllByRole('checkbox').every((c) => c.matches(':disabled'))).toBe(true);
    expect(etiquetesMarcades(dialeg)).toEqual(FITXA.etiquetes.slice(1).map(textEtiqueta));
    // El fitxer: el markdown segellat, amb el camí del poble triat.
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Descarrega la fitxa' }));
    expect(captura.noms[0][0]).toMatch(/^memoria-oral_xixona_.+\.md$/);
    const md = await captura.blobs[0].text();
    expect(md).toBe(segellada.okf.markdown);
    expect(md).toMatch(/\nmunicipi: xixona\n---\n/);
    expect(md).toContain('Poble triat en la revisió: Xixona.');
    expect(md).toContain(`Descartades en la revisió: ${primera.nom}.`);
    // Desmarcada, torna l'esborrany i la correcció es reobri tal com estava.
    fireEvent.click(within(dialeg).getByRole('checkbox', { name: /L’he revisada/ }));
    expect(dades(dialeg)['Títol']).toBe(FITXA.titol);
    expect(pobleTriat(dialeg)).toBe('Xixona');
    expect(etiquetesMarcades(dialeg)).toEqual(FITXA.etiquetes.slice(1).map(textEtiqueta));
    expect(within(grupPoble(dialeg)).getAllByRole('radio').some((r) => r.matches(':disabled'))).toBe(false);
    expect(within(grupEtiquetes(dialeg)).getAllByRole('checkbox').some((c) => c.matches(':disabled'))).toBe(false);
  });

  test('B2-04 · «Cap d’estos pobles»: la fitxa segellada no porta municipi', () => {
    const revisa = revisaPer('u-1');
    const { dialeg } = pinta({ revisa });
    fireEvent.click(within(grupPoble(dialeg)).getByRole('radio', { name: 'Cap d’estos pobles' }));
    fireEvent.click(within(dialeg).getByRole('checkbox', { name: /L’he revisada/ }));
    expect(revisa).toHaveBeenCalledWith(FITXA, { etiquetes: FITXA.etiquetes.map((e) => e.id), municipi: null });
    const segellada = revisa.mock.results[0].value;
    expect(segellada.okf.frontmatter).not.toHaveProperty('municipi');
    expect(segellada.okf.cami).toMatch(/^memoria-oral\/sense-poble\//);
    expect(pobleTriat(dialeg)).toBe('Cap d’estos pobles');
  });

  test('la X tanca', () => {
    const { dialeg, onTanca } = pinta();
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Tancar' }));
    expect(onTanca).toHaveBeenCalledWith('boto');
  });
});

describe('FitxaMemoriaOral · Gauntlet 2 (G2-MO-03 i G2-MO-07)', () => {
  test('G2-MO-03 · la descripció, el resum i, abans de la casella, el fitxer sencer de només lectura; revisada, el de la revisió', () => {
    const { dialeg } = pinta({ revisa: revisaPer('u-1') });
    expect(dades(dialeg)).toEqual(fitxaEnDades(FITXA));
    expect(FITXA.resum.length).toBeGreaterThan(0);
    const detalls = detallsFitxa(dialeg);
    expect(detalls).not.toBeNull();
    const quadre = quadreFitxa(dialeg);
    expect([quadre.readOnly, quadre.value]).toEqual([true, FITXA.okf.markdown]);
    expect(quadre.value).toContain('\n# Relat\n');
    expect(document.getElementById(quadre.getAttribute('aria-describedby')).textContent).toBe('És el fitxer sencer, tal com es descarrega.');
    // Abans de la casella que el signa: es pot llegir abans de signar.
    const casella = within(dialeg).getByRole('checkbox', { name: /L’he revisada/ });
    expect(detalls.compareDocumentPosition(casella) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Revisada amb un altre poble: la descripció i el fitxer que es veuen són els de la revisió.
    fireEvent.click(within(grupPoble(dialeg)).getByRole('radio', { name: 'Xixona' }));
    fireEvent.click(casella);
    expect(quadre.value).toMatch(/\nstatus: stable\n/);
    expect(quadre.value).toMatch(/\nmunicipi: xixona\n/);
    expect(dades(dialeg)['Descripció']).toMatch(/ \(poble: Xixona\)\.$/);
  });

  test('G2-MO-03 · un resum de paràgrafs (un relat sense puntuació) es pinta paràgraf a paràgraf; sense resum, cap «Resum»', () => {
    const fitxa = estructuraMemoriaOral('Mon pare era llaurador a Tibi\n\nLa iaia contava rondalles de bruixes', { ara: ARA });
    expect(fitxa.resum).toContain('\n\n');
    const { dialeg } = pinta({ fitxa });
    const dd = [...dialeg.querySelectorAll('dt')].find((dt) => dt.textContent === 'Resum').nextElementSibling;
    expect([...dd.querySelectorAll('p')].map((p) => p.textContent)).toEqual(fitxa.resum.split('\n\n'));
    cleanup();
    const senseResum = { ...FITXA, resum: '' };
    expect(dades(pinta({ fitxa: senseResum }).dialeg)).not.toHaveProperty('Resum');
  });

  test('G2-MO-07 · els noms de les etiquetes i els avisos, pel traductor; les paraules del relat, tal com són', () => {
    const tEs = (clau, reserva) => ES[clau] ?? reserva;
    const pintaEs = (fitxa) => {
      render(<FitxaMemoriaOral obert onTanca={vi.fn()} fitxa={fitxa} t={tEs} revisa={revisaPer('u-1')} />);
      return screen.getByRole('dialog', { name: ES['editor.memoriaOral.titol'] });
    };
    const dialeg = pintaEs(FITXA);
    const grup = within(dialeg).getByRole('group', { name: ES['editor.memoriaOral.camp.etiquetes'] });
    const caselles = within(grup).getAllByRole('checkbox').map((c) => c.labels[0].textContent);
    expect(caselles).toEqual(FITXA.etiquetes.map((e) => `${ES[`editor.memoriaOral.tema.${e.id}`]} (${e.proves.join(', ')})`));
    expect(FITXA.codisAvis).toEqual(['diversosPobles']);
    expect(within(dialeg).getByText(ES['editor.memoriaOral.avis.diversosPobles'])).toBeTruthy();
    expect(within(dialeg).queryByText(AVISOS_MEMORIA.diversosPobles)).toBeNull();
    // Una fitxa sense codis (rehidratada d'abans), el text del motor tal com ve.
    cleanup();
    const vella = { ...FITXA, codisAvis: undefined };
    expect(within(pintaEs(vella)).getByText(AVISOS_MEMORIA.diversosPobles)).toBeTruthy();
  });

  test('G2-MO-07 · cada tema del vocabulari i cada avís que es pinta tenen clau a les cinc llengües, i en valencià és el text del motor', () => {
    const diccionaris = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
    const claus = [
      ...VOCABULARI_RURAL.map((tema) => [`editor.memoriaOral.tema.${tema.id}`, tema.nom]),
      ...['curt', 'diversosPobles'].map((codi) => [`editor.memoriaOral.avis.${codi}`, AVISOS_MEMORIA[codi]])
    ];
    expect(claus).toHaveLength(15);
    for (const [clau, motor] of claus) {
      expect(CA[clau], clau).toBe(motor);
      for (const [codi, dic] of Object.entries(diccionaris)) expect(typeof dic[clau] === 'string' && dic[clau].trim() !== '', `${codi} ${clau}`).toBe(true);
    }
  });
});

describe('FitxaMemoriaOral · sense fitxa OKF: un text curt i res més', () => {
  const casos = [
    ['buit', estructuraMemoriaOral({ title: 'Només el títol', content: '<p></p>' }), 'La nota encara no té cap relat: escriu-lo al cos i torna a provar.'],
    ['llavor', estructuraMemoriaOral({ content: LLAVOR_NOTA }), 'El cos encara és la plantilla de format: escriu-hi el relat i torna a provar.'],
    ['massa-llarg', estructuraMemoriaOral('paraula '.repeat(300_000)), 'El relat és massa llarg per a analitzar-lo en el navegador.']
  ];
  test.each(casos)('%s', (motiu, fitxa, text) => {
    expect([fitxa.motiu, fitxa.okf]).toEqual([motiu, null]);
    const { dialeg } = pinta({ fitxa, revisa: revisaPer('u-1'), descripcio: 'No hi ha res a proposar.' });
    const cos = dialeg.querySelector('.sdp-dialeg__cos');
    expect(cos.textContent).toBe(text);
    expect(within(dialeg).queryByRole('checkbox')).toBeNull();
    expect(within(dialeg).queryByRole('status')).toBeNull();
    expect(within(dialeg).queryByRole('textbox')).toBeNull();
    expect(within(dialeg).getAllByRole('button').map((b) => b.getAttribute('aria-label') || b.textContent)).toEqual(['Tancar']);
  });
});

test('nomDeLaFitxa: el camí OKF en un sol nom de fitxer', () => {
  expect(nomDeLaFitxa('memoria-oral/sella/les-festes-0a1b2c3d.md')).toBe('memoria-oral_sella_les-festes-0a1b2c3d.md');
  expect(nomDeLaFitxa('')).toBe('memoria-oral.md');
  expect(nomDeLaFitxa(undefined)).toBe('memoria-oral.md');
});
