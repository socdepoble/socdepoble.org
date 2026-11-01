/* T3.2-UI (marató 261101) · DocumentEditor amb la clau opcional `memoriaOral`
   al costat de `proposaCard` (el Bloc: sections/notes/memoriaOralDelBloc.js),
   sobre el TipTap de veres i la fitxa de veres:
     · sense la clau, «🎴 Proposa Card» fa el de sempre (cap diàleg);
     · amb la clau, el botó també s'encén quan la nota porta text encara que
       no hi haja res a pujar, i cada clic que no desfà obri la «Fitxa de
       memòria oral (OKF v0.2)» de la nota tal com l'ha escrita la persona,
       abans d'aplicar la proposta (Gauntlet 2, 261101, G2-MO-01); el resultat
       de la Card va a la descripció del diàleg, no a un avís;
     · tancar, tornar a obrir i canviar de document; un motor que falla torna
       al camí de sempre;
     · (Gauntlet 261101, B2-04) la correcció del diàleg (etiquetes i poble)
       arriba a la revisió de l'adaptador i la fitxa segellada la porta.
   Els relats estan escrits per a esta prova. */
import React, { useCallback, useMemo, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ editor: null, barra: null, doc: null, updateLocal: null, setDoc: null }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
/* El motor TipTap és el de veres: es captura la instància i les props de la barra. */
vi.mock('./richText', async (importOriginal) => ({
  ...(await importOriginal()),
  useTipTapToolbarAdapter: (editor) => { m.editor = editor; return { state: {}, exec: {} }; },
  UniversalRichTextToolbar: (props) => { m.barra = props; return null; }
}));
import { DocumentEditor } from './DocumentEditor.jsx';
import { proposaCard } from '../../sections/notes/proposaCard.js';
import { memoriaOralDelBloc } from '../../sections/notes/memoriaOralDelBloc.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  m.editor = null;
  m.barra = null;
  m.doc = null;
});

const ARA = new Date('2026-11-01T03:00:00Z');
const MEMORIA = memoriaOralDelBloc({ persona: 'u-1', rellotge: () => ARA });
const COS = '<p>La festa de Sella</p><p>Tres dies de música</p><p>Enguany la banda va baixar de Xixona per a les festes.</p>'
  + '<p>Les dones cantaven albades mentres collien les olives, i els xiquets jugaven a la plaça fins a la matinada.</p>';
const DOC = Object.freeze({ id: 'd1', title: '', subtitle: '', lead: '', content: COS, formattedDate: '01/11/26', formattedTime: '03:00' });
const PLENS = Object.freeze({ ...DOC, title: 'Les festes de Sella', subtitle: 'Records', lead: 'Una entradilla.' });
const TITOL = 'Fitxa de memòria oral (OKF v0.2)';
const FETA = 'Card proposada. Per a tornar-la arrere: «Desfés la proposta» o Cmd/Ctrl+Z.';
const RES = 'No hi ha res a proposar: els camps de la targeta ja són plens o el cos no comença amb text.';

/* Un Bloc de mentira: updateLocal escriu al document, com NotesContext. */
function Banc({ inicial = DOC, saveRemote, toast, memoriaOral = MEMORIA }) {
  const [doc, setDoc] = useState(inicial);
  const updateLocal = useCallback((id, camp, valor) => setDoc((d) => (d.id === id ? { ...d, [camp]: valor } : d)), []);
  const adapter = useMemo(() => ({
    document: doc, labels: [], seedContent: null, saveRemote, updateLocal, proposaCard,
    ...(memoriaOral ? { memoriaOral } : null)
  }), [doc, updateLocal, saveRemote, memoriaOral]);
  m.doc = doc;
  m.updateLocal = updateLocal;
  m.setDoc = setDoc;
  return <DocumentEditor adapter={adapter} onToast={toast} />;
}
const munta = (props = {}) => {
  const saveRemote = vi.fn();
  const toast = vi.fn();
  return { saveRemote, toast, ...render(<Banc saveRemote={saveRemote} toast={toast} {...props} />) };
};
const camps = () => ({ title: m.doc.title, subtitle: m.doc.subtitle, lead: m.doc.lead });
const proposa = () => act(() => { m.barra.onProposaCard(); });
const fitxa = () => screen.queryByRole('dialog', { name: TITOL });
/* Els <dialog> de la fitxa al DOM, oberts o tancats (la closca en porta d'altres: la vista A4, la visibilitat). */
const dialegsDeFitxa = () => [...document.querySelectorAll('dialog')].filter((d) => d.querySelector('.sdp-dialeg__titol')?.textContent === TITOL);
const descripcio = (dialeg) => document.getElementById(dialeg.getAttribute('aria-describedby'))?.textContent ?? null;
const dades = (dialeg) => Object.fromEntries([...dialeg.querySelectorAll('dt')].map((dt) => [dt.textContent, dt.nextElementSibling.textContent]));
const grupPoble = (dialeg) => within(dialeg).getByRole('group', { name: 'Poble del relat' });
const grupEtiquetes = (dialeg) => within(dialeg).getByRole('group', { name: 'Etiquetes' });
const pobleTriat = (dialeg) => within(grupPoble(dialeg)).getAllByRole('radio').find((r) => r.checked)?.labels[0].textContent ?? null;

