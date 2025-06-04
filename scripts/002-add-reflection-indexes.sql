-- Additional indexes for better performance

-- Composite index for memory_id and created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_reflections_memory_created ON reflections(memory_id, created_at DESC);

-- Full-text search index on content for searching within reflections
CREATE INDEX IF NOT EXISTS idx_reflections_content_search ON reflections USING gin(to_tsvector('english', content));

-- Index on title for partial matching
CREATE INDEX IF NOT EXISTS idx_reflections_title_search ON reflections USING gin(to_tsvector('english', title));
