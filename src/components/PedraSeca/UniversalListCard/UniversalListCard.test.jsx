/* Fase E (261020, tasca 2; pla 261020_2045 «El Comú») · UniversalListCard:
   els sis modes pintats amb la peça real, els tocs que canvien la targeta en
   el lloc, qui pot fer què, la fitxa privada, la lectura dins del mode de
   selecció del xat i la vista estesa. Sense UIProvider: els textos són la
   reserva valenciana. Persones i xifres de mostra. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { UniversalListCard } from './UniversalListCard.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ARA = '2026-10-20T19:00:00.000Z';
const ANNA = { id: 'u-anna', nom: 'Anna' };
const PAU = { id: 'u-pau', nom: 'Pau' };
const ROSA = { id: 'u-rosa', nom: 'Rosa' };
const rellotge = () => new Date(ARA);
let n = 0;
const generaId = () => `id-${(n += 1)}`;
const signa = (u) => ({ usuariId: u.id, nom: u.nom, at: ARA });
const llista = (mode, elementsComu, extra = {}) => ({ id: `l-${mode}`, mode, titol: `Llista ${mode}`, propietariId: ANNA.id, revisio: 1, elementsComu, ...extra });
const pinta = (l, props = {}) => render(<UniversalListCard llista={l} actor={ANNA} rellotge={rellotge} generaId={generaId} {...props} />);
const regio = (titol) => screen.getByRole('region', { name: titol });

const REBOST = llista('rebost', [
  { id: 'r1', ordre: 1, nom: 'Tomaca', emoji: '🍅', capaMode: { estat: 'falta', especificacio: '2 kg', demanatPer: [{ ...signa(ANNA), especificacio: '2 kg' }], compratPer: null } },
  { id: 'r2', ordre: 2, nom: 'Oli', capaMode: { estat: 'comprat', especificacio: '1 l', demanatPer: [{ ...signa(PAU), especificacio: '1 l' }], compratPer: signa(PAU) } }
]);

describe('Rebost · rajoles d’un toc', () => {
  test('cada rajola és un botó amb l’estat a aria-pressed i al nom; el toc la passa al cistell en el mateix lloc i ho anuncia', () => {
    pinta(REBOST);
    const card = regio('Llista rebost');
    const tomaca = within(card).getByRole('button', { name: 'Tomaca, 2 kg, Falta' });
    expect(tomaca.getAttribute('aria-pressed')).toBe('true');
    expect(tomaca.getAttribute('data-estat')).toBe('actiu');
    fireEvent.click(tomaca);
    const comprada = within(card).getByRole('button', { name: 'Tomaca, 2 kg, Al cistell' });
    /* El mateix botó, al mateix lloc: la transició es veu. */
    expect(comprada).toBe(tomaca);
    expect(comprada.getAttribute('aria-pressed')).toBe('false');
    expect(comprada.getAttribute('data-estat')).toBe('resolt');
    expect(within(card).getAllByRole('status').map((s) => s.textContent)).toContain('Tomaca: al cistell.');
    expect(within(card).getByRole('progressbar', { name: '2 de 2 al cistell' })).toBeTruthy();
  });

  test('l’afegit ràpid separa la quantitat i fusiona una petició repetida', () => {
    pinta(REBOST);
    const camp = screen.getByRole('combobox', { name: /Què falta\?/ });
    fireEvent.change(camp, { target: { value: '1 kg de tomaca' } });
    fireEvent.submit(camp.closest('form'));
    expect(screen.getByRole('button', { name: 'Tomaca, 2 kg + 1 kg, Falta' })).toBeTruthy();
    fireEvent.change(camp, { target: { value: '3 llimes' } });
    fireEvent.submit(camp.closest('form'));
    expect(screen.getByRole('button', { name: 'Llimes, 3, Falta' })).toBeTruthy();
  });

  test('el filtre «Al cistell» deixa només els comprats', () => {
    pinta(REBOST);
    fireEvent.click(screen.getByRole('button', { name: 'Al cistell' }));
    expect(screen.queryByRole('button', { name: /^Tomaca/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Oli, 1 l, Al cistell' })).toBeTruthy();
  });
});

describe('Bar · TPV · qui serveix i qui demana', () => {
  const BAR = llista('bar_tpv', [
    { id: 'b1', ordre: 1, nom: 'Cafè sol', capaMode: { estat: 'demanat', quantitat: 2, preuCents: 110, desti: 'barra', demanatPer: signa(PAU) } }
  ]);

  test('qui governa la barra serveix amb un toc; l’estat també es veu en dibuix, no només pel color', () => {
    pinta(BAR);
    const rajola = screen.getByRole('button', { name: /2 × Cafè sol.*Serveix/ });
    expect(rajola.getAttribute('aria-pressed')).toBeNull();
    const dibuix = () => rajola.querySelector('.sdp-comu__rajola-marca svg')?.getAttribute('class');
    const abans = dibuix();
    fireEvent.click(rajola);
    expect(rajola.getAttribute('data-estat')).toBe('mig');
    expect(dibuix()).not.toBe(abans);
    expect(screen.getByText('Total: 2,20 €')).toBeTruthy();
    /* Sense emoji, les inicials són del nom, no de la quantitat. */
    expect(rajola.querySelector('.sdp-comu__rajola-icona').textContent).toBe('CS');
  });

  test('qui ha demanat en demana una més; una altra persona només ho llig', () => {
    const { unmount } = pinta(BAR, { actor: PAU });
    fireEvent.click(screen.getByRole('button', { name: /Una més de Cafè sol/ }));
    expect(screen.getByText('3 × Cafè sol')).toBeTruthy();
    unmount();
    pinta(BAR, { actor: ROSA });
    expect(screen.getByText('2 × Cafè sol').closest('button')).toBeNull();
  });
});

describe('Colla · Cens · reclamar i deixar', () => {
  const CENS = llista('colla_cens', [
    { id: 'c1', ordre: 1, nom: 'Druida', capaMode: { quota: 1, adjudicacions: [signa(ROSA)] } },
    { id: 'c2', ordre: 2, nom: 'Ferrera', capaMode: { quota: 1, adjudicacions: [] } }
  ]);

  test('un lloc lliure es reclama amb un toc; un d’agafat per una altra persona no és cap botó', () => {
    pinta(CENS, { actor: PAU });
    expect(screen.getByText('Agafat per Rosa').closest('button')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Ferrera, Lliure, M’ho quede/ }));
    const meu = screen.getByRole('button', { name: /Ferrera, És teu, Ho deixe/ });
    expect(meu.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Ferrera: és teu.');
  });

  test('deixar el propi lloc demana confirmació', () => {
    const ambPau = llista('colla_cens', [{ id: 'c1', ordre: 1, nom: 'Ferrera', capaMode: { quota: 1, adjudicacions: [signa(PAU)] } }]);
    pinta(ambPau, { actor: PAU });
    fireEvent.click(screen.getByRole('button', { name: /Ferrera, És teu, Ho deixe/ }));
    const dialeg = screen.getByRole('dialog', { name: 'Vols deixar «Ferrera»?' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Ho deixe' }));
    expect(screen.getByRole('button', { name: /Ferrera, Lliure, M’ho quede/ })).toBeTruthy();
  });
});

describe('Banda · Eixida · la resposta pròpia i la capa de la junta', () => {
  const BANDA = llista('banda_eixida', [
    { id: 'm1', ordre: 1, nom: 'Marta', capaMode: { corda: 'clarinet', vinculacio: 'plantilla', nivell: 1, assistencia: 'confirmat', posaCotxe: false, places: 0, pagament: 'pendent' } },
    { id: 'm2', ordre: 2, nom: 'Pau', capaMode: { corda: 'trompa', vinculacio: 'plantilla', nivell: 3, usuariId: PAU.id, assistencia: 'convocat', posaCotxe: false, places: 0, pagament: 'pendent' } }
  ], { configMode: { volen: 4, codiActe: 3, tarifesCents: { plantilla_nivell_1: { 3: 5000 } }, pressupostatCents: 10000 } });

  test('el músic veu la seua fila primer, hi confirma i no veu els comptes', () => {
    pinta(BANDA, { actor: PAU });
    const files = screen.getAllByRole('listitem').filter((li) => li.classList.contains('sdp-comu__fila'));
    expect(within(files[0]).getByText('Pau')).toBeTruthy();
    /* Les etiquetes no canvien: l'estat és a aria-pressed. */
    const cotxe = within(files[0]).getByRole('button', { name: 'Pose cotxe' });
    expect(cotxe.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(cotxe);
    expect(within(files[0]).getByRole('button', { name: 'Pose cotxe' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(files[0]).getByRole('group', { name: 'Pau' })).toBeTruthy();
    expect(within(files[1]).queryByRole('button')).toBeNull();
    fireEvent.click(within(files[0]).getByRole('button', { name: 'Vaig' }));
    expect(screen.getByText('Volen 4 · Anem 2 · Cotxes 1')).toBeTruthy();
    expect(screen.queryByText('Comptes de la junta')).toBeNull();
  });

  test('la junta veu el sou i el fons', () => {
    pinta(BANDA);
    expect(screen.getByText('Comptes de la junta')).toBeTruthy();
    expect(screen.getByText('Fons: 50,00 €')).toBeTruthy();
  });
});

describe('Loteria · Dipòsit · les signatures', () => {
  const LOTERIA = llista('loteria_diposit', [
    { id: 'l1', ordre: 1, nom: 'Bar de la Plaça', capaMode: { format: 'decims', entregats: 20, retornats: 3, signatures: {} } },
    { id: 'l2', ordre: 2, nom: 'Forn', capaMode: { format: 'paperetes', entregats: 10, retornats: 0, depositariUsuariId: PAU.id, signatures: {} } }
  ]);

  test('la junta signa per la societat; la liquidació abans de l’entrega torna l’error en text', () => {
    pinta(LOTERIA);
    const grup = screen.getByRole('group', { name: 'Signatures de Bar de la Plaça' });
    fireEvent.click(within(grup).getByRole('button', { name: 'Cobrat per la societat' }));
    expect(screen.getByRole('alert').textContent).toContain('Primer l’entrega, signada pels dos; després, la liquidació.');
    fireEvent.click(within(grup).getByRole('button', { name: 'Entregat per la societat' }));
    expect(within(grup).getByRole('button', { name: 'Entregat per la societat' }).getAttribute('aria-pressed')).toBe('true');
    /* 17 dècims a 23 € i 10 paperetes a 3 €. */
    expect(screen.getByText('Total a liquidar: 421,00 €')).toBeTruthy();
  });

  test('el depositari amb compte només signa les seues', () => {
    pinta(LOTERIA, { actor: PAU });
    const forn = screen.getByRole('group', { name: 'Signatures de Forn' });
    expect(within(forn).getAllByRole('button').map((b) => b.textContent)).toEqual(['Rebut pel depositari', 'Pagat pel depositari']);
    expect(within(screen.getByRole('group', { name: 'Signatures de Bar de la Plaça' })).queryByRole('button')).toBeNull();
  });
});

describe('Escola · Educand · privada i no punitiva', () => {
  const ESCOLA = llista('escola_educand', [
    { id: 'e1', ordre: 1, nom: 'Solfeig', capaMode: { professor: 'Professorat de mostra', mesos: [{ mes: 'setembre', setmanes: ['E', 'B', null, null, null], nota: 6 }, { mes: 'octubre', setmanes: [null, null, null, null, null], nota: 8 }], dialeg: [] } }
  ], { configMode: { families: [PAU.id] } });

  test('per a qui no és del professorat ni de la família, només l’avís', () => {
    pinta(ESCOLA, { actor: ROSA });
    expect(screen.getByText('Fitxa privada: només la veuen el professorat i la família.')).toBeTruthy();
    expect(screen.queryByText('Solfeig')).toBeNull();
  });

  test('la família veu les lletres en paraules, l’evolució i hi pot escriure', () => {
    pinta(ESCOLA, { actor: PAU });
    expect(screen.getByText('Excel·lent: 1')).toBeTruthy();
    expect(screen.getByText('Cal millorar: 0')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Evolució de Solfeig: 6, 8' })).toBeTruthy();
    expect(screen.queryByText('Anota Solfeig')).toBeNull();
    fireEvent.change(screen.getByLabelText('Escriu una observació'), { target: { value: 'Practica cada dia.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envia' }));
    expect(screen.getByText('Família · Practica cada dia.')).toBeTruthy();
  });

  test('sense exportador de WhatsApp a la taula: la fitxa d’un menor no ix cap a un xat de fora', () => {
    pinta(ESCOLA);
    fireEvent.click(screen.getByRole('button', { name: 'Amplia en taula' }));
    const dialeg = screen.getByRole('dialog', { name: /Taula: Llista escola_educand/ });
    expect(within(dialeg).queryByRole('button', { name: 'Copia per a WhatsApp' })).toBeNull();
    expect(within(dialeg).getByRole('button', { name: 'Descarrega CSV' })).toBeTruthy();
  });
});

describe('dins del mode de selecció del xat · només lectura', () => {
  test('cap botó, cap camp ni cap píndola dins de la targeta', () => {
    pinta(REBOST, { interactiva: false });
    const card = regio('Llista rebost');
    expect(within(card).queryAllByRole('button')).toEqual([]);
    expect(within(card).queryAllByRole('combobox')).toEqual([]);
    expect(within(card).getByText('Tomaca').closest('[data-estat]').getAttribute('data-estat')).toBe('actiu');
  });

  test('un error pendent es llig, però sense botó ni alerta; i el filtre triat no amaga res', async () => {
    const onMuta = () => Promise.reject({ codi: 'ple' });
    const { rerender } = pinta(REBOST, { onMuta });
    fireEvent.click(screen.getByRole('button', { name: 'Al cistell' }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Oli, 1 l, Al cistell' })); });
    expect(screen.getByRole('alert')).toBeTruthy();
    rerender(<UniversalListCard llista={REBOST} actor={ANNA} rellotge={rellotge} generaId={generaId} onMuta={onMuta} interactiva={false} />);
    const card = regio('Llista rebost');
    expect(within(card).queryAllByRole('button')).toEqual([]);
    expect(within(card).queryByRole('alert')).toBeNull();
    expect(within(card).getByText('Tomaca')).toBeTruthy();
  });

  test('sense actor, la peça es llig però cap rajola és un botó', () => {
    pinta(REBOST, { actor: null });
    expect(screen.queryByRole('button', { name: /^Tomaca/ })).toBeNull();
    expect(screen.getByText('Tomaca').closest('[data-estat]').tagName).toBe('SPAN');
  });
});

describe('la vista estesa i el port', () => {
  test('la taula porta una fila per element i la quantitat del Rebost s’escriu a mà', () => {
    pinta(REBOST);
    fireEvent.click(screen.getByRole('button', { name: 'Amplia en taula' }));
    const dialeg = screen.getByRole('dialog', { name: 'Taula: Llista rebost' });
    const taula = within(dialeg).getByRole('region', { name: 'Taula: Llista rebost' });
    expect(within(taula).getAllByRole('columnheader').map((c) => c.textContent))
      .toEqual(['Nom', 'Quantitat', 'Estat', 'Demanat per', 'Preu al poble', 'Preu a la gran superfície', 'Accions']);
    fireEvent.change(within(taula).getByLabelText('Quantitat de Tomaca'), { target: { value: '5 kg' } });
    fireEvent.click(within(taula).getByRole('button', { name: 'Desa' }));
    expect(within(taula).getByRole('rowheader', { name: 'Tomaca' }).closest('tr').textContent).toContain('5 kg');
  });

  test('un error del port desfà el toc i el diu', async () => {
    const onMuta = vi.fn(() => Promise.reject({ codi: 'ple' }));
    pinta(REBOST, { onMuta });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Tomaca, 2 kg, Falta' })); });
    expect(onMuta).toHaveBeenCalledWith(expect.objectContaining({ revisioBase: 1, accio: { tipus: 'commuta', elementId: 'r1' } }));
    expect(screen.getByRole('button', { name: 'Tomaca, 2 kg, Falta' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Algú s’ha avançat i ja no queda lloc.');
  });

  test('una llista que no té la forma neutra diu que no es pot llegir', () => {
    pinta({ mode: 'rebost' });
    expect(screen.getByRole('alert').textContent).toContain('No es pot llegir esta llista.');
  });
});

describe('revisió adversarial 261020 · el focus, els noms i els camps', () => {
  test('quan el control premut desapareix, el focus torna al títol i no cau al <body>', async () => {
    pinta(REBOST);
    const buida = screen.getByRole('button', { name: /Buida el cistell/ });
    buida.focus();
    fireEvent.click(buida);
    await act(async () => { await new Promise((r) => requestAnimationFrame(r)); });
    expect(document.activeElement.textContent).toBe('Llista rebost');
    expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Cistell buidat: 1.');
  });

  test('a la taula del Bar, la capçalera de fila és el nom de la línia', () => {
    pinta(llista('bar_tpv', [{ id: 'b1', ordre: 1, nom: 'Torrada', capaMode: { estat: 'demanat', quantitat: 3, preuCents: 250, desti: 'cuina', demanatPer: signa(PAU) } }]));
    fireEvent.click(screen.getByRole('button', { name: 'Amplia en taula' }));
    expect(screen.getByRole('rowheader', { name: 'Torrada' })).toBeTruthy();
  });

  test('una persona sense nom és «Algú», mai el seu id intern', () => {
    pinta(llista('colla_cens', [{ id: 'c1', ordre: 1, nom: 'Druida', capaMode: { quota: 1, adjudicacions: [{ usuariId: 'uuid-intern', nom: '', at: ARA }] } }]), { actor: PAU });
    expect(screen.getByText('Agafat per Algú')).toBeTruthy();
    expect(document.body.textContent).not.toContain('uuid-intern');
  });

  test('Loteria: buidar el camp de retornats no és un zero', () => {
    pinta(llista('loteria_diposit', [{ id: 'l1', ordre: 1, nom: 'Bar de la Plaça', capaMode: { format: 'decims', entregats: 20, retornats: 3, signatures: {} } }]));
    const camp = screen.getByLabelText('Sobrants retornats de Bar de la Plaça');
    fireEvent.change(camp, { target: { value: '' } });
    fireEvent.submit(camp.closest('form'));
    expect(screen.getByRole('alert').textContent).toContain('Este valor no és vàlid.');
    expect(screen.getByText(/Retornats: 3/)).toBeTruthy();
  });
});
