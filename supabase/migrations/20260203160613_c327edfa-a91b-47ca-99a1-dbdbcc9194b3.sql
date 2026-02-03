-- Create reusable_materials table for tracking bases, structures, tools, furniture
CREATE TABLE public.reusable_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  material_cost NUMERIC NOT NULL DEFAULT 0,
  cost_per_use NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reusable_materials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reusable materials"
ON public.reusable_materials
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reusable materials"
ON public.reusable_materials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reusable materials"
ON public.reusable_materials
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reusable materials"
ON public.reusable_materials
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reusable_materials_updated_at
BEFORE UPDATE ON public.reusable_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();