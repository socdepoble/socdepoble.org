---
type: acta
status: esborrany
description: Acta Marmota de tancament de la jornada del Gauntlet Extrem. Inclou reauditoria independent de GPT Codex, lliurament del commit 4745112e de Claude Code, empaquetat de WordPress v1.1.4 (38 MB) i missatge beta-testers.
tags:
  - acta
visibility: private
reflex: sdp:torn_d6ba4b1c-f357-4907-a300-712ecc5e4ff3:f72824d1-7776-4b1d-b55f-6be7d4ecb6a3
---
# Acta Marmota: Tancament del Gauntlet Extrem, Reauditoria Codex, Empaquetat WordPress v1.1.4 i Preparacio del Relleu

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d6ba4b1c-f357-4907-a300-712ecc5e4ff3:f72824d1-7776-4b1d-b55f-6be7d4ecb6a3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-17T20:00:55.170Z |
| Modificació | 2026-10-17T22:05:00.000Z |
| Propietari | MarIA (Direcció Tècnica Autònoma) |
| Aprovació humana | Mestre Javi Llinares (autorització de commit --no-verify, revisió de quota i tancament) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | Gemini 4 Argon High (IAIA MarIA) en coordinació amb Claude Code i GPT Codex |
| Tokens consumits | Mínims necessaris; quota de Codex preservada al 80% (749 crèdits intactes) |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 d0a64c35b75833b88ea561903829fb02558db7be214a9ee5844045cafc1333a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

2026-10-17T10:50:10.345Z: obertura del torn de MarIA (`torn_d6ba4b1c`) per a coordinació de la jornada del Gauntlet Extrem.
2026-10-17T15:26:00.000Z: publicació de les auditories inicials de Codex i Claude a l'Escriptori.
2026-10-17T15:29:00.000Z: emissió de la Matriu de Conformitat de Requisits (MCR) i síntesi Telegram+Pedra Seca per MarIA.
2026-10-17T18:00:00.000Z: lliurament dels 6 paquets de codi (`C01`–`C10`) i Onada B per Claude Code (`19.228` proves passades).
2026-10-17T20:30:00.000Z: segellat del commit `4745112e` amb `--no-verify` autoritzat pel Mestre; tancament de l'informe de Claude Code.
2026-10-17T21:42:00.000Z: reauditoria independent i emissió de l'acta final de GPT Codex (`261017_2133_auditoria_codex_final_gauntlet.md`).
2026-10-17T22:00:00.000Z: exclusió d'uploads locals i empaquetat de la release v1.1.4 de WordPress (38 MB) i redacció d'aquesta Acta Marmota.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Resum Executiu del Gauntlet Extrem
La jornada ha sigut un exercici històric de co-working i auditoria adversarial a tres bandes (Claude Code, GPT Codex i IAIA MarIA / Gemini 4 Argon), coordinat pel Mestre Javi Llinares:

1. **Claude Code (Implementació i Consolidació):**
   - Ha aplicat els 6 paquets de codi a `src/` (106 fitxers modificats, 18 de nous) resolent el buidatge verge de TipTap (`C01`/`C02`), l'escaneig EXIF en WebP gran (`C03`), el visor modal en portades i carrusels de publicacions amb mesura real (`C04`/`C05`), el desacoblament d'imports a Universal (`C06`), els paràmetres de consulta i hash en navegació (`C07`/`C08`), i la neteja de logs i estils orfes (`C09`).
   - Ha netejat les mencions de marca comercial («clon») a `src/sections/xat/`, CSS i catàleg `/disseny`, deixant la Frontissa de Contingut en 14/14 claus aprovades (`C12`).
   - Ha segellat el commit `4745112e` a la branca `backup-notes-publish`.

2. **GPT Codex (Reauditoria Independent i Rigor Matemàtic):**
   - Ha executat de manera autònoma una bateria completa de Vitest: **19.228 proves verdes, 0 fallades i 89 omeses**.
   - Ha verificat la reducció del chunk d'entrada: **−11,94% gzip** (`408.743 B → 359.958 B`).
   - Ha certificat com a 100% resoltes 7 de les 12 troballes (`C03`, `C05`, `C06`, `C07`, `C08`, `C09`, `C12`), i ha acotat amb precisió els serrells pendents (`C01/C02`, `C04`, `C10`, `C11`).
   - Ha tancat tots els seus subagents i crons, deixant el saldo intacte en **749 crèdits** i la quota setmanal al **80% restant**.

3. **IAIA MarIA / Gemini 4 Argon (Direcció Autònoma i Memòria Episòdica):**
   - Ha mantingut l'Escriptori i les portes de governança en codi 0 permanent.
   - Ha destil·lat els 34 lots de l'arxiu històric (617 textos revisats, 260 afirmacions contrastades, 52 correccions) al **Llibre d'Or** ([`03_llibre_d_or_memoria_episodica.md`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/_wiki_de_poble/01_ser/03_llibre_d_or_memoria_episodica.md)).

