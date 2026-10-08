import React, { useEffect, useState } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
/* T47 (ordre del Mestre, 260928) · La closca: l'indicador de l'autodesament a
   la barra taronja, els avisos en línia dels camps i el buidatge en desmuntar
   abans que mora el pare. (Des de T51 la ploma és el botó d'emoticona.) */
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri, resolRecursPropi: (valor) => valor }));
import { UniversalEditorShell } from './UniversalEditorShell.jsx';
import { BotoDretsAutor } from './CopyrightSelector.jsx';
import { ContentProvider } from './ContentProvider.jsx';
import { sanitizeHtml } from '../../utils/sanitize.js';

afterEach(cleanup);

const closca = (props = {}) => render(
  <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" {...props}>
    <div data-testid="cos" />
  </UniversalEditorShell>
);

test('sense estatDesament ni avisosCamps, el DOM és el de sempre', () => {
  const { container } = closca();
  expect(container.querySelector('.sdp-estat-desament')).toBeNull();
  expect(container.querySelector('.bar-actions [role="status"]')).toBeNull();
  expect(container.querySelector('.sdp-avisos-camps')).toBeNull();
  expect([...container.querySelector('article.content-wrapper').children].map((e) => e.className || e.dataset.testid))
    .toEqual(['page-intro', 'cos']);
});

/* Derogat en part per l'ordre del Mestre (261008, «confirmació o feedback
   visual del desat automàtic», EstatDesament.jsx) · Quan tot és desat, el
   núvol dels canvis pendents ja no desapareix sense més: dona pas al check de
   desat, que es queda fins al canvi següent. La closca no en sap res: pinta
   l'indicador el primer de les accions, siga quin siga l'estat. */
test('l’indicador de l’autodesament és el PRIMER element de les accions de la barra taronja i, quan tot és desat, el pendent dona pas al desat', () => {
  const { container, rerender } = closca({ estatDesament: { estat: 'pendent' } });
  const accions = container.querySelector('.bar-orange .bar-actions');
  expect(accions.firstElementChild.classList.contains('sdp-estat-desament')).toBe(true);
  expect(accions.firstElementChild.dataset.estat).toBe('pendent');
  rerender(
    <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" estatDesament={{ estat: 'net' }}>
      <div data-testid="cos" />
    </UniversalEditorShell>
  );
  expect(container.querySelector('.sdp-estat-desament--pendent')).toBeNull();
  expect(container.querySelector('.bar-orange .bar-actions').firstElementChild.dataset.estat).toBe('net');
  expect(container.querySelector('[role="status"][aria-live="polite"]').textContent).toBe('Tots els canvis estan desats.');
});

/* Correcció C13 (260928) · Notes amaga la barra taronja en mòbil i en columna
   estreta (display:none): la regió viva no hi pot viure, o el lector calla. */
test('C13 · la regió viva de l’indicador de l’autodesament viu a l’arrel de la closca, fora de la barra taronja', () => {
  const { container, rerender } = closca({ estatDesament: { estat: 'pendent' } });
  const arrel = container.querySelector('.sdp-editor-shell-atomic');
  const regio = arrel.querySelector('[role="status"][aria-live="polite"]');
  expect(regio.parentElement).toBe(arrel);
  expect(regio.classList.contains('sdp-nomes-lector')).toBe(true);
  expect(regio.closest('section.bar-orange')).toBeNull();
  expect(container.querySelector('.bar-orange [role="status"]')).toBeNull();
  const detall = 'No s’ha pogut desar (Error de xarxa). Es tornarà a provar sol.';
  rerender(
    <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" estatDesament={{ estat: 'error', detall }}>
      <div data-testid="cos" />
    </UniversalEditorShell>
  );
  // El mateix node (una regió viva no es remunta: s'anuncia el canvi de text).
  expect(arrel.querySelector('[role="status"][aria-live="polite"]')).toBe(regio);
  expect(regio.textContent).toBe(detall);
});

