---
type: prompt
status: esborrany
description: Petorreta adversarial a Codex sobre l'auditoria de Claude a la Gestoria
tags:
  - govern
visibility: private
reflex: sdp:torn_df26dc2b-31f8-4010-9fbc-4785f86d435c:3b740191-223c-4819-a094-7f0aed83fb10
---
# Auditoria adversarial a l'informe de Claude

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] Escriptori net i indexat
- [x] Pla d'Implementació generat si cal
- [x] Rebut obtingut

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_df26dc2b-31f8-4010-9fbc-4785f86d435c:3b740191-223c-4819-a094-7f0aed83fb10 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T17:49:13.516Z |
| Modificació | 2026-10-04T17:49:13.516Z |
| Propietari | codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | GPT-6.1 Sol Ultra |
| Tokens consumits | [en curs] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-04T17:49:13.516Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) del seu backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Hola, Codex (GPT-6.1 Sol Ultra). T'invoque com a auditor d'elit per a exercir una **auditoria adversarial** sobre el treball recent que ha fet Claude (el nostre altre agent local).

Claude acaba de fer una refactorització visual a la Gestoria per separar la barra lateral i fer la targeta universal, i acaba d'emetre aquest veredicte final sobre el seu propi treball:

> "No he trobat cap bloquejant en els canvis revisats.
> - La Sidebar conté els deu accessos i el rail interior desapareix.
> - Els nou mòduls financers conserven la mateixa instància de la closca i `useTauler`.
> - El segell de mòdul evita mostrar un detall o avís anterior durant la navegació.
> - Les guardes DEV i les dues importacions dinàmiques del pont es mantenen.
> - Aprendre i l’eixida del Full trimestral continuen desfent els seus panells privats, igual que abans.
> 
> Cal recompilar i empaquetar després d’esta passada: les entrades del manifest i les icones també modifiquen el bundle productiu.
> Revisió només de lectura; cap fitxer modificat."

**La teua missió:**
- No et fies d'ell. Has de buscar forats en eixa lògica. Què passa si les importacions dinàmiques es trenquen amb la nova Sidebar? Què vol dir que "el segell de mòdul evita mostrar un detall anterior"? Açò pot trencar la navegació entre mòduls si l'usuari fa enrere? I sobretot, mantindre la mateixa instància de la closca no causarà problemes d'estat (stale state) en canviar entre 9 mòduls financers?
- Sigues implacable. Troba l'angle mort. Si Claude diu "tot està bé", el teu treball és trobar què està a punt de petar.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Llig la revisió de Claude, analitza-la des d'una perspectiva de riscos estructurals de React, el router i el cicle de vida.
- T2: Escriu l'auditoria adversarial atacant cadascun dels punts amb possibles regressions que ell haja ignorat.
- T3: Proporciona l'avaluació de si convé seguir utilitzant aquest model o pujar de nivell d'intel·ligència, considerant que el cost és un 7% del model anterior i que l'auditoria requereix profunditat analítica.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Els canvis en la closca (`AppGridShell`) per a donar suport al rail exterior podrien causar regressions als formularis financers.
- Reutilitzar `useTauler` en 9 mòduls sense muntar components diferents podria filtrar dades financeres o deixar el panell detall penjat en un estat invàlid.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 0a847cfa9fd42c8e8f3461c1d752219d24178b0c12ed872a2c59e62f0b33a9b3. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
