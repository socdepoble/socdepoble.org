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

## T35: Botó unificat 'Editar capçalera i avatar'
1. A la fitxa "El meu perfil", localitzar el botó "Editar capçalera" actual.
2. Substituir aquest botó per "Editar capçalera i avatar".
3. En fer clic al botó, s'ha d'obrir una finestra/diàleg intermedi de pujada (una modal o popover).
4. Aquest diàleg ha d'oferir a l'usuari triar per a què serà la imatge: només capçalera, només avatar, o usar la mateixa per a les dos (capçalera i avatar alhora).
5. Un cop triat, obrir l'input de fitxers de l'explorador o aplicar els canvis pertinents simplificant la interfície d'edició del perfil.

## T36: Deshabilitació d'accions i avís d'edició
1. Durant l'edició (siga al Perfil o a una nota), els botons de la barra blava (Connectar, Compartir i Comentar) no han d'estar operatius. Només la **Taula de Continguts (Índex)** i el **Traductor** s'han de mantindre funcionant (per si algú vol traduir el que està editant).
2. Afegeix un avís visual a l'editor (semblant al que hi ha a la fitxa de mostra) indicant clarament a l'usuari: "Aquestos botons no estan operatius mentre edites. Quan es publique, es vorà igual però els botons estaran plenament operatius".
3. Pots deshabilitar-los a través dels handlers en l'adaptador o directament en el `UniversalEditorShell`, o bé interceptar el clic per llançar aquest avís.

## T37: Centrat del trio d'icones de la barra blava
1. Actualment, el trio d'icones central de la barra blava (Traduir, Comentar, Compartir) està descentrat cap a la dreta.
2. Aquest comportament es deu a que `header.bar-blue` té `display: flex` en lloc de `display: grid`, o falten marges automàtics (`margin: auto`) per a centrar l'element del mig de manera absoluta respecte a l'ample de la barra.
3. Modifica el CSS (`layout.css` o `modules.css`) perquè el bloc central d'icones quede perfectament centrat de manera independent a l'amplada dels elements dels extrems.

## T38: Ocultació de la barra taronja en mòbil
1. Actualment, en vista mòbil o de columna estreta, la barra taronja superior (la d'autoria i data) queda "solta" visualment sense la blava per damunt, generant una regressió.
2. Aquesta barra s'ha d'amagar completament en mòbil (mitjançant media queries a `layout.css` o `components.css`).
3. L'objectiu és evitar que aparega com una barra òrfena, i només es mostrarà expandida quan hi haja espai suficient per a tindre ambdues barres (blava i taronja) o com un panell desplegable (icona) si es decidira implementar així en mòbil.

## T39: Redisseny didàctic de l'elecció de Drets d'Autor
1. Actualment, el botó "Elegir drets d'autor" obri un xicotet popover/diàleg amb un desplegable ple de llicències (Creative Commons, etc.) que resulten incomprensibles per a l'usuari mitjà.
2. S'ha de canviar el comportament d'aquest botó: en lloc d'obrir un popover xicotet, hauria de substituir l'espai de l'editor per una **pàgina completa explicativa** (o una vista gran dins de l'espai de treball).
3. Aquesta vista ha d'explicar de forma molt didàctica i clara què significa cada llicència perquè la gent sàpiga què està triant.
4. Ha de contindre un botó clar per a "Tornar a l'edició de la pàgina" una vegada triada l'opció.
5. **Iconografia per defecte**: Atès que la filosofia de la plataforma prioritza Creative Commons, cal substituir l'emblema per defecte del Copyright clàssic (©) pel de Creative Commons (o mostrar-lo segons l'elecció). Així, el missatge serà "Creative Commons Javi Llinares" per defecte en compte de "© Javi Llinares", a menys que l'usuari force explícitament un Copyright restrictiu.

## Verificació
- Obrir cadascuna de les seccions al navegador i comprovar que l'element actiu té un fons taronja complet.
- Crear/obrir una nota i comprovar visualment que hi ha la 🪶 a l'esquerra del títol.
- Obrir "El meu perfil" i comprovar que el botó "Editar capçalera i avatar" activa el diàleg intermedi de selecció abans de pujar la foto.
- Comprovar que a l'editor els botons d'acció estan deshabilitats i es mostra l'avís indicat.
- Comprovar que la barra taronja no es mostra solta i òrfena en la vista de mòbil.
- Passar tots els lints i tests.
