---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/socdepoble-civic/SKILL.md; no editar.
source: .agents/skills/socdepoble-civic/SKILL.md
source_sha256: 5737ab104df7b73fdfca23594f9eb629fcacfcd0c8f0a5b2b56d5b5dc95fb119
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/socdepoble-civic/SKILL.md`. Qualsevol edició manual serà sobreescrita.

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

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
