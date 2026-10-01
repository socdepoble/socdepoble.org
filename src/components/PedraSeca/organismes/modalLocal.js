/* Modalitat limitada a una instància de <soc-de-poble>. Cap listener ni
   atribut de modalitat ix de la seua arrel. inert és una millora: el focus
   també es controla en navegadors del Baseline que encara no el tenen. */
const piles = new WeakMap();
const selectorFocus = 'button, a[href], input, select, textarea, summary, [tabindex], [contenteditable="true"]';

function controls(dialeg) {
  return [...dialeg.querySelectorAll(selectorFocus)].filter(el => {
    if (el.tabIndex < 0 || el.matches(':disabled') || el.closest('[hidden], [inert]')) return false;
    // Un fill de display:none pot conservar display:inline-block: mirar
    // només el control deixa escapar Tab abans d'una secció amagada.
    for (let node = el; node && node !== dialeg; node = node.parentElement) {
      const estil = getComputedStyle(node);
      if (estil.display === 'none' || estil.visibility === 'hidden' || estil.visibility === 'collapse') return false;
    }
    return true;
  }).sort((a, b) => (a.tabIndex || Infinity) - (b.tabIndex || Infinity));
}

function enfoca(dialeg) {
  const candidats = controls(dialeg);
  (candidats.find(el => el.hasAttribute('autofocus') || el.hasAttribute('data-sdp-focus-inicial')) || candidats[0] || dialeg).focus();
}

function restaura(node, atribut, valor) {
  if (valor === null) node.removeAttribute(atribut);
  else node.setAttribute(atribut, valor);
}

export function obriModalLocal(dialeg, onTanca, retorn) {
  const capa = dialeg.parentElement;
  const arrel = capa.parentElement;
  const shadow = dialeg.getRootNode();
  const focusInicial = shadow.activeElement;
  let estat = piles.get(arrel);
  if (!estat) {
    estat = { pila: [], originals: new Map() };
    piles.set(arrel, estat);
  }
  const entrada = { dialeg, capa };
  const superior = () => estat.pila.at(-1);
  const sincronitza = () => {
    for (const item of estat.pila) item.capa.toggleAttribute('data-sdp-modal-top', item === superior());
    for (const [node, original] of estat.originals) {
      restaura(node, 'inert', original.inert);
      restaura(node, 'aria-hidden', original.ariaHidden);
    }
    for (const node of arrel.children) {
      if (node === superior()?.capa) continue;
      if (!estat.originals.has(node)) estat.originals.set(node, {
        inert: node.getAttribute('inert'), ariaHidden: node.getAttribute('aria-hidden')
      });
      node.setAttribute('inert', '');
      node.setAttribute('aria-hidden', 'true');
    }
  };
  estat.pila.push(entrada);
  sincronitza();
  if (typeof dialeg.show === 'function') dialeg.show();
  else dialeg.setAttribute('open', '');
  // show() també executa passos de focus. Conservar la tria que React o
  // el consumidor ja han fet, encara que show l'haja moguda a la X.
  if (dialeg.contains(focusInicial)) focusInicial.focus({ preventScroll: true });
  else enfoca(dialeg);

  const alTeclat = e => {
    if (superior() !== entrada || e.defaultPrevented) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      onTanca('esc');
    } else if (e.key === 'Tab') {
      const candidats = controls(dialeg);
      const primer = candidats[0], ultim = candidats.at(-1), actiu = shadow.activeElement;
      if (!primer || !dialeg.contains(actiu) || (e.shiftKey ? actiu === primer || actiu === dialeg : actiu === ultim)) {
        e.preventDefault();
        (e.shiftKey ? ultim || dialeg : primer || dialeg).focus();
      }
    }
  };
  const alFocus = e => {
    if (superior() === entrada && !dialeg.contains(e.target)) enfoca(dialeg);
  };
  arrel.addEventListener('keydown', alTeclat);
  arrel.addEventListener('focusin', alFocus);
  // React pot afegir germans mentre el modal està obert (p. ex. navegació).
  const observador = new MutationObserver(sincronitza);
  observador.observe(arrel, { childList: true });

  return () => {
    observador.disconnect();
    arrel.removeEventListener('keydown', alTeclat);
    arrel.removeEventListener('focusin', alFocus);
    const eraSuperior = superior() === entrada;
    estat.pila = estat.pila.filter(item => item !== entrada);
    capa.removeAttribute('data-sdp-modal-top');
    dialeg.removeAttribute('open');
    if (estat.pila.length) sincronitza();
    else {
      for (const [node, original] of estat.originals) {
        restaura(node, 'inert', original.inert);
        restaura(node, 'aria-hidden', original.ariaHidden);
      }
      piles.delete(arrel);
    }
    if (eraSuperior) {
      if (retorn?.isConnected && !retorn.closest('[inert]')) retorn.focus();
      else if (superior()) enfoca(superior().dialeg);
    }
  };
}
