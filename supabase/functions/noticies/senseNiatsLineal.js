/**
 * senseNiatsLineal.js · P1-07 (deute G-03, Onada 2, 261101) · Un tros d'XML sense els elements
 * niats que porten enllaços que no són seus (gestor.js · imatgesDelFeed): cada obertura `<nom…>`
 * d'un dels `noms`, fins al seu primer tancament `</nom\s*>`, fora. Pur: cap import, cap estat.
 *
 * El contracte és el de l'expressió d'abans de G-03 (d7aa77350^, senseNiats), sense la seua
 * tornada enrere:
 *   tros.replace(/<((?:[\w.-]+:)?(?:noms))(?:\s[^>]*[^/>])?\s*>[\s\S]*?<\/\1\s*>/g, '')
 *   · el nom va sense prefix o amb un (`x:source`), distingix majúscules, i el tancament ha de
 *     portar el mateix nom sencer, prefix inclòs;
 *   · l'obertura acaba en el primer «>», també dins d'unes cometes: `<nom/>` i `<nom a="b"/>`
 *     s'autotanquen (no lleven res) i `<nom / >`, no;
 *   · cada obertura arriba fins al PRIMER tancament (sense niar); una que no es tanca es queda
 *     tal qual, i la cerca seguix pel «<» de després;
 *   · CDATA i comentaris no tenen res d'especial: és un escàner d'etiquetes, no un analitzador XML.
 * Temps O(n) i memòria O(k) (k, les etiquetes): dos recorreguts que només avancen i, com a
 * expressions, dues tirades d'una sola classe (cap tornada enrere). La versió de d7aa77350 ja era
 * lineal; el valor d'este mòdul és el contracte aïllat i provat (senseNiatsLineal.test.js el
 * contrasta amb l'expressió i amb eixa versió, congelada a la prova). Al contrari que eixa versió,
 * desa totes les obertures, també les dels trossos que després lleva: en alguns casos és més lent
 * (sempre de mil·lisegons) i un tros ple d'obertures li costa la memòria que a ella un de tancaments.
 * `noms`: noms literals separats per «|» ([\w-]+, sense «:» ni «.»); un altre llança TypeError.
 */

/* Les tirades: un nom d'etiqueta (prefixos inclosos) i uns espais. Enganxoses (y) i d'una sola
   classe: no tornen mai enrere. */
const NOM = /[\w.:-]*/y;
const ESPAIS = /\s*/y;
const ESPAI = /^\s$/;
const NOM_LITERAL = /^[\w-]+$/;

/* On acaba, des de `des`, la tirada de `classe` en `text`. */
function finalDe(classe, text, des) {
  classe.lastIndex = des;
  classe.test(text);
  return classe.lastIndex;
}

export function senseNiatsLineal(text, noms) {
  const admesos = new Set(noms.split('|'));
  for (const nom of admesos) {
    if (!NOM_LITERAL.test(nom)) throw new TypeError(`senseNiatsLineal: «${nom}» no és un nom literal`);
  }
  /* 1r recorregut, cada «<» una sola vegada: els tancaments `</nom\s*>` de qualsevol nom (per nom
     i en ordre) i les obertures dels noms admesos que no s'autotanquen, amb el seu «>». `fi` és el
     primer «>» des de l'últim nom mirat: els «<» d'abans d'eixe «>» el compartixen. */
  const tancaments = new Map();
  const obertures = [];
  let fi = -1;
  for (let i = text.indexOf('<'); i >= 0; i = text.indexOf('<', i + 1)) {
    const tanca = text[i + 1] === '/';
    const inici = i + (tanca ? 2 : 1);
    const final = finalDe(NOM, text, inici);
    if (final === inici) continue;
    const nom = text.slice(inici, final);
    if (tanca) {
      const tancat = finalDe(ESPAIS, text, final);
      if (text[tancat] !== '>') continue;
      if (!tancaments.has(nom)) tancaments.set(nom, { llista: [], punter: 0 });
      tancaments.get(nom).llista.push([i, tancat + 1]);
      continue;
    }
    /* Sense prefix o amb un de no buit; els noms admesos no porten «:», i '' no n'és cap. */
    const dosPunts = nom.indexOf(':');
    if (dosPunts === 0 || !admesos.has(nom.slice(dosPunts + 1))) continue;
    if (text[final] !== '>' && !ESPAI.test(text[final] ?? '')) continue;
    if (fi < final) {
      fi = text.indexOf('>', final);
      /* Cap «>» més: cap obertura més, i cap tancament més (en porten un). */
      if (fi < 0) break;
    }
    if (fi === final || text[fi - 1] !== '/') obertures.push([i, nom, fi]);
  }
  /* 2n recorregut, les obertures en ordre: cada una fins al primer tancament del seu nom que
     comença després del seu «>». Les de dins d'un tros ja llevat no compten. Els punters de cada
     nom només avancen (els «>» de les obertures, tampoc no recula cap). */
  const trossos = [];
  let copiat = 0;
  for (const [inici, nom, fiObertura] of obertures) {
    if (inici < copiat) continue;
    const del = tancaments.get(nom);
    if (!del) continue;
    while (del.punter < del.llista.length && del.llista[del.punter][0] <= fiObertura) del.punter += 1;
    const tancament = del.llista[del.punter];
    if (!tancament) continue;
    trossos.push(text.slice(copiat, inici));
    copiat = tancament[1];
  }
  trossos.push(text.slice(copiat));
  return trossos.join('');
}
