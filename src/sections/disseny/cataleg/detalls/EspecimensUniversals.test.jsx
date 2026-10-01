import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../../components/layout/AppGridShell.jsx';
import { AVISOS_TARGETA_VIVA } from '../../../../components/universal/TargetaViva.jsx';
import EspecimenBarraEines from './EspecimenBarraEines.jsx';
import EspecimenControlsBarra from './EspecimenControlsBarra.jsx';
import EspecimenEmoticonaBarra from './EspecimenEmoticonaBarra.jsx';
import EspecimenTargetaViva from './EspecimenTargetaViva.jsx';
import EspecimenUniversalCard from './EspecimenUniversalCard.jsx';
import EspecimenPage from './EspecimenPage.jsx';
import EspecimenEstatDesament from './EspecimenEstatDesament.jsx';
import EspecimenCalendari from './EspecimenCalendari.jsx';
import EspecimenResumConnexio from './EspecimenResumConnexio.jsx';
import EspecimenClassificacio from './EspecimenClassificacio.jsx';
import EspecimenImpressio from './EspecimenImpressio.jsx';
import EspecimenComposicio from './EspecimenComposicio.jsx';
import EspecimenColumnes from './EspecimenColumnes.jsx';
import EspecimenDivisor from './EspecimenDivisor.jsx';
import EspecimenOpcions from './EspecimenOpcions.jsx';
import EspecimenShell from './EspecimenShell.jsx';
import EspecimenGestor from './EspecimenGestor.jsx';
import EspecimenUniversalWorkspace from './EspecimenUniversalWorkspace.jsx';
import EspecimenNavMobil from './EspecimenNavMobil.jsx';
import EspecimenXat from './EspecimenXat.jsx';
import EspecimenXatLlista from './EspecimenXatLlista.jsx';
import EspecimenXatCerca from './EspecimenXatCerca.jsx';
import EspecimenXatComunitats from './EspecimenXatComunitats.jsx';
import EspecimenXatNovaConversa from './EspecimenXatNovaConversa.jsx';
import EspecimenXatRail, { activaDeRuta } from './EspecimenXatRail.jsx';
import { delVal, getVal, setVal } from '../../../../config/storage.js';

/* T52 (ordre del Mestre, 260928) · Proves de fum dels especímens que pinten
   components universals REALS: cada un munta la peça de veres, sense h1, i
   diu d'on penja (Llinatge). */

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

/* La barra d'eines mesura la seua amplada: el doble li'n dona una de fixa. */
const ampleDeBarra = (ample) => vi.stubGlobal('ResizeObserver', class {
  constructor(callback) { this.callback = callback; }
  observe() { this.callback([{ contentRect: { width: ample } }]); }
  disconnect() {}
});

const pinta = (Especimen) => render(<MemoryRouter><Especimen /></MemoryRouter>).container;

describe('Especímens universals · fum', () => {
  it.each([
    ['BarraEines', EspecimenBarraEines, 'UniversalToolbar'],
    ['Classificacio', EspecimenClassificacio, 'BotoneraClassificacio'],
    ['Impressio', EspecimenImpressio, 'DocumentPrintPreview'],
    ['Composicio', EspecimenComposicio, 'Composició'],
    ['Columnes', EspecimenColumnes, 'AppGridColumn'],
    ['Divisor', EspecimenDivisor, 'AppGridResizer'],
    ['Shell', EspecimenShell, 'Closca (App.jsx)'],
    ['Gestor', EspecimenGestor, 'AppGridShell'],
    ['UniversalWorkspace', EspecimenUniversalWorkspace, 'UniversalWorkspace'],
    ['NavMobil', EspecimenNavMobil, 'Navegació mòbil'],
    ['ControlsBarra', EspecimenControlsBarra, 'BarraBlava i BarraTaronja'],
    ['EmoticonaBarra', EspecimenEmoticonaBarra, 'EmoticonaBarra'],
    ['TargetaViva', EspecimenTargetaViva, 'TargetaViva'],
    ['UniversalCard', EspecimenUniversalCard, 'UniversalCard'],
    ['Page', EspecimenPage, 'UniversalPage → PageFrame'],
    ['EstatDesament', EspecimenEstatDesament, 'EstatDesament'],
    ['Calendari', EspecimenCalendari, 'SelectorDataHora'],
    ['ResumConnexio', EspecimenResumConnexio, 'ResumConnexio'],
  ])('%s: sense h1 i amb el llinatge de la seua peça', (_, Especimen, peca) => {
    ampleDeBarra(900);
    const arrel = pinta(Especimen);
    expect(arrel.querySelector('h1')).toBeNull();
    const llinatge = arrel.querySelector('.sdp-llinatge');
    expect(llinatge).not.toBeNull();
    expect(llinatge.textContent).toContain(peca);
  });
});

