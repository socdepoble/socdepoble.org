---
type: pla
status: actiu
description: Pla d'Implementació per a Claude
tags: [arquitectura, disseny, sollutia]
visibility: public
reflex: sdp:torn_168ee747-2bf8-460c-8daa-629508c2b5c6:36dce9ef-09cf-4c46-ae1a-b0a0142cc06e
---
# Pla d'Implementació (Sóc de Poble)

| Registre | Valor |
| --- | --- |
| Identificador | SDP-PLA-260925-1250 |
| Autor | IAIA MarIA (Agent Directe) |
| Entorn | Desenvolupament Local |

## Objectiu
Solucionar els detalls visuals pendents a la previsualització de les notes buides, reparar el deute tècnic acumulat a l'escriptori i establir l'arquitectura de connexió amb el backend de Sollutia (Autenticació i Identitat Lliure).

## Fases
1. **Solució Visual UniversalCard**: Reparar el component `NotaFitxa` per tal que, en estat buit (o notes sense títol), hereti completament el Subtítol i l'Entradilla per defecte en lloc de mostrar bots de línia `<br>`.
2. **Higiene de l'Escriptori**: Executar una revisió de `04_escriptori/` per fixar o arxivar els elements orfes (ESCRIPTORI_UNANCHORED i ORPHAN_OPERATIVE) detectats al tancament.
3. **Reparació de Tests**: Arreglar el test de `backend_consolidacio` (`CLAU_USUARI is not defined`) i el de `git-hooks.test.mjs`.
4. **Fortificació Sollutia**: Assentar l'arquitectura i integració de Supabase/Sollutia per permetre el Login d'usuaris (Forasters i Identitat Lliure).
5. **Reubicació de Metadades (Editor)**: 
   - Eliminar la barra superior grisa de selecció (Categories, Etiquetes, Llicència) completament, ja no té sentit.
   - Eliminar el botó "EDITAR" que apareix a la barra blava de l'editor (no té sentit perquè ja s'està editant).
   - Pujar la barra d'edició (blava) a la part superior absoluta.
   - **Icona d'estat/guardat:** La icona del costat de la data tindrà aquest comportament: per defecte serà una "ploma" que apareix quan s'edita i desapareix quan es guarda automàticament (indicador de guardat). Aquesta ploma no es mostra mai a la `UniversalCard`. Si l'usuari fa clic i tria una altra icona (info, perill, etc.), la icona es queda fixa i llavors sí que es mostra a la `UniversalCard`.
   - Crear una botonera de classificació **exactament a sota del Títol**. Tindrà tres botons: `Carpetes`, `Categories` i `Etiquetes`.
   - En fer clic en qualsevol d'aquests botons, s'obrirà una finestra/modal flotant (com la del disseny original) que permetrà: seleccionar les existents, crear-ne de noves, esborrar o canviar el nom.
   - **UI de Creació (Inspiració Obsidian):** Per a la creació de noves Carpetes, Categories o Etiquetes, el disseny ha de ser còmode i integrat (similar a com es creen els grups a Obsidian). Ha d'haver-hi un camp de text (`input`) on escriure el nom i, just al costat (en la mateixa línia), un selector d'icones i de color. Així, l'usuari tria l'aspecte i el nom en un sol pas.
   - **Regla d'Orfandat (Restricció):** El sistema ha de garantir que sempre hi hagi com a mínim 1 Carpeta i 1 Categoria assignada. L'usuari no les pot esborrar totes; si vol buidar-ho, haurà de deixar-ne una de "General". Les etiquetes sí que poden estar buides.
   - Ubicar la Llicència just **a sota de la botonera de Carpetes/Categories/Etiquetes**. Aquesta llicència també serà un botó que obrirà una **finestra modal explicativa** on es detallaran les opcions (Creative Commons, Tots els drets reservats, etc.). 
   - S'ha d'incloure una opció de "Camp Lliure / Personalitzat". Si l'usuari tria aquesta opció, podrà escriure el text que vulga lliurement. **Restriccions importants:** Aquest text lliure estarà limitat a un màxim de 180 caràcters. A més, a l'hora de mostrar-lo a la targeta (UniversalCard), ha d'estar restringit visualment a **una sola línia** (amb punts suspensius si fa falta) perquè no trenque el disseny ni la gent ho utilitze per escriure una bíblia. També hi haurà l'opció "Cap" per ocultar el component completament.
