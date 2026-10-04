/* Revisió 261004 (Relleus 4-12) · EnllacSegur, la peça que comparteixen la
   bombolla i Contingut multimèdia. L'avís de domini enganyós posava el host
   amb String.replace i una cadena, que interpreta $&, $`, $' i $$: un host
   amb eixos caràcters (un hostname WHATWG els admet) arribava deformat a
   l'avís que l'havia de mostrar tal qual. Amb una funció de reemplaçament
   arriba literal. El DOM de sempre no canvia. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import EnllacSegur from './EnllacSegur.jsx';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

test('l’avís de domini enganyós pinta el host literal, encara que porte «$&», «$$», «$`» o «$\'»', () => {
  const host = "xn--pple-43d.a$&b$$c$`d$'e.com";
  render(<EnllacSegur segment={{ href: `http://${host}/`, text: `http://${host}/`, host, sospitos: true }} t={t} />);
  expect(screen.getByRole('note').textContent).toBe(`Este enllaç porta a un domini amb caràcters enganyosos (${host}).`);
});

test('sense domini enganyós, el DOM de sempre: <span><a class="sdp-xat-enllac">…</a></span>, sense avís', () => {
  const { container } = render(<EnllacSegur segment={{ href: 'https://socdepoble.org/', text: 'https://socdepoble.org/', host: 'socdepoble.org', sospitos: false }} t={t} />);
  expect(container.innerHTML).toBe('<span><a class="sdp-xat-enllac" href="https://socdepoble.org/" target="_blank" rel="noopener noreferrer">https://socdepoble.org/</a></span>');
  expect(screen.queryByRole('note')).toBeNull();
});
