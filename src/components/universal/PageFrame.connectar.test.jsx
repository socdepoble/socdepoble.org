import { render, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../config/assetResolver', () => ({ resolveAsset: uri => uri }));
vi.mock('../PedraSeca/hooks/useAccions.js', () => ({ useAccions: () => ({ connectarVisible: true, handleConnect: () => {} }) }));
import { PageFrame } from './PageFrame.jsx';
afterEach(cleanup);

test('U08: CONNECTAR de pàgina porta paraula i «+» com la targeta; la CSS en mostra només un', () => {
  const { container } = render(<PageFrame chrome="context" title="Pàgina" />);
  const boto = container.querySelector('header.bar-blue .btn-connectar.sp-card-connect');
  expect(boto.getAttribute('aria-label')).toBe('Connectar');
  expect(boto.querySelector('.sp-card-connect-text').textContent).toBe('Connectar');
  expect(boto.querySelector('.sp-card-connect-plus').getAttribute('aria-hidden')).toBe('true');
});
