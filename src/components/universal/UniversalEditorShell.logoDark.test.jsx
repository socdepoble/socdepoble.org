import { useState } from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: uri => uri, resolRecursPropi: valor => valor }));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: async () => 'data:image/webp;base64,AAAA' }));
import { UniversalEditorShell } from './UniversalEditorShell.jsx';
afterEach(cleanup);

function Editor({ onSaveField = () => {} }) {
  const [images, setImages] = useState({ logoImage: '/assets/dia.png', logoImageDark: '/assets/nit.png' });
  return <UniversalEditorShell id="dual" titleHtml="Forn" edicioAvancada showDarkLogoUpload {...images}
    onSaveField={(field, value, id) => { setImages(current => ({ ...current, [field]: value })); onSaveField(field, value, id); }}>
    <p>Cos</p>
  </UniversalEditorShell>;
}

test('IDEA-70 · el lector de capçalera rep dia/nit i eliminar nit no canvia el logotip de dia', async () => {
  const save = vi.fn();
  const { container, getByRole } = render(<Editor onSaveField={save} />);
  const title = container.querySelector('header.page-title');
  expect(title.querySelector('img.light-only')?.getAttribute('src')).toBe('/assets/dia.png');
  expect(title.querySelector('img.dark-only')?.getAttribute('src')).toBe('/assets/nit.png');
  fireEvent.click(container.querySelector('.sdp-edicio-avancada > summary'));
  fireEvent.click(getByRole('button', { name: 'Editar logotip de mode nit' }));
  await act(async () => { fireEvent.click(getByRole('button', { name: 'Esborrar logotip de mode nit' })); });
  expect(save).toHaveBeenCalledWith('logoImageDark', '', 'dual');
  expect(title.querySelector('img.page-title-logo--entitat')?.getAttribute('src')).toBe('/assets/dia.png');
  expect(title.querySelector('img.dark-only')).toBeNull();
  expect(save.mock.calls.every(([field]) => field === 'logoImageDark')).toBe(true);
});

test('IDEA-70 · pujar i substituir la variant de nit usa el canal propi; Enrere no desa', async () => {
  const save = vi.fn();
  const { container, getByRole } = render(<Editor onSaveField={save} />);
  fireEvent.click(container.querySelector('.sdp-edicio-avancada > summary'));
  fireEvent.click(getByRole('button', { name: 'Editar logotip de mode nit' }));
  const dark = container.querySelector('[data-sdp-ranura="logotip-fosc"]');
  fireEvent.click(within(dark).getByRole('button', { name: 'Enrere' }));
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(getByRole('button', { name: 'Editar logotip de mode nit' }));
  await act(async () => { fireEvent.change(dark.querySelector('input[type="file"]'), { target: { files: [new File(['a'], 'nit.png', { type: 'image/png' })] } }); });
  expect(save).toHaveBeenCalledWith('logoImageDark', 'data:image/webp;base64,AAAA', 'dual');
  expect(container.querySelector('header.page-title img.light-only')?.getAttribute('src')).toBe('/assets/dia.png');
  expect(container.querySelector('header.page-title img.dark-only')?.getAttribute('src')).toBe('data:image/webp;base64,AAAA');
});
