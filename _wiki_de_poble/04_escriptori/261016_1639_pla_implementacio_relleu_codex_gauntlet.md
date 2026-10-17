---
type: document
status: esborrany
description: Trasllat íntegre dels requisits parcials o pendents de la MCR Codex, amb prioritat, responsable, evidència i criteri de tancament.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_39ba1739-5710-4d97-bf64-fb78d35c591e:c31b4eb1-1dcf-4c3e-bc8d-1147eb1c0ff0
---
# Pla de continuïtat dels requeriments oberts del Gauntlet

**Estat del Pla:** en elaboració · continuïtat dels pendents de l’encàrrec ja aprovat; no substitueix el pla1530 ni amplia l’abast operatiu.

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_39ba1739-5710-4d97-bf64-fb78d35c591e:c31b4eb1-1dcf-4c3e-bc8d-1147eb1c0ff0 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-16T14:40:00.652Z |
| Modificació | 2026-10-16T15:02:56.740108+00:00 |
| Propietari | agent-local |
| Aprovació humana | Encàrrec1530 vigent per a l’abast autoritzat; no es reclama una nova aprovació de rutina |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | GPT Codex |
| Tokens consumits | No disponibles; no estimats |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-16T14:40:00.652Z: esborrany creat pel circuit documental viu.

2026-10-16T15:04:06.289774+00:00: Pla consolidat:93/93 IDs oberts transferits,31 idees i D01–D05 conservats, sense nova autorització operativa implícita.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

Aquest pla conserva **tots els 93 requisits oberts** de la MCR del tall2026-10-16T15:02:56.740108+00:00. És un relleu traçable per a Claude (codi), Gemini (coherència/direcció) i Codex (adversarial), sense substituir el pla canònic1530. No s’arxiva ni es reescriu el que s’ha demanat.

Ordre de treball: (1) bloqueig de CI i prova de compartit públic; (2) identitats/xat/accés local i privacitat de telemetria; (3) notes/XL/editor i Consola; (4) RSS real, imatges, Multimèdia i mapa; (5) economia/ModelB i rescat semàntic per lots. Els fronts independents poden avançar en paral·lel, però només Claude modifica producció.

L’evidència completa de cada ID és a la MCR de [[261016_1632_auditoria_codex]], disponible també a `mcr.json`. Aquestes files són la transferència íntegra, no una selecció de prioritats.

