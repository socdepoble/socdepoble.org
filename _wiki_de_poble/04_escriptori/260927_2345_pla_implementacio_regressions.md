# Pla d'Implementació: Regressions visuals de l'Arbre i Emoticones

## Objectius
Corregir l'alineació/emplenat del fons taronja als elements actius del menú lateral i substituir la icona estàndard per l'emoji de la ploma a la capçalera de les notes.

## T33: Fons Taronja complet a l'arbre de navegació
1. Inspeccionar el menú lateral (arbre de seccions) on es renderitzen els enllaços de «Mur», «Disseny», «Wiki de Poble», etc.
2. Comprovar la classe CSS que s'aplica a l'estat `.active` o `aria-current="page"`.
3. Al "Xat", el fons taronja ocupa tot l'ample del botó de navegació (100% fins al marge). En la resta de seccions, es queda curt o es pinta només el fons del text. 
4. Aplicar `width: 100%`, `display: block/flex` o la propietat CSS necessària als contenidors de les altres seccions perquè el comportament siga idèntic al del Xat.

## T34: Emoticona de la Ploma a la Capçalera de les Notes
1. A la vista on s'edita una nota o document (la targeta gran que diu «Sense títol» dalt del tot).
2. A l'esquerra del títol, actualment hi ha una icona (SVG). Aquesta icona s'ha de substituir per la representació gràfica d'un **emoticona** (emoji).
3. L'emoji per defecte que s'ha de pintar ací per a les notes és la **ploma (🪶)**, de manera que s'integre amb el sistema d'emoticones introduït en T23.
4. Assegurar que la mida de l'emoticona està proporcionada amb el text "Sense títol".

## Verificació
- Obrir cadascuna de les seccions al navegador i comprovar que l'element actiu té un fons taronja complet.
- Crear/obrir una nota i comprovar visualment que hi ha la 🪶 a l'esquerra del títol.
- Passar tots els lints i tests.
