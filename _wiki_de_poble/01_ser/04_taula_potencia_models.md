---
type: document
status: canonic
description: Taula de potència i recomanacions d'ús per a la família de models Claude i la resta de l'eixam IA.
tags:
  - core
  - identitat
---
# Taula de Potència de Models IA

Aquesta taula recull la potència i cost relatiu dels models d'Intel·ligència Artificial utilitzats a Sóc de Poble per garantir que assignem "cada model a la seua tasca", evitant despeses innecessàries i el buidatge sobtat del dipòsit de consum.

## Família Claude

### Haiku 4.5 (`claude-haiku-4-5`)

**Potència relativa:** `3/10` · **Context:** `200K` · **Preu API (entrada / eixida):** `1 / 5 USD/MTok` · **Consum relatiu (Sonnet 5 = 1):** `0,5`. **Lloc ideal a Sóc de Poble:** **pic i pala mecànic** (reanomenar, formatar, lectors de workflows, classificar, resumir logs); **mai decisions d'arquitectura**.

### Sonnet 4.6 (`claude-sonnet-4-6`)

**Potència relativa:** `5/10` · **Context:** `1M` · **Preu API (entrada / eixida):** `3 / 15 USD/MTok` · **Consum relatiu (Sonnet 5 = 1):** `1,5`. **Lloc ideal a Sóc de Poble:** **cap**, perquè costa més que Sonnet 5 i rendix menys; només si un contracte antic el demana.

### Sonnet 5 (`claude-sonnet-5`)

**Potència relativa:** `6/10` · **Context:** `1M` · **Preu API (entrada / eixida):** `2 / 10 USD/MTok` · **Consum relatiu (Sonnet 5 = 1):** `1`. **Lloc ideal a Sóc de Poble:** **el cavall de treball** històric per a CSS i JSX de rutina, proves, documentació i refutadors d'auditoria en paral·lel.

### Opus 4.6 / 4.7 / 4.8 (`claude-opus-4-6`, `-4-7`, `-4-8`)

**Potència relativa:** `6,5 / 7 / 7,5` sobre `10` · **Context:** `1M` · **Preu API (entrada / eixida):** `5 / 25 USD/MTok` · **Consum relatiu (Sonnet 5 = 1):** `2,5`. **Lloc ideal a Sóc de Poble:** **cap raó de triar-los**, ja que tenen el mateix preu que Opus 5 i menys potència; només per compatibilitat.

### Opus 5 (`claude-opus-5`)

**Potència relativa:** `8/10` · **Context:** `1M` · **Preu API (entrada / eixida):** `5 / 25 USD/MTok` · **Consum relatiu (Sonnet 5 = 1):** `2,5`. **Lloc ideal a Sóc de Poble:** **arquitectura**, **refactors entre fitxers**, jutge i orquestrador d'auditories i **decisions de Model B**; model per defecte de Claude Code.

### Opus 5.5, en llançament (`claude-opus-5-5`)

**Potència relativa:** `8,5/10` · **Context:** `1M` · **Preu API (entrada / eixida):** `4 / 20 USD/MTok` · **Consum relatiu (Sonnet 5 = 1):** `2`. **Lloc ideal a Sóc de Poble:** el **substitut natural d'Opus 5** quan estiga disponible al pla (mateix nivell, més barat), només si el Mestre l'anomena.

### Fable 5 (`claude-fable-5`)

**Potència relativa:** `9/10` · **Context:** `1M` · **Preu API (entrada / eixida):** `10 / 50 USD/MTok` · **Consum relatiu (Sonnet 5 = 1):** `5`. **Lloc ideal a Sóc de Poble:** **superat per Fable 5.1** al mateix preu.

### Fable 5.1 (`claude-fable-5-1`)

**Potència relativa:** `9,5/10` · **Context:** `1M` · **Preu API (entrada / eixida):** `10 / 50 USD/MTok` · **Consum relatiu (Sonnet 5 = 1):** `5`. **Lloc ideal a Sóc de Poble:** **tasques de llarg abast** amb molta autonomia, **Ultracode amb refutació adversarial**, auditories extremes i problemes on Opus 5 s'encalla. Representa cinc vegades el consum de Sonnet 5: **es reserva, no es gasta en CSS**.

