-- Enums (using DO blocks for idempotency)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'driver');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'spot_status') THEN
        CREATE TYPE public.spot_status AS ENUM ('available', 'occupied', 'reserved');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE public.booking_status AS ENUM ('active', 'completed', 'cancelled');
    END IF;
END $$;

-- Parking Zones
CREATE TABLE IF NOT EXISTS public.parking_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  total_spots INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parking Spots
CREATE TABLE IF NOT EXISTS public.parking_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.parking_zones(id) ON DELETE CASCADE,
  spot_number TEXT NOT NULL,
  sensor_id TEXT UNIQUE,
  status spot_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  vehicle_plate TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.parking_spots(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status booking_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers (using DO to avoid existing trigger errors)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_parking_zones_updated_at') THEN
        CREATE TRIGGER update_parking_zones_updated_at BEFORE UPDATE ON public.parking_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_parking_spots_updated_at') THEN
        CREATE TRIGGER update_parking_spots_updated_at BEFORE UPDATE ON public.parking_spots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bookings_updated_at') THEN
        CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Role check function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile & role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'driver');
  RETURN NEW;
END;
$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- Trigger to update parking spot status when booking changes
CREATE OR REPLACE FUNCTION public.sync_spot_status_with_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.status = 'active') THEN
            UPDATE public.parking_spots SET status = 'reserved' WHERE id = NEW.spot_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status = 'active' AND (NEW.status = 'completed' OR NEW.status = 'cancelled')) THEN
            UPDATE public.parking_spots SET status = 'available' WHERE id = NEW.spot_id;
        ELSIF (OLD.status != 'active' AND NEW.status = 'active') THEN
            UPDATE public.parking_spots SET status = 'reserved' WHERE id = NEW.spot_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.status = 'active') THEN
            UPDATE public.parking_spots SET status = 'available' WHERE id = OLD.spot_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_sync_spot_status_on_booking') THEN
        CREATE TRIGGER tr_sync_spot_status_on_booking 
        AFTER INSERT OR UPDATE OR DELETE ON public.bookings 
        FOR EACH ROW EXECUTE FUNCTION public.sync_spot_status_with_booking();
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.parking_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: parking_zones
DROP POLICY IF EXISTS "Anyone can view zones" ON public.parking_zones;
CREATE POLICY "Anyone can view zones" ON public.parking_zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage zones" ON public.parking_zones;
CREATE POLICY "Admins can manage zones" ON public.parking_zones FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies: parking_spots
DROP POLICY IF EXISTS "Anyone can view spots" ON public.parking_spots;
CREATE POLICY "Anyone can view spots" ON public.parking_spots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage spots" ON public.parking_spots;
CREATE POLICY "Admins can manage spots" ON public.parking_spots FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies: bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can cancel their own bookings" ON public.bookings;
CREATE POLICY "Users can cancel their own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT USING (has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
CREATE POLICY "Admins can manage all bookings" ON public.bookings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies: profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies: user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for parking_spots
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'parking_spots') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_spots;
    END IF;
END $$;

-- Seed default data: 1 Zone and 3 Spots (0 reserved, 0 filled by default)
DO $$ 
DECLARE 
    zone_id_var UUID;
BEGIN
    -- Create a default zone if none exists
    IF NOT EXISTS (SELECT 1 FROM public.parking_zones LIMIT 1) THEN
        INSERT INTO public.parking_zones (name, description, location, total_spots)
        VALUES ('Main Entrance Zone', 'Primary parking area near the main entrance', 'North Wing', 3)
        RETURNING id INTO zone_id_var;

        -- Create 3 default spots
        INSERT INTO public.parking_spots (zone_id, spot_number, status, sensor_id)
        VALUES 
            (zone_id_var, 'A-101', 'available', 'SENSOR_A101'),
            (zone_id_var, 'A-102', 'available', 'SENSOR_A102'),
            (zone_id_var, 'A-103', 'available', 'SENSOR_A103');
    END IF;
END $$;
