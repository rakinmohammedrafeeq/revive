-- Initial schema for Ledgera
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_records (
    id BIGSERIAL PRIMARY KEY,
    amount NUMERIC(15, 2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_financial_records_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
);

