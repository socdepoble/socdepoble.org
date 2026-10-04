/* La ruta lleugera de la Wiki. El seu import queda pendent a propòsit: cap
   vista financera forma part d'esta prova.
   Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
   Gestoria i Wiki»): la ruta no coneix la Gestoria. Una URL vella amb els seus
   ids carrega la Wiki com qualsevol altra, sense obrir cap app ni reescriure
   la consulta; és la Wiki qui la tracta com un ítem desconegut
   (WikiDePobleSection.migracioGestoria.test.jsx). */
import React, { Suspense } from 'react';
import { afterAll, afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

const wiki = vi.hoisted(() => {
  let desbloqueja;
  const pendent = new Promise((resolve) => { desbloqueja = resolve; });
  return { pendent, desbloqueja, carregues: 0 };
});
vi.mock('./WikiDePobleSection.jsx', async () => {
  wiki.carregues += 1;
  await wiki.pendent;
  return { default: () => <p>Wiki de prova carregada</p> };
});

import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { ProveidorPlataforma } from '../../apps/plataforma/PlataformaContext.jsx';
import { BarraLateral } from '../../apps/plataforma/BarraLateral.jsx';
import { preparaNavegador } from '../../apps/plataforma/__fixtures__/munta.jsx';
import RutaWikiDePoble from './RutaWikiDePoble.jsx';
import fontRuta from './RutaWikiDePoble.jsx?raw';

function UbicacioDeProva() {
  const { pathname, search } = useLocation();
  return <output aria-label="Ruta lleugera de prova">{pathname}{search ? `?${search}` : ''}</output>;
}

function munta(ruta) {
  return render(
    <UIProvider>
      <MemoryRouter rutaInicial={ruta}>
        <ProveidorPlataforma entorn={{ produccio: false }}>
          <Suspense fallback={<p>Chunk de la Wiki pendent</p>}>
            <Routes>
              <Route path="/wikidepoble" element={<RutaWikiDePoble />} />
              <Route path="/app/*" element={<p>App de prova fora de la Wiki</p>} />
              <Route path="/xat" element={<p>Xat de prova</p>} />
            </Routes>
          </Suspense>
          <nav aria-label="Barra lleugera de prova"><BarraLateral><p>Menú Sóc de Poble</p></BarraLateral></nav>
          <UbicacioDeProva />
        </ProveidorPlataforma>
      </MemoryRouter>
    </UIProvider>
  );
}

beforeEach(() => { preparaNavegador(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
afterAll(() => { wiki.desbloqueja(); });

test('un document ordinari carrega la Wiki a demanda i manté la consulta mentre el chunk arriba', async () => {
  munta('/wikidepoble?item=identitat');
  expect(screen.getByText('Chunk de la Wiki pendent')).toBeTruthy();
  await waitFor(() => expect(wiki.carregues).toBe(1));
  expect(screen.getByLabelText('Ruta lleugera de prova').textContent).toBe('/wikidepoble?item=identitat');
});

test.each([
  '?categoria=gestoria_cat&item=gestoria_aprendre',
  '?categoria=gestoria_cat&item=gestoria_panell',
  '?item=gestoria_panell',
  '?categoria=gestoria_cat'
])('en DEV, la URL vella %s carrega la Wiki: cap app, cap redirecció, la consulta intacta', async (consulta) => {
  munta(`/wikidepoble${consulta}`);
  expect(screen.getByText('Chunk de la Wiki pendent')).toBeTruthy();
  expect(screen.queryByText('App de prova fora de la Wiki')).toBeNull();
  await waitFor(() => expect(wiki.carregues).toBe(1));
  expect(screen.getByLabelText('Ruta lleugera de prova').textContent).toBe(`/wikidepoble${consulta}`);
  expect(screen.queryByText('App de prova fora de la Wiki')).toBeNull();
});

test('fora de DEV, igual: la URL vella tampoc obri l’app', () => {
  vi.stubEnv('DEV', false);
  munta('/wikidepoble?item=gestoria_aprendre');
  expect(screen.getByText('Chunk de la Wiki pendent')).toBeTruthy();
  expect(screen.queryByText('App de prova fora de la Wiki')).toBeNull();
  expect(screen.getByLabelText('Ruta lleugera de prova').textContent).toBe('/wikidepoble?item=gestoria_aprendre');
});

test('la font de la ruta no nomena la Gestoria ni redirigix', () => {
  expect(fontRuta).not.toMatch(/\bNavigate\b|rutesWiki|destiGestoria|gestoria_(?:cat|panell|aprendre)|\/app\/gestoria/);
  expect(fontRuta.split('import(').length - 1).toBe(1);
});
