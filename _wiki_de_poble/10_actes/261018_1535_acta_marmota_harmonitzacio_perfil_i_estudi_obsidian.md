---
type: acta
status: esborrany
description: "Acta Marmota: Harmonització Pedra Seca del Perfil, fix de Storage pilot Javi Llinares, paquet v1.1.5 per a gentdelatorre.net, estudi REA d'Obsidian v1.14.4 i full de ruta betatesters."
tags:
  - acta
visibility: private
---
# 📜 2026-10-18 15:35 - ACTA MARMOTA: Harmonització del Perfil, Fix de Storage Pilot, Estudi Obsidian REA i Release v1.1.5

> **Nota per a la IAIA:** Aquesta acta recull els assoliments de la jornada matinal i migdia del 18 d'octubre (accés pilot de Javi Llinares, commutació transparent d'identitats, resolució del bug de desat de fotos en pilot, catàleg complet d'APLICACIONS amb Lector RSS, poda de 150 fitxers històrics a `_arxiu_wiki_de_poble/`, dissecció REA d'Obsidian 1.14.4, compilació i signatura del paquet de WordPress v1.1.5) i estableix el relleu fresc per a la nova conversa sense perdre ni un àtom de context.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:acta:261018_1535:harmonitzacio_perfil_i_estudi_obsidian |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local (`localhost:3340`) i producció `gentdelatorre.net` |
| Creació | 2026-10-18T13:35:00.000Z |
| Modificació | 2026-10-18T13:35:00.000Z |
| Propietari | IAIA MarIA (Orquestradora Tècnica Antigravity) |
| Aprovació humana | Mestre Javi Llinares |
| Model IA | Gemini 4 Argon High (IAIA MarIA) + Claude Code (Opus 5.5) + Gemini 4 Argon (Sub-xat REA) |
| Estat mental / Càrrega | Objectius assolits, màxima lucidesa, 76 artefactes acumulats; tancament canònic i relleu net a nova conversa |

## Acte reflex

Plantilla emprada: `_wiki_de_poble/03_actuar/plantilles/acta.md`. Aquesta acta fixa la memòria física del repositori contra l'oblit, immunitza el sistema contra la fatiga de context i serveix de pont ferm per a l'arrencada de la pròxima sessió.

## Historial

- **2026-10-18T10:15:00Z:** Obertura de sessió i llançament de `http://localhost:3340`.
- **2026-10-18T11:00:00Z:** Detecció i resolució del flux de registre: accés pilot per a Javi Llinares sense 400 ni bucles a `/notes`.
- **2026-10-18T12:00:00Z:** Claude Code harmonitza la geometria visual (barra lateral 16px/56px, lupa alineada, botons centrats, targetes centrades).
- **2026-10-18T13:00:00Z:** Diagnòstic del bug de pujada de fotos: `src/data/supabase/storage.js` rebutjava l'UUID de pilot `'0001'`. Solucionat desant en memòria per a pilot sense alterar el contracte remot de Supabase.
- **2026-10-18T13:30:00Z:** Commit semàntic de Claude Code `0a0a3d4cd` (`feat(perfil): accés pilot de Javi, workspaces d'identitat, tractor WebP i harmonització del Perfil`). 19.242 tests en verd.
- **2026-10-18T14:05:00Z:** Gemini 4 Argon completa la dissecció forense d'`obsidian-1.14.4.asar` mitjançant el servidor MCP REA, documentant el motor matemàtic de Drag & Drop i el panell integrat d'ajustos (`261018_1405_estudi_obsidian_rea_gemini4_iaia.md`).
- **2026-10-18T14:45:00Z:** Execució del tractor de poda de lots `tooling/maquinaria/executar_poda_lots.mjs`: 150 fitxers històrics i de recerca moguts a la carpeta satèl·lit exterior `_arxiu_wiki_de_poble/` amb manifest SHA-256 intacte.
- **2026-10-18T15:36:00Z:** Compilació i signatura Ed25519 de la release de WordPress v1.1.5 (`261018_1536_wordpress_enxufe_v1.1.5.zip` a `wordpress-plugin/builds/`).
- **2026-10-18T15:38:00Z:** Reflexió del Mestre sobre betatesters, gestió de multimèdia, descans de les finestres de Claude i Gemini, i redacció d'aquesta Acta Marmota de relleu.

## Resultats

### 1. Fites Tècniques Assolides
1. **Accés Pilot Transparent de Javi Llinares:**
   - Botó directe a `/registre` que permet entrar amb un sol clic com a Javi Llinares en entorn pilot/proves.
   - Commutació de perfils transparent (`Javi Llinares` persona, `Sóc de Poble` empresa, `El Rentonar` grup) sense canviar d'espai de treball ni caure erròniament al Bloc de notes.
2. **Harmonització Estricta de Pedra Seca:**
   - Botons d'acció (`[ Guardar ]`, `[ Ocultar del Panell ]`) i targetes de perfil (`.perfil-vistes__targeta`) centrats amb `margin: 0 auto` i `justify-content: center`.
   - Geometria de la barra lateral i de la lupa: icones a 16px, text a 56px, sense salts ni dobles marges.
   - Barra prominent desplegable «Edició avançada de la fitxa» amb estil de bloc de control i subtítol explicatiu clar.
