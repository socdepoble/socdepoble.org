---
tipus: document
estat: esborrany
description: "🛡️ PETORRETA AL CONSELL: AUDITORIA TÈCNICA (Dola)"
---
# 🛡️ PETORRETA AL CONSELL: AUDITORIA TÈCNICA (Dola)

**Dictamen executiu**
L'auditoria del sistema `socdepoble.org` revela una arquitectura sòlida però detecta punts dèbils crítics al gestor de contingut i específicament a la pàgina legal. El problema central no és tècnic sinó estructural: el contingut està emmagatzemat com a HTML dins de cadenes JavaScript géants (`pageContent.js`), el que genera fragilitat, impossibilitat de manteniment i riscos de desalineació legal.

## Punts febles estructurals
1. **El problema del `pageContent.js`**: Fitxer de 119,630 bytes en només 134 línies. Riscos sintàctics greus. S'ha detectat que la clau `"style"` apareix 3 vegades dins de `PAGE_COPY`, sobreescrivint-se.
2. **`TextSection.jsx` (dades hardcodejades)**: L'objecte `page` conté un camp `date`, però s'ignora completament. Es mostren la mateixa data i hora (20/08/26 22:28) per a totes les pàgines de text.
3. **CSS monolític**: `index.css` de 122KB, sense purga automàtica.
4. **Cobertura de tests**: Només 3 fitxers de test.

## Diagnòstic Específic: Pàgina Legal
1. **Contradicció Online-First vs Online-First**: S'afirma visió Online-First però les dades s'allotgen en servidors (Supabase/Sollutia). Genera riscos RGPD en crear falses expectatives.
2. **Identitat del titular**: S'indica "Fco. Javier Llinares García" però s'ha d'indicar "Associació ecologista El Rentonar i Sóc de Poble".
3. **Contingut truncat**: La secció de Drets ARCO es talla a la meitat: `"Pots sol·licitar l'exercici d'aquests drets dirigint un correu a <st"`.
4. **Recursos no verificats**: `/assets/cc-by-nc-sa.svg` i `/assets/uploads/brain/llibre_anima_cover_1776032370908.png` podrien no existir.

## Millores Proposades
### Prioritat Alta
- Solució 1: Extreure el contingut legal a fitxers Markdown.
- Solució 2: Corregir `TextSection.jsx` per usar `page.date` en lloc de dates fixes.
- Solució 3: Unificar identitat legal (Associació El Rentonar).
- Solució 4: Alinear el missatge de "Sobirania de Dades" a Online-First.

### Prioritat Mitjana
- Refactoritzar `pageContent.js` sencer en Markdown.
- Integrar purga CSS.
- Eliminar dependències mortes (com preact, si cal).
- Ampliar tests.

## Accions Reversibles (Fase 1)
- Corregir dates hardcodejades a `TextSection.jsx`.
- Reparar el contingut truncat de Drets ARCO.
- Actualitzar identitat del titular i alinear missatge Online-First.
- Verificar existència d'imatges legals.
- Refactoritzar contingut a Markdown (o JS separat).
