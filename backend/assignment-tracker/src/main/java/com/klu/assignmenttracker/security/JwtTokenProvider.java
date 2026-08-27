package com.klu.assignmenttracker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Handles creation and validation of JWT (JSON Web Token) access tokens.
 *
 * How JWTs work:
 * 1. User logs in → we create a token signed with our secret key
 * 2. User sends this token in every request header
 * 3. We verify the token's signature to make sure it wasn't tampered with
 * 4. We extract the user's email from the token to identify them
 */
@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    /**
     * Get the signing key derived from our secret string.
     * The key is used to both sign new tokens and verify existing ones.
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Create a new JWT token for an authenticated user.
     *
     * @param email the user's email (stored as the "subject" in the token)
     * @return the signed JWT string
     */
    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extract the user's email from a JWT token.
     *
     * @param token the JWT string
     * @return the email stored in the token
     */
    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    /**
     * Check if a token is valid (correct signature and not expired).
     *
     * @param token the JWT string to validate
     * @return true if valid, false if expired or tampered with
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException ex) {
            log.warn("Invalid JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.warn("JWT token is empty or null");
        }
        return false;
    }
}
