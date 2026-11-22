/**
 * i18nAdminEntitats.js — Etiquetes accessibles (`aria-label`) i locale `BCP 47`
 * per als panells diferits d'administració d'entitats, usuaris i botigues · Onada R32.37.
 *
 * Viu dins de `src/sections/profile/admin/` (`React.lazy`, `+0 B` a `pesDelNucli`)
 * i manté 100 % idèntics byte a byte tots els literals valencians (`ca`).
 */

export const TEXTOS_ADMIN_ENTITATS = Object.freeze({
  ca: Object.freeze({
    locale: 'ca-ES',
    paginesTrilogiaRegio: 'Pàgines originals en revisió privada',
    directoriSessionsRegio: 'Directori d’usuaris i dispositius',
    usuarisBotiguesRegio: 'Usuaris, dispositius i botigues',
    descarreguesOficialsRegio: 'Descàrregues oficials'
  }),
  es: Object.freeze({
    locale: 'es-ES',
    paginesTrilogiaRegio: 'Páginas originales en revisión privada',
    directoriSessionsRegio: 'Directorio de usuarios y dispositivos',
    usuarisBotiguesRegio: 'Usuarios, dispositivos y tiendas',
    descarreguesOficialsRegio: 'Descargas oficiales'
  }),
  en: Object.freeze({
    locale: 'en-GB',
    paginesTrilogiaRegio: 'Original pages under private review',
    directoriSessionsRegio: 'Users and devices directory',
    usuarisBotiguesRegio: 'Users, devices and app stores',
    descarreguesOficialsRegio: 'Official downloads'
  }),
  eu: Object.freeze({
    locale: 'eu-ES',
    paginesTrilogiaRegio: 'Berrikuspen pribatuko jatorrizko orriak',
    directoriSessionsRegio: 'Erabiltzaileen eta gailuen direktorioa',
    usuarisBotiguesRegio: 'Erabiltzaileak, gailuak eta dendak',
    descarreguesOficialsRegio: 'Deskarga ofizialak'
  }),
  gl: Object.freeze({
    locale: 'gl-ES',
    paginesTrilogiaRegio: 'Páxinas orixinais en revisión privada',
    directoriSessionsRegio: 'Directorio de usuarios e dispositivos',
    usuarisBotiguesRegio: 'Usuarios, dispositivos e tendas',
    descarreguesOficialsRegio: 'Descargas oficiais'
  })
});

export function textosAdminEntitats(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(TEXTOS_ADMIN_ENTITATS, codi)
    ? TEXTOS_ADMIN_ENTITATS[codi]
    : TEXTOS_ADMIN_ENTITATS.ca;
}
