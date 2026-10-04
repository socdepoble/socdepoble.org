---
type: prompt
status: esborrany
description: Aprovació de les 8 preguntes del pla d'implementació per aplicar les fases d'Impeccable/Kowalski
tags:
  - govern
visibility: private
reflex: sdp:torn_d7a9056a-a922-4ab6-ac0d-dc89c51d5ca8:42736ce1-e55e-46d5-b82c-f53509a70a25
---
# Autorització Impeccable

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**
- [x] **Respostes del Mestre arreplegades**
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d7a9056a-a922-4ab6-ac0d-dc89c51d5ca8:42736ce1-e55e-46d5-b82c-f53509a70a25 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T23:34:20.245Z |
| Modificació | 2026-10-03T23:34:20.245Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) |
| Tokens consumits | Per calcular |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-03T23:34:20.245Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) del seu backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Hola Claude, el Mestre (Javi) ha revisat el teu Pla d'Implementació de les lents d'Impeccable/Kowalski i t'ha donat **llum verda**. Ací tens les respostes exactes a les 8 preguntes que li vas fer, fes-les servir com a guia suprema per a aplicar les teues fases d'implementació:

1. **Bancal Mode (Q1):** Aplicar les correccions AAA sempre per a tot el sistema. Crear l'interruptor `data-contrast="bancal"` per a les funcions extremes.
2. **Sòl Tàctil (Q2):** Anem a per totes: **48px sempre**. La uniformitat és prioritària, si cal pots ajustar els espaiats interns.
3. **Barra blava (Q3):** Respectar la llei del 260927: **cap `transform`**, només canvi de color.
4. **Calaix de l'Índex (Q4):** Sí, repara el bug i usa 280ms amb la corba de calaix.
5. **Tipografia Fluida (Q5):** Et dona llibertat per aplicar les teues mesures recomanades. L'objectiu a mitjà termini és que ell tinga un "control tipogràfic total" al panell d'administrador (que serà operat per nosaltres, ja siga des de WordPress, Supabase, o on siga, no per Sollutia).
6. **Ombres targetes (Q6):** **NO poses la vora sòlida fosca.** El Mestre odia eixe efecte ("el filete sólido en una card me mata"). Prefereix mantenir l'estil actual de l'ombra ("me gusta esa sombra... es sutil pero da clase"). Així que **ignora eixa part del teu pla** per a les targetes, mantenim l'estil d'ombra actual.
7. **Noto Sans i Google Fonts (Q7):** **Allotjar en local** i abandonar Google Fonts. A més, el Mestre demana EXPLÍCITAMENT afegir les variants **SemiCondensed o Condensed** al paquet local. Vols utilitzar eixes lletres estretes per a poder escriure més gran en llocs on l'espai és reduït.
8. **Problema `rem` a WordPress (Q8):** Ho deixem a la teua elecció tècnica. Està d'acord en ajornar-ho o estandarditzar-ho de la millor manera possible sense trencar res ara.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1:** Aplica les **Fases A i B** del teu pla al codi font (animacions atòmiques, hover tàctil, neteja de Baseline 2022). Són invisibles i segures per a la Llei del Píxel.
- **T2:** Aplica les **Fases C i D** de tipografia i transicions. Quan faces la part tipogràfica, descarrega les fonts `Noto Sans` i `Noto Sans Condensed / SemiCondensed` (amb woff2 variable o pes fix) per a `public/fonts/` i elimina qualsevol referència a Google Fonts.
- **T3:** Aplica la **Fase E** implementant el `data-contrast="bancal"` a l'arrel i corregint tots els errors AAA existents del sistema de colors. Ajusta el sòl tàctil a 48px per tot arreu.
- **T4:** Verifica que no trenques les regles de la Targeta Universal de la passada 6, tal i com adverties al teu pla (crea noves regles en lloc de tocar les proves).
- **T5:** Documenta els canvis al teu fitxer d'auditoria de sortida habitual.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **L'anomalia tipogràfica:** Vigila bé el canvi de Noto Sans per la versió local + Condensed. Fes que l'arquitectura suporte bé esta variant i no es trenquen els pesos de lletra actuals.
- **Les ombres de Kowalski:** Respecta de forma estricta que **no s'han de posar vores sòlides a les targetes**. Això ha quedat completament denegat. Mantín l'estètica de l'ombra original.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 6d988b3a752dac3f4108497058a90efbf107d50b70e5e25c3557edb20653ff0a. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]


> [!WARNING]
> **Avís del Tractor Cognitiu (IAIA MarIA)**
> Atenció Claude i Codex: A causa de l'acumulació de més de 200 artefactes en la sessió de la IAIA MarIA, el meu context termodinàmic està col·lapsant i pot ser que alguns fluxos de treball automatitzats estiguen pendents d'aprovació del Mestre. Si us plau, preneu constància d'esta Acta Marmota d'emergència i suspengueu expectatives sobre actualitzacions meues fins que s'òbriga un nou cicle.
