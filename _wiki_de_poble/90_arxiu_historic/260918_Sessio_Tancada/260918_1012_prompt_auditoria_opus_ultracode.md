---
titol: "Prompt per a Claude: Auditoria Extrema V5 (Opus 5 Ultracode)"
descripcio: "Petorreta final per a Claude després d'esgotar la quota de Fable/Astra. L'objectiu és certificar la solidesa de la graella, el workspace i les connexions amb Notes/Perfil."
autor: "IAIA MarIA"
data_creacio: "2026-09-18"
estat: "esborrany"
tags:
  - prompt
  - consell
  - auditoria
  - claude
---
# Prompt per a Auditoria Extrema V5 (Claude Opus 5 Ultracode)

[INSTRUCCIÓ PRINCIPAL: Llig el frontmatter i aquest document sencer abans d'executar res. L'arquitectura és sagrada i estem a la fase final (Prova del Cotó Fluix).]

Hola, company Claude. Sóc el Mestre i vinc amb la IAIA MarIA. Hem esgotat completament el saldo del nostre auditor anterior (Fable/Astra) perquè ens ha fet una dissecció brutal on va trobar 9 defectes molt subtils de l'Optimistic UI, condicions de cursa i React Portability. Ara que tenim quota d'Opus 5 Ultracode, recorrem a tu per donar l'estocada final i garantir que l'arquitectura està perfecta.

Ací tens l'historial del que acabem de solucionar a fons hui mateix:

1. **(P1) IDs de Perfil:** `creaOrg` (PerfilShell) ara retorna `{ id: org.id + "-nom" }`, l'ID que l'UniversalWorkspace realment espera, evitant penjar el sistema en seleccions inexistents.
2. **(P1) Carpetes vs Etiquetes en Notes:** UniversalWorkspace ara injecta correctament el `groupId` als objectes aplanats de `navigationGroups`. Així, `NotesSection` pot saber si un ID és una carpeta, una etiqueta o una categoria, sense enviar tot per defecte com a `folderId`.
3. **(P1) Fantasmes de Text Antic:** Hem modificat `NotesDataContext.jsx` perquè `updateNote` reescriga la nota en la llista mestra `payload.notes` de la memòria local després de guardar. Així, quan es netegen els "local overrides" asíncrons de l'editor, ja no es recupera el text antic i desfasat.
4. **(P2) Serialització del Debounce:** A `NotesContext`, la cua d'autoguardat de 600ms ara empra cadenes de Promeses per `noteId` (`noteLocks`), impedint que dues edicions sobre la mateixa nota envien peticions superposades amb la mateixa `expectedRevision`.
5. **(P2) Selecció Post-Creació:** L'UniversalWorkspace ara incrementa el `createGenerationRef` no només en canviar de categoria, sinó també en canviar d'`activeItemId`. D'esta manera, si l'usuari clica un altre element mentre s'està creant el nou, el procés asíncron respecta la tria humana i no l'atropella.
6. **(P2) Neteja i Desmuntatge:** Hem assegurat que l'efecte de desmuntatge de `NotesContext` rebutge activament les promeses pendents de la `saveQueue`.
7. **(P2) Trampa de Focus en Tauleta:** Quan l'app està en `mida === 'mitja'` i se selecciona una categoria, el focus viatja correctament cap als items en compte de quedar-se atrapat en una columna invisible (`aria-hidden`).
8. **(P2) Portabilitat React (Side-effects i Strict Mode):** Hem tret l'escriptura a `localStorage` de l'actualitzador d'estat d'AppGridShell i l'hem duta a un efecte pur. També hem assegurat la reinicialització de `mountedRef` en l'UniversalWorkspace per tolerar muntatges dobles (Strict Mode).

## La teua Missió: L'Auditoria Definitiva (10/10)

Eres l'auditor de més alt rang que tenim disponible ara mateix. Volem que apliques tot el teu poder de deducció (Ultracode) al codi complet del repositori.

Necessite saber:
1. Ens queda alguna via d'aigua asíncrona oculta? (Escapaments de memòria, condicions de cursa remotes, efectes secundaris impurs...).
2. Podem declarar la integració amb l'adaptador de Sollutia completament blindada i donar-li per fi el **10/10**?

Fes l'auditoria extrema sense modificar el codi. Només busquem defectes, o la certificació d'excel·lència definitiva.
