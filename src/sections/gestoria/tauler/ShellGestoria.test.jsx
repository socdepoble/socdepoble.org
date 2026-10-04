/* Gestoria · ShellGestoria: la closca de la Gestoria (ordre del Mestre,
   261004; onada 2, pas 1 del MAPA). El rail del mòdul, la boina personal
   (identitat de la configuració local, un sol ull amb aria-pressed i la data
   de la lectura), la porta de veres del tractor 'gestoria.tauler' (catàleg
   real, empremta real, autenticador WebAuthn simulat, magatzem en memòria),
   el Tauler amb les xifres amagades, la pàgina pròpia de cada targeta i el
   Full trimestral, que és ContenidorGestoria tal qual. Dades sintètiques:
   l'entitat 9999 de prova i una empresa i una població inventades. */
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext';
import { creaAutenticadorSimulat } from '../../../../tests/helpers/autenticadorSimulat.js';
import { crearMagatzemMemoria } from '../../tractors/nucli/magatzem.js';
import { TRACTORS, empremtaDe } from '../../tractors/registreTractors.js';
import { CONSULTA_TRACTORS } from '../ContenidorGestoria.jsx';
import { TRACTOR_TAULER } from '../tractors.js';
import ShellGestoria, {
  MODULS_GESTORIA, RUTA_TITULAR, TITULAR_SENSE_CONFIGURAR, pastillaDeSincronitzacio, titularDe
} from './ShellGestoria.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const subtle = webcrypto.subtle;
const ARA = Date.UTC(2026, 9, 4, 8, 0, 0);
const rellotge = () => ARA;
const AVUI = () => new Date(2026, 9, 4, 10, 0, 0);
/* Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
   Gestoria i Wiki»): la closca viu a la seua app, /app/gestoria/tauler, i ja
   no a un ítem de la Wiki. */
const RUTA = '/app/gestoria/tauler';

/* L'empremta de la versió d'ara de cada tractor: la que el Mestre aprova. */
const INFO = Object.fromEntries(await Promise.all(TRACTORS.map(async (t) => [t.id, await empremtaDe(t, subtle)])));
const autenticador = await creaAutenticadorSimulat({ subtle });

async function ambSignatura(manifest = TRACTOR_TAULER) {
  const magatzem = crearMagatzemMemoria();
  await magatzem.afegixClau(autenticador.clau);
  await magatzem.afegixRegistre(await autenticador.signa({
    manifest, empremta: INFO[manifest.id].empremta, ara: ARA - 60000, nonce: new Uint8Array(16).fill(4)
  }));
  return magatzem;
}

/* ── Fitxers sintètics ───────────────────────────────────────────────── */
const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const N43 = [
  `119999000100000043212606012606302${xifres(100000, 14)}9783${text('TITULAR SINTETIC', 26)}${text('', 3)}`,
  `22${text('', 4)}000126061026061099000${'1'}${xifres(2500, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`,
  `3399990001000000432100001${xifres(2500, 14)}00000${xifres(0, 14)}2${xifres(97500, 14)}978${text('', 4)}`,
  `88${'9'.repeat(18)}${xifres(3, 6)}${text('', 54)}`
].join('\r\n');
const CONFIG = JSON.stringify({
  esquema: 'sdp.gestoria.config-empresa.v1', nom: 'Empresa de Prova SL', nomComercial: 'Taller de Prova',
  domicilis: [{ id: 'fiscal', adreca: 'Carrer Inventat 1', codiPostal: '00000', poblacio: 'Poble de Prova' }],
  domiciliFiscal: 'fiscal'
});
const fitxer = (name, contingut) => {
  const bytes = new TextEncoder().encode(contingut);
  return { name, size: bytes.length, arrayBuffer: async () => bytes.slice().buffer };
};