| ID | Demanat / estat heretat | Prioritat i responsable | Criteri verificable de tancament |
|---|---|---|---|
| F01 | Erradicar `Mestre Poble` i `mestre-obres` de codi, proves, llavors i BD · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F02 | Mac Mini signat per Javi amb foto personal · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F03 | Mac Mini única publicació de Javi; totes les altres de Sóc de Poble · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F07 | Xat net tipus WhatsApp, adaptat a mòbil i escriptori · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F08 | Dissociació persona/organització al xat · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F10 | Selector llicència de notes a El compte · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F15 | Un perfil real per identitat; fusionar duplicats remots · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F16 | Entitats fundacionals sempre amb poble · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F17 | Poble obligatori en crear qualsevol entitat · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F18 | Emetre SQL UPDATE propi de profiles i resoldre 403 · [PARCIAL] | P1 · Claude implementa; Codex verifica | Aplicar primer diagnòstic de permisos/RLS; verificar UPDATE propi, rebuig d’altri i anon, SELECT de retorn i no elevació de columnes. Registrar entorn i resultat sense credencials. |
| F20 | OpenGraph WhatsApp complet, imatge oficial correcta · [PARCIAL] | P1 · Claude implementa; Codex verifica | HTML públic accessible al crawler amb title/description/og:image canònics; URL de la imatge retorna image/png1200×630; comprovació del compartit amb memòria cau renovada. |
| F21 | Quatre actors inicials visibles i operatius · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F24 | Config/registre Supabase local equivalent a producció; resposta fluida · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F25 | Intel·ligència local de redacció, DCVB, cultura, botànica · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F26 | Apartat 19 distingix node matriu de WordPress · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F27 | Obligació governança dels nodes de declarar mètriques · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F28 | Infraestructura de mètriques sobiranes agregades sense dades personals · [PARCIAL] | P1 · Claude implementa; Codex verifica | Proves de visita i esdeveniment per perfils de primer nivell i rutes dinàmiques: no ix cap slug, ID ni query personal. Mantindre DNT/GPC i agregació. |
| F29 | Accés Emojis XL entre NOTES i plegat · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F30 | DialegEmoticona substituït per graella Unicode18 accessible · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F31 | Clic al catàleg assigna icona activa i actualitza rail/barra · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F32 | Inserció al cursor TipTap o còpia amb toast · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F33 | Components Pedra Seca i cap dependència nova · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F34 | Suite notes+emojis específica · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F35 | Signatura persona/pilot correcta, poble i foto de la identitat activa · [PARCIAL] | P2 · Claude implementa; Codex verifica | Sessió remota, pilot local explícit i entitat activa resolen foto/poble coherents; l’anònim remot no s’identifica com Javi. |
| F38 | Barra taronja immediata sota blava, sense caixa de capçalera entremig · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F39 | Eliminar ploma/botó central de barra taronja · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F40 | Placeholder H1 exacte «Nota sense títol» com targeta · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F41 | Subtítol i entradella immediats, mateixos textos guia · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F42 | Desplegable Edició avançada just sobre TipTap · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F43 | Agrupar capçalera, logotip, carpeta, categories, etiquetes, emoji, drets, PDF/portada · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F44 | Controls plegats permeten flux net; configurat apareix al lloc real · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F45 | Eliminar peu «Ja publicat al Mur» · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F46 | Template verge H3/H4, paràgrafs i llistes · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F47 | Template s'esvaeix al primer clic/pulsació · [NO FET / PENDENT] | P1 · Claude implementa; Codex verifica | TipTap real: primer focus/tecla buida només la plantilla verge normalitzada; text real i edicions prèvies mai s’esborren; llista inclosa. |
| F48 | Scroll down oculta dues barres en compacte · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F49 | Scroll up reapareix immediatament · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F50 | Activació mòbil/tauleta i finestres de poca alçada · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F51 | Transformacions i CLS=0 mesurat · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Mesura real de CLS en navegador durant scroll avall/amunt i canvis de mida, amb barres dins del viewport; moviment reduït i teclat respectats. |
| F56 | Garantia sessions prolongades/heap i 1.000–40.000 usuaris · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F57 | Ordre estricte Comunitat Sóc → Javi → Gent de la Torre → IAIA · [NO FET / PENDENT] | P1 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F58 | Comunitat Sóc permanent amb Avisos, General i Beta Testers · [PARCIAL] | P1 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F59 | Eliminar DM Sóc sintètic; conservar només DM explícit futur · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F60 | Capçalera Javi → /javillinares · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F61 | Capçalera Sóc → /socdepoble · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F63 | Capçalera IAIA → fitxa de la IAIA · [PARCIAL] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F64 | Manifest L'Ànima passa a /anima i menú Sistema corregit · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F65 | /iaia o /perfil/iaia reservat a fitxa i accés des de xat/cercador · [NO FET / PENDENT] | P2 · Claude implementa; Codex verifica | Completar el requisit literal i resoldre el límit descrit a l’evidència; prova del flux d’usuari, sobre el codi i mode de dades identificats. |
| F66 | Entrada pilot local immediata sense backend disponible · [NO FET / PENDENT] | P1 · Claude implementa; Codex verifica | Pilot només en mode local explícit, crea sessió de prova sense HTTP al54321; prova del flux UI complet. Mode remot continua exigint autenticació real i no obté identitat ni permisos de pilot. |
| I01 | Bloc 0: estudiar Feedly amb REA · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I04 | Fonts RSS reals Emowe/Mitjana/Hernández/etc. · [NO FET / PENDENT] | P1 · Claude implementa; Gemini arquitectura; Codex verifica | Connector RSS aprovat amb fonts reals, captura de resposta, parser, fixture i persistència. No activar fake news per omplir el buit. |
| I05 | Bookmarklet amb tria Bloc/Lector · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I06 | Desar article directament al Lector · [NO FET / PENDENT] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Capturar una pàgina real com article al lector i com esborrany a Notes; no substituir l’article per una font RSS. |
| I07 | Hidratar títol, subtítol, entradeta, URL i OG · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I09 | Matriu de requeriments en viu · [NO FET / PENDENT] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Consola llig registre viu amb IDs/evidències/dates; filtres i estat desconegut obsolet sense transformar-lo en verd. |
| I10 | Balanç demanat/executat i trasllat automàtic · [NO FET / PENDENT] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Trasllat idempotent de tots els pendents entre sessions, amb historial i cap duplicat ni pèrdua; comparar conjunts d’IDs. |
| I11 | Botons validar/refutar tasques · [NO FET / PENDENT] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Validar/refutar des de la web amb permisos, persistència i registre d’actor; la certificació humana no falseja resultat automàtic. |
| I12 | Resums executius/diagnosi accessibles · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I13 | Bloc 1: regla 1200² WebP <80 KB universal · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I14 | Capçalera i targeta mateix recurs · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I15 | Avatar 400² WebP universal · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I16 | WebP estricte a tots els navegadors · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I18 | Preservació EXIF per defecte i opt-out · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I20 | Tractor per migrar catàleg i connectar ingestió · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I23 | FCP immediat i absència de salts · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I24 | Onada 3: TPV estructura Loyverse · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I25 | Mode Bar i Mode Rebost · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I26 | Torn, tiquets, categories, al·lèrgens · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I27 | Gestoria: llibre i tresoreria · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I28 | Gestoria: fidelitat ergonòmica Holded/FacturaDirecta/Odoo/GnuCash · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I30 | Connexió efectiva amb Sollutia · [NO FET / PENDENT] | P1 · Claude implementa; Gemini arquitectura; Codex verifica | Rebre endpoints de Sollutia, origen permés i captures; cada recurs amb traductor+fixture i prova GET sense credencials no autoritzades. |
| I32 | Capacitat real 40000 usuaris concurrents · [NO FET / PENDENT] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Entorn i càrrega real autoritzats, sessions independents, mesura servidor/DB/RLS/sockets, errors, límits i recuperació; mai inferir-ho del simulador. |
| I33 | Zero leaks, immunitat i zero regressions · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Completar el requisit literal en l’abast requerit; adjuntar prova reproduïble i resoldre el límit de la fila, sense extrapolar una simulació a producció. |
| I34 | Reserves d'imatges de pobles · [NO FET / PENDENT] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Les 9 reserves resolen recursos reals i decodificables amb base arrel i base incrustada; revisar les branques nominals i la selecció determinista. Mantindre intacta la resolució d'URL externa i de fotos pròpies existents. |
| I35 | Cronologia de Multimèdia · [PARCIAL] | P2 · Claude implementa; Gemini arquitectura; Codex verifica | Derivar grups ordenats per mes/any dels mitjans carregats en l'àmbit vigent, sense ometre/duplicar ítems; política explícita per dates absents/invàlides i estat buit. Comprovar la cadena carregador→context→vista amb dades reals locals i canvi d'àmbit. No basta ampliar `mediaContent.js`: el remot llig app_content/submissions. |
| M01 | Arbre assets separat en sistema, pobles, usuaris, entitats i contingut · [NO FET / PENDENT] | P2 · Claude; Gemini revisa | Manifest de migració complet, totes les referències actualitzades, redireccions si cal i zero recursos trencats. |
| M02 | Canvi d'actor assigna cada recurs al calaix correcte · [PARCIAL] | P2 · Claude; Codex verifica | Prova d'ingestió amb persona i entitat; propietari, carpeta i permisos coherents, sense compartir dades privades. |
| M03 | Multimèdia reflecteix tot el cens real de 100–200 fotos · [PARCIAL] | P2 · Claude; Gemini revisa | Cens editorial complet, deduplicat i amb drets/privacitat; galeria mostra tots els recursos aprovats, no un nombre artificial. |
| M04 | Clic en foto obri visor modal natiu amb fons fosc · [NO FET / PENDENT] | P2 · Claude; Codex verifica | Obrir/tancar visor amb ratolí i teclat, focus restaurat, sense ruta externa i sense scroll del fons. |
| M05 | Visor amb anterior/següent i zoom fluid · [NO FET / PENDENT] | P2 · Claude; Codex verifica | Navegació amb límits coherents, teclat/tàctil i zoom sense perdre la imatge ni crear listeners residuals. |
| M06 | Panell EXIF: data/hora, GPS, càmera, autor, poble i drets · [NO FET / PENDENT] | P2 · Claude; Gemini revisa | Casos amb metadades completes, parcials i privades; mostrar desconegut sense inventar informació. |
| M07 | Eliminar /multimedia/town-* i portar al poble canònic · [NO FET / PENDENT] | P1 · Claude; Codex verifica | Enllaç i accés directe antics resolen la pàgina de poble canònica, també enrere/endavant. |
| M08 | Mapa fotogràfic llig GPS i temps EXIF · [NO FET / PENDENT] | P2 · Claude; Gemini dissenya | Importació de mostra amb EXIF verificat; punts i data correctes, errors i metadades absents tractats. |
| M09 | Mapa agrupa/desagrupa segons zoom · [NO FET / PENDENT] | P2 · Claude; Codex verifica | Mostra de punts pròxims i separats, zoom de poble a carrer i rendiment mesurat. |
| M10 | Mapa amb cronologia lateral per dies, etapes i temes · [NO FET / PENDENT] | P2 · Claude; Gemini revisa | Selecció temporal/tema sincronitzada amb punts, fus horari correcte i navegació accessible. |
| M11 | Mapa processa fotos al dispositiu sense enviar-les a tercers · [NO FET / PENDENT] | P1 · Claude; Codex verifica | Prova de xarxa interceptada: zero bytes de fotos/EXIF personal fora del dispositiu; documentar peticions de tessel·les si n'hi ha. |
| G04 | Lectura profunda i contrast exhaustiu de tot el corpus · [PARCIAL] | P2 · Gemini i Codex | Completar cua per lots, contrast amb codi viu i estat per font; usar eines de cada format, sense executar artefactes antics ni tractar BIOS copiat com autoritat. |
| G05 | Informe extens de rescat amb idees i codi ja existent · [PARCIAL] | P2 · Gemini i Codex | Completar contrast dels 58 candidats i de la cua, integrar tot en registre viu únic amb proves i vigència. |
| G06 | Perfil: suite i comprovació visual de tres columnes · [PARCIAL] | P2 · Codex | Navegador amb identitat de prova, tres columnes, controls i persistència; registrar mida de pantalla. |
| G07 | Xat: suite i adaptació responsive · [PARCIAL] | P2 · Codex | Proves dels modes local/remot i recorregut visual responsive sense buits ni actors duplicats. |
| G08 | Lector rep dades reals · [NO FET / PENDENT] | P1 · Claude; Codex verifica | Rebut d'una font real amb URL, data, parseig, lectura i persistència; error/offline visibles sense notícia inventada. |
| G11 | npm run test:ci complet i verd · [PARCIAL] | P1 · Claude corregeix; Codex verifica | CI completa exit0 sobre tall identificat; explicar TODO/skip i repetir només proves afectades pels canvis posteriors. |
| G12 | ESTAT, Acta Marmota i porta de tancament · [PARCIAL] | P2 · Codex; Gemini deute global | Actualitzar ESTAT i executar porta; si falla, registrar errors concrets, propietari i criteri sense declarar tancament vàlid. |
| G14 | Enxufabilitat desacoblada i font de veritat Supabase · [PARCIAL] | P1 · Claude; Gemini arquitectura | Captura real→traductor→fixture→prova del recurs GET, sense tocar el port de backend ni enviar credencials a origen no permés. |

