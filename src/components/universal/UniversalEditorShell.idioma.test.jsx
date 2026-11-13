/* P1-22 (marató 261101_2143, B3-I18N §3.D) · LA CLOSCA DE L'EDITOR, EN LA
   LLENGUA DE LA INTERFÍCIE.
   La closca (UniversalEditorShell) no passava pel traductor: amb la
   interfície en anglés, el missatge de les accions inoperatives, les alertes
   i el comptador dels camps, «Edició avançada», els rètols, l'alt i el title
   de les ranures d'imatge, «Enquadrar», «Enrere» i «Esborrar», els avisos
   d'esborrat, el diàleg d'enquadrament i el fons d'error eixien en valencià.
   Ara són parells [clau, reserva] (TEXTOS_CLOSCA) que es pinten amb
   tradueix(t, …). Fora de l'App (sense traductor) o en valencià, el DOM de
   sempre, caràcter a caràcter (Llei del Píxel). Amb el traductor anglés de
   veres i el diàleg simulat (se'n proven les props: el que pinta). */
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';
import CA from '../../config/idiomes/ca.js';
import EN from '../../config/idiomes/en.js';
import ES from '../../config/idiomes/es.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const m = vi.hoisted(() => ({ t: null, showToast: vi.fn(), dialeg: null, pagina: null }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.showToast }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri, resolRecursPropi: (valor) => valor }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActionsOpcional: () => (m.t ? { t: m.t } : null),
}));
vi.mock('./enquadrament/DialegEnquadrament.jsx', () => ({
  DialegEnquadrament: (props) => { m.dialeg = props; return null; },
}));
/* La UniversalPage de veres (el DOM no canvia), però se'n guarden les props:
   així es pot cridar onClickInoperatiu amb una acció que la barra no envia. */
vi.mock('./UniversalPage.jsx', async (importOriginal) => {
  const [real, { createElement }] = await Promise.all([importOriginal(), import('react')]);
  return { ...real, UniversalPage: (props) => { m.pagina = props; return createElement(real.UniversalPage, props); } };
});
import {
  AJUDA_FORMA_CAPCALERA, AJUDA_FORMA_LLIURE, AJUDA_IMATGE_PER_DEFECTE, AJUDA_IMATGE_PUJANT, AVISOS_ACCIONS_EDICIO,
  DESCRIPCIO_ENQUADRAMENT_CAPCALERA, ETIQUETA_EDICIO_AVANCADA, FORMATS_CAPCALERA, NOM_OPCIONS_CAPCALERA, NOM_OPCIONS_LOGOTIP,
  TEXTOS_CLOSCA, UniversalEditorShell,
} from './UniversalEditorShell.jsx';

const enAngles = () => { m.t = createTranslator('en'); };
const enValencia = () => { m.t = createTranslator('ca'); };
const E = (nom) => EN[`editor.closca.${nom}`];
const IMATGES = { heroImage: '/assets/h.webp', logoImage: '/assets/l.webp' };
const closca = (props = {}, fills = <div />) => render(
  <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" {...props}>{fills}</UniversalEditorShell>
);

test('IDEA-70 · el control i les accions del logotip de nit seguixen la llengua de la interfície', () => {
  enAngles();
  const { container, getByText } = closca({ showDarkLogoUpload: true });
  const fosc = container.querySelector('[data-sdp-ranura="logotip-fosc"]');
  expect(within(fosc).getByRole('button', { name: E('edita.logotipFosc') })).toBeTruthy();
  expect(getByText(E('ajuda.logotipFosc'))).toBeTruthy();
  cleanup();
  const ambImatge = closca({ showDarkLogoUpload: true, logoImageDark: '/assets/nit.png' });
  fireEvent.click(ambImatge.getByRole('button', { name: E('edita.logotipFosc') }));
  expect(ambImatge.getByRole('button', { name: E('lleva.logotipFosc') })).toBeTruthy();
});
const imatgeCapcalera = (container) => container.querySelector('img.sdp-hero__imatge');
const imatgeLogotip = (container) => container.querySelector('img.sdp-logo-personalitzat');
const foto = () => new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
const triaFoto = async (container) => {
  await act(async () => {
    fireEvent.change(container.querySelector('.hero-image input[type="file"]'), { target: { files: [foto()] } });
  });
};
/* Un fill que llança dins de la closca. React, en desenvolupament, torna a
   llançar l'error dins d'un esdeveniment de jsdom: es dona per atés (el patró
   de PublicacionsDelPoble.test.jsx), i la consola calla. */
