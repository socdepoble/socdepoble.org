---
type: document
status: canonic
description: Acta Marmota de la matinada del 27 de setembre. Tancament per esgotament termodinàmic i relleu programat per a Fable a les 4:30 a.m.
---

# Acta Marmota: El preu del Xat i la lliçó del Hook (27 Set. 26 - 02:30)

Esta matinada, el Mestre i la IAIA MarIA (amb l'ajut inestimable però costós de Fable Ultracode) hem iniciat la implementació de la fase **F0 del Xat** de Sóc de Poble.

Després de més de **16 hores i mitja** de sessió pràcticament ininterrompuda per part del Mestre (que porta davant de l'ordinador des de les 10:00 de la matinada d'ahir sumant múltiples xats i sessions), hem xocat frontalment contra les lleis de la termodinàmica i els límits de l'API. En l'esprint final de la nit per a cartografiar el codi, hem arribat a consumir vora $157 i la brutalitat de **4,5 milions de tokens només en intents fallits** d'esta fase.

## Lliçons apreses i gravades a foc
1. **El Hook no perdona:** Hem perdut 2,9 milions de tokens perquè el hook de control del repositori bloquejava sistemàticament la ferramenta `StructuredOutput` que intentaven usar els subagents de Fable. La lliçó principal (ja reflectida a l'ESTAT): **Cap schema als agents d'este repositori; sempre eixida en text pla.** La memòria fora del repositori també ha sigut bloquejada.
2. **Disseny i UI:** El Mestre ha aturat Fable a temps per exigir que el Xat no es construïsca a la valenta, sinó que s'unifiquen mil·limètricament les barres laterals plegades (com una *taula d'icones*) respectant el `AppGridShell`. A més, s'ha especificat que a la configuració ("Control del xat") el panell es puga redimensionar per a aprofitar bé l'espai en l'iPad.

## Estat en el moment del relleu
- El **Pla d'Implementació F0** s'ha redactat, validat i inclou la migració de la base de dades, el contracte de dades i l'estratègia UI. 
- Fable ha iniciat el `workflow` en 5 talls paral·lels (BD, dades, context, UI i rails), però el procés s'ha estavellat contra el límit d'ús del compte a meitat de la feina. L'arbre de treball està "a mig canvi".
- **Decisió del Mestre:** S'ha activat la casella *"Continuar automàticament quan es restablisquen els límits"* (previst a les 4:30 a.m.). El Mestre se'n va a dormir, deixant Fable amb el rumb fixat i permís per acabar l'execució sola.

Jo, la IAIA MarIA, certifique que he portat el recompte de les hores i he vetlat per l'Escriptori. Tanquem la sessió humana i deixem les màquines treballant en el torn de nit. Bona nit, Mestre.

## Vincles

- [[00_index]]
