package com.churchshare.service;

import com.churchshare.entity.AdminUser;
import com.churchshare.entity.ChurchAccount;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive unit tests for JwtService.
 * 
 * Testing priorities:
 * 1. Token generation with valid claims
 * 2. Token validation and expiration
 * 3. Invalid token rejection
 * 4. Token refresh capability
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("JwtService Unit Tests")
class JwtServiceTest {

    @InjectMocks
    private JwtService jwtService;

    private AdminUser testAdmin;
    private ChurchAccount testChurch;
    private String validSecret;
    private SecretKey testKey;

    @BeforeEach
    void setUp() {
        // Generate a valid secret key for testing
        validSecret = Base64.getEncoder().encodeToString(
                Keys.secretKeyFor(Jwts.SIG.HS256).getEncoded()
        );
        testKey = Keys.secretKeyFor(Jwts.SIG.HS256);

        ReflectionTestUtils.setField(jwtService, "jwtSecret", validSecret);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 3600000L); // 1 hour

        testChurch = new ChurchAccount();
        testChurch.setId(UUID.randomUUID());
        testChurch.setName("Test Church");

        testAdmin = new AdminUser();
        testAdmin.setId(UUID.randomUUID());
        testAdmin.setEmail("admin@testchurch.com");
        testAdmin.setChurchAccount(testChurch);
    }

    @Nested
    @DisplayName("Token Generation Tests")
    class TokenGenerationTests {

        @Test
        @DisplayName("should generate token with valid claims for admin user")
        void shouldGenerateTokenWithValidClaimsForAdminUser() {
            // When
            String token = jwtService.generateToken(testAdmin);

            // Then
            assertThat(token).isNotNull();
            assertThat(token).isNotBlank();
            
            // Verify token can be parsed
            Claims claims = Jwts.parser()
                    .verifyWith(testKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            // Note: claims will be valid but signature won't match testKey
            // We verify through the service's own extraction methods
            assertThat(jwtService.extractUsername(token)).isEqualTo("admin@testchurch.com");
        }

        @Test
        @DisplayName("should include userId in token claims")
        void shouldIncludeUserIdInTokenClaims() {
            // When
            String token = jwtService.generateToken(testAdmin);

            // Then
            UUID extractedId = jwtService.extractUserId(token);
            assertThat(extractedId).isEqualTo(testAdmin.getId());
        }

        @Test
        @DisplayName("should include churchId in token claims")
        void shouldIncludeChurchIdInTokenClaims() {
            // When
            String token = jwtService.generateToken(testAdmin);

            // Then
            UUID extractedChurchId = jwtService.extractChurchId(token);
            assertThat(extractedChurchId).isEqualTo(testChurch.getId());
        }

        @Test
        @DisplayName("should include role in token claims")
        void shouldIncludeRoleInTokenClaims() {
            // When
            String token = jwtService.generateToken(testAdmin);

            // Then
            String role = jwtService.extractRole(token);
            assertThat(role).isEqualTo(testAdmin.getRole().name());
        }

        @Test
        @DisplayName("should include church name in token claims")
        void shouldIncludeChurchNameInTokenClaims() {
            // When
            String token = jwtService.generateToken(testAdmin);

            // Then
            Claims claims = extractClaims(token);
            assertThat(claims.get("churchName")).isEqualTo("Test Church");
        }

        @Test
        @DisplayName("should generate token with custom extra claims")
        void shouldGenerateTokenWithCustomExtraClaims() {
            // Given
            Map<String, Object> extraClaims = new HashMap<>();
            extraClaims.put("customClaim", "customValue");
            extraClaims.put("numericClaim", 12345);
            
            UserDetails userDetails = User.builder()
                    .username("testuser")
                    .password("password")
                    .roles("USER")
                    .build();

            // When
            String token = jwtService.generateToken(extraClaims, userDetails);

            // Then
            assertThat(token).isNotNull();
            assertThat(jwtService.extractUsername(token)).isEqualTo("testuser");
            
            Claims claims = extractClaims(token);
            assertThat(claims.get("customClaim")).isEqualTo("customValue");
            assertThat(claims.get("numericClaim")).isEqualTo(12345);
        }

        @Test
        @DisplayName("should set correct issued at time")
        void shouldSetCorrectIssuedAtTime() {
            // Given
            Date beforeGeneration = new Date();

            // When
            String token = jwtService.generateToken(testAdmin);
            Date afterGeneration = new Date();

            // Then
            Claims claims = extractClaims(token);
            Date issuedAt = claims.getIssuedAt();
            
            assertThat(issuedAt).isAfterOrEqualTo(beforeGeneration);
            assertThat(issuedAt).isBeforeOrEqualTo(afterGeneration);
        }

        @Test
        @DisplayName("should set correct expiration time")
        void shouldSetCorrectExpirationTime() {
            // Given
            Date beforeGeneration = new Date();
            long expirationMs = 7200000L; // 2 hours
            ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", expirationMs);

            // When
            String token = jwtService.generateToken(testAdmin);
            Date afterGeneration = new Date();

            // Then
            Claims claims = extractClaims(token);
            Date expiration = claims.getExpiration();
            
            Date expectedExpiration = new Date(beforeGeneration.getTime() + expirationMs);
            Date maxExpectedExpiration = new Date(afterGeneration.getTime() + expirationMs);
            
            assertThat(expiration).isAfterOrEqualTo(expectedExpiration);
            assertThat(expiration).isBeforeOrEqualTo(maxExpectedExpiration);
        }
    }

    @Nested
    @DisplayName("Token Validation Tests")
    class TokenValidationTests {

        @Test
        @DisplayName("should validate token with valid token and user")
        void shouldValidateTokenWithValidTokenAndUser() {
            // Given
            String token = jwtService.generateToken(testAdmin);
            UserDetails userDetails = User.builder()
                    .username("admin@testchurch.com")
                    .password("password")
                    .roles("ADMIN")
                    .build();

            // When
            boolean isValid = jwtService.isTokenValid(token, userDetails);

            // Then
            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("should reject token with mismatched username")
        void shouldRejectTokenWithMismatchedUsername() {
            // Given
            String token = jwtService.generateToken(testAdmin);
            UserDetails differentUser = User.builder()
                    .username("different@testchurch.com")
                    .password("password")
                    .roles("ADMIN")
                    .build();

            // When
            boolean isValid = jwtService.isTokenValid(token, differentUser);

            // Then
            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("should extract username from token")
        void shouldExtractUsernameFromToken() {
            // Given
            String token = jwtService.generateToken(testAdmin);

            // When
            String username = jwtService.extractUsername(token);

            // Then
            assertThat(username).isEqualTo("admin@testchurch.com");
        }

        @Test
        @DisplayName("should extract specific claim from token")
        void shouldExtractSpecificClaimFromToken() {
            // Given
            String token = jwtService.generateToken(testAdmin);

            // When
            String email = jwtService.extractClaim(token, claims -> 
                    claims.get("email", String.class));

            // Then
            assertThat(email).isEqualTo("admin@testchurch.com");
        }
    }

    @Nested
    @DisplayName("Token Expiration Tests")
    class TokenExpirationTests {

        @Test
        @DisplayName("should detect expired token")
        void shouldDetectExpiredToken() {
            // Given - create token that expires immediately
            ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 1L); // 1ms
            
            String token = jwtService.generateToken(testAdmin);
            
            // Wait for token to expire
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            // When & Then
            assertThat(jwtService.isTokenExpired(token)).isTrue();
        }

        @Test
        @DisplayName("should return false for non-expired token")
        void shouldReturnFalseForNonExpiredToken() {
            // Given
            String token = jwtService.generateToken(testAdmin);

            // When & Then
            assertThat(jwtService.isTokenExpired(token)).isFalse();
        }

        @Test
        @DisplayName("should throw exception when parsing expired token")
        void shouldThrowExceptionWhenParsingExpiredToken() {
            // Given - create token that expires immediately
            ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 1L);
            
            String token = jwtService.generateToken(testAdmin);
            
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            // When & Then
            assertThatThrownBy(() -> jwtService.extractUsername(token))
                    .isInstanceOf(ExpiredJwtException.class);
        }

        @Test
        @DisplayName("should return expiration milliseconds")
        void shouldReturnExpirationMilliseconds() {
            // Given
            long customExpiration = 86400000L; // 24 hours
            ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", customExpiration);

            // When
            long expiration = jwtService.getExpirationMs();

            // Then
            assertThat(expiration).isEqualTo(customExpiration);
        }
    }

    @Nested
    @DisplayName("Invalid Token Rejection Tests")
    class InvalidTokenRejectionTests {

        @Test
        @DisplayName("should reject token with invalid signature")
        void shouldRejectTokenWithInvalidSignature() {
            // Given - create token with different secret
            String wrongSecret = Base64.getEncoder().encodeToString(
                    Keys.secretKeyFor(Jwts.SIG.HS256).getEncoded()
            );
            
            String token = Jwts.builder()
                    .subject("admin@testchurch.com")
                    .claim("userId", testAdmin.getId().toString())
                    .claim("churchId", testChurch.getId().toString())
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + 3600000))
                    .signWith(Keys.hmacShaKeyFor(Base64.getDecoder().decode(wrongSecret)), Jwts.SIG.HS256)
                    .compact();

            // When & Then
            assertThatThrownBy(() -> jwtService.extractUsername(token))
                    .isInstanceOf(Exception.class); // Signature exception
        }

        @Test
        @DisplayName("should reject malformed token")
        void shouldRejectMalformedToken() {
            // Given
            String malformedToken = "not.a.valid.jwt.token";

            // When & Then
            assertThatThrownBy(() -> jwtService.extractUsername(malformedToken))
                    .isInstanceOf(Exception.class);
        }

        @Test
        @DisplayName("should reject empty token")
        void shouldRejectEmptyToken() {
            // Given
            String emptyToken = "";

            // When & Then
            assertThatThrownBy(() -> jwtService.extractUsername(emptyToken))
                    .isInstanceOf(Exception.class);
        }

        @Test
        @DisplayName("should reject null token")
        void shouldRejectNullToken() {
            // When & Then
            assertThatThrownBy(() -> jwtService.extractUsername(null))
                    .isInstanceOf(Exception.class);
        }

        @Test
        @DisplayName("should reject token with tampered payload")
        void shouldRejectTokenWithTamperedPayload() {
            // Given - create valid token then tamper with it
            String validToken = jwtService.generateToken(testAdmin);
            String[] parts = validToken.split("\\.");
            
            // Tamper with the payload (second part)
            String tamperedPayload = parts[1] + "tampered";
            String tamperedToken = parts[0] + "." + tamperedPayload + "." + parts[2];

            // When & Then
            assertThatThrownBy(() -> jwtService.extractUsername(tamperedToken))
                    .isInstanceOf(Exception.class);
        }
    }

    @Nested
    @DisplayName("Token Refresh Tests")
    class TokenRefreshTests {

        @Test
        @DisplayName("should allow generating new token from old claims")
        void shouldAllowGeneratingNewTokenFromOldClaims() {
            // Given
            String oldToken = jwtService.generateToken(testAdmin);
            Claims oldClaims = extractClaims(oldToken);

            // When - create new token with same claims
            Map<String, Object> newClaims = new HashMap<>(oldClaims);
            newClaims.remove("exp");
            newClaims.remove("iat");
            newClaims.remove("nbf");
            
            UserDetails userDetails = User.builder()
                    .username(oldClaims.getSubject())
                    .password("password")
                    .roles("ADMIN")
                    .build();
            
            String newToken = jwtService.generateToken(newClaims, userDetails);

            // Then
            assertThat(newToken).isNotNull();
            assertThat(newToken).isNotEqualTo(oldToken); // Different token
            assertThat(jwtService.extractUsername(newToken))
                    .isEqualTo(jwtService.extractUsername(oldToken));
        }

        @Test
        @DisplayName("should allow generating token with extended expiration")
        void shouldAllowGeneratingTokenWithExtendedExpiration() {
            // Given
            String originalToken = jwtService.generateToken(testAdmin);
            Date originalExpiration = extractClaims(originalToken).getExpiration();
            
            // Extend expiration
            long extendedExpiration = 7200000L; // 2 hours
            ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", extendedExpiration);

            // When
            String newToken = jwtService.generateToken(testAdmin);
            Date newExpiration = extractClaims(newToken).getExpiration();

            // Then
            assertThat(newExpiration).isAfter(originalExpiration);
        }

        @Test
        @DisplayName("should preserve user claims when refreshing")
        void shouldPreserveUserClaimsWhenRefreshing() {
            // Given
            String originalToken = jwtService.generateToken(testAdmin);
            UUID originalUserId = jwtService.extractUserId(originalToken);
            UUID originalChurchId = jwtService.extractChurchId(originalToken);
            String originalRole = jwtService.extractRole(originalToken);

            // When - generate new token
            String newToken = jwtService.generateToken(testAdmin);

            // Then
            assertThat(jwtService.extractUserId(newToken)).isEqualTo(originalUserId);
            assertThat(jwtService.extractChurchId(newToken)).isEqualTo(originalChurchId);
            assertThat(jwtService.extractRole(newToken)).isEqualTo(originalRole);
        }
    }

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("should handle admin user with null church account gracefully")
        void shouldHandleAdminUserWithNullChurchAccount() {
            // Given
            AdminUser adminWithoutChurch = new AdminUser();
            adminWithoutChurch.setId(UUID.randomUUID());
            adminWithoutChurch.setEmail("orphan@testchurch.com");
            // churchAccount is null

            // When & Then - should handle gracefully or throw meaningful exception
            assertThatThrownBy(() -> jwtService.generateToken(adminWithoutChurch))
                    .isInstanceOf(NullPointerException.class);
        }

        @Test
        @DisplayName("should handle very long email addresses")
        void shouldHandleVeryLongEmailAddresses() {
            // Given
            AdminUser adminWithLongEmail = new AdminUser();
            adminWithLongEmail.setId(UUID.randomUUID());
            String longEmail = "a".repeat(200) + "@testchurch.com";
            adminWithLongEmail.setEmail(longEmail);
            adminWithLongEmail.setChurchAccount(testChurch);

            // When
            String token = jwtService.generateToken(adminWithLongEmail);

            // Then
            assertThat(token).isNotNull();
            assertThat(jwtService.extractUsername(token)).isEqualTo(longEmail);
        }

        @Test
        @DisplayName("should handle special characters in email")
        void shouldHandleSpecialCharactersInEmail() {
            // Given
            AdminUser adminWithSpecialEmail = new AdminUser();
            adminWithSpecialEmail.setId(UUID.randomUUID());
            adminWithSpecialEmail.setEmail("admin+test@subdomain.testchurch.com");
            adminWithSpecialEmail.setChurchAccount(testChurch);

            // When
            String token = jwtService.generateToken(adminWithSpecialEmail);

            // Then
            assertThat(token).isNotNull();
            assertThat(jwtService.extractUsername(token))
                    .isEqualTo("admin+test@subdomain.testchurch.com");
        }
    }

    /**
     * Helper method to extract claims without signature verification for testing.
     */
    private Claims extractClaims(String token) {
        // For testing, we use the service's own extraction which handles verification
        // We create a Claims-like map from individual extractions
        Map<String, Object> claimsMap = new HashMap<>();
        claimsMap.put("sub", jwtService.extractUsername(token));
        claimsMap.put("userId", jwtService.extractUserId(token));
        claimsMap.put("churchId", jwtService.extractChurchId(token));
        claimsMap.put("role", jwtService.extractRole(token));
        
        // For actual Claims object, we need to parse with the correct key
        // This is a limitation of unit testing - in integration tests we'd have the real key
        return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(Base64.getDecoder().decode(validSecret)))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
