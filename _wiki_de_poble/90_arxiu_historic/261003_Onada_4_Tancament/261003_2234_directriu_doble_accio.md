# Directriu: Targetes i Pàgines de Publicació (Doble Acció)

Aquesta directriu és d'obligat compliment per a la implementació de les **Targetes de Doble Acció** i qualsevol targeta de creació/publicació (Mercat, Calendari, etc.).

El Mestre ha donat instruccions clares sobre l'UX i l'arquitectura d'aquestes targetes:

1. **Format Universal Complet, no 'nano_cards':**
   - Les targetes de publicació no han de ser petites ni inventades; han de ser instàncies normals de la `UniversalCard` estàndard.
   - Encara que siguen més grans (i en càpien dues en lloc de quatre), això és exactament el que el Mestre vol. 
   - Han de tindre clarament visible què són i per a què serveixen, utilitzant tota l'anatomia: **títol, subtítol i entradilla**.

2. **Connexió targeta-pàgina:**
   - La pàgina de publicar és una `UniversalPage`. Per tant, la seua representació exterior ha de ser per força una `UniversalCard` completa.
   - Des de la targeta es podrà anar a la pàgina (Saber-ne més) o publicar directament.

3. **L'autoria ha de ser de `socdepoble`:**
   - La "boina taronja" (autoria) d'aquestes targetes de sistema **ha de ser l'entitat `socdepoble`**, NO la IAIA MarIA.
   - Això és crucial perquè, quan l'usuari faça clic en l'autor (excepte en la data/hora), ha d'anar al xat corporatiu de `socdepoble` per a rebre suport humà. La IA no pot donar resposta a totes les persones en eixe context d'ajuda oficial.
   - Per tant, les pàgines de destinació d'aquestes targetes estan fetes i signades per `socdepoble`.

4. **Estructura del Text de la Targeta (El Contingut):**
   Cada targeta ha de donar una explicació absolutament clara d'allò que passarà en eixa interacció i de la privacitat, sense lletra menuda. Exemple per a "Publicar al Mapa":
   - **H1 (Títol):** L'acció directa (ex: "Publicar al Mapa").
   - **H2 (Subtítol):** Una crida a l'acció amb to proper (ex: "Si tens coses que vols geolocalitzar, este és el lloc").
   - **Entradilla (Paràgraf):** Explicació funcional i de conseqüències (ex: "Per defecte esborrem la geolocalització i les dades EXIF de totes les teues fotos, però per a publicar al mapa cal donar autorització explícita i ser conscient que la teua foto es podrà localitzar des d'altres pàgines").
   Aquesta estructura de transparència rigorosa s'ha d'aplicar a **totes** les targetes de doble acció.

**Aplicació immediata:**
Qualsevol integració de `ControlSection.jsx` o les vistes de Doble Acció ha d'abandonar el concepte de targeta xicoteta/diferent i acollir-se a la `UniversalCard` massissa amb autoria `socdepoble`.