test('C14 · en error, la icona de la barra és un botó que obri el detall amb les accions', () => {
  const reintenta = vi.fn();
  const detall = 'No s’ha pogut desar (Error de xarxa). Es tornarà a provar sol.';
  const { container } = closca({ estatDesament: { estat: 'error', detall, accions: [{ text: 'Tornar a provar', onClick: reintenta }] } });
  const boto = container.querySelector('.bar-orange .bar-actions').firstElementChild;
  expect(boto.tagName).toBe('BUTTON');
  expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
  act(() => { fireEvent.click(boto); });
  const dialeg = container.querySelector('dialog[open]');
  expect(dialeg.textContent).toContain(detall);
  const accio = [...dialeg.querySelectorAll('button')].find((b) => b.textContent === 'Tornar a provar');
  act(() => { fireEvent.click(accio); });
  expect(reintenta).toHaveBeenCalledTimes(1);
  expect(container.querySelector('dialog[open]')).toBeNull();
});

test('un error de camp va en línia, davall de l’entradilla, amb role=alert i les seues eixides; el focus torna al camp', () => {
  const retalla = vi.fn();
  const { container } = closca({
    avisosCamps: {
      lead: { comptador: { llargaria: 300, maxim: 256 }, error: { missatge: 'Com a màxim 256 caràcters.', accions: [{ text: 'Retallar a 256', onClick: retalla }] } },
      subtitle: { comptador: { llargaria: 450, maxim: 500 } },
    },
  });
  const article = container.querySelector('article.content-wrapper');
  expect(article.children[0].className).toBe('page-intro');
  const avisos = article.children[1];
  expect(avisos.className).toBe('sdp-avisos-camps');
  const alerta = avisos.querySelector('[role="alert"]');
  expect(alerta.textContent).toContain('Entradilla');
  expect(alerta.textContent).toContain('Com a màxim 256 caràcters.');
  /* La xifra viva, fora de la regió viva: role=alert no la relleu a cada tecla. */
  expect(alerta.textContent).not.toContain('300');
  const comptadors = [...avisos.querySelectorAll('.sdp-avis-camp__comptador')];
  expect(comptadors.map((p) => p.textContent)).toEqual(['Subtítol: 450 de 500 caràcters', 'Entradilla: 300 de 256 caràcters']);
  expect(comptadors.every((p) => !p.closest('[role="alert"], [aria-live]'))).toBe(true);
  expect(comptadors[1].nextElementSibling).toBe(alerta);
  const boto = alerta.querySelector('button');
  expect(boto.textContent).toBe('Retallar a 256');
  act(() => { fireEvent.click(boto); });
  expect(retalla).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(container.querySelector('.editor-lead-input'));
});

/* Poliment T47 (ordre del Mestre, 260928) · El botó premut desapareix amb
   l'avís: el focus no pot caure al body. Cada camp té un destí estable (el
   cos, la capçalera, el disparador dels drets). */
function AmbAvis({ camp, ...props }) {
  const [avisos, setAvisos] = useState({
    [camp]: { error: { missatge: 'No s’ha pogut desar.', accions: [{ text: 'Tornar al que hi ha desat', onClick: () => setAvisos(null) }] } },
  });
  return (
    <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" avisosCamps={avisos} {...props}>
      <div className="ProseMirror" contentEditable suppressContentEditableWarning data-testid="cos" />
    </UniversalEditorShell>
  );
}
const premAccio = (container) => {
  const boto = container.querySelector('.sdp-avisos-camps button');
  boto.focus();
  act(() => { fireEvent.click(boto); });
  expect(container.querySelector('.sdp-avisos-camps')).toBeNull();
};

test('després d’una acció d’avís del cos, el focus va a l’editor del cos, no al body', () => {
  const { container } = render(<AmbAvis camp="content" />);
  premAccio(container);
  expect(document.activeElement).toBe(container.querySelector('.ProseMirror'));
});

test('després d’una acció d’avís de la capçalera, el focus va a la capçalera', () => {
  const { container } = render(<AmbAvis camp="heroImage" heroImage="/assets/h.webp" />);
  premAccio(container);
  expect(document.activeElement).toBe(container.querySelector('.hero-image img.sdp-hero__imatge'));
});

/* Decisió del Mestre (261008) · El disparador de veres (BotoDretsAutor, amb
   data-sdp-drets), no un botó inventat amb una classe que ja no porta ningú:
   abans el focus d'esta acció queia al títol a l'editor de veres. */
