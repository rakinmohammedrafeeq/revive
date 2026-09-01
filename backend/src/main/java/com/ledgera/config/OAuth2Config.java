package com.ledgera.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;

@Configuration
public class OAuth2Config {

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        // Load .env file if it exists (local dev), otherwise use system environment variables (production)
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        
        String clientId = dotenv.get("GOOGLE_CLIENT_ID");
        String clientSecret = dotenv.get("GOOGLE_CLIENT_SECRET");
        String redirectUri = dotenv.get("GOOGLE_REDIRECT_URI", "{baseUrl}/login/oauth2/code/{registrationId}");
        
        if (clientId == null || clientSecret == null) {
            throw new IllegalStateException("Google OAuth credentials not configured. " +
                    "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file");
        }

        ClientRegistration googleRegistration = ClientRegistration.withRegistrationId("google")
                .clientId(clientId)
                .clientSecret(clientSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUri)
                .scope("openid", "profile", "email")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName(IdTokenClaimNames.SUB)
                .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .clientName("Google")
                .build();

        return new InMemoryClientRegistrationRepository(googleRegistration);
    }
}
