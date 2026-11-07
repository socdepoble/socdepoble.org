/* IDEA-164 · R11 Loop 3 (L2-03) · La ranura opcional `revisioEdicioAvancada` de la closca: dins de
   l'«Edició avançada» (plegada), després de la classificació i abans de tancar; sense la prop, o
   sense `edicioAvancada`, el DOM de sempre. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri, resolRecursPropi: (valor) => valor }));
import { UniversalEditorShell } from './UniversalEditorShell.jsx';

afterEach(cleanup);

const REVISIO = <section data-testid="revisora">Revisora</section>;
const closca = (props = {}) => render(
  <UniversalEditorShell id="d1" titleHtml="" subtitleHtml="" leadHtml="" classificacio={<div data-testid="botonera" />} {...props}>
    <div className="ProseMirror" data-testid="cos" />
  </UniversalEditorShell>
);
const fillsAmbRanura = (el) => [...el.children].map((e) => (e.dataset.sdpRanura ? `${e.className} [${e.dataset.sdpRanura}]` : e.className));

describe('R11 Loop 3 · ranura revisioEdicioAvancada', () => {
  test('dins del desplegable plegat, després de la classificació', () => {
    const { container } = closca({ edicioAvancada: true, revisioEdicioAvancada: REVISIO });
    const desplegable = container.querySelector('details.sdp-edicio-avancada');
    expect(desplegable.open).toBe(false);
    const cos = desplegable.querySelector('.sdp-edicio-avancada__cos');
    expect(fillsAmbRanura(cos).slice(-3)).toEqual([
      'page-title-classificacio',
      'sdp-edicio-avancada__ambit [revisio]',
      'sdp-boto sdp-boto--secundari sdp-edicio-avancada__boto-tancar'
    ]);
    expect(cos.querySelector('[data-sdp-ranura="revisio"] [data-testid="revisora"]')).not.toBeNull();
    expect(container.querySelector('[revisioedicioavancada]')).toBeNull();
  });

  test('sense edicioAvancada, o sense la prop, el DOM de sempre', () => {
    const sempre = closca().container.innerHTML;
    cleanup();
    expect(closca({ revisioEdicioAvancada: REVISIO }).container.innerHTML).toBe(sempre);
    cleanup();
    const ambDesplegable = closca({ edicioAvancada: true }).container.innerHTML;
    cleanup();
    expect(closca({ edicioAvancada: true, revisioEdicioAvancada: null }).container.innerHTML).toBe(ambDesplegable);
  });
});
