package com.sciome.service.llm;

public interface LlmProvider {
    String getName();
    String getDefaultModel();
    LlmResult generate(String systemPrompt, String userPrompt, String apiKey,
                       String model, double temperature, int maxTokens, int timeoutSeconds);

    class LlmResult {
        private final String content;
        private final int inputTokens;
        private final int outputTokens;
        private final boolean success;
        private final String error;

        public LlmResult(String content, int inputTokens, int outputTokens) {
            this.content = content;
            this.inputTokens = inputTokens;
            this.outputTokens = outputTokens;
            this.success = true;
            this.error = null;
        }

        public LlmResult(String error) {
            this.content = null;
            this.inputTokens = 0;
            this.outputTokens = 0;
            this.success = false;
            this.error = error;
        }

        public String getContent() { return content; }
        public int getInputTokens() { return inputTokens; }
        public int getOutputTokens() { return outputTokens; }
        public boolean isSuccess() { return success; }
        public String getError() { return error; }
    }
}
