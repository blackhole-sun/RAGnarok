-- ============================================================
-- Module 1: Initial Schema
-- ============================================================

-- ============================================================
-- Utility: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- profiles
-- One row per auth user. Auto-created via trigger on signup.
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- threads
-- Chat threads per user.
-- NOTE: last_response_id is Module 1 specific (Responses API).
-- Dropped in Module 2 via migration.
-- ============================================================
CREATE TABLE public.threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    last_response_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX threads_user_id_idx ON public.threads(user_id);
CREATE INDEX threads_updated_at_idx ON public.threads(updated_at DESC);

CREATE TRIGGER update_threads_updated_at
    BEFORE UPDATE ON public.threads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own threads"
    ON public.threads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own threads"
    ON public.threads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own threads"
    ON public.threads FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own threads"
    ON public.threads FOR DELETE
    USING (auth.uid() = user_id);


-- ============================================================
-- messages
-- All chat messages (user + assistant) across all threads.
-- ============================================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_thread_id_idx ON public.messages(thread_id);
CREATE INDEX messages_thread_created_idx ON public.messages(thread_id, created_at ASC);
CREATE INDEX messages_user_id_idx ON public.messages(user_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
    ON public.messages FOR DELETE
    USING (auth.uid() = user_id);


-- ============================================================
-- uploaded_files
-- Tracks files uploaded to OpenAI vector store.
-- ============================================================
CREATE TABLE public.uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    openai_file_id TEXT,
    vector_store_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX uploaded_files_user_id_idx ON public.uploaded_files(user_id);

CREATE TRIGGER update_uploaded_files_updated_at
    BEFORE UPDATE ON public.uploaded_files
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files"
    ON public.uploaded_files FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
    ON public.uploaded_files FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
    ON public.uploaded_files FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
    ON public.uploaded_files FOR DELETE
    USING (auth.uid() = user_id);
