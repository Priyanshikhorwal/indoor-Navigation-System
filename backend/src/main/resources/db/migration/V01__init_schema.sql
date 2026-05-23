-- V01__init_schema.sql
-- PostgreSQL schema for Indoor Navigation System

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE buildings (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE floors (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    floor_label VARCHAR(100),
    map_image_path VARCHAR(500),
    map_scale DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    emergency_exit_nodes JSONB   -- array of location ids
);

CREATE TABLE locations (
    id BIGSERIAL PRIMARY KEY,
    floor_id BIGINT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    x_coordinate INT NOT NULL,
    y_coordinate INT NOT NULL,
    width INT,
    height INT,
    accessibility_type VARCHAR(50),
    room_category VARCHAR(100),
    room_capacity INT,
    is_restricted BOOLEAN DEFAULT FALSE,
    landmark_description TEXT
);

CREATE TABLE connections (
    id BIGSERIAL PRIMARY KEY,
    source_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    destination_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    distance DOUBLE PRECISION NOT NULL,
    direction_type VARCHAR(20) CHECK (direction_type IN ('FLAT','UP','DOWN')),
    traversal_type VARCHAR(20) CHECK (traversal_type IN ('STAIRS','LIFT','CORRIDOR','ELEVATOR')),
    is_bidirectional BOOLEAN DEFAULT TRUE,
    accessibility_supported BOOLEAN DEFAULT TRUE,
    estimated_walk_time INTERVAL,
    traversal_type_detail VARCHAR(50) -- e.g., "Staircase A"
);

CREATE TABLE routes_cache (
    id BIGSERIAL PRIMARY KEY,
    source_id BIGINT NOT NULL REFERENCES locations(id),
    destination_id BIGINT NOT NULL REFERENCES locations(id),
    total_distance DOUBLE PRECISION NOT NULL,
    estimated_time INTERVAL NOT NULL,
    floor_transition_count INT NOT NULL,
    path JSONB NOT NULL, -- ordered list of location ids
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('ADMIN','USER')) NOT NULL
);

-- Indexes for fast lookup
CREATE INDEX idx_location_name ON locations(name);
CREATE INDEX idx_location_floor ON locations(floor_id);
CREATE INDEX idx_connection_source ON connections(source_id);
CREATE INDEX idx_connection_dest ON connections(destination_id);