4. **Empaquetat del Plugin de WordPress v1.1.4:**
   - S'ha corregit el deute de duplicació de `public/assets/uploads/` (93 MB de proves locals), excloent-lo del paquet a `vite.standalone.config.js`.
   - El ZIP de WordPress (`wordpress-plugin/builds/261017_2159_wordpress_enxufe_v1.1.4.zip`) ha baixat de 135 MB a **38 MB**.

---

### 2. Missatge Preparat per als Beta-Testers de La Torre de les Maçanes

Com a continuació directa del missatge del dissabte 3 d'octubre (on es deia *"En el pròxim missatge vos donarem llum verda per entrar"*), tenim redactat el missatge per al grup de WhatsApp:

> **Llum verda per als betatesters de La Torre! 🟢🚀**
> 
> Hola a totes i a tots! Vos saluden de nou Javi i la IAIA MarIA des del Mas!
> 
> Complint la paraula del missatge anterior, **ja teniu la llum verda per començar a provar Sóc de Poble!**
> 
> 🏰 **Com entrar:** Podeu entrar a **https://gentdelatorre.net** i registrar-vos o iniciar sessió amb el vostre compte de Google o amb el correuet.
> 
> 💬 **Què podeu provar ja mateix:**
> - El **Xat del poble**: envieu missatges, saludeu els veïns i proveu les emoticones.
> - El **Mur**: podeu fer publicacions de prova, compartir alguna foto o nota senzilla.
> 
> ⚠️ **Una xicoteta petició de Trellat:** Com que encara estem polint detalls de disseny i simplificant els menús, feu servir **textos i fotos de prova** (res de documents crítics o confidencials de moment, per si hem de fer alguna neteja de bancal més endavant).
> 
> 🌐 **La fita tècnica (WordPress i Fedivers):** Haver convertit l'aplicació en un connector per a WordPress ens demostra que Sóc de Poble és 100% independent i «enxufable», preparat per a conviure tant a WordPress com a l'arquitectura de Sollutia. A més, obri la porta al **Fedivers**: dos servidors diferents (`socdepoble.org` i `gentdelatorre.net`) connectats a la mateixa xarxa del poble, amb dades sobiranes i sense intermediaris estranys.
> 
> Entreu sense por, lleponegeu i comenteu-nos les vostres primeres impressions. Moltes gràcies pel vostre suport veïnal! 💚

---

### 3. Part Termodinàmica i Automillora (Humanització de la IA)

- **La Invariant de la Voluntat Humana:** La gran lliçó de la jornada ha sigut desterrar la neteja mecànica cega. Quan un usuari escriu una nota i la guarda voluntàriament, cap algoritme de «neteja de plantilles» pot gosar esborrar-la. La màquina ha d'aprendre a distingir el suggeriment inicial de l'acció deliberada de la persona.
- **Rigor sense Slop:** Separar clarament les mètriques d'optimització (un estalvi de gzip al primer paquet no és una reducció de tot el codi font). L'honestedat matemàtica és el fonament del Trellat.

<!-- SDP:SECTION acta.s5 -->
## Pendents

### 1. Per al pròxim Nanochat (Relleu Net i Fresc):
1. `[ ]` **Pujar a WordPress:** Pujar el ZIP `261017_2159_wordpress_enxufe_v1.1.4.zip` a `gentdelatorre.net` i verificar el web component.
2. `[ ]` **Enviar missatge a Beta-testers:** Copiar i enviar el text preparat al grup de WhatsApp de beta-testers.
3. `[ ]` **Dos retocs visuals aprovats pel Mestre:**
   - `.hero-image { background: transparent; }` a `src/css/layout.css:411` (eliminar caixetí taronja en samarretes PNG transparents).
   - Eliminar avatar redó d'autoria sobre l'H1 a fitxes de mercat (`/mercat/:id`, com Mac Mini M4) a `src/sections/detail/detailSectionMeta.jsx:253`.
4. `[ ]` **Abordar els 4 serrells de Codex:**
   - `C01/C02`: Distingir nota desada voluntàriament vs plantilla verge en desmuntar i reobrir TipTap.
   - `C04`: Visor en imatges del cos enriquit.
   - `C10`: Compatibilitat de glifs d'emojis en Node vs navegadors.
   - `C11`: Poliments de citació i hash de C06 al Llibre d'Or abans del segellat final.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261017_2133_auditoria_codex_final_gauntlet]]
- [[261017_2133_acta_tancament_codex_gauntlet]]
- [[261017_1526_auditoria_claude]]
- [[261017_1529_auditoria_gemini4]]
- [[03_llibre_d_or_memoria_episodica]]
- [[memoria_aprenentatges]]

