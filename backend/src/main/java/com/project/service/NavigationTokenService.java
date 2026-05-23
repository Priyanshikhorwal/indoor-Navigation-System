package com.project.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class NavigationTokenService {

    @Value("${jwt.secret}")
    private String secretString;

    // 24 hours expiry for navigation links
    private final long EXPIRATION_TIME = 86400000L; 

    private SecretKey getSigningKey() {
        byte[] keyBytes = secretString.getBytes();
        // Since original secret might be shorter or longer, using HMAC SHA
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateNavigationToken(String email, Long buildingId, Long destination, Long start) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("buildingId", buildingId);
        claims.put("destination", destination);
        if (start != null) {
            claims.put("start", start);
        }

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }
}
