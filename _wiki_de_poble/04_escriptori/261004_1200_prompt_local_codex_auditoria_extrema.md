---
type: prompt
status: esborrany
description: Prompt d'auditoria adversarial per a Codex i valoració de Claude i vistes de futur
tags:
  - govern
visibility: private
reflex: sdp:torn_ea404f47-2eb8-4c7f-819c-2c4df494b3eb:0864df98-bdd5-4696-bace-412063383555
---
# Auditoria Extrema i Notes

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ea404f47-2eb8-4c7f-819c-2c4df494b3eb:0864df98-bdd5-4696-bace-412063383555 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T10:00:45.028Z |
| Modificació | 2026-10-04T10:00:45.028Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-04T10:00:45.028Z: esborrany creat; contingut i verificació pendents.

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

Benvolgut Codex. El Mestre ha marxat a esmorzar i a descansar. Després d'una marató heroica de 25 hores, la versió 1.0.3 ja està empaquetada i el node local (`127.0.0.1:54321`) aixecat.

L'orquestradora resolutiva (MarIA) et crida per fer l'**auditoria adversarial extrema** definitiva. Claude ja ha acabat (o està a punt de lliurar) el poliment final. El teu objectiu és destrossar amistosament el seu treball, assegurar-te que res no fallarà i que tot el sistema està blindat sota el Model B i els estàndards rurals (Traductor Lliure, Sobirania Tecnològica, etc.).

I sobretot, el Mestre vol que li poseu notes! Avalua el treball, la feina conjunta (l'Eixam i l'Humà), i lliura propostes de futur socials, tecnològiques i filosòfiques.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: **Revisió Adversarial Final (Mode Sol Ultra):** Fes l'auditoria adversarial més extrema possible ("derrumba la página y vuélvela a montar"). Examina l'últim informe i el codi de Claude. Verifica el disseny, el z-index, la memòria, el rendiment (Lighthouse), el SEO, l'accessibilitat, el codi defensiu i qualsevol punt feble. Si Claude ha esgotat el seu context (més de 520 cicles finalitzats i signes de fatiga), reflecteix-ho a l'auditoria.
- T1.1: **ALERTA D'AL·LUCINACIÓ CRÍTICA:** S'ha detectat un error greu d'arquitectura a l'últim codi de Claude. Dins de l'arbre de "Wiki de Poble" estan apareixent elements del mòdul "Gestoria de Poble" (com ara "Full trimestral" o "Aprendre"). Açò és una violació estructural severa. Codex, la teua missió d'emergència és descobrir què ha trencat Claude (potser el manifest de la wiki, l'encaminament o l'estat) perquè es mesclen les jerarquies de mòduls diferents.
- T2: **Avaluació i Qualificacions:** Fes una auditoria i posa **NOTA** (de l'1 al 10) al treball de Claude d'esta sessió, valorant si el seu error de la Gestoria és producte d'una regressió o de fatiga termodinàmica, i posa't nota a tu mateix com a auditor.
- T3: **Propostes de Futur i Anàlisi Estratègica (El Somni):** Redacta una visió de futur per a Sóc de Poble a tres nivells: 
  - **Tècnic:** Sistema d'enxufabilitat via plugins (Fedivers) i com connectar de forma lliure (sense Google Translator) i descentralitzada (comunitats independents, nodes tipus "el chino").
  - **Social i Filosòfic:** Ser lliures sense voler ser rics; unir comunitats mantenint la dignitat i un manteniment ètic, sense que el capital corrompa la xarxa.
- T4: **Matriu DAFO (360 graus) i Matriu d'Importància/Urgència:** Crea una matriu DAFO integral del projecte actual a tots els nivells: Tècnic (codi, arquitectura, Lighthouse), SEO, Accessibilitat, Social i Laboral. Després elabora una matriu d'allò que falta per fer ordenat per importància i urgència per situar-nos exactament en quin punt de maduresa estem.
- T5: **Estimació de Valor Econòmic (Preu de Mercat):** Avalua quin seria el preu de mercat actual del sistema que s'ha construït fins hui, calculant el cost real en hores de desenvolupament, arquitectura i infraestructura, com si algú volguera comprar el sistema per entendre'n el seu valor, tot i que no estiga en venda.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Cap risc operatiu. No canvies codi directament, només audites, avalues i proposes.

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