### Registre addicional d’idees rescatades

No són ordres d’implementació automàtica ni bloquegen el lliurament dels requisits vigents. Gemini ha de conciliar-ne vigència i estat abans d’incorporar-les al registre viu. Cada font i contrast íntegre és a l’annex de l’auditoria.

| ID de rescat | Idea | Font | Contrast | Pas següent |
|---|---|---|---|---|
| R01 | Accions del Manifest 2022: cotxe compartit, acompanyament, bancals, eines, compres, avisos, oficis i animalets | `01_produccio/260911_0645_propostes_manifest_panell_control.md` | `destinsControl.js:150` i `:156` tenen Vehicle i Animalets; la llista inclou Mur, Mercat, Calendari, Mapa, Treball i Habitatge. No hi ha correspondència directa demostrada per a totes les accions del Manifest. **PARCIAL** | Mapar cada necessitat a un flux complet: oferta/demanda, dades mínimes, publicació i contacte. No donar una card per servei implementat. |
| R02 | Capturar des del navegador preservant jerarquia i decidir després si publicar | `01_produccio/260911_0012_agenda_futur_extensio_chrome.md`; `90_arxiu_historic/261002_0310_visio_arquitectonica_expansio.md` | `SnippetCurador.jsx`, `modeDesa.js` i `contingutExtern.js` resolen URL, títol, subtítol, entradilla i destí Notes/Lector. El lector queda pendent del connector. No s'ha localitzat un paquet de navegador dins del codi cercat. **PARCIAL** | Provar des d'una web externa fins a la nota; identificar paquet real, extracció de cos H1/H2/H3 i permisos. |
| R03 | Classes de targetes d'acció i informatives coherents | `01_produccio/260911_0006_tasques_ui_standardization.md` | Hi ha `src/components/PedraSeca/organismes/UniversalCard.jsx` i proves `UniversalCard.accio.test.jsx`; la ruta antiga `components/ui/` ja no és l'autoritat. **BASE EXISTENT** | Auditar les variants actuals i els punts que encara creen cards pròpies, sense tornar al disseny de setembre. |
| R04 | Contracte compartit de graella amb accions de capçalera | `01_produccio/contracte_graella.md` | `AppGridShell.jsx` i `AppGridColumn.jsx` existixen; `startActions`, `endActions` i `replegaTotaCapcalera` estan al component viu. **PEÇA EXISTENT** | Usar el contracte viu com a referència dels editors i evitar variants locals. |
| R05 | Pont WhatsApp per evitar aïllar el veí del seu entorn | `90_arxiu_historic/260927_1400_idea_pont_whatsapp.md` | `bot/arrels.mjs:47-49` encara apunta a tres fitxers absents: antic Genotip, `.agents/identity/PROFILE.md`, `bot/persona/IAIA_MARIA.md`. No s'ha arrencat el bot ni inspeccionat sessions. **NO OPERATIU ACREDITAT** | Decidir producte i transport, reparar només després del contracte. Les promeses i tarifes de WhatsApp del text antic no estan verificades. |
| R06 | Xat d'entrada que mostra persones/actors i ajuda a entendre el producte | `260929_1210_brainstorming_onboarding_fake_chat.md` | El mandat actual de quatre actors i resposta identificada com automàtica substituïx el llenguatge antic d'«il·lusió» i «cebo». **REFORMULADA** | Validar els quatre actors i la transparència; no importar converses falses com si foren reals. |
| R07 | Mapa visual d'agents: fluxos, calendari, skills, entrades/eixides, agents i actors | Els 13 Markdown de `02_investigacio_ia/001 NEXUS/` | El codi viu té `src/sections/consola/mapa/`, `FluxosMapa`, `CalendariMapa`, `InventariMapa`, `EntradesEixides`, `AgentsAtomics` i `ActorsMapa`. `mapaContent.js:20` retorna absència fora de DEV. **BASE ADAPTADA, NOMÉS DEV** | Reutilitzar el mapa existent per al govern visual. No instal·lar ni executar el Python/instal·ladors històrics. |
| R08 | Panell superadmin de taxonomia i estil amb historial i segon factor | `261009_2005_brainstorming_panell_superadmin.md` | `SegonFactor`, `FacetaTaxonomia`, `FacetaEstil`, crides al port i restauració de versions presents. **PEÇA EXISTENT** | Provar MFA, permisos del servidor, conflicte de versió i persistència remota; no reobrir el diagnòstic antic d'absència total. |
| R09 | Aplicacions modulars que fallen de manera aïllada | `261003_Onada_4_Tancament/261003_2320_directriu_arquitectura_plugins.md` | `src/apps/plataforma/registreApps.js` valida manifests, té apps internes i registre extern; `index.js` exposa API de plataforma. **PEÇA EXISTENT** | Provar una app invàlida i una fallada del mòdul; l'objectiu de milers de plugins és visió, no càrrega certificada. |
| R10 | Amagar portada en eines recurrents per guanyar espai | Mateixa directriu de plugins | No s'ha acreditat l'interruptor de preferència comú en la cerca feta. **PENDENT DE VERIFICAR** | Localitzar el control actual o afegir-lo al contracte de plataforma només si continua vigent. |
| R11 | Receptes basades en ingredients disponibles | `261002_0310_visio_arquitectonica_expansio.md`; `90_arxiu_historic/261011_0130_ordres_nit_directora.md` | Receptari de 14 plats i recomanador determinista en `src/apps/nevera/nucli/`. **PEÇA EXISTENT** | Provar flux compra→rebost→recepta; quantitats/caducitats no estan acreditades en l'estat real del rebost. |
| R12 | Cures quotidianes privades, diaris i horaris | `90_arxiu_historic/261002_0310_visio_arquitectonica_expansio.md` | App `salut` registrada i nucli local existent. No s'ha trobat connector AEMPS en la cerca acotada. **PARCIAL** | Separar registre de cures ja existent d'interpretació clínica de medicaments, que seguix sent recerca. |
| R13 | TPV connectat amb escandalls i compra al proveïdor | `90_arxiu_historic/261002_0310_visio_arquitectonica_expansio.md` | App `bar` registrada i CSV real de La Parròquia a `src/apps/bar/llavors/la-parroquia-loyverse.csv`. **BASE EXISTENT** | Verificar els fluxos reals de caixa/tiquet/inventari amb el front principal; no confondre captures Loyverse amb implementació. |
| R14 | Reserva de taula amb calendari del propietari | `90_arxiu_historic/261002_0310_visio_arquitectonica_expansio.md` | No s'ha acreditat integració amb Google Workspace en esta lectura. **IDEA PENDENT** | Definir què es reserva, confirmació i disponibilitat; no assumir que una subscripció externa garantix el flux tècnic. |
| R15 | Infraestructura compartida per a oli, torró i productors locals | `90_arxiu_historic/261002_0310_visio_arquitectonica_expansio.md` | Mercat i Gestoria són bases reutilitzables, però l'oferta comercial/omnicanal no s'ha validat. **IDEA DE PRODUCTE** | Validar un cas de productor concret i el procés complet, sense crear un segon ERP. |
| R16 | Mapatge burocràtic que no confon NIF amb nom | `261012_1322_relat_historic_xylella.md` | `formularisFinestreta.js:10`, `validadorsIdentitat.js:280`, fitxa d'identitat i esquemes purs. **PEÇA EXISTENT** | Executar proves de regressió i comprovar model oficial concret; els quatre formularis actuals no inclouen una presentació Xylella automàtica. |
| R17 | Partida doble amb comptes, balanços i separació llar/empresa | `261012_1715_gnucash_arrel.md` | Hi ha facturació, registre, conciliació, simulació fiscal i llibre XLSX. No s'ha acreditat un llibre major de partida doble complet. **PARCIAL / MODEL COMPTABLE PENDENT** | Fer inventari de motor comptable i reconciliar invariants de deure/haver abans d'anomenar-lo GnuCash propi. |
| R18 | Gestoria amb context fiscal, escenaris i gràfics útils | `261012_1915_arquitectura_visual_erp.md` | Manifest Gestoria amb facetes i `impostos/nucli/simulacio.js`; les xifres porten `[NO VERIFICAT]` i cobertura completa/parcial/cap. **PEÇA EXISTENT** | Verificar UI i dades; la simulació no és una declaració fiscal presentada. |
| R19 | RSS d'investigació que convertix novetats en propostes de skills | `261012_1825_workflow_rss_skills.md` | Hi ha app lector i `wiki-busca-skills`; no s'ha acreditat la cadena RSS→anàlisi→proposta→revisió. El mateix text la deixa estacionada. **IDEA PENDENT** | Dissenyar un flux que crea propostes revisables, sense instal·lació automàtica de codi extern. No s'ha creat cap cron en esta auditoria. |
| R20 | Tres lents de manteniment: duplicitat, creixement i seguretat/rendiment | `261012_1815_skills_antislop_thermos.md` | No existixen les rutes exactes `porta-antislop.mjs` ni `core-thermos-manteniment/SKILL.md`. Hi ha moltes portes actuals: absència del nom no prova absència de cobertura. **PROPOSTA NO CONCILIADA** | Mapar les tres lents a portes ja existents; evitar crear comprovacions duplicades. |
| R21 | Automatitzar friccions repetides entre humà i agents | `261002_1650_carboni_silici_fluxos.md`; `261002_1655_tractor_fluxos.md` | La skill proposada `core-fluxos-automillora` no està en la ruta exacta. **PATRÓ RESCATABLE** | Guardar entrada, eixida, criteri d'èxit i desencadenant de cada flux útil, en lloc de copiar les ordres antigues. |
| R22 | Feedback immediat i moviment interrompible | `261004_0045_skills_kowalski_impeccable.md`; `261011_0246_teoria_kowalski_apple_design.md` | Són referències de disseny, no prova que les regles estiguen implementades. **CRITERI PER VERIFICAR** | Auditar components concrets, teclat i moviment reduït; no imposar springs o noves dependències per nom d'autor. |
| R23 | Humor rural visual amb text llegible i sense pseudotext | `261010_2200_tractor_ortografia_valenciana.md` | Necessitat de qualitat recuperada; el nom del fitxer d'ortografia no descriu tot el contingut visual. **CRITERI VIU A CONTRASTAR** | Comparar amb la skill visual actual i conservar els exemples útils; cap generació d'imatges feta ací. |
| R24 | Àrea de clic de tota la capçalera i navegació amb fletxes | `260927_1230_deute_accessibilitat_fletxes.md`; `260927_1645_deute_usabilitat_botons.md` | `AppGridColumn.jsx:115` té `replegaTotaCapcalera`; no s'ha acreditat cobertura general de fletxes. **PARCIAL** | Auditar focus, teclat i excepcions (Carpetes/Notes) en les instàncies reals. |
| R25 | Mapa patrimonial de fotos, arbres i cronologies | Pla actual + arqueologia `261010_1741`, fragment de rescat | Fitxer Emowe de referència inventariat; imatge `public/assets/img/pi-pla-verd.jpg` encara existix. Hi ha geolocalització en enquadrament. No s'ha acreditat mapa/visor integrat. **PARCIAL** | Rescatar fitxa patrimonial amb coordenades/font verificades i provar ingestió EXIF→mapa; no executar HTML històric. |
| R26 | Mesures del client: LCP, DOM i complexitat dels fitxers | `261010_1845_noves_ordres_fable.md`; arqueologia 261010 | Les dues idees es van salvar explícitament. La cerca no acredita les targetes `nodes-del-dom` / `fitxers-dins-del-sostre`; sí existix infraestructura de mètriques. **PENDENT** | Contracte de mètrica reproduïble i productor real, diferenciant N/A de zero. No restaurar els tretze llindars antics derogats. |
| R27 | Càrrega documental mesurada en la Consola | Fragment de rescat de 261010 | `consolaContent.js:103` i `consolaPagines.js:257` consumixen `termometria.artefactesActius`; `recullConsola()` no la produïx i `comptaArtefactes()` existix en `termometre_context.mjs:446`. **BUIT D'INTEGRACIÓ REVALIDAT** | Connectar font i mètrica amb abast clar, sense inferir-la del nombre d'arxius o inventar tokens. |
| R28 | Escoltar el Mur i disposar d'un mode de lectura de contrast extrem | Fragment de rescat de 261010 + roadmap públic | No s'ha localitzat `speechSynthesis` al codi viu cercat ni selector de contrast al Perfil; sí existeix base de tokens/accessibilitat. **IDEES PENDENTS** | Un cas petit i verificable: llegir una publicació i un control d'aparença accessible. |
| R29 | Caçador de butlletins, cronista i coneixement agrícola | Arqueologia 261010 + roadmap públic | Hi ha lector RSS; no s'ha acreditat cap lector DOGV/BOE ni RAG agrícola connectat. **IDEES PENDENTS** | Una font real amb procedència, dates i revisió; distingir ingestió de generació i interpretació. |
| R30 | Vigilància d'integritat que caduca i alertes deduplicades | `02_investigacio_ia/vigilante/SECURITY.md` | Document de referència d'un plugin tercer; 70 fitxers del plugin inventariats, codi no auditat ni executat. **PATRÓ DE REFERÈNCIA** | Inspiració: una comprovació antiga deixa de ser verda i un canvi d'estat dispara l'avís. No afirmar que Vigilante està instal·lat a cap node. |
| R31 | Matriu de comprovacions amb estat, data, nota i prova abans/després | `01_produccio/article-ayudawp.md` (cos extret); `checklist-limpieza-wp-ayudawp-complet.csv` | La Consola i les portes aporten una base de seguiment; no s’ha acreditat que tinguen una matriu completa amb aplicabilitat, responsable i verificació posterior. **PATRÓ TRANSFERIBLE** | Adaptar el seguiment al MCR: cada comprovació indica si aplica, què s’ha observat, prova, data i responsable. Les 77 regles WordPress no s’importen com a requisits d’una app React. |

