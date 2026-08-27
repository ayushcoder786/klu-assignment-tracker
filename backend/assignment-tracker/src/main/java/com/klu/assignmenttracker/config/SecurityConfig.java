package com.klu.assignmenttracker.config;

import com.klu.assignmenttracker.security.JwtAuthenticationFilter;
import com.klu.assignmenttracker.security.UserDetailsServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security configuration for the KLU Assignment Tracker API.
 *
 * Security rules:
 * - /api/auth/** → Public (login and register don't need a token)
 * - /api/health  → Public
 * - /api/admin/** → Only ADMIN role
 * - Everything else → Must be authenticated (any role)
 *
 * Session policy: STATELESS (we use JWT tokens, not server-side sessions)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(UserDetailsServiceImpl userDetailsService,
                          JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    /**
     * Main security rules configuration.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF protection because we use JWT (stateless), not cookies
            .csrf(AbstractHttpConfigurer::disable)

            // Allow cross-origin requests from the frontend
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Define which endpoints require authentication
            .authorizeHttpRequests(auth -> auth
                // Public endpoints (no token needed)
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/actuator/health/**").permitAll()
                .requestMatchers("/api/notifications/vapid-public-key").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Admin-only endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // All other endpoints require any authenticated user
                .anyRequest().authenticated()
            )

            // Use STATELESS sessions - no session stored on server, token in every request
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Use our custom authentication provider (BCrypt password checking)
            .authenticationProvider(authenticationProvider())

            // Add our JWT filter before the default username/password filter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * BCrypt password encoder.
     * BCrypt automatically handles salting - it's secure by default.
     * We use strength 10 (default), which is a good balance of security and speed.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Authentication provider that uses our UserDetailsService + BCrypt.
     * This is what Spring Security calls to verify a user's credentials.
     *
     * Note: In Spring Security 7, DaoAuthenticationProvider requires the
     * UserDetailsService to be passed to the constructor.
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * AuthenticationManager is used in AuthController to authenticate login requests.
     */
    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * CORS configuration: allows the React frontend to call our API.
     * In production, the allowed origins are configured via FRONTEND_URL or app.cors.allowed-origins.
     * Preserves OPTIONS preflight support, headers, and credentials.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        List<String> origins = java.util.Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toList());
        
        // If wildcard is specified (e.g. during local dev or default), use allowedOriginPatterns
        configuration.setAllowedOriginPatterns(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // Cache preflight response for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
