---
type: acta
status: canonic
description: Acta de Tancament de Sessió on s'han iniciat les reparacions de l'auditoria i preparat l'escut contra fantasmes visuals.
---

# Acta Marmota — Reparacions Crítiques i Caça de Fantasmes

## Metadades
- **Data:** 26-09-18 06:26
- **Context previ:** S'han processat les auditories crítiques de Claude i Codex (que van donar un NO-GO inicial). La memòria del sistema ha arribat a 6GB i 138 artefactes, per la qual cosa procedim a destil·lar i netejar.

## Resum d'assoliments
Durant aquesta sessió intensa hem aconseguit tancar diverses portes en roig crítiques:

1. **S-01:** Hem permès l'origen `*.supabase.co` i restringit el `localhost` només a entorns de desenvolupament (`PedraSecaEmbed.jsx`).
2. **H-02:** Hem implementat un `TimeoutError` explícit al `request()` (`runtime.js`) de manera que les caigudes de xarxa als 12 segons llancen error propi i no deixen la UI "carregant" per a sempre.
3. **C-01:** L'estat `loading` del `CoreContentContext` ara es trasllada de forma fiable a la UI.
4. **S-09:** S'ha corregit el proveïdor de Notes (`NotesDataContext.jsx`) perquè envie sempre l'ID d'usuari (`getCurrentUser()?.id`) i no el *slug* del poble, evitant l'error 400 de PostgREST.
5. **D-01 (Parcial):** Hem injectat `searchText` al retorn de `mapejaFil` (`XatContext.jsx`) perquè el cercador global no esclate. Pendent aplicar a `SearchSection.jsx`.
6. **Prompts i Petorretas:** Hem preparat el terreny per a una nova onada d'auditories focalitzada en UI. Tenim el document de Macro Prompt actualitzat, i recentment hem generat `260918_0621_PROMPT_auditoria_minima.md` per a que el Claude Fable (bàsic) audite els "fantasmes" de disseny (línies blanques, -1px i capçaleres de 58px) acompanyat de captures de referència.

## Tasques pendents per a l'endemà (proper xat)
Ens hem aturat a la tasca 4 del pla inicial (`task.md`). L'endemà caldrà reprendre des d'ací:
- **D-01:** Acabar la protecció a `SearchSection.jsx`.
- **S-10:** Injecció de `config` a `adminListUsers` i pujada d'imatges.
- **Arquitectura i UI:** Arreglar els fantasmes visuals d'`UniversalWorkspace`, ajustant les capçaleres de 58px, i aplicant els marges de grups. Es comptarà amb l'informe d'auditoria que demanarà el Mestre.
- **Portes de Build i Manteniment:** Excloure directoris a `build_rag_index.mjs`, purgar restes al `.agents/ESTAT.md` i els scripts del tractor.

## Reflexió del temps i la IAIA MarIA
Cada cicle completat és una línia de codi que ens acosta més al poble. Hem destil·lat tot el coneixement útil, reduirem el context innecessari, i ens preparem per obrir els ulls completament lúcids en la propera conversa, a punt per extirpar els fantasmes definitivament.

Ancoratge de Seguretat: [[00_INDEX_Actes]] | [[00_INDEX_ESCRIPTORI]]
