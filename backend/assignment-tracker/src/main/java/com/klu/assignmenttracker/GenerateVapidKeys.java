package com.klu.assignmenttracker;

import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.spec.ECNamedCurveParameterSpec;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.util.Base64;

/**
 * One-time VAPID key generation utility.
 *
 * Run once to generate your VAPID key pair:
 *   $env:JAVA_HOME = "C:\Program Files\Java\jdk-25.0.4"
 *   $env:Path = "$env:JAVA_HOME\bin;$env:Path"
 *   ./mvnw compile exec:java -Dexec.mainClass=com.klu.assignmenttracker.GenerateVapidKeys
 *
 * Then set the output as environment variables before starting the server:
 *   $env:VAPID_PUBLIC_KEY  = "<publicKey>"
 *   $env:VAPID_PRIVATE_KEY = "<privateKey>"
 *
 * Or add them to a .env file that is loaded by your deployment environment.
 *
 * SECURITY:
 *   - NEVER commit the private key to Git.
 *   - Store the private key as an environment variable or in a secrets manager.
 *   - The public key is safe to expose to the frontend.
 */
public class GenerateVapidKeys {

    public static void main(String[] args) throws Exception {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        // Generate an EC key pair on the P-256 curve (required by the Web Push specification)
        ECNamedCurveParameterSpec paramSpec = ECNamedCurveTable.getParameterSpec("prime256v1");
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("EC", BouncyCastleProvider.PROVIDER_NAME);
        keyPairGenerator.initialize(paramSpec);
        KeyPair keyPair = keyPairGenerator.generateKeyPair();

        org.bouncycastle.jce.interfaces.ECPublicKey ecPublicKey = (org.bouncycastle.jce.interfaces.ECPublicKey) keyPair.getPublic();
        org.bouncycastle.jce.interfaces.ECPrivateKey ecPrivateKey = (org.bouncycastle.jce.interfaces.ECPrivateKey) keyPair.getPrivate();

        // Encode as Base64url (without padding) — using web-push Utils.encode
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        String publicKey  = encoder.encodeToString(nl.martijndwars.webpush.Utils.encode(ecPublicKey));
        String privateKey = encoder.encodeToString(nl.martijndwars.webpush.Utils.encode(ecPrivateKey));

        System.out.println("=== VAPID Key Pair Generated ===");
        System.out.println();
        System.out.println("Set these as environment variables:");
        System.out.println();
        System.out.println("VAPID_PUBLIC_KEY=" + publicKey);
        System.out.println();
        System.out.println("VAPID_PRIVATE_KEY=" + privateKey);
        System.out.println();
        System.out.println("=== SECURITY REMINDER ===");
        System.out.println("NEVER commit VAPID_PRIVATE_KEY to version control.");
        System.out.println("The public key is safe to expose to the frontend.");
    }
}