6. **Millores d'Usabilitat**: Corregir el trencament visual de les targetes (`UniversalCard`) amb títols de paraules llargues (aplicant `word-break`) i permetre desplegar les carpetes del Sidebar clicant a qualsevol part del botó (no només la fletxa).
7. **Motor IA i Eines de Gestió**: 
   - Dissenyar i planificar un Panell de Control de Consum IA.
   - Reparar l'enrutament trencat de la Consola Termodinàmica.
   - Finalitzar i integrar l'històric `Mapa de mis agentes v0.1.html` aplicant el disseny de targetes (cards) actual de Panell de Control.
8. **Polir l'UI i el Zoom de l'Explorador del Cervell**: Actualment la interfície on es visualitza el graf (amb la targeta flotant on posa "Obrir document") no té l'estil visual de Sóc de Poble (Pedra Seca). Cal maquetar els botons perquè semblen botons i aplicar-hi les classes adequades. A més, s'han de resoldre dos errors tècnics de la vista del graf: **1) la rodeta del ratolí (scroll/zoom) no funciona** per a ampliar i reduir el graf. **2) El botó de 'Reprendre simulació' (les fletxes giratòries) dóna voltes sense parar i no fa res**; s'ha d'arreglar perquè tinga utilitat (reiniciar la força del graf) i s'ature, o en el pitjor dels casos, s'ha d'esborrar.
9. **Higiene del Graf d'Obsidian (TASCA OPCIONAL - DEPESA DE TOKENS)**: El graf actual mostra massa satèl·lits, nodes orfes i etiquetes per netejar. **MOLT IMPORTANT**: Aquesta fase té prioritat ínfima. SI i NOMÉS SI et sobren tokens després de lliurar tot el codi anterior (especialment l'Editor i el Panell de Consum), pots dedicar-te a unificar etiquetes i resoldre orfandats de la Wiki. Si preveus que esgotaràs el teu límit, salta't aquesta fase completament.
10. **Refinaments de Disseny Mòbil (Barra de navegació inferior)**: S'han detectat dos desajustos visuals al menú flotant inferior de l'App (Mobile):
    - **Cantons de la barra (border-radius):** El contenidor negre que agrupa els 5 icones no té la curvatura estàndard de la UI de Pedra Seca. Cal aplicar-hi la curvatura de píndola o la curvatura estàndard dels nostres botons/cards.
    - **Alineació visual del botó central (Roda dentada):** Com que el botó central d'opcions no té text a sota (a diferència de Xat, Mur, Mercat, Pobles), l'espai sembla desequilibrat. Per a compensar-ho, s'ha de fer que l'ícona de la roda dentada siga més gran (uns 5-6 píxeles més) i el seu fons blau (el cercle) també siga més gran (uns 3 píxeles més). Això li donarà presència de "botó d'acció central" i restaurarà l'equilibri visual.

## Alternatives
- Alternativa 1: Ignorar la UniversalCard i fer-ho a nivell de backend (no recomanat, trenca l'experiència visual instantània).
- Alternativa 2: Implementar l'autenticació primer abans de la neteja (perillós perquè el segell no es pot tancar en verd).

## Empatia
És molt fàcil de mantenir. Modificar només el `fallback` dins del component reactiu no afecta a les notes ja publicades i manté l'editor lliure de dependències.

## Auto-Verificació (Com podria fallar)
- Podria fallar si s'injecta codi HTML pur (`<br>`) en lloc del component de text als `TEXTOS_LLAVOR`.
- Podria fallar el test de hooks si la ruta absoluta als assets de la Wiki canvia.

[[00_index_escriptori]]
