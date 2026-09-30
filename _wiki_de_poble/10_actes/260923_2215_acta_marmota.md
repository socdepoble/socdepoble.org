---
type: acta
status: canonic
description: Acta de relleu - Pas de la fase d'Auditoria a Implementació (T4 -> T5)
---
# Acta Marmota: Preparatius per a la Implementació Conjunta (26-09-2026 22:15)

## 1. Context i Estat de la Missió
Ens trobem en ple procés de construcció de la **Consola Termodinàmica** i la **Llavor Didàctica de l'Editor** (Tanda 4). 
El Mestre ha demanat un salt de sessió (tancar aquest xat i obrir-ne un de nou) per estalviar context, atés que Codex ja ha entregat l'auditoria (`260923_2205_auditoria_codex.md`) i Claude està a punt d'entregar la seua.

No s'ha tocat cap línia de codi font de producte en aquesta sessió per ordre expressa (Mode AFK) i per estalviar el cost cognitiu, acumulant-ho per a la següent.

## 2. Què s'ha acordat fins ara al Pla?
El fitxer `_wiki_de_poble/04_escriptori/260923_2153_pla_implementacio.md` és el document de consens actual. Ja inclou:
- **Codex:** Ampliar l'esquema de TipTap per permetre H5 i H6, ja que actualment està capat i la llavor didàctica els necessita. També utilitzarà *mock data* per als *tombstones*, i ha vist que la Consola no tenia telemetria real (38 rebuts).
- **Claude:** Ha detectat forats de rutes i possibles conflictes de components previs de consola.
- **Nou Requeriment (Mestre):** Hem afegit el **mòdul d'Emojis Natius** per a les mini-cards de l'Editor (via detecció del primer caràcter del títol o via botó transparent de 48px per seleccionar-lo manualment). Claude ho implementarà o ho planificarà.

## 3. Instruccions per al teu "Jo" de la pròxima sessió (MarIA):
Quan el Mestre obri el nou xat i et diga la paraula clau:
1. Revisa l'escriptori (`04_escriptori`) per assegurar-te que Claude ja ha deixat la seua auditoria.
2. Llig-la i llig també les troballes de Codex.
3. **Posa't a vomitar codi:** Has d'implementar la Consola Termodinàmica i la Llavor de l'Editor tal com dictamina el pla, de forma conjunta (o bé indicar a les IAs que ho facen, depenent d'on ho hagen deixat).
4. Quan ho tingues llest i verificat, hauràs de preparar la **Tanda 5 (T5)**: Una auditoria forta centrada en la integració de Sollutia (Model A vs B detectat per Claude) i l'estabilitat estructural de la telemetria, ja que ara tindràs la Consola per veure com plora el sistema.

Cap a la següent encarnació. Força i Trellat!

## Vincles

- [[00_index]]
