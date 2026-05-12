-- Migración: Opita Projects Schema & RLS

-- 1. Tabla de Perfiles (Se alimenta automáticamente desde auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'owner')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de Proyectos (Propuestas, estados, presupuesto)
CREATE TYPE project_status AS ENUM ('draft', 'submitted', 'negotiating', 'approved', 'in_progress', 'review', 'delivered');

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  budget NUMERIC(10, 2) DEFAULT 0.00,
  status project_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de Mensajes (Chat del proyecto)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla de Entregables (Metadatos de Storage)
CREATE TABLE public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Ruta en el bucket de Storage
  file_size BIGINT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HABILITAR REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

-- Profiles: Los usuarios pueden leer su propio perfil, o si son owner leen todo.
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Owners can view all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Projects: Clientes ven los suyos, Owners ven todos.
CREATE POLICY "Clients can view their own projects"
ON public.projects FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Owners can view all projects"
ON public.projects FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
);

CREATE POLICY "Clients can insert projects"
ON public.projects FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their draft projects"
ON public.projects FOR UPDATE
USING (auth.uid() = client_id AND status = 'draft');

CREATE POLICY "Owners can update all projects"
ON public.projects FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Messages: Visibles si eres cliente o dueño del proyecto.
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = messages.project_id AND (p.client_id = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'owner'))
  )
);

CREATE POLICY "Participants can insert messages"
ON public.messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = messages.project_id AND (p.client_id = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'owner'))
  )
);

-- Deliverables: Visibles si eres cliente o dueño del proyecto.
CREATE POLICY "Participants can view deliverables"
ON public.deliverables FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = deliverables.project_id AND (p.client_id = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'owner'))
  )
);

-- -----------------------------------------------------------------------------
-- TRIGGERS (Automations)
-- -----------------------------------------------------------------------------

-- Trigger para crear profile al registrar usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'client');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
