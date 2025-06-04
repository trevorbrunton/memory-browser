-- Useful functions for reflection management

-- Function to get reflection count for a specific memory
CREATE OR REPLACE FUNCTION get_memory_reflection_count(memory_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM reflections 
        WHERE memory_id = memory_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Function to search reflections by text
CREATE OR REPLACE FUNCTION search_reflections(search_term TEXT)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    content TEXT,
    memory_id UUID,
    memory_title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.id,
        sr.title,
        sr.content,
        sr.memory_id,
        sr.memory_title,
        sr.created_at,
        ts_rank(sr.search_vector, plainto_tsquery('english', search_term)) as rank
    FROM searchable_reflections sr
    WHERE sr.search_vector @@ plainto_tsquery('english', search_term)
    ORDER BY rank DESC, sr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get reflections timeline for a memory
CREATE OR REPLACE FUNCTION get_memory_reflections_timeline(memory_uuid UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    days_since_memory INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.title,
        r.content,
        r.created_at,
        EXTRACT(DAY FROM (r.created_at - m.date))::INTEGER as days_since_memory
    FROM reflections r
    JOIN memories m ON r.memory_id = m.id
    WHERE r.memory_id = memory_uuid
    ORDER BY r.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_memory_reflection_count(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_reflections(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_memory_reflections_timeline(UUID) TO authenticated, anon;
