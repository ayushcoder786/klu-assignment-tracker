package com.klu.assignmenttracker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * A filter that runs on every HTTP request to check for a JWT token.
 *
 * How it works:
 * 1. Look for "Authorization: Bearer {token}" in the request header
 * 2. If found, validate the token
 * 3. If valid, extract the user's email and load their details from the
 * database
 * 4. Set the user as "authenticated" in the security context for this request
 *
 * If no token is provided (e.g., for /api/auth/login), this filter just does
 * nothing
 * and the request proceeds as an unauthenticated request.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider,
            UserDetailsServiceImpl userDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            // Step 1: Extract token from "Authorization: Bearer xxx" header
            String token = extractTokenFromRequest(request);

            // Step 2: Validate token if present
            if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {

                // Step 3: Get the user's email from the token
                String email = jwtTokenProvider.getEmailFromToken(token);

                // Step 4: Load user details from database
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // Step 5: Create authentication object and set it in the security context
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            // If anything goes wrong reading the token, just continue without
            // authentication
            // The security rules will then reject the request if the endpoint requires auth
            log.debug("Could not set user authentication from JWT: {}", ex.getMessage());
        }

        // Continue processing the request
        filterChain.doFilter(request, response);
    }

    /**
     * Extract the JWT token string from the Authorization header.
     * The header format is: "Authorization: Bearer eyJhbGciO..."
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Remove "Bearer " prefix
        }
        return null;
    }
}
