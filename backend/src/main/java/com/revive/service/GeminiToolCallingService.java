package com.revive.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.cdimascio.dotenv.Dotenv;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Adapts the agent's provider-neutral tool loop to Gemini's function-calling API. */
@Service
public class GeminiToolCallingService {

    private static final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

    private final ObjectMapper objectMapper;
    private final String apiKey;

    public GeminiToolCallingService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.apiKey = Dotenv.configure().ignoreIfMissing().load().get("GEMINI_API_KEY");
    }

    public GroqAiService.GroqChatResponse callWithTools(
            List<Map<String, Object>> messages,
            List<Map<String, Object>> tools,
            String modelName) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GEMINI_API_KEY not configured");
        }

        Map<String, Object> request = new HashMap<>();
        request.putAll(toGeminiConversation(messages));
        request.put("tools", List.of(Map.of("functionDeclarations", toGeminiFunctionDeclarations(tools))));
        request.put("generationConfig", Map.of("maxOutputTokens", 2000));

        String endpoint = API_URL + modelName + ":generateContent?key="
                + URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPost post = new HttpPost(endpoint);
            post.setHeader("Content-Type", "application/json");
            post.setEntity(new StringEntity(objectMapper.writeValueAsString(request), StandardCharsets.UTF_8));
            try (CloseableHttpResponse response = client.execute(post)) {
                int status = response.getCode();
                String body = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
                if (status != 200) {
                    throw new RuntimeException("Gemini API returned status " + status + ": " + body);
                }
                return parseResponse(body);
            }
        }
    }

    private Map<String, Object> toGeminiConversation(List<Map<String, Object>> messages) throws Exception {
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, String> callNames = new HashMap<>();
        String systemInstruction = null;

        for (Map<String, Object> message : messages) {
            String role = String.valueOf(message.get("role"));
            if ("system".equals(role)) {
                systemInstruction = String.valueOf(message.get("content"));
                continue;
            }
            if ("assistant".equals(role)) {
                List<Map<String, Object>> parts = new ArrayList<>();
                Object toolCalls = message.get("tool_calls");
                if (toolCalls instanceof List<?> calls) {
                    for (Object callObject : calls) {
                        Map<String, Object> call = objectMapper.convertValue(callObject,
                                new TypeReference<Map<String, Object>>() {});
                        Map<String, Object> function = objectMapper.convertValue(call.get("function"),
                                new TypeReference<Map<String, Object>>() {});
                        String name = String.valueOf(function.get("name"));
                        String id = String.valueOf(call.get("id"));
                        callNames.put(id, name);
                        JsonNode arguments = objectMapper.readTree(String.valueOf(function.get("arguments")));
                        Map<String, Object> functionCall = new HashMap<>();
                        functionCall.put("name", name);
                        functionCall.put("args", objectMapper.convertValue(arguments, Object.class));
                        Object thoughtSignature = function.get("thought_signature");
                        if (thoughtSignature != null) {
                            // Opaque Gemini state: it must be echoed unchanged on the next turn.
                            functionCall.put("thoughtSignature", thoughtSignature);
                        }
                        parts.add(Map.of("functionCall", functionCall));
                    }
                } else if (message.get("content") != null) {
                    parts.add(Map.of("text", String.valueOf(message.get("content"))));
                }
                contents.add(Map.of("role", "model", "parts", parts));
                continue;
            }
            if ("tool".equals(role)) {
                String callId = String.valueOf(message.get("tool_call_id"));
                String name = callNames.get(callId);
                if (name == null) throw new IllegalStateException("Missing function name for tool call " + callId);
                Object value;
                try {
                    value = objectMapper.convertValue(objectMapper.readTree(String.valueOf(message.get("content"))), Object.class);
                } catch (Exception ignored) {
                    value = String.valueOf(message.get("content"));
                }
                contents.add(Map.of("role", "user", "parts", List.of(Map.of("functionResponse", Map.of(
                        "name", name, "response", Map.of("result", value))))));
                continue;
            }
            contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", String.valueOf(message.get("content"))))));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("contents", contents);
        if (systemInstruction != null) result.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemInstruction))));
        return result;
    }

    private List<Map<String, Object>> toGeminiFunctionDeclarations(List<Map<String, Object>> tools) {
        List<Map<String, Object>> declarations = new ArrayList<>();
        for (Map<String, Object> tool : tools) {
            Map<String, Object> function = objectMapper.convertValue(tool.get("function"),
                    new TypeReference<Map<String, Object>>() {});
            Map<String, Object> declaration = new HashMap<>();
            declaration.put("name", function.get("name"));
            declaration.put("description", function.get("description"));
            declaration.put("parameters", toGeminiSchema(function.get("parameters")));
            declarations.add(declaration);
        }
        return declarations;
    }

    @SuppressWarnings("unchecked")
    private Object toGeminiSchema(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> converted = new HashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                String key = String.valueOf(entry.getKey());
                if ("default".equals(key)) continue;
                Object child = toGeminiSchema(entry.getValue());
                if ("type".equals(key) && child instanceof String type) child = type.toUpperCase();
                converted.put(key, child);
            }
            return converted;
        }
        if (value instanceof List<?> list) return list.stream().map(this::toGeminiSchema).toList();
        return value;
    }

    private GroqAiService.GroqChatResponse parseResponse(String body) throws Exception {
        JsonNode message = objectMapper.readTree(body).path("candidates").path(0).path("content");
        if (message.isMissingNode()) throw new RuntimeException("Invalid Gemini API response");

        List<GroqAiService.ToolCall> toolCalls = new ArrayList<>();
        List<Map<String, Object>> openAiCalls = new ArrayList<>();
        StringBuilder text = new StringBuilder();
        int index = 0;
        for (JsonNode part : message.path("parts")) {
            if (part.has("functionCall")) {
                JsonNode functionCall = part.path("functionCall");
                String id = "gemini-call-" + index++;
                String name = functionCall.path("name").asText();
                String arguments = objectMapper.writeValueAsString(functionCall.path("args"));
                toolCalls.add(new GroqAiService.ToolCall(id, name, arguments));
                Map<String, Object> function = new HashMap<>();
                function.put("name", name);
                function.put("arguments", arguments);
                if (functionCall.has("thoughtSignature")) {
                    function.put("thought_signature", functionCall.path("thoughtSignature").asText());
                }
                openAiCalls.add(Map.of("id", id, "type", "function", "function", function));
            } else if (part.has("text")) {
                text.append(part.path("text").asText());
            }
        }

        if (toolCalls.isEmpty()) {
            return new GroqAiService.GroqChatResponse("stop", text.toString(),
                    Map.of("role", "assistant", "content", text.toString()), null);
        }
        return new GroqAiService.GroqChatResponse("tool_calls", null,
                Map.of("role", "assistant", "tool_calls", openAiCalls), toolCalls);
    }
}