const Peta = () => { throw new Error('motor'); };
const pintaAmbError = () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const atesa = (event) => event.preventDefault();
  window.addEventListener('error', atesa);
  try {
    return closca({}, <Peta />);
  } finally {
    window.removeEventListener('error', atesa);
  }
};
/* Els ids de useId canvien d'un muntatge a l'altre: no són part del que es veu. */
const net = (html) => html.replace(/:r[0-9a-z]+:/g, ':id:').replace(/«r[0-9a-z]+»/g, ':id:');

beforeEach(() => {
  m.t = null;
  m.dialeg = null;
  m.pagina = null;
  m.showToast.mockReset();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('les reserves són el valencià del diccionari', () => {
  /* AH-03 i AH-08.1 (ordre del Mestre, 261104) · El parell 40 és el del botó
     gran «Tancar l’edició avançada» (editor.closca.tancaEdicioAvancada).
     AH-02 (Onada R21) · El 41, el botó «Editar» del document en repòs.
     R22.1 (r221-ui-07) · El 42, el nom del camp del vídeo de capçalera als avisos. */
  test('els 42 parells de TEXTOS_CLOSCA: clau editor.closca.*, reserva = ca i traducció pròpia en anglés', () => {
    const parells = Object.values(TEXTOS_CLOSCA);
    expect(parells).toHaveLength(42);
    expect(new Set(parells.map(([clau]) => clau)).size).toBe(42);
    expect(TEXTOS_CLOSCA.tancaEdicioAvancada).toEqual(['editor.closca.tancaEdicioAvancada', 'Tancar l’edició avançada']);
    expect(TEXTOS_CLOSCA.editaText).toEqual(['editor.closca.edita.text', 'Editar']);
    expect(TEXTOS_CLOSCA.campVideo).toEqual(['editor.closca.camp.video', 'Vídeo de capçalera']);
    for (const [clau, reserva] of parells) {
      expect(clau).toMatch(/^editor\.closca\.[\w.]+$/);
      expect([clau, CA[clau]]).toEqual([clau, reserva]);
      expect([clau, typeof EN[clau]]).toEqual([clau, 'string']);
    }
    expect(Object.isFrozen(TEXTOS_CLOSCA) && parells.every((p) => Object.isFrozen(p))).toBe(true);
  });

  test('les constants exportades de sempre conserven el text, lletra per lletra', () => {
    expect(AVISOS_ACCIONS_EDICIO).toEqual({
      comentar: 'Comentar no està operatiu mentre edites. Quan es publique, obrirà el xat per a comentar-ho.',
      compartir: 'Compartir no està operatiu mentre edites. Quan es publique, servirà per a enviar-ne l’enllaç.',
      connectar: 'Connectar no està operatiu mentre edites. Quan es publique, servirà per a guardar-ho al Bloc de Notes.',
      traduir: 'Traduir no està operatiu mentre edites. Quan es publique, servirà per a llegir-ho en una altra llengua.',
    });
    expect(Object.keys(AVISOS_ACCIONS_EDICIO)).toEqual(['comentar', 'compartir', 'connectar', 'traduir']);
    expect(Object.isFrozen(AVISOS_ACCIONS_EDICIO)).toBe(true);
    expect(ETIQUETA_EDICIO_AVANCADA).toBe('Edició avançada');
    expect(AJUDA_IMATGE_PER_DEFECTE).toBe("Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.");
    expect(AJUDA_IMATGE_PUJANT).toBe('Encara s’està desant la imatge. Quan acabe, la podràs tornar a canviar.');
    expect(AJUDA_FORMA_LLIURE).toBe('La pàgina l’ensenya sencera; la miniatura del llistat i la targeta del Mur la retallen en quadrat.');
    expect(AJUDA_FORMA_CAPCALERA).toMatch(/^Recomanat: la miniatura del llistat i la targeta del Mur ensenyen/);
    // P0-80 / IDEA-211 · Actualitzada a posta: la capçalera ja no es retalla i el text ho diu.
    expect(DESCRIPCIO_ENQUADRAMENT_CAPCALERA).toBe('Tria la forma, mou la foto i amplia-la fins que el que importa quede dins del marc. La foto es guarda sencera: el marc només tria el que es veu, i el que queda fora també es publica.');
    expect(NOM_OPCIONS_CAPCALERA).toBe('Opcions de la capçalera');
    expect(NOM_OPCIONS_LOGOTIP).toBe('Opcions del logotip');
    // Els apòstrofs rectes de sempre continuen rectes (D-2 de l'especificació).
    expect(TEXTOS_CLOSCA.errorTitol[1]).toBe("L'editor ha fallat");
    expect(TEXTOS_CLOSCA.imatgeErrorDesar[1]).toBe("No s'ha pogut desar la imatge.");
  });
});

describe('en anglés', () => {
  test('el missatge ràpid de cada acció inoperativa, amb la seua durada', () => {
    enAngles();
    const { container } = closca();
    const inoperatius = [...container.querySelectorAll('header.bar-blue button.accio-inoperativa')];
    expect(inoperatius).toHaveLength(4);
    for (const boto of inoperatius) fireEvent.click(boto);
    expect(m.showToast.mock.calls.map(([missatge]) => missatge).sort())
      .toEqual(['comentar', 'compartir', 'connectar', 'traduir'].map((accio) => E(`accio.${accio}`)).sort());
    expect(m.showToast.mock.calls.every(([, tipus, durada]) => tipus === 'info' && durada === 5000)).toBe(true);
    expect(m.showToast.mock.calls.map(([missatge]) => missatge)).not.toContain(AVISOS_ACCIONS_EDICIO.comentar);
  });

  test('l’alerta d’un camp porta el nom del camp i el comptador diu la frase sencera', () => {
    enAngles();
    const onClick = vi.fn();
    const { container } = closca({
      avisosCamps: {
        title: { comptador: { llargaria: 72, maxim: 80 } },
        lead: { error: { missatge: 'Server message', accions: [{ text: 'Retry', onClick }] } },
      },
    });
    expect(container.querySelector('.sdp-avis-camp__comptador').textContent).toBe('Title: 72 of 80 characters');
    expect(E('comptador')).toBe('{camp}: {llargaria} of {maxim} characters');
    const alerta = container.querySelector('.sdp-avis-camp');
    expect(alerta.querySelector('.sdp-alerta__titol').textContent).toBe(E('camp.entradilla'));
    fireEvent.click(within(alerta).getByRole('button', { name: 'Retry' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  /* R22.1 (r221-ui-07) · Si fallen la foto i el vídeo de la capçalera, eixien
     dues alertes «Capçalera» idèntiques, i amb una sola no se sabia quin dels
     dos s'havia perdut. El vídeo porta el seu nom, en cinc llengües. */
  test.each([
    ['ca', CA],
    ['es', ES],
    ['en', EN],
    ['eu', EU],
    ['gl', GL],
  ])('a %s, l’alerta del vídeo de capçalera es distingix de la de la foto', (idioma, diccionari) => {
    m.t = createTranslator(idioma);
    const { container } = closca({
      avisosCamps: {
        heroImage: { error: { missatge: 'Foto', accions: [] } },
        heroVideo: { error: { missatge: 'Vídeo', accions: [] } },
      },
    });
    const titols = [...container.querySelectorAll('.sdp-avis-camp')].map((alerta) => [
      alerta.querySelector('.sdp-alerta__titol').textContent, alerta.querySelector('p:not(.sdp-alerta__titol)').textContent,
    ]);
    expect(titols).toEqual([
      [diccionari['editor.closca.camp.capcalera'], 'Foto'],
      [diccionari['editor.closca.camp.video'], 'Vídeo'],
    ]);
    expect(diccionari['editor.closca.camp.video']).not.toBe(diccionari['editor.closca.camp.capcalera']);
  });

  test('«Edició avançada», sola i amb resum', () => {
    enAngles();
    const sola = closca({ edicioAvancada: true });
    expect(sola.container.querySelector('summary.sdp-edicio-avancada__resum').textContent).toBe('Advanced editing');
    cleanup();
    const ambResum = closca({ edicioAvancada: true, resumEdicioAvancada: 'Header and logo' });
    expect(ambResum.container.querySelector('.sdp-edicio-avancada__titol').textContent).toBe(E('edicioAvancada'));
  });

  test('les ranures sense imatge: el rètol i l’ajuda de sèrie; mentre puja, l’avís de pujada', () => {
    enAngles();
    const { container, getByRole } = closca();
    expect(getByRole('button', { name: 'Edit header' })).toBeTruthy();
    expect(getByRole('button', { name: 'Edit logo' })).toBeTruthy();
    expect([...container.querySelectorAll('.sdp-camp__ajuda')].map((p) => p.textContent)).toEqual([E('imatge.ajuda'), E('imatge.ajuda')]);
    cleanup();
    const pujant = closca({ heroPujant: true, logoPujant: true });
    expect([...pujant.container.querySelectorAll('.sdp-camp__ajuda')].map((p) => p.textContent)).toEqual([E('imatge.pujant'), E('imatge.pujant')]);
  });

  test('un rètol o una ajuda explícits manen, també la cadena buida', () => {
    enAngles();
    const { container, getByRole } = closca({ heroEditLabel: 'Canvia la capçalera', heroEditHelp: '', logoEditHelp: 'PNG' });
    expect(getByRole('button', { name: 'Canvia la capçalera' })).toBeTruthy();
    expect([...container.querySelectorAll('.sdp-camp__ajuda')].map((p) => p.textContent).sort()).toEqual(['', 'PNG']);
    cleanup();
    // Un rètol buit explícit continua buit (només la icona i l'espai), com abans.
    const buits = closca({ heroEditLabel: '', logoEditLabel: '' });
    expect([...buits.container.querySelectorAll('.sdp-camp--centrat > button.sdp-boto--secundari')].map((b) => b.textContent)).toEqual([' ', ' ']);
    cleanup();
    // L'ajuda buida explícita del logotip també mana; la de la capçalera continua sent la de sèrie.
    const ajudaLogotipBuida = closca({ logoEditHelp: '' });
    const ajudaDe = (nom) => ajudaLogotipBuida.getByRole('button', { name: nom })
      .closest('.sdp-camp').querySelector('.sdp-camp__ajuda').textContent;
    expect([ajudaDe('Edit header'), ajudaDe('Edit logo')]).toEqual([E('imatge.ajuda'), '']);
  });

  test('les ranures amb imatge: l’alt, el title i, amb onEdit, el nom de les opcions', () => {
    enAngles();
    const { container } = closca(IMATGES);
    expect([imatgeCapcalera(container).alt, imatgeCapcalera(container).title]).toEqual(['Header', 'Click to change the image']);
    expect([imatgeLogotip(container).alt, imatgeLogotip(container).title]).toEqual(['Logo', 'Click to change the logo']);
    expect(imatgeCapcalera(container).hasAttribute('aria-label')).toBe(false);
    cleanup();
    const ambEdit = closca({ ...IMATGES, onHeroEdit: vi.fn(), onLogoEdit: vi.fn() });
    expect(imatgeCapcalera(ambEdit.container).getAttribute('aria-label')).toBe('Header options');
    expect(imatgeLogotip(ambEdit.container).getAttribute('aria-label')).toBe('Logo options');
  });

  test('«Enquadrar», «Enrere» i «Esborrar»; esborrar avisa en anglés', async () => {
    enAngles();
    const onToast = vi.fn();
    const { container, getByRole } = closca({ ...IMATGES, onToast });
    fireEvent.click(imatgeCapcalera(container));
    const enquadra = getByRole('button', { name: 'Frame' });
    // La icona i el text, separats per l'espai de sempre.
    expect(enquadra.textContent).toBe(' Frame');
    expect(getByRole('button', { name: 'Back' })).toBeTruthy();
    await act(async () => { fireEvent.click(getByRole('button', { name: 'Delete' })); });
    expect(onToast).toHaveBeenCalledWith('Image deleted', 'success');
    fireEvent.click(imatgeLogotip(container));
    // El panell de la capçalera ja s'ha tancat: l'únic «Delete» és el del logotip.
    await act(async () => { fireEvent.click(getByRole('button', { name: 'Delete' })); });
    expect(onToast.mock.calls.map(([missatge]) => missatge)).toContain('Logo deleted');
  });

  test('amb «Edició avançada», la capçalera i el logotip desats porten l’alt en anglés', () => {
    enAngles();
    const { container } = closca({ ...IMATGES, edicioAvancada: true });
    const fora = [...container.querySelectorAll('img')].filter((img) => !img.closest('details.sdp-edicio-avancada'));
    expect(fora.find((img) => img.getAttribute('src') === IMATGES.heroImage)?.alt).toBe('Header');
    expect(fora.find((img) => img.getAttribute('src') === IMATGES.logoImage)?.alt).toBe('Logo');
  });

  test('el diàleg d’enquadrament rep les formes, la descripció i l’error de desat en anglés', async () => {
    enAngles();
    const { container } = closca({ onToast: vi.fn() });
    await triaFoto(container);
    expect(m.dialeg).not.toBeNull();
    expect(m.dialeg.descripcio).toBe(E('enquadrament.descripcio'));
    const senseAjuda = (f) => [f.valor, f.etiqueta, f.ratio];
    expect(m.dialeg.formats.map(senseAjuda)).toEqual(FORMATS_CAPCALERA.map(senseAjuda));
    expect(m.dialeg.formats.map((f) => f.ajuda)).toEqual(FORMATS_CAPCALERA.map((f) => (f.ajuda === AJUDA_FORMA_CAPCALERA ? E('forma.capcalera') : E('forma.lliure'))));
    expect(Object.isFrozen(m.dialeg.formats) && m.dialeg.formats.every((f) => Object.isFrozen(f))).toBe(true);
    // Un desat que no arriba a desar res, sense cap error del handler: el missatge de la closca.
    await expect(m.dialeg.onDesa(null)).rejects.toThrow(E('imatge.errorDesar'));
  });

  test('el fons d’error, quan un fill llança', () => {
    enAngles();
    const { container } = pintaAmbError();
    expect(container.querySelector('.sdp-estat__titol').textContent).toBe('The editor has failed');
    expect(container.querySelector('.sdp-estat__descripcio').textContent).toBe(E('error.descripcio'));
  });
});

describe('les accions inoperatives només avisen de les quatre pròpies', () => {
  test.each([['sense traductor', () => {}], ['amb el traductor anglés', enAngles]])(
    '%s, una acció que no és de les quatre (un nom heretat de l’objecte) no llança ni avisa',
    (_nom, prepara) => {
      prepara();
      closca();
      const onClickInoperatiu = m.pagina?.onClickInoperatiu;
      expect(typeof onClickInoperatiu).toBe('function');
      // Sense la guarda, tradueix(t, Object.prototype.toString) llançaria «is not iterable».
      for (const accio of ['toString', 'constructor', 'hasOwnProperty', 'valueOf', '__proto__', 'desconeguda']) {
        expect(() => onClickInoperatiu(accio)).not.toThrow();
      }
      expect(m.showToast).not.toHaveBeenCalled();
      // Les quatre de veres continuen avisant.
      onClickInoperatiu('traduir');
      expect(m.showToast).toHaveBeenCalledTimes(1);
      expect(m.showToast.mock.calls[0][1]).toBe('info');
    },
  );
});

describe('sense traductor, el valencià de sempre; en valencià, el mateix DOM', () => {
  test('fora de l’App, els literals de sempre', async () => {
    const onToast = vi.fn();
    const { container, getByRole } = closca({
      ...IMATGES, onToast,
      avisosCamps: { title: { comptador: { llargaria: 72, maxim: 80 } }, icon: { error: { missatge: 'M', accions: [] } } },
    });
    expect(container.querySelector('.sdp-avis-camp__comptador').textContent).toBe('Títol: 72 de 80 caràcters');
    expect(container.querySelector('.sdp-avis-camp .sdp-alerta__titol').textContent).toBe('Emoticona');
    expect([imatgeCapcalera(container).alt, imatgeCapcalera(container).title]).toEqual(['Capçalera', 'Clica per canviar la imatge']);
    expect([imatgeLogotip(container).alt, imatgeLogotip(container).title]).toEqual(['Logotip', 'Clica per canviar el logotip']);
    expect(getByRole('button', { name: 'Editar capçalera' })).toBeTruthy();
    expect(getByRole('button', { name: 'Editar logotip' })).toBeTruthy();
    fireEvent.click(imatgeCapcalera(container));
    expect(getByRole('button', { name: 'Enquadrar' }).textContent).toBe(' Enquadrar');
    expect(getByRole('button', { name: 'Enrere' })).toBeTruthy();
    expect(container.querySelector('.hero-image .sdp-camp__ajuda').textContent).toBe("Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.");
    await act(async () => { fireEvent.click(getByRole('button', { name: 'Esborrar' })); });
    expect(onToast).toHaveBeenCalledWith('Imatge esborrada', 'success');
  });

  test('fora de l’App, el diàleg rep FORMATS_CAPCALERA (la mateixa llista) i la descripció de sempre', async () => {
    const { container } = closca({ onToast: vi.fn() });
    await triaFoto(container);
    expect(m.dialeg.formats).toBe(FORMATS_CAPCALERA);
    expect(m.dialeg.descripcio).toBe(DESCRIPCIO_ENQUADRAMENT_CAPCALERA);
    await expect(m.dialeg.onDesa(null)).rejects.toThrow("No s'ha pogut desar la imatge.");
  });

  test('fora de l’App, el fons d’error de sempre', () => {
    const { container } = pintaAmbError();
    expect(container.querySelector('.sdp-estat__titol').textContent).toBe("L'editor ha fallat");
    expect(container.querySelector('.sdp-estat__descripcio').textContent)
      .toBe("S'ha produït un error inesperat dins del motor d'edició. Torna a carregar la pàgina per a continuar.");
  });

  test.each([
    ['les ranures amb imatge i els avisos dels camps', { ...IMATGES, avisosCamps: { lead: { comptador: { llargaria: 9, maxim: 10 } }, copyright: { error: { missatge: 'M' } } } }],
    ['l’«Edició avançada» amb resum', { ...IMATGES, edicioAvancada: true, resumEdicioAvancada: 'Resum' }],
    ['les ranures amb onEdit i pujant', { onHeroEdit: vi.fn(), onLogoEdit: vi.fn(), heroPujant: true, ajudaAmbImatge: 'Ajuda' }],
  ])('%s: amb el traductor valencià, el DOM és idèntic al de fora de l’App', (_nom, props) => {
    const fora = net(closca(props).container.innerHTML);
    cleanup();
    enValencia();
    const dins = net(closca(props).container.innerHTML);
    expect(dins).toBe(fora);
    expect(fora).toMatch(/[Cc]apçalera/);
  });

  test('el panell d’edició d’una imatge (Enquadrar, Enrere, Esborrar): el mateix DOM en valencià', () => {
    const obri = () => {
      const vista = closca(IMATGES);
      fireEvent.click(imatgeCapcalera(vista.container));
      return net(vista.container.innerHTML);
    };
    const fora = obri();
    cleanup();
    enValencia();
    expect(obri()).toBe(fora);
    expect(fora).toContain('Esborrar');
  });
});
