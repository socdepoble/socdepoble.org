import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* Línia I1 de l'Onada 4 (pla 261008_1201) · Les props noves de la closca que
   demanen els consumidors (el Perfil, que puja les imatges pel seu camí):
   logoPujant, heroPujant, logoEditHelp, ajudaAmbImatge i
   estatDesament.reintentant. Totes opcionals: sense elles, el DOM de sempre.
   La closca sencera pinta una UniversalPage: fora el router, els avisos i el
   resolutor d'assets. jsdom no té canvas: la frontera amb el navegador
   (imatgeCanvas.js) i compressImage se simulen. */
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri, resolRecursPropi: (valor) => valor }));
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn(), compressImage: vi.fn() }));
vi.mock('./enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));
import { AJUDA_IMATGE_PER_DEFECTE, AJUDA_IMATGE_PUJANT, UniversalEditorShell } from './UniversalEditorShell.jsx';
import { TEXTOS_ESTAT_DESAMENT } from './EstatDesament.jsx';
import { estatPerAlEditor } from '../../sections/notes/useEstatDesamentNota.js';

beforeEach(() => {
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 800, alcada: 400, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' }));
  dobles.compressImage.mockReset().mockResolvedValue('data:image/webp;base64,AAAA');
});
afterEach(cleanup);

const arbre = (props = {}) => (
  <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" onSaveField={vi.fn()} onToast={vi.fn()} {...props}>
    <div data-testid="cos" />
  </UniversalEditorShell>
);
const closca = (props) => render(arbre(props));
const ranura = (container) => container.querySelector('header.page-title .page-title-logo-personalitzat');
const hero = (container) => container.querySelector('.hero-image');
const fills = (element) => [...element.children].map((e) => `${e.tagName}.${e.className}`);
/* L'ajuda d'un botó d'imatge: la línia .sdp-camp__ajuda del seu mateix camp. */
const ajudaDe = (boto) => boto.closest('.sdp-camp')?.querySelector('.sdp-camp__ajuda')?.textContent ?? null;
const foto = () => new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
const AJUDA = 'PNG, JPEG o WebP, fins a 10 MB.';

describe('sense les props noves, el DOM de sempre', () => {
  test('AJUDA_IMATGE_PER_DEFECTE és el text que la closca deia de sèrie', () => {
    expect(AJUDA_IMATGE_PER_DEFECTE).toBe("Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.");
    expect(AJUDA_IMATGE_PUJANT).toBe('Encara s’està desant la imatge. Quan acabe, la podràs tornar a canviar.');
    const { container } = closca();
    expect(ranura(container).querySelector('.sdp-camp__ajuda').textContent).toBe(AJUDA_IMATGE_PER_DEFECTE);
    expect(hero(container).querySelector('.sdp-camp__ajuda').textContent).toBe(AJUDA_IMATGE_PER_DEFECTE);
  });

  /* Correcció de la revisió (prova 7) · Esta prova compara la closca nova amb
     ella mateixa: només fixa els valors per defecte de les props noves, no
     el DOM d'abans. El DOM d'abans el fixa la prova següent, amb els noms
     literals dels fills i dels atributs. */
  test('els valors per defecte explícits de les props noves fan el mateix que no passar-les', () => {
    for (const imatges of [{}, { heroImage: '/assets/h.webp', logoImage: '/assets/l.webp' }]) {
      const abans = closca(imatges);
      const html = [ranura(abans.container).outerHTML, hero(abans.container).outerHTML];
      cleanup();
      const despres = closca({ ...imatges, logoPujant: false, heroPujant: false, logoEditHelp: AJUDA_IMATGE_PER_DEFECTE, ajudaAmbImatge: null });
      expect([ranura(despres.container).outerHTML, hero(despres.container).outerHTML], JSON.stringify(imatges)).toEqual(html);
      cleanup();
    }
  });

  /* Llei del Píxel, contra el DOM d'abans fixat a mà (no contra la closca
     nova): els fills i els atributs de cada element de la ranura i de la
     capçalera, sense imatge i amb imatge, en repòs. Cap id, cap
     aria-describedby, cap disabled ni cap línia nova. */
  test('el DOM d’abans, literal: fills i atributs de la ranura i de la capçalera (Notes, sense les props noves)', () => {
    const atributs = (el) => [...el.attributes].map((a) => a.name).sort();
    const sense = closca();
    for (const marc of [hero(sense.container), ranura(sense.container)]) {
      const camp = marc.firstElementChild;
      expect(fills(marc)).toEqual(['DIV.sdp-alerta__accions sdp-camp sdp-camp--centrat']);
      expect(fills(camp)).toEqual(['INPUT.sdp-nomes-lector', 'BUTTON.sdp-boto sdp-boto--secundari', 'P.sdp-camp__ajuda']);
      expect(atributs(camp.children[0])).toEqual(['accept', 'class', 'type']);
      expect(atributs(camp.children[1])).toEqual(['class', 'type']);
      expect(atributs(camp.children[2])).toEqual(['class']);
      expect(camp.children[2].textContent).toBe("Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.");
    }
    expect(hero(sense.container).className).toBe('hero-image hero-image--buit');
    cleanup();
    const amb = closca({ heroImage: '/assets/h.webp', logoImage: '/assets/l.webp' });
    const casos = [
      [hero(amb.container), 'IMG.sdp-hero__imatge', 'Editar capçalera'],
      [ranura(amb.container), 'IMG.sdp-logo-personalitzat sdp-logo-personalitzat--editable', 'Editar logotip'],
    ];
    for (const [marc, imatge, nom] of casos) {
      expect(fills(marc)).toEqual([imatge, 'DIV.sdp-alerta__accions sdp-camp sdp-camp--centrat']);
      expect(atributs(marc.children[0])).toEqual(['alt', 'class', 'role', 'src', 'tabindex', 'title']);
      expect(fills(marc.children[1])).toEqual(['BUTTON.sdp-boto sdp-boto--secundari']);
      expect(atributs(marc.children[1].firstElementChild)).toEqual(['class', 'type']);
      expect(marc.children[1].textContent.trim()).toBe(nom);
    }
    expect(hero(amb.container).className).toBe('hero-image');
  });

  test('les props noves no arriben a PageFrame com a atributs del DOM', () => {
    const { container } = closca({ logoPujant: true, heroPujant: true, logoEditHelp: 'Ajuda', ajudaAmbImatge: AJUDA });
    expect(container.querySelector('[logopujant], [heropujant], [logoedithelp], [ajudaambimatge]')).toBeNull();
  });
});

describe('logoEditHelp · l’ajuda de la ranura del logotip', () => {
  test('pinta el text del consumidor, al seu camp; la capçalera continua amb la seua', () => {
    const { container, getByRole } = closca({ logoEditHelp: AJUDA });
    expect(ajudaDe(getByRole('button', { name: 'Editar logotip' }))).toBe(AJUDA);
    expect(ajudaDe(getByRole('button', { name: 'Editar capçalera' }))).toBe(AJUDA_IMATGE_PER_DEFECTE);
    expect(fills(ranura(container).firstElementChild)).toEqual(['INPUT.sdp-nomes-lector', 'BUTTON.sdp-boto sdp-boto--secundari', 'P.sdp-camp__ajuda']);
  });

  test('mentre puja, l’ajuda diu que encara s’està desant (també amb logoEditHelp)', () => {
    const { getByRole } = closca({ logoEditHelp: AJUDA, logoPujant: true });
    expect(ajudaDe(getByRole('button', { name: 'Editar logotip' }))).toBe(AJUDA_IMATGE_PUJANT);
  });
});

describe('logoPujant · la pujada del consumidor bloqueja el logotip, i només el logotip', () => {
  test('sense logotip: el botó desactivat i un fitxer triat no es processa', async () => {
    const onImageUpload = vi.fn();
    const { container, getByRole } = closca({ logoPujant: true, onImageUpload });
    expect(getByRole('button', { name: 'Editar logotip' }).disabled).toBe(true);
    const input = ranura(container).querySelector('input[type="file"]');
    await act(async () => { fireEvent.change(input, { target: { files: [foto()] } }); });
    expect(dobles.compressImage).not.toHaveBeenCalled();
    expect(onImageUpload).not.toHaveBeenCalled();
    // La capçalera no en sap res: el seu botó continua actiu.
    expect(getByRole('button', { name: 'Editar capçalera' }).disabled).toBe(false);
  });

  test('control: sense logoPujant, el mateix fitxer sí que es processa', async () => {
    const onSaveField = vi.fn();
    const { container } = closca({ onSaveField });
    const input = ranura(container).querySelector('input[type="file"]');
    await act(async () => { fireEvent.change(input, { target: { files: [foto()] } }); });
    expect(dobles.compressImage).toHaveBeenCalledTimes(1);
    expect(onSaveField).toHaveBeenCalledWith('logoImage', 'data:image/webp;base64,AAAA', 'd1');
  });

  test('amb logotip: el botó en repòs i «Esborrar» del panell es desactiven; en acabar, tornen', () => {
    const vista = closca({ logoImage: '/assets/l.webp', logoPujant: true });
    expect(vista.getByRole('button', { name: 'Editar logotip' }).disabled).toBe(true);
    fireEvent.click(vista.container.querySelector('img.sdp-logo-personalitzat'));
    expect(within(ranura(vista.container)).getByRole('button', { name: 'Esborrar' }).disabled).toBe(true);
    // Enrere continua viu: tancar el panell no trepitja cap pujada.
    expect(within(ranura(vista.container)).getByRole('button', { name: 'Enrere' }).disabled).toBe(false);
    vista.rerender(arbre({ logoImage: '/assets/l.webp', logoPujant: false }));
    expect(within(ranura(vista.container)).getByRole('button', { name: 'Esborrar' }).disabled).toBe(false);
  });
});

describe('heroPujant · la pujada del consumidor bloqueja la capçalera (botó, triaHero i obriEnquadrament)', () => {
  test('sense capçalera: botó desactivat, l’ajuda ho diu i un fitxer triat no obri el diàleg ni es desa', async () => {
    const onSaveField = vi.fn();
    const { container, getByRole, queryByRole } = closca({ heroPujant: true, onSaveField });
    const boto = getByRole('button', { name: 'Editar capçalera' });
    expect(boto.disabled).toBe(true);
    expect(ajudaDe(boto)).toBe(AJUDA_IMATGE_PUJANT);
    await act(async () => { fireEvent.change(hero(container).querySelector('input[type="file"]'), { target: { files: [foto()] } }); });
    expect(queryByRole('dialog', { name: 'Enquadrar la imatge' })).toBeNull();
    expect(dobles.carregaImatge).not.toHaveBeenCalled();
    expect(onSaveField).not.toHaveBeenCalled();
    // El logotip no en sap res.
    expect(getByRole('button', { name: 'Editar logotip' }).disabled).toBe(false);
  });

  test('control: sense heroPujant, el mateix fitxer obri el diàleg d’enquadrament', async () => {
    const { container, getByRole } = closca();
    await act(async () => { fireEvent.change(hero(container).querySelector('input[type="file"]'), { target: { files: [foto()] } }); });
    expect(getByRole('dialog', { name: 'Enquadrar la imatge' })).toBeTruthy();
  });

  test('amb capçalera: «Enquadrar» i «Esborrar» del panell desactivats mentre puja; en acabar, «Enquadrar» obri el diàleg', async () => {
    const vista = closca({ heroImage: '/assets/h.webp', heroPujant: true });
    expect(vista.getByRole('button', { name: 'Editar capçalera' }).disabled).toBe(true);
    fireEvent.click(vista.container.querySelector('img.sdp-hero__imatge'));
    const enquadrar = within(hero(vista.container)).getByRole('button', { name: 'Enquadrar' });
    expect(enquadrar.disabled).toBe(true);
    expect(within(hero(vista.container)).getByRole('button', { name: 'Esborrar' }).disabled).toBe(true);
    vista.rerender(arbre({ heroImage: '/assets/h.webp', heroPujant: false }));
    await act(async () => { fireEvent.click(within(hero(vista.container)).getByRole('button', { name: 'Enquadrar' })); });
    expect(vista.getByRole('dialog', { name: 'Enquadrar la imatge' })).toBeTruthy();
  });

  test('amb onHeroEdit (el Perfil): el botó en repòs desactivat i el pare no rep cap clic', () => {
    const onHeroEdit = vi.fn();
    const { getByRole } = closca({ heroImage: '/assets/h.webp', heroPujant: true, onHeroEdit, heroEditLabel: 'Capçalera' });
    const boto = getByRole('button', { name: 'Capçalera' });
    expect(boto.disabled).toBe(true);
    fireEvent.click(boto);
    expect(onHeroEdit).not.toHaveBeenCalled();
  });
});

describe('ajudaAmbImatge · la línia d’ajuda davall del botó en repòs, amb imatge i onEdit', () => {
  test('capçalera amb imatge i onHeroEdit: la línia al camp del botó, després del botó', () => {
    const { getByRole } = closca({ heroImage: '/assets/h.webp', onHeroEdit: vi.fn(), heroEditLabel: 'Capçalera', ajudaAmbImatge: AJUDA });
    const boto = getByRole('button', { name: 'Capçalera' });
    expect(fills(boto.parentElement)).toEqual(['BUTTON.sdp-boto sdp-boto--secundari', 'P.sdp-camp__ajuda']);
    expect(ajudaDe(boto)).toBe(AJUDA);
  });

  test('logotip amb imatge i onLogoEdit: la mateixa línia a la ranura', () => {
    const { container, getByRole } = closca({ logoImage: '/assets/l.webp', onLogoEdit: vi.fn(), logoEditLabel: 'Logotip', ajudaAmbImatge: AJUDA });
    const boto = getByRole('button', { name: 'Logotip' });
    expect(ranura(container).contains(boto)).toBe(true);
    expect(fills(boto.parentElement)).toEqual(['BUTTON.sdp-boto sdp-boto--secundari', 'P.sdp-camp__ajuda']);
    expect(ajudaDe(boto)).toBe(AJUDA);
  });

  /* Correcció de la revisió (prova 3) · Mentre puja, la línia diu per què el
     botó no fa res, el mateix criteri que la línia del camp sense imatge
     (uploadText); en acabar, torna el text del consumidor. Cada control, la
     seua pujada: la capçalera que puja no canvia la línia del logotip. */
  test('mentre puja, la línia diu que encara s’està desant i el botó es desactiva; en acabar, el text del consumidor', () => {
    const props = { heroImage: '/assets/h.webp', onHeroEdit: vi.fn(), heroEditLabel: 'Capçalera', logoImage: '/assets/l.webp', onLogoEdit: vi.fn(), logoEditLabel: 'Logotip', ajudaAmbImatge: AJUDA };
    const vista = closca({ ...props, heroPujant: true });
    const boto = vista.getByRole('button', { name: 'Capçalera' });
    expect(boto.disabled).toBe(true);
    expect(ajudaDe(boto)).toBe(AJUDA_IMATGE_PUJANT);
    expect(ajudaDe(vista.getByRole('button', { name: 'Logotip' }))).toBe(AJUDA);
    vista.rerender(arbre({ ...props, heroPujant: false }));
    expect(ajudaDe(vista.getByRole('button', { name: 'Capçalera' }))).toBe(AJUDA);
  });

  test('sense onEdit (Notes), amb un text buit o que no és text: res, el DOM de sempre', () => {
    const imatges = { heroImage: '/assets/h.webp', logoImage: '/assets/l.webp' };
    const base = closca(imatges);
    const html = [ranura(base.container).outerHTML, hero(base.container).outerHTML];
    cleanup();
    const notes = closca({ ...imatges, ajudaAmbImatge: AJUDA });
    expect([ranura(notes.container).outerHTML, hero(notes.container).outerHTML]).toEqual(html);
    cleanup();
    for (const ajudaAmbImatge of ['', '   ', 7, { text: AJUDA }]) {
      const { container, unmount } = closca({ ...imatges, onHeroEdit: vi.fn(), onLogoEdit: vi.fn(), ajudaAmbImatge });
      expect(container.querySelectorAll('.sdp-camp__ajuda'), JSON.stringify(ajudaAmbImatge)).toHaveLength(0);
      unmount();
    }
  });

  test('sense imatge no s’hi afig cap línia: el camp ja porta la seua ajuda de sempre', () => {
    const { container } = closca({ onHeroEdit: vi.fn(), onLogoEdit: vi.fn(), ajudaAmbImatge: AJUDA });
    expect([...hero(container).querySelectorAll('.sdp-camp__ajuda')].map((p) => p.textContent)).toEqual([AJUDA_IMATGE_PER_DEFECTE]);
    expect([...ranura(container).querySelectorAll('.sdp-camp__ajuda')].map((p) => p.textContent)).toEqual([AJUDA_IMATGE_PER_DEFECTE]);
  });
});

describe('estatDesament.reintentant · arriba a la icona de la barra taronja', () => {
  const desat = (container) => container.querySelector('section.bar-orange .sdp-estat-desament--desat');

  test('un error que la cua torna a provar sola i passa a net: el check', () => {
    const vista = closca({ estatDesament: { estat: 'error', detall: '', reintentant: true } });
    expect(desat(vista.container)).toBeNull();
    vista.rerender(arbre({ estatDesament: { estat: 'net', detall: '' } }));
    const check = desat(vista.container);
    expect(check).not.toBeNull();
    expect(check.getAttribute('aria-label')).toBe(TEXTOS_ESTAT_DESAMENT.net);
  });

  test('control: sense reintentant, l’error que passa a net (un descart) no pinta cap check', () => {
    const vista = closca({ estatDesament: { estat: 'error', detall: '' } });
    vista.rerender(arbre({ estatDesament: { estat: 'net', detall: '' } }));
    expect(desat(vista.container)).toBeNull();
    expect(vista.container.querySelector('section.bar-orange .sdp-estat-desament')).toBeNull();
  });

  test('reintentant no canvia el DOM de l’avís en error', () => {
    const amb = closca({ estatDesament: { estat: 'error', detall: '', reintentant: true } });
    const avis = amb.container.querySelector('section.bar-orange .sdp-estat-desament').outerHTML;
    cleanup();
    const sense = closca({ estatDesament: { estat: 'error', detall: '' } });
    expect(sense.container.querySelector('section.bar-orange .sdp-estat-desament').outerHTML).toBe(avis);
  });

  test('el contracte del catàleg i el JSDoc de la closca porten la clau', () => {
    const llig = (fitxer) => readFileSync(path.join(process.cwd(), fitxer), 'utf8');
    expect(llig('src/sections/disseny/cataleg/detalls/EspecimenEstatDesament.jsx'))
      .toContain("['UniversalEditorShell.estatDesament', '{ estat, detall, accions?, reintentant? }'");
    expect(llig('src/components/universal/UniversalEditorShell.jsx')).toContain('detall, accions?, reintentant? }');
  });
});

describe('avatarAutor · les claus noves arriben a PageFrame per la closca', () => {
  test('sense ranura, ajuda i pujant de l’avatar arriben a la fila de píndoles', () => {
    const onCanvia = vi.fn();
    const { container } = closca({
      showLogoUpload: false,
      avatarAutor: { src: '/assets/a.webp', alt: 'Avatar de Pep', onCanvia, etiquetaCanvia: 'Avatar', ajuda: AJUDA, pujant: true },
    });
    const fila = container.querySelector('header.page-title .page-title-avatar-accions');
    expect(fills(fila)).toEqual(['BUTTON.sdp-classificacio-pindola', 'P.sdp-camp__ajuda']);
    expect(fila.querySelector('.sdp-camp__ajuda').textContent).toBe(AJUDA);
    const pindola = within(fila).getByRole('button', { name: 'Avatar' });
    expect(pindola.disabled).toBe(true);
    expect(pindola.getAttribute('aria-busy')).toBe('true');
  });
});

/* Correcció de la revisió (prova 4) · Amb onEdit (el Perfil), la línia
   d'ajuda va lligada al seu botó amb aria-describedby, com el Camp de Pedra
   Seca (formulari.jsx): el lector diu el límit en arribar al botó. Sense
   onEdit (Notes), ni id ni atribut. */
describe('aria-describedby · la línia d’ajuda lligada al botó que tria la imatge', () => {
  const PERFIL = { onHeroEdit: vi.fn(), heroEditLabel: 'Capçalera', heroEditHelp: AJUDA, onLogoEdit: vi.fn(), logoEditLabel: 'Logotip', logoEditHelp: AJUDA, ajudaAmbImatge: AJUDA };

  test('amb onEdit, sense imatge i en repòs amb imatge: la descripció del botó és el límit', () => {
    for (const imatges of [{}, { heroImage: '/assets/h.webp', logoImage: '/assets/l.webp' }]) {
      const { getByRole, unmount } = closca({ ...PERFIL, ...imatges });
      for (const nom of ['Capçalera', 'Logotip']) {
        const boto = getByRole('button', { name: nom });
        const id = boto.getAttribute('aria-describedby');
        expect(id, `${nom} ${JSON.stringify(imatges)}`).toBeTruthy();
        const ajuda = boto.closest('.sdp-camp').querySelector('.sdp-camp__ajuda');
        expect(ajuda.id).toBe(id);
        expect(getByRole('button', { name: nom, description: AJUDA })).toBe(boto);
      }
      unmount();
    }
  });

  test('mentre puja, la descripció diu que s’està desant', () => {
    const { getByRole } = closca({ ...PERFIL, heroImage: '/assets/h.webp', heroPujant: true });
    expect(getByRole('button', { name: 'Capçalera', description: AJUDA_IMATGE_PUJANT })).toBeTruthy();
  });

  test('els ids són únics: capçalera i logotip no es comparteixen la línia', () => {
    const { getByRole } = closca(PERFIL);
    expect(getByRole('button', { name: 'Capçalera' }).getAttribute('aria-describedby'))
      .not.toBe(getByRole('button', { name: 'Logotip' }).getAttribute('aria-describedby'));
  });

  test('sense onEdit (Notes): cap aria-describedby ni cap id a les línies, amb imatge i sense, també amb el panell obert', () => {
    for (const imatges of [{}, { heroImage: '/assets/h.webp', logoImage: '/assets/l.webp' }]) {
      const { container, unmount } = closca({ ...imatges, ajudaAmbImatge: AJUDA });
      if (imatges.heroImage) fireEvent.click(container.querySelector('img.sdp-hero__imatge'));
      expect(container.querySelectorAll('.hero-image [aria-describedby], .page-title-logo-personalitzat [aria-describedby], .sdp-camp__ajuda[id]')).toHaveLength(0);
      unmount();
    }
  });
});

/* Correcció de la revisió (prova 2) · Escape a mitja pujada: la finestra del
   consumidor torna el focus al botó de la closca, que està desactivat
   (heroPujant, logoPujant), i el focus cau al body. Quan la pujada acaba,
   la closca hi torna el focus si encara és perdut, i mai el roba. */
describe('el focus torna al botó quan acaba la pujada del consumidor', () => {
  test('capçalera: heroPujant de true a false amb el focus al body → el focus al botó «Capçalera»', () => {
    const props = { heroImage: '/assets/h.webp', onHeroEdit: vi.fn(), heroEditLabel: 'Capçalera', ajudaAmbImatge: AJUDA };
    const vista = closca({ ...props, heroPujant: true });
    expect(document.activeElement).toBe(document.body);
    vista.rerender(arbre({ ...props, heroPujant: false }));
    expect(document.activeElement).toBe(vista.getByRole('button', { name: 'Capçalera' }));
  });

  test('logotip sense imatge: logoPujant de true a false → el focus al botó «Logotip» de la ranura', () => {
    const props = { onLogoEdit: vi.fn(), logoEditLabel: 'Logotip' };
    const vista = closca({ ...props, logoPujant: true });
    vista.rerender(arbre({ ...props, logoPujant: false }));
    const boto = vista.getByRole('button', { name: 'Logotip' });
    expect(ranura(vista.container).contains(boto)).toBe(true);
    expect(document.activeElement).toBe(boto);
  });

  test('si la persona ja és en un altre lloc, no se li roba el focus', () => {
    const fora = document.createElement('input');
    document.body.append(fora);
    try {
      const props = { heroImage: '/assets/h.webp', onHeroEdit: vi.fn(), heroEditLabel: 'Capçalera' };
      const vista = closca({ ...props, heroPujant: true });
      fora.focus();
      vista.rerender(arbre({ ...props, heroPujant: false }));
      expect(document.activeElement).toBe(fora);
    } finally {
      fora.remove();
    }
  });

  test('control: sense heroPujant ni logoPujant (Notes), la pujada pròpia de la closca no mou el focus', async () => {
    const onSaveField = vi.fn();
    const { container } = closca({ onSaveField });
    await act(async () => { fireEvent.change(ranura(container).querySelector('input[type="file"]'), { target: { files: [foto()] } }); });
    expect(onSaveField).toHaveBeenCalledWith('logoImage', 'data:image/webp;base64,AAAA', 'd1');
    expect(document.activeElement).toBe(document.body);
  });

  test('control: si la pujada encara no ha acabat, cap focus', () => {
    const props = { heroImage: '/assets/h.webp', onHeroEdit: vi.fn(), heroEditLabel: 'Capçalera' };
    const vista = closca({ ...props, heroPujant: true });
    vista.rerender(arbre({ ...props, heroPujant: true, ajudaAmbImatge: AJUDA }));
    expect(document.activeElement).toBe(document.body);
  });
});

/* Correcció de la revisió (prova 1) · La línia de repòs de la capçalera viu
   sobre el marc taronja (.hero-image, --sdp-accent): el seu text és
   --sdp-sobre-accent (7,12:1), no el gris suau (3,3:1 en clar, 1,9:1 en
   fosc). La regla només casa amb eixa línia: ni la capçalera buida (sense
   marc) ni el panell obert (de sempre, també a Notes). */
describe('CSS · el contrast de la línia d’ajuda sobre el marc taronja', () => {
  const llig = (fitxer) => readFileSync(path.join(process.cwd(), fitxer), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  const SELECTOR = '.hero-image > img + .sdp-camp > .sdp-camp__ajuda';

  test('la regla és dins de @layer components, només amb el token del text sobre l’accent', () => {
    const css = llig('src/css/components.css');
    const inici = css.indexOf(`${SELECTOR} {`);
    expect(inici).toBeGreaterThan(-1);
    const regla = css.slice(inici, css.indexOf('}', inici));
    expect(regla).toContain('color: var(--sdp-sobre-accent);');
    expect(regla).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|\d+px|:has\(|color-mix/i);
    const obertura = css.lastIndexOf('@layer components {', inici);
    expect(obertura).toBeGreaterThan(-1);
    let fons = 0;
    for (let i = css.indexOf('{', obertura); i < inici; i += 1) {
      if (css[i] === '{') fons += 1;
      else if (css[i] === '}') fons -= 1;
    }
    expect(fons).toBe(1);
  });

  test('el token existix en clar i en fosc, i el fons de la capçalera és blanc', () => {
    const tokens = llig('src/css/tokens.css');
    expect(tokens.match(/--sdp-sobre-accent: /g)?.length).toBeGreaterThanOrEqual(2);
    expect(llig('src/css/layout.css')).toMatch(/\.hero-image \{[^}]*background: var\(--sdp-blanc-pur, #ffffff\);/);
  });

  test('el selector casa amb la línia de repòs i no amb la capçalera buida ni amb el panell obert', () => {
    const props = { onHeroEdit: vi.fn(), heroEditLabel: 'Capçalera', ajudaAmbImatge: AJUDA };
    const amb = closca({ ...props, heroImage: '/assets/h.webp' });
    const linies = amb.container.querySelectorAll(SELECTOR);
    expect([...linies].map((p) => p.textContent)).toEqual([AJUDA]);
    fireEvent.click(amb.container.querySelector('img.sdp-hero__imatge'));
    expect(amb.container.querySelectorAll(SELECTOR)).toHaveLength(0);
    expect(hero(amb.container).querySelector('.sdp-camp__ajuda')).not.toBeNull();
    cleanup();
    const buida = closca(props);
    expect(buida.container.querySelectorAll(SELECTOR)).toHaveLength(0);
    expect(hero(buida.container).classList.contains('hero-image--buit')).toBe(true);
  });
});

/* Correcció de la revisió (prova 7) · Notes de punta a punta per la closca:
   la traducció de veres de l'estat del gestor (estatPerAlEditor) arriba a la
   closca de veres, que pinta la icona a la barra taronja. Abans, la prova de
   NotesEditor tornava a escriure a mà la línia de la closca. */
describe('Notes · estatPerAlEditor → closca → check a la barra taronja', () => {
  const desat = (container) => container.querySelector('section.bar-orange .sdp-estat-desament--desat');
  const PENDENT = { estat: 'pendent', problema: null, quarantena: [] };
  const TEMPORAL = { estat: 'error', problema: { tipus: 'temporal', missatge: 'xarxa', intents: 1 }, quarantena: [] };
  const CONFLICTE = { estat: 'error', problema: { tipus: 'conflicte', missatge: 'versió nova' }, quarantena: [] };

  test('pendent → error temporal (es torna a provar sol) → net: el check', () => {
    const vista = closca({ estatDesament: estatPerAlEditor(PENDENT) });
    vista.rerender(arbre({ estatDesament: estatPerAlEditor(TEMPORAL) }));
    expect(vista.container.querySelector('section.bar-orange .sdp-estat-desament').dataset.estat).toBe('error');
    expect(desat(vista.container)).toBeNull();
    vista.rerender(arbre({ estatDesament: estatPerAlEditor() }));
    const check = desat(vista.container);
    expect(check).not.toBeNull();
    expect(check.getAttribute('aria-label')).toBe(TEXTOS_ESTAT_DESAMENT.net);
  });

  test('control: un conflicte que passa a net (conservar el remot) no pinta cap check', () => {
    const vista = closca({ estatDesament: estatPerAlEditor(CONFLICTE) });
    expect(estatPerAlEditor(CONFLICTE)).not.toHaveProperty('reintentant');
    vista.rerender(arbre({ estatDesament: estatPerAlEditor() }));
    expect(desat(vista.container)).toBeNull();
  });
});