function RutaDeLApp() {
  const { pathname, search } = useLocation();
  return <output aria-label="Ruta">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

function munta({ magatzem = crearMagatzemMemoria(), titular, modulActiu, mostrarRail } = {}) {
  const entorn = { location: { origin: autenticador.origen, hostname: autenticador.rpId } };
  const arbre = (modul = modulActiu) => (
    <MemoryRouter rutaInicial={RUTA}>
      <ShellGestoria magatzem={magatzem} subtle={subtle} entorn={entorn} rellotge={rellotge} inflate={null}
        avui={AVUI} descarrega={vi.fn()} titular={titular} modulActiu={modul} mostrarRail={mostrarRail} />
      <RutaDeLApp />
    </MemoryRouter>
  );
  const vista = render(arbre());
  return { ...vista, closca: vista.container.querySelector('.sdp-gestoria-closca'),
    canviaModul: (modul) => vista.rerender(arbre(modul)) };
}

const ruta = () => screen.getByLabelText('Ruta').textContent;
const h1 = (closca) => closca.querySelector('header.page-title > h1').textContent;
const boina = (closca) => closca.querySelector('section.bar-orange');
const serialitzat = (node) => new XMLSerializer().serializeToString(node);
const rail = () => within(screen.getByRole('navigation', { name: 'Panell de control de la Gestoria' }));
const triaModul = (nom) => fireEvent.click(rail().getByText(nom).closest('button'));

async function llegixExtractes() {
  const input = await screen.findByLabelText('Tria els extractes del banc');
  await act(async () => {
    fireEvent.change(input, { target: { files: [fitxer('extracte.n43', N43), fitxer('empresa.json', CONFIG)] } });
  });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Oblida les dades' })).toBeTruthy());
}

describe('el rail del mòdul', () => {
  /* Ordre del Mestre, 261004 · El menú de la closca es titula «Gestoria»: «Panell de control» es confonia amb el Panell de Control de l'app. */
  test('el rail es titula «Gestoria», no «Panell de control»', async () => {
    const { closca } = munta();
    expect(closca.querySelector('.sdp-gestoria-closca__rail-titol').textContent).toBe('Gestoria');
    expect(closca.textContent).not.toMatch(/Panell de control/i);
    await screen.findByText('Cal aprovar el tractor');
  });

  test('els nou mòduls en ordre; el Tauler d’Inici és el de la pàgina; els que no existixen diuen «en obres»', async () => {
    const { closca } = munta();
    const noms = [...closca.querySelectorAll('.sdp-gestoria-closca__modul-nom')].map((e) => e.textContent);
    expect(noms).toEqual([
      'Tauler d’Inici', 'Facturació', 'Contactes', 'Burocràcia', 'Bancs', 'Impostos', 'Full trimestral', 'Informes', 'Escàner Local'
    ]);
    expect(MODULS_GESTORIA.map((m) => m.etiqueta)).toEqual(noms);
    const botons = [...closca.querySelectorAll('.sdp-gestoria-closca__modul')];
    expect(botons.map((b) => b.getAttribute('aria-current'))).toEqual(['page', null, null, null, null, null, null, null, null]);
    expect(botons.filter((b) => b.textContent.endsWith('en obres')).map((b) => b.textContent.replace('en obres', '')))
      .toEqual(['Facturació', 'Contactes', 'Burocràcia', 'Informes', 'Escàner Local']);
    expect(h1(closca)).toBe('Tauler Central');
    await screen.findByText('Cal aprovar el tractor');
  });

  test('un mòdul en obres ho diu, amb el perquè, a la seua pàgina amb la barra taronja', async () => {
    const { closca } = munta();
    triaModul('Facturació');
    expect(h1(closca)).toBe('Facturació');
    expect(screen.getByText('En obres', { selector: 'p' })).toBeTruthy();
    expect(closca.querySelector('.sdp-buit__text').textContent).toMatch(/Veri\*Factu/);
    expect(boina(closca)).not.toBeNull();
    expect([...closca.querySelectorAll('.page-title-labels > li')].map((li) => li.textContent)).toEqual(['GESTORIA', 'PANELL INTERN', 'En obres']);
  });

  test('el Full trimestral és ContenidorGestoria tal qual: la seua porta i els seus passos', async () => {
    const { closca } = munta();
    triaModul('Full trimestral');
    expect(h1(closca)).toBe('Full trimestral');
    const primer = await screen.findByRole('heading', { level: 2, name: '1. Aprovació dels tractors' });
    expect(within(primer.closest('section')).getByText('Cal aprovar el tractor de factures')).toBeTruthy();
    expect(within(primer.closest('section')).getAllByText('Pendent')).toHaveLength(2);
  });
});

describe('la boina personal', () => {
  test('sense configuració: «Titular sense configurar», enllaçada a la pàgina del titular, un sol ull i cap data', async () => {
    const { closca } = munta();
    const barra = boina(closca);
    const autor = barra.firstElementChild;
    expect(autor.getAttribute('href')).toBe(RUTA_TITULAR);
    expect(autor.querySelector('.sp-card-author-name').textContent).toBe(TITULAR_SENSE_CONFIGURAR);
    const ulls = barra.querySelectorAll('.sdp-gestoria-ull');
    expect(ulls).toHaveLength(1);
    expect(ulls[0].getAttribute('aria-pressed')).toBe('false');
    expect(barra.querySelector('.btn-date-time')).toBeNull();
    await screen.findByText('Cal aprovar el tractor');
  });

  test('titularDe i la pastilla de la sincronització', () => {
    expect(titularDe(null)).toEqual({ nom: TITULAR_SENSE_CONFIGURAR, poble: '', avatar: null, href: RUTA_TITULAR, configurat: false });
    expect(titularDe({ nom: ' Taller de Prova ', poble: 'Poble de Prova' })).toMatchObject({ nom: 'Taller de Prova', configurat: true });
    expect(pastillaDeSincronitzacio(null)).toBeNull();
    const d = new Date(ARA);
    const dos = (n) => String(n).padStart(2, '0');
    expect(pastillaDeSincronitzacio(ARA)).toEqual({
      time: `${dos(d.getHours())}:${dos(d.getMinutes())}`,
      date: `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/26`,
      dateTime: `2026-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`
    });
  });
});

describe('la porta del tractor del Tauler', () => {
  /* La closca demana la porta amb la consulta relativa (CONSULTA_TRACTORS,
     sense tocar-la); dins de l'app, AppGestoria la porta a la Wiki, on viu
     (src/apps/gestoria/AppGestoria.test.jsx). */
  test('sense la signatura del Mestre: «Cal aprovar el tractor», cap selector i el camí al panell de Tractors', async () => {
    const { closca } = munta();
    const avis = (await screen.findByText('Cal aprovar el tractor')).closest('.sdp-alerta');
    expect(avis.textContent).toMatch(/Gestoria · Tauler de l’empresa/);
    expect(screen.queryByLabelText('Tria els extractes del banc')).toBeNull();
    /* Les targetes hi són igual, sense cap xifra: tota targeta té pàgina i tota pàgina, targeta. */
    expect([...closca.querySelectorAll('.sp-card-title')].map((e) => e.textContent)).toEqual([
      'Caixa real', 'Hisenda', 'Cobertura', 'Factures i vendes', 'Ingressos', 'Despeses', 'Rendiment'
    ]);
    expect(closca.querySelectorAll('.sp-card .sdp-gestoria-ull')).toHaveLength(0);
    fireEvent.click(within(avis).getByRole('button', { name: 'Obri el panell de Tractors' }));
    expect(ruta()).toBe(`${RUTA}${CONSULTA_TRACTORS}`);
  });

  test('una signatura d’un altre tractor no obri el Tauler', async () => {
    munta({ magatzem: await ambSignatura(TRACTORS.find((t) => t.id === 'gestoria.factures').manifest) });
    await screen.findByText('Cal aprovar el tractor');
    expect(screen.queryByLabelText('Tria els extractes del banc')).toBeNull();
  });
});

describe('el Tauler, amb la signatura', () => {
  test('la Sidebar controla el mòdul sense rail interior: conserva lectura i privacitat, però tanca el detall anterior', async () => {
    const { closca, canviaModul } = munta({ magatzem: await ambSignatura(), modulActiu: 'tauler', mostrarRail: false });
    await llegixExtractes();
    expect(closca.querySelector('.sdp-gestoria-closca__rail')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    expect(h1(closca)).toBe('Caixa real');
    fireEvent.click(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }));

    canviaModul('bancs');
    expect(h1(closca)).toBe('Bancs i Tresoreria');
    expect(screen.queryByRole('region', { name: 'El detall de Caixa real' })).toBeNull();
    expect(boina(closca).querySelector('.sp-card-author-name').textContent).toBe('Taller de Prova');
    expect(screen.getByRole('button', { name: 'Oblida les dades' })).toBeTruthy();
    expect(serialitzat(closca)).toMatch(/975,00/);

    canviaModul('impostos');
    expect(h1(closca)).toBe('Impostos');
    canviaModul('tauler');
    expect(h1(closca)).toBe('Tauler Central');
    expect(screen.queryByRole('region', { name: 'El detall de Caixa real' })).toBeNull();
    expect(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }).getAttribute('aria-pressed')).toBe('true');
    expect(closca.querySelectorAll('h1')).toHaveLength(1);
    expect(closca.querySelectorAll('section.bar-orange')).toHaveLength(1);
  });

  test('llig els extractes i la configuració: la boina diu qui ets i quan s’han llegit; les xifres, amagades', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    const barra = boina(closca);
    expect(barra.querySelector('.sp-card-author-name').textContent).toBe('Taller de Prova');
    expect(barra.querySelector('.sp-card-author-location').textContent).toBe('Poble de Prova');
    const pastilla = pastillaDeSincronitzacio(ARA);
    expect(barra.querySelector('.btn-date-time').getAttribute('datetime')).toBe(pastilla.dateTime);
    expect(closca.querySelector('.page-intro .lead').textContent).toMatch(/^Hola, Taller de Prova!/);
    /* Cap xifra al DOM fins a prémer l'ull. */
    expect(serialitzat(closca)).not.toMatch(/975,00|1\.000,00/);
    const caixa = screen.getByRole('button', { name: 'Caixa real' }).closest('article');
    expect(caixa.querySelector('.sp-card-calendar-badge').textContent).toBe('Import amagat');
    const ull = within(barra).getByRole('button', { name: 'Mostra les xifres' });
    fireEvent.click(ull);
    expect(ull.getAttribute('aria-pressed')).toBe('true');
    const mostrada = screen.getByRole('button', { name: 'Caixa real' }).closest('article');
    expect(mostrada.querySelector('.sp-card-calendar-badge').textContent).toBe('975,00 €');
    fireEvent.click(ull);
    expect(serialitzat(closca)).not.toMatch(/975,00/);
    expect(ruta()).toBe(RUTA);
  });

  test('tota targeta obri la seua pàgina pròpia dins de la closca (PaginaApp, barra taronja), i Tornar torna', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    expect(h1(closca)).toBe('Caixa real');
    expect(document.activeElement).toBe(closca.querySelector('header.page-title > h1'));
    expect(boina(closca).querySelector('.sp-card-author-name').textContent).toBe('Taller de Prova');
    const detall = screen.getByRole('region', { name: 'El detall de Caixa real' });
    expect(within(detall).getByText('Compte 1')).toBeTruthy();
    expect(serialitzat(closca)).not.toMatch(/975,00/);
    fireEvent.click(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }));
    expect(closca.querySelector('.sdp-gestoria-tauler__xifra').textContent).toBe('975,00 €');
    expect([...closca.querySelectorAll('header.bar-blue button')].map((b) => b.getAttribute('aria-label')))
      .toEqual(['Tornar arrere', 'Índex de secció', 'Traduir']);
    fireEvent.click(screen.getByRole('button', { name: 'Tornar arrere' }));
    expect(h1(closca)).toBe('Tauler Central');
    expect(ruta()).toBe(RUTA);
  });

  test('Bancs i Tresoreria: una targeta per compte i la de la conciliació', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    triaModul('Bancs');
    expect(h1(closca)).toBe('Bancs i Tresoreria');
    expect([...closca.querySelectorAll('.sp-card-title')].map((e) => e.textContent)).toEqual(['Compte 1', 'Conciliació']);
    /* Qui és el compte es llig dins de la targeta, en un paràgraf: mai al títol. */
    const compte = screen.getByRole('button', { name: 'Compte 1' }).closest('article');
    expect(compte.querySelector('.sp-card-text').textContent).toMatch(/De l’entitat 9999, acabat en 4321\./);
    expect(compte.querySelector('.sp-card-subtitle').textContent).toBe('Saldo bancari · extracte del banc');
    expect(screen.getByText('Sense factures')).toBeTruthy();
  });

  test('Impostos: el 303 i el 130 del trimestre, «estimació incompleta» sense factures, amb el termini', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await screen.findByLabelText('Tria els extractes del banc');
    triaModul('Impostos');
    expect(h1(closca)).toBe('Impostos');
    const targetes = [...closca.querySelectorAll('article.sp-card')];
    expect(targetes.map((t) => t.querySelector('.sp-card-title').textContent)).toEqual(['IVA · model 303', 'IRPF · model 130']);
    for (const t of targetes) {
      const etiquetes = [...t.querySelectorAll('.sp-card-label')].map((e) => e.textContent);
      expect(etiquetes).toEqual(['Impostos', 'Estimació incompleta', 'Termini 30/01/2027']);
      expect(t.querySelector('.sdp-gestoria-ull')).toBeNull();
    }
  });

  test('Oblida les dades ho buida tot: la boina torna a «Titular sense configurar» i sense data', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    fireEvent.click(screen.getByRole('button', { name: 'Oblida les dades' }));
    expect(boina(closca).querySelector('.sp-card-author-name').textContent).toBe(TITULAR_SENSE_CONFIGURAR);
    expect(boina(closca).querySelector('.btn-date-time')).toBeNull();
  });

  /* Ordre del Mestre, 261004: «Oblida les dades» torna a amagar les xifres. */
  test('Oblida les dades torna a tancar l’ull de la boina: la lectura següent arriba amb les xifres amagades', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    const ull = () => within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' });
    fireEvent.click(ull());
    expect(ull().getAttribute('aria-pressed')).toBe('true');
    expect(serialitzat(closca)).toMatch(/975,00/);
    fireEvent.click(screen.getByRole('button', { name: 'Oblida les dades' }));
    expect(ull().getAttribute('aria-pressed')).toBe('false');
    await llegixExtractes();
    expect(ull().getAttribute('aria-pressed')).toBe('false');
    expect(serialitzat(closca)).not.toMatch(/975,00/);
    const caixa = screen.getByRole('button', { name: 'Caixa real' }).closest('article');
    expect(caixa.querySelector('.sp-card-calendar-badge').textContent).toBe('Import amagat');
  });

  test('l’ull obert d’una targeta tampoc passa a la lectura següent', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    const badge = () => screen.getByRole('button', { name: 'Caixa real' }).closest('article').querySelector('.sp-card-calendar-badge').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Mostra la xifra de Caixa real' }));
    expect(badge()).toBe('975,00 €');
    fireEvent.click(screen.getByRole('button', { name: 'Oblida les dades' }));
    await llegixExtractes();
    expect(badge()).toBe('Import amagat');
    expect(serialitzat(closca)).not.toMatch(/975,00/);
  });
});

