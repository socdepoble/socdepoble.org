import {CAPACITATS,CONTRACTE_NUCLI} from '../../data/contracte.js';
/** IDEA-149 · Responsibilities and migration contract from the July 2025
 * architecture, pp. 1, 4–5. These are roles, not provider appointments.
 * Runtime facts belong to deployment receipts, never to this static dossier. */
export const FEDIVERSITY_ARCHITECTURE_URL = 'https://fediversity.eu/wp-content/uploads/2025/07/architecture.pdf';
/* R11 loop 3 (R35-L2-02, R35-L2-07) · Cada rol té una clau i l'etiqueta de la font (p. 1: «Hosting provider»).
   Els textos de cada llengua són un objecte per clau, no un array posicional: si una llengua es reordena,
   cap etiqueta canvia de descripció. */
export const FEDIVERSITY_ACTORS = Object.freeze({maintainers: 'Maintainers', developers: 'Developers', hostingProvider: 'Hosting provider', operator: 'Operator', user: 'User'});
export const FEDIVERSITY_FLOW = 'application-options → config-mapping → resource-mapping → staged → deployed';
export const FEDIVERSITY_CONTRACT_COUNTS = Object.freeze({
  capacitats:Object.keys(CAPACITATS).length,
  metodes:new Set([...CONTRACTE_NUCLI,...Object.values(CAPACITATS).flat()]).size,
});
/* R11 loop 3 (R35-L2-04) · Enllaços fixos al mòdul NixOS propi i a la seua prova. Apunten al commit 64e242dac
   de la branca pública backup-notes-publish, perquè la branca per defecte (main) no té nix/. */
const COMMIT_DE_L_EVIDENCIA = '64e242dace633e8f80e0fa7522ebc0d2fc917494';
export const SDP_NIX_EVIDENCE = Object.freeze(['nix/module.nix', 'tests/fediversity-nixos-module.test.mjs']
  .map(path => Object.freeze({path, url: `https://github.com/socdepoble/socdepoble.org/blob/${COMMIT_DE_L_EVIDENCIA}/${path}`})));

