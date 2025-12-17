-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ad_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid,
  title text NOT NULL,
  image_url text NOT NULL,
  status text CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'ended'::text])),
  budget double precision,
  spent double precision DEFAULT 0,
  views integer DEFAULT 0,
  clicks integer DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ad_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT ad_campaigns_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text,
  difficulty text,
  xp_reward integer DEFAULT 50,
  content jsonb,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.jobs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id uuid,
  collector_id uuid,
  status USER-DEFINED DEFAULT 'pending'::job_status,
  waste_type text,
  address text,
  location_lat double precision,
  location_lng double precision,
  scheduled_time timestamp with time zone,
  is_urgent boolean DEFAULT false,
  qr_code text,
  proof_image_url text,
  ai_validation_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT jobs_collector_id_fkey FOREIGN KEY (collector_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.marketplace_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category USER-DEFINED DEFAULT 'other'::item_category,
  weight double precision,
  price double precision NOT NULL,
  image_url text,
  status USER-DEFINED DEFAULT 'available'::marketplace_status,
  buyer_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT marketplace_items_pkey PRIMARY KEY (id),
  CONSTRAINT marketplace_items_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id),
  CONSTRAINT marketplace_items_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  target_role USER-DEFINED,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info'::text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  contact_email text,
  logo_url text,
  total_budget double precision DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partners_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  first_name text,
  last_name text,
  email text,
  phone text,
  role USER-DEFINED DEFAULT 'citizen'::user_role,
  address text,
  points integer DEFAULT 0,
  badges integer DEFAULT 0,
  collections_count integer DEFAULT 0,
  subscription_plan USER-DEFINED DEFAULT 'standard'::sub_plan,
  company_name text,
  sector text,
  zone text,
  vehicle_type text,
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.system_settings (
  id integer NOT NULL DEFAULT 1,
  maintenance_mode boolean DEFAULT false,
  app_version text DEFAULT '1.0.0'::text,
  exchange_rate integer DEFAULT 2800,
  marketplace_commission numeric DEFAULT 0.05,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_course_progress (
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  progress integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  notes text,
  last_accessed timestamp with time zone DEFAULT now(),
  CONSTRAINT user_course_progress_pkey PRIMARY KEY (user_id, course_id),
  CONSTRAINT user_course_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_course_progress_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.user_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  content jsonb DEFAULT '{}'::jsonb,
  visibility text DEFAULT 'private'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_documents_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plate_number text UNIQUE,
  type text NOT NULL,
  status USER-DEFINED DEFAULT 'active'::vehicle_status,
  lat double precision,
  lng double precision,
  heading double precision DEFAULT 0,
  battery_level integer DEFAULT 100,
  signal_strength integer DEFAULT 100,
  driver_id uuid,
  last_update timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicles_pkey PRIMARY KEY (id),
  CONSTRAINT vehicles_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.profiles(id)
);
