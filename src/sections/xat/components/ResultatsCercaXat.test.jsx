/* T69 · Els resultats de la cerca global del Xat: pinta el que torna
   cercaXat() de veres (cap mock del motor), per grups, amb <mark>, l'avís de
   l'abast i els estats buits honestos. */
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
/* F4 (D.3) · La prova de les cinc llengües: els diccionaris carregats abans de
   cap prova (src/config/i18n.idiomes.test.js, «peresa»). */
import '../../../../tests/helpers/diccionaris.js';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../../config/i18n.js';
import CA from '../../../config/idiomes/ca.js';
import ES from '../../../config/idiomes/es.js';
import EN from '../../../config/idiomes/en.js';
import EU from '../../../config/idiomes/eu.js';
import GL from '../../../config/idiomes/gl.js';
import ResultatsCercaXat from './ResultatsCercaXat.jsx';
import { cercaXat } from '../cercaXat.js';
import { agrupaComunitats, mapejaFil } from '../missatges.js';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

const FILS = [
  { id: 'f1', name: 'José Martí', tipus: 'directe', ultimText: 'Ens veiem a la plaça', ultimAl: '2026-09-28T10:00:00Z' },
  { id: 'f2', name: 'Comissió de Festes', tipus: 'grup', ultimText: 'Cal comprar coets', ultimAl: '2026-09-27T10:00:00Z' }
];
const MISSATGES = {
  f1: [{ id: 'm1', seq: 1, text: 'La plaça està plena', sender: 'other', author: 'José', creatAl: '2026-09-28T09:00:00Z' }],
  f2: [{ id: 'm2', seq: 1, text: 'Mira https://socdepoble.org/mur', sender: 'me', creatAl: '2026-09-27T09:00:00Z' }]
};
const MEMBRES = [
  { usuari_id: 'u-placa', nom: 'Pere de la Plaça', tipus: 'persona' },
  { usuari_id: 'jo', nom: 'Jo de la Plaça', tipus: 'persona' }
];

function pinta({ terme = '', filtre = null, ...props } = {}) {
  const resultat = cercaXat({ terme, filtre, fils: FILS, membres: MEMBRES, missatgesPerFil: MISSATGES, joId: 'jo' });
  return render(<ResultatsCercaXat resultat={resultat} terme={terme} filtre={filtre} onObriFil={() => {}} onObriPersona={() => {}} t={t} locale="ca-ES" {...props} />);
}

test('tres grups amb el terme ressaltat (plegat d’accents) i l’avís de l’abast', () => {
  const onObriFil = vi.fn();
  const onObriPersona = vi.fn();
  pinta({ terme: 'placa', onObriFil, onObriPersona });
  const regio = screen.getByRole('region', { name: 'Resultats de la cerca' });
  expect(within(regio).getAllByRole('heading').map((h) => h.textContent)).toEqual(['Converses', 'Persones', 'Missatges']);
  /* «placa» troba «plaça»: el mateix plegat que /cerca. */
  const marques = [...regio.querySelectorAll('mark')].map((m) => m.textContent);
  expect(marques).toEqual(expect.arrayContaining(['plaça']));
  /* Mai un mateix. */
  expect(within(regio).queryByText(/Jo de la Plaça/)).toBeNull();
  expect(within(regio).getByText('Només es busca en les converses obertes en esta sessió.')).toBeTruthy();

  const converses = screen.getByRole('heading', { name: 'Converses' }).closest('section');
  fireEvent.click(within(converses).getByRole('button'));
  expect(onObriFil).toHaveBeenCalledWith(FILS[0]);
  const persones = screen.getByRole('heading', { name: 'Persones' }).closest('section');
  fireEvent.click(within(persones).getByRole('button', { name: /Pere de la Plaça/ }));
  expect(onObriPersona).toHaveBeenCalledWith(MEMBRES[0]);
  /* El missatge d'una altra persona diu qui l'ha escrit. */
  const missatges = screen.getByRole('heading', { name: 'Missatges' }).closest('section');
  expect(within(missatges).getByText('José:', { exact: false })).toBeTruthy();
});

