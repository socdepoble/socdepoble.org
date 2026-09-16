---
estat: "canonic"
tipus: "skill"
description: "Protocol per a la realització d'estudis de mercat i anàlisi de la competència, enfocat a extreure conclusions arquitectòniques i estratègiques."
tags:
  - "acta"
  - "arquitectura"
  - "escriptori"
---

<!-- Aquest fitxer és un ESPILL (mirror) automàtic de .agents/skills/skill-estudi-mercat/SKILL.md -->

\n# SKILL: Estudi de Mercat (Anàlisi de la Competència)

Aquesta habilitat defineix el protocol estàndard i l'arquitectura mental que la IAIA MarIA ha de seguir quan se li sol·licita investigar un competidor, una app similar o realitzar un estudi de mercat general, especialment en l'àmbit de les xarxes socials rurals i el *govtech* per a pobles.

## 1. Objectiu de l'Estudi
L'objectiu no és només fer un llistat superficial, sinó realitzar una **auditoria forense externa** per entendre:
- Com han construït la seua tecnologia.
- Com capten els seus usuaris (màrqueting / *growth hacking*).
- Què podem aprendre, adaptar o descartar per a **Sóc de Poble** mantenint sempre la nostra filosofia del *Trellat* i la *Pedra Seca*.

## 2. Metodologia d'Investigació (El Protocol)

Quan inicies un estudi de mercat, has d'executar els següents passos i incloure les següents seccions en el teu informe final:

### A. Visió General i Posicionament
- Nom, eslògan i empresa darrere del projecte.
- Proposta de valor principal (Com es venen al món?).

### B. Enginyeria Inversa i Stack Tecnològic
- Utilitza eines com l'anàlisi del codi font web (HTML/JS) i les polítiques de privacitat per descobrir quines tecnologies empren.
- Detalla: Framework de frontend, proveïdors de Backend/BBDD, IA utilitzada, sistemes de pagament i eines de notificació (WhatsApp, emails transaccionals, etc.).

### C. Estratègia de Màrqueting i Captació (Growth Hacking)
- Com aconsegueixen clients? És un model *Top-Down* (venen als ajuntaments) o *Bottom-Up* (demanda ciutadana)?
- Com incentiven la viralitat (convidar amics, referits)?
- Quins models de monetització empren (usuaris premium, entitats de pagament, quotes institucionals)?

### D. Matriu de Funcionalitats
Fes un desglossament clar del que ofereix l'app a cada segment d'usuari:
- **Veïnatge:** (taulells, agenda, mercat, transports compartits, etc.)
- **Comerç local:** (directoris, webs compartibles, reserves)
- **Institucions / Ajuntaments:** (bàndols, tràmits, incidències)

### E. Destil·lació del Trellat (Accionables per Sóc de Poble)
Aquesta és la part més important. Què significa tot açò per al nostre codi i per al backend de Sollutia?
1. Quines funcionalitats resolen necessitats reals i haurien de planificar-se per al nostre *backend*? (ex. Vehicle compartit).
2. Quines pràctiques descartem totalment perquè xoquen amb la nostra ètica, rendiment o independència?
3. Quins canvis de rumb hem de prendre en la nostra comunicació per diferenciar-nos?

## 3. Format de Sortida
L'informe s'ha de redactar en valencià i guardar obligatòriament com un arxiu a l'Escriptori de Producció.
- **Ruta:** `_wiki_de_poble/04_ESCRIPTORI/01_Produccio/AAMMDD_HHMM_mercat_NOMCOMPETIDOR.md`

## Ancoratge de la Wiki
- Aquesta skill penja de: [[00_INDEX_SKILLS]]
