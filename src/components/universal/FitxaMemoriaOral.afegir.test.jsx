/* D-5 (pla 261101_1246, assalt 10/10) · La «Fitxa de memòria oral» amb els
   camps d'afegir: «Un altre poble» (els àlies, contra el catàleg de
   l'aplicació i els municipis de referència) i «Etiqueta nova» (del
   vocabulari o lliure), amb el motor de veres (sections/notes/memoriaOral.js)
   per l'adaptador del Bloc. Sense les dues funcions, o sense ningú que
   signe, el DOM de sempre. Els relats estan escrits per a esta prova: no són
   el testimoni de cap persona real. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { FitxaMemoriaOral } from './FitxaMemoriaOral.jsx';
import { memoriaOralDelBloc } from '../../sections/notes/memoriaOralDelBloc.js';
import { resolPobleDeText } from '../../sections/notes/memoriaOral.js';
import ES from '../../config/idiomes/es.js';

const t = (_clau, reserva) => reserva;
const ARA = new Date('2026-11-01T03:00:00Z');
const RELAT = { title: '', subtitle: '', lead: '', content: '<p>A la Torre de les Maçanes, quan arribava la collita de les olives, tot el poble anava al molí. '
  + 'Les dones cantaven albades i els xiquets jugaven a la plaça. De Xixona baixava la banda de música per a les festes.</p>' };
const SENSE_POBLE = { title: '', subtitle: '', lead: '', content: '<p>Mon pare treballava en una fàbrica de joguets, i a l’estiu collíem les olives al camp.</p>' };
const ADAPTADOR = memoriaOralDelBloc({ persona: 'u-1', rellotge: () => ARA });
const FITXA = ADAPTADOR.estructura(RELAT);
const CORRECCIO = 'Abans de marcar «L’he revisada», desmarca les etiquetes que no hi toquen, afig les que hi falten i tria el poble del relat. La correcció entra a la fitxa quan la marques com a revisada; fins aleshores, la que descarregues és la proposta de la màquina.';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const pinta = (props = {}) => {
  const revisa = vi.fn(ADAPTADOR.revisa);
  render(<FitxaMemoriaOral obert onTanca={vi.fn()} fitxa={FITXA} t={t} revisa={revisa}
    cercaPoble={ADAPTADOR.cercaPoble} etiquetaNova={ADAPTADOR.etiquetaNova} {...props} />);
  const dialeg = screen.getByRole('dialog');
  return { dialeg, revisa };
};
const campPoble = (dialeg) => within(dialeg).getByRole('textbox', { name: 'Un altre poble' });
const campEtiqueta = (dialeg) => within(dialeg).getByRole('textbox', { name: 'Etiqueta nova' });
const botoPoble = (dialeg) => within(dialeg).getByRole('button', { name: 'Tria este poble' });
const botoAfig = (dialeg) => within(dialeg).getByRole('button', { name: 'Afig' });
const grupPoble = (dialeg) => within(dialeg).getByRole('group', { name: 'Poble del relat' });
const grupEtiquetes = (dialeg) => within(dialeg).getByRole('group', { name: 'Etiquetes' });
const opcionsPoble = (dialeg) => within(grupPoble(dialeg)).getAllByRole('radio').map((r) => r.labels[0].textContent);
const pobleTriat = (dialeg) => within(grupPoble(dialeg)).getAllByRole('radio').find((r) => r.checked)?.labels[0].textContent ?? null;
const caselles = (dialeg) => within(grupEtiquetes(dialeg)).getAllByRole('checkbox');
const marcades = (dialeg) => caselles(dialeg).filter((c) => c.checked).map((c) => c.labels[0].textContent);
const anunci = (dialeg) => dialeg.querySelector('.sdp-nomes-lector[aria-live="polite"]');
const errorDe = (camp) => (camp.getAttribute('aria-describedby') ?? '').split(' ').map((id) => document.getElementById(id))
  .find((el) => el?.classList.contains('sdp-camp__error'))?.textContent ?? null;
const escriu = (camp, text) => fireEvent.change(camp, { target: { value: text } });
/* El botó, amb el focus, com quan es clica de veres. */
const clica = (boto) => {
  boto.focus();
  fireEvent.click(boto);
};
const revisada = (dialeg) => within(dialeg).getByRole('checkbox', { name: /L’he revisada/ });

