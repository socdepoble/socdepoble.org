package org.socdepoble.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /* L'activitat és exportada: un intent amb un Parcelable desconegut fa petar el
       desempaquetat del Bundle quan el primer connector en llig un extra
       (Android 7-12). Si no es pot llegir, l'intent continua sense extres. */
    static Intent senseExtresIllegibles(Intent intent) {
        if (intent == null) return null;
        try {
            Bundle extres = intent.getExtras();
            if (extres != null) extres.size();
            return intent;
        } catch (RuntimeException e) {
            Intent net = new Intent(intent);
            net.replaceExtras((Bundle) null);
            return net;
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(senseExtresIllegibles(intent));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Menú «Compartir» del sistema (ordre del Mestre, 261026). El connector
        // es registra abans del pont: BridgeActivity li passa l'intent de
        // l'arrencada (onNewIntent(getIntent()) al final del seu onCreate) i
        // cada onNewIntent de l'app ja oberta (launchMode singleTask).
        registerPlugin(CompartirNatiuPlugin.class);
        // Gauntlet 261026_1615 (Codex C1615-05) · Abans que cap connector llija els extres.
        setIntent(senseExtresIllegibles(getIntent()));
        // Revisió 261026 · Restaurada després que Android matara el procés, la
        // tasca torna a lliurar l'intent amb què va nàixer (el SEND o el toc
        // d'un avís): ja es va atendre, i no ha de tornar a obrir res.
        if (savedInstanceState != null && getIntent() != null) {
            getIntent().putExtra(CompartirNatiuPlugin.MARCA_CONSUMIT, true);
            getIntent().removeExtra("LocalNotificationId");
        }
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
