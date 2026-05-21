package com.project.config;

import com.project.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Public auth endpoints
                        .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()
                        // Public read-only endpoints (navigation, location list, connection list, buildings, floors)
                        .requestMatchers(HttpMethod.GET, "/api/locations", "/api/locations/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/connections", "/api/connections/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/buildings", "/api/buildings/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/floors", "/api/floors/**").permitAll()
                        .requestMatchers("/api/path/**").permitAll()
                        // Admin-only mutations for locations
                        .requestMatchers(HttpMethod.POST, "/api/locations", "/api/locations/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/locations", "/api/locations/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/locations", "/api/locations/**").hasRole("ADMIN")
                        // Admin-only mutations for connections
                        .requestMatchers(HttpMethod.POST, "/api/connections", "/api/connections/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/connections", "/api/connections/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/connections", "/api/connections/**").hasRole("ADMIN")
                        // Admin-only mutations for buildings
                        .requestMatchers(HttpMethod.POST, "/api/buildings", "/api/buildings/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/buildings", "/api/buildings/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/buildings", "/api/buildings/**").hasRole("ADMIN")
                        // Admin-only mutations for floors
                        .requestMatchers(HttpMethod.POST, "/api/floors", "/api/floors/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/floors", "/api/floors/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/floors", "/api/floors/**").hasRole("ADMIN")
                        // Catch-all: everything else requires authentication
                        .requestMatchers("/api/**").authenticated()
                        // Allow static resources and SPA routing
                        .anyRequest().permitAll()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
