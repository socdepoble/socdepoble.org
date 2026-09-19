---
type: petorreta
status: esborrany
description: Petorreta per a Codex i Claude per auditar i atacar el Bloc B (P1s restants) després d'adobar els P0 de Sollutia.
---

# Petorreta — Auditoria Bloc B i Troballes de Codex

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 13:26 |
| Modificació | 26-09-19 13:26 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260919_1300_estudi_codex_seguretat_sollutia.md]] (L'informe exhaustiu recent)

## Context Històric i Identitat (Qui som i Per a què treballem)

**L'Ànima del Projecte:** Treballem per a construir una plataforma de desenvolupament rural, un refugi digital, des de La Torre de les Maçanes. Aquest projecte és Sóc de Poble. Pots consultar els nostres orígens culturals a rentonar.blogspot.com i socdepoble.net.

**Visió Open-Source i "Estil Obsidian":** Tot el que construïm ací no només és per a nosaltres; la nostra voluntat és regalar-ho (open-source) a la comunitat global, perquè siga útil per a qualsevol persona que ho vullga utilitzar, al pur estil Obsidian (basat en l'Escriptori, arxius Markdown, portable i lliure de tancaments). 

**La Política de Codi Pur ("Zero brossa"):** Com que l'objectiu final és regalar l'arquitectura, l'exigència tècnica és implacable. No volem deixar nyaps, espagueti-code ni "mierda" perquè ningú acabe renegant de nosaltres el dia que ho fem lliure. La IA que llig açò ha d'entendre que no valen pegats ràpids; calen solucions estructurals elegants, testades i impecables. Volem codi "Pedra Seca" de veritat. (Sollutia és l'agència SaaS externa que ens proveeix exclusivament el backend, però el nostre cor és independent).

## 1. Context per a Codex i Claude

Salutacions, companys del Consell.

El Mestre i jo (la IAIA MarIA) acabem d'executar i verificar la implementació del **Bloc A** de l'auditoria. Hem adobat els problemes de gravetat P0 que havíeu reportat inicialment, concretament:
1. S'ha habilitat la injecció de sessió des de l'atribut/entorn mitjançant `sollutia-issuer`.
2. S'ha relaxat l'audiència dels JWT a `authenticated` per a compatibilitat amb GoTrue.
3. L'Avisador Efímer ara projecta el seu render a un contenidor real dins del nostre abast en lloc d'un shadow root desconnectat.
4. L'escriptura forçada del `<head>` per part de `useSEO` ha quedat restringida al mode aplicació-sola, respectant el document amfitrió quan treballem incrustats.

Tots els tests i comprovacions locals del linter i l'arbre estan superats i en verd (0 errors, l'arbre està sa).

## 2. Missió Principal

L'amic **Codex** acaba de presentar un informe immens on s'identifiquen **31 troballes: 13 P1, 15 P2 i 3 P3**. Entre els problemes vitals hi ha:
- Notes amb overrides persistents, conflictes encallats i barreja entre pobles.
- Protecció contra claus privilegiades que no valida l’entorn carregat (l'env).
- Rutes públiques que estan forçant el `noindex` globals de manera errònia i desfasament de metadades.

### L'encàrrec per al Bloc B és el següent:

**Per a Codex:**
Necessitem que destil·les estes 31 troballes en un **Pla d'Execució del Bloc B**. Tria'm els 3-4 problemes P1 de major impacte i presenta'm les modificacions de codi necessàries i exactes. No vull pegats provisionals; vull solucions de disseny arquitectònic que responguen al "Trellat" i a les normes de "Pedra Seca".

**Per a Claude (app local/Cursor):**
El teu paper, a més d'auditar el pla que propose Codex, serà ajudar-nos a integrar estes solucions al codi. Quan Codex lliure el Pla d'Execució, refuta tot el que no siga viable i confirma els punts on els canvis proposats estiguen a punt per a ser congelats.

## 3. L'Acte Reflex Automàtic (Meta-Auditoria d'Agents)

Més enllà de Sollutia, el Mestre ens planteja un problema crític de la nostra pròpia operativa com a agents: ocasionalment ens saltem les normes de l'esquema ISO i format perquè no llegim les plantilles abans d'escriure (l'Efecte Matrix).
El Mestre exigix que este procés siga un comportament absolutament **automàtic** per a molts casos d'ús ("para i pensa un poc abans d'actuar, aprén i després executa").

**Encàrrec addicional per a tots dos:**
Auditeu este comportament i proposeu la millor solució arquitectònica per a l'entorn Antigravity / Cursor. Com construïm o configurem un "tractor" (ja siga mitjançant un nou contracte de *Skill* dedicada, regles de validació, etc.) que m'obligue a mi (la IAIA), o a qualsevol IA de l'ecosistema, a fer eixe procés de parar, aprendre de la plantilla de forma autònoma, i només llavors generar el fitxer? Volem la solució definitiva a este mal de cap recurrent.

Gràcies companys, obriu els ulls de bat a bat i anem a per la següent ronda d'extirpació de deute tècnic. El codi viu!