3. **Resolució de Storage en Pilot:**
   - Verificat el desat real de capçalera i avatar per a Javi Llinares (`'0001'`) en mode de proves a `localhost:3340` amb la imatge de *La Torre*.
4. **Catàleg d'APLICACIONS Integrat:**
   - Sis aplicacions públiques completes: Gestoria, Rebost Domèstic, Salut, Lector RSS, TPV del Bar i Snippet.
5. **Poda Històrica Neta:**
   - 136 fitxers de `90_arxiu_historic/` i 14 entrades de `02_investigacio_ia/` traslladats a `_arxiu_wiki_de_poble/` alliberant context sense trencar cap enllaç canònic.
6. **Dissecció REA d'Obsidian 1.14.4:**
   - Documentada l'arquitectura de Drag & Drop sense dependències externes (geometria 5%/90%/5%) i el panell d'ajustos integrat continu a 700px centrat.
7. **Paquet WordPress v1.1.5 Llesta per a Producció:**
   - Generat `wordpress-plugin/builds/261018_1536_wordpress_enxufe_v1.1.5.zip` firmat amb clau Ed25519 per a desplegar a `gentdelatorre.net`.

---

### 2. Full de Ruta per als Beta Testers (Decisions Estratègiques)

El Mestre ha plantejat les qüestions centrals per a l'entrada dels *beta testers*:

1. **Arquitectura Multimèdia i Imatges dels Usuaris:**
   - **Emmagatzematge a Supabase Storage:** Particionat organitzat i auditable:
     `imatges/{poble_slug}/{user_id}/{aammdd_hhmm}_{slug}.webp`
   - **Tractor WebP al Vol (Client-side):** Abans que una foto isca del mòbil de l'usuari (on les càmeres fan arxius de 5 a 10 MB), es redueix i converteix automàticament a WebP (<1200×1200 px, <100 KB) al navegador. Això garanteix zero sobrecàrrega al servidor i càrrega instantània amb connexió rural.
   - **Galeria Personal vs Àlbum Comunitari:**
     - A la fitxa d'usuari: només els seus actius (avatar, capçalera, notes personals).
     - A la plaça/poble: fitxes públiques i àlbum de memòria viva del poble.
2. **Onboarding Sense Friccions a `gentdelatorre.net`:**
   - El paquet v1.1.5 s'ha de pujar al WordPress de `gentdelatorre.net`.
   - L'accés per a veïns nous ha de prioritzar Google Sign-In (1 sol clic) o Magic Link directe, evitant contrasenyes feixugues.
   - Per defecte, nou usuari adquireix l'avatar de la Torre i poble de referència sense haver de configurar res manualment.
3. **Editor de Notes i Canals de Publicació per a la Gent del Poble:**
   - **Els 8 Canals Canònics:** A «Edició avançada de la publicació» s'habilitarà el selector amb els 8 canals oficials:
     `[ Mur (per defecte) | Mercat | Calendari | Mapa | Transport | Animalets | Treball | Habitatge ]`
   - *Nota de Trellat del Mestre:* «Transport» substitueix «Vehicle compartit» perquè abasta tant compartir viatge com comprar/vendre cotxe, tractor o remolc (igual que «Habitatge» serveix per a compartir, llogar o vendre). I el «Mapa» és essencial per a situar esdeveniments, alertes o punts del terme.
   - Traslladar el botó d'emojis (`:)`) des de la capçalera de la barra lateral a la barra negra d'eines d'escriptura (just a l'esquerra de `[ PUBLICAR ]`).
   - Reemplaçar el modal flotant d'emojis per un panell ample amb icones grans (48-64px) a l'estil WhatsApp, fàcils de prémer amb el dit per a gent gran.
   - Netejar la barra TipTap de formatats inútils (eliminar `H2` del cos de la nota i ratllat `S`).
4. **Panell d'Ajustos Integrat d'Obsidian:**
   - Substituir `WorkspaceSettingsDialog.jsx` (modal flotant) pel panell integrat continu de 700px centrat dins del llenç principal (`DetailColumn`), mantenint el context de fons intacte.

---

## Conclusions i Relleu per a la Nova Conversa

- **Higiene:** La Porta Olivera ix amb codi 0 (net). Escriptori impecable.
- **Companyes preservades:** Claude Code i Gemini 4 continuen obertes a les seues respectives finestres de treball amb tot el context viu i sense interrupció.
- **Decisió del Pla i Prompt:** Per a no contaminar amb el llast dels 76 artefactes acumulats, **el Pla d'Implementació i el Prompt per a Claude es redactaran directament en obrir la nova conversa**.
- **Reinici d'Antigravity:** Es tanca aquesta sessió per a alliberar context. En obrir la nova conversa, iniciarem amb la contrasenya canònica:
  > *"Sóc de poble"*
- La IAIA MarIA carregarà aquesta Acta Marmota com a memòria fundacional immediata i redactarà el nou Pla i Prompt canònics de forma cirúrgica.

Bona feina, Mestre. El fonament de Pedra Seca està ferm i llest per al següent pas.
