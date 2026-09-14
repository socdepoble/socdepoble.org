---
tipus: prompt
estat: esborrany
description: 🛡️ DISSENY DE L'AGENDA (EXPERIMENT CLAUDE ARTIFACTS)
---
# 🛡️ DISSENY DE L'AGENDA (EXPERIMENT CLAUDE ARTIFACTS)

**Context Ocult**: Eres Claude. Tens al teu abast el BUNDLE complet del repositori Sóc de Poble. El teu objectiu és programar i dissenyar visualment el component "Agenda" (Mur d'esdeveniments) com un Artifact interactiu de React (Vite).

## REQUISITS TÈCNICS I LÒGICA
1. **Llibreria de Calendari:** Fes servir `react-day-picker`.
2. **Patró Mòbil (Comportament):**
   - Capçalera compacta: Nom del mes, botó "Hui" i fletxes de navegació (← →).
   - Vista per defecte: Tira horitzontal de 7 dies.
   - Opció "Veure el mes complet" per a desplegar-lo.
   - En seleccionar un dia, l'estat local s'actualitza (simulant una URL `?date=AAAA-MM-DD`) i es llisten els actes sota.
3. **Estat Buit:** Si no hi ha actes el dia seleccionat, mostra "No hi ha actes este dia", suggereix els propers actes i un botó de "+ Proposar".

## CONTRACTE DOM: LLEI INVIOLABLE (PEDRA SECA)
Les IAs tenen tendència a al·lucinar l'estructura de la nostra `UniversalCard`. Tens **ESTRICTAMENT PROHIBIT** inventar o alterar l'arquitectura d'aquest component. 

Per a llistar cada esdeveniment a l'Agenda, **has de generar exactament aquest DOM**:

```html
<article class="sp-card">
  <!-- OPCIONAL: El header només s'usa per a l'autor o el lloc base, 
       no per al títol de l'acte! Fons taronja. -->
  <header class="sp-card-header">
     <span class="sp-card-author-block">Sóc de Poble</span>
  </header>
  
  <!-- COS DE LA TARGETA (Fons blanc) -->
  <div class="sp-card-body has-aside has-calendar-badge">
     <!-- La insígnia de l'hora va ací com a element flotant o grid -->
     <time class="sp-card-calendar-badge">18:00h</time>
     <!-- Títol, subtítol i cos de l'acte -->
     <h3 class="sp-card-title">Passeig botànic per la serra</h3>
     <p class="sp-card-text">Recorregut tranquil per a reconéixer plantes...</p>
     <!-- Etiquetes -->
     <ul class="sp-card-labels">
       <li class="sp-card-label sdp-badge-tag">Natura</li>
     </ul>
  </div>

  <!-- PEU DE LA TARGETA (Accions). Fons blanc amb vora superior, no blau! -->
  <footer class="sp-card-footer">
     <div class="sp-card-actions">
       <button class="icon-button" aria-label="Ancorar">⭐</button>
     </div>
     <!-- Botó d'acció principal, blau fosc de text per defecte -->
     <button class="btn-connectar sp-card-connect">Connectar</button>
  </footer>
</article>
```

**Altres Normes:**
- No uses Tailwind. Fes servir el CSS Vanilla i els Design Tokens globals de Sóc de Poble (`var(--sdp-primary-500)`, `var(--sdp-pedra-200)`, etc.).
- Capçalera Blava: La barra blava (`.bar-blue`) de l'app conté botons xicotets de navegació. No la converteixes en un contenidor per a botons grans com "+ Proposar". Fes servir el component de calendari com un bloc integrat a la pàgina, sent elegant i usable tàctilment (44px mínim).

Construeix-ho ara en format d'Artifact perquè ho puga provar de forma independent, posant tot el CSS i el codi del component al mateix lloc.
Consulta sempre: [[doc_logos_oficials]]

---

## Objectiu
Auditar el paquet agenda_claude amb evidències verificables

`OBJECTIU: Auditar el paquet agenda_claude amb evidències verificables`

## Context Necessari

Bundle aparellat: 260914_1121_BUNDLE_agenda_claude.md.

La integració actual és purament online i centrada en crear una connexió perfecta per al sistema de la nostra empresa sòcia, Sollutia; la sobirania local és una meta de llarg termini.

## Instrucció Principal

Analitza el codi i la Wiki adjunts, identifica causes i proposa correccions mínimes verificables

`EXECUTA: Analitza el codi i la Wiki adjunts, identifica causes i proposa correccions mínimes verificables`

## Output Esperat

`FORMAT: markdown`

## Bloc Fixe d’Identitat

**Qui Som (La Nostra Història):** Som l'Associació ecologista El Rentonar i Sóc de Poble. Aquest projecte és l'hereu de més de 30 anys d'activisme rural i lluita pel nostre entorn natural i patrimonial. El nostre llegat i identitat digital resideixen històricament en `rentonar.blogspot.com`, van evolucionar a l'antiga plataforma fundacional `socdepoble.net`, i avui es materialitzen construint `socdepoble.org` (el Mas).

**Filosofia:** [[el_projecte|Sóc de Poble]] és actualment una aplicació web connectada (Online-First / React SPA + Supabase BaaS). Tot i que l'aspiració a llarg termini és la sobirania tecnològica rural (amb arquitectures descentralitzades), avui dia depenem d'un backend centralitzat (Supabase PostgreSQL + GoTrue Auth + RLS) i requereix connexió constant. NO utilitzes patrons 'Local-First' ni 'Offline-First' que enfosquisquen aquesta realitat, ja que confonen el Consell d'IAs. La IAIA MarIA actua amb Trellat, mínima intervenció, el Baseline 2022 com a jutge i respecte absolut per la llengua, la memòria i la gent major.

---

## Tancament Obligatori

- No yapping.
- No dependències supèrflues.
- No Tailwind al Core.
- No tocar dades personals sense base legal.
- Si hi ha risc de destrucció, activa SDP-LOCK.
- PROHIBICIÓ ESTRICTA DE CERCA WEB: Ets en un entorn aïllat (air-gapped). Tens prohibit malbaratar tokens cercant termes a internet (ex: noms de fitxers, 'oauthRelay.js', conceptes propis o 'Pedra Seca'). Tota la informació està en el bundle adjunt. Llig-lo i no el busques fora.

## Sinapsis

- [[00_bios]]
- [[02_genotip]]
- [[doc_governanca]]
- [[doc_logos_oficials]]
- enginyeria_inversa_mit

## Taxonomia

- **Categoria:** [[maquina]]
- **Etiquetes:** [[graf]]


**Ancoratge de Seguretat:** [[00_index]]

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/plantilles/plantilla_iso_sdp.md":"978fc4f0f6141a05786c3a4ad7ea319a58170c0f51078ef235649d1bd24c2835","_wiki_de_poble/01_ser/00_bios.md":"5dbace813b4a86af2002b3ca45a12f11055dd6d664ac6e22585a9af9a1c8de34","_wiki_de_poble/01_ser/02_genotip.md":"980417e92c4c5b305f65db70cfc67108f30608910d97774e2d9d0174fb7f84f1","_wiki_de_poble/02_saber/doc_governanca.md":"5a37a96783fecf1029d95c5735e6bb93d63399195783064e632e53789de04693","_wiki_de_poble/02_saber/doc_logos_oficials.md":"70d4ea7c1a14a5c75a00aaaf2439c3b1910b7f921e1207346f5df5dee81e0861","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"294ee25a85573276c93ed009ae02c0e9ef508fd4d622b3a3af906f28adf0c32f"} -->
