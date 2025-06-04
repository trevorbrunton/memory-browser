-- Insert sample reflections (optional - for testing)
-- Note: This assumes you have some memories in your database already

-- First, let's check if we have any memories to work with
DO $$
DECLARE
    sample_memory_id UUID;
BEGIN
    -- Get a sample memory ID (if any exist)
    SELECT id INTO sample_memory_id FROM memories LIMIT 1;
    
    -- Only insert sample data if we have memories
    IF sample_memory_id IS NOT NULL THEN
        INSERT INTO reflections (memory_id, title, content) VALUES
        (
            sample_memory_id,
            'Initial Thoughts',
            'This memory brings back so many emotions. I remember feeling overwhelmed but also excited about the new possibilities ahead.'
        ),
        (
            sample_memory_id,
            'Looking Back',
            'Now that some time has passed, I can see how this moment was a turning point in my life. The lessons learned here continue to guide me today.'
        );
        
        RAISE NOTICE 'Sample reflections inserted successfully';
    ELSE
        RAISE NOTICE 'No memories found - skipping sample reflection insertion';
    END IF;
END $$;
