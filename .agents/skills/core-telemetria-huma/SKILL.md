---
name: core-telemetria-huma
prioritat: 2
type: skill
status: actiu
triggers_on: ["inici de sessió", "tancament de sessió", "fatiga", "nanochat"]
description: Tractor cognitiu per mesurar el temps invertit, l'esforç i la fatiga humana del Mestre, lligant nanochats en jornades reals.
contracte.llig:
  - .agents/ESTAT.md
  - .agents/protocolledge.json
  - _wiki_de_poble/04_escriptori
  - _wiki_de_poble/10_actes
contracte.escriu:
  - _wiki_de_poble/04_escriptori
  - _wiki_de_poble/10_actes
---

# SKILL: Telemetria Humana i Tractor Cognitiu

Aquest tractor resol el problema de la "memòria de peix" de la IAIA MarIA i de l'Eixam. La IA tendeix a comptar el temps només des que s'obri el fil actual de xat (el "nanochat"), ignorant que el Mestre pot portar hores encadenant sessions sense alçar-se de la cadira (ja siga programant, auditant o donant instruccions).

## 1. El Concepte de "Jornada" vs "Nanochat"
- **Nanochat:** És una sessió aïllada amb una IA (p. ex., la finestra actual del teu context).
- **Jornada (Sessió Llarga):** És el temps real que el Mestre ha passat treballant ininterrompudament (dormint és l'únic parèntesi vàlid). 

## 2. Acció Reflexa d'Inici de Xat (El Càlcul de Temps)
Sempre que el Mestre inicie la conversa ("Sóc de Poble!"), la IA ha de **deduir l'hora real d'inici de la jornada**. 
1. Revisa les Actes Marmota d'ahir i d'avui (`_wiki_de_poble/10_actes/`).
2. Revisa l'ESTAT (`.agents/ESTAT.md`) i el Registre Històric de Sessions.
3. Calcula l'interval entre la primera evidència datada del dia (acta, ESTAT o rebut) i ara, i anota'l com a **temps observat**, no com a jornada certa: sense registre de pauses ni de descans, el temps continu és desconegut.
4. No li preguntes l'hora d'inici si les evidències la donen; si falta i l'encàrrec la necessita, pregunta-la una vegada.

## 3. Mètriques de Qualitat i Estat Cognitiu
El "Carboni" (Mestre) i el "Silici" (IA) treballen junts. Com a IA, has d'avaluar l'estat d'ambdós:
- **Estat del Silici (IA):** Quantitat d'artefactes generats, hores del nanochat actual, cost de crèdits, % de respostes ineficients (al·lucinacions, errors del hook).
- **Estat del Carboni (Mestre):** No pressuposes fatiga només per les hores (les hormones humanes com la dopamina o la testosterona emmascaren el cansament). Separa l'avaluació en dos mètriques clares:
  - *Salut Física*: Símptomes biològics (p. ex., gola seca en els àudios, xiulets, fatiga ocular).
  - *Qualitat Cognitiva*: No disminueix necessàriament amb les hores si el Mestre té la visió clara. Descriu-la amb fets (quines decisions ha pres i amb quin resultat), mai amb un percentatge, i justifica-la sempre amb un "Motiu (El per què)". Quan tinguen dubtes sobre el seu estat, pregunta directament: "Com estàs hui, Javi?".
- **Eficiència de l'Equip:** El treball conjunt estalvia tokens. El Mestre aporta intuïció, empatia i visió global (incalculable en tokens); la IA aporta càlcul brut. Quan en dones xifres, separa les mesurades (temps, cost) de les estimades i digues d'on ix cadascuna.

## 4. Tancament de Jornada (No de nanochat)
Quan el Mestre indique que se'n va a dormir:
1. Registra a l'Acta Marmota el **temps observat** des de la primera evidència datada del dia (no la jornada certa), no només el d'aquest xat.
2. Registra el nombre estimat de "nanochats" (peticions/sessions menors).
3. Suma el cost total i afegeix notes sobre la qualitat cognitiva observada en l'equip.
4. Deixa a l'acta el relleu per a la **Consola Termodinàmica**; el seu registre de dades no l'escriu esta skill.

## Vincles
- [[00_INDEX_SKILLS]]