test('un filtre sense dades diu la veritat; amb dades, només missatges', () => {
  pinta({ filtre: 'fotos' });
  expect(screen.getByRole('status').textContent).toBe("Encara no hi ha cap missatge d'este tipus en les converses obertes.");
  expect(screen.queryByRole('heading')).toBeNull();
  cleanup();

  pinta({ filtre: 'enllacos' });
  expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual(['Missatges']);
  /* Gauntlet F4 · Amb resultats, la zona viva hi és, buida i només per al
     lector (vegeu «la zona viva és un sol node»). */
  const zona = screen.getByRole('status');
  expect(zona.textContent).toBe('');
  expect(zona.className).toBe('sdp-nomes-lector');
});

test('sense cap resultat ho diu amb el terme', () => {
  pinta({ terme: 'zzz' });
  expect(screen.getByRole('status').textContent).toBe('Cap resultat per a «zzz».');
});

/* T67 també als resultats: una comunitat és la seua fila (avatar quadrat
   apilat, xebró, els grups de dins i mai «Cap missatge.»); el General porta
   la bafarada i no una «G»; els Avisos, el megàfon encara que tinguen imatge;
   i totes diuen el tipus en text per a lectors de pantalla. */
test('T67 · una comunitat, un grup i un canal es pinten als resultats com a la llista', () => {
  const fils = [
    { id: 'c-1', tipus: 'comunitat', titol: 'Sóc de Poble' },
    { id: 'a-1', tipus: 'canal', titol: 'Avisos de Sóc de Poble', comunitatId: 'c-1', imatgeUrl: '/logo.svg', ultimText: 'Benvinguts', ultimAl: '2026-09-28T10:00:00Z' },
    { id: 'g-1', tipus: 'grup', titol: 'General de Sóc de Poble', comunitatId: 'c-1', ultimText: 'Hola', ultimAl: '2026-09-28T09:00:00Z' }
  ].map((f) => mapejaFil(f));
  const comunitats = agrupaComunitats(fils);
  const resultat = cercaXat({ terme: 'poble', fils, membres: [], missatgesPerFil: {}, joId: 'jo' });
  render(<ResultatsCercaXat resultat={resultat} terme="poble" comunitats={comunitats} onObriFil={() => {}} onObriPersona={() => {}} t={t} locale="ca-ES" />);
  const converses = screen.getByRole('heading', { name: 'Converses' }).closest('section');
  const files = within(converses).getAllByRole('button');
  const perNom = (nom) => files.find((b) => b.querySelector('.sdp-xat-fila__nom').textContent.startsWith(nom));

  const comunitat = perNom('Sóc de Poble,');
  expect(comunitat).toBeTruthy();
  expect(within(comunitat).getByText(', Comunitat')).toBeTruthy();
  expect(comunitat.querySelector('.sdp-xat-apilat .sdp-xat-avatar--quadrat')).toBeTruthy();
  expect(comunitat.querySelector('.sdp-xat-fila__xebro')).toBeTruthy();
  expect(comunitat.querySelector('time')).toBeNull();
  expect(comunitat.querySelector('.sdp-xat-fila__previa').textContent).toBe('Avisos de Sóc de Poble, General de Sóc de Poble');
  expect(comunitat.textContent).not.toContain('Cap missatge.');

  const avisos = perNom('Avisos');
  expect(within(avisos).getByText(", Canal d'avisos")).toBeTruthy();
  expect(avisos.querySelector('svg.lucide-megaphone')).toBeTruthy();
  expect(avisos.querySelector('img')).toBeNull();

  const general = perNom('General');
  expect(within(general).getByText(', Grup')).toBeTruthy();
  expect(general.querySelector('svg.lucide-message-circle-more')).toBeTruthy();
  expect(general.querySelector('.sdp-avatar')).toBeNull();
});

/* IDEA-53 (pla 261029_1605, Bloc B) · Les previes dels resultats, sense les
   marques de la negreta i sense <strong>: el text del missatge i l'últim de
   la conversa, amb terme o només amb un filtre. */
