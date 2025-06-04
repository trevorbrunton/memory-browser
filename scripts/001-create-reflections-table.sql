-- Create reflections table to store memory reflections
CREATE TABLE IF NOT EXISTS reflections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by memory_id
CREATE INDEX IF NOT EXISTS idx_reflections_memory_id ON reflections(memory_id);

-- Create index for searching by title
CREATE INDEX IF NOT EXISTS idx_reflections_title ON reflections(title);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_reflections_updated_at 
    BEFORE UPDATE ON reflections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see all reflections (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on reflections" ON reflections
    FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON reflections TO authenticated;
GRANT ALL ON reflections TO anon;
