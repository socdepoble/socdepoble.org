/**
 * textosEnllacosTargeta.js — Noms accessibles en les 5 llengües (ca, es, en, eu, gl)
 * per als enllaços interns d'UniversalCard quan el navegador aplica
 * `content-visibility: auto` fora del plec (`innerText === ""`), preservant
 * WCAG 2.5.3 (Label in Name) i WCAG 2.4.9 (Link Purpose).
 *
 * Fora de `ca.js` perquè no viatge mai en l'arrencada estàtica del connector
 * WordPress (0 B afegits al sostre de src/apps/plataforma/pesDelNucli.test.js).
 */

export const TEXTOS_ENLLACOS_TARGETA_5_LLENGUES = Object.freeze({
  ca: Object.freeze({
    perfilPublic: 'Perfil públic',
    categoria: 'Categoria',
    dretsAutor: 'Drets d’autor i llicència',
    obrirDetall: 'Obrir detall'
  }),
  es: Object.freeze({
    perfilPublic: 'Perfil público',
    categoria: 'Categoría',
    dretsAutor: 'Derechos de autor y licencia',
    obrirDetall: 'Abrir detalle'
  }),
  en: Object.freeze({
    perfilPublic: 'Public profile',
    categoria: 'Category',
    dretsAutor: 'Copyright and licence',
    obrirDetall: 'Open detail'
  }),
  eu: Object.freeze({
    perfilPublic: 'Profil publikoa',
    categoria: 'Kategoria',
    dretsAutor: 'Egile-eskubideak eta lizentzia',
    obrirDetall: 'Ireki xehetasuna'
  }),
  gl: Object.freeze({
    perfilPublic: 'Perfil público',
    categoria: 'Categoría',
    dretsAutor: 'Dereitos de autoría e licenza',
    obrirDetall: 'Abrir detalle'
  })
});

function paquetIdioma(idioma) {
  const clau = typeof idioma === 'string' ? idioma.trim().toLowerCase() : 'ca';
  return TEXTOS_ENLLACOS_TARGETA_5_LLENGUES[clau] || TEXTOS_ENLLACOS_TARGETA_5_LLENGUES.ca;
}

export function etiquetaAutorTargeta({ author, location, avatarAlt, idioma = 'ca' } = {}) {
  const tx = paquetIdioma(idioma);
  const nom = typeof author === 'string' ? author.trim() : '';
  const lloc = typeof location === 'string' ? location.trim() : '';
  const alt = typeof avatarAlt === 'string' ? avatarAlt.trim() : '';
  if (nom && lloc) return `${nom}, ${lloc} · ${tx.perfilPublic}`;
  if (nom) return `${nom} · ${tx.perfilPublic}`;
  if (lloc) return `${lloc} · ${tx.perfilPublic}`;
  if (alt) return `${alt} · ${tx.perfilPublic}`;
  return tx.perfilPublic;
}

export function etiquetaCategoriaTargeta(text, idioma = 'ca') {
  const net = typeof text === 'string' ? text.trim() : '';
  return net || paquetIdioma(idioma).categoria;
}

export function etiquetaDretsTargeta(children, idioma = 'ca') {
  const net = typeof children === 'string' ? children.trim() : '';
  return net || paquetIdioma(idioma).dretsAutor;
}

export function etiquetaObrirDetallTargeta(title, idioma = 'ca') {
  const net = typeof title === 'string' ? title.trim() : '';
  return net || paquetIdioma(idioma).obrirDetall;
}
