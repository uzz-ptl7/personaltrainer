import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailData {
  name: string;
  email: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, timestamp }: EmailData = await req.json();
    
    console.log('Saving email to sheets:', { name, email, timestamp });

    // For now, we'll save to Supabase instead of Google Sheets 
    // since Google Sheets API requires OAuth2 for append operations
    const { supabase } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    const supabaseClient = supabase(supabaseUrl, supabaseKey);
    
    // Save to a newsletter_subscribers table instead
    const { error: dbError } = await supabaseClient
      .from('newsletter_subscribers')
      .insert({ 
        name, 
        email, 
        subscribed_at: timestamp 
      });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('Successfully saved to database:', { name, email, timestamp });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email subscription saved successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in save-to-sheets function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to save email' 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);