test('sense la clau: el botó, el clic i el DOM de sempre (cap diàleg; l’avís de la Card)', () => {
  const { toast, unmount } = munta({ memoriaOral: null });
  proposa();
  expect(toast).toHaveBeenCalledWith(FETA);
  expect(fitxa()).toBeNull();
  expect(dialegsDeFitxa()).toEqual([]);
  unmount();
  // Amb els camps plens, apagat com sempre.
  munta({ memoriaOral: null, inicial: PLENS });
  expect(m.barra.proposaCardDisabled).toBe(true);
});

test('abans del primer clic, cap diàleg de la fitxa al DOM', () => {
  munta();
  const abans = document.querySelectorAll('dialog').length;
  expect(dialegsDeFitxa()).toEqual([]);
  proposa();
  expect(document.querySelectorAll('dialog')).toHaveLength(abans + 1);
});

test('amb la clau, la Card es proposa i la fitxa s’obri, de la nota tal com era abans de la proposta; el resultat va a la descripció i no a cap avís', () => {
  const { toast } = munta();
  expect(m.barra.proposaCardDisabled).toBe(false);
  proposa();
  // La Card, com sempre.
  expect(camps()).toEqual({ title: 'La festa de Sella', subtitle: 'Tres dies de música', lead: 'Enguany la banda va baixar de Xixona per a les festes.' });
  expect(m.barra.proposaCardDesfer).toBe(true);
  // La fitxa: la de la nota que va escriure la persona (sense títol: el del
  // motor, i no el que la Card acaba de pujar); Sella, poble detectat.
  const dialeg = fitxa();
  expect(dialeg).not.toBeNull();
  expect(descripcio(dialeg)).toBe(FETA);
  const escrita = MEMORIA.estructura({ title: '', subtitle: '', lead: '', content: COS });
  expect(escrita.titolDeLaPersona).toBe(false);
  expect(dades(dialeg)['Títol']).toBe(escrita.titol);
  expect(dades(dialeg)['Títol']).not.toBe('La festa de Sella');
  expect(pobleTriat(dialeg)).toBe('Sella');
  expect(within(grupEtiquetes(dialeg)).getByRole('checkbox', { name: /^Festes i tradicions/ }).checked).toBe(true);
  expect(toast).not.toHaveBeenCalled();
});

test('amb els camps plens i text al cos, el botó s’encén i obri la fitxa sense tocar la nota', () => {
  const { toast, saveRemote } = munta({ inicial: PLENS });
  expect([m.barra.proposaCardDisabled, m.barra.proposaCardDesfer]).toEqual([false, false]);
  proposa();
  expect(camps()).toEqual({ title: PLENS.title, subtitle: PLENS.subtitle, lead: PLENS.lead });
  expect(m.editor.getHTML()).toBe(COS);
  expect(saveRemote).not.toHaveBeenCalled();
  expect(toast).not.toHaveBeenCalled();
  const dialeg = fitxa();
  expect(descripcio(dialeg)).toBe(RES);
  expect(dades(dialeg)['Títol']).toBe(PLENS.title);
  // Encara no hi ha proposta a desfer: el botó continua proposant.
  expect(m.barra.proposaCardDesfer).toBe(false);
});

