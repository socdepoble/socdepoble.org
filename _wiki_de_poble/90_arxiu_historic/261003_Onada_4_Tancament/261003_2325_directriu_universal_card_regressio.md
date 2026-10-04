---
type: document
status: actiu
description: Directriu sobre la regressió visual de l'UniversalCard (Quadrat 92x92)
---
# Directriu: Regressió a l'UniversalCard (Quadrat 92x92)

##### La Visió de l'UniversalCard Autèntica
El Mestre ha proporcionat una captura de la targeta del Mercat ("Samarreta Sóc de Poble"). Esta targeta sí que representa l'**autèntica UniversalCard** que exigim per al Panell de Control: conté el títol, el subtítol, l'entradilla descriptiva, les etiquetes i la línia d'autoria. Aquest és el cànon.

##### Regressió Detectada a l'Indicador (Preu/Icona)
Hi ha un defecte visual a corregir. Actualment, l'indicador principal que apareix a la dreta del títol (per exemple, el preu "15.00€" o icones com "cotxe compartit" o "animals") es mostra com una píndola blava redoneta.
El Mestre ha confirmat que això és una regressió. El disseny original exigia que aquest element fóra un **quadrat gran de 92x92 píxels**.

##### Ordre per a Claude
1. En la implementació de l'UniversalCard per al Panell de Control (i a qualsevol altre lloc on s'aplique), **restituïx el quadrat de 92x92 píxels** per a l'indicador principal (preu/icona).
2. Assegura't que l'anatomia de la targeta respecta estrictament este disseny autèntic.

##### Investigació Tècnica (IAIA MarIA)
He auditat el codi font d'`UniversalCard.jsx`. La targeta suporta dos props distints per a l'indicador lateral dret:
- `price="15.00€"`: Renderitza `<p className="sp-card-price">`, que resulta en la píndola menuda.
- `squareBadge={{ type: 'price', value: '15.00€' }}`: Renderitza el `SquareBadge` (el quadrat original de 92x92 píxels).

##### Confirmació del Mestre: Mida i Disseny (Color Fosc)
1. **Mida (128x128 px):** El Mestre confirma que la mida de 128x128 píxels (la que fas servir a l'Aplec) és l'**òptima i el cànon definitiu**. Aplica-la tant a les dates com als preus. 
2. **Color de fons (Resiliència visual):** El Mestre demana un canvi de disseny per a l'indicador quadrat (`.sp-card-calendar-badge`). El color crema clar actual no destaca prou. **Ordre:** Canvia el fons del quadrat a un **gris molt fosc** (el mateix to fosc que s'empra per al fons de la barra lateral esquerra de navegació de l'app, per exemple, el token pertinent del sistema Pedra Seca) amb el text en contrast clar/blanc. Açò li donarà molta més força visual i contundència.

**Solució per a la 6a Passada:** Quan passes l'UniversalCard del Panell a `squareBadge`, assegura't de modificar també el CSS pertinent perquè tots els quadrats (preus, dates, etc.) agafen eixe gris fosc potent de les barres.

##### Confirmació del Mestre 2: Anatomia Completa (Boina i Peu)
El Mestre acaba de revisar el teu intent d'amagar el peu (`!ambPortes`) i de simplificar la targeta. 
**Missatge del Mestre:** *"S'està complicant la vida innecessàriament. Al Mur té la solució. Les targetes del Panell SÓN pàgines autèntiques. Han de ser iguals: amb la 'boina taronja' dalt (autor, data) i el peu blau baix (Traduir, Compartir, Comentar)."*

**Ordre estricta per a la 6a Passada (UniversalCard.jsx i ControlSection):**
1. **Restaura el Peu:** Elimina la condició `!ambPortes` que has posat al `<CardFooter>`. El peu amb les accions S'HA DE MOSTRAR sempre que pertoque, tinga portes o no.
2. **Capçalera (Boina Taronja):** Assegura't que les targetes del Panell de Control reben les props necessàries (`author="Sóc de Poble"`, `location="La Torre de les Maçanes"`, `time`, etc.) perquè es pinte la capçalera taronja dalt, exactament igual que al Mur.
3. **L'única variació** permesa per a les targetes amb portes és precisament eixa: que en lloc de l'enllaç global tenen els dos botons al cos, i no tenen etiquetes. **La graella i l'anatomia exterior (capçalera i peu) són sagrades i no s'han d'inventar.**

##### Confirmació del Mestre 3: Tipografia i Regressió de l'H3 (Subratllat)
El Mestre ha detectat una regressió tipogràfica en els títols de les UniversalCard del Panell i fa una puntualització sobre l'accessibilitat:
1. **El filete del títol (Subratllat de l'H3):** El títol de les UniversalCard normals (que actuen com a H3) solia tindre un "filete" súper fi inferior que anava de punta a punta i l'emmarcava (el `border-bottom` definit al `base.css` per a l'H3). Les noves targetes del Panell han perdut eixe filete (probablement perquè les passes com a H4 o per algun canvi recent). **Restaura eixe filete inferior per al títol de la targeta** perquè dóna presència al text.
2. **Accessibilitat (Públic major):** L'H3 es veu molt xicotet. Atés que els usuaris finals de l'aplicació són persones majors (veïnat del poble) que no volen fer zoom, les mides dels encapçalaments (H1 fins a H6) estan massa ajustades. **Puja un punt l'escala tipogràfica general dels encapçalaments** al CSS canònic per garantir una lectura còmoda sense esforç a les pantalles mòbils.

##### Confirmació del Mestre 4: Anatomia de la UniversalPage (La pàgina explicativa)
El Mestre ha revisat la pàgina `/page/publicar_mur` (i per extensió, totes les pàgines explicatives d'estes 6 utilitats) i ordena dos ajustos de disseny per a quan la dissenyes o retoques:
1. **Llevar les etiquetes (tags):** Estes pàgines no necessiten les etiquetes ("Sistema", "Mur", etc.) sota el títol perquè són pàgines estàtiques explicatives d'acció. Elimina-les (passa array buit o cap a la prop).
2. **El Gran Botó d'Acció:** Atés que l'usuari ja és DINS de la pàgina on se li explica què passarà si publica, la pàgina requereix tindre **el botó d'acció més gran possible (blau sencer)** sota del tot del text (per exemple, un botó massiu de "Publicar", centrat o a l'ample total). D'aquesta manera, l'usuari llig i acciona directament. Afig-lo a totes les UniversalPages de doble acció.