### Responsables i acceptació del rescat



Els responsables següents són **rols proposats per al pla**, no persones que hagen acceptat un encàrrec. El director humà resol vigència i producte; l’orquestrador assigna la implementació. Les prioritats no autoritzen cap canvi per elles mateixes. P1 correspon a coherència o integració revalidada; P2 a comprovació de peces existents; P3 a llavors futures. Una cerca sense coincidències és evidència acotada, no prova universal d’absència.

| ID | Prioritat | Responsable proposat | Criteri d’acceptació del trasllat |
|---|---|---|---|
| R01 | P2 | Producte comunitari | Les huit famílies del Manifest tenen estat i ruta de flux o una llavor pendent amb decisió explícita. |
| R02 | P2 | Captura/Notes/Lector | Una captura externa conserva títol, subtítol, cos i procedència; la nota privada precedix la publicació voluntària. |
| R03 | P2 | Pedra Seca/UI | Cada variant de card té contracte comú i es pot activar amb teclat. |
| R04 | P2 | Pedra Seca/Graella | Una capçalera real resol les accions laterals i el plegament sense duplicar l’acció interior. |
| R05 | P1 | IAIA/Ports amb decisió de Producte | Les tres referències absents tenen substitució canònica o el bot queda declarat retirat; cap promesa d’operativitat sense prova. |
| R06 | P2 | Acollida/Xat | La prova dels quatre actors evidencia autoria i automatització; cap simulació es presenta com a conversa real. |
| R07 | P2 | Consola | Les sis vistes del mapa tenen fonts actuals i l’abast DEV és visible al registre. |
| R08 | P2 | Administració/Seguretat | Lectura, edició i restauració es proven amb MFA i permisos reals; un usuari sense permís és rebutjat. |
| R09 | P2 | Plataforma d’apps | Un manifest invàlid i un mòdul que falla no impedixen obrir la resta d’aplicacions. |
| R10 | P3 | Plataforma/Producte | Existència o absència de la preferència documentada; si s’aprova, persisteix i no amaga controls essencials. |
| R11 | P2 | Rebost | Una cistella real produeix una recepta explicable; les limitacions de quantitat/caducitat són visibles. |
| R12 | P3 | Cures/Producte | Es delimita el registre de cures i quines fonts externes falten; cap atribució clínica sense font validada. |
| R13 | P2 | TPV/Gestoria | Un tiquet de prova travessa caixa, inventari i registre sense duplicació i amb font de dades identificada. |
| R14 | P3 | Reserves/Producte | Model mínim de disponibilitat, confirmació i cancel·lació aprovat abans d’integrar cap calendari extern. |
| R15 | P3 | Productors/Mercat | Un productor real té oferta, contacte/comanda i seguiment sense duplicar Gestoria. |
| R16 | P2 | Finestreta | Regressió DNI→nom coberta i formulari oficial concret contrastat; cap camp no confirmat s’ompli silenciosament. |
| R17 | P3 | Gestoria/Comptabilitat | Inventari del model i prova d’assentaments quadrats; separació de llars i activitats documentada. |
| R18 | P2 | Gestoria/Impostos | Les dades incompletes mostren absència o parcialitat; tota estimació conserva la marca de verificació i font. |
| R19 | P3 | Recerca/Skills | Una entrada RSS produeix proposta revisable amb font; l’aprovació precedix qualsevol instal·lació. |
| R20 | P2 | Manteniment/Portes | Cada lent té porta existent, buit concret o decisió de no aplicar; no apareixen dues portes equivalents. |
| R21 | P3 | Orquestració | Un flux recurrent té entrada, eixida, desencadenant i prova d’èxit, amb supervisió definida. |
| R22 | P2 | UI/Accessibilitat | Un component real respon immediatament, interromp l’animació i respecta moviment reduït. |
| R23 | P3 | Edició visual | Una mostra validada manté català llegible i supera la revisió ortogràfica i visual prevista. |
| R24 | P2 | UI/Accessibilitat | Es verifica navegació per fletxes, focus i clic complet en les instàncies triades, incloses excepcions. |
| R25 | P3 | Patrimoni/Mapa | Una fitxa amb font, fotografia i coordenada es mostra al mapa; EXIF absent no inventa ubicació. |
| R26 | P2 | Observabilitat | Cada mètrica té unitat, productor, instant de captura i cas absent; els llindars derogats no reapareixen. |
| R27 | P1 | Consola/Termometria | `recullConsola()` retorna la càrrega documental amb abast declarat i la targeta diferencia absència de zero. |
| R28 | P3 | Accessibilitat/Producte | Una publicació es pot escoltar i el mode de contrast es prova amb teclat sense perdre llegibilitat. |
| R29 | P3 | Lector/Coneixement | Una font de butlletí conserva procedència i data; ingestió, síntesi i revisió queden diferenciades. |
| R30 | P3 | Observabilitat | Una comprovació expirada deixa de ser verda i un canvi repetit no genera alertes duplicades. |
| R31 | P1 | Orquestració/MCR | Cada requisit té aplicabilitat, responsable, estat, evidència, data i deute pendent; les fonts de referència no es confonen amb comprovacions executades. |

