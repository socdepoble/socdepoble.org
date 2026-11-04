/* Captura anònima pública d'app_content.marketItems: procedència i hashes
   al JSON adjunt. La prova no consulta xarxa ni inventa classes de marcatge. */
import { createHash } from 'node:crypto';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { buildMercatDetailSectionMeta } from './detailSectionMeta.jsx';
import captura from './ItemDetailSection.nutricio.captura.json';

afterEach(cleanup);

test('la descripció pública capturada conserva fitxa, caption i abast de les cel·les al renderer real del Mercat', () => {
  expect(createHash('sha256').update(captura.description).digest('hex')).toBe(captura.descriptionSha256);
  const meta = buildMercatDetailSectionMeta({ t: (_, reserva) => reserva });
  const { container } = render(meta.renderBody({ id: captura.id, description: captura.description }));
  const fitxa = container.querySelector('.sdp-fitxa-nutricional');
  expect(fitxa).not.toBeNull();
  const taula = fitxa.querySelector(':scope > table.sdp-taula-nutricional');
  expect(taula).not.toBeNull();
  expect(taula.querySelector(':scope > caption')?.textContent.trim().length).toBeGreaterThan(0);
  expect(taula.querySelectorAll('thead th[scope="col"]')).toHaveLength(3);
  expect(taula.querySelectorAll('tbody th[scope="row"]')).toHaveLength(13);
  expect(container.querySelector('h3')).not.toBeNull();
});
