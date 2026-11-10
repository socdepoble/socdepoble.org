/* R16-T (P0-80 / IDEA-211, ordre del Mestre del 261109) · L'estat que
   l'editor passa al botó de publicar: 'publicat' (verd) només si el document
   és públic i el servidor ho té tot ('net' o cap desament a vigilar);
   'pendent' (blau) si és privat o hi ha canvis en camí, sense sessió o que
   han fallat (també els que la cua torna a provar sola). Els estats són els
   de veres de la nota (estatPerAlEditor). Una nota que es compartix no porta
   cap estat. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ barra: null }));
vi.mock('./richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: (props) => {
    mocks.barra = props;
    return <div className="sdp-editor-tools" />;
  },
  UniversalRichTextContent: () => <div />
}));
vi.mock('./richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
import { DocumentEditor } from './DocumentEditor.jsx';
import { estatPerAlEditor } from '../../sections/notes/useEstatDesamentNota.js';

afterEach(() => {
  cleanup();
  mocks.barra = null;
});

const DOC = { id: 'd1', title: 'Títol', subtitle: '', lead: '', content: '', formattedDate: '01/01/26', formattedTime: '10:00' };
const estatDelBoto = (adapter) => {
  render(<DocumentEditor adapter={{ document: DOC, ...adapter }} />);
  return mocks.barra.publishState;
};
const publica = { ...DOC, isPublished: true };

test('públic i tot al servidor: «publicat»; sense cap desament a vigilar, també', () => {
  expect(estatDelBoto({ document: publica, estatDesament: estatPerAlEditor({ estat: 'net' }) })).toBe('publicat');
  cleanup();
  expect(estatDelBoto({ document: publica })).toBe('publicat');
});

test('públic amb canvis pendents, en camí, sense sessió o que han fallat: «pendent»', () => {
  const casos = [
    { estat: 'pendent' },
    { estat: 'enviant' },
    { estat: 'sessio' },
    { estat: 'pendent', problema: { tipus: 'temporal', missatge: 'Sense connexió' } },
    { estat: 'net', problema: { tipus: 'conflicte' } },
    { estat: 'pendent', problema: { tipus: 'validacio', missatge: 'Massa llarg.' } },
    { estat: 'error', quarantena: ['publishDate'] },
  ];
  for (const desament of casos) {
    const estatDesament = estatPerAlEditor(desament);
    expect([desament, estatDelBoto({ document: publica, estatDesament })]).toEqual([desament, 'pendent']);
    cleanup();
  }
});

test('privat: «pendent» encara que tot estiga desat', () => {
  expect(estatDelBoto({ document: DOC, estatDesament: estatPerAlEditor({ estat: 'net' }) })).toBe('pendent');
});

test('una nota que es compartix (publishLabel) no porta cap estat: el botó de sempre', () => {
  expect(estatDelBoto({ document: publica, publishLabel: 'Compartir', estatDesament: estatPerAlEditor({ estat: 'net' }) })).toBeNull();
  expect(mocks.barra.publishLabel).toBe('Compartir');
});