test('IDEA-53 · els resultats no porten els asteriscs de la negreta', () => {
  const fils = [{ id: 'f9', name: 'Festes', tipus: 'grup', ultimText: '*Avís*: coets', ultimAl: '2026-09-28T10:00:00Z' }];
  const missatges = { f9: [{ id: 'm9', seq: 1, text: '*Mira* https://socdepoble.org/mur', sender: 'other', author: 'Pep', creatAl: '2026-09-28T09:00:00Z' }] };
  const ambTerme = cercaXat({ terme: 'avis', fils, missatgesPerFil: missatges, joId: 'jo' });
  const vista = render(<ResultatsCercaXat resultat={ambTerme} terme="avis" filtre={null} onObriFil={() => {}} onObriPersona={() => {}} t={t} locale="ca-ES" />);
  const previa = vista.container.querySelector('.sdp-xat-fila__previa');
  expect(previa.textContent).toBe('Avís: coets');
  expect(previa.querySelector('strong')).toBeNull();
  cleanup();

  const perFiltre = cercaXat({ filtre: 'enllacos', fils, missatgesPerFil: missatges, joId: 'jo' });
  const altra = render(<ResultatsCercaXat resultat={perFiltre} terme="" filtre="enllacos" onObriFil={() => {}} onObriPersona={() => {}} t={t} locale="ca-ES" />);
  expect(altra.container.querySelector('.sdp-xat-fila__previa').textContent).toBe('Pep: Mira https://socdepoble.org/mur');
});

/* Gauntlet del Bloc B (QA-B03) · Una adreça és una peça opaca: les previes
   dels resultats la conserven sencera, asteriscs inclosos. */
test('QA-B03 · els resultats conserven sencera l’adreça amb asteriscs', () => {
  const fils = [{ id: 'f9', name: 'Festes', tipus: 'grup', ultimText: '*Coets* a https://example.test/?q=*x*', ultimAl: '2026-09-28T10:00:00Z' }];
  const missatges = { f9: [{ id: 'm9', seq: 1, text: '*Mira* https://example.test/?q=*x*', sender: 'other', author: 'Pep', creatAl: '2026-09-28T09:00:00Z' }] };
  const ambTerme = cercaXat({ terme: 'coets', fils, missatgesPerFil: missatges, joId: 'jo' });
  const vista = render(<ResultatsCercaXat resultat={ambTerme} terme="coets" filtre={null} onObriFil={() => {}} onObriPersona={() => {}} t={t} locale="ca-ES" />);
  expect(vista.container.querySelector('.sdp-xat-fila__previa').textContent).toBe('Coets a https://example.test/?q=*x*');
  cleanup();

  const perFiltre = cercaXat({ filtre: 'enllacos', fils, missatgesPerFil: missatges, joId: 'jo' });
  const altra = render(<ResultatsCercaXat resultat={perFiltre} terme="" filtre="enllacos" onObriFil={() => {}} onObriPersona={() => {}} t={t} locale="ca-ES" />);
  expect(altra.container.querySelector('.sdp-xat-fila__previa').textContent).toBe('Pep: Mira https://example.test/?q=*x*');
});

/* F4 (D.3, ordre del Mestre del 261030) · Buit només per la píndola de la
   llista (`pindola`, el seu nom) amb resultats a «Tot» (`resultatsATot`):
   l'estat buit ho diu, en singular o plural, també amb un filtre de cerca
   (Fotos), i porta un botó fora de la regió viva que crida `onTornaATot`. */
test('F4 D.3 · buit per la píndola: diu el filtre, quants n’hi ha a «Tot» i hi torna', () => {
  const onTornaATot = vi.fn();
  pinta({ terme: 'zzz', pindola: 'Preferits', resultatsATot: 3, onTornaATot });
  expect(screen.getByRole('status').textContent).toBe('Cap resultat amb el filtre «Preferits». Hi ha 3 resultats a «Tot».');
  const boto = screen.getByRole('button', { name: 'Torna a «Tot»' });
  expect(boto.getAttribute('type')).toBe('button');
  expect(boto.className).toBe('sdp-xat-pindola');
  expect(boto.parentElement.className).toBe('sdp-workspace-state');
  expect(boto.closest('[role="status"]')).toBeNull();
  /* Gauntlet F4 · El text visible, damunt del botó, no és la zona viva. */
  expect(boto.previousElementSibling.textContent).toBe('Cap resultat amb el filtre «Preferits». Hi ha 3 resultats a «Tot».');
  expect(boto.previousElementSibling.hasAttribute('role')).toBe(false);
  fireEvent.click(boto);
  expect(onTornaATot).toHaveBeenCalledTimes(1);
  cleanup();

  pinta({ terme: 'zzz', pindola: 'No llegits', resultatsATot: 1, onTornaATot });
  expect(screen.getByRole('status').textContent).toBe('Cap resultat amb el filtre «No llegits». Hi ha 1 resultat a «Tot».');
  cleanup();

  pinta({ filtre: 'fotos', pindola: 'Grups', resultatsATot: 2, onTornaATot });
  expect(screen.getByRole('status').textContent).toBe('Cap resultat amb el filtre «Grups». Hi ha 2 resultats a «Tot».');
  expect(screen.queryByRole('heading')).toBeNull();
});

