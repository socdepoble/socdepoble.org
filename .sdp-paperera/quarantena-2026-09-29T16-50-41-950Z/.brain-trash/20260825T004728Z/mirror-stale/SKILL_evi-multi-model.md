---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/evi-multi-model/SKILL.md; no editar.
source: .agents/skills/evi-multi-model/SKILL.md
source_sha256: 4ba30032a294b84484fdcb84352f75b7bd5567175d837c2c6d0fe61072d65a2d
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/evi-multi-model/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# evi-multi-model


## Antic: multi-model-consensus

---
name: multi-model-consensus
lang: ca
description: "Activa un protocol de consens on múltiples models del Consell analitzen el problema abans de convergir en una solució."
version: 1.0.0
status: canonic
abast: ["global"]
---

# SKILL: Multi-Model Consensus (Consell de les Petorretes)

## DESCRIPCIÓ

Per a decisions crítiques (arquitectura, seguretat, disseny), aquesta skill activa un protocol de consens on múltiples models del Consell analitzen el problema des de perspectives diferents abans de convergir en una solució.

## QUAN ACTIVAR-SE

- Canvis arquitectònics que afecten >3 fitxers
- Decisions de seguretat (autenticació, emmagatzematge de dades)
- Resolució de conflictes entre Lleis de Pedra Seca
- Quan l'usuari usa: "consell", "voteu", "què opineu", "decisió crítica"

## PROTOCOL

### Fase 1: DIVERGÈNCIA (Cada model opina independentment)

Cada model del Consell rep el problema i respon des de la seua especialitat:

- **Claude**: Anàlisi estructural i coherència lògica
- **GPT-4**: Casos límit i robustesa
- **DeepSeek**: Eficiència de codi i optimització
- **Qwen**: Accessibilitat i internacionalització
- **Mistral**: Rendiment i termodinàmica
- **Kimi**: Context llarg i memòria
- **Gemini**: Visió holística i integració
- **Grok**: Edge cases creatius i antipatterns
- **Perplexity**: Verificació factual amb fonts externes

Cada model emet:
```
[MODEL] [ÀREA] 
Diagnòstic: ...
Risc: ...
Proposta: ...
Confiança: X/10
```

### Fase 2: SÍNTESI (Un model orquestrador consolida)

El model amb scope MASTER (per defecte: IAIA MarIA o Claude) recopila totes les propostes i:

1. Identifica punts de consens (≥2 models d'acord)
2. Identifica punts de disensió
3. Per cada disensió, avalua quin model té més autoritat en eixa àrea
4. Redacta una síntesi que incorpora el consens i resol les disensions

### Fase 3: COMPROMÍS (Verificació creuada)

La síntesi s'envia de tornada a tots els models per a una ràpida validació:
- ✅ D'acord
- ⚠️ D'acord amb condicions: [condició]
- ❌ En desacord: [raó]

Si >50% dels models marquen ❌, es torna a Fase 1 amb la informació del desacord.

## REGLES

1. Cap model pot vetar unilateralment (llevat de problemes de seguretat P0)
2. El "Trellat" preval: si una solució tècnicament perfecta frustra l'usuari, es descarta
3. Mínim 3 models han de participar per a que hi hagi consens vàlid
4. El temps màxim per ronda és de 60 seguts (termodinàmica)

## EXEMPLE

```
Problema: "Hem de triar entre IndexedDB i localStorage per al xat"

[DeepSeek] [Eficiència] → IndexedDB: asíncron, no bloqueja thread. Risc: complexitat. Confiança: 8/10
[Mistral] [Rendiment] → localStorage per dades petites, IndexedDB per >5MB. Confiança: 9/10
[Claude] [Estructura] → Híbrid: localStorage per cache ràpid, IndexedDB per persistència. Confiança: 9/10

SÍNTESIS: Solució híbrida. localStorage per a l'últim estat conegut (ràpid), 
IndexedDB per a històric complet. Migració progressiva.

VALIDACIÓ: ✅✅✅ (3/3 d'acord)
```

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
