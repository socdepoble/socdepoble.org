import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Camp, CampFitxer, CampText, GrupOpcions } from './formulari.jsx';

afterEach(cleanup);

/* D-D (ordre del Mestre, 261004) · El selector de fitxers de Pedra Seca. */
const fitxer = (nom) => new File(['{}'], nom, { type: 'application/json' });

describe('CampFitxer (D-D)', () => {
  test('el control natiu porta l’etiqueta del Camp, amagat però sense aria-hidden i fora del tabulador', () => {
    render(<Camp etiqueta="Nota de traspàs (JSON)" ajuda="Un o més fitxers."><CampFitxer accept=".json" multiple /></Camp>);
    const input = screen.getByLabelText('Nota de traspàs (JSON)');
    expect(input.tagName).toBe('INPUT');
    expect(input.type).toBe('file');
    expect(input.className).toBe('sdp-nomes-lector');
    expect(input.hasAttribute('aria-hidden')).toBe(false);
    expect(input.tabIndex).toBe(-1);
    expect([input.accept, input.multiple]).toEqual(['.json', true]);
    // L'ajuda del Camp i la línia d'estat descriuen el control i el botó.
    const ajuda = document.querySelector('.sdp-camp__ajuda').id;
    const estat = document.querySelector('.sdp-camp-fitxer__estat');
    expect(input.getAttribute('aria-describedby')).toBe(`${ajuda} ${estat.id}`);
    const boto = screen.getByRole('button', { name: 'Nota de traspàs (JSON): Triar fitxers' });
    expect(boto.getAttribute('aria-describedby')).toBe(`${ajuda} ${estat.id}`);
    expect(boto.className).toBe('sdp-boto sdp-boto--secundari sdp-camp-fitxer__boto');
    expect(boto.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(estat.textContent).toBe('Cap fitxer triat');
    expect(estat.getAttribute('aria-live')).toBe('polite');
    expect(input.parentElement.className).toBe('sdp-camp-fitxer');
  });

  test('el botó obri el selector natiu; triar diu què s’ha triat, avisa onChange i buida value', () => {
    const onChange = vi.fn((e) => [...e.target.files].map((f) => f.name));
    render(<Camp etiqueta="Fitxers"><CampFitxer multiple onChange={onChange} /></Camp>);
    const input = screen.getByLabelText('Fitxers');
    const obri = vi.spyOn(input, 'click').mockImplementation(() => {});
    fireEvent.click(screen.getByRole('button', { name: 'Fitxers: Triar fitxers' }));
    expect(obri).toHaveBeenCalledTimes(1);

    const buida = vi.fn();
    Object.defineProperty(input, 'value', { configurable: true, get: () => '', set: buida });
    fireEvent.change(input, { target: { files: [fitxer('a.json'), fitxer('b.json')] } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.results[0].value).toEqual(['a.json', 'b.json']);
    expect(buida).toHaveBeenCalledWith('');
    expect(screen.getByText('2 fitxers: a.json, b.json').className).toBe('sdp-camp-fitxer__estat');

    fireEvent.change(input, { target: { files: ['a', 'b', 'c', 'd', 'e'].map((n) => fitxer(`${n}.json`)) } });
    expect(document.querySelector('.sdp-camp-fitxer__estat').textContent).toBe('5 fitxers: a.json, b.json, c.json i 2 més');
    fireEvent.change(input, { target: { files: [fitxer('sol.json')] } });
    expect(document.querySelector('.sdp-camp-fitxer__estat').textContent).toBe('1 fitxer: sol.json');
  });

  test('disabled desactiva el control i el botó; webkitdirectory tria carpeta', () => {
    render(<Camp etiqueta="Carpeta del trimestre"><CampFitxer webkitdirectory="" multiple disabled /></Camp>);
    const input = screen.getByLabelText('Carpeta del trimestre');
    expect(input.disabled).toBe(true);
    expect(input.hasAttribute('webkitdirectory')).toBe(true);
    expect(screen.getByRole('button', { name: 'Carpeta del trimestre: Triar carpeta' }).disabled).toBe(true);
    expect(screen.getByText('Cap carpeta triada')).toBeTruthy();
  });

  test('fora de <Camp> llança, com la resta de controls', () => {
    const silenci = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<CampFitxer />)).toThrow('<CampFitxer> ha d\'anar dins de <Camp>');
    silenci.mockRestore();
  });

  test('CampText tipus="file" delega en CampFitxer (els sis usos de l’app)', () => {
    const onChange = vi.fn();
    render(<Camp etiqueta="Còpia (JSON)"><CampText tipus="file" accept=".json" onChange={onChange} /></Camp>);
    const input = screen.getByLabelText('Còpia (JSON)');
    expect(input.className).toBe('sdp-nomes-lector');
    expect(screen.getByRole('button', { name: 'Còpia (JSON): Triar fitxer' })).toBeTruthy();
    fireEvent.change(input, { target: { files: [fitxer('copia.json')] } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText('1 fitxer: copia.json')).toBeTruthy();
  });

  /* Auditoria 261004 · El botó és l'única parada de focus: el seu nom ha de dir
     de quin camp és, i getByLabelText ha de continuar trobant només l'input. */
  test('el botó du l’etiqueta del Camp al nom i l’ajuda i l’estat a la descripció', () => {
    render(<Camp etiqueta="Nota de traspàs (JSON)" ajuda="Un o més fitxers."><CampFitxer accept=".json" multiple /></Camp>);
    const boto = screen.getByRole('button', {
      name: 'Nota de traspàs (JSON): Triar fitxers',
      description: 'Un o més fitxers. Cap fitxer triat'
    });
    expect(boto.textContent).toBe('Triar fitxers');
    expect(screen.getByLabelText('Nota de traspàs (JSON)').tagName).toBe('INPUT');
    cleanup();
    // Amb «(obligatori)» a l'etiqueta, el nom també ho diu.
    render(<Camp etiqueta="Còpia" obligatori><CampFitxer /></Camp>);
    expect(screen.getByRole('button', { name: 'Còpia (obligatori): Triar fitxer' })).toBeTruthy();
    expect(screen.getByLabelText('Còpia (obligatori)').tagName).toBe('INPUT');
    cleanup();
    // Una etiqueta que no és text no es pot copiar: el botó es queda amb el verb.
    render(<Camp etiqueta={<span>Arxiu</span>}><CampFitxer /></Camp>);
    expect(screen.getByRole('button', { name: 'Triar fitxer' }).hasAttribute('aria-label')).toBe(false);
  });

  /* Auditoria 261004 · `value` es buida a cada canvi: un required natiu faria
     fallar sempre la validació del <form>. L'obligatori es valida pel nombre
     de fitxers triats, sense bombolla sobre un control d'1px. */
  test('obligatori dins d’un <form>: valida pels fitxers triats, amb aria-invalid i missatge', () => {
    const envia = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={envia}>
        <Camp etiqueta="Còpia" obligatori><CampFitxer name="copia" /></Camp>
        <button type="submit">Envia</button>
      </form>
    );
    const input = screen.getByLabelText('Còpia (obligatori)');
    expect(input.required).toBe(false);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(document.querySelector('.sdp-camp__error')).toBeNull();

    // Sense cap fitxer: no s'envia, ix el missatge i el focus va al botó.
    fireEvent.click(screen.getByRole('button', { name: 'Envia' }));
    expect(envia).not.toHaveBeenCalled();
    const boto = screen.getByRole('button', { name: 'Còpia (obligatori): Triar fitxer' });
    expect(document.activeElement).toBe(boto);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const avis = document.querySelector('.sdp-camp__error');
    expect(avis.textContent).toBe('Este camp és obligatori: prem «Triar fitxer» i tria un fitxer.');
    expect(avis.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(boto.getAttribute('aria-describedby').split(' ')).toContain(avis.id);
    expect(input.getAttribute('aria-describedby').split(' ')).toContain(avis.id);

    // Amb un fitxer triat (i `value` ja buidat), s'envia i l'avís se'n va.
    fireEvent.change(input, { target: { files: [fitxer('copia.json')] } });
    expect(document.querySelector('.sdp-camp__error')).toBeNull();
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Envia' }));
    expect(envia).toHaveBeenCalledTimes(1);
  });

  /* Verificació 261004 · jsdom no pinta la bombolla del navegador (reportValidity és
     checkValidity): el que la impedix és cancel·lar l'esdeveniment, i això sí que es
     pot vore. L'onInvalid de qui usa el control no es perd. */
  test('l’esdeveniment invalid es cancel·la (cap bombolla nativa) i també crida l’onInvalid de qui l’usa', () => {
    const onInvalid = vi.fn((event) => event.defaultPrevented);
    render(<form><Camp etiqueta="Còpia" obligatori><CampFitxer onInvalid={onInvalid} /></Camp></form>);
    const input = screen.getByLabelText('Còpia (obligatori)');
    expect(fireEvent.invalid(input)).toBe(false);
    expect(onInvalid).toHaveBeenCalledTimes(1);
    expect(onInvalid.mock.calls[0][0].type).toBe('invalid');
    expect(onInvalid.mock.results[0].value).toBe(true);
    // Fora d'un enviament, el missatge ix però el focus no es mou.
    expect(document.querySelector('.sdp-camp__error')).not.toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  /* Verificació 261004 · checkValidity() també dispara `invalid`: el focus no pot saltar
     mentre la persona escriu en un altre camp. En enviar, el focus va al primer control
     invàlid del formulari, com fa el navegador, i no a l'últim que rep l'esdeveniment. */
  test('checkValidity() no mou el focus; en enviar, el focus va al primer CampFitxer invàlid', () => {
    const envia = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={envia}>
        <Camp etiqueta="Nom"><CampText /></Camp>
        <Camp etiqueta="Còpia" obligatori><CampFitxer /></Camp>
        <Camp etiqueta="Annex" obligatori><CampFitxer /></Camp>
        <button type="submit">Envia</button>
      </form>
    );
    const nom = screen.getByLabelText('Nom');
    nom.focus();
    let valid = null;
    act(() => { valid = nom.form.checkValidity(); });
    expect(valid).toBe(false);
    expect(document.querySelectorAll('.sdp-camp__error')).toHaveLength(2);
    expect(document.activeElement).toBe(nom);

    fireEvent.click(screen.getByRole('button', { name: 'Envia' }));
    expect(envia).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Còpia (obligatori): Triar fitxer' }));

    // Amb la Còpia triada, el primer invàlid és l'Annex: el focus hi va.
    nom.focus();
    fireEvent.change(screen.getByLabelText('Còpia (obligatori)'), { target: { files: [fitxer('copia.json')] } });
    fireEvent.click(screen.getByRole('button', { name: 'Envia' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Annex (obligatori): Triar fitxer' }));
  });

  test('sense obligatori, un <form> s’envia encara que no s’haja triat res', () => {
    const envia = vi.fn((e) => e.preventDefault());
    render(<form onSubmit={envia}><Camp etiqueta="Còpia"><CampFitxer /></Camp><button type="submit">Envia</button></form>);
    fireEvent.click(screen.getByRole('button', { name: 'Envia' }));
    expect(envia).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Còpia').hasAttribute('aria-required')).toBe(false);
    expect(document.querySelector('.sdp-camp__error')).toBeNull();
  });

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D) · nomsVisibles={false}, per a una carpeta arrel amb
     papers d'identitat (l'Escàner i la Finestreta): la línia d'estat només compta. Per defecte, el text de sempre. */
  test('nomsVisibles={false} amb fitxers solts: la línia d’estat només en diu el recompte, i onChange els rep sencers', () => {
    const onChange = vi.fn((e) => [...e.target.files].map((f) => f.name));
    const { container } = render(<Camp etiqueta="Papers"><CampFitxer multiple nomsVisibles={false} onChange={onChange} /></Camp>);
    const input = screen.getByLabelText('Papers');
    const estat = container.querySelector('.sdp-camp-fitxer__estat');
    expect(estat.textContent).toBe('Cap fitxer triat');
    fireEvent.change(input, { target: { files: [fitxer('sol.json')] } });
    expect(estat.textContent).toBe('1 fitxer');
    fireEvent.change(input, { target: { files: ['a', 'b', 'c', 'd', 'e'].map((n) => fitxer(`${n}.json`)) } });
    expect(estat.textContent).toBe('5 fitxers');
    expect(estat.getAttribute('aria-live')).toBe('polite');
    expect(onChange.mock.results.map((r) => r.value)).toEqual([['sol.json'], ['a.json', 'b.json', 'c.json', 'd.json', 'e.json']]);
    expect(new XMLSerializer().serializeToString(container)).not.toContain('.json');
    expect(input.hasAttribute('nomsvisibles')).toBe(false);
  });

  test('nomsVisibles={false} amb webkitdirectory (per CampText tipus="file", com els usa la Gestoria): «Cap carpeta triada» i el recompte', () => {
    const { container } = render(
      <Camp etiqueta="Carpeta arrel"><CampText tipus="file" webkitdirectory="" multiple nomsVisibles={false} /></Camp>
    );
    const input = screen.getByLabelText('Carpeta arrel');
    expect(input.hasAttribute('webkitdirectory')).toBe(true);
    expect(screen.getByRole('button', { name: 'Carpeta arrel: Triar carpeta' })).toBeTruthy();
    const estat = container.querySelector('.sdp-camp-fitxer__estat');
    expect(estat.textContent).toBe('Cap carpeta triada');
    const papers = ['paper_sintetic_u.pdf', 'paper_sintetic_dos.pdf'].map((nom) => new File(['x'], nom));
    fireEvent.change(input, { target: { files: papers } });
    expect(estat.textContent).toBe('2 fitxers');
    expect(new XMLSerializer().serializeToString(container)).not.toContain('paper_sintetic');
    fireEvent.change(input, { target: { files: [papers[0]] } });
    expect(estat.textContent).toBe('1 fitxer');
    expect(new XMLSerializer().serializeToString(container)).not.toContain('paper_sintetic');
    expect(input.hasAttribute('nomsvisibles')).toBe(false);
  });

  test('Llei del Píxel: sense nomsVisibles (i amb nomsVisibles cert), el mateix DOM i els noms de sempre', () => {
    render(
      <>
        <Camp etiqueta="Per defecte"><CampFitxer multiple /></Camp>
        <Camp etiqueta="Amb noms"><CampFitxer multiple nomsVisibles /></Camp>
        <Camp etiqueta="Carpeta"><CampText tipus="file" webkitdirectory="" multiple /></Camp>
      </>
    );
    const [defecte, amb, carpeta] = ['Per defecte', 'Amb noms', 'Carpeta'].map((etiqueta) => screen.getByLabelText(etiqueta));
    const quatre = () => ['a', 'b', 'c', 'd'].map((n) => fitxer(`${n}.json`));
    for (const input of [defecte, amb, carpeta]) fireEvent.change(input, { target: { files: quatre() } });
    const html = (input, etiqueta) => input.closest('.sdp-camp').outerHTML.replaceAll(input.id, 'ID').replaceAll(etiqueta, 'ETIQUETA');
    expect(html(amb, 'Amb noms')).toBe(html(defecte, 'Per defecte'));
    expect(defecte.closest('.sdp-camp').querySelector('.sdp-camp-fitxer__estat').textContent).toBe('4 fitxers: a.json, b.json, c.json i 1 més');
    expect(carpeta.closest('.sdp-camp').querySelector('.sdp-camp-fitxer__estat').textContent).toBe('4 fitxers: a.json, b.json, c.json i 1 més');
  });

  test('Llei del Píxel: CampText de text pinta l’<input> de sempre, sense embolcall', () => {
    render(<Camp etiqueta="Nom"><CampText placeholder="x" /></Camp>);
    const input = screen.getByLabelText('Nom');
    expect(input.outerHTML).toBe(`<input type="text" class="sdp-control" id="${input.id}" placeholder="x">`);
    expect(document.querySelector('.sdp-camp-fitxer')).toBeNull();
  });

  test('CSS: la fila, el botó de 48px i l’estat, dins de @layer components i només amb tokens', () => {
    const full = readFileSync(resolve(process.cwd(), 'src/css/components.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
    const inici = full.lastIndexOf('@layer components { .sdp-camp-fitxer {');
    expect(inici).toBeGreaterThan(-1);
    // El bloc de la capa, comptant claus: el que vinga darrere no hi compta.
    let fi = full.indexOf('{', inici);
    for (let fons = 0; fi < full.length; fi += 1) {
      if (full[fi] === '{') fons += 1;
      else if (full[fi] === '}' && (fons -= 1) === 0) break;
    }
    const bloc = full.slice(inici, fi + 1);
    expect(bloc).toContain('.sdp-camp-fitxer__boto { min-block-size: var(--sdp-touch); }');
    expect(bloc).toContain('.sdp-camp-fitxer { position: relative;');
    expect(bloc).not.toMatch(/#[0-9a-f]{3,8}\b|\b\d+px\b|:has\(/i);
  });
});

const OPCIONS_TARGETES = [
  { valor: 'publica', antetitol: 'Fitxa', etiqueta: 'Pública', ajuda: 'Tothom la pot vore.', icona: <svg data-icona="globus" />, detall: 'Es pot tornar privada.' },
  { valor: 'privada', antetitol: 'Fitxa', etiqueta: 'Privada', ajuda: 'Només la veus tu.' }
];

describe('GrupOpcions · aspecte targetes (T44)', () => {
  test('fieldset amb llegenda, ràdios natius amb el mateix name i graella en un div', () => {
    render(<GrupOpcions aspecte="targetes" llegenda="Qui pot veure la fitxa" nom="visibilitat" opcions={OPCIONS_TARGETES} />);
    const grup = screen.getByRole('group', { name: 'Qui pot veure la fitxa' });
    expect(grup.tagName).toBe('FIELDSET');
    expect(grup.classList.contains('sdp-grup')).toBe(true);
    expect(grup.classList.contains('sdp-grup--targetes')).toBe(true);
    expect(grup.querySelector(':scope > div.sdp-grup__targetes')).toBeTruthy();
    const radios = within(grup).getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios.every((r) => r.name === 'visibilitat')).toBe(true);
    expect(grup.querySelectorAll('.sdp-casella')).toHaveLength(0);
  });

  test('nom = antetítol + títol (aria-labelledby); descripció = ajuda + detall (aria-describedby)', () => {
    render(<GrupOpcions aspecte="targetes" llegenda="Visibilitat" valor="publica" onCanvi={() => {}} opcions={OPCIONS_TARGETES} textTriada="Triada" />);
    const publica = screen.getByRole('radio', { name: 'Fitxa Pública', description: 'Tothom la pot vore. Es pot tornar privada.' });
    expect(publica.checked).toBe(true);
    /* Sense detall, la descripció és només l'ajuda; la insígnia no s'escola al nom. */
    const privada = screen.getByRole('radio', { name: 'Fitxa Privada', description: 'Només la veus tu.' });
    expect(privada.checked).toBe(false);
    /* La icona va dins d'un embolcall aria-hidden. */
    const icona = document.querySelector('[data-icona="globus"]');
    expect(icona.closest('.sdp-targeta-opcio__icona').getAttribute('aria-hidden')).toBe('true');
    /* Dins del label només hi ha contingut de frase. */
    const label = publica.closest('.sdp-targeta-opcio').querySelector('label');
    expect(label.querySelector('div, p, h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  test('sense antetítol, el nom és només el títol', () => {
    render(<GrupOpcions aspecte="targetes" llegenda="L" opcions={[{ valor: 'a', etiqueta: 'Només títol' }]} />);
    const radio = screen.getByRole('radio', { name: 'Només títol' });
    expect(radio.getAttribute('aria-describedby')).toBeNull();
  });

  test('insígnia amb textTriada només a l’opció marcada i només en mode controlat', () => {
    const onCanvi = vi.fn();
    const { rerender } = render(
      <GrupOpcions aspecte="targetes" llegenda="V" valor="publica" onCanvi={onCanvi} textTriada="Triada" opcions={OPCIONS_TARGETES} />
    );
    expect(screen.getAllByText('Triada')).toHaveLength(1);
    expect(screen.getByText('Triada').closest('.sdp-targeta-opcio').querySelector('input').value).toBe('publica');
    expect(screen.getByText('Triada').closest('.sdp-insignia').classList.contains('sdp-insignia--exit')).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: 'Fitxa Privada' }));
    expect(onCanvi).toHaveBeenCalledWith('privada');
    rerender(<GrupOpcions aspecte="targetes" llegenda="V" valor="privada" onCanvi={onCanvi} textTriada="Triada" opcions={OPCIONS_TARGETES} />);
    expect(screen.getByText('Triada').closest('.sdp-targeta-opcio').querySelector('input').value).toBe('privada');

    cleanup();
    render(<GrupOpcions aspecte="targetes" llegenda="V" opcions={OPCIONS_TARGETES} />);
    expect(screen.queryByText('Triat')).toBeNull();
    expect(screen.getAllByRole('radio').every((r) => r.checked === false)).toBe(true);
  });

  test('textTriada per defecte és «Triat»', () => {
    render(<GrupOpcions aspecte="targetes" llegenda="V" valor="privada" onCanvi={() => {}} opcions={OPCIONS_TARGETES} />);
    expect(screen.getAllByText('Triat')).toHaveLength(1);
  });

  test('fieldset disabled desactiva tots els ràdios', () => {
    render(<GrupOpcions aspecte="targetes" llegenda="V" disabled opcions={OPCIONS_TARGETES} />);
    const grup = screen.getByRole('group', { name: 'V' });
    expect(grup.disabled).toBe(true);
    expect(within(grup).getAllByRole('radio').every((r) => r.matches(':disabled'))).toBe(true);
  });

  test('desactivada desactiva només eixe ràdio', () => {
    const onCanvi = vi.fn();
    render(<GrupOpcions aspecte="targetes" llegenda="V" valor="publica" onCanvi={onCanvi} opcions={[
      OPCIONS_TARGETES[0],
      { ...OPCIONS_TARGETES[1], desactivada: true }
    ]} />);
    const privada = screen.getByRole('radio', { name: 'Fitxa Privada' });
    expect(privada.disabled).toBe(true);
    expect(screen.getByRole('radio', { name: 'Fitxa Pública' }).disabled).toBe(false);
  });

  test('amb error, el fieldset porta les dues classes i el missatge el descriu', () => {
    render(<GrupOpcions aspecte="targetes" llegenda="V" error="Tria una opció." opcions={OPCIONS_TARGETES} />);
    const grup = screen.getByRole('group', { name: 'V' });
    expect(grup.classList.contains('sdp-grup--targetes')).toBe(true);
    expect(grup.classList.contains('sdp-grup--error')).toBe(true);
    expect(document.getElementById(grup.getAttribute('aria-describedby')).textContent).toBe('Tria una opció.');
  });
});

/* jsdom no calcula ni capes ni apilament: es comprova la regla escrita del
   bloc T44 de modules.css (el @layer components que conté .sdp-grup--targetes). */
describe('GrupOpcions · CSS de les targetes (T44)', () => {
  const moduls = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  const blocT44 = (() => {
    const regla = '.sdp-grup--targetes { padding: 0; border: 0;';
    for (let obri = moduls.indexOf('@layer components {'); obri >= 0; obri = moduls.indexOf('@layer components {', obri + 1)) {
      let fons = 0;
      for (let i = moduls.indexOf('{', obri); i < moduls.length; i += 1) {
        if (moduls[i] === '{') fons += 1;
        else if (moduls[i] === '}' && (fons -= 1) === 0) {
          const bloc = moduls.slice(obri, i + 1);
          if (bloc.includes(regla)) return bloc;
          break;
        }
      }
    }
    return '';
  })();
  const regla = (selector) => {
    const inici = blocT44.indexOf(`${selector} {`);
    return inici < 0 ? '' : blocT44.slice(inici, blocT44.indexOf('}', inici) + 1);
  };

  test('el ràdio va damunt del label (z-index 1) i el z-index queda tancat dins de la targeta', () => {
    expect(blocT44).not.toBe('');
    expect(regla('.sdp-targeta-opcio__control')).toContain('position: absolute;');
    expect(regla('.sdp-targeta-opcio__control')).toContain('z-index: 1;');
    expect(regla('.sdp-targeta-opcio')).toContain('isolation: isolate;');
  });

  test('amb error, les targetes porten la vora d’error: després de :checked, abans de :focus-visible i :disabled', () => {
    const ERROR = '.sdp-grup--targetes.sdp-grup--error .sdp-targeta-opcio__cos { border-color: var(--sdp-error); }';
    const posError = blocT44.indexOf(ERROR);
    expect(posError).toBeGreaterThan(-1);
    expect(posError).toBeGreaterThan(blocT44.indexOf('.sdp-targeta-opcio__control:checked + .sdp-targeta-opcio__cos {'));
    expect(posError).toBeLessThan(blocT44.indexOf('.sdp-targeta-opcio__control:focus-visible + .sdp-targeta-opcio__cos {'));
    expect(posError).toBeLessThan(blocT44.indexOf('.sdp-targeta-opcio__control:disabled + .sdp-targeta-opcio__cos { border-color'));
  });
});

describe('GrupOpcions · aspecte llista (per defecte, sense canvis)', () => {
  test('continua emetent files .sdp-casella amb l’etiqueta com a nom', () => {
    render(<GrupOpcions llegenda="Mida" valor="b" onCanvi={() => {}} opcions={[
      { valor: 'a', etiqueta: 'A', ajuda: 'Petita', antetitol: 'ignorat', icona: <svg data-icona="x" />, detall: 'ignorat' },
      { valor: 'b', etiqueta: 'B' }
    ]} />);
    const grup = screen.getByRole('group', { name: 'Mida' });
    expect(grup.className).toBe('sdp-grup');
    expect(grup.querySelectorAll(':scope > .sdp-casella')).toHaveLength(2);
    expect(grup.querySelector('.sdp-grup__targetes, .sdp-targeta-opcio, .sdp-insignia')).toBeNull();
    expect(grup.querySelector('[data-icona]')).toBeNull();
    const a = within(grup).getByRole('radio', { name: /^A/ });
    expect(a.className).toBe('sdp-casella__control');
    expect(a.hasAttribute('aria-labelledby')).toBe(false);
    expect(a.hasAttribute('disabled')).toBe(false);
    expect(within(grup).getByRole('radio', { name: 'B' }).checked).toBe(true);
    expect(grup.textContent).not.toContain('ignorat');
  });

  test('desactivada també desactiva el ràdio en la llista', () => {
    render(<GrupOpcions llegenda="Mida" opcions={[
      { valor: 'a', etiqueta: 'A' },
      { valor: 'b', etiqueta: 'B', desactivada: true }
    ]} />);
    expect(screen.getByRole('radio', { name: 'A' }).disabled).toBe(false);
    expect(screen.getByRole('radio', { name: 'B' }).disabled).toBe(true);
  });
});
