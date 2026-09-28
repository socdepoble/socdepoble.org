import React, { useEffect, useState } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
/* T47 (ordre del Mestre, 260928) · La closca: la ploma a la barra taronja, els
   avisos en línia dels camps i el buidatge en desmuntar abans que mora el pare. */
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
import { UniversalEditorShell } from './UniversalEditorShell.jsx';
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

test('la ploma és el PRIMER element de la barra taronja i desapareix quan tot és desat', () => {
  const { container, rerender } = closca({ estatDesament: { estat: 'pendent' } });
  const accions = container.querySelector('.bar-orange .bar-actions');
  expect(accions.firstElementChild.classList.contains('sdp-estat-desament')).toBe(true);
  rerender(
    <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" estatDesament={{ estat: 'net' }}>
      <div data-testid="cos" />
    </UniversalEditorShell>
  );
  expect(container.querySelector('.sdp-estat-desament')).toBeNull();
  expect(container.querySelector('[role="status"][aria-live="polite"]').textContent).toBe('Tots els canvis estan desats.');
});

/* Correcció C13 (260928) · Notes amaga la barra taronja en mòbil i en columna
   estreta (display:none): la regió viva no hi pot viure, o el lector calla. */
test('C13 · la regió viva de la ploma viu a l’arrel de la closca, fora de la barra taronja', () => {
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
      lead: { comptador: { llargaria: 150, maxim: 120 }, error: { missatge: 'Com a màxim 120 caràcters.', accions: [{ text: 'Retallar a 120', onClick: retalla }] } },
      subtitle: { comptador: { llargaria: 450, maxim: 500 } },
    },
  });
  const article = container.querySelector('article.content-wrapper');
  expect(article.children[0].className).toBe('page-intro');
  const avisos = article.children[1];
  expect(avisos.className).toBe('sdp-avisos-camps');
  const alerta = avisos.querySelector('[role="alert"]');
  expect(alerta.textContent).toContain('Entradilla');
  expect(alerta.textContent).toContain('Com a màxim 120 caràcters.');
  /* La xifra viva, fora de la regió viva: role=alert no la relleu a cada tecla. */
  expect(alerta.textContent).not.toContain('150');
  const comptadors = [...avisos.querySelectorAll('.sdp-avis-camp__comptador')];
  expect(comptadors.map((p) => p.textContent)).toEqual(['Subtítol: 450 de 500 caràcters', 'Entradilla: 150 de 120 caràcters']);
  expect(comptadors.every((p) => !p.closest('[role="alert"], [aria-live]'))).toBe(true);
  expect(comptadors[1].nextElementSibling).toBe(alerta);
  const boto = alerta.querySelector('button');
  expect(boto.textContent).toBe('Retallar a 120');
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

test('després d’una acció d’avís dels drets, el focus va al disparador dels drets', () => {
  const classificacio = <button type="button" className="sdp-copyright-selector">Drets</button>;
  const { container } = render(<AmbAvis camp="copyright" classificacio={classificacio} />);
  premAccio(container);
  expect(document.activeElement).toBe(container.querySelector('.sdp-copyright-selector'));
});

test('sense el destí propi (cap avatar editable), el focus va al títol, mai al body', () => {
  const { container } = render(<AmbAvis camp="logoImage" showLogoUpload={false} />);
  premAccio(container);
  expect(document.activeElement).toBe(container.querySelector('.editor-title-input'));
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
