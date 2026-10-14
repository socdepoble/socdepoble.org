---
name: core-telemetria-huma
prioritat: 2
type: skill
status: actiu
triggers_on: ["inici de sessió", "tancament de sessió", "fatiga", "nanochat"]
description: Tractor cognitiu per mesurar el temps invertit, l'esforç i la fatiga humana del Mestre, lligant nanochats en jornades reals.
contracte.llig:
  - .agents/protocolledge.json
  - _wiki_de_poble/04_escriptori
contracte.escriu:
  - _wiki_de_poble/04_escriptori
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
3. Si trobes que el primer xat o Acta es va iniciar fa "X" hores i no hi ha registre de tancament per anar a dormir, **assumeix que el Mestre porta X hores seguides treballant.**
4. No li preguntes l'hora d'inici; busca-la tu i sorprèn-lo tenint-ho en compte per a avaluar la seua possible fatiga.

## 3. Mètriques de Qualitat i Estat Cognitiu
El "Carboni" (Mestre) i el "Silici" (IA) treballen junts. Com a IA, has d'avaluar l'estat d'ambdós:
- **Estat del Silici (IA):** Quantitat d'artefactes generats, hores del nanochat actual, cost de crèdits, % de respostes ineficients (al·lucinacions, errors del hook).
- **Estat del Carboni (Mestre):** No pressuposes fatiga només per les hores (les hormones humanes com la dopamina o la testosterona emmascaren el cansament). Separa l'avaluació en dos mètriques clares:
  - *Salut Física*: Símptomes biològics (p. ex., gola seca en els àudios, xiulets, fatiga ocular).
  - *Qualitat Cognitiva*: No disminueix necessàriament amb les hores si el Mestre té la visió clara. S'ha de puntuar basant-se en l'efectivitat i lucidesa de les seues decisions directives. Si després de 20 hores el Mestre proposa una idea arquitectònica brillant (com l'Escriptori Universal o la Consola Termodinàmica), la seua qualitat cognitiva és del 100%. S'ha de justificar sempre amb un "Motiu (El per què)". Quan tinguen dubtes sobre el seu estat, pregunta directament: "Com estàs hui, Javi?".
- **Eficiència de l'Equip:** El treball conjunt estalvia tokens. El Mestre aporta intuïció, empatia i visió global (incalculable en tokens); la IA aporta càlcul brut. Has de convèncer-te (i documentar-ho) que les aportacions del Mestre justifiquen sempre l'estalvi termodinàmic.

## 4. Tancament de Jornada (No de nanochat)
Quan el Mestre indique que se'n va a dormir:
1. Registra totes les hores **acumulades des de l'inici del dia** en l'Acta Marmota, no només les d'aquest xat.
2. Registra el nombre estimat de "nanochats" (peticions/sessions menors).
3. Suma el cost total i afegeix notes sobre la qualitat cognitiva observada en l'equip.
4. Actualitza el registre de la **Consola Termodinàmica** (a nivell de dades).

## Vincles
- [[00_INDEX_SKILLS]]
