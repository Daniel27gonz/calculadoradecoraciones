-- Create table for user materials with prices
CREATE TABLE public.user_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, name)
);

-- Enable Row Level Security
ALTER TABLE public.user_materials ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own materials" 
ON public.user_materials 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own materials" 
ON public.user_materials 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials" 
ON public.user_materials 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials" 
ON public.user_materials 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_materials_updated_at
BEFORE UPDATE ON public.user_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();