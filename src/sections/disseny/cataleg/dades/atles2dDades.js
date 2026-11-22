/* atles2dDades.js · Les dades de l'Atles 2D de Sóc de Poble, en un mòdul ES diferit.
   Atles 2D (ordre del Mestre del 21-11-2026 a les 23:28; pla 261121_2335, Carril 1, Tram 1, punt b) · integrat
   a /disseny?categoria=atles-2d el 22-11-2026.

   ORIGEN (Llei 0: cap xifra no s'ha tocat)
     · Fitxer: _investigacio_ia_de_poble/261121_estudi_mercat_2d_i_entitats/atles_2d_dades.js
       (window.ATLES, generat el 2026-11-21T19:34+01:00; 143.955 B).
     · SHA-256: 9aa278df4a03254eab9f0cbf026c952f623ebd1e473c58af7d6d52448889bc07
     · El mateix objecte viatja dins d'ATLES_2D_SOC_DE_POBLE_MERCAT_I_ENTITATS.html (la maqueta de referència).
   TRANSFORMACIONS (només de text de ruta, comprovades amb un script que compara tots els números):
     · 43 rutes absolutes del disc del Mestre (fonts_llegides) passen a ser relatives a «Som de Poble»:
       una pàgina pública no ha de publicar el directori personal de ningú.
     · 35 rutes del worktree de Claude (_builds_de_poble/sandboxes_r26/claude_r26_worktree/…) passen a ser
       relatives al repositori (src/…), com les evidències fitxer:línia de la matriu.
     · Cap substitució de vocabulari: les dades no porten cap paraula vetada.
     · Una cita el·lidida (v1.2.19 · integrador): a fonts_llegides, el nom de l'informe del poble virtual del
       21-11-2026 (carpeta 261121_reunio_fase5_placa_assaig) es cita «INFORME_…_POBLE_VIRTUAL_…», perquè el nom
       sencer casa amb el patró del fantasma de src/data/identitatDual.guarda.test.js. La guarda no es toca; el
       nom sencer és a l'original, amb el SHA-256 d'ací baix.
     · Un comentari ALLOW_RAW_COLOR davant de la paleta d'Orkut citada (placa.orkut.mecaniques): és una dada
       d'estudi, no un color de la interfície, i tooling/gates/design_guard.mjs no l'ha de comptar com a deute.
   QUI L'IMPORTA: només les cinc pàgines de l'Atles (cataleg/detalls/EspecimenAtles2d*.jsx i atles2dComu.jsx),
   sempre darrere de lazyRoute(() => import(...)) a detailRegistry.jsx. Mai manifest.js ni res de l'arrencada:
   +0 B al pesDelNucli del connector.
   POSAR-LO AL DIA: quan un lot tanque un dolor, canvia ací el seu «estat» (obert → resolt, etc.) i la seua
   «versio_o_kit»; les pàgines recompten soles totes les xifres. Afig també el dolor a meta.posat_al_dia, que
   l'avís de datació de les pàgines diu a la vista (la resta de la fotografia continua sent del 21-11-2026).
   · v1.2.21 (22-11-2026): repassats els huit dolors que toquen els kits R32.35b, R32.37 i R32.38. Només DOL-29 es
     tanca sencer (mesurat amb Chrome sobre el codi integrat); DOL-51 queda en la decisió del Mestre (l'entrada per
     defecte del Bar) i els altres sis continuen oberts amb la part feta i la que queda a la nota (Gauntlet R1, L1-01,
     L1-02 i L1-10). */

export const ORIGEN_ATLES = Object.freeze({
  fitxer: '_investigacio_ia_de_poble/261121_estudi_mercat_2d_i_entitats/atles_2d_dades.js',
  carpeta: '_investigacio_ia_de_poble/261121_estudi_mercat_2d_i_entitats/',
  maqueta: 'ATLES_2D_SOC_DE_POBLE_MERCAT_I_ENTITATS.html',
  sha256: '9aa278df4a03254eab9f0cbf026c952f623ebd1e473c58af7d6d52448889bc07',
  bytes: 143955,
  generat: '2026-11-21T19:34+01:00',
  copiat: '2026-11-22'
});