describe('FitxaMemoriaOral · un altre poble (D-5)', () => {
  test('«Jijona» tria Xixona, que ja és candidat: cap opció nova, el camp es buida, ho anuncia i el focus torna al camp', () => {
    const { dialeg } = pinta();
    expect(within(dialeg).getByText(CORRECCIO)).toBeTruthy();
    expect(opcionsPoble(dialeg)).toEqual(['La Torre de les Maçanes', 'Xixona', 'Cap d’estos pobles']);
    expect(botoPoble(dialeg).disabled).toBe(true);
    escriu(campPoble(dialeg), 'Jijona');
    expect(botoPoble(dialeg).disabled).toBe(false);
    clica(botoPoble(dialeg));
    expect(pobleTriat(dialeg)).toBe('Xixona');
    expect(opcionsPoble(dialeg)).toEqual(['La Torre de les Maçanes', 'Xixona', 'Cap d’estos pobles']);
    expect(campPoble(dialeg).value).toBe('');
    expect(anunci(dialeg).textContent).toBe('Poble triat: Xixona.');
    expect(document.activeElement).toBe(campPoble(dialeg));
  });

  test('«Alcoy» amb Retorn: Alcoi, municipi de referència, és una opció més i triada; i la revisió el porta', () => {
    const { dialeg, revisa } = pinta();
    escriu(campPoble(dialeg), 'Alcoy');
    fireEvent.keyDown(campPoble(dialeg), { key: 'Enter' });
    expect(opcionsPoble(dialeg)).toEqual(['La Torre de les Maçanes', 'Xixona', 'Alcoi', 'Cap d’estos pobles']);
    expect(pobleTriat(dialeg)).toBe('Alcoi');
    fireEvent.click(revisada(dialeg));
    expect(revisa).toHaveBeenCalledWith(FITXA, { etiquetes: FITXA.etiquetes.map((e) => e.id), municipi: 'alcoi' });
    const segellada = revisa.mock.results[0].value;
    expect(segellada.okf.frontmatter.municipi).toBe('alcoi');
    expect(segellada.okf.cami).toMatch(/^memoria-oral\/alcoi\//);
    expect(segellada.okf.cos).toContain('Poble triat en la revisió: Alcoi.');
    // Revisada: la ràdio d'Alcoi, marcada i tancada.
    expect(pobleTriat(dialeg)).toBe('Alcoi');
  });

  test('un nom desconegut o ambigu: l’error al camp, i escriure l’esborra', () => {
    const { dialeg } = pinta();
    escriu(campPoble(dialeg), 'Madrid');
    clica(botoPoble(dialeg));
    expect(errorDe(campPoble(dialeg))).toBe('No coneixem cap poble amb este nom. Prova amb el nom oficial o amb el que diu la gent.');
    expect(campPoble(dialeg).getAttribute('aria-invalid')).toBe('true');
    // Gauntlet T6a-G02 · L'error s'anuncia i, després del clic, el focus torna al camp.
    expect(anunci(dialeg).textContent).toBe('No coneixem cap poble amb este nom. Prova amb el nom oficial o amb el que diu la gent.');
    expect(document.activeElement).toBe(campPoble(dialeg));
    expect(campPoble(dialeg).value).toBe('Madrid');
    expect(pobleTriat(dialeg)).toBe('La Torre de les Maçanes');
    escriu(campPoble(dialeg), 'Madri');
    expect(errorDe(campPoble(dialeg))).toBeNull();
    cleanup();
    const pobles = [{ id: 'sant-joan-a', title: 'Sant Joan A', alies: ['Sant Joan'] }, { id: 'sant-joan-b', title: 'Sant Joan B', alies: ['Sant Joan'] }];
    const ambigu = pinta({ cercaPoble: (text) => resolPobleDeText(text, { pobles }) }).dialeg;
    escriu(campPoble(ambigu), 'Sant Joan');
    clica(botoPoble(ambigu));
    expect(errorDe(campPoble(ambigu))).toBe('Hi ha més d’un poble amb este nom: escriu-lo sencer.');
  });

  test('sense candidats, el poble triat obri el grup «Poble del relat»', () => {
    const fitxa = ADAPTADOR.estructura(SENSE_POBLE);
    expect(fitxa.candidats).toEqual([]);
    const { dialeg } = pinta({ fitxa });
    expect(within(dialeg).queryByRole('group', { name: 'Poble del relat' })).toBeNull();
    // Gauntlet T6a-G05 · Amb el selector, el text no nega que l'aplicació en conega d'altres.
    expect(within(dialeg).getByText('La màquina no n’ha reconegut cap al relat').localName).toBe('dd');
    expect(within(dialeg).queryByText('Cap dels pobles que coneix l’aplicació')).toBeNull();
    escriu(campPoble(dialeg), 'la Torre');
    clica(botoPoble(dialeg));
    expect(opcionsPoble(dialeg)).toEqual(['La Torre de les Maçanes', 'Cap d’estos pobles']);
    expect(pobleTriat(dialeg)).toBe('La Torre de les Maçanes');
  });
});

describe('FitxaMemoriaOral · etiqueta nova (D-5)', () => {
  test('«pansa» és una casella marcada «(afegida en la revisió)»; repetida, error; desmarcada, es queda al DOM', () => {
    const { dialeg, revisa } = pinta();
    const abans = marcades(dialeg);
    escriu(campEtiqueta(dialeg), 'Pansa');
    clica(botoAfig(dialeg));
    expect(marcades(dialeg)).toEqual([...abans, 'pansa (afegida en la revisió)']);
    expect(anunci(dialeg).textContent).toBe('Etiqueta afegida: pansa.');
    expect(campEtiqueta(dialeg).value).toBe('');
    expect(document.activeElement).toBe(campEtiqueta(dialeg));
    // Repetida, sense accents ni majúscules.
    escriu(campEtiqueta(dialeg), '#PANSÁ');
    clica(botoAfig(dialeg));
    expect(errorDe(campEtiqueta(dialeg))).toBe('Esta etiqueta ja hi és.');
    // Desmarcada: fora de la revisió, però al DOM.
    const pansa = within(grupEtiquetes(dialeg)).getByRole('checkbox', { name: 'pansa (afegida en la revisió)' });
    fireEvent.click(pansa);
    expect(pansa.isConnected && !pansa.checked).toBe(true);
    fireEvent.click(revisada(dialeg));
    expect(revisa).toHaveBeenCalledWith(FITXA, { etiquetes: FITXA.etiquetes.map((e) => e.id), municipi: 'la-torre-de-les-macanes' });
  });

  test('«Festes» torna a marcar la proposada desmarcada; una del vocabulari no proposada entra com a afegida; Retorn afig', () => {
    const { dialeg, revisa } = pinta();
    const festes = within(grupEtiquetes(dialeg)).getByRole('checkbox', { name: /^Festes i tradicions/ });
    fireEvent.click(festes);
    expect(festes.checked).toBe(false);
    const quantes = caselles(dialeg).length;
    escriu(campEtiqueta(dialeg), 'Festes');
    clica(botoAfig(dialeg));
    expect(festes.checked).toBe(true);
    expect(caselles(dialeg)).toHaveLength(quantes);
    expect(anunci(dialeg).textContent).toBe('Etiqueta afegida: Festes i tradicions.');
    escriu(campEtiqueta(dialeg), 'guerra');
    fireEvent.keyDown(campEtiqueta(dialeg), { key: 'Enter' });
    expect(marcades(dialeg)).toContain('Guerra i postguerra (afegida en la revisió)');
    escriu(campEtiqueta(dialeg), 'collita d’ametles');
    fireEvent.keyDown(campEtiqueta(dialeg), { key: 'Enter' });
    escriu(campPoble(dialeg), 'Alcoy');
    fireEvent.keyDown(campPoble(dialeg), { key: 'Enter' });
    fireEvent.click(revisada(dialeg));
    expect(revisa).toHaveBeenCalledWith(FITXA, {
      etiquetes: [...FITXA.etiquetes.map((e) => e.id), 'guerra'], municipi: 'alcoi', etiquetesLliures: ["collita d'ametles"]
    });
    const segellada = revisa.mock.results[0].value;
    expect(segellada.okf.frontmatter.tags).toEqual([...FITXA.etiquetes.map((e) => e.id), 'guerra', "collita d'ametles"]);
    expect(segellada.okf.cos).toContain("* **collita d'ametles**: etiqueta lliure, afegida en la revisió humana.");
    expect(within(dialeg).getByRole('textbox', { name: 'La fitxa, en Markdown' }).value).toBe(segellada.okf.markdown);
  });

  test('invàlida, massa lliures i massa en total: l’error del camp; desmarcar-ne una en fa lloc', () => {
    const fitxa = ADAPTADOR.estructura(SENSE_POBLE);
    expect(fitxa.etiquetes.length).toBeLessThan(5);
    const { dialeg } = pinta({ fitxa });
    escriu(campEtiqueta(dialeg), '!!!');
    clica(botoAfig(dialeg));
    expect(errorDe(campEtiqueta(dialeg))).toBe('Escriu una etiqueta de 2 a 40 caràcters, amb lletres o xifres.');
    // Gauntlet T6a-G02 · L'error s'anuncia i el focus torna al camp.
    expect(anunci(dialeg).textContent).toBe('Escriu una etiqueta de 2 a 40 caràcters, amb lletres o xifres.');
    expect(document.activeElement).toBe(campEtiqueta(dialeg));
    for (const text of ['pansa', 'figues', 'riu sec', 'era', 'barri']) {
      escriu(campEtiqueta(dialeg), text);
      clica(botoAfig(dialeg));
    }
    expect(errorDe(campEtiqueta(dialeg))).toBeNull();
    escriu(campEtiqueta(dialeg), 'torró de casa');
    clica(botoAfig(dialeg));
    expect(errorDe(campEtiqueta(dialeg))).toBe('Ja hi ha 5 etiquetes lliures: lleva’n alguna abans d’afegir-ne més.');
    expect(campEtiqueta(dialeg).value).toBe('torró de casa');
    fireEvent.click(within(grupEtiquetes(dialeg)).getByRole('checkbox', { name: 'barri (afegida en la revisió)' }));
    clica(botoAfig(dialeg));
    expect(marcades(dialeg)).toContain('torró de casa (afegida en la revisió)');
    cleanup();
    // La fitxa de cinc proposades, amb cinc lliures: ja n'hi ha deu.
    expect(FITXA.etiquetes).toHaveLength(5);
    const ple = pinta().dialeg;
    for (const text of ['pansa', 'figues', 'riu sec', 'era', 'barri']) {
      escriu(campEtiqueta(ple), text);
      clica(botoAfig(ple));
    }
    escriu(campEtiqueta(ple), 'guerra');
    clica(botoAfig(ple));
    expect(errorDe(campEtiqueta(ple))).toBe('Ja hi ha 10 etiquetes: lleva’n alguna abans d’afegir-ne més.');
  });

  test('Gauntlet T6a-G01 · tornar a marcar una casella no salta els límits de 5 lliures ni de 10 en total', () => {
    const fitxa = ADAPTADOR.estructura(SENSE_POBLE);
    const { dialeg, revisa } = pinta({ fitxa });
    for (const text of ['pansa', 'figues', 'riu sec', 'era', 'barri']) {
      escriu(campEtiqueta(dialeg), text);
      clica(botoAfig(dialeg));
    }
    const barri = within(grupEtiquetes(dialeg)).getByRole('checkbox', { name: 'barri (afegida en la revisió)' });
    fireEvent.click(barri);
    expect(errorDe(campEtiqueta(dialeg))).toBeNull();
    escriu(campEtiqueta(dialeg), 'torró de casa');
    clica(botoAfig(dialeg));
    fireEvent.click(barri);
    const LLIURES = 'Ja hi ha 5 etiquetes lliures: lleva’n alguna abans d’afegir-ne més.';
    expect(barri.checked).toBe(false);
    expect(errorDe(campEtiqueta(dialeg))).toBe(LLIURES);
    expect(anunci(dialeg).textContent).toBe(LLIURES);
    // Desmarcar-ne una fa lloc i esborra l'error; aleshores sí que es torna a marcar.
    fireEvent.click(within(grupEtiquetes(dialeg)).getByRole('checkbox', { name: 'pansa (afegida en la revisió)' }));
    expect(errorDe(campEtiqueta(dialeg))).toBeNull();
    fireEvent.click(barri);
    expect(barri.checked).toBe(true);
    // La revisió signa: cap límit saltat.
    fireEvent.click(revisada(dialeg));
    expect(revisa.mock.calls[0][1].etiquetesLliures).toEqual(['figues', 'riu sec', 'era', 'barri', 'torró de casa']);
    expect(within(dialeg).getByRole('status').textContent).toBe('Estat: revisada per una persona.');
    cleanup();
    // Deu en total: cinc proposades i cinc lliures; se'n desmarca una proposada, entra «guerra» i la proposada ja no hi cap.
    const ple = pinta().dialeg;
    for (const text of ['pansa', 'figues', 'riu sec', 'era', 'barri']) {
      escriu(campEtiqueta(ple), text);
      clica(botoAfig(ple));
    }
    const festes = within(grupEtiquetes(ple)).getByRole('checkbox', { name: /^Festes i tradicions/ });
    fireEvent.click(festes);
    escriu(campEtiqueta(ple), 'guerra');
    clica(botoAfig(ple));
    expect(marcades(ple)).toContain('Guerra i postguerra (afegida en la revisió)');
    fireEvent.click(festes);
    expect(festes.checked).toBe(false);
    expect(errorDe(campEtiqueta(ple))).toBe('Ja hi ha 10 etiquetes: lleva’n alguna abans d’afegir-ne més.');
    expect(marcades(ple)).toHaveLength(10);
  });

  test('revisada, tot tancat; desmarcada, es torna a obrir tal com estava', () => {
    const { dialeg } = pinta();
    escriu(campEtiqueta(dialeg), 'pansa');
    clica(botoAfig(dialeg));
    escriu(campPoble(dialeg), 'Alcoy');
    clica(botoPoble(dialeg));
    escriu(campEtiqueta(dialeg), 'figues');
    escriu(campPoble(dialeg), 'Ibi');
    fireEvent.click(revisada(dialeg));
    for (const control of [campPoble(dialeg), campEtiqueta(dialeg), botoPoble(dialeg), botoAfig(dialeg), ...caselles(dialeg)]) {
      expect(control.disabled, control.outerHTML.slice(0, 80)).toBe(true);
    }
    expect(within(grupPoble(dialeg)).getAllByRole('radio').every((r) => r.matches(':disabled'))).toBe(true);
    expect(within(dialeg).queryByText(CORRECCIO)).toBeNull();
    // Retorn dins d'un camp tancat no fa res.
    fireEvent.keyDown(campEtiqueta(dialeg), { key: 'Enter' });
    expect(marcades(dialeg)).not.toContain('figues (afegida en la revisió)');
    fireEvent.click(revisada(dialeg));
    expect(campEtiqueta(dialeg).disabled).toBe(false);
    expect(marcades(dialeg)).toContain('pansa (afegida en la revisió)');
    expect(pobleTriat(dialeg)).toBe('Alcoi');
  });
});

describe('FitxaMemoriaOral · sense les funcions o sense ningú que signe, el DOM de sempre', () => {
  const capCampNou = (dialeg) => {
    expect(within(dialeg).getAllByRole('textbox').map((c) => c.labels[0]?.textContent)).toEqual(['La fitxa, en Markdown']);
    expect(within(dialeg).queryByRole('button', { name: 'Afig' })).toBeNull();
    expect(within(dialeg).queryByRole('button', { name: 'Tria este poble' })).toBeNull();
    expect(dialeg.querySelector('.sdp-nomes-lector[aria-live]')).toBeNull();
  };

  test('sense cercaPoble ni etiquetaNova: el DOM d’abans, byte a byte', () => {
    const { dialeg } = pinta({ cercaPoble: null, etiquetaNova: null });
    capCampNou(dialeg);
    const html = dialeg.outerHTML;
    cleanup();
    render(<FitxaMemoriaOral obert onTanca={vi.fn()} fitxa={FITXA} t={t} revisa={vi.fn(ADAPTADOR.revisa)} />);
    expect(screen.getByRole('dialog').outerHTML.replace(/:r[0-9a-z]+:/g, '')).toBe(html.replace(/:r[0-9a-z]+:/g, ''));
  });

  test('sense ningú que signe (revisa null), cap camp encara que hi haja les funcions', () => {
    const { dialeg } = pinta({ revisa: null });
    capCampNou(dialeg);
  });

  test('una sola regió role=status, i la viva d’afegir no ho és', () => {
    const { dialeg } = pinta();
    expect(within(dialeg).getAllByRole('status')).toHaveLength(1);
    expect(anunci(dialeg).getAttribute('role')).toBeNull();
  });

  test('en castellà, els camps i els errors pel traductor', () => {
    const tEs = (clau, reserva) => ES[clau] ?? reserva;
    pinta({ t: tEs });
    const dialeg = screen.getByRole('dialog', { name: ES['editor.memoriaOral.titol'] });
    const camp = within(dialeg).getByRole('textbox', { name: ES['editor.memoriaOral.novaEtiqueta'] });
    escriu(camp, 'pansa');
    clica(within(dialeg).getByRole('button', { name: ES['section.comu.afegeix'] }));
    expect(within(dialeg).getByRole('checkbox', { name: `pansa (${ES['editor.memoriaOral.afegida']})` }).checked).toBe(true);
    escriu(camp, 'pansa');
    clica(within(dialeg).getByRole('button', { name: ES['section.comu.afegeix'] }));
    expect(errorDe(camp)).toBe(ES['editor.memoriaOral.etiquetaRepetida']);
    expect(anunci(dialeg).textContent).toBe(ES['editor.memoriaOral.etiquetaRepetida']);
    // Gauntlet T6a-G03 · Una del vocabulari afegida porta el nom traduït, a la casella i a l'anunci.
    const guerra = ES['editor.memoriaOral.tema.guerra'];
    expect(guerra).not.toBe('Guerra i postguerra');
    escriu(camp, 'guerra');
    clica(within(dialeg).getByRole('button', { name: ES['section.comu.afegeix'] }));
    expect(within(dialeg).getByRole('checkbox', { name: `${guerra} (${ES['editor.memoriaOral.afegida']})` }).checked).toBe(true);
    expect(anunci(dialeg).textContent).toBe(ES['editor.memoriaOral.etiquetaAfegida'].replace('{nom}', guerra));
    const poble = within(dialeg).getByRole('textbox', { name: ES['editor.memoriaOral.altrePoble'] });
    escriu(poble, 'Madrid');
    clica(within(dialeg).getByRole('button', { name: ES['editor.memoriaOral.triaPoble'] }));
    expect(errorDe(poble)).toBe(ES['editor.memoriaOral.pobleDesconegut']);
  });
});
