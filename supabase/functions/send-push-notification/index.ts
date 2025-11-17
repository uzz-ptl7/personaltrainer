import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
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
    console.log('Sending push notification to user:', user_id);

    if (!user_id || !title || !message) {
      throw new Error('Missing required fields: user_id, title, message');
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user_id);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user');
      return new Response(JSON.stringify({
        success: false,
        message: 'No push subscriptions found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@example.com';

    // Send push notification to all user's subscriptions
    const results = await Promise.all(
      subscriptions.map(async ({ subscription }) => {
        try {
          const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '86400',
              'Authorization': `vapid t=${generateVapidAuthToken(subscription.endpoint, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!, VAPID_SUBJECT)}, k=${VAPID_PUBLIC_KEY}`,
            },
            body: JSON.stringify({
              title,
              body: message,
              icon: '/ssf-logo.jpg',
              badge: '/ssf-logo.jpg',
              type,
            }),
          });

          return { success: response.ok, status: response.status };
        } catch (error) {
          console.error('Error sending push:', error);
          return { success: false, error: String(error) };
        }
      })
    );

    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to send push notification'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to generate VAPID auth token
function generateVapidAuthToken(endpoint: string, publicKey: string, privateKey: string, subject: string) {
  // This is a simplified version - you would need to implement proper JWT signing
  // Consider using a library like https://deno.land/x/djwt for production
  return 'placeholder-token';
}
