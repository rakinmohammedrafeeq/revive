-- RAG Tables for Financial Advisor Feature

-- Store vector embeddings of financial records for semantic search
CREATE TABLE IF NOT EXISTS financial_embeddings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    workspace_id BIGINT,
    record_id BIGINT,
    content TEXT NOT NULL,
    embedding vector(384),  -- MiniLM model produces 384-dimensional vectors
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_embeddings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_embeddings_record FOREIGN KEY (record_id) REFERENCES financial_records (id) ON DELETE CASCADE
);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_financial_embeddings_vector ON financial_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_financial_embeddings_user ON financial_embeddings (user_id);
CREATE INDEX IF NOT EXISTS idx_financial_embeddings_workspace ON financial_embeddings (workspace_id);

-- Store conversation history for context-aware responses
CREATE TABLE IF NOT EXISTS advisor_conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    workspace_id BIGINT,
    session_id VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
    context_used JSONB,  -- Store retrieved context for debugging
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_advisor_conversations_session ON advisor_conversations (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_advisor_conversations_user ON advisor_conversations (user_id, created_at DESC);

-- Store generated financial insights and recommendations
CREATE TABLE IF NOT EXISTS financial_insights (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    workspace_id BIGINT,
    insight_type VARCHAR(50) NOT NULL,  -- 'budget', 'investment', 'savings', 'spending'
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',  -- 'high', 'medium', 'low'
    status VARCHAR(20) DEFAULT 'active',  -- 'active', 'dismissed', 'completed'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    CONSTRAINT fk_insights_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_financial_insights_user ON financial_insights (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_insights_type ON financial_insights (insight_type, status);
