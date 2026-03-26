-- Run this in Supabase SQL editor to set up the vector store
-- Enable the pgvector extension
create extension if not exists vector;

-- Create documents table
create table documents (
  id bigserial primary key,
  content text not null,
  embedding vector(1536), -- matches text-embedding-3-small dimensions
  created_at timestamp with time zone default now()
);

-- Create similarity search function
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- Index for fast similarity search
create index on documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
