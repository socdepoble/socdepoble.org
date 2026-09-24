import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const sessio = vi.hoisted(() => ({ rol: null }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ rol: sessio.rol }) }));

import { BotoCrom } from './PanellCrom.jsx';

// La condició vella deixava passar tothom en MODE development: la prova es fa
// en eixe mode perquè el forat no puga tornar sense que ho notem.
beforeEach(() => vi.stubEnv('MODE', 'development'));
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

test.each([null, 'desconegut', 'usuari'])('rol %s: la roda del crom no es mostra, tampoc en desenvolupament', (rol) => {
  sessio.rol = rol;
  render(<BotoCrom />);
  expect(screen.queryByRole('button', { name: 'Crom del sistema' })).toBeNull();
});

test('superadmin: la roda del crom es mostra', () => {
  sessio.rol = 'superadmin';
  render(<BotoCrom />);
  expect(screen.getByRole('button', { name: 'Crom del sistema' })).toBeTruthy();
});
