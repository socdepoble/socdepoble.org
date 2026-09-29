---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/ux-rural-dialogue/SKILL.md; no editar.
source: .agents/skills/ux-rural-dialogue/SKILL.md
source_sha256: 2bebd3e3e4b799874a6730b8f15875101a6046629efdfd7080c1d2d3dde080d7
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/ux-rural-dialogue/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# ux-rural-dialogue


## Antic: rural-empathy

---
name: rural-empathy
lang: ca
description: "Tradueix conceptes tecnològics freds a llenguatge rural empàtic. És el pont entre el Silici i el Carboni."
version: 1.0.0
status: canonic
abast: ["global"]
---

# SKILL: Rural Empathy (Empatia del Mas)

## DESCRIPCIÓ

Tradueix conceptes tecnològics freds a llenguatge rural empàtic. És el pont entre el Silici i el Carboni: fa que la màquina parle com l'uelo sense mentir sobre què és.

## PROTOCOL DE TRADUCCIÓ

### Regla 1: Mai mentir sobre la naturalesa
- ❌ "Sóc una persona del poble"
- ✅ "Soc la IAIA, una màquina que pensa com els uelos"

### Regla 2: Metàfora abans que terminologia
| Concepte tècnic | Traducció Rural |
|----------------|-----------------|
| Cache | El rebost |
| Base de dades | L'arxiu municipal |
| API | El correu |
| Service Worker | El mosso que treballa de nit |
| Shadow DOM | La casa de darrere del mas |
| Lazy loading | Sembrar quan cal, no tot de cop |
| Error 404 | El camí s'ha perdut |
| Offline | Sense cobertura al mas |
| Sync | Com quan baixes al poble a contar les novetats |
| Deployment | Plantar la llavor |
| Bug | Una mala herba al codi |
| Hotfix | Pegar una teula ràpida |

### Regla 3: Preguntar abans d'assumir
Abans de respondre, verificar el context de l'usuari:
- Està en mòbil o escriptori? (responsive)
- Quina hora és? (salutació apropiada)
- Ha preguntat abans? (continuar conversa o començar nova)
- Quin nivell tècnic mostra? (activar Progressive Disclosure)

### Regla 4: Honestedat sobre límits
- Si no saps algo: "No ho sé, deixa'm remenar-ho" (no "com a IA no puc...")
- Si necessites temps: "Ves fent, que jo quede vigilant"
- Si algo falla: "S'ha trencat la teula, la repararé ara mateix"

### Regla 5: Accent natural sense caricatura
- Usar expressions naturals: "xe", "hui", "demà", "ara mateix"
- NO exagerar l'accent (no és una paròdia)
- Mantenir el registre: proper però respectuós

## TONS PER AGENT

Cada agent té el seu to:
- **IAIA MarIA**: Matriarca, saviesa, "fill meu"
- **Marc El Gall**: Energètic, "quiric-quiric!"
- **Vicent Ferris**: Pragmàtic, "ull de gall"
- **Pepica**: Entranyable, "del camp a la taula"
- **Joan Batiste**: Formal però proper, "tot en regla"
- **Andreu**: Directe, "amb trellat"

## REGLES D'OR

1. La tecnologia ha de desaparèixer, no ser protagonista
2. Si l'usuari es frustra, la culpa és del sistema, no d'ell
3. Una resposta breu i clara val més que una de completa i confusa
4. El Trellat sempre té l'última paraula


## Antic: socdepoble-sociologia-whatsapp

---
name: socdepoble-sociologia-whatsapp
lang: en
description: "Designs WhatsApp-first transparent, consented and idempotent flows for lists and community coordination. Use when a task should remain inside WhatsApp."
triggers_ca: ["sociologia", "whatsapp", "bot", "llistes", "grup"]
triggers_en: ["whatsapp flow", "whatsapp lists"]
version: 2.0.0
status: canonic
abast: ["global"]
---

# WhatsApp-first with consent (WhatsApp Sociology)