/* F4 (D.3) · Llei del Píxel: sense res a «Tot», sense píndola o amb
   resultats a la vista, el DOM és el d'abans, atribut a atribut (fora dels
   ids de useId, que canvien d'un muntatge a un altre). */
test('F4 D.3 · Llei del Píxel: fora de l’estat buit per la píndola, el DOM no canvia', () => {
  const html = (props) => {
    const { container } = pinta(props);
    /* Un sol fill (la regió): el seu outerHTML és tot el que s'ha pintat
       (lint_xat veta la paraula de l'HTML interior fins i tot a les proves). */
    expect(container.children).toHaveLength(1);
    const text = container.firstElementChild.outerHTML.replace(/ (id|aria-labelledby)="[^"]*"/g, '');
    cleanup();
    return text;
  };
  const tornar = () => {};
  for (const base of [{ terme: 'zzz' }, { terme: 'placa' }, { filtre: 'fotos' }, { filtre: 'enllacos' }]) {
    const abans = html(base);
    expect(html({ ...base, pindola: 'Preferits', resultatsATot: 0, onTornaATot: tornar })).toBe(abans);
    expect(html({ ...base, pindola: null, resultatsATot: 4, onTornaATot: tornar })).toBe(abans);
    expect(html({ ...base, pindola: 'Preferits', resultatsATot: 4 })).toBe(abans);
  }
  /* Amb resultats a la vista, la píndola i el recompte no hi pinten res. */
  expect(html({ terme: 'placa', pindola: 'Preferits', resultatsATot: 4, onTornaATot: tornar })).toBe(html({ terme: 'placa' }));
  expect(html({ filtre: 'enllacos', pindola: 'Grups', resultatsATot: 4, onTornaATot: tornar })).toBe(html({ filtre: 'enllacos' }));
});

/* F4 (D.3) · Les claus noves existixen en les cinc llengües i s'omplin: cap
   «{filtre}», «{n}» ni «{tot}» cru en pantalla. */
test('F4 D.3 · el text de l’estat buit per la píndola es tradueix i s’omple en les cinc llengües', () => {
  const vistos = { 1: new Set(), 2: new Set() };
  for (const { code } of SUPPORTED_LANGUAGES) {
    const tl = createTranslator(code);
    for (const n of [1, 2]) {
      const resultat = cercaXat({ terme: 'zzz', fils: FILS, membres: MEMBRES, missatgesPerFil: MISSATGES, joId: 'jo' });
      render(<ResultatsCercaXat resultat={resultat} terme="zzz" pindola={tl('section.xat.filtres.preferits')} resultatsATot={n} onTornaATot={() => {}} onObriFil={() => {}} onObriPersona={() => {}} t={tl} locale={code} />);
      const text = screen.getByRole('status').textContent;
      const boto = screen.getByRole('button').textContent;
      expect(text, `${code} ${n}`).not.toMatch(/[{}]/);
      expect(boto, code).not.toMatch(/[{}]/);
      expect(text).toContain(tl('section.xat.filtres.preferits'));
      expect(text).toContain(tl('section.xat.filtres.tot'));
      expect(text).toContain(String(n));
      expect(boto).toContain(tl('section.xat.filtres.tot'));
      vistos[n].add(`${text}|${boto}`);
      cleanup();
    }
  }
  /* Cada llengua diu el seu: cap no cau a la reserva valenciana. */
  expect(vistos[1].size).toBe(SUPPORTED_LANGUAGES.length);
  expect(vistos[2].size).toBe(SUPPORTED_LANGUAGES.length);
  /* I cada diccionari porta les quatre claus, amb els seus buits. */
  const BUITS = {
    'section.xat.cerca.pindola.buit': ['{filtre}'],
    'section.xat.cerca.pindola.aTot': ['{n}', '{tot}'],
    'section.xat.cerca.pindola.aTot.un': ['{n}', '{tot}'],
    'section.xat.cerca.pindola.tornaATot': ['{tot}']
  };
  for (const diccionari of [CA, ES, EN, EU, GL]) {
    for (const [clau, buits] of Object.entries(BUITS)) {
      expect(typeof diccionari[clau], clau).toBe('string');
      for (const buit of buits) expect(diccionari[clau], clau).toContain(buit);
    }
  }
});