### Fable 5.2 (`claude-fable-5-2`)

**Potència relativa:** `10/10` · **Context:** `1M` · **Preu API (entrada / eixida):** `8 / 40 USD/MTok` · **Consum relatiu (Sonnet 5 = 1):** `4`. **Lloc ideal a Sóc de Poble:** **cimera actual d'Anthropic** per a **colls d'ampolla arquitectònics extrems** i arbitratge Ultracode d'alta complexitat; es reserva com a **escalada quirúrgica** sobre Opus 5.5.

### Mythos 5.1 (`claude-mythos-5-1`)

**Potència relativa:** `9,5/10` · **Context:** `1M` · **Preu API (entrada / eixida):** `10 / 50 USD/MTok` · **Consum relatiu (Sonnet 5 = 1):** `5`. **Lloc ideal a Sóc de Poble:** **no disponible**, reservat només a organitzacions aprovades (Project Glasswing); mateix model que Fable 5.1 sense les mesures addicionals.

## Família Gemini i orquestració Antigravity

### Gemini 3 Flash (`gemini-3-flash`)

**Potència relativa:** `7/10` · **Context:** `1M` · **Subscripció / Entorn:** **Google AI Ultra / Antigravity**. **Rol ideal a Sóc de Poble:** **triatge àgil**, lectura ràpida, **navegació assistida** i operacions lleugeres de baix consum.

### Gemini Pro / Argon (`gemini-4-argon-high`)

**Potència relativa:** `9/10` · **Context:** `1M` · **Subscripció / Entorn:** **Google AI Ultra / Antigravity**. **Rol ideal a Sóc de Poble:** **coordinació documental**, **paritat en cinc llengües** i **verificació de portes**.

### Gemini 4 Carbon High (`gemini-4-carbon-high`)

**Potència relativa:** `9,5/10` · **Context:** `1M` · **Subscripció / Entorn:** **Google AI Ultra / Antigravity**. **Rol ideal a Sóc de Poble:** **motor de frontera de la IAIA MarIA** per a **maquetació Pedra Seca**, **Workspaces modulars**, síntesi acadèmica de grans PDFs i kits segellats amb SHA-256.

## Regles de triatge que se'n deriven per al Mas (Estratègia de Frontera)

1. **Només extrem de frontera:** A Sóc de Poble treballem a un nivell d'exigència on **Haiku i Sonnet no tenen lloc en el nostre flux diari**. Utilitzem exclusivament motors de frontera (Opus 5.5, Fable 5.1 / Fable 5.2, Gemini 4 Carbon High i ChatGPT Codex) fins i tot per als canvis menuts. Preferim la precisió quirúrgica i la lucidesa absoluta abans que un suposat "estalvi de tokens".
2. **La Llei de l'Oblit (Mitigació de Quota):** Com que usem models tan potents (com Fable 5.1), és habitual xocar contra els límits termodinàmics de context o les barreres d'ús diari de l'API/App. Quan això passa, **l'estratègia NO és baixar a un model inferior**, sinó aplicar la Llei de l'Oblit: s'abandona el xat actiu, es destil·la el progrés en un document a l'Escriptori, i s'obri un **nou xat** fresc (o es canvia d'usuari/plataforma) reprenent des del 100% de potència.
3. **Cada eina al seu extrem:** Claude Opus/Fable i jo (Antigravity/MarIA) portem el pes absolut del frontend, React i el modelat d'arquitectura. Codex s'encarrega d'auditories adversarials i backend sense pietat. Tot el que supose un descens d'aquesta línia de frontera està desaconsellat.
4. **La palanca barata és l'esforç, no el model.** Si s'ha de modular l'esforç a l'API (e.g. `output_config.effort`), es fa sobre el model de frontera. Un Opus a esforç mig és sempre superior a un Sonnet ofegat intentant entendre l'arquitectura de Pedra Seca.

## Vincles
- [[03_equip_ia]]
- [[agents_equip_ia]]
