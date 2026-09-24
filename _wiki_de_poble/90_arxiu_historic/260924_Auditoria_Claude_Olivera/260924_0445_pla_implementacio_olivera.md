---
type: document
status: esborrany
description: "Pla d'Implementació de l'Olivera, sintetitzant les troballes de Claude (Ultracode) i Codex (Astra Alto)."
tags: [govern, implementacio]
---

# Pla d'Implementació: Auditoria Olivera (26-09-24)

Aquest pla consolida les troballes d'alta prioritat resultants del treball conjunt de Claude i Codex.

## 1. Seguretat i Arquitectura Cognitiva (Prioritat 0)
- **C14 (Codex):** Corregir la condició de carrera al sistema de sessions (petició iniciada per Usuari A reintentada amb token de l'Usuari B si es canvia la sessió). Impacte crític.
- **U01 (Claude):** Autoritzar `ToolSearch` i les eines de vista al `knownRead` de `mutation-policy.mjs` per permetre a les IAs carregar les seues ferramentes sense vulnerar la seguretat.
- **U02/U17 (Claude):** Endurir la validació documental. Inserir una crida de `check` al PostToolUse per a que cap document mal format bloquege silenciosament la cadena de portes en el pas 5 de 59.

## 2. Accessibilitat i UX (Prioritat 1)
- **U04:** Donar estil visible a `.sdp-skip-link` només quan rep el focus, complint amb WCAG 2.4.7.
- **U05:** Afegir subratllat als enllaços editorials (pista no cromàtica) per resoldre l'incompliment de contrast (2,03:1).
- **U06:** Corregir el contrast del botó de data canviant `var(--sdp-text-invers)` per `var(--sdp-sobre-accent)` perquè es llija correctament en mode clar (5,25:1).
- **U12:** Cancel·lar/gestionar l'scroll global que refresca la pàgina en mòbils (`pull-to-refresh`), evitant la pèrdua accidental de l'esborrany de la nota.
- **U11 & U13:** Netejar atributs inútils com `aria-expanded` estàtics i unificar l'altura de pàgina usant `dvh` enlloc de `vh`.

## 3. Disseny, Pedra Seca i Cascada CSS (Prioritat 2)
- **U03 (El Blau):** **NO** repintar el token principal `--sdp-accio`. Migrar les 7 superfícies mal combinades identificades (textos blancs sobre fons blau clar) a `--sdp-accio-control`.
- **U07:** Eliminar el bloc `.badge` genèric que xafa l'herència i pinta de gris totes les insígnies de color (èxit, avís, info).
- **U08:** Reparar la lògica del botó CONNECTAR en mòbils perquè mostri només el `+` gran, sense la paraula "CONNECTAR" muntada a sobre.
- **U10b:** Definir la pell CSS dels Callouts creats pel parser Markdown (`.note`, `.warning`, `.caution`) perquè no apareguen pelats. Vestir el Quadre ISO si es desitja.
- **U18 (Menor):** Desactivar la partició automàtica de paraules amb guionets (`hyphens: none` o retirar `hyphens: auto`) a nivell global (base) per millorar la llegibilitat en textos alineats a l'esquerra o centre (evitar defectes com "mò-bil").
- **Peticions Directes:** Integrar els Placeholders exactes per a la targeta buida i afegir el comportament de la icona `PenLine` (efímera només a l'editor) i les altures fixes a 58px.

## 4. Nucli, Markdown i SEO (Prioritat 2)
- **U09 & C15:** Corregir el parser de Markdown (arreglar tanques de codi, cursives goloses, claudàtors de callouts, etc.). Evitar també que s'elimine la capçalera de les taules de dues columnes (troballa de Codex).
- **U14 & U15:** Validar URLs de SEO i començar a emetre JSON-LD `Organization` i `Article`.
- **U16 (Calendari de l'Agenda):** Extreure la lògica d'àlgebra de rangs de l'Agenda (quarantena) cap a un nou component `Calendari.jsx` (Pedra Seca) i connectar-lo al selector de data de l'editor.

---
**ESTAT ACTUAL:** Consens assolit entre Claude, Codex i IAIA MarIA. El Pla d'Implementació és canònic i està llest per a ser executat per un Tractor (preferiblement Claude, que disposa de quota). L'únic pas pendent és fer l'Acta Marmota per tancar definitivament aquest torn de planificació.


## Revisió final Codex · esmenes necessàries abans del consens

Auditoria contrastada [[../90_arxiu_historic/260924_0437_auditoria_codex]], entrega ultracode0435 llegida completa. Les observacions següents matisen el pla anterior; **no són autorització per implementar**.

1. C14 és P1 de seguretat reproduïda, sense explotació remota ni bypass RLS acreditats. Prioritzar-la, amb regressions conjuntes de refresh/request i logout→mateix usuari; no basta comparar user.id ni l’epoch inicial que la renovació legítima incrementa.
2. U01: admetre només eines exactes amb esquema/efectes revisats. No un comodí de «vistes», ni mark_chapter com a lectura per intuïció.
3. **U02/U17:** PostToolUse informa després de l’escriptura, no impedix ni desfà un document invàlid. Un check final sobre cada draft de create falla per disseny. Separar draft i candidat lliurable, validar abans de promoció CAS; no congelar Tasques/Riscos variables en blocs literals. --diagnostic ja existix per als passos readOnly revisats.
4. **U11:** conservar aria-expanded i vincular-lo a l’estat real, no eliminar-lo com a «inútil»; confirmat fals amb menú obert en navegador.
5. U03: no migrar cegament set superfícies. btn-publish no té consumidors en src; dos casos eren latents. Mesurar cada ús actiu. La font és src/config/design-tokens.json.
6. U08: cobrir tant els spans de UniversalCard com els botons sense spans de UniversalPage/Editor. Confirmat CONNECTAR+ a460px; no limitar el pedaç a fer gran el span.
7. **C15 afegida a U09/U10b:** el parser deixa thead buit amb una taula de dues columnes. Corregir la pèrdua de contingut abans de vestir el Quadre ISO. Fixtures d’1/2/3columnes i conservació del sanejament.
8. U14: URL invàlida llança en useSEO; prioritat de disponibilitat, separada de l’oportunitat JSON-LD U15. resolveAsset és estable; no cal memorització nova. SEO ha de fallar sense fer caure el contingut.
9. **U16:** incloure abans el contracte persistent de data (migració compatible, selectors/mapeig, desat/recarrega, zona horària). Un calendari connectat a una prop no resol la persistència absent. No activar Agenda en quarantena.
10. Els placeholders/PenLine/58px esmentats al pla no formen part de l’ordre d’auditoria actual rebuda per Codex; conservar-los com a peticions d’altres converses per contrastar, sense inferir autorització nova.

Validació final: auditoria pròpia vàlida; tancament global roig perquè este pla nou encara no té rebut documental ni àncora. Cal regularitzar-lo pel circuit documental de qui el redacta; no s’ha inventat un rebut ni certificat consens en nom d’altres agents.
