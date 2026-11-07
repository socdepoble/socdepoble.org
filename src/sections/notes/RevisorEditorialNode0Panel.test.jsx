import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CATEGORIES_DOCTORAL_MARES_6,
  ETIQUETES_DOCTORAL_SKOS_49,
  FACETA_3_CATEGORIES_MARES_IA,
  FACETA_4_ETIQUETES_SKOS,
} from '../../data/taxonomia/tesaurusDoctoralSocDePoble.js';
import {
  TEXTOS_REVISOR_EDITORIAL,
  VEREDICTES_EDITORIALS,
  revisaTextEditorialNode0,
} from './revisorEditorialNode0.js';
import RevisorEditorialNode0Panel from './RevisorEditorialNode0Panel.jsx';

afterEach(() => {
  cleanup();
});

const CA = TEXTOS_REVISOR_EDITORIAL.ca;

/* Onada R11 (integració R46 + R104): la categoria mare de «Pou de neu» ix del tesaurus
   (broaderTermId), no d'un valor escrit a mà. P0-40 la va moure de Patrimoni/Cultura a
   Natura i Patrimoni; si el tesaurus torna a canviar, la prova el seguix. */
const ETIQUETA_POU = FACETA_4_ETIQUETES_SKOS.find((t) => t.slug === 'pou-de-neu');
const CATEGORIA_POU = FACETA_3_CATEGORIES_MARES_IA.find((c) => c.id === ETIQUETA_POU.broaderTermId);

/* Pare controlat de prova: aplica el que rep i deixa editar el cos a mà. */
function Arnes({ inicial, onCanvi }) {
  const [nota, setNota] = useState(inicial);
  return (
    <>
      <textarea
        aria-label="cos de la nota"
        value={nota.content}
        onChange={(e) => setNota((n) => ({ ...n, content: e.target.value }))}
      />
      <RevisorEditorialNode0Panel
        idioma="ca"
        {...nota}
        onAplicaProposta={(valors) => {
          onCanvi(valors);
          setNota((n) => ({ ...n, ...valors }));
        }}
      />
    </>
  );
}

