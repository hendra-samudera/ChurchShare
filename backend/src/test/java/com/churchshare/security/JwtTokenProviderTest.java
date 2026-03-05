package com.churchshare.security;

import com.churchshare.config.JwtProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        JwtProperties props = new JwtProperties();
        // 64-char secret (well over 32-byte minimum)
        props.setSecret("this-is-a-test-secret-key-that-is-at-least-32-bytes-long-ok-fine");
        props.setExpirationMs(3_600_000L); // 1 hour

        jwtTokenProvider = new JwtTokenProvider(props);
        jwtTokenProvider.validateKey(); // simulate @PostConstruct
    }

    @Test
    void testGenerateAndParseToken() {
        String token = jwtTokenProvider.generateToken("admin@church.org");

        String email = jwtTokenProvider.getEmailFromToken(token);

        assertEquals("admin@church.org", email);
    }

    @Test
    void testValidateToken() {
        String token = jwtTokenProvider.generateToken("admin@church.org");

        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    void testValidateExpiredToken() {
        JwtProperties props = new JwtProperties();
        props.setSecret("this-is-a-test-secret-key-that-is-at-least-32-bytes-long-ok-fine");
        props.setExpirationMs(-1000L); // already expired

        JwtTokenProvider expiredProvider = new JwtTokenProvider(props);
        expiredProvider.validateKey();

        String token = expiredProvider.generateToken("admin@church.org");

        assertFalse(expiredProvider.validateToken(token));
    }

    @Test
    void testValidateInvalidToken() {
        assertFalse(jwtTokenProvider.validateToken("not.a.real.token"));
    }

    @Test
    void testValidateNullToken() {
        assertFalse(jwtTokenProvider.validateToken(null));
    }
}
