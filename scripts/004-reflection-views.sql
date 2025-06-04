-- Create useful views for reflection analytics and reporting

-- View to get reflection counts per memory
CREATE OR REPLACE VIEW memory_reflection_stats AS
SELECT 
    m.id as memory_id,
    m.title as memory_title,
    COUNT(r.id) as reflection_count,
    MIN(r.created_at) as first_reflection_date,
    MAX(r.created_at) as latest_reflection_date
FROM memories m
LEFT JOIN reflections r ON m.id = r.memory_id
GROUP BY m.id, m.title;

-- View to get recent reflections across all memories
CREATE OR REPLACE VIEW recent_reflections AS
SELECT 
    r.id,
    r.title,
    r.content,
    r.created_at,
    m.title as memory_title,
    m.id as memory_id
FROM reflections r
JOIN memories m ON r.memory_id = m.id
ORDER BY r.created_at DESC;

-- View for reflection search with memory context
CREATE OR REPLACE VIEW searchable_reflections AS
SELECT 
    r.id,
    r.title,
    r.content,
    r.created_at,
    r.memory_id,
    m.title as memory_title,
    m.description as memory_description,
    to_tsvector('english', r.title || ' ' || r.content || ' ' || m.title) as search_vector
FROM reflections r
JOIN memories m ON r.memory_id = m.id;

-- Grant permissions on views
GRANT SELECT ON memory_reflection_stats TO authenticated, anon;
GRANT SELECT ON recent_reflections TO authenticated, anon;
GRANT SELECT ON searchable_reflections TO authenticated, anon;