/* R40 · Source UI terminology and the requested Nix-Panel API integration are distinguished explicitly in each language. */
export const FEDIVERSITY_ARCHITECTURE_TEXTS = Object.freeze({
  ca: {
    title: 'Responsabilitats i portabilitat de Fediversity', source: 'Arquitectura oficial · juliol de 2025',
    contract: 'Contracte del codi actual: {capacitats} capacitats opcionals i {metodes} mètodes.',
    sourceUi: "El PDF descriu un «demo front-end» per a configurar aplicacions. Nix-Panel API és la integració que volem verificar; la font no acredita eixa API.",
    actors: {maintainers: 'Manté els mòduls, les configuracions i el procés de desplegament.', developers: 'Desenvolupa i aporta mòduls d’aplicació.', hostingProvider: 'Aporta la infraestructura i administra els recursos disponibles.', operator: 'Tria i configura aplicacions i administra la comunitat.', user: 'Utilitza les aplicacions i hi publica contingut.'},
    flow: 'El mòdul declara les opcions i els recursos requerits per l’aplicació. El mapatge creua eixos requisits amb els recursos disponibles i la configuració del proveïdor. La configuració preparada i la desplegada són estats diferents.',
    portability: 'Portabilitat del servei en tres passos',
    steps: ['Actualitzar els registres DNS al registrador del domini.', 'Desplegar l’aplicació amb el seu mòdul de configuració reproduïble.', 'Restaurar les dades i executar les migracions específiques de connexions i URL.'],
    evidence: 'Estat verificable: el repositori conté un mòdul NixOS propi de Sóc de Poble (services.socdepoble) i les seues proves locals; encara no és un mòdul d’aplicació de Fediversity. La certificació Nix nativa, la connexió amb Nix-Panel API, Garage S3 i NixOps4/OpenTofu i la migració entre proveïdors necessiten els seus rebuts d’execució.',
  },
  es: {
    title: 'Responsabilidades y portabilidad de Fediversity', source: 'Arquitectura oficial · julio de 2025',
    contract: 'Contrato del código actual: {capacitats} capacidades opcionales y {metodes} métodos.',
    sourceUi: "El PDF describe un «demo front-end» para configurar aplicaciones. Nix-Panel API es la integración que queremos verificar; la fuente no acredita esa API.",
    actors: {maintainers: 'Mantiene los módulos, las configuraciones y el proceso de despliegue.', developers: 'Desarrolla y aporta módulos de aplicación.', hostingProvider: 'Aporta la infraestructura y administra los recursos disponibles.', operator: 'Elige y configura aplicaciones y administra la comunidad.', user: 'Utiliza las aplicaciones y publica contenido.'},
    flow: 'El módulo declara las opciones y los recursos requeridos por la aplicación. El mapeo cruza esos requisitos con los recursos disponibles y la configuración del proveedor. La configuración preparada y la desplegada son estados distintos.',
    portability: 'Portabilidad del servicio en tres pasos',
    steps: ['Actualizar los registros DNS en el registrador del dominio.', 'Desplegar la aplicación con su módulo de configuración reproducible.', 'Restaurar los datos y ejecutar las migraciones específicas de conexiones y URL.'],
    evidence: 'Estado verificable: el repositorio contiene un módulo NixOS propio de Sóc de Poble (services.socdepoble) y sus pruebas locales; todavía no es un módulo de aplicación de Fediversity. La certificación Nix nativa, la conexión con Nix-Panel API, Garage S3 y NixOps4/OpenTofu y la migración entre proveedores requieren sus recibos de ejecución.',
  },
  en: {
    title: 'Fediversity responsibilities and portability', source: 'Official architecture · July 2025',
    contract: 'Current code contract: {capacitats} optional capabilities and {metodes} methods.',
    sourceUi: "The PDF describes a “demo front-end” for configuring applications. Nix-Panel API is the integration we intend to verify; the source does not establish that API.",
    actors: {maintainers: 'Maintains modules, configurations and deployment workflows.', developers: 'Develops and contributes application modules.', hostingProvider: 'Provides infrastructure and administers available resources.', operator: 'Selects and configures applications and administers the community.', user: 'Uses applications and publishes content.'},
    flow: 'The module declares application options and required resources. Mapping combines those requirements with available resources and provider configuration. Staged and deployed configurations are distinct states.',
    portability: 'Service portability in three steps',
    steps: ['Update DNS records at the domain registrar.', 'Deploy the application using its reproducible configuration module.', 'Restore data and run application-specific connection and URL migrations.'],
    evidence: 'Verifiable status: the repository contains Sóc de Poble’s own NixOS module (services.socdepoble) and its local tests; it is not yet a Fediversity application module. Native Nix certification, integration with Nix-Panel API, Garage S3 and NixOps4/OpenTofu, and migration between providers require their execution receipts.',
  },
  eu: {
    title: 'Fediversityren ardurak eta eramangarritasuna', source: 'Arkitektura ofiziala · 2025eko uztaila',
    contract: 'Uneko kodearen kontratua: aukerako {capacitats} gaitasun eta {metodes} metodo.',
    sourceUi: "PDFak aplikazioak konfiguratzeko «demo front-end» bat deskribatzen du. Nix-Panel API egiaztatu nahi dugun integrazioa da; iturriak ez du API hori frogatzen.",
    actors: {maintainers: 'Moduluak, konfigurazioak eta hedapen prozesua mantentzen ditu.', developers: 'Aplikazio moduluak garatzen eta ekartzen ditu.', hostingProvider: 'Azpiegitura eskaintzen du eta baliabide erabilgarriak administratzen ditu.', operator: 'Aplikazioak aukeratu eta konfiguratzen ditu eta komunitatea administratzen du.', user: 'Aplikazioak erabiltzen ditu eta edukia argitaratzen du.'},
    flow: 'Moduluak aplikazioaren aukerak eta beharrezko baliabideak deklaratzen ditu. Mapatzeak eskakizun horiek baliabide erabilgarriekin eta hornitzailearen konfigurazioarekin lotzen ditu. Prestatutako eta hedatutako konfigurazioak egoera desberdinak dira.',
    portability: 'Zerbitzuaren eramangarritasuna hiru urratsetan',
    steps: ['DNS erregistroak eguneratu domeinuaren erregistratzailean.', 'Aplikazioa hedatu konfigurazio modulu erreproduzigarriarekin.', 'Datuak leheneratu eta konexioen eta URLen migrazio espezifikoak exekutatu.'],
    evidence: 'Egoera egiaztagarria: biltegiak Sóc de Pobleren NixOS modulu propioa (services.socdepoble) eta haren tokiko probak ditu; oraindik ez da Fediversityren aplikazio modulu bat. Nix ziurtapen natiboak, Nix-Panel API, Garage S3 eta NixOps4/OpenTofu integrazioak eta hornitzaileen arteko migrazioak exekuzio egiaztagiriak behar dituzte.',
  },
  gl: {
    title: 'Responsabilidades e portabilidade de Fediversity', source: 'Arquitectura oficial · xullo de 2025',
    contract: 'Contrato do código actual: {capacitats} capacidades opcionais e {metodes} métodos.',
    sourceUi: "O PDF describe un «demo front-end» para configurar aplicacións. Nix-Panel API é a integración que queremos verificar; a fonte non acredita esa API.",
    actors: {maintainers: 'Mantén os módulos, as configuracións e o proceso de despregamento.', developers: 'Desenvolve e achega módulos de aplicación.', hostingProvider: 'Achega a infraestrutura e administra os recursos dispoñibles.', operator: 'Escolle e configura aplicacións e administra a comunidade.', user: 'Utiliza as aplicacións e publica contido.'},
    flow: 'O módulo declara as opcións e os recursos requiridos pola aplicación. O mapeo cruza eses requisitos cos recursos dispoñibles e a configuración do provedor. A configuración preparada e a despregada son estados distintos.',
    portability: 'Portabilidade do servizo en tres pasos',
    steps: ['Actualizar os rexistros DNS no rexistrador do dominio.', 'Despregar a aplicación co seu módulo de configuración reproducible.', 'Restaurar os datos e executar as migracións específicas de conexións e URL.'],
    evidence: 'Estado verificable: o repositorio contén un módulo NixOS propio de Sóc de Poble (services.socdepoble) e as súas probas locais; aínda non é un módulo de aplicación de Fediversity. A certificación Nix nativa, a conexión con Nix-Panel API, Garage S3 e NixOps4/OpenTofu e a migración entre provedores requiren os seus recibos de execución.',
  },
});
