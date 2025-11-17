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

    const { user_email, service_title, amount, payment_method } = await req.json();
    console.log('Notifying admins about purchase:', { user_email, service_title });

    if (!user_email || !service_title || !amount || !payment_method) {
      throw new Error('Missing required fields');
    }

    // Get all admin users (using service role which bypasses RLS)
    const { data: adminProfiles, error: adminError } = await supabaseClient
      .from('profiles')
      .select('user_id, email')
      .eq('is_admin', true);

    if (adminError) {
      console.error('Error fetching admin profiles:', adminError);
      throw adminError;
    }

    console.log('Found admin profiles:', adminProfiles);

    if (!adminProfiles || adminProfiles.length === 0) {
      console.warn('No admin profiles found');
      return new Response(JSON.stringify({
        success: false,
        message: 'No admin profiles found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send notification to each admin
    const notifications = await Promise.all(
      adminProfiles.map(async (admin) => {
        const { data, error } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: admin.user_id,
            title: 'New Pending Purchase',
            message: `${user_email} created a pending purchase for ${service_title} (amount: $${amount}). Payment method: ${payment_method}.`,
            type: 'info'
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating notification for admin:', admin.email, error);
          return { admin: admin.email, success: false, error };
        }

        console.log('Notification created for admin:', admin.email);
        return { admin: admin.email, success: true, data };
      })
    );

    return new Response(JSON.stringify({
      success: true,
      notifications
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in notify-admins-purchase function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to notify admins'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