describe('EspecimenBarraEines', () => {
  it('ampla: Borrar i Publicar; amb publishPopup, Publicar obri el selector de visibilitat', () => {
    ampleDeBarra(900);
    const arrel = pinta(EspecimenBarraEines);
    const barres = arrel.querySelectorAll('.sdp-editor-tools');
    expect(barres).toHaveLength(4);
    expect(within(barres[0]).getByRole('button', { name: 'Borrar' })).toBeTruthy();
    expect(within(barres[2]).queryByRole('button', { name: 'Borrar' })).toBeNull();
    expect(within(barres[3]).getByRole('button', { name: 'Compartir' })).toBeTruthy();
    const publicar = within(barres[2]).getByRole('button', { name: 'Publicar' });
    expect(publicar.getAttribute('aria-haspopup')).toBe('dialog');
    fireEvent.click(publicar);
    expect(arrel.querySelector('dialog.sdp-selector-visibilitat').hasAttribute('open')).toBe(true);
    expect(within(barres[0]).queryByRole('button', { name: 'Format del text' })).toBeNull();
  });

  it('per davall de 500px el format es plega darrere de «Aa»', () => {
    ampleDeBarra(448);
    const arrel = pinta(EspecimenBarraEines);
    const barra = arrel.querySelectorAll('.sdp-editor-tools')[1];
    expect(barra.getAttribute('data-compact')).toBe('true');
    const aa = within(barra).getByRole('button', { name: 'Format del text' });
    expect(aa.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(aa);
    expect(aa.getAttribute('aria-expanded')).toBe('true');
    expect(within(barra).getByRole('button', { name: 'Negreta' }).getAttribute('aria-pressed')).toBe('true');
  });
});

describe('EspecimenClassificacio', () => {
  it('dues botoneres reals: la ploma sense emoticona i 🍅 amb emoticona', () => {
    const arrel = pinta(EspecimenClassificacio);
    const botoneres = arrel.querySelectorAll('.sdp-classificacio-botonera');
    expect(botoneres).toHaveLength(2);
    expect(botoneres[0].querySelector('.sdp-classificacio-botonera__glif')).toBeNull();
    expect(botoneres[1].querySelector('.sdp-classificacio-botonera__glif').textContent).toBe('🍅');
  });

  it('cada botó obri el seu diàleg real i Desar canvia el document de mostra', () => {
    const arrel = pinta(EspecimenClassificacio);
    const [sense] = arrel.querySelectorAll('.sdp-classificacio-botonera');
    fireEvent.click(within(sense).getByRole('button', { name: /Carpetes/ }));
    expect(screen.getByRole('dialog', { name: 'Carpeta del document' })).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Festes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
    expect(screen.queryByRole('dialog', { name: 'Carpeta del document' })).toBeNull();
    expect(within(sense).getByRole('button', { name: /Carpetes/ }).textContent).toContain('Festes');

    fireEvent.click(within(sense).getByRole('button', { name: /Categories/ }));
    expect(screen.getByRole('dialog', { name: 'Categories de la nota' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel·lar' }));

    fireEvent.click(within(sense).getByRole('button', { name: /Emoticona/ }));
    expect(screen.getByRole('dialog', { name: 'Emoticona del document' })).toBeTruthy();
  });
});

describe('EspecimenImpressio', () => {
  it('els dos botons reals i els dos papers: sense i amb portada', () => {
    const arrel = pinta(EspecimenImpressio);
    expect(screen.getByRole('button', { name: 'Vista A4 / PDF' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Crear portada' })).toBeTruthy();
    const papers = arrel.querySelectorAll('iframe.sdp-especimen__paper');
    expect(papers).toHaveLength(2);
    expect(papers[0].getAttribute('srcdoc')).not.toContain('<section class="cover">');
    expect(papers[1].getAttribute('srcdoc')).toContain('<section class="cover">');
    expect(papers[1].getAttribute('sandbox')).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Crear portada' }));
    expect(screen.getByRole('checkbox', { name: 'Incloure portada' }).checked).toBe(true);
  });
});

describe('EspecimenComposicio', () => {
  it('pinta els sis contenidors reals amb el graó de gap', () => {
    const arrel = pinta(EspecimenComposicio);
    expect(arrel.querySelector('.sdp-pila.sdp-pila--espai-3')).not.toBeNull();
    expect(arrel.querySelector('.sdp-fila.sdp-fila--espai-2.sdp-wrap')).not.toBeNull();
    const graella = arrel.querySelector('ul.sdp-graella');
    expect(graella.style.gridTemplateColumns).toContain('10rem');
    expect(arrel.querySelector('.sdp-costat').style.gridTemplateColumns).toContain('10rem');
    expect(arrel.querySelector('.sdp-centre')).not.toBeNull();
    expect([1, 2, 3].map((n) => arrel.querySelectorAll(`.sdp-superficie.sdp-ombra-${n}`).length)).toEqual([1, 1, 1]);
  });
});

describe('EspecimenColumnes', () => {
  it('les quatre variants reals de la capçalera', () => {
    const arrel = pinta(EspecimenColumnes);
    expect(arrel.querySelectorAll('aside.sdp-workspace-column')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Replegar COMPONENTS' }).classList.contains('app-grid-col-header--replegable')).toBe(true);
    const plegable = arrel.querySelector('.app-grid-col-header__plegable');
    expect(plegable.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(plegable);
    expect(plegable.getAttribute('aria-expanded')).toBe('false');
    expect(arrel.querySelector('.app-grid-col-header--collapsed')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Expandir CARPETES' })).toBeTruthy();
    expect(arrel.querySelector('.app-grid-col-header--dark-intens')).not.toBeNull();
  });
});

describe('EspecimenDivisor', () => {
  it('el Divisor real (hr i amb text) i el redimensionador que es mou amb el teclat', () => {
    const arrel = pinta(EspecimenDivisor);
    expect(arrel.querySelector('hr.sdp-divisor')).not.toBeNull();
    expect(arrel.querySelector('.sdp-divisor--amb-text').getAttribute('role')).toBe('separator');
    const vora = screen.getByRole('separator', { name: 'Redimensionar la columna de mostra' });
    expect(vora.getAttribute('aria-valuenow')).toBe('192');
    fireEvent.keyDown(vora, { key: 'ArrowRight' });
    expect(vora.getAttribute('aria-valuenow')).toBe('208');
    expect(arrel.querySelector('.sdp-especimen__redimensiona').style.getPropertyValue('--cataleg-mostra-ample')).toBe('208px');
    fireEvent.keyDown(vora, { key: 'End' });
    expect(vora.getAttribute('aria-valuenow')).toBe('256');
  });
});

describe('EspecimenOpcions', () => {
  it('GrupCamps es pinta de veres: fieldset amb llegenda i els seus camps', () => {
    pinta(EspecimenOpcions);
    const grup = screen.getByRole('group', { name: 'Adreça de contacte' });
    expect(grup.tagName).toBe('FIELDSET');
    expect(within(grup).getByLabelText('Poble')).toBeTruthy();
  });
});

/* T52b · Esmenes de la revisió de T52a i especímens nous. */

describe('EspecimenBarraEines · la fletxa és local (D5)', () => {
  it('prémer «Tornar a la llista» avisa a l’espècimen i no obri el llistat del gestor real', () => {
    ampleDeBarra(900);
    const setPanellObert = vi.fn();
    render(
      <MemoryRouter>
        <AppGridContext.Provider value={{ setPanellObert }}>
          <EspecimenBarraEines />
        </AppGridContext.Provider>
      </MemoryRouter>
    );
    const fletxes = screen.getAllByRole('button', { name: 'Tornar a la llista' });
    expect(fletxes).toHaveLength(4);
    fletxes.forEach((fletxa) => fireEvent.click(fletxa));
    expect(setPanellObert).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toContain('Has premut la fletxa');
  });

  it('el text ja no diu «barra negra» (D4)', () => {
    ampleDeBarra(900);
    expect(pinta(EspecimenBarraEines).textContent).not.toMatch(/barra negra/i);
  });
});

/* F3 · «Ara» fix: només es falseja Date, perquè els diàlegs i els efectes
   continuen amb els temporitzadors de veres. 3 d'octubre de 2026, 14:37. */
const ARA = new Date(2026, 9, 3, 14, 37);
const ambAra = () => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(ARA); };
afterEach(() => { vi.useRealTimers(); });

describe('EspecimenControlsBarra', () => {
  it('la barra d’edició porta el que porta la closca de l’editor: ploma, núvol, visibilitat i la data d’ara; cap pin', () => {
    ambAra();
    const arrel = pinta(EspecimenControlsBarra);
    const edicio = screen.getByRole('region', { name: 'Autoria i data (espècimen, edició)' });
    expect(within(edicio).queryByRole('button', { name: /Ancorar/ })).toBeNull();
    expect(edicio.querySelector('.sp-card-action.btn-icon-orange')).toBeNull();
    const noms = within(edicio).getAllByRole('button').map((boto) => boto.getAttribute('aria-label'));
    expect(noms).toHaveLength(3);
    expect(noms[0]).toBe('Triar l’emoticona del document');
    expect(noms[1]).toBe('Privat: canviar la visibilitat');
    expect(noms[2]).toMatch(/^Data de publicació: sense triar; ara es mostra la data i l’hora d’ara/);
    expect(edicio.querySelector('.lucide-cloud-upload')).not.toBeNull();
    expect(edicio.querySelector('.lucide-feather')).not.toBeNull();
    const pastilla = within(edicio).getByRole('button', { name: /^Data de publicació/ });
    expect(pastilla.textContent).toBe('14:3703/10/26');
    expect(arrel.querySelector('section[aria-label="Autoria i data (espècimen, lectura)"] .lucide-feather')).toBeNull();
  });

  it('el text ja no posa el pin a la barra d’edició: el pin és de la caputxa de la UniversalCard', () => {
    const text = pinta(EspecimenControlsBarra).textContent;
    expect(text).not.toContain('el pin «Ancorar», la visibilitat');
    expect(text).not.toContain('btn-icon-orange a la barra taronja');
    expect(text).toContain('Cap pin: el pin «Ancorar» viu a la caputxa de la UniversalCard (showPin)');
    expect(text).toContain('btn-icon-orange per al pin «Ancorar» de la caputxa de la UniversalCard');
  });

  it('els àtoms a soles: IconButton, IconButton presentation i la pastilla CONNECTAR d’ActionControl', () => {
    pinta(EspecimenControlsBarra);
    expect(screen.getByRole('button', { name: 'Comentar l’espècimen' }).disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Compartir l’espècimen (presentation)' }).disabled).toBe(true);
    const connectar = screen.getByRole('button', { name: 'Connectar amb l’espècimen' });
    expect(connectar.classList.contains('btn-connectar')).toBe(true);
    expect(connectar.querySelector('.sp-card-connect-text').textContent).toBe('Connectar');
    expect(connectar.querySelector('.sp-card-connect-plus').textContent).toBe('+');
  });

  it('diu la regla vigent de la data i de la ploma', () => {
    const text = pinta(EspecimenControlsBarra).textContent;
    expect(text).toContain('En edició, la data triada al calendari (SelectorDataHora) o, si no se n’ha triat cap, la d’ara; mai la de l’última edició.');
    expect(text).toContain('En lectura, la de creació, o la de l’última modificació si és posterior.');
    expect(text).toContain('La ploma (lucide Feather) vol dir «triar l’emoticona»');
    expect(text).toContain('A la barra taronja, la ploma blanca és el botó d’emoticona de l’espai central');
    expect(text).toContain('la botonera de classificació, davall del títol, també la mostra al seu botó Emoticona quan no n’hi ha cap');
    expect(text).not.toContain('només la porta el botó de l’espai central');
    expect(text).toContain('el núvol (CloudUpload)');
    expect(text).not.toContain('la del document o la d’ara');
  });
});

describe('EspecimenEmoticonaBarra', () => {
  const barra = (nom) => screen.getByRole('region', { name: `Autoria i data (espècimen, ${nom})` });

  it('els quatre casos: ploma i emoticona en edició; res i emoticona en lectura', () => {
    pinta(EspecimenEmoticonaBarra);
    const sense = within(barra('edició sense emoticona')).getByRole('button', { name: 'Triar l’emoticona del document' });
    expect(sense.querySelector('.lucide-feather')).not.toBeNull();
    expect(within(barra('edició amb emoticona')).getByRole('button', { name: 'Emoticona del document: 🍅. Canviar-la' })).toBeTruthy();
    const buida = barra('lectura sense emoticona');
    expect(within(buida).queryByRole('button', { name: /emoticona/i })).toBeNull();
    expect(buida.querySelector('.sdp-emoticona-barra--buida')).not.toBeNull();
    expect(buida.querySelector('.lucide-feather')).toBeNull();
    expect(within(barra('lectura amb emoticona')).getByRole('img', { name: 'Emoticona del document: 🍅' })).toBeTruthy();
  });

  it('el botó d’edició obri el DialegEmoticona real i Desar posa l’emoticona al centre', () => {
    pinta(EspecimenEmoticonaBarra);
    fireEvent.click(within(barra('edició sense emoticona')).getByRole('button', { name: 'Triar l’emoticona del document' }));
    const dialeg = screen.getByRole('dialog', { name: 'Emoticona del document' });
    fireEvent.change(within(dialeg).getByLabelText(/Emoticona/), { target: { value: '🌻' } });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Desar' }));
    expect(screen.queryByRole('dialog', { name: 'Emoticona del document' })).toBeNull();
    expect(within(barra('edició sense emoticona')).getByRole('button', { name: 'Emoticona del document: 🌻. Canviar-la' })).toBeTruthy();
  });

  /* Ordre del Mestre, 261001 (tasca 4 i carril A) · En lectura la pastilla ja
     no és un <time> quiet: és el botó que obri el Calendari en el mes de la
     data, amb l'hora. El nom diu l'hora i el dia en l'ordre en què es veuen
     (WCAG 2.5.3). És l'ÚNIC botó de la barra de lectura (l'emoticona
     continua sense clic). */
  it('en edició la pastilla és la de l’editor amb la data d’ara; la data fixa, només en lectura, on obri el Calendari', () => {
    ambAra();
    pinta(EspecimenEmoticonaBarra);
    for (const nom of ['edició sense emoticona', 'edició amb emoticona']) {
      const pastilla = within(barra(nom)).getByRole('button', { name: /^Data de publicació: sense triar/ });
      expect(pastilla.textContent, nom).toBe('14:3703/10/26');
      expect(barra(nom).textContent, nom).not.toContain('25/04/26');
    }
    for (const nom of ['lectura sense emoticona', 'lectura amb emoticona']) {
      const botons = within(barra(nom)).getAllByRole('button');
      expect(botons, nom).toHaveLength(1);
      expect(botons[0].getAttribute('aria-label'), nom).toBe('11:00 25/04/26 · Obri el calendari d’eixe mes');
      expect(botons[0].classList.contains('btn-date-time'), nom).toBe(true);
      expect([...botons[0].querySelectorAll('span')].map((s) => s.textContent), nom).toEqual(['11:00', '25/04/26']);
    }
  });

  it('la ploma blanca és el botó d’emoticona de la barra; la botonera també la mostra al seu botó Emoticona', () => {
    const text = pinta(EspecimenEmoticonaBarra).textContent;
    expect(text).toContain('A la barra taronja, la ploma blanca (lucide Feather) és este botó');
    expect(text).toContain('la botonera de classificació de davall del títol també la mostra al seu botó Emoticona quan no n’hi ha cap');
    expect(text).not.toContain('només la porta este botó');
  });
});

describe('Barres d’edició dels especímens · la data d’ara i la ploma', () => {
  it('EstatDesament: els tres estats porten la ploma central i la pastilla de l’editor amb la data d’ara', () => {
    ambAra();
    pinta(EspecimenEstatDesament);
    for (const estat of ['pendent', 'error', 'net']) {
      const barra = screen.getByRole('region', { name: `Autoria i data (espècimen, ${estat})` });
      expect(within(barra).getByRole('button', { name: 'Triar l’emoticona del document' }).querySelector('.lucide-feather'), estat).not.toBeNull();
      expect(within(barra).getByRole('button', { name: /^Data de publicació: sense triar/ }).textContent, estat).toBe('14:3703/10/26');
      expect(barra.textContent, estat).not.toContain('25/04/26');
    }
  });

  it('Calendari: la barra de l’editor porta la ploma central i, sense tria, la data d’ara', () => {
    ambAra();
    pinta(EspecimenCalendari);
    const barra = screen.getByRole('region', { name: 'Autoria i data (espècimen)' });
    expect(within(barra).getByRole('button', { name: 'Triar l’emoticona del document' }).querySelector('.lucide-feather')).not.toBeNull();
    expect(within(barra).getByRole('button', { name: /^Data de publicació: sense triar/ }).textContent).toBe('14:3703/10/26');
  });
});

describe('EspecimenTargetaViva', () => {
  it('tres targetes vives reals: l’emoticona només a la caputxa de la que en té', () => {
    const arrel = pinta(EspecimenTargetaViva);
    const cartes = arrel.querySelectorAll('article.sp-card.sp-card--pla.sdp-targeta-viva-carta');
    expect(cartes).toHaveLength(3);
    expect(cartes[0].querySelector('.sp-card-header--amb-emoticona')).toBeNull();
    expect(within(cartes[1]).getByRole('img', { name: 'Emoticona del document: 🍅' })).toBeTruthy();
    expect(cartes[2].querySelector('.sdp-emoticona-barra')).toBeNull();
    expect(arrel.querySelectorAll('.lucide-feather')).toHaveLength(0);
  });

  it('el peu del Perfil diu la regla vigent de la caputxa (T66): sense emoticona triada, sense centre', () => {
    const text = pinta(EspecimenTargetaViva).textContent;
    expect(text).toContain('Sense emoticona triada: la caputxa no té centre, i l’avís del Perfil no promet cap publicació.');
    expect(text).not.toContain('El Perfil no té emoticona');
  });

  it('cada consumidor diu el seu avís: Notes promet el Mur, el Perfil no promet cap publicació', () => {
    const arrel = pinta(EspecimenTargetaViva);
    const [nota, , fitxa] = arrel.querySelectorAll('article.sdp-targeta-viva-carta');
    fireEvent.click(within(nota).getByRole('button', { name: /^Comentar Planter/ }));
    expect(screen.getByRole('dialog').textContent).toContain(AVISOS_TARGETA_VIVA.notes.descripcio);
    fireEvent.click(screen.getByRole('button', { name: 'Entesos' }));
    fireEvent.click(within(fitxa).getByRole('button', { name: /^Comentar Maria/ }));
    const avis = screen.getByRole('dialog').textContent;
    expect(avis).toContain(AVISOS_TARGETA_VIVA.perfil.descripcio);
    expect(avis).not.toContain('Mur');
  });

  it('els dos xips «Vista targeta» obrin la targeta amb el text de la vista del seu consumidor', () => {
    pinta(EspecimenTargetaViva);
    const [xipNota, xipPerfil] = screen.getAllByRole('button', { name: 'Vista targeta' });
    fireEvent.click(xipNota);
    expect(screen.getByRole('dialog', { name: 'Vista targeta' }).textContent).toContain(AVISOS_TARGETA_VIVA.notes.vista);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Vista targeta' })).getByRole('button', { name: 'Tancar' }));
    fireEvent.click(xipPerfil);
    expect(screen.getByRole('dialog', { name: 'Vista targeta' }).textContent).toContain(AVISOS_TARGETA_VIVA.perfil.vista);
  });

  it('diu que l’aside i el xip de l’editor reben el text del consumidor (adapter.avisTargetaViva)', () => {
    const arrel = pinta(EspecimenTargetaViva);
    const files = [...arrel.querySelectorAll('table tbody tr')];
    const fila = files.find((tr) => tr.querySelector('td code')?.textContent === 'adapter.avisTargetaViva');
    expect(fila).toBeTruthy();
    expect(fila.textContent).toContain('NotesEditor hi posa AVISOS_TARGETA_VIVA.notes; PerfilEditor, .perfil');
    expect(arrel.textContent).not.toMatch(/l’aside i el xip[^.]{0,80}reserva/);
  });

  it('en edició, sense data triada la targeta viva diu la data d’ara i, amb data triada, la triada', () => {
    ambAra();
    const arrel = pinta(EspecimenTargetaViva);
    const [sense, amb, fitxa] = arrel.querySelectorAll('article.sdp-targeta-viva-carta');
    expect(sense.querySelector('.btn-date-time').textContent).toBe('14:3703/10/26');
    expect(amb.querySelector('.btn-date-time').textContent).toBe('09:0012/10/26');
    expect(fitxa.querySelector('.btn-date-time').textContent).toBe('14:3703/10/26');
  });

  it('explica «Llista + dreta si hi cap»', () => {
    const text = pinta(EspecimenTargetaViva).textContent;
    expect(text).toContain('Llista + dreta si hi cap');
    expect(text).toContain('el xip «Vista targeta» davall del títol obri el diàleg');
  });
});

describe('EspecimenUniversalCard · al dia', () => {
  it('la variant pla porta l’emoticona a la caputxa només si està triada', () => {
    const arrel = pinta(EspecimenUniversalCard);
    const planes = arrel.querySelectorAll('article.sp-card--pla');
    expect(planes).toHaveLength(2);
    expect(planes[0].querySelector('.sp-card-header--amb-emoticona .sdp-emoticona-barra--glif').textContent).toBe('🍅');
    expect(planes[1].querySelector('.sp-card-header--amb-emoticona')).toBeNull();
    expect(planes[1].querySelector('.sdp-emoticona-barra')).toBeNull();
  });

  it('les mostres porten el títol h3 de sèrie, el mateix DOM que les targetes de l’app', () => {
    const arrel = pinta(EspecimenUniversalCard);
    const targetes = [...arrel.querySelectorAll('.sdp-especimen__targetes article.sp-card')];
    expect(targetes).toHaveLength(3);
    for (const targeta of targetes) {
      expect(targeta.querySelector('.sp-card-title').tagName).toBe('H3');
    }
  });

  it('l’avís: isAvis, pin i acció de caputxa blancs i autor enllaçat', () => {
    const arrel = pinta(EspecimenUniversalCard);
    const avis = arrel.querySelector('article.sp-card--avis');
    expect(avis).not.toBeNull();
    const pin = within(avis).getByRole('button', { name: 'Ancorar Tall d’aigua dimarts' });
    expect(pin.classList.contains('btn-icon-orange')).toBe(true);
    const bola = within(avis).getByRole('button', { name: 'Pública: canviar la visibilitat' });
    expect(bola.closest('.sp-card-meta')).not.toBeNull();
    expect(within(avis).getByRole('link', { name: /La Torre de les Maçanes/ }).getAttribute('href')).toBe('/pobles');
    expect(within(avis).getByRole('heading', { level: 3, name: 'Tall d’aigua dimarts' })).toBeTruthy();
    fireEvent.click(pin);
    expect(screen.getByText(/^Has premut «Ancorar»/).getAttribute('role')).toBe('status');
    fireEvent.click(bola);
    expect(screen.getByText(/^Has premut la bola del món/).getAttribute('role')).toBe('status');
  });

  it('el contracte documenta les props noves i calendarBadge', () => {
    const arrel = pinta(EspecimenUniversalCard);
    const props = [...arrel.querySelectorAll('table tbody tr td:first-child code')].map((c) => c.textContent);
    for (const prop of ['variant', 'emoticona', 'headerAction', 'showPin / onPin', 'isAvis', 'authorHref', 'headingLevel', 'calendarBadge']) {
      expect(props, prop).toContain(prop);
    }
  });
});

describe('Textos de les esmenes de la revisió de T52a', () => {
  it('UniversalWorkspace: Perfil i Admin en són usuaris; el Xat munta AppGridShell directament (D1)', () => {
    const text = pinta(EspecimenUniversalWorkspace).textContent;
    expect(text).toContain('Notes, Disseny, Wiki de Poble, Perfil i Admin');
    expect(text).toContain('El Xat no: munta AppGridShell directament (ClosCaXat)');
  });

  it('Columnes: la variant text sense onAcciona es queda activa i el color el decidix la posició (D8)', () => {
    const text = pinta(EspecimenColumnes).textContent;
    expect(text).toContain("llevat de la variant 'text', que es queda activa");
    expect(text).toContain('el color el decidix la posició');
    expect(text).not.toContain('Fila 2 (esDark «intens»)');
  });
});

/* ═══ Onada 3B (Pedra Seca §9) · els espècimens del Xat ═══════════════════
   Components de producció amb dades de mostra: cada prova busca la peça
   real (rol, classe o text del component) i que no hi haja cap avís de
   React a la consola. */
describe('Especímens del Xat · onada 3B', () => {
  let errors;
  beforeEach(() => { errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => {
    const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
    errors.mockRestore();
    expect(crides).toEqual([]);
  });

  it('Xat: la capçalera d’una pàgina («Sobre:» i participants) i la dels Avisos; el compositor dels Avisos i el del xat públic', () => {
    const arrel = pinta(EspecimenXat);
    const [pagina, avisos] = arrel.querySelectorAll('header.sdp-xat-capcalera');
    const enllac = within(pagina).getByRole('link', { name: 'Obri la pàgina Festa major' });
    expect(enllac.getAttribute('href')).toBe('/mur');
    expect(document.getElementById(enllac.getAttribute('aria-describedby')).textContent).toBe('Sobre: Festa major · 12 participants');
    expect(avisos.querySelector('.sdp-xat-avatar-icona--sm svg.lucide-megaphone')).not.toBeNull();
    expect(avisos.querySelector('img')).toBeNull();
    expect(screen.getByText('En Avisos només escriuen els administradors.').closest('.sdp-xat-compositor--avis')).not.toBeNull();
    expect(screen.getByText('Escrius al xat públic de «Festa major».')).toBeTruthy();
  });

  it('XatLlista: el «…» obert, la barra amb 0, 1 i n, les variants de fila i la fila de comunitat', () => {
    const arrel = pinta(EspecimenXatLlista);
    const menu = screen.getByRole('menu', { name: 'Més opcions' });
    expect(within(menu).getByRole('menuitem', { name: 'Seleccionar xats' })).toBe(document.activeElement);
    expect(screen.getByRole('button', { name: 'Més opcions' }).getAttribute('aria-expanded')).toBe('true');
    expect([...arrel.querySelectorAll('.sdp-xat-barra-seleccio__recompte')].map((n) => n.textContent)).toEqual(['Tria els xats', '1 seleccionada', '4 seleccionades']);
    expect(screen.getAllByRole('button', { name: 'Marcar com a llegides' }).map((b) => b.disabled)).toEqual([true, false, false]);

    const files = within(screen.getByRole('list', { name: 'Files de mostra' })).getAllByRole('button');
    expect(files[0].querySelector('svg.lucide-users')).not.toBeNull();
    expect(within(files[0]).getByText('Pepica: Ens veiem a la torre a les 8.')).toBeTruthy();
    expect(files[1].querySelector('svg.lucide-message-circle-more')).not.toBeNull();
    /* Els canals porten el megàfon amb imatge i sense. */
    expect(files.slice(2).map((b) => [Boolean(b.querySelector('svg.lucide-megaphone')), Boolean(b.querySelector('img'))])).toEqual([[true, false], [true, false]]);
    expect(files[3].getAttribute('aria-current')).toBe('true');

    const caselles = within(screen.getByRole('list', { name: 'Files de mostra en selecció' })).getAllByRole('checkbox');
    expect(caselles.map((c) => c.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    fireEvent.click(caselles[1]);
    expect(caselles[1].getAttribute('aria-checked')).toBe('true');

    const comunitats = within(screen.getByRole('list', { name: 'Comunitats de mostra' })).getAllByRole('button');
    expect(comunitats).toHaveLength(2);
    expect(comunitats.every((b) => b.querySelector('.sdp-xat-apilat .sdp-xat-avatar--quadrat') && b.querySelector('.sdp-xat-fila__xebro'))).toBe(true);
    fireEvent.click(comunitats[0]);
    expect(screen.getByText(/^Obriria la fitxa de c-/).getAttribute('role')).toBe('status');
  });

  it('XatCerca: la fitxa del filtre, els filtres amb la segona fila enfocada i els tres resultats', () => {
    pinta(EspecimenXatCerca);
    const filtres = screen.getByRole('list', { name: 'Filtres de cerca' });
    const files = within(filtres).getAllByRole('button');
    expect(files.map((b) => b.textContent)).toEqual(['Fotos', 'GIF', 'Enllaços', 'Vídeos', 'Documents', 'Àudio', 'Enquestes', 'Esdeveniments']);
    expect(document.activeElement).toBe(files[1]);

    /* El camp de l'espècimen porta els controls del de XatSection i cap
       més: la fitxa i el ⊗ «Tanca la cerca». Sense filtre ni terme, cap
       botó (ni cap càmera inventada); tornar a posar el filtre és un botó de
       l'espècimen, fora del camp. */
    const camp = document.querySelector('.sdp-xat-cerca__camp');
    expect(within(camp).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Lleva el filtre Fotos', 'Tanca la cerca']);
    fireEvent.click(within(camp).getByRole('button', { name: 'Lleva el filtre Fotos' }));
    expect(within(camp).queryAllByRole('button')).toEqual([]);
    expect(document.activeElement).toBe(within(camp).getByRole('searchbox', { name: 'Cerca converses' }));
    const torna = screen.getByRole('button', { name: 'Torna a triar Fotos (espècimen)' });
    expect(camp.contains(torna)).toBe(false);
    fireEvent.click(torna);
    expect(within(camp).getByRole('button', { name: 'Lleva el filtre Fotos' })).toBeTruthy();
    expect(torna.disabled).toBe(true);

    const ambDades = screen.getByRole('group', { name: 'Resultats de mostra amb dades' });
    const converses = within(ambDades).getByRole('region', { name: 'Converses' });
    const tipus = within(converses).getAllByRole('button').map((b) => b.querySelector('.sdp-nomes-lector')?.textContent);
    expect(tipus).toEqual(expect.arrayContaining([', Comunitat', ', Grup', ", Canal d'avisos"]));
    expect(within(ambDades).getByRole('region', { name: 'Persones' })).toBeTruthy();
    expect(within(ambDades).getByRole('region', { name: 'Missatges' })).toBeTruthy();
    expect(ambDades.querySelectorAll('mark.sdp-xat-marca').length).toBeGreaterThan(0);

    expect(within(screen.getByRole('group', { name: 'Resultats de mostra amb un filtre sense dades' })).getByRole('status').textContent)
      .toBe("Encara no hi ha cap missatge d'este tipus en les converses obertes.");
    expect(within(screen.getByRole('group', { name: 'Resultats de mostra sense cap resultat' })).getByRole('status').textContent)
      .toBe('Cap resultat per a «zzz».');
  });

  it('XatComunitats: la fitxa, la vista amb dues comunitats i la vista buida', () => {
    pinta(EspecimenXatComunitats);
    const fitxa = within(screen.getByRole('complementary', { name: 'Fitxa de mostra' })).getByRole('region', { name: 'Sóc de Poble' });
    expect(within(fitxa).getByRole('button', { name: 'Afegir grup' })).toBeTruthy();
    const vista = screen.getByRole('complementary', { name: 'Comunitats' });
    expect(within(vista).getAllByRole('region')).toHaveLength(2);
    expect(within(vista).getByRole('button', { name: 'Nova comunitat' })).toBeTruthy();
    fireEvent.click(within(vista).getByRole('button', { name: 'Veure-ho tot de Sóc de Poble' }));
    expect(screen.getByText('Veure-ho tot: obriria la fitxa de c-sdp.')).toBeTruthy();
    const buida = screen.getByRole('complementary', { name: 'Comunitats sense cap' });
    expect(within(buida).getByRole('status').textContent).toContain('Encara no formes part de cap comunitat');
  });

  it('XatNovaConversa: cada botó obri el diàleg real en el seu estat', async () => {
    pinta(EspecimenXatNovaConversa);
    const obri = (nom) => fireEvent.click(within(screen.getByRole('group', { name: 'Estats del diàleg' })).getByRole('button', { name: nom }));
    const dialeg = () => screen.getByRole('dialog', { name: 'Nova conversa' });
    const tanca = () => fireEvent.click(within(dialeg()).getByRole('button', { name: 'Tancar' }));

    obri('Llista');
    expect(await within(dialeg()).findByText('IAIA MarIA')).toBeTruthy();
    expect(within(dialeg()).getByText('Sóc de Poble')).toBeTruthy();
    expect(within(dialeg()).queryByText('Javi Llinares (Tu)')).toBeNull();
    expect(within(dialeg()).queryByText('Maria la Vall')).toBeNull();
    tanca();

    obri('Cerca');
    fireEvent.change(within(dialeg()).getByRole('searchbox'), { target: { value: 'ma' } });
    expect(await within(dialeg()).findByText('Maria la Vall')).toBeTruthy();
    expect(within(dialeg()).queryByText('Joan Baptiste')).toBeNull();
    tanca();

    obri('Panell honest');
    fireEvent.click(within(dialeg()).getByRole('button', { name: 'Nou grup' }));
    expect(within(dialeg()).getByText(/naixen d'una Pàgina Universal/)).toBeTruthy();
    tanca();

    obri('Avís personal');
    fireEvent.change(within(dialeg()).getByRole('searchbox'), { target: { value: 'javi' } });
    fireEvent.click(within(dialeg()).getByText('Javi Llinares (Tu)').closest('button'));
    expect(within(dialeg()).getByText("Encara no pots escriure't a tu mateix: este poble no obri el xat personal.")).toBeTruthy();
    tanca();

    obri('Error en obrir');
    expect(within(dialeg()).getByRole('alert').textContent).toBe("No s'ha pogut obrir la conversa: el servidor no respon.");
    tanca();

    obri('Carregant');
    expect(await within(dialeg()).findByText('Carregant la gent del poble…')).toBeTruthy();
    expect(within(dialeg()).queryByText('Contactes freqüents')).toBeNull();
    tanca();
    expect(screen.queryByRole('dialog', { name: 'Nova conversa' })).toBeNull();
  });

  it('XatRail: desplegat i plegat, amb «Comunitats» activa, seccions i peu; prémer marca l’entrada', () => {
    pinta(EspecimenXatRail);
    const desplegat = screen.getByRole('group', { name: 'Rail desplegat de mostra' });
    const plegat = screen.getByRole('group', { name: 'Rail plegat de mostra' });
    for (const rail of [desplegat, plegat]) {
      expect(within(rail).getByRole('button', { name: 'Comunitats' }).getAttribute('aria-current')).toBe('page');
      /* Revisió adversarial 260930 · El peu de producció: «Tu» obri el full
         «Ajustos» (EspecimenXatRail.test.jsx en prova la resta). */
      expect(within(rail).getByRole('button', { name: 'Tu: ajustos' })).toBeTruthy();
      expect(within(rail).getByRole('button', { name: 'Sóc de Poble' })).toBeTruthy();
    }
    expect(within(desplegat).getByRole('button', { name: 'Secció Més' }).getAttribute('aria-expanded')).toBe('true');
    expect(plegat.querySelector('.app-grid-col-header--collapsed')).not.toBeNull();

    fireEvent.click(within(desplegat).getByRole('button', { name: 'Destacats' }));
    expect(within(desplegat).getByRole('button', { name: 'Destacats' }).getAttribute('aria-current')).toBe('page');
    expect(within(desplegat).getByRole('button', { name: 'Comunitats' }).hasAttribute('aria-current')).toBe(false);
    expect(screen.getByText('El rail portaria a /xat?vista=destacats.')).toBeTruthy();
    fireEvent.click(within(plegat).getByRole('button', { name: 'Almàssera la Torre' }));
    expect(within(plegat).getByRole('button', { name: 'Almàssera la Torre' }).getAttribute('aria-current')).toBe('page');
  });

  it('XatRail: plegar una secció al catàleg no toca les preferències del rail de l’app', () => {
    const claus = ['sdp-xat-rail-mes', 'sdp-xat-rail-comunitats'];
    const abans = claus.map((clau) => [clau, getVal(clau)]);
    claus.forEach((clau) => delVal(clau));
    try {
      pinta(EspecimenXatRail);
      const desplegat = screen.getByRole('group', { name: 'Rail desplegat de mostra' });
      const mes = within(desplegat).getByRole('button', { name: 'Secció Més' });
      fireEvent.click(mes);
      fireEvent.click(within(desplegat).getByRole('button', { name: 'Secció Comunitats' }));
      expect(mes.getAttribute('aria-expanded')).toBe('false');
      expect(claus.map((clau) => getVal(clau))).toEqual([null, null]);
    } finally {
      for (const [clau, valor] of abans) {
        if (valor == null) delVal(clau);
        else setVal(clau, valor);
      }
    }
  });

  it('XatRail: les tres vistes en construcció, amb els controls inerts que ho diuen', () => {
    pinta(EspecimenXatRail);
    expect(screen.getAllByRole('region', { name: 'En construcció' })).toHaveLength(3);
    for (const nom of ['Telefonades', 'Contingut multimèdia', 'Destacats']) {
      expect(screen.getByRole('complementary', { name: nom }).querySelectorAll('[aria-disabled="true"]').length).toBeGreaterThan(0);
    }
    fireEvent.click(within(screen.getByRole('complementary', { name: 'Destacats' })).getByRole('button', { name: 'Editar' }));
    expect(screen.getByText('Destacats: en construcció.')).toBeTruthy();
  });

  it('activaDeRuta: de la ruta del rail a l’entrada activa', () => {
    expect(activaDeRuta('/xat')).toEqual({ activa: 'converses', comunitatActiva: null });
    expect(activaDeRuta('/control-xat')).toEqual({ activa: 'control', comunitatActiva: null });
    expect(activaDeRuta('/xat?vista=multimedia')).toEqual({ activa: 'multimedia', comunitatActiva: null });
    expect(activaDeRuta('/xat?vista=no-existix')).toEqual({ activa: 'converses', comunitatActiva: null });
    expect(activaDeRuta('/xat?comunitat=c-sdp')).toEqual({ activa: 'comunitat', comunitatActiva: 'c-sdp' });
    expect(activaDeRuta('/el-meu-perfil')).toEqual({ activa: 'converses', comunitatActiva: null });
  });
});