/* Gauntlet F4 (xat-estat-buit-zona-viva-reemplacada) · Un lector no anuncia
   amb seguretat una regió role="status" que naix amb el text posat. La zona
   viva de la cerca és un sol node, sempre muntat i sempre el primer fill:
   l'estat buit de sempre (visible), l'estat buit per la píndola i els
   resultats (només per al lector) en canvien el text i la classe, mai el node. */
const element = ({ terme = '', filtre = null, ...props } = {}) => (
  <ResultatsCercaXat
    resultat={cercaXat({ terme, filtre, fils: FILS, membres: MEMBRES, missatgesPerFil: MISSATGES, joId: 'jo' })}
    terme={terme} filtre={filtre} onObriFil={() => {}} onObriPersona={() => {}} t={t} locale="ca-ES" {...props}
  />
);

test('Gauntlet F4 · la zona viva és un sol node, el primer, en totes les variants', () => {
  const comu = { pindola: 'Preferits', onTornaATot: () => {} };
  const vista = render(element({ ...comu, terme: 'zzq' }));
  const regio = screen.getByRole('region', { name: 'Resultats de la cerca' });
  const zona = screen.getByRole('status');
  const passos = [
    [{ terme: 'zzq' }, 'Cap resultat per a «zzq».', 'sdp-workspace-state'],
    [{ terme: 'zzq', resultatsATot: 2 }, 'Cap resultat amb el filtre «Preferits». Hi ha 2 resultats a «Tot».', 'sdp-nomes-lector'],
    [{ terme: 'zzqx' }, 'Cap resultat per a «zzqx».', 'sdp-workspace-state'],
    [{ terme: 'placa' }, '', 'sdp-nomes-lector'],
    [{ terme: 'zzq', resultatsATot: 1 }, 'Cap resultat amb el filtre «Preferits». Hi ha 1 resultat a «Tot».', 'sdp-nomes-lector'],
    [{ filtre: 'fotos' }, "Encara no hi ha cap missatge d'este tipus en les converses obertes.", 'sdp-workspace-state'],
    [{ filtre: 'enllacos' }, '', 'sdp-nomes-lector']
  ];
  for (const [props, text, classe] of passos) {
    vista.rerender(element({ ...comu, ...props }));
    const zones = screen.getAllByRole('status');
    expect(zones, JSON.stringify(props)).toHaveLength(1);
    expect(zones[0], JSON.stringify(props)).toBe(zona);
    expect(regio.firstElementChild).toBe(zona);
    expect(zona.textContent).toBe(text);
    expect(zona.className).toBe(classe);
  }
});

/* La pàgina que hi ha damunt (XatSection, simplificada): «Preferits» amaga
   totes les converses i persones; «Tot», cap. */
function ClosCaDeProva() {
  const [pindola, setPindola] = useState('Preferits');
  const [terme, setTerme] = useState('placa');
  const resultat = cercaXat({ terme, fils: pindola ? [] : FILS, membres: pindola ? [] : MEMBRES, missatgesPerFil: MISSATGES, joId: 'jo' });
  const aTot = cercaXat({ terme, fils: FILS, membres: MEMBRES, missatgesPerFil: MISSATGES, joId: 'jo' });
  const n = aTot.converses.length + aTot.persones.length + aTot.missatges.length;
  return (
    <>
      <button type="button" onClick={() => setPindola('Preferits')}>Preferits</button>
      <button type="button" onClick={() => setPindola(null)}>Tot</button>
      <input aria-label="Terme" value={terme} onChange={(e) => setTerme(e.target.value)} />
      <ResultatsCercaXat
        resultat={resultat} terme={terme} pindola={pindola} resultatsATot={pindola ? n : 0} onTornaATot={() => setPindola(null)}
        onObriFil={() => {}} onObriPersona={() => {}} t={t} locale="ca-ES"
      />
    </>
  );
}