describe('Pedra Seca i privacitat', () => {
  test('cap style= ni al codi de la closca ni al DOM; cap dada a la URL', async () => {
    for (const fitxerJsx of ['ShellGestoria.jsx', 'Tauler.jsx']) {
      const codi = readFileSync(path.join(process.cwd(), 'src/sections/gestoria/tauler', fitxerJsx), 'utf8');
      expect(codi, fitxerJsx).not.toMatch(/\sstyle=/);
    }
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    triaModul('Bancs');
    triaModul('Impostos');
    expect(closca.querySelectorAll('[style]')).toHaveLength(0);
    expect(ruta()).toBe(RUTA);
  });

  /* Ordre del Mestre, 261004 (regla d'or 2): la closca és UNA pàgina. La Wiki
     la munta sense embolcall (WikiDePobleSection.einesLocals.test.jsx). */
  test('la closca és una sola pàgina: un H1, una barra blava i una barra taronja, també a la pàgina d’una targeta', async () => {
    const { container } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    const una = () => {
      expect(container.querySelectorAll('h1')).toHaveLength(1);
      expect(container.querySelectorAll('header.bar-blue')).toHaveLength(1);
      expect(container.querySelectorAll('section.bar-orange')).toHaveLength(1);
    };
    una();
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    una();
  });

  /* Ordre del Mestre, 261004 (privacitat): l'Índex escriu a la URL el títol de
     la secció que es tria (?seccio=, el slug del text). Amb les xifres a la
     vista: cap entrada de l'Índex de les pàgines amb dades porta dígits del
     compte, l'entitat, un import ni el titular; i a Bancs i a la pàgina del
     compte es clica cada entrada i es mira la URL que en resulta. */
  test('l’Índex de la closca no escriu cap dada a la URL: el compte és «Compte 1»', async () => {
    const scrollAbans = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollIntoView() {};
    try {
      const { closca } = munta({ magatzem: await ambSignatura() });
      await llegixExtractes();
      fireEvent.click(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }));
      const obriIndex = () => fireEvent.click(within(closca).getByRole('button', { name: 'Índex de secció' }));
      const entrades = () => [...document.querySelectorAll('.toc-nav button')];
      const textos = [];
      const rutes = [];
      /* Les entrades de l'Índex de la pàgina; amb `clica`, cada una clicada i la URL que deixa. */
      const recorre = ({ clica }) => {
        obriIndex();
        const llista = entrades().map((e) => e.textContent);
        expect(llista.length).toBeGreaterThan(0);
        textos.push(...llista);
        if (!clica) {
          fireEvent.click(screen.getByRole('button', { name: 'Tancar taula' }));
          return;
        }
        for (let k = 0; k < llista.length; k += 1) {
          if (k > 0) obriIndex();
          fireEvent.click(entrades()[k]);
          rutes.push(ruta());
        }
      };
      triaModul('Tauler d’Inici');
      recorre({ clica: false });
      triaModul('Impostos');
      recorre({ clica: false });
      triaModul('Bancs');
      recorre({ clica: true });
      fireEvent.click(screen.getByRole('button', { name: 'Compte 1' }));
      expect(h1(closca)).toBe('Compte 1');
      recorre({ clica: true });
      expect(textos).toContain('Compte 1');
      expect(rutes.some((r) => /[?&]seccio=compte-1$/.test(r))).toBe(true);
      for (const text of [...textos, ...rutes]) expect(text).not.toMatch(/4321|9999|975|1\.000|taller|prova|titular/i);
    } finally {
      Element.prototype.scrollIntoView = scrollAbans;
    }
  }, 20000);
});
