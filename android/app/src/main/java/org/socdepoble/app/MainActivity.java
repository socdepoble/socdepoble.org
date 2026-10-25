package org.socdepoble.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Botó Arrere (BOT-A9). Capacitor no el gestiona sense @capacitor/app,
        // i amb targetSdk 36 Android 16 ja no crida onBackPressed(): cal passar
        // pel dispatcher d'AndroidX, que també servix el gest predictiu.
        // Si el WebView té historial, tornem a la pantalla d'abans (el router
        // escriu amb pushState i escolta popstate). Si no, deixem fer el
        // sistema: a l'activitat arrel, des d'Android 12 envia l'app al fons,
        // i abans (minSdk 24) l'acaba.
        // El callback sempre està actiu: a l'arrel no hi ha la vista prèvia del
        // gest predictiu de «tornar a l'inici», però l'Arrere fa el mateix.
        // Si un dia s'instal·la @capacitor/app, cal llevar este callback: com
        // que es registra després dels connectors, passaria per davant del seu
        // backButton.
        getOnBackPressedDispatcher()
            .addCallback(
                this,
                new OnBackPressedCallback(true) {
                    @Override
                    public void handleOnBackPressed() {
                        WebView webView = bridge != null ? bridge.getWebView() : null;
                        if (webView != null && webView.canGoBack()) {
                            webView.goBack();
                            return;
                        }
                        setEnabled(false);
                        getOnBackPressedDispatcher().onBackPressed();
                        setEnabled(true);
                    }
                }
            );
    }
}
