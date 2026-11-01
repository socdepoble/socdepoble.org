package org.socdepoble.app;

import android.graphics.Bitmap;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import com.getcapacitor.BridgeWebViewClient;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/* P0-24 (G2120-07, marató 261101_2143) · El botó Arrere d'Android (BOT-A9).
   Capacitor no el gestiona sense @capacitor/app, i amb targetSdk 36 Android 16
   ja no crida onBackPressed(): passa pel dispatcher d'AndroidX, que també servix
   el gest predictiu. Este connector n'és l'únic amo.
   · El callback només està encés quan hi ha alguna cosa a fer: una capa oberta
     a la pàgina (un Dialeg, un calaix: src/config/pilaEnrere.js) o historial al
     WebView. Apagat, el sistema fa l'Arrere (a l'activitat arrel, des d'Android
     12 envia l'app al fons; abans, minSdk 24, l'acaba) amb la vista prèvia del
     gest predictiu de «tornar a l'inici».
   · Amb capes, pregunta la pàgina (window.__sdpEnrere, src/natiu/enrereNatiu.js):
     "true" vol dir que ha tancat la de dalt pel camí del seu Escape. Si no (cap
     capa de veres, la pàgina encara no hi és), com sense capes.
   · Sense capes: si el WebView té historial, torna a la pantalla d'abans (el
     router escriu amb pushState i escolta popstate); si no, el sistema.
   Substituïx el WebViewClient del pont per un fill de BridgeWebViewClient: si
   un altre connector també el canvia, un dels dos es perd. Si un dia
   s'instal·la @capacitor/app, cal llevar este connector: tots dos voldrien ser
   l'amo del mateix botó. */
@CapacitorPlugin(name = "EnrereNatiu")
public class EnrereNatiuPlugin extends Plugin {

    static final String PREGUNTA =
        "(function(){try{var f=window.__sdpEnrere;return typeof f==='function'&&f()===true;}catch(e){return false;}})()";

    /* Només es llig i s'escriu al fil principal. */
    private int capesObertes = 0;
    private OnBackPressedCallback callback;

    @Override
    public void load() {
        callback = new OnBackPressedCallback(false) {
            @Override
            public void handleOnBackPressed() {
                enrere();
            }
        };
        getActivity().getOnBackPressedDispatcher().addCallback(getActivity(), callback);
        // canGoBack() canvia amb cada pushState, replaceState i popstate del
        // router, que no carreguen cap pàgina: doUpdateVisitedHistory els veu tots.
        bridge.setWebViewClient(
            new BridgeWebViewClient(bridge) {
                @Override
                public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
                    super.doUpdateVisitedHistory(view, url, isReload);
                    actualitza();
                }

                @Override
                public void onPageStarted(WebView view, String url, Bitmap favicon) {
                    super.onPageStarted(view, url, favicon);
                    // Una pàgina nova (recàrrega, procés recuperat) comença sense capes.
                    capesObertes = 0;
                    actualitza();
                }
            }
        );
        actualitza();
    }

    /** La pàgina diu quantes capes té obertes ({ capes }). */
    @PluginMethod
    public void estat(PluginCall call) {
        Integer capes = call.getInt("capes", 0);
        final int net = capes == null ? 0 : Math.max(0, capes);
        bridge.executeOnMainThread(() -> {
            capesObertes = net;
            actualitza();
        });
        call.resolve();
    }

    /* Fil principal. */
    private void actualitza() {
        if (callback == null) return;
        WebView webView = bridge != null ? bridge.getWebView() : null;
        callback.setEnabled(capesObertes > 0 || (webView != null && webView.canGoBack()));
    }

    /* Fil principal. */
    private void enrere() {
        if (capesObertes > 0 && bridge != null) {
            bridge.eval(PREGUNTA, (valor) -> {
                if (!"true".equals(valor)) perDefecte();
            });
            return;
        }
        perDefecte();
    }

    /* Fil principal. */
    private void perDefecte() {
        AppCompatActivity activitat = getActivity();
        // La resposta de la pàgina pot arribar amb l'activitat ja plegant (kit de Codex 261101).
        if (activitat == null || activitat.isFinishing() || activitat.isDestroyed()) return;
        WebView webView = bridge != null ? bridge.getWebView() : null;
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        callback.setEnabled(false);
        try {
            activitat.getOnBackPressedDispatcher().onBackPressed();
        } finally {
            // Encara que el sistema fallara, el callback torna a l'estat que toca.
            actualitza();
        }
    }
}
