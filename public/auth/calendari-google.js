/*
 * calendari-google.js — la tornada de l'autorització de Google Calendar
 * (T1, prompt comú 261002_0125). La carrega calendari-google.html.
 *
 * Google torna a esta pàgina amb el resultat al fragment
 * (#access_token=…&state=… o #error=…&state=…). Ací no es llig ni es guarda
 * res: el fragment es lleva de la barra d'adreces i de l'historial i passa
 * tal qual a l'app, que en comprova el state (googleCalendar.js ·
 * llegixRespostaOAuth). Dos camins, mai els dos alhora:
 *   1. window.opener.postMessage, només cap al MATEIX origen;
 *   2. si Google ha tallat l'opener (COOP), el BroadcastChannel del mateix
 *      origen (CANAL_OAUTH a googleCalendar.js).
 * Cap emmagatzematge del navegador: si cap camí arriba, l'app esgota el temps.
 */
(function () {
  'use strict';
  var TIPUS = 'sdp:gcal-oauth';
  var CANAL = 'sdp-gcal-oauth';
  var hash = window.location.hash ? window.location.hash.slice(1) : '';

  // El token no es queda a la barra d'adreces ni a l'historial.
  try {
    window.history.replaceState(null, '', window.location.pathname);
  } catch {
    /* sense historial */
  }
  if (!hash) return;

  var carrega = { type: TIPUS, hash: hash };
  var lliurat = false;
  try {
    if (window.opener && window.opener !== window) {
      window.opener.postMessage(carrega, window.location.origin);
      lliurat = true;
    }
  } catch {
    lliurat = false;
  }
  if (!lliurat && typeof BroadcastChannel === 'function') {
    try {
      var canal = new BroadcastChannel(CANAL);
      canal.postMessage(carrega);
      canal.close();
    } catch {
      /* cap camí: la finestra de l'app esgotarà el temps */
    }
  }
  window.setTimeout(function () {
    try {
      window.close();
    } catch {
      /* el navegador no la deixa tancar: el text ho explica */
    }
  }, 150);
}());