export const ATLES = {
  "meta": {
    "nom": "Atles 2D de Sóc de Poble",
    "generat": "2026-11-21T19:34+01:00",
    "versio_codi": "v1.2.17 (build 22) · candidat sobre 8749aa810",
    "idees": [
      "IDEA-315",
      "IDEA-314",
      "IDEA-312"
    ],
    "posat_al_dia": {
      "data": "2026-11-22",
      "versio": "v1.2.21 (build 26)",
      "dolors": ["DOL-04", "DOL-13", "DOL-29", "DOL-31", "DOL-38", "DOL-51", "DOL-56", "DOL-59"]
    },
    "orkut_congelat": true,
    "fonts": {
      "placa": "compilació de Claude a partir de 43 fonts (rondes #01–#04, Fase 5, arnés v2 i auditories de l'Escriptori)",
      "matriu": "matriu de Gemini (12 × 5) verificada cel·la a cel·la contra el codi: 8749aa810 + canvis v1.2.17 sense cometre",
      "xarxes": "dossier de Gemini 4 Carbon (High), 21-11-2026 19:08",
      "mercat": "proposta de Gemini i Claude; cap línia implementada a src/"
    }
  },
  "placa": {
    "rondes": [
      {
        "id": "R01",
        "titol": "Assaig a la Plaça #01 · Onboarding mòbil Android, notificacions (Xat i Publicacions) i UX social",
        "autor_ia": "Node 0 · 8 escoles d'Ollama (runner core-placa-assaig; síntesi phi4:14b avortada)",
        "data": "2026-11-20 (execució 21:11 UTC; captura CDP 20:39 UTC)",
        "carpeta": "_investigacio_ia_de_poble/261120_placa_assaig_01_onboarding_mobil_notificacions_i_ux_social/",
        "metode": "Runner amb `chrome --dump-dom` i expressions regulars sobre 7 rutes a 360×800 sense sessió (localhost:3340, v1.2.15); 8 arquetips a 8 models del Node 0 en dues rondes (esmorzar i la fresca). Els prompts feien 3,21 milions de caràcters (99,7 % CSS) per a num_ctx 8.192 i un temporitzador fix de 180 s sense streaming.",
        "num_perfils": 8,
        "conclusio": "Totes les veus vàlides diuen que l'entrada des de WhatsApp confon, que no sona cap avís i que hi ha massa botons; nota de tornar demà 5,5 sobre 10 amb només 4 notes. Claude i Codex demostren que no és evidència d'UX: 5 de 13 crides avortades, cap síntesi, «22 botons» i «<style> dins d'un <button>» són artefactes del parser, i el que encerta (les publicacions no avisen) li ho dictava el prompt."
      },
      {
        "id": "R02",
        "titol": "Assaig a la Plaça #02 · Poble multiagent i blueprint P0 Android i Push per a la v1.2.16",
        "autor_ia": "Claude Opus 5.5 (Ultracode; 32 subagents en quatre workflows)",
        "data": "2026-11-20 22:52 – 2026-11-21 02:24 CET",
        "carpeta": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/",
        "metode": "Sonda CDP pròpia (222 sondes, Chrome aïllat, barrera de xarxa: cap petició no GET fora de localhost) sobre localhost:3340 (v1.2.15, build 20) en modes normal, Sènior i Bancal; 8 veïns sintètics amb missió (ronda 1), 3 investigadors tècnics, debat creuat amb àrbitre escèptic (ronda 2 i ronda complementària de Llorenç i Rosa), comparativa amb el Node 0 i lectura creuada de les places #01, #03 i #04.",
        "num_perfils": 8,
        "conclusio": "Mitjana de tornar demà 3,50 → 3,25 sobre 10 i 1 sola missió de 8 completada sense sessió (Vicent). Consens: la porta enganya (falsos no llegits, maquinària interna al Mur, calendari al passat) i no sona res (clau VAPID buida a producció, cap disparador per a publicacions). Proposa el model de 5 canals d'avís, el mínim viable B5–B11 (portat a la v1.2.16) i les decisions D-M1 a D-M14. Declara els seus errors: dues posicions omeses per un filtre d'identificador i 1.776 + 46 lectures GET anònimes a producció."
      },
      {
        "id": "R03",
        "titol": "Assaig a la Plaça #03 · Enamorament en 3 segons i comparativa amb referents mundials",
        "autor_ia": "Gemini 4 Carbon (High) + 8 escoles del Node 0",
        "data": "2026-11-21 00:05–00:38 CET",
        "carpeta": "_investigacio_ia_de_poble/261120_placa_assaig_03_gemini_ux_atractiu_i_referents_mundials/",
        "metode": "CDP de geometria en 144 escenaris (120 clars + 24 foscos; 4 amplàries, Sènior sí/no) i 57 captures llegides multimodalment; comparativa amb WhatsApp, xarxes socials, Bring!, Loyverse i Obsidian; 8 arquetips al Node 0 que reben un resum escrit per Gemini (FACTS_BRIEF), no la pantalla.",
        "num_perfils": 8,
        "conclusio": "Mesura l'ofec vertical (cap publicació, producte ni dia a la primera pantalla de Mur, Mercat i Calendari), els calaixos del 70–76 % a la Nevera i la Wiki, la compra en targetes editorials, el TPV tancat sense sessió i la portada en anglés de la Wiki. Les seues notes 3,3 → 8,2/8,3 són expectatives sobre millores proposades, no un guany mesurat; el «100 % de consens» i les «captures idèntiques al píxel» del Mode Sènior es van refutar."
      },
      {
        "id": "R04",
        "titol": "Assaig a la Plaça #04 · Mercat, fricció, retenció i arquitectura UX",
        "autor_ia": "Codex GPT-6 (3 especialistes i àrbitre) + 8 escoles del Node 0",
        "data": "2026-11-20 23:42 – 2026-11-21 02:11 CET",
        "carpeta": "_investigacio_ia_de_poble/261120_placa_assaig_04_codex_mercat_friccio_i_arquitectura_ux/",
        "metode": "CDP amb guarda abans de navegar, unió DOM–AX i hit-test 3×3 (112 mostres base i 98 estats d'interacció); LAB-SEED local amb la porta pilot; 7 recorreguts R1–R7; 33 fonts primàries de mercat; 26 crides al Node 0 (ronda ampla, represa focal i debat), sense mitjanes a posta.",
        "num_perfils": 8,
        "conclusio": "La prioritat és que la promesa visible coincidisca amb l'efecte real: preparat, desat ací, compartit, publicat, avisat i rebut necessiten proves diferents. Troba que l'RSVP torna ok:true encara que el desat falle i que la compartició de la Nevera és un snapshot. Cap guanyadora entre utilitat individual i invitació social; conserva el dissens de Toni. Les veus sintètiques inventen fets (concert de Pau, servidor caigut de Rosa) i se'ls contagien."
      },
      {
        "id": "R05",
        "titol": "Fase 5 · Reunió Humana Inter-IA de l'Assaig a la Plaça (doctrina del Foraster)",
        "autor_ia": "Gemini 4 Carbon (High) amb 9 models del Node 0, Codex GPT-6.1 (opcions C01–C10), Claude (lectura creuada) i síntesi de la IAIA MarIA",
        "data": "2026-11-21 01:38–04:31 CET (síntesi de MarIA a les 07:23 i 15:20)",
        "carpeta": "_investigacio_ia_de_poble/261121_reunio_fase5_placa_assaig/",
        "metode": "Lectura creuada de les quatre places; assemblea seqüencial de 8 escoles + 1 secretari tècnic (qwen2.5-coder:14b) amb runner NDJSON en streaming i 2.122–2.632 tòkens d'entrada; 30 alternatives A/B/C de Codex en 10 colls; 111 estudis d'opcions UX i 110 rondes de deute del Node 0.",
        "num_perfils": 8,
        "conclusio": "Fixa la directriu del Mestre (01:55): l'arrel / és sempre /xat, La Torre és un poble més (B8a prohibida) i qui entra sense sessió és un Foraster benvingut. Vota la benvinguda del Foraster (6 de 8 per la targeta d'hostaleria) però la v1.2.17 la substituïx pel text literal del Mestre (IDEA-313). Nom adoptat: «Assaig a la Plaça · Estudi sintètic d'ús i viabilitat». Els perfils de la Fase 5 reben edats i rols diferents dels de les places anteriors."
      },
      {
        "id": "V2",
        "titol": "Assaig a la Plaça v2 · Arnés modular de l'Onada R32.28 (v1.2.18)",
        "autor_ia": "Gemini 4 Carbon (High), Carril 3",
        "data": "2026-11-21 (abans 15:55 UTC; després 16:54 UTC; relleu 18:04 CET)",
        "carpeta": "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/",
        "metode": "Arnés reutilitzable: DOM semàntic net, sonda CDP amb hit-test 3×3 i oclusió per barres fixes, «y» del primer objecte útil, oracle Gemini Decisions amb fallback al Node 0 i generador del guió «Contrast humà» de 5 minuts per als 19 verificadors. Sense veus sintètiques: 14 escenaris geomètrics (/xat i /mur, ca, 7 configuracions) i una sonda subpíxel de 17 escenaris en 5 llengües, sobre una compilació estàtica de la base v1.2.16.",
        "num_perfils": 0,
        "conclusio": "14/14 escenaris sans (0 px de desbordament, 0 controls sense nom, 0 dianes menudes, 0 errors de consola) i el xip «Lletra gran» a 48 px (normal) i 56 px (Sènior); però /mur no troba cap primer objecte útil en cap dels 7 perfils i a 320 px «Entrar/Registrar-se» continuen tapats per la barra inferior. Deixa preparat el guió del Contrast humà, encara sense cap persona real."
      }
    ],
    "perfils": [
      {
        "id": "llorenc",
        "nom": "Llorenç",
        "edat": 58,
        "rol": "veí (provador beta d'Android)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Samsung de fa tres anys, verificador de Google Play; vol entrar amb Gmail d'un toc i que el mòbil l'avise del xat i dels bàndols. La setmana passada no va poder entrar ni amb Google ni des de WhatsApp.",
        "rondes": [
          "R01",
          "R02",
          "R04"
        ],
        "citacio": "Que la primera vegada l'app em pregunte una sola cosa: vols que t'avisem? I que eixe sí funcione de veres."
      },
      {
        "id": "pepa",
        "nom": "Pepa",
        "edat": 77,
        "rol": "veïna (jubilada, Mode Sènior)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Ulleres progressives i lletra gran; rep l'enllaç per WhatsApp de la neboda i té por dels botons que no entén. A la #03 té 78 anys i a la Fase 5, 72 («àvia activa i voluntària cultural»).",
        "rondes": [
          "R01",
          "R02",
          "R03",
          "R04",
          "R05"
        ],
        "citacio": "Vull que em sone quan una amiga m'escriu o l'Ajuntament penja un bàndol; la coca del forn, que me la guarden per a quan mire."
      },
      {
        "id": "carme",
        "nom": "Carme",
        "edat": 51,
        "rol": "comerç (fornera i botiguera)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Té 40 segons darrere del taulell; vol pujar la foto de la coca al Mercat en 3 tocs, que els veïns reben l'avís i un TPV claríssim. A la Fase 5 té 54 anys i també porta la barra.",
        "rondes": [
          "R01",
          "R02",
          "R03",
          "R04",
          "R05"
        ],
        "citacio": "Del forn al poble en tres tocs: foto, preu i «publica i avisa»; si costa més, continue amb les difusions de WhatsApp."
      },
      {
        "id": "pau",
        "nom": "Pau",
        "edat": 21,
        "rol": "veí (músic de la Banda i universitari)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Viu entre la ciutat i el poble; WhatsApp, Instagram i Luma. Vol confirmar assistència d'un toc, vore qui hi va i compartir cartells amb una bona prèvia.",
        "rondes": [
          "R01",
          "R02",
          "R04"
        ],
        "citacio": "Un «Hi vaig» de veres, que diga «Pau, Marta i 12 més hi van», i un avís la vespra."
      },
      {
        "id": "rosa",
        "nom": "Rosa",
        "edat": 44,
        "rol": "ajuntament (tècnica municipal i ADL)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Publica bàndols d'aigua i agenda cultural; necessita saber del cert que l'avís urgent arriba als mòbils sense dependre de Meta. A la #03 és «regidora de comunicació i ADL».",
        "rondes": [
          "R01",
          "R02",
          "R03",
          "R04"
        ],
        "citacio": "Que l'avís urgent signat per l'Ajuntament siga l'únic so de poble, i que la pantalla em diga abans si sonarà i després a quants mòbils."
      },
      {
        "id": "jordi",
        "nom": "Jordi",
        "edat": 35,
        "rol": "veí (teletreballador neorural)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Fa un any que viu al poble; valora la privacitat i el codi obert, vol comprar als productors i integrar-se sense 14 grups de WhatsApp. Té 34 anys a la #03 (usuari d'Obsidian) i 29 a la Fase 5.",
        "rondes": [
          "R01",
          "R02",
          "R03",
          "R04",
          "R05"
        ],
        "citacio": "Soc nou i necessite que el poble m'avise, però si pita per cada coca el silencie en dos dies: la clau és qui té dret a fer-me sonar el mòbil."
      },
      {
        "id": "empar",
        "nom": "Empar",
        "edat": 63,
        "rol": "associació (presidenta d'associació cultural)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Organitza rutes, xarrades i recuperació de fotos antigues; vol convidar els 80 socis per WhatsApp sense que ningú es quede pel camí. A la Fase 5 passa a ser «regidora de cultura, patrimoni i memòria».",
        "rondes": [
          "R01",
          "R04",
          "R05"
        ],
        "citacio": "Un botó per anar directament als meus contactes i publicacions; ara hi ha potencial, però cal que siga més fàcil."
      },
      {
        "id": "toni",
        "nom": "Toni",
        "edat": 49,
        "rol": "veí (l'escèptic de l'esmorzar, advocat del diable)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Té sis grups de WhatsApp i Facebook i pregunta per a què vol una altra app; caça cada microfricció que el faria desinstal·lar-la als tres dies.",
        "rondes": [
          "R01",
          "R02",
          "R03",
          "R04"
        ],
        "citacio": "Si Sóc de Poble pita 25 voltes al dia és el seté grup: el silencie el dia 2 i el desinstal·le el 3."
      },
      {
        "id": "vicent",
        "nom": "Vicent",
        "edat": 62,
        "rol": "veí (llaurador i soci de la Cooperativa d'Oli)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Consulta des del bancal amb el Mode Bancal, mans grans i cobertura irregular; mira el Calendari Agrícola i el Mercat i desconfia dels registres llargs.",
        "rondes": [
          "R02",
          "R03"
        ],
        "citacio": "Un avís que no porta el text no és un avís: al bancal tinc una ratlla de cobertura i l'entrepà en una mà."
      },
      {
        "id": "aina",
        "nom": "Aina",
        "edat": 19,
        "rol": "veïna (estudiant i clarinetista de la Banda)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Arquetip jove de la #03, que ocupa el lloc de Pau; vol la claredat de WhatsApp i apuntar-se als actes d'un toc.",
        "rondes": [
          "R03"
        ],
        "citacio": "M'agrada l'estètica rural, però em perden tantes seccions a l'esquerra."
      },
      {
        "id": "marta",
        "nom": "Marta",
        "edat": 38,
        "rol": "veïna (mare que fa la compra setmanal en parella)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Arquetip de la #03 per a la compra familiar; vol un Rebost com Bring!, visual i compartit en temps real amb la parella.",
        "rondes": [
          "R03"
        ],
        "citacio": "El logotip repetit tres vegades és una agressió a l'espai; la compra ha de ser visual i compartida, no un enllaç."
      },
      {
        "id": "llorenc_f5",
        "nom": "Llorenç (Fase 5)",
        "edat": 78,
        "rol": "veí (jubilat de l'agricultura, Mode Sènior)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Redefinició de la Fase 5: ja no és el provador d'Android de 58 anys sinó un jubilat amb vista cansada que llig bàndols i l'oratge.",
        "rondes": [
          "R05"
        ],
        "citacio": "Les capçaleres riques i fins i tot uns recomptes suaus poden orientar, si la lletra és gran."
      },
      {
        "id": "pau_f5",
        "nom": "Pau (Fase 5)",
        "edat": 42,
        "rol": "ajuntament (secretari i tècnic municipal)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Redefinició de la Fase 5: ja no és el músic de 21 anys; publica bàndols, talls d'aigua i actes oficials.",
        "rondes": [
          "R05"
        ],
        "citacio": "Compactar massa pot esborrar el caràcter del poble, i tota la interfície ha de ser en valencià."
      },
      {
        "id": "rosa_f5",
        "nom": "Rosa (Fase 5)",
        "edat": 38,
        "rol": "associació (mare i coordinadora de l'AMPA)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Redefinició de la Fase 5: ja no és la tècnica municipal de 44 anys; s'encarrega de la compra setmanal familiar.",
        "rondes": [
          "R05"
        ],
        "citacio": "Que es resolga si la llista de la compra és privada o compartida en parella sense complicar la pantalla."
      },
      {
        "id": "toni_f5",
        "nom": "Toni (Fase 5)",
        "edat": 19,
        "rol": "veí (estudiant d'FP amb Android de gamma mitjana)",
        "poble": "La Torre de les Maçanes",
        "descripcio_curta": "Redefinició de la Fase 5: ja no és l'escèptic de 49 anys sinó un jove impacient amb apps lentes o plenes de text; va respondre en castellà.",
        "rondes": [
          "R05"
        ],
        "citacio": "Una cinta compacta que, si vull, desplega la targeta d'hostaleria; si l'app és lenta o plena de menús, la deixe."
      }
    ],
    "dolors": [
      {
        "id": "DOL-01",
        "titol": "Falsos no llegits i «(3) Xat» per a qui encara no té compte",
        "descripcio": "Sense sessió, l'arrel / porta a /xat amb el títol «(3) Xat» i tres globus «1» de mostra amb l'hora d'ara: el Foraster creu que algú li ha escrit.",
        "perfils": [
          "pepa",
          "llorenc",
          "jordi",
          "pau",
          "toni"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "/ → /xat (sense sessió)",
        "estat": "resolt",
        "versio_o_kit": "v1.2.16 (B5) i v1.2.17 (IDEA-313)",
        "evidencia": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_1337_auditoria_claude_v1_2_16_4botigues_alpha_svn_foraster_i_zero_apk.md (T-05); src/sections/xat/components/FakeChatOnboarding.jsx (noLlegits: 0)",
        "nota": "Comprovat a producció el 21-11 a les 14:22 amb un GET: títol «Xat | Sóc de Poble» i 0 no llegits. També el registren les dades de la #01, la #03 (F-UX-05) i la #04 (R1)."
      },
      {
        "id": "DOL-02",
        "titol": "La porta no explica què és Sóc de Poble ni què pot fer el Foraster",
        "descripcio": "En aterrar a /xat hi ha cinc elements blaus primaris competint i cap frase que diga on has arribat; les veus demanen una guia breu o un botó clar cap a la seua gent.",
        "perfils": [
          "rosa",
          "empar",
          "jordi",
          "pepa",
          "aina",
          "toni",
          "llorenc_f5",
          "toni_f5"
        ],
        "ronda": "R01",
        "severitat": "P1",
        "superficie": "/xat (sense sessió)",
        "estat": "resolt",
        "versio_o_kit": "v1.2.17 (IDEA-313: targeta del Foraster amb títol, 2 línies, un sol «Entrar» i ✕ recordada)",
        "evidencia": "src/sections/xat/components/AcollidaForasterXat.jsx; _investigacio_ia_de_poble/261121_reunio_fase5_placa_assaig/DOSSIER_GEMINI_I_8_ESCOLES_NODE0_REUNIO_FASE5_FORASTER.md (§3, D-F5-1)",
        "nota": "La targeta literal del Mestre substituïx les propostes A (cinta) i B (hostaleria) de R32.26 que es van votar a la Fase 5. Cap persona real l'ha provada."
      },
      {
        "id": "DOL-03",
        "titol": "Massa noms per a la mateixa porta d'entrada",
        "descripcio": "Entrar, Connectar-se, Registrar-se, Crear compte, Entrar al compte i Entrar amb Google conviuen a la capçalera, al Xat i als diàlegs.",
        "perfils": [
          "toni",
          "pepa",
          "jordi",
          "vicent",
          "rosa",
          "llorenc"
        ],
        "ronda": "R01",
        "severitat": "P2",
        "superficie": "capçalera, /xat, /registre",
        "estat": "resolt",
        "versio_o_kit": "v1.2.16 (B9: un sol «Entrar» en 5 llengües)",
        "evidencia": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_1337_auditoria_claude_v1_2_16_4botigues_alpha_svn_foraster_i_zero_apk.md (T-05, T-06); src/config/idiomes/ca.js (0 ocurrències de «Connectar-se»)",
        "nota": "El «+ Connectar», que vol dir una altra cosa, continua obert (DOL-04)."
      },
      {
        "id": "DOL-04",
        "titol": "«+ Connectar» porta a un formulari, i l'avís deia «Mode Foraster actiu» com si fora un error",
        "descripcio": "Abans de la v1.2.21: El botó blau gran «+» de Mur i Mercat és «Connectar» (vincular), obri «On vols connectar-ho?» del Bloc de notes i mostra «Mode Foraster actiu» com un fre, no com un estat amable.",
        "perfils": [
          "carme",
          "llorenc",
          "jordi",
          "toni"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "/connectar i botó + de Mur i Mercat",
        "estat": "obert",
        "versio_o_kit": "v1.2.21 (build 26) · R32.35b lot 02 (només el to de l’avís)",
        "evidencia": "src/sections/connectar/ConnectarSection.jsx:1172 i :1303 (<Alerta to=\"info\">); src/config/idiomes/ca.js:1486 ('section.connectar.foraster.titol': 'Benvinguda en Mode Foraster'); el «+» continua a src/sections/connectar/ConnectarSection.jsx:1152 i :1297 («On vols connectar-ho?»)",
        "nota": "La v1.2.21 canvia el to: /connectar i la previsualització d'un enllaç de fora al Bloc de notes donen la benvinguda en Mode Foraster amb un avís informatiu, no d'error, en les cinc llengües. Codex i Gemini demanaven dignificar la paraula Foraster, no esborrar-la, i així s'ha fet. Queda el camí: el «+» de Mur i Mercat continua portant al formulari «On vols connectar-ho?»."
      },
      {
        "id": "DOL-05",
        "titol": "L'escut del navegador intern no reconeixia WhatsApp ni el WebView d'Android",
        "descripcio": "Dins del navegador integrat de WhatsApp, «Entrar amb Google» pot fallar sense cap avís d'obrir-ho en Chrome.",
        "perfils": [
          "llorenc",
          "pepa",
          "pau",
          "rosa",
          "vicent",
          "toni",
          "empar"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "/registre obert des de WhatsApp",
        "estat": "resolt",
        "versio_o_kit": "v1.2.16 (B7)",
        "evidencia": "src/utils/navegadorIncrustat.js:118-149; socdepoble.org/_wiki_de_poble/04_escriptori/261121_1337_auditoria_claude_v1_2_16_4botigues_alpha_svn_foraster_i_zero_apk.md (T-05)",
        "nota": "Cap prova en un Android físic dins de WhatsApp (1337, Límits). A la #01 Empar i Pepa ja deien que l'enllaç de WhatsApp no els funcionava."
      },
      {
        "id": "DOL-06",
        "titol": "Després d'entrar no torna a l'enllaç que s'havia obert",
        "descripcio": "L'entrada aterrava sempre al perfil; qui obria un acte o un anunci perdia la missió, també quan l'enllaç duia fbclid o utm_*.",
        "perfils": [
          "pau",
          "jordi",
          "toni",
          "llorenc_f5"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "/registre → tornada (rutaEntrada)",
        "estat": "resolt",
        "versio_o_kit": "v1.2.16 (B8b, amb neteja de fbclid i utm_*)",
        "evidencia": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_1337_auditoria_claude_v1_2_16_4botigues_alpha_svn_foraster_i_zero_apk.md (T-05); src/config/rutaEntrada.js (tornadaSegura); _investigacio_ia_de_poble/261120_placa_assaig_04_codex_mercat_friccio_i_arquitectura_ux/DOSSIER_ASSAIG_04_MERCAT_FRICCIO_RETENCIO_I_ARQUITECTURA_UX.md (§3, R1)",
        "nota": "La tornada per redirecció de Google (CA-A3) no s'ha vist en cap aparell."
      },
      {
        "id": "DOL-07",
        "titol": "Google natiu falla amb [28444] a l'app de Play",
        "descripcio": "Si la SHA-1 de la signatura de Google Play no és al client OAuth d'Android, «Continua amb Google» dona «Google no reconeix esta instal·lació de l'app».",
        "perfils": [
          "llorenc"
        ],
        "ronda": "R01",
        "severitat": "P0",
        "superficie": "app Android (Play alpha) › Continua amb Google",
        "estat": "obert",
        "versio_o_kit": "declarat corregit a Google Cloud (acta 261121_0134), sense prova en aparell",
        "evidencia": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md (T-03); _investigacio_ia_de_poble/261120_placa_assaig_01_onboarding_mobil_notificacions_i_ux_social/evidencia_cdp_pantalles_android.json (fetsCodiNatiu); socdepoble.org/_wiki_de_poble/04_escriptori/261121_1337_auditoria_claude_v1_2_16_4botigues_alpha_svn_foraster_i_zero_apk.md (Límits)",
        "nota": "El guió del Contrast humà (V2, missió 3) té com a oracle «zero [28444] a l'alpha»: és la primera prova pendent."
      },
      {
        "id": "DOL-08",
        "titol": "L'enllaç de WhatsApp mai obri l'app instal·lada",
        "descripcio": "No hi ha App Links: cap intent-filter VIEW amb autoVerify i cap empremta a assetlinks.json (404 a .org i .cat); WhatsApp porta sempre al navegador.",
        "perfils": [
          "llorenc",
          "carme",
          "pau",
          "rosa",
          "pepa",
          "toni"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "enllaços https → app Android",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "scripts/botigues/associacio-apps.json (sha256_cert_fingerprints buit); android/app/src/main/AndroidManifest.xml (sense VIEW ni autoVerify); socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md (T-03)",
        "nota": "D-M13: ajornats fins que l'app d'Android siga pública; el pla de MarIA els volia a la v1.2.16."
      },
      {
        "id": "DOL-09",
        "titol": "«Descarrega l'App» no descarrega res a Android",
        "descripcio": "Google Play només és per als verificadors convidats (passos en anglés) i no hi ha APK públic: el veí normal no pot instal·lar l'app.",
        "perfils": [
          "toni",
          "jordi",
          "pau",
          "pepa",
          "rosa",
          "carme",
          "llorenc"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "/descarregues i botó «Descarrega l'App» del Xat",
        "estat": "decisio_mestre",
        "versio_o_kit": "v1.2.16: ZERO APK fora de botiga i pista alpha (build 21)",
        "evidencia": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_1337_auditoria_claude_v1_2_16_4botigues_alpha_svn_foraster_i_zero_apk.md (T-04, Verificació); _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/evidencia/08_toni/t02_descarrega.json",
        "nota": "Per ordre del Mestre (261121 01:32) cap APK fora de botiga; l'obertura pública depén dels 14 dies de la prova tancada amb 19 verificadors. Queda codi mort d'APK per a la v1.2.17."
      },
      {
        "id": "DOL-10",
        "titol": "Alta per correu en dos viatges i tornada que s'obri fora de l'app",
        "descripcio": "Cal confirmar al correu i tornar a entrar; dins de l'app la tornada és https://localhost/registre?sdp_auth=alta, que s'obri al navegador i no a l'app.",
        "perfils": [
          "llorenc",
          "vicent"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "/registre (correu) dins de l'app",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/personas/llorenc.json (ronda1.friccions)",
        "nota": "No reverificat en aparell."
      },
      {
        "id": "DOL-11",
        "titol": "Registre llarg: 6–7 camps, 9 pobles i contrasenya de 10 caràcters",
        "descripcio": "Per correu cal omplir molts camps, triar entre 9 pobles, marcar una casella i confirmar; Google ho salva en part amb un toc.",
        "perfils": [
          "toni",
          "vicent",
          "jordi",
          "llorenc"
        ],
        "ronda": "R01",
        "severitat": "P2",
        "superficie": "/registre",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "src/sections/onboarding/onboardingModel.js:15 (LONGITUD_MINIMA_CONTRASENYA = 10); _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/evidencia/08_toni/t04_registrar.json",
        "nota": "A la #01 la queixa era genèrica («no trobava on posar les dades»)."
      },
      {
        "id": "DOL-12",
        "titol": "Pantalla en blanc mentre comprova la sessió",
        "descripcio": "En obrir un enllaç, el primer segon era un buit color crema sense cap text visible.",
        "perfils": [
          "pepa",
          "toni"
        ],
        "ronda": "R02",
        "severitat": "P3",
        "superficie": "arrencada de qualsevol ruta",
        "estat": "resolt",
        "versio_o_kit": "v1.2.16 (B11a: text de càrrega visible)",
        "evidencia": "src/app/App.jsx:211-229 (RouteFallback)",
        "nota": "A les sondes era el servidor de desenvolupament; a producció era una sospita."
      },
      {
        "id": "DOL-13",
        "titol": "Vocabulari intern i textos en anglés al camí d'entrada",
        "descripcio": "Abans de la v1.2.21: «Mas Electrònic», «Mode Foraster», «padró», «PWA», «Node principal», «403 disallowed_useragent», «Become a tester», /versions amb Onades i builds i una imatge en anglés.",
        "perfils": [
          "toni",
          "pepa",
          "llorenc",
          "rosa",
          "pau_f5"
        ],
        "ronda": "R02",
        "severitat": "P3",
        "superficie": "entrada, /descarregues, /versions",
        "estat": "obert",
        "versio_o_kit": "v1.2.21 (build 26) · R32.35b lot 02 (només una part)",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/personas/toni.json; _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/personas/rosa.json",
        "nota": "La v1.2.21 lleva «403 disallowed_useragent» de l'avís d'OAuth dins d'una app i l'explica en paraules planeres, en les cinc llengües (`src/utils/navegadorIncrustat.js`). Queda la resta del vocabulari intern del camí d'entrada. La portada en anglés de la Wiki ja estava resolta (DOL-44)."
      },
      {
        "id": "DOL-14",
        "titol": "Hui no sona res: el push del Xat no està actiu a producció",
        "descripcio": "El bundle de producció porta la clau VAPID buida (clau:void 0) i el worker respon 401 al tick: la píndola «Activar notificacions del xat» ni es pinta.",
        "perfils": [
          "llorenc",
          "pepa",
          "carme",
          "pau",
          "rosa",
          "vicent",
          "jordi",
          "toni",
          "empar"
        ],
        "ronda": "R01",
        "severitat": "P0",
        "superficie": "/xat › píndola d'avisos (web)",
        "estat": "decisio_mestre",
        "versio_o_kit": "v1.2.16 publicada sense VITE_PUSH_VAPID_PUBLICA (decisió D-4)",
        "evidencia": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_1337_auditoria_claude_v1_2_16_4botigues_alpha_svn_foraster_i_zero_apk.md (T-03: tick 401, cap bundle porta la clau); socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md (T-02); _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/evidencia/08_toni/t40_bundle_produccio_vapid.txt",
        "nota": "Falten els passos del Mestre (schema.sql, secrets, desplegar notifica-xat i notifica-xat-desperta, cron, SDP_PUSH_ACTIU, activa.sql) i després recompilar amb la clau. Denominador comú de les 8 veus de la #02."
      },
      {
        "id": "DOL-15",
        "titol": "El push natiu d'Android i iOS està apagat",
        "descripcio": "L'app de Play i la de TestFlight no sonaran: el push natiu espera VITE_SDP_PUSH_NATIU=1, que depén de la política /legal 2.6.",
        "perfils": [
          "llorenc",
          "pau",
          "pepa"
        ],
        "ronda": "R02",
        "severitat": "P0",
        "superficie": "apps natives (Play alpha i TestFlight)",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md (T-02); socdepoble.org/_wiki_de_poble/04_escriptori/261121_1337_auditoria_claude_v1_2_16_4botigues_alpha_svn_foraster_i_zero_apk.md (Límits: /legal 2.6 no aplicada)",
        "nota": "La migració 2611080440 l'aplica el Mestre amb les seues mans; el text 2.6 només existix en català i amb data retroactiva."
      },
      {
        "id": "DOL-16",
        "titol": "Cap publicació avisa ningú: ni bàndols, ni actes, ni productes",
        "descripcio": "L'únic disparador d'avisos és «after insert on public.xat_missatges»; publicar al Mur, al Mercat o al Calendari no encua cap avís.",
        "perfils": [
          "pepa",
          "llorenc",
          "carme",
          "pau",
          "rosa",
          "vicent",
          "jordi",
          "toni",
          "empar"
        ],
        "ronda": "R01",
        "severitat": "P0",
        "superficie": "Mur, Mercat, Calendari → push",
        "estat": "decisio_mestre",
        "versio_o_kit": "motor de bàndols R32.25 lot_03 a l'arbre de la v1.2.17, apagat per bandera (push_poble_actiu = 'no')",
        "evidencia": "supabase/migrations/20261121090000_r32_25_push_directes_i_bandols.sql:29; socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md (T-02); _investigacio_ia_de_poble/261120_placa_assaig_04_codex_mercat_friccio_i_arquitectura_ux/DOSSIER_ASSAIG_04_MERCAT_FRICCIO_RETENCIO_I_ARQUITECTURA_UX.md (§9)",
        "nota": "Pendents D-M6 (2 per 24 h, 10 min, 22–08, opt-in), /legal 2.7, el canal Android poble_urgent i una prova física. Codex: publicar no prova avís."
      },
      {
        "id": "DOL-17",
        "titol": "L'avís és cec: «Sóc de Poble · Tens missatges nous»",
        "descripcio": "L'avís no diu qui ni què i obri el Xat en general; sense cobertura, no se sap si és el tall d'aigua o un meme.",
        "perfils": [
          "toni",
          "vicent",
          "rosa",
          "pepa",
          "carme",
          "pau"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "notificació del sistema",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "supabase/functions/notifica-xat/natius.js:40-46; _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/ronda2_debat_creuat_placa.md (D-M7)",
        "nota": "D-B8S-1 manté cec el xat privat per privacitat; el títol del bàndol és l'objectiu del canal 2."
      },
      {
        "id": "DOL-18",
        "titol": "No hi ha campaneta ni es poden triar els avisos",
        "descripcio": "«Notificacions» està «En construcció», a quatre tocs dins del Xat i només amb sessió; ningú no pot dir quins avisos vol i quins no.",
        "perfils": [
          "llorenc",
          "pepa",
          "rosa",
          "jordi",
          "empar",
          "toni",
          "pau",
          "vicent"
        ],
        "ronda": "R01",
        "severitat": "P1",
        "superficie": "/xat › Ajustos › Notificacions",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "src/sections/xat/ajustosXat.js:278-284 (construccio); socdepoble.org/_wiki_de_poble/04_escriptori/261121_0229_auditoria_codex_fase5_foraster_i_r32_25.md (C04)",
        "nota": "D-M9: campaneta ajornada fins que el tub funcione; Codex recomana el permís contextual (C04-A) abans de preferències per canal (C04-B)."
      },
      {
        "id": "DOL-19",
        "titol": "El canal «Beta Testers» és mut",
        "descripcio": "És un canal de comunitat i calla amb push_xat_generals apagat: els verificadors no rebrien res pel lloc on se'ls parla.",
        "perfils": [
          "llorenc"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "/xat › Beta Testers",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/ronda2_debat_creuat_placa.md (Annex A.3); socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md (T-02)",
        "nota": "Proposta: un grup privat «Verificadors d'Android», que sí que sona, i un missatge honest. No consta que s'haja creat."
      },
      {
        "id": "DOL-20",
        "titol": "Què fa un bàndol urgent de nit",
        "descripcio": "Callar i quedar dalt del Mur, sonar a les 08:00 si encara és vigent, o trencar el silenci per una emergència civil amb doble confirmació.",
        "perfils": [
          "rosa",
          "llorenc",
          "pepa",
          "jordi",
          "toni",
          "vicent",
          "pau_f5",
          "rosa_f5",
          "llorenc_f5"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "política d'avisos del canal 2",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0229_auditoria_codex_fase5_foraster_i_r32_25.md (C04, dissens de nit); _investigacio_ia_de_poble/261121_reunio_fase5_placa_assaig/DOSSIER_GEMINI_I_8_ESCOLES_NODE0_REUNIO_FASE5_FORASTER.md (D-F5-6)",
        "nota": "D-18 i D-F5-6. R32.25 prepara la variant sense so; l'ajornament costaria entre 4 i 8 jornades més (estimació de Codex). Per a una emergència, el 112."
      },
      {
        "id": "DOL-21",
        "titol": "La primera targeta del Mur era maquinària interna amb Markdown cru",
        "descripcio": "El Mur obria amb «El sistema nerviós: skills, tractors i repositoris oberts», amb ** i ` en cru, i portava a una Wiki amb unes noranta icones.",
        "perfils": [
          "pepa",
          "carme",
          "jordi",
          "pau",
          "rosa",
          "toni",
          "llorenc"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "/mur",
        "estat": "resolt",
        "versio_o_kit": "v1.2.16 (B6: mur: false)",
        "evidencia": "socdepoble.org/_wiki_de_poble/02_saber/sistema_nervios_skills_i_repositoris.md:10",
        "nota": "També ho veuen Gemini (#03) i Jordi #03."
      },
      {
        "id": "DOL-22",
        "titol": "El poble està buit de gent",
        "descripcio": "14 de 15 targetes del Mur i del «Tot» de la fitxa són del compte de la plataforma; el directori té 3 fitxes i cap veí, ni Ajuntament ni associacions.",
        "perfils": [
          "toni",
          "jordi",
          "pepa"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "/mur i /pobles/:slug",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/evidencia/08_toni/t20_mur_llarg.json; _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/ronda2_debat_creuat_placa.md (§4.2, D-M4)",
        "nota": "Bloc C de contingut: «la porta neta i l'Ajuntament amb actes reals van junts abans de convidar ningú». Codex (E5): la primera invitació ha de dur un objecte que existisca."
      },
      {
        "id": "DOL-23",
        "titol": "La fitxa del poble no deixa lloc a res útil",
        "descripcio": "Obri «Tot» amb El Farcellet Digital; entre la foto, la barra taronja i el logotip, el bàndol vigent o el pròxim acte queden fora de la primera pantalla.",
        "perfils": [
          "llorenc",
          "jordi",
          "vicent"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "/pobles/:slug",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/comparativa_claude_vs_node0_i_conclusions.md (D8, E3); socdepoble.org/_wiki_de_poble/04_escriptori/261121_0040_auditoria_gemini_placa_assaig_03_ux_atractiu_i_referents.md (F-UX-01)",
        "nota": "Decisions B6c (D-27), RegioAlertesVigents a la fitxa (D-M5) i senseLogo (D-26). El chrome=\"feed\" de la v1.2.17 només és a Mur, Mercat i Calendari."
      },
      {
        "id": "DOL-24",
        "titol": "Ofec vertical: cap publicació, producte ni dia a la primera pantalla",
        "descripcio": "Tres barres, un tercer logotip gegant, H1, botó, subtítol, entradilla i «Escolta la IAIA» ocupen 685–895 px abans del contingut de Mur, Mercat i Calendari.",
        "perfils": [
          "marta",
          "carme",
          "vicent",
          "toni",
          "jordi",
          "pepa",
          "aina"
        ],
        "ronda": "R03",
        "severitat": "P1",
        "superficie": "/mur, /mercat, /calendari",
        "estat": "resolt",
        "versio_o_kit": "v1.2.17 (chrome=\"feed\")",
        "evidencia": "src/sections/mur/MurSection.jsx:309; src/sections/mercat/MercatSection.jsx:65; src/sections/calendari/CalendariSection.jsx:344; socdepoble.org/_wiki_de_poble/04_escriptori/261121_0040_auditoria_gemini_placa_assaig_03_ux_atractiu_i_referents.md (F-UX-01)",
        "nota": "La conclusió és certa a les captures, però el JSON de Gemini comptava 0 ítems en 144/144 escenaris (selector trencat). Cap mesura hit-test després del canvi; l'arnés V2 sobre la v1.2.16 no troba cap primer objecte útil a /mur. Llorenç i Pau (Fase 5) avisen que compactar no ha d'esborrar la identitat del poble."
      },
      {
        "id": "DOL-25",
        "titol": "Massa botons repetits i menús saturats",
        "descripcio": "311 tocables al Mur, barra blava de set icones sense nom, «Traduir · Comentar · Compartir · Connectar amb» a cada targeta, 16 filtres a la Cerca, 12 entrades a «Sistema» i un Panell de Control de 164 tocables titulat «eines d'administració i gestió».",
        "perfils": [
          "pepa",
          "rosa",
          "jordi",
          "empar",
          "toni",
          "llorenc",
          "carme",
          "aina",
          "toni_f5"
        ],
        "ronda": "R01",
        "severitat": "P2",
        "superficie": "/mur, menú lateral, /control",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/evidencia/base/senior_mur.json; _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/personas/jordi.json; socdepoble.org/_wiki_de_poble/04_escriptori/261121_0229_auditoria_codex_fase5_foraster_i_r32_25.md (C02)",
        "nota": "A la #01 és la queixa més repetida («tants botons, tants menús»). Codex: menys controls no garantix comprensió."
      },
      {
        "id": "DOL-26",
        "titol": "La iaieta de la barra negra sembla el botó de la lletra gran",
        "descripcio": "La silueta d'àvia amb bastó és «IAIA MarIA» i porta a /iaia; una persona major la toca pensant que és «per a gent gran».",
        "perfils": [
          "pepa"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "header.bar-black (IaiaIcon)",
        "estat": "en_kit",
        "versio_o_kit": "R32.28 lot_02 (píndola amb ròtul «IAIA») per a la v1.2.18",
        "evidencia": "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/README_INTEGRACIO.md; socdepoble.org/_wiki_de_poble/04_escriptori/261121_1801_auditoria_gemini_r32_28_senior_c2_iaia_i_assaig_placa_v2.md (T-02); src/app/App.jsx:922-928 (encara icona muda)",
        "nota": "Idea emergent E1: dues lectures independents (Pepa #02 i Gemini #03) hi cauen. El kit R32.28 i la matriu de Gemini l'atribuïxen a «Rosa, 78 anys», que no existix en cap ronda."
      },
      {
        "id": "DOL-27",
        "titol": "El Mode Sènior no escalava el Xat i vivia amagat al Panell",
        "descripcio": "El Mode Sènior era al Panell de Control, fora de la primera pantalla; al Xat pujava el contrast però no la mida, i no hi havia cap xip «Lletra gran».",
        "perfils": [
          "pepa",
          "rosa",
          "llorenc_f5"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "/xat (accés) i Mode Sènior",
        "estat": "resolt",
        "versio_o_kit": "v1.2.16 (B11: xip «Lletra gran» a l'accés del Xat)",
        "evidencia": "src/sections/xat/XatSection.jsx:2431-2446; socdepoble.org/_wiki_de_poble/04_escriptori/261121_1337_auditoria_claude_v1_2_16_4botigues_alpha_svn_foraster_i_zero_apk.md (T-05)",
        "nota": "La mesura de 19,06 px era d'un paràgraf ocult (.sdp-nomes-lector, correcció VA2 recollida per Codex): no provava que la lletra visible no canviara. El contrast sí que canviava un 13 % dels píxels."
      },
      {
        "id": "DOL-28",
        "titol": "El xip «Lletra gran» es partia en 2 o 3 pisos i tapava «Entrar»",
        "descripcio": "A 360 px el xip feia 74,8 px (2 pisos) i, en Sènior, 107,5 px (3 pisos), i empenyia «Entrar / Registrar-se» davall de la barra inferior.",
        "perfils": [
          "pepa"
        ],
        "ronda": "V2",
        "severitat": "P1",
        "superficie": "/xat › accés (360×800)",
        "estat": "en_kit",
        "versio_o_kit": "R32.28 lot_01 (C-2) per a la v1.2.18",
        "evidencia": "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/evidencies/comparativa_subpixel_abans_vs_despres_5llengues.json; socdepoble.org/_wiki_de_poble/04_escriptori/261121_1801_auditoria_gemini_r32_28_senior_c2_iaia_i_assaig_placa_v2.md (T-01)",
        "nota": "Decisió C-2 que la v1.2.16 va deixar al Mestre (1337, Límits). Després del kit: 48 px en normal i 56 px en Sènior a 360 px."
      },
      {
        "id": "DOL-29",
        "titol": "A 320 px la barra inferior tapava «Entrar» i «Registrar-se»",
        "descripcio": "Amb el kit R32.28 aplicat, a 320×800 la primera fila creixia de 94,8 a 108 px i la segona fila quedava tallada per nav.mobile-nav en les 5 llengües.",
        "perfils": [],
        "ronda": "V2",
        "severitat": "P2",
        "superficie": "/xat › accés (320×800)",
        "estat": "resolt",
        "versio_o_kit": "v1.2.21 (build 26) · R32.35b lot 01 i costura de R32.41",
        "evidencia": "_investigacio_ia_de_poble/261122_claude_integracio_v1_2_21/evidencies/cdp_v1221_prova.json (Chrome sobre el codi integrat de la v1.2.21, /xat a 320×800 al final de l'scroll: «Entrar» i «Registrar-se» acaben a 712 px i nav.mobile-nav comença a 731 px, en les cinc llengües, amb la Lletra gran i sense); abans: _investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/evidencies/comparativa_subpixel_abans_vs_despres_5llengues.json (anyFila2ClippedDespres: true)",
        "nota": "Des de la v1.2.21, a 320×800 l'accés del Xat compacta l'alerta per davall de 360 px (`src/css/diferit-mode-senior.css`) i la barra inferior ja no tapa «Entrar» ni «Registrar-se», tampoc amb la Lletra gran. Mesurat amb Chrome sobre el codi integrat de la v1.2.21, a 320×800, en les cinc llengües i amb la Lletra gran i sense."
      },
      {
        "id": "DOL-30",
        "titol": "Mode Sènior actiu per defecte o a triar",
        "descripcio": "Toni #03 demana que la presentació àmplia siga el punt de partida per a tothom; la resta el volen visible i opcional.",
        "perfils": [
          "toni"
        ],
        "ronda": "R03",
        "severitat": "P3",
        "superficie": "Mode Sènior (tota l'app)",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0229_auditoria_codex_fase5_foraster_i_r32_25.md (C08 B/C); _investigacio_ia_de_poble/261120_placa_assaig_03_gemini_ux_atractiu_i_referents_mundials/evidencia_ronda2_debat_creuat_assaig_03.json",
        "nota": "Dissens que Codex demana no diluir en «tots volen un mode opcional»."
      },
      {
        "id": "DOL-31",
        "titol": "El Mode Bancal quasi no es nota i està amagat",
        "descripcio": "Abans de la v1.2.21: Canvia entre el 0,49 i l'1,22 % dels píxels i viu a Xat › Ajustos › Aparença; la lluna de la capçalera posa mode fosc.",
        "perfils": [
          "vicent"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "Mode Bancal",
        "estat": "obert",
        "versio_o_kit": "v1.2.21 (build 26) · R32.35b lot 01 (només el contrast)",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/personas/vicent.json; src/css/tokens.css:810-817",
        "nota": "La v1.2.21 calibra el contrast AAA del Mode Bancal en clar i en fosc (src/css/tokens.css). El kit R32.35b va mesurar a /pobles que passava de canviar entre el 0,49 i l'1,22 % dels píxels a canviar-ne el 39 % en clar i el 64 % en fosc, abans que la costura de R32.41 ajustara quatre valors. Continua amagat a Xat › Ajustos › Aparença, i la lluna de la capçalera continua posant el mode fosc."
      },
      {
        "id": "DOL-32",
        "titol": "Sense cobertura, la web no ensenya res",
        "descripcio": "L'app és online-first: amb una ratlla de cobertura ix «Sense connexió» o «Hi ha hagut un problema» i el dispositiu no en guarda cap còpia.",
        "perfils": [
          "vicent"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "service worker i errors de ruta",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/personas/vicent.json; public/sw.js:444-476 (citat per Vicent)",
        "nota": "No provat amb la xarxa tallada."
      },
      {
        "id": "DOL-33",
        "titol": "El Calendari obria en un mes passat i oferia «Assistiré» en actes acabats",
        "descripcio": "El 20 de novembre obria a l'octubre i proposava «Assistiré» per a l'Aplec del gener del 2023.",
        "perfils": [
          "pepa",
          "pau",
          "vicent",
          "jordi",
          "toni",
          "aina"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "/calendari",
        "estat": "resolt",
        "versio_o_kit": "v1.2.16 (B10)",
        "evidencia": "src/sections/calendari/CalendariSection.jsx:267-268; socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md (T-05)",
        "nota": "Ho veuen tres places (#02, #03 i #04). Queda un límit: repeticions amb UNTIL en UTC fora del fus de Madrid (v1.2.17)."
      },
      {
        "id": "DOL-34",
        "titol": "No hi ha cap acte futur real al Calendari",
        "descripcio": "Només l'Aplec del 2023, cursos acabats el 14 de novembre i actes d'altres pobles: no es pot provar ni l'RSVP ni l'avís de la vespra.",
        "perfils": [
          "pau",
          "vicent",
          "jordi",
          "toni"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "/calendari",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/evidencia/pau/12_calendari_hui.json; _investigacio_ia_de_poble/261120_placa_assaig_04_codex_mercat_friccio_i_arquitectura_ux/DOSSIER_ASSAIG_04_MERCAT_FRICCIO_RETENCIO_I_ARQUITECTURA_UX.md (§3, R6)",
        "nota": "Palanca 2 de la #02: carregar els actes reals de dues setmanes (D-M4)."
      },
      {
        "id": "DOL-35",
        "titol": "El Calendari és dins de «Sistema»",
        "descripcio": "Al menú lateral només es veuen Xat, Mur, Mercat, Pobles i Notes; el Calendari és al desplegable «Sistema», al costat de Disseny i Constitució.",
        "perfils": [
          "pepa",
          "pau",
          "jordi",
          "vicent",
          "toni",
          "llorenc"
        ],
        "ronda": "R01",
        "severitat": "P2",
        "superficie": "menú lateral",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "src/app/App.jsx:131-137 (SECCIONS_VISIBLES, ordre del Mestre 261007); _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/ronda2_debat_creuat_placa.md (D-M12)",
        "nota": "A la #01 Llorenç ja deia que no sabia on anar per al calendari."
      },
      {
        "id": "DOL-36",
        "titol": "«Assistiré» només queda al navegador i «Compta amb mi» no compta ningú més",
        "descripcio": "L'RSVP es desa en localStorage: l'organitzador no ho sap i ningú no veu qui hi va.",
        "perfils": [
          "pau",
          "vicent",
          "aina",
          "jordi"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "/calendari › acte",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "src/sections/calendari/rsvpEsdeveniments.js (ambit: 'navegador-local'); socdepoble.org/_wiki_de_poble/04_escriptori/261121_0229_auditoria_codex_fase5_foraster_i_r32_25.md (C05-C)",
        "nota": "D-M11 («Hi vaig» compartit). Codex: és un contracte de dades nou amb aforament i confirmació de l'organització, no un canvi de pell."
      },
      {
        "id": "DOL-37",
        "titol": "L'RSVP deia ok:true encara que no es poguera desar",
        "descripcio": "desaRsvpEsdeveniment no mirava el resultat de setVal: amb la quota plena, el veí veia una confirmació falsa.",
        "perfils": [],
        "ronda": "R04",
        "severitat": "P2",
        "superficie": "/calendari › RSVP",
        "estat": "resolt",
        "versio_o_kit": "v1.2.17 (R32.25 lot_02: RSVP només confirmat quan es desa)",
        "evidencia": "src/sections/calendari/rsvpEsdeveniments.js (PERSISTENCIA_NO_CONFIRMADA)",
        "nota": "Troballa de codi de Codex, no d'una veu."
      },
      {
        "id": "DOL-38",
        "titol": "El Calendari Agrícola no tenia porta, i l'olivera no hi és en plena collita",
        "descripcio": "Abans de la v1.2.21: /app/calendari-agricola dona «No coneixem esta app»; només s'hi arriba per la setena targeta del Mur (Banc de llavors) i no hi ha olivera entre 45 varietats hortícoles.",
        "perfils": [
          "vicent"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "/app/calendari-agricola i Banc de llavors",
        "estat": "obert",
        "versio_o_kit": "v1.2.21 (build 26) · R32.37 lot 01 i R32.38 lot 02 (la porta i la interfície)",
        "evidencia": "src/apps/plataforma/RutaApps.jsx:62 ('calendari-agricola' → /page/banc-de-llavors?llibre=calendari; a la v1.2.20 no hi havia cap àlies); src/sections/patrimoni/i18nBibliotecaAgricola.js (rètols dels tres llibres en cinc llengües); src/data/patrimoni/bancLlavors.js (cap olivera entre les varietats)",
        "nota": "La v1.2.21 dona porta al Calendari Agrícola: /app/calendari-agricola porta a /page/banc-de-llavors?llibre=calendari, i els rètols dels tres llibres es lligen en cinc llengües; el contingut de les fitxes de les varietats continua en valencià. L'olivera encara no és entre les varietats. Proposta no arbitrada de la #02 (D-M12)."
      },
      {
        "id": "DOL-39",
        "titol": "Publicar un producte o un acte passa per l'editor de notes",
        "descripcio": "«Publicar un producte» obri el Bloc de notes amb 9 carpetes, 7 categories i 49–60 etiquetes; cap preu ni càmera a la vista; publicar al Mur tarda més de 5 s.",
        "perfils": [
          "carme",
          "pau",
          "rosa"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "/mercat i /mur → /notes?ambit=…",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "src/sections/mercat/MercatSection.jsx:27 (RUTA_PUBLICAR_PRODUCTE = '/notes?ambit=mercat'); socdepoble.org/_wiki_de_poble/04_escriptori/261121_0229_auditoria_codex_fase5_foraster_i_r32_25.md (C06-A); _investigacio_ia_de_poble/261120_placa_assaig_04_codex_mercat_friccio_i_arquitectura_ux/DOSSIER_ASSAIG_04_MERCAT_FRICCIO_RETENCIO_I_ARQUITECTURA_UX.md (§3, R3)",
        "nota": "Idea d'or de Carme: «📸 Foto al Mercat» en una sola pantalla. Codex: cap publicació per autodesat ocult."
      },
      {
        "id": "DOL-40",
        "titol": "Dos preus per a la mateixa botella d'oli i dos formats de preu",
        "descripcio": "La llista diu 8,30 € i la fitxa «Format i preu oficial 9,90 €»; els preus apareixen com «15.00€» i «4,95 €».",
        "perfils": [
          "vicent",
          "carme",
          "jordi",
          "toni"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "/mercat",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/evidencia/base/normal_mercat.json; _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/personas/vicent.json",
        "nota": "Palanca 4 de la #02: un sol preu abans de convidar el forn. No reverificat en dades de la v1.2.17."
      },
      {
        "id": "DOL-41",
        "titol": "Mercat en una sola columna amb productes d'una pantalla sencera",
        "descripcio": "Cada producte fa uns 940 px d'alt en mòbil i la pastilla del preu escanya el títol; no hi ha graella de 2 columnes.",
        "perfils": [
          "vicent",
          "carme",
          "marta"
        ],
        "ronda": "R03",
        "severitat": "P2",
        "superficie": "/mercat (360×800)",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0040_auditoria_gemini_placa_assaig_03_ux_atractiu_i_referents.md (F-UX-01, proposta moderada)",
        "nota": "La v1.2.17 lleva la capçalera (DOL-24) però no canvia la targeta."
      },
      {
        "id": "DOL-42",
        "titol": "L'Ajuntament no és al directori i no es pot crear",
        "descripcio": "Entitats i Grups només mostra Sóc de Poble, i el servidor refusa crear entitats o ajuntaments: només es reclamen.",
        "perfils": [
          "rosa",
          "vicent",
          "jordi"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "/perfil › Entitats i Grups; RPC de creació d'organitzacions",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "supabase/migrations/2609281500_lema_entradilla_256.sql:94-95; _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/evidencia/05_rosa/12_perfil_entitats.json",
        "nota": "Condició de la palanca 1 (bàndols): sembrar el city_hall de La Torre i aprovar-ne la reclamació (D-M4). Cap altra plaça ho va tocar."
      },
      {
        "id": "DOL-43",
        "titol": "L'alerta municipal és una etiqueta amagada i no se sap si ha arribat",
        "descripcio": "«Alerta / Bàndol urgent» no és entre les 55 etiquetes que oferix l'editor; la pantalla no diu abans si sonarà ni després a quants mòbils; una correcció no es veu.",
        "perfils": [
          "rosa"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "editor de publicacions del Mur",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/personas/rosa.json; socdepoble.org/_wiki_de_poble/04_escriptori/261121_0229_auditoria_codex_fase5_foraster_i_r32_25.md (C04, D-29)",
        "nota": "Rosa demana un interruptor «⚠️ Avís urgent», «Enviat a N mòbils» i «Corregit a les 10:15» (D-29, D-M12)."
      },
      {
        "id": "DOL-44",
        "titol": "Directoris contradictoris, cap associació i fitxes d'entitat massa uniformes",
        "descripcio": "/perfil té 1 entitat i la pestanya «Empreses i entitats» del poble en té 4 de diferents; cap associació en cap directori; les fitxes d'empresa, grup i ajuntament compartixen el mateix motlle, sense horaris ni règim oficial.",
        "perfils": [
          "jordi",
          "toni",
          "empar"
        ],
        "ronda": "R02",
        "severitat": "P1",
        "superficie": "/perfil, /pobles/:slug › Empreses i entitats",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/evidencia/jordi/04_directori_entitats_grups.json; _investigacio_ia_de_poble/261121_estudi_mercat_2d_i_entitats/MATRIU_2D_ENTITATS_I_XARXES.json (AP-04: obert_planificacio_2d)",
        "nota": "La matriu 2D de Gemini ho cartografia (12 files × 5 columnes) abans de picar codi."
      },
      {
        "id": "DOL-45",
        "titol": "Convidar els 80 socis de l'associació sense que ningú es quede pel camí",
        "descripcio": "No hi ha cap recorregut que porte una invitació de WhatsApp d'una entitat fins al soci dins del poble i rebent els avisos.",
        "perfils": [
          "empar"
        ],
        "ronda": "R01",
        "severitat": "P2",
        "superficie": "invitació d'entitat per WhatsApp",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_01_onboarding_mobil_notificacions_i_ux_social/personas/empar_associacio.json; _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/comparativa_claude_vs_node0_i_conclusions.md (E5)",
        "nota": "Claude la proposa com a unitat de prova de cadena real (E5, D-C6), mesurada amb una persona."
      },
      {
        "id": "DOL-46",
        "titol": "/app/rebost deia «No coneixem esta app»",
        "descripcio": "L'àlies rebost no existia: l'app és a /app/nevera/rebost (o /app/mercaderies).",
        "perfils": [
          "carme",
          "toni",
          "marta"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "/app/rebost",
        "estat": "resolt",
        "versio_o_kit": "v1.2.17 (Rebost en rajoles; àlies R32.26 lot_01)",
        "evidencia": "src/apps/plataforma/RutaApps.jsx:57",
        "nota": "Coincidix a tres places (#02, #03 i #04); no era una ruta caiguda sinó un àlies que faltava."
      },
      {
        "id": "DOL-47",
        "titol": "«Rebost» vol dir tres coses i Carme no troba un mode de botiga",
        "descripcio": "És el mode del TPV de la skill Loyverse, la Nevera de casa i el «Rebost Domèstic» del Panell: Carme el busca per a vendre i Marta per a la compra.",
        "perfils": [
          "carme",
          "marta"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "Rebost, Nevera, TPV",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/comparativa_claude_vs_node0_i_conclusions.md (E8)",
        "nota": "L'àlies de la v1.2.17 porta /app/rebost a la Nevera de casa; què és «el Rebost» per a un veí ho ha de fixar el Mestre."
      },
      {
        "id": "DOL-48",
        "titol": "La compra eren targetes editorials amb «CONNECTAR» i un calaix tapava el 70 %",
        "descripcio": "Cada aliment era una UniversalCard de 298–324 px amb boina, Traductor, Xat i «CONNECTAR»; en mòbil s'obria el calaix fosc «Categories del rebost».",
        "perfils": [
          "marta",
          "rosa_f5",
          "carme"
        ],
        "ronda": "R03",
        "severitat": "P2",
        "superficie": "/app/nevera/rebost i /app/nevera/llista",
        "estat": "resolt",
        "versio_o_kit": "v1.2.17 (Rebost en rajoles 3×3, R32.26 lot_01)",
        "evidencia": "src/apps/nevera/vistes/Compra.jsx:106,182 (forma=\"rajoles\"); src/apps/nevera/vistes/RebostWorkspace.jsx:19",
        "nota": "La v1.2.15 ho defensava com a Regla d'Or 1 (261004); el canvi és de disseny, no una correcció."
      },
      {
        "id": "DOL-49",
        "titol": "La llista de la compra no es compartix en viu amb la parella",
        "descripcio": "Compartir és enviar un snapshot per fragment o JSON i importar-lo: després cada llista va per lliure.",
        "perfils": [
          "marta",
          "rosa_f5",
          "jordi",
          "llorenc_f5"
        ],
        "ronda": "R03",
        "severitat": "P2",
        "superficie": "/app/nevera/llista",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0229_auditoria_codex_fase5_foraster_i_r32_25.md (C07); _investigacio_ia_de_poble/261120_placa_assaig_04_codex_mercat_friccio_i_arquitectura_ux/DOSSIER_ASSAIG_04_MERCAT_FRICCIO_RETENCIO_I_ARQUITECTURA_UX.md (§3, R4)",
        "nota": "Codex: C07-A (snapshot honest, «Envia una còpia») ara; C07-B (8–15 jornades) només després d'una prova humana de dues persones. Jordi i Llorenç (Fase 5) no volen res automàtic."
      },
      {
        "id": "DOL-50",
        "titol": "El TPV del Bar estava tancat sense sessió i tot portava 🍽️",
        "descripcio": "/app/bar/tpv mostrava «Entra per a vendre» i «El torn està tancat»; cafès, tallats i carajillos tenien la mateixa icona de plat i un bàner Beta fix de 92 px.",
        "perfils": [
          "carme",
          "toni"
        ],
        "ronda": "R03",
        "severitat": "P2",
        "superficie": "/app/bar/tpv",
        "estat": "resolt",
        "versio_o_kit": "v1.2.17 (TPV de demo local d'El Bar, només sense sessió; pictogrames per família)",
        "evidencia": "src/apps/bar/vistes/TpvDemoLocal.jsx; src/apps/bar/vistes/vestits.js:32; socdepoble.org/_wiki_de_poble/04_escriptori/261121_0040_auditoria_gemini_placa_assaig_03_ux_atractiu_i_referents.md (F-UX-03)",
        "nota": "La demo és només en memòria i retolada com a nota de consum de mostra: cap venda ni Verifactu."
      },
      {
        "id": "DOL-51",
        "titol": "/app/bar obri el catàleg, i el TPV quedava davall del calaix",
        "descripcio": "Abans de la v1.2.21: L'entrada per defecte del Bar és el catàleg; a 360 px «Obri el TPV» queda davall del calaix del catàleg.",
        "perfils": [
          "carme"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "/app/bar",
        "estat": "decisio_mestre",
        "versio_o_kit": "v1.2.21 (build 26) · R32.38 lot 01 (el calaix)",
        "evidencia": "src/apps/bar/manifest.js:74 (entradaPerDefecte: 'cataleg'); _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/evidencia/carme/c07_app_bar_tpv.json",
        "nota": "La v1.2.21 resol la part del calaix: a 320 i 360 px «Obri el TPV» i «Obri la caixa» es poden tocar sense el calaix del catàleg damunt (src/apps/bar/vistes/modelCartaWorkspace.js, declaraNivellInicialEspai). Queda per decidir si l'entrada per defecte del Bar ha de ser el catàleg (src/apps/bar/manifest.js, entradaPerDefecte: 'cataleg'): Gemini ho marca requires_human_decision (F-UX-03)."
      },
      {
        "id": "DOL-52",
        "titol": "La Wiki obria amb un robot «AGRI-AI» en anglés i un calaix que tapava l'article",
        "descripcio": "La portada de /wikidepoble era una il·lustració amb hologrames en anglés i, en mòbil, l'arbre fosc «Maquinària de la IAIA» tapava el 76 % de la pantalla.",
        "perfils": [
          "jordi",
          "pau_f5",
          "empar"
        ],
        "ronda": "R03",
        "severitat": "P2",
        "superficie": "/wikidepoble",
        "estat": "resolt",
        "versio_o_kit": "v1.2.17 (Wiki amb retrat propi i article directe en mòbil)",
        "evidencia": "src/sections/wiki-de-poble/WikiDePobleSection.jsx:649; socdepoble.org/_wiki_de_poble/04_escriptori/261121_0040_auditoria_gemini_placa_assaig_03_ux_atractiu_i_referents.md (F-UX-04)",
        "nota": ""
      },
      {
        "id": "DOL-53",
        "titol": "/notes: quatre columnes i la primera línia per davall dels 900 px",
        "descripcio": "A 1440×900 s'obrin Control, Carpetes, Notes i l'editor amb hero, barra taronja i logotip; en mòbil el calaix de carpetes tapa el 76 %.",
        "perfils": [
          "jordi"
        ],
        "ronda": "R03",
        "severitat": "P2",
        "superficie": "/notes",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0040_auditoria_gemini_placa_assaig_03_ux_atractiu_i_referents.md (F-UX-04, requires_human_decision)",
        "nota": "R32.26 va arreglar la Wiki però no /notes."
      },
      {
        "id": "DOL-54",
        "titol": "Notes pot desar al servidor abans de publicar i «Mostrar al Mur» canvia la visibilitat a l'instant",
        "descripcio": "La primera escriptura pot crear una nota remota i autodesar-la; un esborrany antic es pot reprendre en muntar; l'editor visible no prova el desat.",
        "perfils": [],
        "ronda": "R04",
        "severitat": "P2",
        "superficie": "/notes",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_04_codex_mercat_friccio_i_arquitectura_ux/DOSSIER_ASSAIG_04_MERCAT_FRICCIO_RETENCIO_I_ARQUITECTURA_UX.md (§3, R3 i R7)",
        "nota": "Troballa de codi de Codex: cal dir on queda desat i qui ho veu."
      },
      {
        "id": "DOL-55",
        "titol": "La foto del xat conserva el lloc amb més precisió que la que es mostra",
        "descripcio": "La previsualització mostra el lloc de la foto amb dos decimals, però això no reduïx la precisió que s'envia.",
        "perfils": [],
        "ronda": "R04",
        "severitat": "P2",
        "superficie": "/xat › adjunt de foto",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_04_codex_mercat_friccio_i_arquitectura_ux/DOSSIER_ASSAIG_04_MERCAT_FRICCIO_RETENCIO_I_ARQUITECTURA_UX.md (§3, R2)",
        "nota": "Troballa de privacitat de Codex; no reverificada."
      },
      {
        "id": "DOL-56",
        "titol": "Converses de mostra que no porten enlloc",
        "descripcio": "Abans de la v1.2.21: /xat?comunitat=fake-poble a la URL, «Grups als quals pertanys», «Afegir grup» i «Nova comunitat» per a qui no té compte; el xat de Javi és un carreró i «Comentar» obri un xat, no comentaris.",
        "perfils": [
          "toni",
          "jordi",
          "pau"
        ],
        "ronda": "R02",
        "severitat": "P3",
        "superficie": "/xat sense sessió, targetes del Mur",
        "estat": "obert",
        "versio_o_kit": "v1.2.21 (build 26) · R32.35b lot 02 (només una part)",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/personas/toni.json; _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/personas/jordi.json",
        "nota": "La v1.2.21 lleva a qui no té compte el fals «Grups als quals pertanys» i el botó mort «Afegir grup» de la fitxa de la comunitat, i hi posa «Entrar o registrar-se» (`src/sections/xat/components/FitxaComunitat.jsx`). Queden la comunitat de mostra a la URL, «Nova comunitat», el xat de Javi sense eixida i «Comentar»."
      },
      {
        "id": "DOL-57",
        "titol": "Tres coses es diuen «avisos»",
        "descripcio": "El canal Avisos, L'Avisador i Notificacions «En construcció», i cap és el que busca qui vol que li sone el mòbil.",
        "perfils": [
          "llorenc"
        ],
        "ronda": "R02",
        "severitat": "P3",
        "superficie": "/xat, /control",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/personas/llorenc.json",
        "nota": ""
      },
      {
        "id": "DOL-58",
        "titol": "La prèvia de WhatsApp de les publicacions veïnals no porta el cartell",
        "descripcio": "Una publicació nova es comparteix amb una prèvia genèrica «Sóc de Poble» fins al desplegament següent.",
        "perfils": [
          "pau"
        ],
        "ronda": "R02",
        "severitat": "P2",
        "superficie": "enllaços compartits (OG)",
        "estat": "obert",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/personas/pau.json; tooling/seo/build-social-manifest.mjs:593 (citat per Pau)",
        "nota": "L'àrbitre de la #02 va refutar fer-ho al dia 0; la fitxa del poble sí que ix bé a WhatsApp."
      },
      {
        "id": "DOL-59",
        "titol": "Fitxa del poble amb dades sense sentit",
        "descripcio": "Abans de la v1.2.21: H1 «Gent de La Torre» en lloc del nom del poble, dates com «12:00 15/05/25» o «Data no indicada» i empreses sense descripció.",
        "perfils": [
          "jordi"
        ],
        "ronda": "R02",
        "severitat": "P3",
        "superficie": "/pobles/:slug",
        "estat": "obert",
        "versio_o_kit": "v1.2.21 (build 26) · R32.35b lot 02 (dades veïnes, cap símptoma descrit)",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/evidencia/jordi/01_fitxa_la_torre.json",
        "nota": "La v1.2.21 sanega dades veïnes de la fitxa (cap any «NaN», cap «-0» ni cap any repetit a les dades de l'enciclopèdia, src/sections/pobles/panellDeViquipediaModel.js), però no toca cap dels tres símptomes descrits: queden el títol «Gent de La Torre», les dates de les publicacions i les empreses sense descripció."
      },
      {
        "id": "DOL-60",
        "titol": "Escriptori: quatre peces al Xat, columna buida a la Nevera i errates a la vinyeta",
        "descripcio": "A 1440×900 el Xat té quatre columnes; la Nevera deixa una columna fosca buida de 260 px; la vinyeta de la plaça porta «quína embolic» i «carrgat».",
        "perfils": [],
        "ronda": "R03",
        "severitat": "P3",
        "superficie": "/xat i /app/nevera a 1440×900",
        "estat": "decisio_mestre",
        "versio_o_kit": "",
        "evidencia": "_investigacio_ia_de_poble/261120_placa_assaig_03_gemini_ux_atractiu_i_referents_mundials/DOSSIER_GEMINI_PLACA_ASSAIG_03_UX_I_DISSENY_OBERT.md (§4.1); _investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/comparativa_claude_vs_node0_i_conclusions.md (D3)",
        "nota": "amagaEsquerraBuida a la Nevera contradiu la decisió de la v1.2.15 (Llei del Píxel). Claude no va contrastar les errates."
      },
      {
        "id": "DOL-61",
        "titol": "Un cercador dins del xat i de les publicacions",
        "descripcio": "Llorenç (#01) demana poder buscar en les publicacions i en els missatges.",
        "perfils": [
          "llorenc"
        ],
        "ronda": "R01",
        "severitat": "P3",
        "superficie": "/xat › cerca, /cerca",
        "estat": "resolt",
        "versio_o_kit": "ja existia abans de la v1.2.16 (cerca global del Xat, T69, i /cerca)",
        "evidencia": "src/sections/xat/cercaXat.js",
        "nota": "Buit fals de la #01: el runner no va vore l'app per dins. Jordi (#02) compta 16 filtres a la Cerca."
      }
    ],
    "metriques": [
      {
        "nom": "R01 · crides avortades al Node 0",
        "valor": "5 de 13 (4 de 12 veus i la síntesi phi4)",
        "font": "_investigacio_ia_de_poble/261120_placa_assaig_01_onboarding_mobil_notificacions_i_ux_social/rondes_debat_placa_assaig_01.jsonl"
      },
      {
        "nom": "R01 · tornar demà",
        "valor": "5,5/10 (n = 4: 7, 6, 4 i 5)",
        "font": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/comparativa_claude_vs_node0_i_conclusions.md"
      },
      {
        "nom": "R01 · mida del prompt de la ronda 1",
        "valor": "3,21 milions de caràcters (99,7 % CSS) per a num_ctx 8.192",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md (T-07)"
      },
      {
        "nom": "R02 · tornar demà",
        "valor": "3,50 → 3,25/10 (n = 8)",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md"
      },
      {
        "nom": "R02 · missions completades sense sessió",
        "valor": "1 de 8 (Vicent)",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md"
      },
      {
        "nom": "R02 · sondes CDP",
        "valor": "222 ok; 6 POST bloquejats; 1.776 + 46 GET anònims a producció",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md (Verificació)"
      },
      {
        "nom": "R02 · tòkens dels subagents",
        "valor": "7.125.828 + 934.520 + 822.192",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md"
      },
      {
        "nom": "R02 · blueprint P0-ANDROID-PUSH",
        "valor": "279.823 B; 39 + 20 defectes trobats i corregits pels verificadors",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md (T-10)"
      },
      {
        "nom": "R03 · escenaris CDP",
        "valor": "144 (120 clars + 24 foscos) i 57 captures",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0040_auditoria_gemini_placa_assaig_03_ux_atractiu_i_referents.md"
      },
      {
        "nom": "R03 · intenció d'ús diari",
        "valor": "3,3 → 8,2 (expectativa, no guany); R1 real 23/7 = 3,29",
        "font": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/comparativa_claude_vs_node0_i_conclusions.md (D5)"
      },
      {
        "nom": "R03 · primer contingut a 360×800",
        "valor": "Mur ≈ 714 px; barra inferior a 731 px",
        "font": "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/comparativa_claude_vs_node0_i_conclusions.md (D4)"
      },
      {
        "nom": "R04 · mesura runtime",
        "valor": "112 mostres base i 98 estats d'interacció; 96/98 completes",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0042_auditoria_codex_assaig_a_la_placa_04_mercat_friccio_retencio_i_arquitectura_ux.md"
      },
      {
        "nom": "R04 · crides al Node 0",
        "valor": "26 (8 R1 + 8 focal + 2 reintents + 8 R2); 24 textos finals",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0042_auditoria_codex_assaig_a_la_placa_04_mercat_friccio_retencio_i_arquitectura_ux.md"
      },
      {
        "nom": "R04 · fonts primàries de mercat",
        "valor": "33 per a 8 referents",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0042_auditoria_codex_assaig_a_la_placa_04_mercat_friccio_retencio_i_arquitectura_ux.md"
      },
      {
        "nom": "R04 · LAB-SEED del Bar",
        "valor": "3 notes de consum × 1,20 € = 3,60 €",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0042_auditoria_codex_assaig_a_la_placa_04_mercat_friccio_retencio_i_arquitectura_ux.md"
      },
      {
        "nom": "R05 · models del Node 0 a l'assemblea",
        "valor": "9/9 sense avortaments (2.122–2.632 tòkens d'entrada)",
        "font": "_investigacio_ia_de_poble/261121_reunio_fase5_placa_assaig/evidencies_8_escoles_fase5_gemini.json"
      },
      {
        "nom": "R05 · vot de la benvinguda del Foraster",
        "valor": "targeta B 6/8 (+ secretari), cinta A 1 (Jordi), híbrid 1 (Toni)",
        "font": "_investigacio_ia_de_poble/261121_reunio_fase5_placa_assaig/DOSSIER_GEMINI_I_8_ESCOLES_NODE0_REUNIO_FASE5_FORASTER.md"
      },
      {
        "nom": "R05 · alternatives de Codex",
        "valor": "30 (10 colls × A/B/C)",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0229_auditoria_codex_fase5_foraster_i_r32_25.md"
      },
      {
        "nom": "R05 · laboratori del Node 0",
        "valor": "111 estudis d'opcions UX (8 colls) i 110 rondes de deute (R1057–R1166)",
        "font": "_investigacio_ia_de_poble/261121_reunio_fase5_placa_assaig/estat_runner_node0_v3.json"
      },
      {
        "nom": "V2 · escenaris de l'arnés",
        "valor": "14/14 sans; /mur sense primer objecte útil en 7/7",
        "font": "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/evidencies/despres_r32_28/RESUM_ASSAIG_A_LA_PLACA_ESTUDI_SINTETIC.md"
      },
      {
        "nom": "V2 · xip «Lletra gran» a 360 px",
        "valor": "74,8 → 48 px (normal); 107,5 → 56 px (Sènior)",
        "font": "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/evidencies/comparativa_subpixel_abans_vs_despres_5llengues.json"
      },
      {
        "nom": "V2 · xip «Lletra gran» a 320 px",
        "valor": "94,8 → 108 px; segona fila encara tapada",
        "font": "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/evidencies/comparativa_subpixel_abans_vs_despres_5llengues.json"
      },
      {
        "nom": "v1.2.16 · arrencada estàtica WordPress",
        "valor": "1.589.999 B (release) ≤ 1.591.000 B",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_1337_auditoria_claude_v1_2_16_4botigues_alpha_svn_foraster_i_zero_apk.md (T-01)"
      },
      {
        "nom": "v1.2.16 · push Canal 1",
        "valor": "tick 401; cap bundle amb la clau VAPID",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_1337_auditoria_claude_v1_2_16_4botigues_alpha_svn_foraster_i_zero_apk.md (T-03)"
      },
      {
        "nom": "v1.2.16 · distribució",
        "valor": "Play alpha build 21, TestFlight build 21, WordPress.org 1.1.24, ZERO APK",
        "font": "socdepoble.org/_wiki_de_poble/04_escriptori/261121_1337_auditoria_claude_v1_2_16_4botigues_alpha_svn_foraster_i_zero_apk.md (Verificació)"
      },
      {
        "nom": "Contrast humà · verificadors previstos",
        "valor": "19 (Play alpha i TestFlight), 0 sessions fetes",
        "font": "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/evidencies/despres_r32_28/GUIO_ASSAIG_A_LA_PLACA_CONTRAST_HUMA_5MIN.md"
      }
    ],
    "orkut": {
      "carpeta": "_investigacio_ia_de_poble/261121_arqueologia_ux_orkut_comunitat_humana/",
      "resum": "Arqueologia d'Orkut clàssic (2004–2014) i del manifest d'orkut.com del 2026 (IDEA-314): no agredia perquè entraves amb intenció a una casa o a una comunitat, la pàgina s'acabava, ningú no penjava res al teu perfil sense permís i les quadrícules eren finites. Coincidix amb Sóc de Poble en dues frases del manifest («en un feed eres espectador; en una comunidad, eres miembro» i «la IA coordina, las personas conectan»). Proposa sis idees en sala neta; la matriu 2D de Gemini manté el codi d'Orkut congelat (orkut_code_freeze_enforced: true): res no està implementat.",
      "mecaniques": [
        {
          "nom": "Casa i plaça amb porta, sense feed infinit",
          "que_era": "Navegació per persones i comunitats; la pàgina s'acabava quan l'havies llegida.",
          "lliço_per_sdp": "Mantindre l'entrada amb intenció (/xat, fitxa del poble, comunitat) i rebutjar el riu algorítmic.",
          "risc_toxic": "Baix; el risc és que es descobrisca menys.",
          "adoptar": "si"
        },
        {
          "nom": "Fòrums de comunitat amb temes permanents",
          "que_era": "Cada comunitat guardava els seus fils ordenats i cercables durant anys.",
          "lliço_per_sdp": "Pestanya «Temes permanents» dins de cada comunitat perquè acords, receptes, torns i memòria no es perden en el xat.",
          "risc_toxic": "Mitjà: fils morts o sense moderació.",
          "adoptar": "adaptat"
        },
        {
          "nom": "Testimonis amb aprovació prèvia (depoimentos)",
          "que_era": "Res apareixia al teu perfil fins que premies «Aprovar».",
          "lliço_per_sdp": "«Paraules de Bon Veïnat» als perfils veïnals i de comerços, sempre amb aprovació del receptor.",
          "risc_toxic": "Mitjà: elogi forçat i ressenyes de favor en comerços.",
          "adoptar": "adaptat"
        },
        {
          "nom": "Quadrícula finita 3×3 d'amics i comunitats",
          "que_era": "Nou amics i nou comunitats al perfil, sense competició de seguidors.",
          "lliço_per_sdp": "«Els meus pobles i comunitats» en 3×3, sense comptadors de vanitat.",
          "risc_toxic": "Baix: qui no hi apareix es pot sentir exclòs.",
          "adoptar": "adaptat"
        },
        {
          "nom": "Recados (scraps)",
          "que_era": "Missatges curts deixats al perfil d'algú.",
          "lliço_per_sdp": "«Llibreta de salutacions» asíncrona i calmada.",
          "risc_toxic": "Mitjà-alt si és pública sense filtre: spam i esbroncades al perfil.",
          "adoptar": "adaptat"
        },
        {
          "nom": "Calma cromàtica i espacial",
          /* La paleta d'Orkut citada com a dada d'estudi, no cap color de la interfície. */
          /* ALLOW_RAW_COLOR */ "que_era": "Paleta #D4DDED, tres columnes estables, zero autoplay i zero avisos d'ansietat.",
          "lliço_per_sdp": "Coherent amb Pedra Seca i amb la regla d'avisos pocs i triats.",
          "risc_toxic": "Cap.",
          "adoptar": "si"
        },
        {
          "nom": "Fans i valoracions confiable / genial / amable",
          "que_era": "Comptador de fans i icones de karma al perfil (es veuen a la reconstrucció de 2008).",
          "lliço_per_sdp": "No posar cap comptador ni valoració de persones: Sóc de Poble no té likes.",
          "risc_toxic": "Alt: rànquing de persones i vanitat. Lectura d'esta compilació; l'informe no la tracta.",
          "adoptar": "no"
        },
        {
          "nom": "«La IA coordina, les persones connecten»",
          "que_era": "Principi del manifest d'orkut.com 2026: IA entre bastidors, mai bots que es fan passar per persones.",
          "lliço_per_sdp": "Etiqueta explícita de la IAIA MarIA i cap veu sintètica presentada com a veí.",
          "risc_toxic": "Cap.",
          "adoptar": "si"
        },
        {
          "nom": "Consentiment versionat per hash",
          "que_era": "Al codi d'orkut.com, la versió de cada frase de consentiment és el hash de la frase.",
          "lliço_per_sdp": "Segellar per hash les frases de consentiment legal (consent-versions), útil per a /legal 2.6.",
          "risc_toxic": "Cap.",
          "adoptar": "si"
        }
      ]
    },
    "fonts_llegides": [
      "_investigacio_ia_de_poble/261120_placa_assaig_01_onboarding_mobil_notificacions_i_ux_social/INFORME_PLACA_ASSAIG_01_UX_ONBOARDING_ANDROID_I_NOTIFICACIONS.md",
      "_investigacio_ia_de_poble/261120_placa_assaig_01_onboarding_mobil_notificacions_i_ux_social/rondes_debat_placa_assaig_01.jsonl",
      "_investigacio_ia_de_poble/261120_placa_assaig_01_onboarding_mobil_notificacions_i_ux_social/estat_assaig_01.json",
      "_investigacio_ia_de_poble/261120_placa_assaig_01_onboarding_mobil_notificacions_i_ux_social/personas/ (8 JSON)",
      "_investigacio_ia_de_poble/261120_placa_assaig_01_onboarding_mobil_notificacions_i_ux_social/runner_placa_assaig_01.mjs (capçalera i arquetips)",
      "_investigacio_ia_de_poble/261120_placa_assaig_01_onboarding_mobil_notificacions_i_ux_social/evidencia_cdp_pantalles_android.json (estructura i fetsCodiNatiu)",
      "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/personas/ (8 JSON, friccions de la ronda 1 i posicions de la ronda 2)",
      "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/ronda2_debat_creuat_placa.md (§4 a §6)",
      "_investigacio_ia_de_poble/261120_placa_assaig_02_claude_poble_multiagent/comparativa_claude_vs_node0_i_conclusions.md (resum i lectura creuada)",
      "_investigacio_ia_de_poble/261120_placa_assaig_03_gemini_ux_atractiu_i_referents_mundials/DOSSIER_GEMINI_PLACA_ASSAIG_03_UX_I_DISSENY_OBERT.md (§1 a §6)",
      "_investigacio_ia_de_poble/261120_placa_assaig_03_gemini_ux_atractiu_i_referents_mundials/rondes_personas_assaig_03.jsonl (identitats)",
      "_investigacio_ia_de_poble/261120_placa_assaig_04_codex_mercat_friccio_i_arquitectura_ux/README.md",
      "_investigacio_ia_de_poble/261120_placa_assaig_04_codex_mercat_friccio_i_arquitectura_ux/DOSSIER_ASSAIG_04_MERCAT_FRICCIO_RETENCIO_I_ARQUITECTURA_UX.md (§0, §3–§5, §9–§11, §14–§15)",
      "_investigacio_ia_de_poble/261120_placa_assaig_04_codex_mercat_friccio_i_arquitectura_ux/meta/bloc_persones.md",
      "_investigacio_ia_de_poble/261120_placa_assaig_04_codex_mercat_friccio_i_arquitectura_ux/personas/pepa_senior.json",
      "_investigacio_ia_de_poble/261121_reunio_fase5_placa_assaig/DOSSIER_GEMINI_I_8_ESCOLES_NODE0_REUNIO_FASE5_FORASTER.md",
      "_investigacio_ia_de_poble/261121_reunio_fase5_placa_assaig/DOSSIER_BON_DIA_MESTRE_261121.md",
      "_investigacio_ia_de_poble/261121_reunio_fase5_placa_assaig/INFORME_…_POBLE_VIRTUAL_ESTAT_SISTEMA_I_OBSERVATORI_NODE0_261121.md",
      "_investigacio_ia_de_poble/261121_reunio_fase5_placa_assaig/evidencies_8_escoles_fase5_gemini.json",
      "_investigacio_ia_de_poble/261121_reunio_fase5_placa_assaig/estat_runner_node0_v3.json",
      "_investigacio_ia_de_poble/261121_reunio_fase5_placa_assaig/DOSSIER_NODE0_OPCIONS_VIABLES_UX_I_NOM_ESTUDI.md (estructura i recompte; no sencer)",
      "_investigacio_ia_de_poble/261121_reunio_fase5_placa_assaig/DOSSIER_NODE0_RONDES_1057_DEUTE_TECNIC_V1_2_16.md (estructura i recompte; no sencer)",
      "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/README_INTEGRACIO.md",
      "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/assaig_a_la_placa_v2/README.md",
      "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/evidencies/abans_baseline/RESUM_ASSAIG_A_LA_PLACA_ESTUDI_SINTETIC.md",
      "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/evidencies/despres_r32_28/RESUM_ASSAIG_A_LA_PLACA_ESTUDI_SINTETIC.md",
      "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/evidencies/despres_r32_28/GUIO_ASSAIG_A_LA_PLACA_CONTRAST_HUMA_5MIN.md",
      "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/evidencies/llibre_mestre_bloc_gemini_r32_28.md",
      "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/evidencies/comparativa_subpixel_abans_vs_despres_5llengues.json",
      "_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/evidencies/despres_r32_28/evidencia_assaig_a_la_placa_v2.json (resum i estructura)",
      "_investigacio_ia_de_poble/261121_arqueologia_ux_orkut_comunitat_humana/INFORME_ARQUEOLOGIA_UX_ORKUT_SOC_DE_POBLE.md",
      "_investigacio_ia_de_poble/261121_arqueologia_ux_orkut_comunitat_humana/orkut_2008_reconstruccio_fidel.html (text)",
      "_investigacio_ia_de_poble/261121_arqueologia_ux_orkut_comunitat_humana/orkut_com_2026_manifest_es.html (text i consent-versions)",
      "_investigacio_ia_de_poble/261121_estudi_mercat_2d_i_entitats/MATRIU_2D_ENTITATS_I_XARXES.json (assaig_a_la_placa_i_motor_mercat i capçalera)",
      "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0157_auditoria_claude_placa_assaig_02_poble_multiagent_i_blueprint_android_push.md",
      "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0040_auditoria_gemini_placa_assaig_03_ux_atractiu_i_referents.md",
      "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0042_auditoria_codex_assaig_a_la_placa_04_mercat_friccio_retencio_i_arquitectura_ux.md",
      "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0229_auditoria_codex_fase5_foraster_i_r32_25.md",
      "socdepoble.org/_wiki_de_poble/04_escriptori/261121_0306_auditoria_gemini_fase5_foraster_i_r32_26_rebost_bar_wiki.md",
      "socdepoble.org/_wiki_de_poble/04_escriptori/261121_1801_auditoria_gemini_r32_28_senior_c2_iaia_i_assaig_placa_v2.md",
      "socdepoble.org/_wiki_de_poble/04_escriptori/261121_1337_auditoria_claude_v1_2_16_4botigues_alpha_svn_foraster_i_zero_apk.md",
      "_investigacio_ia_de_poble/261121_r32_27_codex_tellado_wp72_ugc_sentinella_i_skills/README_INTEGRACIO.md (abast)",
      "src (grep de només lectura per a l'estat de cada dolor)"
    ]
  },
  "contradiccions": [
    {
      "titol": "Identitats que canvien",
      "text": "La Fase 5 redefinix Pau, Toni, Rosa, Llorenç i Empar (edat i rol), i l'informe de MarIA de les 15:20 en dona unes altres. L'Atles mostra els perfils de la Fase 5 a part."
    },
    {
      "titol": "Autoria de la confusió de la iaieta (E1)",
      "text": "El kit R32.28 i la matriu de Gemini l'atribuïxen a «Rosa, 78 anys»; a la #02 i a la #03 la va trobar Pepa (77 anys)."
    },
    {
      "titol": "Crides avortades a la #01",
      "text": "Claude i Gemini en diuen 6; el JSONL, la comparativa i Codex en compten 5 de 13."
    },
    {
      "titol": "Escala de les notes",
      "text": "L'informe de MarIA dona «3,50 / 5», però les notes són sobre 10."
    },
    {
      "titol": "Coses que la #01 no diu",
      "text": "Gemini (Fase 5) atribuïx a la #01 el silenci nocturn de 22 a 08 i el push cec a la pantalla de bloqueig; el text de la #01 no en parla."
    },
    {
      "titol": "Vot del Foraster",
      "text": "El dossier de la Fase 5 i l'auditoria 0306 no compten igual els vots; tots dos queden substituïts pel literal del Mestre (IDEA-313) de la v1.2.17."
    },
    {
      "titol": "Balanç curt de la matriu de Gemini",
      "text": "Només hi ha 4 dolors: hi falten el P0 del push, l'Ajuntament que no es pot crear, els App Links i les llavors de contingut."
    },
    {
      "titol": "«Sense desbordar mai»",
      "text": "El xip «Lletra gran» de R32.28 no desborda en horitzontal, però a 320 px el retall vertical d'«Entrar / Registrar-se» continua."
    },
    {
      "titol": "Mode Sènior al Xat",
      "text": "«Captures idèntiques al píxel» es va refutar (canvia el 13 % dels píxels) i «la lletra no creix» tampoc no estava demostrat."
    },
    {
      "titol": "Xifres de la #03",
      "text": "El «consens del 100 %», l'«8,3» (és 8,1875) i el «+4,9 de guany» són expectatives sintètiques, no mesures."
    },
    {
      "titol": "Acta 0134 avançada",
      "text": "A la 01:34 donava per completats els 4 assaigs, però la #04 encara no ho estava."
    },
    {
      "titol": "Nom del mètode",
      "text": "Codex i la #01 escriuen «Plaça d'Assaig»; el nom canònic és «Assaig a la Plaça»."
    },
    {
      "titol": "Abast promès de la v1.2.16",
      "text": "El pla hi posava campaneta, push de publicacions i App Links; no se n'ha publicat res i el push del Xat continua en 401."
    },
    {
      "titol": "L'arnés v2 i el mode «feed»",
      "text": "L'arnés v2 corre sobre la v1.2.16 i a /mur no troba el primer objecte útil en cap dels 7 perfils: no valida encara el chrome=\"feed\"."
    },
    {
      "titol": "L'Ajuntament «sense tipus»",
      "text": "La matriu de Gemini diu que encara no existix el tipus; el codi té kind 'city_hall' des de l'esquema inicial, amb l'autoservei barrat pel servidor."
    }
  ],
  "xarxes": [
    {
      "id": "front_porch_forum",
      "nom": "Front Porch Forum (FPF)",
      "pais_origen": "Estats Units (Vermont, 2006)",
      "url_referencia": "https://frontporchforum.com",
      "categoria": "Xarxa veïnal i cívica hiperlocal rural (referent mundial d'adopció)",
      "eslogan_posicionament": "Helping Neighbors Connect and Build Community",
      "stack_observable": "Web clàssica + apps iOS/Android + motor central de butlletins diaris per correu electrònic; backend propietari (detall intern no verificat públicament).",
      "model_captacio": "Bottom-Up orgànic poble a poble (>80% de les llars de Vermont en ~250 fòrums locals).",
      "model_negoci": "Public Benefit Corporation (B-Corp): patrocinis de comerços locals amb data fixa (zero perfilat comportamental), quotes d'entitats supramunicipals/serveis públics per difondre avisos i donacions voluntàries dels veïns.",
      "identitat_i_verificacio": "Nom i cognom reals obligatoris + adreça física del poble (visible per al veïnat del mateix fòrum).",
      "moderacio": "Moderació humana professional PRE-PUBLICACIÓ: ~12 moderadors en plantilla revisen cada missatge abans que isca al butlletí.",
      "mecanica_estrella": "El «Daily Digest» finit (1 sol lliurament diari calmat en lloc d'un riu infinit de notificacions en temps real): frena les baralles en calent i l'addicció algorítmica.",
      "fracassos_o_riscos": "Alt cost salarial per escalar la moderació humana prèvia a milers de municipis; menys útil per a emergències d'últim minut (talls d'aigua immediats).",
      "afinitat_sdp_sobre_10": 9.4,
      "que_adoptar_clean_room": [
        "Mode opcional de «Resum Diari del Poble» finit i calmat (zero doom-scrolling).",
        "Publicitat/aparador comercial 100% contextual al poble i sense rastreig de comportament.",
        "Separació nítida entre conversa veïnal assossegada i canal d'urgències oficials."
      ],
      "que_rebutjar_frontalment": [
        "Exposar l'adreça postal exacta de cada veí (xoca amb la privacitat RGPD i amb la seguretat rural)."
      ]
    },
    {
      "id": "panneau_pocket",
      "nom": "PanneauPocket",
      "pais_origen": "França (Lió, 2017)",
      "url_referencia": "https://www.panneaupocket.com",
      "categoria": "GovTech rural d'avisos, bàndols i alertes municipals (>12.000 municipis francesos)",
      "eslogan_posicionament": "L'application d'informations et d'alertes des mairies",
      "stack_observable": "Apps natives lleugeres iOS/Android + panell web SaaS per a secretàries d'ajuntament; zero compte d'usuari requerit al mòbil ciutadà (backend intern no verificat).",
      "model_captacio": "Top-Down B2G pur: venda directa a alcaldies rurals i mancomunitats (EPCI) amb cartells físics a l'entrada del poble.",
      "model_negoci": "Quota anual baixa per a l'ajuntament indexada per tram de població; 100% gratuït, sense anuncis i sense recollida de dades per al veí.",
      "identitat_i_verificacio": "Ciutadà 100% anònim (zero login, zero correu, zero telèfon: només marca pobles com a favorits per rebre Push); Ajuntament verificat per contracte institucional.",
      "moderacio": "Unidireccional institucional (només publiquen càrrecs/tècnics acreditats del consistori o gendarmeria).",
      "mecanica_estrella": "«Zero Login per al Foraster i el Veí»: seguir els bàndols i alertes de diversos pobles (residència, treball, segona residència familiar) amb 1 sol toc sense cedir cap dada personal.",
      "fracassos_o_riscos": "Absència total de vida comunitària bidireccional: el veí és un receptor passiu d'edictes, sense associacions vives ni xat veïnal.",
      "afinitat_sdp_sobre_10": 8.6,
      "que_adoptar_clean_room": [
        "Lectura oberta sense registre dels Bàndols i Alertes Oficials i subscripció Web Push per poble sense demanar correu ni telèfon.",
        "Multi-poble favorit (el fill que viu a Alacant però vol rebre els bàndols del poble de sa mare)."
      ],
      "que_rebutjar_frontalment": [
        "Reduir el poble a un tauler mut d'ordres municipals sense veu per a colles, comerços ni veïnat."
      ]
    },
    {
      "id": "intramuros",
      "nom": "IntraMuros",
      "pais_origen": "França (2017)",
      "url_referencia": "https://www.appli-intramuros.fr",
      "categoria": "Portal territorial mancomunat (ajuntaments + associacions + comerços + turisme, >8.000 municipis)",
      "eslogan_posicionament": "L'application qui vous rapproche de votre commune et de votre bassin de vie",
      "stack_observable": "Apps mòbils + widgets web incrustables per a webs municipals + connexió amb bases de dades turístiques regionals (APIDAE/Tourinsoft).",
      "model_captacio": "Top-Down comarcal: entra per les communautés de communes (mancomunitats) que financen el desplegament als pobles menuts de la comarca.",
      "model_negoci": "Subscripció anual B2G d'ajuntaments i mancomunitats; gratuït i sense publicitat per a ciutadans, escoles i associacions.",
      "identitat_i_verificacio": "Lectura ciutadana sense compte; comptes delegats verificats per l'ajuntament per a associacions locals, escoles i comerços del poble.",
      "moderacio": "Delegació jeràrquica de confiança: l'ajuntament habilita quines associacions i comerços poden publicar directament a l'agenda i al directori.",
      "mecanica_estrella": "«Conca de Vida Comarcal» (bassin de vie): quan obris un poble menut de 200 habitants, veus tant la seua vida pròpia com els esdeveniments i serveis dels pobles veïns de la mateixa vall.",
      "fracassos_o_riscos": "Quan un ajuntament deixa de pagar o canvia de corporació, les associacions perden l'eina perquè depenen de la llicència municipal.",
      "afinitat_sdp_sobre_10": 8.9,
      "que_adoptar_clean_room": [
        "Vista comarcal/mancomunada («L'Alcoià / El Comtat / La Muntanya») perquè un poble de 300 habitants no es veja mai buit.",
        "Acreditació creuada on el poble o associació matriu avala les entitats del territori."
      ],
      "que_rebutjar_frontalment": [
        "Que la supervivència digital de les associacions i comerços depenga del pressupost o caprici polític de l'ajuntament de torn."
      ]
    },
    {
      "id": "nebenan_de",
      "nom": "Nebenan.de (Good Hood GmbH / MesVoisins / TienesSal)",
      "pais_origen": "Alemanya (Berlín, 2015)",
      "url_referencia": "https://nebenan.de",
      "categoria": "Xarxa social veïnal europea amb perfils diferenciats per a veïns, comerços, ONGs i ajuntaments",
      "eslogan_posicionament": "Für gute Nachbarschaft (Per un bon veïnatge)",
      "stack_observable": "SPA React/Ruby + apps natives + API d'integració per a administracions locals i organitzacions cíviques (nebenan.de Kommunen & Organisationen).",
      "model_captacio": "Híbrid: llindar crític d'activació de barri (~100 veïns verificats amb targetes postals d'invitació) + acords institucionals amb ajuntaments i fundacions.",
      "model_negoci": "Subscripcions mensuals per a comerços locals (perfils d'empresa amb visibilitat acotada), llicències per a ajuntaments (perfils oficials verificats), mercat de segona mà i aportacions voluntàries veïnals.",
      "identitat_i_verificacio": "Verificació estricta de residència real (carta postal amb codi PIN, SMS, document o GPS) però mostrant només el barri/zona, mai el portal exacte.",
      "moderacio": "Regles cíviques estrictes (prohibida la propaganda partidista per perfils comercials), filtre automàtic + equip central de suport.",
      "mecanica_estrella": "Separació tipològica impecable en 4 perfils d'actor amb drets i deures diferents: Veí, Comerç Local, Associació/ONG (gratuïta) i Administració Pública (amb segell institucional).",
      "fracassos_o_riscos": "En zones rurals molt disperses el llindar mínim de 100 registres amb codi postal bloquejava l'obertura de pobles menuts.",
      "afinitat_sdp_sobre_10": 8.8,
      "que_adoptar_clean_room": [
        "Taxonomia nítida d'actors amb regles pròpies: ONG/Associació sempre gratuïta, Comerç amb fitxa útil de KM 0 i Ajuntament amb segell verificat sense ús partidista.",
        "Verificació d'arrelament al poble sense exposar mai l'adreça exacta de la casa."
      ],
      "que_rebutjar_frontalment": [
        "Bloquejar l'obertura d'un poble fins arribar a 100 usuaris (a Sóc de Poble el patrimoni i la Wiki fan viu el poble des del dia 1!)."
      ]
    },
    {
      "id": "eagora",
      "nom": "eAgora",
      "pais_origen": "Catalunya / Espanya (Lleida, 2020)",
      "url_referencia": "https://www.eagora.app",
      "categoria": "Súper-App modular municipal d'àgores temàtiques, tràmits, entrades i comerç",
      "eslogan_posicionament": "Todo tu municipio en una sola app",
      "stack_observable": "Apps iOS/Android + panell web SaaS multi-tenant amb mòduls activables («Àgores», reserves d'instal·lacions, venda d'entrades, bons comercials, incidències).",
      "model_captacio": "Top-Down B2G cap a ajuntaments espanyols i catalans (substituint apps disperses de bàndols, reserves de pàdel i incidències).",
      "model_negoci": "SaaS B2G per mòduls contractats per l'ajuntament (Bàsic gratuït/freemiun per captar consistoris menuts -> plans de pagament per mòduls avançats).",
      "identitat_i_verificacio": "Registre amb correu/OAuth per interactuar (inscripcions, reserves, incidències); «Àgores» públiques o amb permís.",
      "moderacio": "Cada «Àgora» (ajuntament, club esportiu, escola, comerç) és administrada pels seus propis gestors sense mesclar soroll.",
      "mecanica_estrella": "Arquitectura d'«Àgores/Canals Modulars» dins del mateix municipi + utilitat transaccional diària (reservar pista poliesportiva, treure entrada del teatre o bescanviar bons de comerç).",
      "fracassos_o_riscos": " Risc d'interfície recarregada («efecte arbre de Nadal» de menús municipals) i dependència total d'un núvol SaaS tancat sense federació ni exportació lliure.",
      "afinitat_sdp_sobre_10": 8.2,
      "que_adoptar_clean_room": [
        "Utilitat pràctica real per al dia a dia rural (inscripció a cursos/actes amb RSVP com R32.25, TPV Bar/Comissió de festes, Rebost cooperatiu).",
        "Canals autònoms per a cada entitat dins del mateix poble."
      ],
      "que_rebutjar_frontalment": [
        "Silo SaaS propietari sense portabilitat de dades ni protocol obert (a Sóc de Poble mana l'Enxufabilitat Model B + Open Data ActivityStreams)."
      ]
    },
    {
      "id": "bandomovil_linea_verde",
      "nom": "Bando Móvil & Línea Verde",
      "pais_origen": "Espanya (2013 / 2009)",
      "url_referencia": "https://www.bandomovil.com",
      "categoria": "Difusió de bàndols municipals i bústia geolocalitzada d'incidències de via pública",
      "eslogan_posicionament": "Tu ayuntamiento en el móvil / Cuida tu municipio",
      "stack_observable": "Apps natives clàssiques amb llistat per municipi, enviament Push massiu i formulari GPS + foto per a desperfectes urbans.",
      "model_captacio": "Top-Down B2G clàssic en milers de petits i mitjans ajuntaments d'Espanya.",
      "model_negoci": "Quota anual municipal de baix cost (Bando Móvil) o consultoria ambiental + llicència SaaS (Línea Verde).",
      "identitat_i_verificacio": "Lectura de bàndols sense login; enviament d'incidències amb telèfon/correu per a retorn d'estat a l'usuari.",
      "moderacio": "Les incidències entrades pels veïns van a una safata privada o moderada del tècnic municipal abans de fer-se públiques (evita assenyalaments personals entre veïns).",
      "mecanica_estrella": "El flux d'incidència cívica tancada «Foto + Punt al Mapa + Categoria (enllumenat/aigua/camí rural) -> Safata Tècnica -> Avís de Resolució» sense convertir-ho en un mur de queixes tòxiques.",
      "fracassos_o_riscos": "UX envellida, apps separades per a cada cosa i zero connexió amb el teixit associatiu o comercial del poble.",
      "afinitat_sdp_sobre_10": 7.8,
      "que_adoptar_clean_room": [
        "En la futura Pàgina d'Ajuntament (Entitat 5), la bústia d'avisos de camins/enllumenat ha d'anar a safata institucional amb canvi d'estat («Rebut -> En reparació -> Resolt»), MAI com un mur públic d'esbroncades."
      ],
      "que_rebutjar_frontalment": [
        "Fragmentar la vida del poble en 4 apps inconnexes."
      ]
    },
    {
      "id": "karrot_oss",
      "nom": "Karrot Open Source (karrot.world · Foodsaving Worldwide)",
      "pais_origen": "Europa (Alemanya / Suècia, 2017)",
      "url_referencia": "https://karrot.world",
      "categoria": "Programari lliure (AGPL-3.0) per a grups locals d'ajuda mútua, hortes comunitàries i aprofitament alimentari",
      "eslogan_posicionament": " Democratic, grass-roots tool for local groups saving food and sharing resources",
      "stack_observable": "Verificat 100% en codi obert (Codeberg/GitHub `karrot-dev`): frontend Vue/Quasar PWA + backend Python/Django REST + WebSockets, finançat per NLnet / NGI Zero.",
      "model_captacio": "Bottom-Up autogestionat per col·lectius locals, cooperatives de consum i bancs d'aliments.",
      "model_negoci": "Bé comú digital (FOSS sense ànim de lucre): subvencions públiques europees (NLnet, igual que la nostra línia Fediversity!) i donacions.",
      "identitat_i_verificacio": "Confiança entre iguals (*Web of Trust*): per entrar com a membre ple d'un grup local passes un procés d'acollida i rep «pastanagues de confiança» (*trust carrots*) d'altres veïns que et coneixen en persona.",
      "moderacio": "Governança horitzontal sociocràtica sense «administrador dictador vitalici»: processos col·lectius de resolució de conflictes i torns visibles.",
      "mecanica_estrella": "Torns d'acció real al territori (*Pickups / Activities* amb places, recordatoris i feedback d'assistència) + governança compartida resistent al segrest d'un sol admin.",
      "fracassos_o_riscos": "Corba d'entrada elevada si no hi ha un grup motor al poble; no cobreix aparador comercial ni administració municipal.",
      "afinitat_sdp_sobre_10": 9.3,
      "que_adoptar_clean_room": [
        "Torns cooperatius d'acció per a les Pàgines de Grup/Associació (ex. torns de barra de la comissió de festes, torns de reg o de banc de llavors!).",
        " custòdia compartida d'organitzacions (almenys 2 co-administradors o successió perquè un grup del poble no quede orfe si algú perd el mòbil)."
      ],
      "que_rebutjar_frontalment": [
        "Processos assemblearis complexos per a un simple veí que només vol mirar l'hora d'un acte."
      ]
    },
    {
      "id": "karrot_danggeun",
      "nom": "Karrot Market (Danggeun Market · Corea del Sud)",
      "pais_origen": "Corea del Sud (Seül, 2015)",
      "url_referencia": "https://www.karrotmarket.com",
      "categoria": "Mercat veïnal hiperlocal i plaça de barri (>35M d'usuaris, >90% de penetració local a Corea)",
      "eslogan_posicionament": "Your neighborhood market & community",
      "stack_observable": "Apps natives d'alt rendiment + verificació periòdica de radi GPS curt (4–6 km) + xat integrat de compravenda.",
      "model_captacio": "Bottom-Up fulminant a través del mercat de segona mà i intercanvi a peu de carrer (sense enviaments postals!).",
      "model_negoci": "Anuncis hiperlocals de petits comerços del barri, ofertes de feina de proximitat i pagaments locals.",
      "identitat_i_verificacio": "Telèfon + renovació periòdica de presència GPS real al poble/barri per poder publicar com a veí local.",
      "moderacio": "Reputació bidireccional no punitiva + filtres antifrau comercial (prohibit revendedors professionals d'altres ciutats fent-se passar per veïns).",
      "mecanica_estrella": "«Manner Temperature (36,5 °C)»: tothom naix a 36,5 °C (la temperatura càlida d'una persona viva) i puja amb elogis concrets («puntual», «amable», «producte tal com deia»), evitant la crueltat de les estrelles 1/5 que destrossen un petit comerç per una revenja.",
      "fracassos_o_riscos": "Model de capital risc centralitzat; l'exigència estricta de GPS dins del radi penalitza els fills del poble que viuen fora entre setmana i pugen el cap de setmana.",
      "afinitat_sdp_sobre_10": 8.5,
      "que_adoptar_clean_room": [
        "Reputació càlida i qualitativa («Bon tracte / Puntualitat / Producte de l'horta») en el Mercat KM 0, combinada amb l'aprovació prèvia dels elogis públics.",
        "Protecció del Mercat local contra spam d'especuladors de fora de la comarca."
      ],
      "que_rebutjar_frontalment": [
        "Bloquejar per GPS els fills i nets de la diàspora rural que viuen entre setmana a València o Alacant però són part viva del poble!"
      ]
    },
    {
      "id": "hylo",
      "nom": "Hylo (Terran Collective)",
      "pais_origen": "Estats Units (Califòrnia, 2020 — refundació cooperativa sense ànim de lucre)",
      "url_referencia": "https://www.hylo.com",
      "categoria": "Xarxa prosocial de codi obert per a bioregions, conques rurals i xarxes d'entitats",
      "eslogan_posicionament": "The Prosocial Coordination Platform for a Thriving Planet",
      "stack_observable": "Verificat 100% en codi obert (`github.com/Terran-Collective/hylo`): React + React Native + Node/GraphQL + PostgreSQL/PostGIS per a mapes territorials.",
      "model_captacio": "Bottom-Up per xarxes regeneratives, cooperatives agràries i aliances de grups locals.",
      "model_negoci": "Sense ànim de lucre (*fiscal sponsorship* + subvencions + contribucions comunitàries, zero anuncis i zero venda de dades).",
      "identitat_i_verificacio": "Perfils personals connectats a múltiples grups amb relacions de parentiu entre grups (* Holonic / Nested Groups*: grup xicotet dins de poble dins de comarca).",
      "moderacio": "Acords explícits de comunitat acceptats en entrar a cada grup (*Community Agreements*) + rols de *Stewards* (custodis) en lloc de capatassos.",
      "mecanica_estrella": "Publicacions estructurades per intenció cooperativa («Oferisc / Necessite / Recurs compartit / Projecte / Esdeveniment») pintades sobre un Mapa Territorial viu + Grups Niats (la colla dins l'associació, l'associació dins el poble, el poble dins la vall).",
      "fracassos_o_riscos": "Interfície molt densa per a gent gran no acostumada a eines de coordinació complexa (com va assenyalar Rosa 78 anys a l'Assaig a la Plaça!).",
      "afinitat_sdp_sobre_10": 9.1,
      "que_adoptar_clean_room": [
        "Relació fractal/niada entre les nostres entitats: Colla/Grup <-> Associació/Cooperativa <-> Poble <-> Comarca.",
        " Intenció clara al Mercat i al Mur («Oferisc / Busque / Compartisc vehicle o ferramenta», que ja lliga amb les nostres verticals d'`IDEA-61`!)."
      ],
      "que_rebutjar_frontalment": [
        "Sobrecarregar la vista inicial mòbil amb mapes i filtres simultanis que espanten el perfil Sènior."
      ]
    },
    {
      "id": "fedivers_hometown_bonfire",
      "nom": "Mastodon + Hometown + Bonfire (Fedivers Local)",
      "pais_origen": " Internacional / UE (2016–2026)",
      "url_referencia": "https://bonfirenetworks.org",
      "categoria": "Infraestructura federada ActivityPub amb visibilitat només-local i cercles de consentiment",
      "eslogan_posicionament": "Federated digital public spaces under community control",
      "stack_observable": "Codi obert verificat: ActivityPub / ActivityStreams 2.0 + JSON-LD (`Hometown` Ruby/Rails fork de Mastodon; `Bonfire` Elixir/Phoenix modular).",
      "model_captacio": "Comunitats sobiranes en servidors propis interconnectats per estàndards oberts W3C.",
      "model_negoci": "Cooperatives tecnològiques, ajuts NGI/NLnet Fediversity i allotjament mancomunat.",
      "identitat_i_verificacio": "Identificador federat `@entitat@domini` + verificació criptogràfica bidireccional `rel=\"me\"` (que Sóc de Poble JA implementa a `identitatFederadaRelMe.js`!).",
      "moderacio": "Moderació local per instància + bloqueig/silenciament de servidors hostils (*defederation*) + *Boundaries/Circles* granulars a Bonfire.",
      "mecanica_estrella": "«Local-Only Posts» (Hometown) i «Boundaries» (Bonfire): poder publicar alguna cosa que NOMÉS es llig dins del poble i no es pot rebotar (*boost*) fora cap a la selva mundial d'internet, combinat amb publicacions públiques que sí que viatgen al Fedivers!",
      "fracassos_o_riscos": "Fricció tècnica brutal de registre en Mastodon clàssic («Tria un servidor») que expulsa el 95% dels veïns normals.",
      "afinitat_sdp_sobre_10": 9.5,
      "que_adoptar_clean_room": [
        "Visibilitat explícita de 3 escalons en cada publicació: (1) Privat/Grup, (2) Només al Poble (sense indexació ni federació externa), (3) Públic i Federat (`ActivityStreams`, com ja inicia `DetallPoble.jsx`!).",
        "Amagar tota la complexitat d'ActivityPub sota una UX senzilla d'1 sol toc."
      ],
      "que_rebutjar_frontalment": [
        "Fer triar servidor o parlar de protocols W3C a la pantalla d'entrada d'un veí."
      ]
    },
    {
      "id": "orkut_arqueologia",
      "nom": "Orkut (2004–2014 i Manifest orkut.com 2026)",
      "pais_origen": "Estats Units / Brasil / Índia (Orkut Büyükkökten)",
      "url_referencia": "https://orkut.com/es/index.html",
      "categoria": "Arqueologia UX de xarxa social humana pre-algorítmica basada en Comunitats amb memòria",
      "eslogan_posicionament": "En un feed eres espectador; en una comunidad, eres miembro · La IA coordina, las personas conectan",
      "stack_observable": "Històric (C++/Java/GWT); nou manifest `orkut.com` amb segellat per hash de versions de consentiment (`consent-versions`).",
      "model_captacio": "Invitació de confiança entre amics reals i adhesió per afinitat a Comunitats temàtiques.",
      "model_negoci": "Històricament sostingut per Google; nou enfocament declarat cap a comunitats saludables sense manipulació d'atenció.",
      "identitat_i_verificacio": "Perfil humà amb reputació afectiva atorgada pels teus propis coneguts.",
      "moderacio": "Moderadors de cada Comunitat + aprovació prèvia obligatòria del receptor per a qualsevol testimoni a la seua portada.",
      "mecanica_estrella": "1) Fòrums de Comunitat on els temes duren anys (no un riu efímer de 2 hores); 2) «Depoimentos» (Paraules de bon veïnat) que només es publiquen si el destinatari els aprova; 3) Graella finita 3×3 de pertinença sense comptadors de vanitat.",
      "fracassos_o_riscos": "Va caure quan va intentar imitar el mur sorollós i els jocs virals de Facebook perdent la seua calma i estructura de comunitats.",
      "afinitat_sdp_sobre_10": 9.6,
      "que_adoptar_clean_room": [
        "(ESTUDI 2D — PROHIBIT IMPLEMENTAR ARA EN SRC/): Pestanya futura de «Temes Permanents / Acords» al costat del xat viu de cada Comunitat.",
        "(ESTUDI 2D): «Paraules de Bon Veïnat» amb aprovació prèvia del destinatari (zero linxaments públics).",
        "(ESTUDI 2D): Graella finita 3×3 de Pobles i Comunitats estimades en lloc de xifres narcisistes de seguidors."
      ],
      "que_rebutjar_frontalment": [
        "Indicadors públics de popularitat/sexy/fans o qualsevol rànquing competitiu entre persones."
      ]
    },
    {
      "id": "nextdoor_antimodel",
      "nom": "Nextdoor [ANTI-MODEL D'ESTUDI CRÍTIC]",
      "pais_origen": "Estats Units (San Francisco, 2011)",
      "url_referencia": "https://nextdoor.com",
      "categoria": "Xarxa comercial hiperlocal de capital risc (cas d'estudi del que MAI s'ha de fer)",
      "eslogan_posicionament": "Tap into your neighborhood",
      "stack_observable": "Plataforma tancada ad-tech amb tracking intensiu, notificacions d'urgència fabricada i mur ordenat algorítmicament per polèmica.",
      "model_captacio": "Growth hacking agressiu enviant cartes físiques en nom d'un veí que sovint pareixen avisos oficials urgents.",
      "model_negoci": "Publicitat programàtica invasiva, cobrament «pay-to-play» als comerços locals per no ser invisibles i extracció de dades immobiliàries/veïnals.",
      "identitat_i_verificacio": "Tancament per codi postal/polígon que fomenta mentalitat de «urbanització assetjada» contra qualsevol foraster.",
      "moderacio": "Moderació voluntària no representativa (*Neighborhood Leads*) que deriva sovint en petites tiranies locals, racisme securitari («persona sospitosa al carrer») i venjances contra comerços.",
      "mecanica_estrella": "CAP a imitar; serveix com a vacuna arquitectònica completa.",
      "fracassos_o_riscos": "Síndrome del «món hostil» (*digital curtain-twitching*), fatiga crònica per spam de notificacions enganyoses i extorsió d'abast als petits comerços.",
      "afinitat_sdp_sobre_10": 1.2,
      "que_adoptar_clean_room": [
        "Cap mecànica de producte; usar els seus 4 errors com a tests negatius permanents del nostre disseny."
      ],
      "que_rebutjar_frontalment": [
        "1) PROHIBIT el mur d'alarmisme securitari o assenyalament de persones al carrer.",
        "2) PROHIBIT enviar notificacions amb titulars d'esquer emocional (FOMO).",
        "3) PROHIBIT cobrar peatge algorítmic a la fleca del poble perquè els seus veïns la vegen.",
        "4) PROHIBIT donar poder de censura opaca a un sol veí autoproclamat."
      ]
    }
  ],
  "entitats": {
    "verificat_el": "Sat Nov 21 19:31:33 CET 2026",
    "base_codi": "8749aa810 + canvis v1.2.17 sense cometre",
    "criteri": "Ajuntament: a_mitges només si hi ha codi específic de city_hall per a la dimensió; la maquinària genèrica d'entitat no compta. Grup: kind 'group' en remot (supabase), no el mode llavor.",
    "entitats": [
      {
        "id": "usuari_vei",
        "titol": "1. Usuari / Veí",
        "ruta_actual": "/gent/:id, /perfil/:id, /javillinares (RUTES_CANONIQUES) i, en privat, /el-meu-perfil",
        "estat_global": "a_mitges",
        "nota": "8 de 12 cel·les fetes; les mancances reals són l'arrelament, la recuperació social (el bloc de confiança està apagat amb l'E2EE) i la federació de la persona."
      },
      {
        "id": "empresa_cooperativa",
        "titol": "2. Empresa / Comerç / Cooperativa",
        "ruta_actual": "/empresa/:id (àlies /entitats/:id), /socdepoble i edició a /el-meu-perfil?organitzacio=:id",
        "estat_global": "a_mitges",
        "nota": "Fitxa, xat de comunitat i membres sòlids; falten dades comercials (horari, adreça, NIF), l'enllaç amb el TPV i qualsevol federació."
      },
      {
        "id": "grup_associacio",
        "titol": "3. Grup / Comunitat / Associació",
        "ruta_actual": "/grup/:id, /rentonar i edició a /el-meu-perfil?organitzacio=:id; el seu xat és un sol fil de grup, no cap /xat?comunitat=",
        "estat_global": "a_mitges",
        "nota": "És la columna més sobrevalorada: un grup no té comunitat amb Avisos ni FitxaViva al Xat, els seus gestors no administren el seu xat, i el que sembla específic (Rentonar) està codificat a mà; El Comú té models de banda i loteria encara sense servidor."
      },
      {
        "id": "poble",
        "titol": "4. Poble",
        "ruta_actual": "/pobles/:id (comodí :sectionId/:itemId cap a ItemDetailSection) i /xat?comunitat=<fil de la comunitat del poble>",
        "estat_global": "a_mitges",
        "nota": "Pàgina rica per als 22 pobles i Open Data per a tots, però la identitat federada és només de La Torre de les Maçanes, no hi ha custodis del poble i l'escut que Gemini hi posa està prohibit (IDEA-90)."
      },
      {
        "id": "ajuntament_entitat_oficial",
        "titol": "5. Ajuntament / Entitat Oficial",
        "ruta_actual": "/ajuntament/:id cap a la PerfilPublicSection genèrica, sense cap emissor; un city_hall real es mostra i es canonitza a /empresa/:slug",
        "estat_global": "falta",
        "nota": "La pàgina pròpia falta, però, contra el que diu Gemini («sense kind»), el model ja existix: kind 'city_hall' a la BD, bloqueig de l'autoservei i reclamació revisada, transferència bloquejada, alertes i bàndols urgents del Mur signats per l'ajuntament del mateix poble (D-6) i un push de bàndols preparat i apagat; tot depén d'un city_hall aprovisionat per SQL, perquè no hi ha cap interfície per crear-lo ni per aprovar-ne la reclamació."
      }
    ],
    "files": [
      {
        "dimensio_id": "rutes_i_urls_canoniques",
        "titol": "1. Rutes, URLs canòniques i SEO públic",
        "cel_les": {
          "usuari_vei": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/app/App.jsx:1339",
              "src/config/metadadesDePerfil.js:108"
            ],
            "nota": "La fitxa de persona s'obri a /gent/:id, /perfil/:id i a les rutes netes fundacionals, amb canònica única i noindex mentre no està publicada; falta l'àlies curt /@usuari.",
            "canvi": ""
          },
          "empresa_cooperativa": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/app/App.jsx:1340",
              "src/config/metadadesDePerfil.js:97"
            ],
            "nota": "/empresa/:id (i l'àlies /entitats/:id) resol per id o slug amb SEO i prerender social (tooling/seo/perfils-socials.mjs), però el schema.org és sempre Organization, mai LocalBusiness ni Cooperative.",
            "canvi": ""
          },
          "grup_associacio": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/app/App.jsx:1349",
              "src/sections/xat/components/FitxaVivaDeComunitat.jsx:68"
            ],
            "nota": "/grup/:id i /rentonar funcionen amb SEO, però la FitxaVivaDeComunitat del Xat només es munta per a subjectes 'entitat' i 'poble', mai per a un grup (kind 'group'), contra el que afirma Gemini.",
            "canvi": ""
          },
          "poble": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/app/App.jsx:1398",
              "src/sections/detail/detailSectionMeta.jsx:46"
            ],
            "nota": "/pobles/:id entra pel comodí :sectionId/:itemId cap a ItemDetailSection, amb camí territorial i pestanyes diferides per als 22 pobles del catàleg; falten àlies curts i una vista de comarca.",
            "canvi": ""
          },
          "ajuntament_entitat_oficial": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/app/App.jsx:1348",
              "src/data/supabase/perfils.js:75"
            ],
            "nota": "La ruta /ajuntament/:id existeix però cap emissor la genera (rutaDePerfil no la coneix i ningú produïx el tipus 'ajuntament' de resolveItemPath, navigation.js:450), i una fila kind 'city_hall' es mapeja a tipus 'entitat', de manera que la seua canònica real és /empresa/:slug amb schema Organization.",
            "canvi": ""
          }
        }
      },
      {
        "dimensio_id": "identitat_alta_i_verificacio",
        "titol": "2. Alta, verificació d'arrelament i segell d'autenticitat",
        "cel_les": {
          "usuari_vei": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/app/App.jsx:1275",
              "src/sections/admin/SegonFactor.jsx:55"
            ],
            "nota": "Hi ha alta amb correu o Google, tria de poble i visibilitat, i el segon factor només per a la superadministració; no hi ha cap distinció d'arrelament (foraster, vinculat, veí avalat).",
            "canvi": ""
          },
          "empresa_cooperativa": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/profile/DialegNovaOrganitzacio.jsx:10",
              "src/sections/profile/DialegNovaOrganitzacio.jsx:57"
            ],
            "nota": "Alta en autoservei com a 'company' amb poble i identificador únic; cap verificació anti-suplantació de qui la crea.",
            "canvi": ""
          },
          "grup_associacio": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/profile/DialegNovaOrganitzacio.jsx:11",
              "supabase/migrations/2610081400_grups_sense_mare.sql:1"
            ],
            "nota": "Alta en autoservei com a 'group' (colla, associació, col·lectiu) sense empresa mare; cap segell d'associació registrada ni custòdia mínima de dos administradors.",
            "canvi": ""
          },
          "poble": {
            "estat": "a_mitges",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/admin/pobleAdministrat.jsx:23",
              "src/sections/pobles/PanellDeViquipedia.jsx:28"
            ],
            "nota": "El catàleg de pobles és una llavor curada (townsSeed, nomenclàtor INE) que només administra la superadministració amb aal2; el «consentiment» de Viquipèdia és el del visitant per a carregar dades i fotos de Commons i l'enriquiment no es desa al servidor (Fase 3c pendent), així que no hi ha custodis del poble ni cap segell propi.",
            "canvi": "Gemini el dona per fet citant un panell local sense persistència i un consentiment del visitant, que no verifiquen el poble; l'administració és exclusiva de la superadministració."
          },
          "ajuntament_entitat_oficial": {
            "estat": "a_mitges",
            "estat_gemini": "falta",
            "evidencia": [
              "supabase/migrations/2609080000_initial_schema.sql:78",
              "supabase/migrations/2609281500_lema_entradilla_256.sql:94"
            ],
            "nota": "El tipus kind 'city_hall' existeix a la BD des de l'esquema inicial i el servidor ja prohibix crear-lo en autoservei («Les entitats i els ajuntaments no es creen: es reclamen»), commutar-lo o transferir-lo; l'única via és la reclamació genèrica (sollicita_reclamacio, 2609080000:290) que la superadministració resol per RPC sense cap pantalla, i no hi ha domini oficial, DIR3/INE, 2FA obligatori ni insígnia.",
            "canvi": "Gemini diu que no hi ha ni tipus ni flux; hi ha el tipus city_hall, el bloqueig de l'autoservei i la reclamació revisada, encara que sense acreditació institucional ni interfície de revisió."
          }
        }
      },
      {
        "dimensio_id": "anatomia_capcalera_i_presentacio",
        "titol": "3. Anatomia de pàgina, capçalera i dades estructurades",
        "cel_les": {
          "usuari_vei": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/profile/PerfilPublicSection.jsx:644",
              "src/utils/exportaVCard.js:19"
            ],
            "nota": "La fitxa pinta nom, bio, lema, @usuari si està publicada i presentació, amb vCard sense correu, telèfon ni adreça; falten els sabers rurals voluntaris.",
            "canvi": ""
          },
          "empresa_cooperativa": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/profile/PerfilPublicSection.jsx:674",
              "src/sections/profile/vcardOrganitzacio.js:113"
            ],
            "nota": "Logotip, portada o vídeo, lema, correu públic opcional validat, vCard i presentació HTML; no hi ha horari, adreça, telèfon ni avís de repartiment.",
            "canvi": ""
          },
          "grup_associacio": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/profile/PerfilPublicSection.jsx:662",
              "src/sections/profile/DocumentacioHistoricaRentonar.jsx:1"
            ],
            "nota": "Fitxa genèrica d'organització més l'arxiu estatutari i el model d'acta codificats només per a Rentonar (src/data/patrimoni/actaRentonar.js); cap bloc genèric de junta o de com apuntar-s'hi.",
            "canvi": ""
          },
          "poble": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/pobles/poblesAplecViquipedia.js:4",
              "src/sections/detail/detailSectionMeta.jsx:767"
            ],
            "nota": "Portada, dades demogràfiques i geogràfiques dels 22 pobles, camí comarcal i crèdits de Viquipèdia; Gemini hi afig l'escut, però IDEA-90 el prohibix expressament a la fitxa del poble (és de l'ajuntament), i falta la capçalera «Hui al poble».",
            "canvi": ""
          },
          "ajuntament_entitat_oficial": {
            "estat": "falta",
            "estat_gemini": "falta",
            "evidencia": [
              "src/data/supabase/perfils.js:75",
              "src/config/metadadesDePerfil.js:97"
            ],
            "nota": "Un city_hall es pinta amb la fitxa genèrica d'entitat perquè el kind es perd en el mapeig (només es força a pública, visibilitatFitxa.js:64); no hi ha escut, telèfons d'urgència, horari de registre ni enllaç a la seu electrònica.",
            "canvi": ""
          }
        }
      },
      {
        "dimensio_id": "aparador_i_continguts_publicats",
        "titol": "4. Aparador inferior (Mur, Mercat, Agenda i Verticals)",
        "cel_les": {
          "usuari_vei": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/profile/PublicacionsDeLaFitxa.jsx:19",
              "src/sections/profile/PerfilPublicSection.jsx:883"
            ],
            "nota": "Pestanyes Mur, Mercat, Agenda i «El que connecta» amb barrera d'error; són la finestra recent del Mur del poble actiu (50 per secció), no l'historial complet de la persona.",
            "canvi": ""
          },
          "empresa_cooperativa": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/profile/PublicacionsDeLaFitxa.jsx:19",
              "src/apps/bar/manifest.js:83"
            ],
            "nota": "L'aparador obri pel Mercat si el comerç només ven; no hi ha productes de temporada ni enllaç amb el catàleg del TPV o del Rebost.",
            "canvi": ""
          },
          "grup_associacio": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/profile/PublicacionsDeLaFitxa.jsx:38",
              "src/sections/calendari/rsvpEsdeveniments.js:2"
            ],
            "nota": "Mur i Agenda a la fitxa; l'assistència (RSVP) es desa només al magatzem local de cada aparell, de manera que l'organització no veu qui hi va, i no hi ha pestanya de memòria o documents públics.",
            "canvi": ""
          },
          "poble": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/detail/detailSectionMeta.jsx:631",
              "src/sections/detail/detailSectionMeta.jsx:666"
            ],
            "nota": "Publicacions del poble, Gent i «Empreses i entitats» en diferit, amb el directori filtrat pel poble al servidor; falta el filtre per tipus (serveis públics, comerços, associacions).",
            "canvi": ""
          },
          "ajuntament_entitat_oficial": {
            "estat": "falta",
            "estat_gemini": "falta",
            "evidencia": [
              "src/sections/profile/PublicacionsDeLaFitxa.jsx:38"
            ],
            "nota": "Només tindria les pestanyes genèriques (Mur, Mercat, Agenda); cap tauler de bàndols vigents, agenda municipal, equipaments ni transparència.",
            "canvi": ""
          }
        }
      },
      {
        "dimensio_id": "comunicacio_xat_i_memoria_permanent",
        "titol": "5. Xat diari vs. Memòria estructurada de conversa",
        "cel_les": {
          "usuari_vei": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/xat/XatSection.jsx:399",
              "src/sections/profile/PerfilPublicSection.jsx:733"
            ],
            "nota": "Directe amb /xat?amb=:id, sense botó d'escriure's a un mateix (xat-flux-04) i amb avisos push opcionals; falten el silenci nocturn i el permís de qui pot obrir-te conversa.",
            "canvi": ""
          },
          "empresa_cooperativa": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "supabase/migrations/2609282100_xat_de_pagina.sql:336",
              "supabase/migrations/2609282100_xat_de_pagina.sql:528"
            ],
            "nota": "Una 'company' té directe i comunitat de pàgina amb canal Avisos (només hi escriuen els gestors) i grup General; falten resposta honesta fora d'horari i encàrrecs estructurats.",
            "canvi": ""
          },
          "grup_associacio": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/data/contracte.js:949",
              "supabase/migrations/2609282100_xat_de_pagina.sql:356"
            ],
            "nota": "Un grup (kind 'group', com Rentonar) només té un fil de xat de grup sense org_id: cap comunitat, cap canal Avisos, cap General ni FitxaVivaDeComunitat (contra el que afirma Gemini), i cap tema permanent.",
            "canvi": ""
          },
          "poble": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "supabase/migrations/2609282100_xat_de_pagina.sql:336",
              "supabase/migrations/2609282100_xat_de_pagina.sql:528"
            ],
            "nota": "La comunitat del poble ja té el canal Avisos de només lectura per al veïnat (ho imposa el servidor) i un General obert; el que falta són els temes permanents i la memòria, no la separació d'Avisos que Gemini posa com a pendent.",
            "canvi": ""
          },
          "ajuntament_entitat_oficial": {
            "estat": "falta",
            "estat_gemini": "falta",
            "evidencia": [
              "supabase/migrations/2609282100_xat_de_pagina.sql:336"
            ],
            "nota": "Res específic: un city_hall rebria la comunitat genèrica d'entitat (Avisos dels gestors i General obert a tot el poble), sense l'avís de la Llei 39/2015 ni una bústia traçable per àrees.",
            "canvi": ""
          }
        }
      },
      {
        "dimensio_id": "governanca_rols_i_membres",
        "titol": "6. Governança, rols delegats i continuïtat institucional",
        "cel_les": {
          "usuari_vei": {
            "estat": "a_mitges",
            "estat_gemini": "fet",
            "evidencia": [
              "src/config/xifratXat.js:20",
              "src/sections/profile/DetallPrivacitat.jsx:32"
            ],
            "nota": "Hi ha propietat del compte i canvi d'actor al CalaixIdentitats, però el bloc «Persones de confiança» que cita Gemini depén de la bandera E2EE, apagada per defecte, i ni tan sols entra al paquet; la recuperació social no existix.",
            "canvi": "Gemini el dona per fet amb BlocPersonesConfianca, que no és accessible per cap usuari (E2EE_ACTIU_PER_DEFECTE = false)."
          },
          "empresa_cooperativa": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/profile/GestioMembres.jsx:29",
              "src/sections/profile/GestioMembres.jsx:484"
            ],
            "nota": "Rols owner/admin/member amb alta directa (no és una invitació), canvi de rol, baixa i transferència de propietat; falta un rol limitat de dependent o TPV.",
            "canvi": ""
          },
          "grup_associacio": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/profile/GestioMembres.jsx:29",
              "src/sections/connectar/organitzacio/BlocFormarPart.jsx:6"
            ],
            "nota": "El mateix motor de membres i «Actua com a»; demanar formar-ne part és un missatge al xat, i no hi ha junta, relleus ni torns.",
            "canvi": ""
          },
          "poble": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/admin/pobleAdministrat.jsx:23"
            ],
            "nota": "L'administració del poble és només per a la superadministració amb segon factor; no hi ha custòdia coral ni separació respecte del govern municipal.",
            "canvi": ""
          },
          "ajuntament_entitat_oficial": {
            "estat": "a_mitges",
            "estat_gemini": "falta",
            "evidencia": [
              "supabase/migrations/2610311500_commutacio_grup_empresa_i_transferencia_propietat.sql:231",
              "supabase/migrations/2609080000_initial_schema.sql:48"
            ],
            "nota": "Un city_hall usa els rols genèrics owner/admin/member, el servidor no deixa transferir-ne la titularitat (només s'obté per reclamació revisada) i cada publicació signada per l'entitat conserva internament la persona física (owner_user_id); falten rols per regidoria o servei, un registre de rectificacions consultable i el protocol de traspàs després d'eleccions.",
            "canvi": "Gemini diu que no hi ha rols ni registre de qui publica; hi ha el motor genèric, el bloqueig de transferència específic de city_hall i la traça interna de l'autor, sense cap interfície institucional."
          }
        }
      },
      {
        "dimensio_id": "connexions_pertinenca_i_fedivers",
        "titol": "7. Pertinença, «Connectar» i Federació (ActivityPub + Sollutia)",
        "cel_les": {
          "usuari_vei": {
            "estat": "a_mitges",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/profile/Seguidors.jsx:122",
              "src/sections/profile/PerfilPublicSection.jsx:676"
            ],
            "nota": "Connectar, «Veïnat connectat amb tu» i la visibilitat de les connexions funcionen; la federació no: cap persona té actor ActivityPub i els enllaços rel=\"me\" només s'emeten a la fitxa de Sóc de Poble, perquè cap fila de persona porta adreça del Fedivers.",
            "canvi": "La part de federació que justifica el verd (rel=\"me\") no s'aplica a les persones; només la pertinença està feta."
          },
          "empresa_cooperativa": {
            "estat": "a_mitges",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/pobles/EntitatsDelPoble.jsx:1",
              "tooling/seo/genera-federacio.mjs:12"
            ],
            "nota": "Connectable i llistada a «Empreses i entitats», però sense federació: els únics actors publicats són el del projecte i La Torre, el rel=\"me\" és només de la fitxa del projecte i la Frontissa de Sollutia només transporta hui Viquipèdia i Notícies.",
            "canvi": "El verd es basava en rel=\"me\" i Sollutia, que no s'apliquen a cap comerç."
          },
          "grup_associacio": {
            "estat": "a_mitges",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/connectar/organitzacio/BlocIncloureEnEntitat.jsx:1",
              "tooling/seo/genera-federacio.mjs:24"
            ],
            "nota": "Formar part, incloure algú i el directori del poble funcionen, però cap grup té actor federat ni relació niada grup dins de grup.",
            "canvi": "La fila inclou la federació i cap grup en té; per coherència amb el poble (a mitges per una federació de fase 1), no pot ser fet."
          },
          "poble": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/data/activitypub.js:70",
              "src/sections/pobles/DetallPoble.jsx:76"
            ],
            "nota": "Actor, Outbox i WebFinger estàtics de fase 1 només per a La Torre de les Maçanes (POBLES_FEDERATS); la resta de pobles no en té, i seguir o respondre des del Fedivers continua pendent.",
            "canvi": ""
          },
          "ajuntament_entitat_oficial": {
            "estat": "falta",
            "estat_gemini": "falta",
            "evidencia": [
              "src/data/federacio/inboxActivityPub.js:10",
              "wordpress-plugin/includes/abilities-mcp.php:221"
            ],
            "nota": "Cap ingesta de bàndols ni d'edictes: la bústia ActivityPub no està desplegada i naix apagada, i el connector de WordPress només prepara un esborrany en sec per a revisió humana.",
            "canvi": ""
          }
        }
      },
      {
        "dimensio_id": "economia_local_comandes_i_apps",
        "titol": "8. Micro-aplicacions enxufables (Rebost, TPV Bar, Gestoria, Lector)",
        "cel_les": {
          "usuari_vei": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/apps/plataforma/registreApps.js:39",
              "src/apps/plataforma/RutaApps.jsx:57"
            ],
            "nota": "Rebost (/app/rebost), Lector, Salut, Gestoria i Genealogia són apps internes enceses per defecte i locals, i el Bloc de Notes viu a /notes; falta enviar la llista de la compra com a encàrrec a un comerç.",
            "canvi": ""
          },
          "empresa_cooperativa": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/apps/bar/manifest.js:83",
              "src/apps/gestoria/manifest.js:117"
            ],
            "nota": "El Bar i la Gestoria existixen com a apps locals, però no estan lligades a la fitxa /empresa ni a reserves o encàrrecs.",
            "canvi": ""
          },
          "grup_associacio": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/components/PedraSeca/UniversalListCard/modes/bandaEixida.js:1",
              "src/sections/xat/llistaComu.js:12"
            ],
            "nota": "Hi ha els models d'«El Comú» per a eixides de banda, loteria en dipòsit, escola d'educands i cens de colla (que Gemini posa com a pendents), però el servidor encara no admet missatges 'llista_comu' i només viuen a l'espècimen de disseny; el Bar és genèric.",
            "canvi": ""
          },
          "poble": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/detail/PageDetailSection.jsx:104",
              "src/sections/detail/PageDetailSection.jsx:105"
            ],
            "nota": "Banc de llavors, rutes, herbari i calendari agrícola són pàgines globals (/page/...), no pestanyes de cada poble, i no hi ha directori de recursos comunals.",
            "canvi": ""
          },
          "ajuntament_entitat_oficial": {
            "estat": "falta",
            "estat_gemini": "falta",
            "evidencia": [
              "src/apps/plataforma/registreApps.js:39"
            ],
            "nota": "Cap mòdul de reserva d'espais o de material municipal; la llista d'apps internes no en porta cap.",
            "canvi": ""
          }
        }
      },
      {
        "dimensio_id": "avisos_bandols_i_bustia_civica",
        "titol": "9. Bàndols, Alertes d'Emergència i Bústia Cívica",
        "cel_les": {
          "usuari_vei": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/xat/useAvisosPushXat.js:1",
              "supabase/migrations/20261121090000_r32_25_push_directes_i_bandols.sql:33"
            ],
            "nota": "Push opcional del xat des dels Ajustos i, en una migració sense aplicar, el sí de cada persona als bàndols (avisos_push_bandols) sense cap interfície; el veí ja veu els bàndols vigents al Mur, però no hi ha subscripció per pobles.",
            "canvi": ""
          },
          "empresa_cooperativa": {
            "estat": "no_aplica",
            "estat_gemini": "no_aplica",
            "evidencia": [
              "src/sections/mur/alertesMunicipals.js:18",
              "supabase/migrations/2609282100_xat_de_pagina.sql:339"
            ],
            "nota": "Un comerç no emet alertes (el Mur només les reconeix signades per un ajuntament); els avisos de servei ja tenen via al canal Avisos de la seua comunitat.",
            "canvi": ""
          },
          "grup_associacio": {
            "estat": "falta",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/data/contracte.js:949",
              "src/sections/calendari/actePassat.js:171"
            ],
            "nota": "Un grup no té canal Avisos (només un xat de grup obert) i actePassat.js només diu si un acte ja ha passat; no hi ha cap avís intern als socis.",
            "canvi": "Gemini hi compta un canal Avisos que el servidor només crea per a entitats i pobles, mai per a grups."
          },
          "poble": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/mur/MurSection.jsx:365",
              "supabase/migrations/20261121090000_r32_25_push_directes_i_bandols.sql:29"
            ],
            "nota": "El Mur de cada poble ja pinta dalt les alertes i bàndols urgents vigents (72 h fixes) signats per l'ajuntament del poble; el push de bàndols està en una migració no aplicada i amb push_poble_actiu = 'no'.",
            "canvi": ""
          },
          "ajuntament_entitat_oficial": {
            "estat": "a_mitges",
            "estat_gemini": "falta",
            "evidencia": [
              "src/sections/mur/alertesMunicipals.js:91",
              "supabase/migrations/2611011500_autoria_ajuntament_mateix_poble.sql:118"
            ],
            "nota": "L'emissor existix: una publicació del Mur amb l'etiqueta «Alerta», «Emergència» o «Bàndol urgent» signada per un city_hall del mateix poble (D-6) es destaca dalt amb vigència fixa de 72 h i el Mur es pot llegir sense sessió (2611112149:44); falten nivells propis, caducitat triable, PDF accessible, lectura per veu, una interfície d'emissor i la bústia cívica.",
            "canvi": "Gemini diu que l'emissor no existix; el sistema d'alertes municipals (alertesMunicipals.js, useAjuntamentsDelMur.js:37, D-6) ja hi és, encara que depén d'un city_hall aprovisionat a mà."
          }
        }
      },
      {
        "dimensio_id": "reputacio_confianca_i_moderacio",
        "titol": "10. Confiança, reputació no tòxica i moderació LSSI",
        "cel_les": {
          "usuari_vei": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/components/universal/DialegDenunciaContingut.jsx:54",
              "supabase/migrations/2610201500_moderacio_denuncies_i_bloquejos.sql:84"
            ],
            "nota": "Denúncia i bloqueig al servidor, safata de denúncies i cap comptador de m'agrada; falta el reconeixement afectiu amb aprovació del destinatari.",
            "canvi": ""
          },
          "empresa_cooperativa": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/data/contracte.js:1052"
            ],
            "nota": "Una entitat es pot denunciar i bloquejar com una persona; no hi ha recomanacions positives ni canal privat de queixes.",
            "canvi": ""
          },
          "grup_associacio": {
            "estat": "a_mitges",
            "estat_gemini": "fet",
            "evidencia": [
              "supabase/migrations/2609282100_xat_de_pagina.sql:356",
              "src/sections/profile/GestioMembres.jsx:29"
            ],
            "nota": "Els administradors poden afegir i llevar membres i hi ha la denúncia genèrica, però el xat de pàgina d'un grup es crea sense org_id i els seus gestors no en són administradors; les normes de convivència són de plataforma, no del grup.",
            "canvi": "La «moderació pels administradors del grup» es reduïx a la gestió de membres; el grup no modera el seu propi xat."
          },
          "poble": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/detail/detailSectionMeta.jsx:138",
              "supabase/migrations/2610241400_normes_exigides_ugc.sql:2"
            ],
            "nota": "Filtre d'imatges pròpies, sanejament DOMPurify, normes de convivència exigides al servidor abans de publicar i cap algoritme de rànquing; el codi de bon veïnat és de plataforma, no de cada poble.",
            "canvi": ""
          },
          "ajuntament_entitat_oficial": {
            "estat": "falta",
            "estat_gemini": "falta",
            "evidencia": [
              "src/sections/mur/alertesMunicipals.js:18"
            ],
            "nota": "Cap clàusula de neutralitat institucional ni historial públic de rectificacions; la regla D-6 només impedix signar alertes en un altre poble.",
            "canvi": ""
          }
        }
      },
      {
        "dimensio_id": "privacitat_exportacio_i_portabilitat",
        "titol": "11. Privacitat, «Tot Fora» (Open Data) i sobirania de dades",
        "cel_les": {
          "usuari_vei": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/profile/DetallPrivacitat.jsx:42",
              "src/sections/profile/PortabilitatFederada.jsx:17"
            ],
            "nota": "Còpia JSON de les dades, consentiment i baixa amb purga als 30 dies; la «portabilitat federada» és només un comprovador local de documents ActivityPub, perquè la persona no té actor.",
            "canvi": ""
          },
          "empresa_cooperativa": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/profile/vcardOrganitzacio.js:113",
              "src/apps/gestoria/manifest.js:117"
            ],
            "nota": "vCard pública i dades comptables locals a la Gestoria i al Bar; cap «Tot Fora» del catàleg i les publicacions del comerç.",
            "canvi": ""
          },
          "grup_associacio": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/profile/DocumentacioHistoricaRentonar.jsx:1"
            ],
            "nota": "vCard i l'arxiu documental codificat de Rentonar; cap paquet anual d'arxiu per a una associació qualsevol.",
            "canvi": ""
          },
          "poble": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/pobles/DetallPoble.jsx:70",
              "src/data/exportaMunicipiOpenData.js:7"
            ],
            "nota": "Paquet Open Data reproduïble (BagIt, Data Package, SHA-256, JSON-LD, iCalendar) per a qualsevol poble amb slug vàlid, i ActivityStreams només per a La Torre; dins de l'app nativa no es pot descarregar.",
            "canvi": ""
          },
          "ajuntament_entitat_oficial": {
            "estat": "falta",
            "estat_gemini": "falta",
            "evidencia": [
              "src/data/exportaMunicipiOpenData.js:46",
              "src/data/exportaMunicipiOpenData.js:176"
            ],
            "nota": "No hi ha paquet d'arxiu administratiu, i el paquet municipal exclou expressament tot el que ve de section_submissions, que és on viuen els bàndols signats per un ajuntament.",
            "canvi": ""
          }
        }
      },
      {
        "dimensio_id": "marc_legal_lssi_rgpd_ens_wcag",
        "titol": "12. Requisits legals, accessibilitat Sènior i normativa sectorial",
        "cel_les": {
          "usuari_vei": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/components/universal/ControlModeSenior.jsx:1",
              "src/config/textosModeSenior.js:17"
            ],
            "nota": "Mode Sènior d'un toc (botons de 56 px, contrast reforçat), temes de contrast, cinc llengües i text legal RGPD/LSSI; falta segellar les versions de consentiment.",
            "canvi": ""
          },
          "empresa_cooperativa": {
            "estat": "a_mitges",
            "estat_gemini": "a_mitges",
            "evidencia": [
              "src/sections/text/legalContent.js:26"
            ],
            "nota": "Només la cobertura general de la plataforma; cap camp de NIF, raó social, condicions de venda o al·lèrgens.",
            "canvi": ""
          },
          "grup_associacio": {
            "estat": "a_mitges",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/profile/PerfilPublicSection.jsx:114",
              "src/sections/profile/PerfilPublicSection.jsx:818"
            ],
            "nota": "La llicència CC BY-NC-SA està escrita a mà només per a Rentonar i la resta d'organitzacions (també les empreses) tenen el mateix camp genèric de drets; no hi ha plantilla de consentiment d'imatge de menors.",
            "canvi": "El mateix camp genèric de drets fa que l'empresa siga a mitges; el grup no té res més que el cas de Rentonar codificat a mà."
          },
          "poble": {
            "estat": "fet",
            "estat_gemini": "fet",
            "evidencia": [
              "src/sections/pobles/CreditsDeViquipedia.jsx:34",
              "supabase/migrations/2611112149_mur_estat_public_i_padro.sql:44"
            ],
            "nota": "Crèdits CC BY-SA de les fonts obertes i lectura de la pàgina i del Mur sense registre; falta una declaració d'accessibilitat per municipi.",
            "canvi": ""
          },
          "ajuntament_entitat_oficial": {
            "estat": "falta",
            "estat_gemini": "falta",
            "evidencia": [
              "src/sections/admin/SegonFactor.jsx:55",
              "wordpress-plugin/includes/abilities-mcp.php:140"
            ],
            "nota": "Cap exigència específica: el segon factor només el demana la superadministració, no hi ha cap porta d'«alt» obligatori als cartells ni filtre anti-DNI a les publicacions (només n'hi ha a la Gestoria), i l'auditoria d'«alt» del connector de WordPress revisa la web amfitriona, no Sóc de Poble.",
            "canvi": ""
          }
        }
      }
    ],
    "resum": {
      "fet": 17,
      "a_mitges": 33,
      "falta": 9,
      "no_aplica": 1,
      "canvis_respecte_gemini": 11
    },
    "rutes_reals": [
      {
        "ruta": "/gent/:agentId",
        "component": "PerfilPublicSection (src/app/App.jsx:1339)",
        "entitat": "usuari_vei"
      },
      {
        "ruta": "/perfil/:agentId",
        "component": "PerfilPublicSection (src/app/App.jsx:1338)",
        "entitat": "usuari_vei"
      },
      {
        "ruta": "/javillinares, /socdepoble, /rentonar",
        "component": "PerfilPublicSection amb id fix (RUTES_CANONIQUES, src/app/App.jsx:1355)",
        "entitat": "usuari_vei / empresa_cooperativa / grup_associacio"
      },
      {
        "ruta": "/el-meu-perfil (?organitzacio=:id)",
        "component": "PerfilShell dins RequireAuth (src/app/App.jsx:1334)",
        "entitat": "usuari_vei / empresa_cooperativa / grup_associacio"
      },
      {
        "ruta": "/empresa/:agentId",
        "component": "PerfilPublicSection (src/app/App.jsx:1340)",
        "entitat": "empresa_cooperativa (i també un city_hall, mapejat a entitat)"
      },
      {
        "ruta": "/entitats/:agentId",
        "component": "PerfilPublicSection, àlies de /empresa (src/app/App.jsx:1347)",
        "entitat": "empresa_cooperativa"
      },
      {
        "ruta": "/grup/:agentId",
        "component": "PerfilPublicSection (src/app/App.jsx:1349)",
        "entitat": "grup_associacio"
      },
      {
        "ruta": "/ajuntament/:agentId",
        "component": "PerfilPublicSection genèrica, cap emissor (src/app/App.jsx:1348)",
        "entitat": "ajuntament_entitat_oficial"
      },
      {
        "ruta": "/pobles",
        "component": "PoblesSection (src/app/App.jsx:1329)",
        "entitat": "poble"
      },
      {
        "ruta": "/pobles/:itemId",
        "component": "ItemDetailSection pel comodí ':sectionId/:itemId' (src/app/App.jsx:1398)",
        "entitat": "poble"
      },
      {
        "ruta": "/xat, /xat/:threadId (?amb=:id, ?comunitat=:id)",
        "component": "XatSection (src/app/App.jsx:1309)",
        "entitat": "usuari_vei / empresa_cooperativa / poble (comunitat); grup només fil de grup"
      },
      {
        "ruta": "/connectar",
        "component": "ConnectarSection (src/app/App.jsx:1281)",
        "entitat": "totes"
      },
      {
        "ruta": "/mur",
        "component": "MurSection amb RegioAlertesVigents (src/app/App.jsx:1316)",
        "entitat": "poble / ajuntament_entitat_oficial (alertes signades per city_hall)"
      },
      {
        "ruta": "/app/rebost, /app/bar, /app/gestoria, /app/lector, /app/salut, /app/genealogia",
        "component": "RutaApps (src/app/App.jsx:1293)",
        "entitat": "usuari_vei / empresa_cooperativa"
      },
      {
        "ruta": "/page/banc-de-llavors, /page/rutes-de-poble",
        "component": "PageDetailSection (src/sections/detail/PageDetailSection.jsx:104)",
        "entitat": "poble (pàgines globals)"
      },
      {
        "ruta": "/admin/*",
        "component": "AdminSection dins RequireAuth rol superadmin (src/app/App.jsx:1261)",
        "entitat": "poble (administració multipoble)"
      }
    ]
  },
  "entitats_gemini": {
    "usuari_vei": {
      "subtitol": "Persona física (veí resident, fill de la diàspora rural o visitant registrat)"
    },
    "empresa_cooperativa": {
      "subtitol": "Forn, bar, almàssera, cooperativa agrícola, artesà o professional KM 0"
    },
    "grup_associacio": {
      "subtitol": "Banda de música, comissió de festes, associació cultural/ecologista (/rentonar), colla o AMPA"
    },
    "poble": {
      "subtitol": "Comunitat territorial i patrimonial viva (ex. La Torre de les Maçanes i els 22 pobles de l'Aplec)"
    },
    "ajuntament_entitat_oficial": {
      "subtitol": "Consistori, mancomunitat, jutjat de pau, consultori mèdic, protecció civil o col·legi públic"
    }
  },
  "mercat": {
    "visio": "Convertir la maquinària interna d'«Assaig a la Plaça» en una ferramenta cívica i cooperativa dins de Sóc de Poble perquè un forner, una cooperativa d'oli, un jove emprenedor rural, una associació o un ajuntament puguen posar a prova una idea, un producte, un cartell o un servei abans d'invertir-hi estalvis.",
    "principis_etics_innegociables": [
      "Honestedat radical (Llei 0): separar sempre visualment la Fase 1 («Estudi sintètic d'ús i viabilitat», simulada amb arquetips d'IA) de la Fase 2 («Contrast humà», respostes de veïns reals verificats).",
      "Privacitat absoluta (RGPD + Model B): mai s'entrenen models externs amb idees privades d'un emprenedor; execució local al Node 0 o crida efímera sense retenció (`Gemini Decisions API` 0 output tokens per a rúbriques visuals).",
      "Economia circular rural: el Contrast Humà pot ser voluntari solidari (per a projectes comunitaris/associacions) o recompensat amb bons de comerç local KM 0 per als veïns verificadors."
    ],
    "flux_ux_en_4_passos": [
      {
        "pas": 1,
        "titol": "Definir la Proposta (3 minuts, guiat per la IAIA)",
        "descripcio": "L'emprenedor o entitat tria què vol validar: (a) Nou producte/servei rural (ex. cistella setmanal de verdura o servei de menjar casolà per a majors), (b) Cartell/fullet o pàgina pública, o (c) Consulta d'interés comunitari; indica el poble o comarca i el preu/condicions."
      },
      {
        "pas": 2,
        "titol": "Fase 1 · Assaig a la Plaça · Estudi sintètic d’ús i viabilitat (~60 segons)",
        "descripcio": "Un panell equilibrat de 8–12 perfils sintètics rurals calibrats demogràficament (gent gran de 75+, famílies joves, llauradors, neorurals, estiuejants, hostalers) avalua la proposta buscant punts cecs: preu percebut, frens d'accés per a majors, claredat del missatge en 3 segons i dubtes logístics. Lliura un semàfor de viabilitat inicial i 3 millores abans d'eixir al carrer."
      },
      {
        "pas": 3,
        "titol": "Fase 2 · Assaig a la Plaça · Contrast humà (5 minuts per veí opt-in)",
        "descripcio": "Amb la proposta ja polida, es convida un grup reduït (10–25 veïns reals del poble/comarca que s'han apuntat voluntàriament al «Consell de Veïns Verificadors») a respondre 4 preguntes tancades i 1 consell obert des del mòbil, sense soroll de comentaris públics hostils."
      },
      {
        "pas": 4,
        "titol": "Informe de Trellat i Acció Directa",
        "descripcio": "La pàgina genera una fitxa executiva clara (percentatge d'intenció real de compra/ús, franja de preu justa, objeccions reals vs. sintètiques) i, si té llum verda, un botó d'1 clic per publicar-ho com a pre-reserva al Mercat KM 0 o a l'Agenda del poble."
      }
    ],
    "encaix_arquitectonic_pedra_seca": {
      "ubicacio_natural": "Micro-aplicació enxufable `/app/assaig-placa` dins de `src/apps/` (zero pes a l'arrencada estàtica del connector de WordPress!), accessible des de les fitxes d'Empresa, Cooperativa, Grup i Ajuntament.",
      "port_de_dades": "Esborranys i estudis sintètics en IndexedDB local (`sdp-assaig-placa`); només quan l'autor llança el «Contrast humà» passa pel port neutral `backendPort.js` amb respostes agregades anònimes."
    }
  },
  "mercat_subtitols": [
    "Assaig a la Plaça · Estudi sintètic d’ús i viabilitat",
    "Assaig a la Plaça · Contrast humà"
  ]
};