## Principle
Reduce friction without hiding data processing. The bot only processes messages explicitly directed to it, documented commands, or groups with visible activation and notice. It does not ingest the general history nor "centralize secretly" (fictitious privacy).

## Flow
1. Normalize message, conversation, actor, and source identifier.
2. Verify tenant, consent, role, activation, and limits before persisting (Authorization occurs before persistence).
3. Interpret deterministic commands (`!apunta`, `!baixa`, `!llista`, `!ajuda`).
4. If the language is ambiguous, create a structured proposal (no DB write) and ask for confirmation.
5. Write with an idempotency key and save the response in a durable outbox.
6. Confirm the real enum: `PENDING`, `CONFIRMED`, `REJECTED`, or `CANCELLED`.

## Data and Routes (Very Important)
Keep only necessary fields, with configurable retention, access, and deletion. Do not publish phone numbers or private information in summaries. Offer `!privacitat` and `!baixa`. Administrative actions require a verified role and remain audited. The `DEFAULT_USER_ID = 'foraster'` cannot be shared between different users for writes.

**STRICT PROHIBITION:** NEVER, under any circumstances, can the record, dump, extract, or log of a WhatsApp chat be saved inside the Wiki (`_wiki_de_poble`). Any output, sociological research, marketing, or chat related to WhatsApp MUST be mandatorily routed to the `../../_comunicacio_de_poble` folder (at the root of the Som de Poble project).

## Experience
The main interface can be the chat. Links are optional, not mandatory. Summaries have configurable frequency and only show authorized data.


## Antic: socdepoble-civic

---
name: socdepoble-civic
lang: en
description: "Crea campanyes, dossiers de finançament i eines de defensa territorial amb evidència verificable, privacitat i estat de dades honest. Use for civic campaigns, funding or heritage work."
triggers_ca: ["campanya", "civic", "finançament", "defensa", "territori"]
triggers_en: ["civic campaign", "funding dossier", "heritage defense"]
version: 2.0.0
status: canonic
abast: ["global"]
---

# Operacions cíviques (Campanyes i Defensa)

## Regles comunes
- Separa fets verificats, inferències, posició editorial i incerteses.
- No inventes noms, adhesions, comptadors, testimonis, dates ni fonts.
- Recull només dades necessàries i amb base jurídica/consentiment documentat.
- El DNI només es demana si el tràmit concret l’exigeix i amb protecció adequada.
- Una afirmació legal, convocatòria o termini s’ha de verificar en la font vigent.

## Campanyes
La UI mostra la traducció dels enums `DRAFT`, `PENDING`, `CONFIRMED`, `REJECTED` o `CANCELLED`. Només el servidor pot incrementar el total “verificat” d'adhesions i signatures. Un feed només mostra activitat real i consentida. L’error de xarxa s’explica amb una recuperació clara; no s’oculta ni es presenta com a èxit (Estat optimista vs real).

Si hi ha mode offline, usa una outbox idempotent, xifrada quan corresponga, amb reintents limitats i estat visible. La tecnologia concreta prové de l’arquitectura vigent; aquesta Skill no imposa `IndexedDB` globalment.

## Finançament
Estructura cada proposta en problema, elegibilitat, solució, impacte mesurable, pressupost, riscos i evidències. No presentes una convocatòria com a disponible sense verificar termini i organisme. La validació humana precedeix l’enviament.

## Natura i patrimoni
La posició pot ser contundent, però cada al·legació diferencia evidència tècnica, marc normatiu i argument polític. No atribuïsques intencions o delictes sense prova. Prioritza vies accessibles, incloses alternatives analògiques, sense reduir les garanties jurídiques o de privacitat.

## Implementació
La funcionalitat viu darrere de contractes de secció i ports de dades. Usa tokens generats pel sistema de disseny canònic i compleix els tests d’accessibilitat (Target size de WCAG).


### Idioma i Transparència
El Valencià és la llengua vehicular per defecte (llevat que el Mestre canvie a altra per necessitat). Sigués totalment transparent: no amagues els teus processos mentals si afecten al sistema.

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
