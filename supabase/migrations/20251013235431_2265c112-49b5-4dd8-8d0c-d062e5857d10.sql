-- Create enum for course status
CREATE TYPE public.course_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- Create enum for course item status
CREATE TYPE public.course_item_status AS ENUM ('reserved', 'returned', 'outstocked', 'partial');

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name TEXT NOT NULL,
  description TEXT,
  course_date DATE NOT NULL,
  instructor TEXT,
  status course_status NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create course_items table to track items reserved for courses
CREATE TABLE public.course_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity_reserved INTEGER NOT NULL CHECK (quantity_reserved > 0),
  quantity_returned INTEGER NOT NULL DEFAULT 0 CHECK (quantity_returned >= 0),
  quantity_outstocked INTEGER NOT NULL DEFAULT 0 CHECK (quantity_outstocked >= 0),
  status course_item_status NOT NULL DEFAULT 'reserved',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_items ENABLE ROW LEVEL SECURITY;

-- Create policies for courses (public access for now - can be restricted later)
CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create courses"
  ON public.courses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update courses"
  ON public.courses FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete courses"
  ON public.courses FOR DELETE
  USING (true);

-- Create policies for course_items
CREATE POLICY "Anyone can view course items"
  ON public.course_items FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create course items"
  ON public.course_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update course items"
  ON public.course_items FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete course items"
  ON public.course_items FOR DELETE
  USING (true);

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_course_items_updated_at
  BEFORE UPDATE ON public.course_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();