test('sense text a l’entradilla ni al cos (o només una imatge), apagat com sempre', () => {
  const { unmount } = munta({ inicial: { ...PLENS, lead: '', content: '<p></p>' } });
  expect(m.barra.proposaCardDisabled).toBe(true);
  unmount();
  munta({ inicial: { ...PLENS, lead: '', content: '<p><img src="data:image/png;base64,AAAA" alt=""></p>' } });
  expect(m.barra.proposaCardDisabled).toBe(true);
  cleanup();
  // L'entradilla sola ja és relat.
  munta({ inicial: { ...PLENS, content: '<p></p>' } });
  expect(m.barra.proposaCardDisabled).toBe(false);
});

test('la revisió va pel motor de l’adaptador, i tancar i tornar a obrir torna a l’esborrany', () => {
  const revisa = vi.fn(MEMORIA.revisa);
  const memoriaOral = { estructura: MEMORIA.estructura, revisa };
  munta({ inicial: PLENS, memoriaOral });
  proposa();
  let dialeg = fitxa();
  const casella = within(dialeg).getByRole('checkbox', { name: /L’he revisada/ });
  fireEvent.click(casella);
  expect(revisa).toHaveBeenCalledTimes(1);
  expect(within(dialeg).getByRole('status').textContent).toBe('Estat: revisada per una persona.');
  // La X tanca (el diàleg es queda muntat, tancat, per a tornar el focus).
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Tancar' }));
  expect(fitxa()).toBeNull();
  proposa();
  dialeg = fitxa();
  expect(within(dialeg).getByRole('checkbox', { name: /L’he revisada/ }).checked).toBe(false);
  expect(within(dialeg).getByRole('status').textContent).toBe('Estat: esborrany, pendent de revisió humana.');
  expect(dialegsDeFitxa()).toHaveLength(1);
});