describe('IDEA-164 · RevisorEditorialNode0Panel + revisorEditorialNode0 (regles locals, sense IA)', () => {
  it('té els 5 idiomes amb les mateixes claus i es presenta com a regles locals sense IA', () => {
    const clausCa = Object.keys(CA).sort().join(',');
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      expect(TEXTOS_REVISOR_EDITORIAL[lang].title.length).toBeGreaterThan(5);
      expect(TEXTOS_REVISOR_EDITORIAL[lang].btnReview.length).toBeGreaterThan(5);
      expect(Object.keys(TEXTOS_REVISOR_EDITORIAL[lang]).sort().join(',')).toBe(clausCa);
      expect(TEXTOS_REVISOR_EDITORIAL[lang].title).not.toMatch(/IAIA|Node 0|Nodo 0|0 Nodo/);
    }
    expect(CA.title).toContain('sense IA');
  });

  it('aplica les regles automàtiques i deixa com a suggeriment les que depenen del context', () => {
    const etiquetaH1 = '<' + 'h1>Secció inicial</' + 'h1>';
    const resultat = revisaTextEditorialNode0({
      title: 'El Pou de la Neu del Rentonar',
      subtitle: 'Arquitectura del fred',
      entradilla: 'La IAIA usa les imatges del poble per a que tots ho entenguen.',
      content: `${etiquetaH1}<p>Estudiem la pedra en sec i el pou de la neu amb experiències del poble.</p>`,
    });

    expect(resultat.veredicte).toBe(VEREDICTES_EDITORIALS.MILLORA);
    expect(resultat.proposta.entradilla).toBe('La IAIA utilitza les imatges del poble per a que tots ho entenguen.');
    expect(resultat.proposta.content).toContain('<h3>Secció inicial</h3>');
    expect(resultat.proposta.content).toContain('experiències de poble');
    const perId = Object.fromEntries(resultat.observacions.map((o) => [o.id, o.severitat]));
    expect(perId['imaginari-de-poble']).toBe('suggeriment');
    expect(perId['barbarisme-per-a-que']).toBe('suggeriment');
    expect(perId['verb-utilitza']).toBe('millora');
    for (const obs of resultat.observacions) expect(obs).not.toHaveProperty('model');
    expect(resultat).not.toHaveProperty('quadrilla');
  });

  it('no corromp el text: concordança, majúscules, codi, preformatat i municipi concret', () => {
    const r1 = revisaTextEditorialNode0({ title: 'T', subtitle: 'S', entradilla: 'E', content: '<p>Les imatges del poble són molt boniques.</p>' });
    expect(r1.proposta.content).toBe('<p>Les imatges del poble són molt boniques.</p>');

    const codi = '<p>No sé per a que serveix.</p><p><code>const  x = "per a que";</code></p><pre>a  =  1</pre>';
    const r2 = revisaTextEditorialNode0({ title: 'T', subtitle: 'S', entradilla: 'E', content: codi });
    expect(r2.proposta.content).toBe(codi);

    const r3 = revisaTextEditorialNode0({
      title: 'T',
      subtitle: 'S',
      entradilla: 'E',
      content: '<p>Treballem al servei del poble de La Torre amb les eines del poble d’Alcoi.</p><p>Experiències del poble.  Degut a que plou.</p><p><a title="eines del poble">enllaç</a></p>',
    });
    expect(r3.proposta.content).toBe(
      '<p>Treballem al servei del poble de La Torre amb les eines del poble d’Alcoi.</p><p>Experiències de poble. A causa que plou.</p><p><a title="eines del poble">enllaç</a></p>',
    );
    expect(r3.observacions.some((o) => o.id === 'vocacio-de-poble')).toBe(false);

    /* R11 Loop 4: amb «iu», \p{Lu} acceptava minúscules i «de manera» passava per municipi. */
    const r4 = revisaTextEditorialNode0({ title: 'T', subtitle: 'S', entradilla: 'E', content: '<p>Usem les eines del poble de manera senzilla.</p><!-- eines del poble' });
    expect(r4.proposta.content).toBe('<p>Usem les eines de poble de manera senzilla.</p><!-- eines del poble');
  });

  it('HTML mal format: «<a», «<a "», «<!--» i un H1 obert sense «>» no fan créixer el temps de forma quadràtica', () => {
    const casos = {
      lletra: '<a'.repeat(8000),
      cometa: '<a "'.repeat(4000),
      comentari: '<!--'.repeat(16000),
      h1: ('<' + 'h1').repeat(8000),
    };
    for (const [nom, content] of Object.entries(casos)) {
      const t0 = performance.now();
      revisaTextEditorialNode0({ title: 'T', subtitle: 'S', entradilla: 'E', content });
      expect(performance.now() - t0, nom).toBeLessThan(500);
    }
  });

  it('deriva la taxonomia del tesaurus: noms reals, categoria pel broaderTermId i cap categoria per defecte', () => {
    const nomsCategories6 = new Set(CATEGORIES_DOCTORAL_MARES_6);
    const nomsSkos49 = new Set(ETIQUETES_DOCTORAL_SKOS_49);

    const pou = revisaTextEditorialNode0({
      title: 'El Pou de la Neu',
      subtitle: 'Arquitectura del fred',
      entradilla: 'Memòria de la neu',
      content: '<p>El pou de la neu i la pedra en sec de la serra.</p>',
    });
    expect(pou.taxonomia.etiquetesSkos).toContain('Pou de neu');
    expect(CATEGORIA_POU).toBeTruthy();
    expect(pou.taxonomia.categoriaMareCodi).toBe(CATEGORIA_POU.skosNotation);
    expect(pou.taxonomia.categoriaMare).toBe(CATEGORIA_POU.label);
    /* Oracle escrit a mà (P0-40): si el tesaurus tornara el pou a Cultura, la derivació no ho veuria. */
    expect(pou.taxonomia.categoriaMareCodi).toBe('SDP.F3.03');
    expect(pou.taxonomia.categoriaMare).toBe('🌿 Natura i Patrimoni');
    expect(nomsCategories6.has(pou.taxonomia.categoriaMare)).toBe(true);
    for (const tag of pou.taxonomia.etiquetesSkos) expect(nomsSkos49.has(tag)).toBe(true);

    const tic = revisaTextEditorialNode0({
      title: 'Projecte TIC al poble',
      subtitle: 'Noves tecnologies',
      entradilla: 'Vídeos i plànols',
      content: '<p>Documentació del projecte TIC.</p>',
    });
    expect(tic.taxonomia.categoriaMareCodi).toBe('SDP.F3.06');
    /* P0-40 (R46): «Projecte TIC» és una etiqueta retirada; el revisor no la pot proposar. */
    expect(tic.taxonomia.etiquetesSkos).not.toContain('Projecte TIC');
    for (const tag of tic.taxonomia.etiquetesSkos) expect(nomsSkos49.has(tag)).toBe(true);

    const rentonar = revisaTextEditorialNode0({ title: 'Festa a El Rentonar', subtitle: 'S', entradilla: 'E', content: '<p>Trobada veïnal.</p>' });
    expect(rentonar.taxonomia.etiquetesSkos).toContain('El Rentonar');
    expect(rentonar.taxonomia.etiquetesSkos).not.toContain('Pou de neu');
    expect(rentonar.taxonomia.categoriaMareCodi).toBe('SDP.F3.05');

    /* P0-40 (R46): «Node 0» ja és una etiqueta canònica; el text que en parla la rep amb la seua mare. */
    const iaia = revisaTextEditorialNode0({ title: 'La IAIA i el Node 0', subtitle: 'Ollama al Mac mini', entradilla: 'ActivityPub', content: '<p>Res més.</p>' });
    expect(iaia.taxonomia.etiquetesSkos).toEqual(['Node 0']);
    expect(iaia.taxonomia.categoriaMareCodi).toBe('SDP.F3.06');
    expect(nomsCategories6.has(iaia.taxonomia.categoriaMare)).toBe(true);

    /* Sense cap paraula del tesaurus no hi ha categoria per defecte. */
    const buit = revisaTextEditorialNode0({ title: 'Una vesprada qualsevol', subtitle: 'Sense tema', entradilla: 'Res', content: '<p>Res més.</p>' });
    expect(buit.taxonomia).toEqual({ categoriaMare: null, categoriaMareCodi: null, etiquetesSkos: [] });
  });

  it('detecta paràgrafs i elements de llista duplicats i emet BLOQUEJAT PER DUPLICITAT O INCOHERÈNCIA', () => {
    const paragrafRepetit = 'Aquest paràgraf explica el funcionament exacte de la galeria inferior de drenatge de 29 metres.';
    const resultat = revisaTextEditorialNode0({
      title: 'Duplicitat de prova',
      subtitle: 'Subtítol present',
      entradilla: 'Entradeta present',
      content: `<p><strong>${paragrafRepetit}</strong></p><p>${paragrafRepetit}</p>`,
    });
    expect(resultat.veredicte).toBe(VEREDICTES_EDITORIALS.BLOQUEJAT);
    expect(resultat.observacions.some((o) => o.id === 'paragrafs-duplicats')).toBe(true);

    const element = 'Aquest element de llista està repetit exactament igual dues voltes.';
    const llista = revisaTextEditorialNode0({ title: 'T', subtitle: 'S', entradilla: 'E', content: `<ul><li><strong>${element}</strong></li><li>${element}</li></ul>` });
    expect(llista.veredicte).toBe(VEREDICTES_EDITORIALS.BLOQUEJAT);
  });

  it('usa la varietat canònica de Boto i no deixa l’atribut variant al DOM', () => {
    render(<RevisorEditorialNode0Panel idioma="ca" content="Text" onAplicaProposta={vi.fn()} />);
    const revisar = screen.getByRole('button', { name: CA.btnReview });
    expect(revisar.className).toContain('sdp-boto--primari');
    expect(revisar.hasAttribute('variant')).toBe(false);
    fireEvent.click(revisar);
    expect(screen.getByRole('button', { name: CA.btnApplyProposal }).className).toContain('sdp-boto--secundari');
  });

  it('permet revisar, aplicar la proposta i restaurar el text i la taxonomia d’abans en 1 clic', () => {
    const onCanvi = vi.fn();
    render(
      <Arnes
        onCanvi={onCanvi}
        inicial={{
          title: 'Crònica del Pou de Neu',
          subtitle: "Subtítol d'exemple",
          entradilla: "Entradeta d'exemple",
          content: 'La IAIA usa les eines del poble per explicar el pou de la neu.',
          categoriaMare: null,
          etiquetesSkos: ['Patrimoni'],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: CA.btnReview }));
    expect(screen.getByTestId('veredicte-editorial-pill').textContent).toContain('AMB PROPOSTA DE MILLORA');
    expect(screen.getByTestId('proposta-content-node0').textContent).toBe(
      'La IAIA utilitza les eines de poble per explicar el pou de la neu.',
    );

    fireEvent.click(screen.getByRole('button', { name: CA.btnApplyProposal }));
    expect(onCanvi).toHaveBeenCalledOnce();
    const aplicat = onCanvi.mock.calls[0][0];
    expect(aplicat.content).toBe('La IAIA utilitza les eines de poble per explicar el pou de la neu.');
    expect(aplicat.etiquetesSkos).toEqual(['Patrimoni', 'Pou de neu']);
    expect(aplicat.categoriaMare).toBe(CATEGORIA_POU.label);

    fireEvent.click(screen.getByRole('button', { name: CA.btnRestoreOriginal }));
    expect(onCanvi).toHaveBeenCalledTimes(2);
    const restaurat = onCanvi.mock.calls[1][0];
    expect(Object.keys(restaurat).sort()).toEqual(Object.keys(aplicat).sort());
    expect(restaurat.content).toBe('La IAIA usa les eines del poble per explicar el pou de la neu.');
    expect(restaurat.categoriaMare).toBe(null);
    expect(restaurat.etiquetesSkos).toEqual(['Patrimoni']);
  });

  it('R11 Loop 3 (L2-02) · amb `categories`, la categoria suggerida s’afig a totes les d’abans i «Restaurar» les torna senceres', () => {
    const onCanvi = vi.fn();
    render(
      <Arnes
        onCanvi={onCanvi}
        inicial={{
          title: 'Crònica', subtitle: 'Sub', entradilla: 'Entradeta',
          content: 'El pou de neu de la serra.',
          categories: ['Cultura', 'Festes'],
          etiquetesSkos: ['a'],
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: CA.btnReview }));
    fireEvent.click(screen.getByRole('button', { name: CA.btnApplyProposal }));
    const aplicat = onCanvi.mock.calls[0][0];
    expect(aplicat.categories).toEqual(['Cultura', 'Festes', CATEGORIA_POU.label]);
    expect(aplicat.etiquetesSkos).toEqual(['a', 'Pou de neu']);

    fireEvent.click(screen.getByRole('button', { name: CA.btnRestoreOriginal }));
    const restaurat = onCanvi.mock.calls[1][0];
    expect(restaurat.categories).toEqual(['Cultura', 'Festes']);
    expect(restaurat.etiquetesSkos).toEqual(['a']);
  });

  it('R11 Loop 3 (L2-01) · amb HTML als camps, la proposta conserva les etiquetes i el títol tal qual', () => {
    const r = revisaTextEditorialNode0({
      title: '  Pa &amp; vi ',
      subtitle: 'Sub amb <strong>negreta</strong>',
      entradilla: '<p>Entradeta amb <em>cursiva</em></p>',
      content: '<p>Les eines de poble.</p>',
    });
    expect(r.veredicte).toBe(VEREDICTES_EDITORIALS.APROVAT);
    expect(r.proposta.title).toBe('  Pa &amp; vi ');
    expect(r.proposta.subtitle).toBe('Sub amb <strong>negreta</strong>');
    expect(r.proposta.entradilla).toBe('<p>Entradeta amb <em>cursiva</em></p>');
    // Un subtítol o una entradeta només d'etiquetes no compta com a omplit.
    const buit = revisaTextEditorialNode0({ title: 'T', subtitle: 'S', entradilla: '<p></p>', content: '<p>Cos.</p>' });
    expect(buit.observacions.map((o) => o.id)).toContain('manca-subtitol-o-entradeta');
  });

  it('no aplica una proposta obsoleta: si el text canvia després de revisar, «Aplicar» queda desactivat', () => {
    const onAplica = vi.fn();
    const props = { idioma: 'ca', title: 'T', subtitle: 'S', entradilla: 'E', onAplicaProposta: onAplica };
    const { rerender } = render(<RevisorEditorialNode0Panel {...props} content="Text A amb les eines del poble." />);
    fireEvent.click(screen.getByRole('button', { name: CA.btnReview }));
    rerender(<RevisorEditorialNode0Panel {...props} content="Text B escrit després per la veïna." />);
    const aplicar = screen.getByRole('button', { name: CA.btnApplyProposal });
    expect(aplicar.disabled).toBe(true);
    fireEvent.click(aplicar);
    expect(onAplica).not.toHaveBeenCalled();
    expect(screen.getByTestId('revisio-obsoleta-node0').textContent).toBe(CA.staleReview);
  });

  it('restaurar no esborra edicions manuals: la instantània es pren en aplicar (A′ → C′ → C)', () => {
    const onCanvi = vi.fn();
    render(<Arnes onCanvi={onCanvi} inicial={{ title: 'T', subtitle: 'S', entradilla: 'E', content: 'A amb les eines del poble.' }} />);

    fireEvent.click(screen.getByRole('button', { name: CA.btnReview }));
    fireEvent.click(screen.getByRole('button', { name: CA.btnApplyProposal }));
    expect(onCanvi.mock.calls[0][0]).not.toHaveProperty('categoriaMare');

    fireEvent.change(screen.getByLabelText('cos de la nota'), { target: { value: 'C escrit a mà amb les paraules del poble.' } });
    expect(screen.queryByRole('button', { name: CA.btnRestoreOriginal })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: CA.btnReview }));
    fireEvent.click(screen.getByRole('button', { name: CA.btnApplyProposal }));
    expect(onCanvi.mock.calls[1][0].content).toBe('C escrit a mà amb les paraules de poble.');

    fireEvent.click(screen.getByRole('button', { name: CA.btnRestoreOriginal }));
    expect(onCanvi.mock.calls[2][0].content).toBe('C escrit a mà amb les paraules del poble.');
  });
});
