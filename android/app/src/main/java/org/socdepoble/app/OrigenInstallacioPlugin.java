package org.socdepoble.app;

import android.content.Context;
import android.content.pm.InstallSourceInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/* Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026: actualització
   automàtica real als mòbils de prova) · D'on ve l'App instal·lada: el paquet
   que la va instal·lar. Google Play és «com.android.vending»; un APK obert des
   del navegador o del gestor de fitxers porta l'instal·lador del sistema, i
   «adb install», cap. La classificació la fa la pàgina
   (src/natiu/origenInstallacio.js); ací només es llig.
   · { llegit: true, instalador } · el paquet instal·lador, si n'hi ha;
   · { llegit: true } sense instalador · cap (adb, o el sistema no el sap);
   · { llegit: false } · no s'ha pogut llegir: la pàgina ho tracta com a desconegut.
   Només lectura, cap permís nou: el paquet és el de la mateixa App. */
@CapacitorPlugin(name = "OrigenInstallacio")
public class OrigenInstallacioPlugin extends Plugin {

    @PluginMethod
    public void consulta(PluginCall call) {
        JSObject resposta = new JSObject();
        try {
            String instalador = instaladorDe(getContext());
            resposta.put("llegit", true);
            if (instalador != null && !instalador.isEmpty()) resposta.put("instalador", instalador);
        } catch (RuntimeException | PackageManager.NameNotFoundException e) {
            resposta.put("llegit", false);
        }
        call.resolve(resposta);
    }

    /* Des d'Android 11 (API 30), InstallSourceInfo; abans, el mètode antic
       (minSdk 24), que l'API 30 marca com a desaconsellat. */
    @SuppressWarnings("deprecation")
    static String instaladorDe(Context context) throws PackageManager.NameNotFoundException {
        PackageManager gestor = context.getPackageManager();
        String paquet = context.getPackageName();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            InstallSourceInfo font = gestor.getInstallSourceInfo(paquet);
            return font.getInstallingPackageName();
        }
        return gestor.getInstallerPackageName(paquet);
    }
}
