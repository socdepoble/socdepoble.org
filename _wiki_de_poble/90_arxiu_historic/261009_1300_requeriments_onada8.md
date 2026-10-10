# Requeriments pendents (Onada 8 / Refinament)

Aquest document recull les instruccions que ha deixat el Mestre en els àudios de les 12:51, preparades per a la pròxima onada d'implementació.

## 1. Optimització de Logotips i Neteja
- **De SVG a PNG**: Els logotips s'han de passar de SVG a PNG de 256 píxels per optimitzar el sistema i estalviar pes de manera transversal.
- **Neteja de fantasmes**: Cal buscar i eliminar DIVs inútils o "fantasmes" que ja no valen per a res. Optimització a tots els nivells.

## 2. Targetes (Universal Card) completes
- Les targetes del Panell de Control i del Mur no poden perdre elements. Han de ser autèntiques **Universal Cards**.
- Concretament, les targetes de "Consola Termodinàmica", "El Cervell" i "Panell de Disseny" (que són pàgines, no plugins) **han de tindre el botó de "Connectar"**.
- Aquestes 3 targetes han de tindre data de publicació **8, 9 i 10 de setembre** respectivament, perquè queden al final del mur.

## 3. Lògica de Navegació (Boina Taronja i Xat)
- **La Boina Taronja (Capçalera d'usuari)**: Quan es fa clic a qualsevol boina taronja (ex. *Sóc de Poble La Torre de les Maçanes*), **sempre** ha de portar al **Perfil de l'Usuari**, MAI a la pàgina del "Projecte" ni directament al xat.
- **L'accés al Xat**: Només s'hi accedeix quan es prem la icona de "Comentar" (la bafarada) i es tria "En privat". Això obri el xat amb l'autor d'eixa publicació per poder parlar amb ell, encara que no el conegues.

## 4. Correcció de la Lògica de les Targetes (Zero Excepcions)
- Tota targeta (`Universal Card`) té una **Boina Taronja**. Clicar a la boina taronja **SEMPRE** porta al perfil de l'autor/entitat d'eixa targeta. Mai porta al xat ni a cap altre lloc.
- Per entrar al xat de l'entitat de la targeta (ex. 'Gent de la Torre'), s'ha d'afegir un botó gran que ocupe de part a part (estil el botó blau de "Publicar al Mur") dins de la mateixa targeta que diga "Anar al xat".
- Clicar a la resta de la targeta (el cos) porta a la pàgina principal d'eixe element. Això uniformitza tot el sistema.

## 5. Panell de Superadministrador (Per al Mestre)
- El Mestre demana planificar un "Panell de Superadministrador" on puga gestionar manualment etiquetes, categories i el codi CSS sense dependre de peticions a la IA. Aquesta part pot quedar per a l'Onada 9, però s'ha de dissenyar una proposta.

## 6. Drets d'Autor: Llicència de Wikipedia i Wikimedia
- A la pàgina de **Drets d'Autor** s'ha d'afegir una explicació clara sobre la llicència de Wikipedia i com l'aprofitem.
- **El flux a documentar**: Cal explicar que, quan una persona es registra des d'un poble que encara no tenim a la base de dades, el sistema agafa 3 imatges i el text d'introducció de Wikipedia per crear automàticament la Targeta del Poble. Gràcies a aquesta llicència lliure, l'usuari pioner pot començar a comunicar-se amb la gent del seu poble de forma immediata.
