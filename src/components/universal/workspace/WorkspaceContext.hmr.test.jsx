import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { WorkspaceProvider } from './WorkspaceContext.jsx?versio=anterior';
import { useWorkspace } from './WorkspaceContext.jsx?versio=nova';
afterEach(cleanup);
function Lector() {
  const { state } = useWorkspace();
  return <output>{state.activeCategoryId}</output>;
}
test('dos versions HMR del proveïdor i del hook compartixen la mateixa identitat de context', () => {
  render(<WorkspaceProvider categories={[{id:'poble'}]} initialSelection={{categoryId:'poble'}}><Lector /></WorkspaceProvider>);
  expect(screen.getByRole('status').textContent).toBe('poble');
});
