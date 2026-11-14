/* Auditoria del kit de Gemini R22 (kit_gemini_auditor) · El desacoblament de
   PanellVisibilitatEnLinia respecte de sections/notes (pegat de fora de carril
   de Gemini, TR-GC-01) copia els textos per defecte i la signatura dins del
   component. Esta prova en guarda la paritat pel que es VEU: el panell sense
   `textos` pinta exactament el mateix que amb textosEnLiniaDeNota() del Bloc,
   en valencià i amb el traductor, i la línia de signatura diu el mateix. Si el
   Bloc canvia un text, esta prova cau i cal portar-lo també al component. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => () => {} }));

import { PanellVisibilitatEnLinia } from './PanellVisibilitatEnLinia.jsx';
import { textosEnLiniaDeNota } from '../../sections/notes/visibilitatNota.js';
import ES from '../../config/idiomes/es.js';

afterEach(cleanup);

/* useId fa ids diferents en cada muntatge: fora, per comparar el que es veu. */
const net = (html) => html.replace(/\s(?:id|for|aria-describedby|aria-labelledby|aria-controls|name)="[^"]*"/g, '');

function html(props) {
  const { container, unmount } = render(<PanellVisibilitatEnLinia notaId="n-1" esPublica={false} onTria={() => {}} {...props} />);
  const sortida = net(container.innerHTML);
  unmount();
  return sortida;
}

test('sense `textos`, el panell pinta el mateix que amb els textos del Bloc (i la mateixa signatura)', () => {
  expect(html({ comNom: 'Pepa Soler' })).toBe(html({ comNom: 'Pepa Soler', textos: textosEnLiniaDeNota() }));
  expect(html({ comNom: 'Pepa Soler' })).toContain('Publicaràs com a Pepa Soler.');
});

test('la signatura en una altra llengua passa pel mateix traductor i la mateixa clau', () => {
  const t = (clau, reserva) => ES[clau] ?? reserva;
  const ambDefecte = html({ comNom: 'Pepa Soler', t });
  const ambBloc = html({ comNom: 'Pepa Soler', t, textos: textosEnLiniaDeNota() });
  expect(ambDefecte).toBe(ambBloc);
  expect(ambDefecte).toContain(ES['section.notes.visibilitat.enLinia.signatura'].replace('{nom}', 'Pepa Soler'));
});
