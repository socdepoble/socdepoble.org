---
type: document
status: esborrany
description: Resposta i anàlisi recent de Claude on refuta els arranjaments del Bloc A i diagnostica els hooks.
tags:
  - seguretat
  - arquitectura
---

# Refutació de Claude al Bloc A i l'Acte Reflex (19 de Setembre, 14:00)

*Aquesta és la resposta transcrita de Claude després d'analitzar l'estat del Bloc A:*

Mestre, abans de res: el Pla d'Execució de Codex encara no existix al repositori. No puc refutar un document que no s'ha lliurat. El que sí he pogut fer —i el que calia fer primer— és verificar el terreny sobre el qual es construirà eixe pla. I ací hi ha un problema seriós.

## 1. El Bloc A no està on penses que està
Cap dels quatre arranjaments està consolidat: ff312dc9 ("resolts defectes seguretat P1") no toca identitat.js, host.js ni PedraSecaEmbed.jsx. Els canvis viuen només a l'arbre de treball, sense commit. I dos dels quatre no funcionen.

- **El fil trencat (1).** `estat()` a host.js:273 retorna `{fase, configurable, contracte, implementat}`. No té cap propietat config. Per tant `estat().config?.sollutiaIssuer` val sempre undefined i cau al `VITE_SOLLUTIA_ISSUER` de sempre. El grep ho tanca: els únics llocs del projecte que mencionen sollutiaIssuer són les tres declaracions de PedraSecaEmbed que l'admeten. Ningú el llig. Sollutia pot posar l'atribut i no passarà res. I ací s'enganxa amb el que ja sabem del bundle: si el standalone es compila sense VITE_*, import.meta.env queda buit i el fallback tampoc existix. Resultat: en l'artefacte que s'entrega dilluns, la injecció de sessió no té cap camí viable.
- **El camí JS documentat continua mort (2).** `adoptaSessioExterna` comença amb `if (!emissorEsperat) return false;`. `injectaSessio(sessio)` amb un sol argument → opcions = {} → emissorEsperat = null → fals, sense arribar mai a la línia de l'aud. El pegat del host.js només cobrix el pont postMessage. `window.SocDePoble.injectaSessio(session)` —l'API pública— continua rebutjant-ho tot. F01 estava ben diagnosticada i s'ha arreglat la meitat que no era.
- **La regressió P0-7 reintroduïda (3).** `setToastTarget` escriu en una variable de mòdul global i mai es neteja al desmuntatge. Amb dues instàncies, la segona sobreescriu la primera; quan la segona se'n va, userProvidedTarget apunta a un node desconnectat i showToast hi penja els avisos: invisibles per a la instància que encara viu. És exactament el bug que documenta el comentari de PedraSecaEmbed.jsx:594 ("P0-7 AVISOS APAGATS ALS GERMANS"), entrant per una altra porta. El singleton no s'ha eliminat: s'ha invertit de "sempre el primer" a "sempre l'últim".
- **L'heurística del #root (4).** `manageDocumentHead = (this.parentNode.id === 'root')`. Però main.jsx:44 ja passa `manageDocumentHead: true` explícitament, així que la branca mai s'executa per a la nostra pròpia web. Només s'executa per a embeds — i li regala el control del `<head>` a qualsevol amfitrió que munte el component dins d'un `<div id="root">`, que és el mount-point més comú del món React. La protecció fa el contrari del que promet precisament en el cas per al qual es va escriure. A més, el routerType continua forçant-se a 'browser': la meitat de F06 que parla de segrestar la navegació de Sollutia no s'ha tocat.
- **Avís de disseny.** `sollutiaIssuer` s'ha afegit a CAMPOS_URL però no a la branca d'allowlist estricta de PedraSecaEmbed.jsx:196, que només cobrix supabaseUrl, botApiUrl i oauthRelayUrl. Ara és inofensiu perquè ningú el llig. El dia que es connecte el fil sense tancar això alhora, qualsevol editor del CMS podrà fixar l'àncora de confiança de la sessió a un domini seu — el risc pendent núm. 2 de Codex, convertit en forat real. Els dos canvis han d'anar al mateix commit.

## 2. L'Acte Reflex: no tens un problema de disseny, tens un problema de senyal de vida
Açò és el que m'has demanat i és el que menys esperava trobar. La solució que demanes ja està construïda. El que passa és que no s'executa.

- `tooling/brain/matrix.mjs` fa exactament el que descrius: encamina l'acció → resol el protocol → llig les fonts obligatòries senceres → n'emet rebut sha256 → només llavors diu ready.
- `.agents/hooks/verify.mjs` ja implementa la LLEI 6 · Cap document sense rebut Matrix, amb una finestra de 30 minuts, i el seu propi comentari diu que l'Efecte Matrix "passa a ser precondició".
- `.agents/hooks.json` connecta els dos: PreInvocation i PreToolUse.

I ara la prova: l'última entrada de `.agents/.diari_sessio.jsonl` és del 15 de setembre a les 03:30. S'han creat documents a l'Escriptori els dies 17, 18 i 19 — inclosa esta mateixa petorreta. Si la LLEI 6 haguera corregut, cap d'eixos fitxers hauria pogut existir. El directori `.sdp-reflex/receipts/` està buit des del 25 d'agost.

L'auditoria de Claude del 17 de setembre ja demanava com a "Pas 0: comprovar si els hooks s'executen". Mai s'ha fet. Portem dos mesos escrivint lleis per a una porta que no està endollada.

Hi ha una causa estructural per damunt d'això: `.agents/hooks.json` és el format d'Antigravity. Esta sessió de Claude Code llig `.claude/settings.json`, que només conté permissions. Ara mateix, escrivint des d'ací, jo no tinc cap porta. Cada canvi d'arnés perd totes les garanties en silenci. Per això cap solució que viva només als hooks de l'arnés serà mai "absolutament automàtica".

**L'arquitectura que propose té tres capes, i la clau és la tercera:**
1. **Senyal de vida primer.** Que cada hook escriga una marca de temps incondicional. Un `porta:reflex` que falle si l'últim batec és més vell que el commit més recent. Fins que això estiga verd, tota la resta és teoria.
2. **Rebut lligat al document, no al torn.** Avui el rebut certifica que l'script va llegir la plantilla i val 30 minuts per a qualsevol cosa. Ha de portar un nonce derivat de sha256(plantilla) + sha256(petició) que la plantilla injecte, que el document copie al seu frontmatter, i que la porta recalcule contra el contingut escrit. Així el rebut no s'obté executant un script: només s'obté havent rebut el text de la plantilla.
3. **La xarxa de seguretat independent de l'arnés: git.** Un `porta:iso` a la cadena de pre-commit que rebutge qualsevol `.md` nou a `_wiki_de_poble/` sense nonce vàlid. Els hooks d'Antigravity i de Cursor són l'ergonomia —t'avisen abans d'escriure— però el commit és l'única frontera per la qual passen totes les IA, tots els arnesos i tu mateix. Si la llei no viu allà, no viu.

I l'esquelet determinista que tanca el cercle: prohibir crear `.md` nous amb eines d'escriptura i permetre només omplir fitxers instanciats per un generador. Quan l'estat invàlid no es pot representar, la disciplina deixa de ser una virtut de la IA i passa a ser una propietat del sistema. Això és Pedra Seca de veritat: no una norma que recorde complir, sinó una paret que no es pot saltar.