test('Gauntlet F4 · «Torna a «Tot»» diu a la zona viva quants n’hi ha, fins que la cerca canvia', () => {
  render(<ClosCaDeProva />);
  const zona = screen.getByRole('status');
  const quants = zona.textContent.match(/Hi ha (\d+) resultats a «Tot»\.$/)?.[1];
  expect(Number(quants)).toBeGreaterThan(1);
  expect(zona.textContent).toBe(`Cap resultat amb el filtre «Preferits». Hi ha ${quants} resultats a «Tot».`);

  fireEvent.click(screen.getByRole('button', { name: 'Torna a «Tot»' }));
  expect(screen.getByRole('status')).toBe(zona);
  expect(zona.textContent).toBe(`Hi ha ${quants} resultats a «Tot».`);
  expect(zona.className).toBe('sdp-nomes-lector');
  expect(screen.getAllByRole('heading').length).toBeGreaterThan(0);
  expect(screen.queryByRole('button', { name: 'Torna a «Tot»' })).toBeNull();

  /* Un altre terme: l'avís ja no val i s'oblida, també si el terme torna. */
  const camp = screen.getByRole('textbox', { name: 'Terme' });
  fireEvent.change(camp, { target: { value: 'plac' } });
  expect(zona.textContent).toBe('');
  fireEvent.change(camp, { target: { value: 'placa' } });
  expect(zona.textContent).toBe('');

  /* Tornar a «Tot» amb la píndola no repetix un avís vell. */
  fireEvent.click(screen.getByRole('button', { name: 'Preferits' }));
  fireEvent.click(screen.getByRole('button', { name: 'Torna a «Tot»' }));
  expect(zona.textContent).toBe(`Hi ha ${quants} resultats a «Tot».`);
  fireEvent.click(screen.getByRole('button', { name: 'Preferits' }));
  expect(zona.textContent).toBe(`Cap resultat amb el filtre «Preferits». Hi ha ${quants} resultats a «Tot».`);
  fireEvent.click(screen.getByRole('button', { name: 'Tot' }));
  expect(screen.getByRole('status')).toBe(zona);
  expect(zona.textContent).toBe('');
});

/* Gauntlet F4 · Llei del Píxel: l'estat buit de sempre és, atribut a atribut,
   el node d'abans; a la resta, l'única peça nova és un <p> buit o amb text per
   al lector (absolut i retallat: no ocupa lloc), i el text visible de l'estat
   buit per la píndola perd només el role. */
test('Gauntlet F4 · Llei del Píxel: la zona viva no canvia res del que es veu', () => {
  const fills = (vista) => [...vista.container.querySelector('.sdp-xat-resultats').children].map((e) => e.outerHTML);
  const avis = '<p class="sdp-xat-resultats__avis">Només es busca en les converses obertes en esta sessió.</p>';
  expect(fills(pinta({ terme: 'zzz' }))).toEqual([
    '<p class="sdp-workspace-state" role="status">Cap resultat per a «zzz».</p>',
    avis
  ]);
  cleanup();

  const text = 'Cap resultat amb el filtre «Preferits». Hi ha 3 resultats a «Tot».';
  expect(fills(pinta({ terme: 'zzz', pindola: 'Preferits', resultatsATot: 3, onTornaATot: () => {} }))).toEqual([
    `<p class="sdp-nomes-lector" role="status">${text}</p>`,
    `<div class="sdp-workspace-state"><p>${text}</p><button type="button" class="sdp-xat-pindola">Torna a «Tot»</button></div>`,
    avis
  ]);
  cleanup();

  const amb = fills(pinta({ terme: 'placa' }));
  expect(amb[0]).toBe('<p class="sdp-nomes-lector" role="status"></p>');
  expect(amb.slice(1).map((html) => html.slice(0, html.indexOf(' ')))).toEqual(['<section', '<section', '<section', '<p']);
});
