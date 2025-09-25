import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, title, message, type = 'info' } = await req.json();
    console.log('Sending notification to user:', user_id);

    if (!user_id || !title || !message) {
      throw new Error('Missing required fields: user_id, title, message');
    }

    // Insert notification
    const { data, error } = await supabaseClient
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting notification:', error);
      throw error;
    }

    console.log('Notification sent successfully:', data);

    return new Response(JSON.stringify({
      success: true,
      notification: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-notification function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to send notification'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});