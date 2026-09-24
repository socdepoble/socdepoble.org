---
type: prompt
status: esborrany
description: "Pedaços 0754 (P2 a P16) i avaluació addicional: delegació a Claude per implementar la ronya restant directament en codi."
tags:
  - govern
---
# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen. Les auditories velles s'han mogut a `90_arxiu_historic/260924_Sessio_Matinal/`.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/`.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260924-0845 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-24 08:45 |
| Modificació | 26-09-24 08:45 |
| Propietari | Agent Local (Claude) |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | pendent |
| Tall d'evidència | [HEAD + 08:45] |
| Aprovació humana | aprovat (delegació absoluta de paleta) |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex
Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a Claude en base a la regla de Petorretas i Context Global.

## El Context Mestre Obligatori (Llei de l'Olivera - Regla 6)
Per no imaginar res, has de comprendre TOTA la realitat del projecte:

### 1. Qui Som, Visió i Missió
Sóc de Poble és l'evolució de més de 30 anys de lluita per protegir la identitat i el patrimoni dels nostres pobles a internet (des de rentonar.blogspot.com fins a l'actual socdepoble.org descentralitzat).
- Missió: Donar a la gent del camp eines locals autèntiques, sense obsolescència ni dependència de Big Tech. 
- Mòduls Essencials: Mur (fòrum cívic), Xat, Mercat (productes de proximitat Km 0), Agenda (festejos i cultura), Notes, Mapa, Vehicle (compartit), Habitatge, Ocupació, i Animalets. 

### 2. Pedra Seca (L'Arquitectura Visual)
El model arquitectònic "Pedra Seca" dicta que:
- La capa de primitius semàntics no envia **MAI cap codi hexadecimal** als components de React.
- Tot gira a partir del color de l'arrel o del panell de crom (un cànon de color blau primari que gira el "hue").
- Els components de disseny només viuen de tokens semàntics (ex. `var(--sdp-pedra-700)`). Això permet canviar tota la plataforma sense tocar cap línia de React o CSS dels components directes.

### 3. Sol·lutia i Infraestructura Enxufable
Sollutia és només un proveïdor d'infraestructura, host SPA i Backend. L'arquitectura és modular ("Llei de l'Enxufabilitat"), model d'endoll transparent. No han de condicionar les decisions estructurals front-end de el Mas.

### 4. Els Agents i les Skills del BIOS
Operem sota l'Agència de l'Olivera. Tenim una dotzena de "skills" (automatitzacions emmagatzemades en `.agents/skills`) com:
- `core-memoria-historica`: Prevenir la repetició cíclica d'errors, preservar documentació.
- `core-edicio-segura` i `core-taxonomia-estricta`: Zero codi mutilat i formatacions obligatòries amb frontmatter en tots els fitxers markdown.
- La "Gàbia": Els hooks bloquegen que l'orquestració o els agents de fons puguen esborrar fitxers clau (excepte si estem delegant la intervenció directament amb el teu executor). 

## Instrucció del torn

1. Llig exhaustivament els informes desats avui a `90_arxiu_historic/260924_Sessio_Matinal/`, sobretot l'informe `260924_0754_auditoria_claude.md`. La IAIA MarIA ha tocat el color i els estils del `workspace`, però el Mestre ha indicat que és **completament erroni** (el negre profund ha envaït la columna de carpetes quan havia de ser un gris més clar per donar jerarquia visual des de l'exterior de l'aplicació cap endins). **TU TENS PROHIBIT TOCAR EL CODI CSS/VISUAL EN ESTE TORN.** Eixa errada de jerarquia de colors serà l'agenda d'un *següent xat d'estandardització*, NO en aquest. A tu se't demana implementar exclusivament la lògica, els bugs, i la ronya asíncrona.
2. La teva feina ("como obrero de paleta") és IMPLEMENTAR de veritat, escrivint sobre els fitxers de codi, la resta de pedaços de lògica marcats entre la **P2 i la P16 de la 0754**. (L'avís de conflicte de versió asíncrona a Notes, `GlobalSaveManager`, rutes, etc).
3. **Tens permís directe d'edició ("haz las implementaciones tú mismo").** Si trobes un altre "forat" o "ronya" de codi lligat als components que repasses, o en el `pageDetailLookup`, saneja'l. Eres completament operatiu.
4. **Tasca UI d'última hora**: Tot i que t'he prohibit tocar el CSS del workspace central, el Mestre vol que, al component `App.jsx` o al panell on es pinta el sidebar esquerre, fiques una simple línia separadora (com la que hi ha a sota en Versions/Legalitat) just entre l'enllaç de **"Notes personals"** i **"El projecte"**. Això diferenciarà clarament el bloc d'Apps del bloc de Pàgines de Sistema.
5. Finalment, genera l'informe de tancament validant que l'app compila, que els testos passen, i que la "ronya" detectada és neta.

## Tasques
- [ ] Aplicar tots els pedaços de lògica i components React (P2 al P16) de 0754.
- [ ] Cercar forats arquitectònics no respostos.
- [ ] Inserir la línia separadora `<hr className="sdp-panell-control__divisor" />` (o la classe equivalent de la plantilla) entre "Notes personals" i "El projecte".
- [ ] Assegurar que els components passen els Tests locals i `npm run build:web` no té queixes de tipatge/eslint.
- [ ] **AGENDA BRIEFING:** Preparar en l'informe de sortida (al final de l'auditoria) el Briefing per al xat de demà, on explicaràs breument al Mestre com es deu estructurar i estandarditzar la jerarquia de colors de columnes (Negre exterior -> Gris interior), sense tocar res del `.css` avui.

### Criteris d’acceptació
- Tests vitest de Notes passen correctament després del teu pedaç (D01, prevenció de sobreescriptura remota de `_baseRevision`).
- No es reporten errors 404 al `/page/:slug`.

## Protocol de la Reunió a l’Olivera
- Guarda el teu informe a `_wiki_de_poble/04_escriptori/`.
- S'anomenarà com tu: `AAMMDD_HHMM_auditoria_claude.md`.
- No esborris aquest prompt ni el pla d'implementació.

## Vincles
- [[00_index_escriptori]]