test('B2-04 · la correcció del diàleg arriba a la revisió de l’adaptador i la fitxa segellada la porta', () => {
  const revisa = vi.fn(MEMORIA.revisa);
  munta({ inicial: PLENS, memoriaOral: { estructura: MEMORIA.estructura, revisa } });
  proposa();
  const dialeg = fitxa();
  expect(within(grupPoble(dialeg)).getAllByRole('radio').map((r) => r.labels[0].textContent)).toEqual(['Sella', 'Xixona', 'Cap d’estos pobles']);
  fireEvent.click(within(grupPoble(dialeg)).getByRole('radio', { name: 'Xixona' }));
  const caselles = within(grupEtiquetes(dialeg)).getAllByRole('checkbox');
  const festes = caselles.find((c) => /^Festes i tradicions/.test(c.labels[0].textContent));
  fireEvent.click(festes);
  fireEvent.click(within(dialeg).getByRole('checkbox', { name: /L’he revisada/ }));
  expect(revisa).toHaveBeenCalledTimes(1);
  const [, correccio] = revisa.mock.calls[0];
  expect(correccio.municipi).toBe('xixona');
  expect(correccio.etiquetes).not.toContain('festes');
  const segellada = revisa.mock.results[0].value;
  expect(segellada.okf.frontmatter).toEqual(expect.objectContaining({ status: 'stable', municipi: 'xixona', tags: correccio.etiquetes }));
  // G2-MO-08 · L'id del compte no va al fitxer.
  expect(segellada.okf.frontmatter.verified).toEqual([{ by: 'human:sense-identificador', at: ARA.toISOString() }]);
  expect(segellada.okf.cami).toMatch(/^memoria-oral\/xixona\//);
  // El títol de la persona (el de la Card) no el toca la correcció.
  expect(segellada.okf.frontmatter.title).toBe(PLENS.title);
  expect(within(dialeg).getByRole('status').textContent).toBe('Estat: revisada per una persona.');
});

test('sense ningú que signe (revisa: null), la casella va apagada', () => {
  munta({ inicial: PLENS, memoriaOral: memoriaOralDelBloc({ rellotge: () => ARA }) });
  proposa();
  expect(within(fitxa()).getByRole('checkbox', { name: /L’he revisada/ }).disabled).toBe(true);
  // La correcció es veu però no es toca: ningú no la podria signar.
  expect(within(grupPoble(fitxa())).getAllByRole('radio').every((r) => r.matches(':disabled'))).toBe(true);
});

test('un altre document: la fitxa d’abans se’n va', () => {
  munta({ inicial: PLENS });
  proposa();
  expect(fitxa()).not.toBeNull();
  act(() => { m.setDoc({ ...PLENS, id: 'd2' }); });
  expect(fitxa()).toBeNull();
  expect(dialegsDeFitxa()).toEqual([]);
});

test('si el motor de la fitxa falla, el clic torna al camí de sempre (l’avís de la Card i cap diàleg)', () => {
  const memoriaOral = { estructura: () => { throw new Error('motor'); }, revisa: null };
  const { toast, unmount } = munta({ memoriaOral });
  proposa();
  expect(camps().title).toBe('La festa de Sella');
  expect(toast).toHaveBeenCalledWith(FETA);
  expect(fitxa()).toBeNull();
  unmount();
  const plens = munta({ memoriaOral, inicial: PLENS });
  proposa();
  expect(plens.toast).toHaveBeenCalledWith(RES);
  expect(fitxa()).toBeNull();
});

test('«Desfés la proposta» no obri cap fitxa', () => {
  munta();
  proposa();
  fireEvent.click(within(fitxa()).getByRole('button', { name: 'Tancar' }));
  proposa();
  expect(camps()).toEqual({ title: '', subtitle: '', lead: '' });
  expect(m.editor.getHTML()).toBe(COS);
  expect(fitxa()).toBeNull();
});

/* Gauntlet 2 (261101, G2-MO-01) · Després d'una proposta, els paràgrafs que
   la Card puja al títol, al subtítol i a l'entradilla no desapareixen del
   relat de la fitxa, i un relat de dos paràgrafs no es queda «buit». */
test('G2-MO-01 · un relat de dos paràgrafs: la Card els puja tots dos i la fitxa (motiu «proposta») els porta tots dos al «Relat»', () => {
  const estructura = vi.fn(MEMORIA.estructura);
  const DOS = '<p>La vesprada que va ploure tant a Tibi, el barranc es va endur el pont vell.</p>'
    + '<p>Mon pare i el tio Quico van passar la nit traent aigua del corral de les cabres.</p>';
  munta({ inicial: { ...DOC, content: DOS }, memoriaOral: { estructura, revisa: MEMORIA.revisa } });
  proposa();
  // La Card ha buidat el cos: tot ha pujat als camps.
  expect(camps().title).toBe('La vesprada que va ploure tant a Tibi, el barranc es va endur el pont vell');
  expect(camps().subtitle).toBe('Mon pare i el tio Quico van passar la nit traent aigua del corral de les cabres');
  // La fitxa es fa una sola volta, amb la nota d'abans de la proposta.
  expect(estructura).toHaveBeenCalledTimes(1);
  expect(estructura.mock.calls[0][0]).toEqual({ title: '', subtitle: '', lead: '', content: DOS });
  const feta = estructura.mock.results[0].value;
  expect([feta.motiu, feta.paraules]).toEqual(['proposta', 33]);
  const relat = feta.okf.cos.slice(feta.okf.cos.indexOf('\n# Relat\n'), feta.okf.cos.indexOf("\n# Com s'ha fet\n"));
  expect(relat).toBe('\n# Relat\n\nLa vesprada que va ploure tant a Tibi, el barranc es va endur el pont vell.\n\n'
    + 'Mon pare i el tio Quico van passar la nit traent aigua del corral de les cabres.\n');
  expect(feta.okf.cos).toContain("El relat no s'ha modificat: «Relat» en porta el text sencer, sense format.");
  // El diàleg ho ensenya: la fitxa, no el «La nota encara no té cap relat».
  const dialeg = fitxa();
  expect(within(dialeg).queryByText(/La nota encara no té cap relat/)).toBeNull();
  expect(within(dialeg).getByRole('textbox', { name: 'La fitxa, en Markdown' }).value).toBe(feta.okf.markdown);
});

test('G2-MO-01 · un relat de quatre paràgrafs: cap paraula no es perd del «Relat» ni es compta dues voltes', () => {
  const estructura = vi.fn(MEMORIA.estructura);
  const QUATRE = '<p>Ma iaia Pepa va nàixer a Penàguila l’any trenta-dos.</p><p>De xicoteta guardava les cabres del tio Vicent.</p>'
    + '<p>A l’hivern collien olives als bancals de dalt.</p><p>Quan va acabar la guerra, el seu germà se’n va anar a França i ja no va tornar mai.</p>';
  munta({ inicial: { ...DOC, content: QUATRE }, memoriaOral: { estructura, revisa: null } });
  proposa();
  expect(camps().title).toBe('Ma iaia Pepa va nàixer a Penàguila l’any trenta-dos');
  const feta = estructura.mock.results[0].value;
  const sencera = MEMORIA.estructura({ title: '', subtitle: '', lead: '', content: QUATRE });
  expect([feta.motiu, feta.paraules]).toEqual([sencera.motiu, sencera.paraules]);
  expect(feta.paraules).toBe(48);
  // Penàguila, una sola menció: el títol pujat no es torna a comptar.
  expect(feta.candidats.map((c) => [c.id, c.mencions])).toEqual([['penaguila', 1]]);
  for (const paragraf of ['Ma iaia Pepa va nàixer a Penàguila l’any trenta-dos.', 'De xicoteta guardava les cabres del tio Vicent.',
    'A l’hivern collien olives als bancals de dalt.', 'Quan va acabar la guerra, el seu germà se’n va anar a França i ja no va tornar mai.']) {
    expect(feta.okf.cos).toContain(`\n${paragraf}\n`);
  }
});

/* D-5 (pla 261101_1246) · Amb cercaPoble i etiquetaNova a l'adaptador, la
   fitxa porta «Un altre poble» i «Etiqueta nova», i el que s'hi afig arriba
   a la revisió de l'adaptador; sense les claus (o sense sessió), cap camp. */
test('D-5 · l’adaptador amb cercaPoble i etiquetaNova fa aparéixer els camps; la revisió en porta el que s’hi afig', () => {
  const revisa = vi.fn(MEMORIA.revisa);
  munta({ inicial: PLENS, memoriaOral: { ...MEMORIA, revisa } });
  proposa();
  const dialeg = fitxa();
  fireEvent.change(within(dialeg).getByRole('textbox', { name: 'Un altre poble' }), { target: { value: 'Alcoy' } });
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Tria este poble' }));
  expect(pobleTriat(dialeg)).toBe('Alcoi');
  fireEvent.change(within(dialeg).getByRole('textbox', { name: 'Etiqueta nova' }), { target: { value: 'Pansa' } });
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Afig' }));
  expect(within(grupEtiquetes(dialeg)).getByRole('checkbox', { name: 'pansa (afegida en la revisió)' }).checked).toBe(true);
  fireEvent.click(within(dialeg).getByRole('checkbox', { name: /L’he revisada/ }));
  const [, correccio] = revisa.mock.calls[0];
  expect(correccio).toEqual(expect.objectContaining({ municipi: 'alcoi', etiquetesLliures: ['pansa'] }));
  const segellada = revisa.mock.results[0].value;
  expect(segellada.okf.frontmatter).toEqual(expect.objectContaining({ municipi: 'alcoi', tags: [...correccio.etiquetes, 'pansa'] }));
  expect(segellada.okf.frontmatter.verified).toEqual([{ by: 'human:sense-identificador', at: ARA.toISOString() }]);
  cleanup();
  // Sense les claus noves, el diàleg de sempre.
  munta({ inicial: PLENS, memoriaOral: { estructura: MEMORIA.estructura, revisa: MEMORIA.revisa } });
  proposa();
  expect(within(fitxa()).queryByRole('textbox', { name: 'Un altre poble' })).toBeNull();
  expect(within(fitxa()).queryByRole('textbox', { name: 'Etiqueta nova' })).toBeNull();
  cleanup();
  // Sense sessió (l'adaptador les porta a null), tampoc.
  munta({ inicial: PLENS, memoriaOral: memoriaOralDelBloc({ rellotge: () => ARA }) });
  proposa();
  expect(within(fitxa()).queryByRole('textbox', { name: 'Un altre poble' })).toBeNull();
  expect(within(fitxa()).queryByRole('button', { name: 'Afig' })).toBeNull();
});