### Deute que ha de quedar visible en el següent pla

- **D01 — Lectura pendent:** 1.164 textos, una auditoria parcial i l’HTML envoltant d’un article. Responsable proposat: arxivística assistida. Acceptació: cada fitxer passa a llegit/duplicat verificat/exclòs motivat amb registre; no es compten títols ni hashes com a lectura.
- **D02 — Binaris:** 271 fitxers/recursos no llegits. Responsable proposat: revisió documental i visual. Acceptació: cada família té extracció/renderització adequada, límits declarats i inventari de pàgines/imatges realment examinades.
- **D03 — Codi divergent:** 58 parelles de mateix nom i hash diferent. Responsable proposat: manteniment del mòdul viu. Acceptació: diff semàntic amb decisió adoptat parcialment/superat/útil pendent; mai executar ni aplicar el patch antic per defecte.
- **D04 — Memòria única:** roadmap canònic buit en quatre seccions i text públic amb estats històrics. Responsable proposat: Producte + Wiki. Acceptació: cada idea recuperada té origen, destí, estat acreditat i decisió, incloses les retirades.
- **D05 — Certificació:** esta aportació no executa tests, navegació ni desplegaments. Responsable proposat: front principal de verificació. Acceptació: cada afirmació de conducta remet a una prova actual executada, sense heretar el «Fet» d’una nota antiga.

