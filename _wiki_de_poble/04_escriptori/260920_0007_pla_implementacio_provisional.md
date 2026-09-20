# Pla d'Acció — Auditoria Estructural Reactiva (Onada E)

La IA Claude acaba de clavar-nos una mossa estructural meravellosa. L'informe de Claude confirma que **el nostre cervell (les regles de la Wiki) està caigut** (`matrix.mjs` falla amb exit 2) per culpa de la meua purga d'skills prèvia on vaig esborrar, sense adonar-me'n, la taula `PROTOCOLLEDGE` i he deixat índexs morts.

Claude ens recomana un pla d'atac molt clar dividit en 9 passos, començant per arreglar el cervell normatiu (la documentació i les regles) i acabant per reparar les fuites de memòria en React (els proveïdors sense memoitzar).

## Open Questions

Abans de començar a arreglar els problemes (Pas 1 al 9), Claude t'ha llançat unes incògnites fonamentals que només tu com a Mestre i Humà pots decidir:

1. **La Taula `PROTOCOLLEDGE` (P1):** La regla on dèiem quins documents usar per a quines tasques ha desaparegut perquè jo vaig esborrar l'arxiu. On vols que visca ara? 
   - **Opció A:** Tornar-la a escriure dins de `.agents/skills/skill-documentacio-i-reflex/SKILL.md` (La llei es pot llegir fàcilment).
   - **Opció B:** Convertir-la en un fitxer de dades `.agents/protocolledge.json` (Sobroviurà a futures reorganitzacions).

2. **El Mirall de Skills (P2):** La carpeta `_wiki_de_poble/02_saber/skills_mirror/` diu al seu README que es regenera automàticament, però està plena d'arxius morts. Volem que un script (hook) l'actualitze de veritat i que només servisca com a lectura passiva, oi?

3. **L'Autoritat (P3):** L'índex diu que `.agents/skills/` són les eines executables i `_wiki_de_poble/02_saber/protocols_tecnics/` són només "fitxes de coneixement". Però abans, el protocol enviava a algunes fitxes de coneixement com si foren instruccions. Com separem eixa línia? Les màquines només fem cas a `skills/`?

4. **El motor React vs Preact (P0):** Claude ha descobert que l'app està fent servir **Preact**, i ens avisa que tenim optimitzacions i trucs (com `<StrictMode>`) que en Preact estan emmascarant errors que trencarien l'aplicació si algun dia la llancem amb **React estàndard 18/19**. El projecte final ha de ser compatible 100% amb React o assumim Preact com a definitiu?

## Proposed Changes

Un cop em contestes aquests punts, executaré el full de ruta de Claude per aquest ordre:
1. Restaurar el `PROTOCOLLEDGE` on em digues i arreglar l'arxiu `matrix.mjs`.
2. Reconstruir l'índex `00_INDEX_SKILLS.md` i els miralls.
3. Arreglar els problemes de memoització als proveïdors `NotesContext` i `AppGridShell` (on es perden la majoria de recursos de l'iPad A10).
4. Substituir l'objecte global del `JSON.stringify` per una referència fraccionada (`scopeKey` i `useRef`).

## User Review Required

> [!WARNING]
> Espere les teues decisions sobre les 4 preguntes (PROTOCOLLEDGE, Mirall, Autoritat i Preact) per a donar llum verda a les tisores i reparar la base de dades i l'aplicació React segons l'auditoria.
