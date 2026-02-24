package com.churchshare.security;

import com.churchshare.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * JWT Authentication Filter.
 * 
 * Intercepts requests to extract and validate JWT tokens from the Authorization header.
 * If valid, sets the authentication in the SecurityContext.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ChurchShareUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // Extract JWT from Authorization header
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        try {
            // Extract user email from token
            userEmail = jwtService.extractUsername(jwt);

            if (StringUtils.hasText(userEmail) && 
                SecurityContextHolder.getContext().getAuthentication() == null) {

                // Load user from database
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

                if (userDetails != null && jwtService.isTokenValid(jwt, userDetails)) {

                    // Create authentication token
                    UsernamePasswordAuthenticationToken authToken = 
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    // Set authentication in context
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    // Store additional info in request attributes for easy access
                    if (userDetails instanceof ChurchShareUserDetails churchUser) {
                        request.setAttribute("churchId", churchUser.getChurchId());
                        request.setAttribute("userId", churchUser.getId());
                    }

                    log.debug("Authenticated user: {}", userEmail);
                }
            }

            filterChain.doFilter(request, response);

        } catch (Exception e) {
            log.warn("JWT authentication failed: {}", e.getMessage());
            // Continue without authentication - let endpoint handle authorization
            filterChain.doFilter(request, response);
        }
    }

    /**
     * Check if the current request is authenticated.
     */
    public static boolean isAuthenticated() {
        return SecurityContextHolder.getContext().getAuthentication() != null
                && SecurityContextHolder.getContext().getAuthentication().isAuthenticated()
                && !(SecurityContextHolder.getContext().getAuthentication()
                        .getPrincipal() instanceof String);
    }

    /**
     * Get the current authenticated user details.
     */
    public static ChurchShareUserDetails getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof ChurchShareUserDetails) {
            return (ChurchShareUserDetails) authentication.getPrincipal();
        }
        return null;
    }

    /**
     * Get the current church ID from request attribute.
     */
    public static UUID getCurrentChurchId(HttpServletRequest request) {
        Object churchId = request.getAttribute("churchId");
        return churchId instanceof UUID ? (UUID) churchId : null;
    }

    /**
     * Get the current user ID from request attribute.
     */
    public static UUID getCurrentUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("userId");
        return userId instanceof UUID ? (UUID) userId : null;
    }
}