L’objectiu original de rescat exhaustiu continua obert. Este lliurament tanca el cens i el lot semàntic declarat; preserva la resta com a treball real pendent.


<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. Igualtat exacta de conjunts: IDs de files MCR amb estat diferent de `[FET I SEGELLAT]` = IDs del pla/`trasllat.json` (93/93), sense duplicats. Les idees de rescat són un conjunt separat.
2. Cada correcció necessita el criteri d’acceptació de la fila i la comprovació de no regressió pertinent; conservar hash, entorn, mode de dades i resultat.
3. CI oficial amb el pressupost acordat; el diagnòstic amb timeout ampliat no substitueix la suite normal. Distingir proves omitides/TODO de fallades.
4. No segellar WebP universal, paritat remota, RSS real, RLS aplicat, CLS0, 40000 usuaris reals o rescat exhaustiu a partir d’una mostra local.
5. Llegir informes concurrents de Claude/Gemini i revisar deltes abans de canviar un estat. Validar document i Porta Olivera; comprovar tancament sense falsejar scope, hash o segells.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Els canvis concurrents poden fer caducar una evidència; conservar cada tall. El retrat JPEG canònic exigit entra en tensió amb la migració general d’avatars: resoldre equivalència i compatibilitat de rutes, no trencar el mandat específic.

Operar producció exigeix entorn i accés comprovats. L’auditoria no ha demostrat absència de credencials; no atribuir tots els pendents al Mestre. Les polítiques d’accés, permisos i les dades remotes es verifiquen amb casos positius i negatius abans d’afirmar resolt el403.

No publicar tot el cens d’imatges per arribar a una xifra: cal procedència, drets i privacitat. No executar patches/instal·ladors de l’arxiu ni aplicar-los sobre el codi viu sense diff. No moure ni esborrar originals protegits. Les dades del poble continuen al Supabase propi darrere del port neutral; Sollutia GET a través de Frontissa.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261016_1530_pla_implementacio_gauntlet_autonom]]
- [[261016_1632_auditoria_codex]]
- [[261016_1645_acta_marmota_codex_gauntlet_diurn]]
- [Trasllat amb evidència i IDs](261016_1632_auditoria_codex_evidencies/trasllat.json)
- [Cua exacta de rescat](261016_1632_auditoria_codex_evidencies/rescat/cua_lectura_pendent.csv)