test('després d’una acció d’avís dels drets, el focus va al disparador dels drets (la píndola de veres)', () => {
  const classificacio = (
    <div className="sdp-copyright-control">
      <BotoDretsAutor valor="© Sóc de Poble" onClick={vi.fn()} />
    </div>
  );
  const { container } = render(<AmbAvis camp="copyright" classificacio={classificacio} copyright="© Sóc de Poble" />);
  premAccio(container);
  const pindola = container.querySelector('.sdp-copyright-control > button.sdp-classificacio-pindola');
  expect(pindola.hasAttribute('data-sdp-drets')).toBe(true);
  expect(document.activeElement).toBe(pindola);
});

test('sense píndola, el focus de l’avís dels drets va al copyright de la capçalera en edició (el botó)', () => {
  const { container } = render(<AmbAvis camp="copyright" copyright="CC BY 4.0" onCanviaCopyright={vi.fn()} />);
  premAccio(container);
  const boto = container.querySelector('header.page-title p.page-title-copyright > button.sp-card-copyright__enllac');
  expect(boto).not.toBeNull();
  expect(document.activeElement).toBe(boto);
});

test('sense el destí propi (cap avatar editable), el focus va al títol, mai al body', () => {
  const { container } = render(<AmbAvis camp="logoImage" showLogoUpload={false} />);
  premAccio(container);
  expect(document.activeElement).toBe(container.querySelector('.editor-title-input'));
});

/* Correcció D2 (revisió de T50) · Incrustat, l'amfitrió pot posar el seu
   avatar a la configuració. Un null explícit (una persona sense foto) vol dir
   «sense avatar»: la barra pinta la silueta, com la targeta viva. */
const AMFITRIO = { barAuthorAvatar: '/assets/amfitrio.webp' };
const avatarDeLaBarra = (props) => {
  const { container } = render(
    <ContentProvider initialConfig={AMFITRIO}>
      <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" barAuthorName="Pepa" {...props} />
    </ContentProvider>
  );
  const autoria = container.querySelector('section.bar-orange .sp-card-author');
  return {
    img: autoria.querySelector('img.sp-card-avatar')?.getAttribute('src') ?? null,
    silueta: autoria.querySelector('.sp-card-avatar--fallback:not(.sp-card-avatar--amagat)') !== null,
  };
};

test('D2 · un barAuthorAvatar null explícit no cau a l’avatar de l’amfitrió: la barra pinta la silueta', () => {
  expect(avatarDeLaBarra({ barAuthorAvatar: null })).toEqual({ img: null, silueta: true });
  cleanup();
  // Sense la prop, la reserva de l'amfitrió de sempre; amb un avatar, el seu.
  expect(avatarDeLaBarra({})).toEqual({ img: '/assets/amfitrio.webp', silueta: false });
  cleanup();
  expect(avatarDeLaBarra({ barAuthorAvatar: '/assets/pepa.webp' })).toEqual({ img: '/assets/pepa.webp', silueta: false });
  cleanup();
  // Una prop undefined explícita és «sense la prop»: la reserva de l'amfitrió.
  expect(avatarDeLaBarra({ barAuthorAvatar: undefined })).toEqual({ img: '/assets/amfitrio.webp', silueta: false });
});

/* Correcció D2 (revisió de W3B1) · Qualsevol valor explícit decidix: el Perfil
   passa '' quan la persona no té foto, i la barra ha de signar com la targeta
   viva (silueta), no amb l'avatar de l'amfitrió. Coherent amb el poble. */
test('D2 · un barAuthorAvatar buit explícit (el Perfil sense foto) tampoc cau a l’amfitrió: silueta', () => {
  expect(avatarDeLaBarra({ barAuthorAvatar: '' })).toEqual({ img: null, silueta: true });
});

test('el buidatge en desmuntar arriba abans que el pare es done per mort (neteja de layout, no passiva)', () => {
  const vist = [];
  const estat = { viu: true };
  function Pare({ children }) {
    useEffect(() => () => { estat.viu = false; }, []);
    return children;
  }
  const onSaveField = vi.fn((camp) => { vist.push([camp, estat.viu]); });
  const { container, unmount } = render(
    <Pare>
      <UniversalEditorShell id="d1" titleHtml="" subtitleHtml="" leadHtml="" onSaveField={onSaveField} />
    </Pare>
  );
  const entradilla = container.querySelector('.editor-lead-input');
  fireEvent.focus(entradilla);
  entradilla.innerHTML = sanitizeHtml('Del Mas');
  fireEvent.input(entradilla);
  expect(onSaveField).not.toHaveBeenCalled();
  unmount();
  expect(vist).toEqual([['lead', true]]);
});
