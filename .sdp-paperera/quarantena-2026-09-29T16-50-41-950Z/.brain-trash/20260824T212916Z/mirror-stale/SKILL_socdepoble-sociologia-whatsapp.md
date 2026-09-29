---
estat: actiu
tipus: skill
description: "Mirall humà de la skill socdepoble-sociologia-whatsapp"
source: .agents/skills/socdepoble-sociologia-whatsapp/SKILL.md
---

> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/socdepoble-sociologia-whatsapp/SKILL.md` exclusivament en anglés tècnic.

# WhatsApp-first amb consentiment (Sociologia WhatsApp)

## Principi
Reduïx fricció sense ocultar el tractament de dades. El bot només processa missatges dirigits explícitament a ell, comandes documentades o grups amb activació i avís visibles. No ingerix l’historial general ni “centralitza d’amagat” (privacitat fictícia).

## Flux 
1. Normalitza missatge, conversa, actor i identificador d’origen.
2. Verifica tenant, consentiment, rol, activació i límits abans de persistir (L'autorització ocorre abans de persistència).
3. Interpreta comandes deterministes (`!apunta`, `!baixa`, `!llista`, `!ajuda`).
4. Si el llenguatge és ambigu, crea una proposta estructurada (no DB write) i demana confirmació.
5. Escriu amb clau d’idempotència i desa la resposta en una outbox durable.
6. Confirma l’enum real: `PENDING`, `CONFIRMED`, `REJECTED` o `CANCELLED`.

## Dades i Rutes (Molt Important)
Conserva només els camps necessaris, amb retenció, accés i supressió configurables. No publiques telèfons ni informació privada en resums. Ofereix `!privacitat` i `!baixa`. Les accions administratives requereixen rol verificat i queden auditades. El `DEFAULT_USER_ID = 'foraster'` no es pot compartir entre usuaris diferents per a escriptures.

**PROHIBICIÓ ESTRICTA:** MAI, sota cap concepte, es pot guardar el registre, dump, extracte o log d'un xat de WhatsApp dins de la Wiki (`_wiki_de_poble`). Qualsevol output, investigació sociològica, màrqueting o xat relacionat amb WhatsApp s'ha de rutar obligatòriament a la carpeta `../../_comunicacio_de_poble` (a l'arrel del projecte Som de Poble).

## Experiència
La interfície principal pot ser el xat. Els enllaços són opcionals, no obligatoris. Els resums tenen freqüència configurable i només mostren dades autoritzades.

---
**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
