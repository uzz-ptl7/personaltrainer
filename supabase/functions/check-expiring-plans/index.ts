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

    // Calculate the date 7 days from now
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Get all active purchases that expire in 7 days
    const { data: expiringPurchases, error: purchasesError } = await supabaseClient
      .from('purchases')
      .select(`
        id,
        user_id,
        expires_at,
        service:services(title, type)
      `)
      .eq('is_active', true)
      .not('expires_at', 'is', null)
      .lte('expires_at', sevenDaysFromNow.toISOString())
      .gte('expires_at', new Date().toISOString());

    if (purchasesError) throw purchasesError;

    console.log(`Found ${expiringPurchases?.length || 0} expiring purchases`);

    // Send notifications for each expiring purchase
    const notificationPromises = (expiringPurchases || []).map(async (purchase) => {
      const expiryDate = new Date(purchase.expires_at!);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      // Check if we've already sent a notification for this purchase
      const { data: existingNotification } = await supabaseClient
        .from('notifications')
        .select('id')
        .eq('user_id', purchase.user_id)
        .ilike('message', `%${purchase.service.title}%`)
        .ilike('message', '%expiring%')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .single();

      // If notification already sent recently, skip
      if (existingNotification) {
        console.log(`Notification already sent for purchase ${purchase.id}`);
        return null;
      }

      const { error } = await supabaseClient
        .from('notifications')
        .insert({
          user_id: purchase.user_id,
          title: 'Plan Expiring Soon',
          message: `Your ${purchase.service.title} plan is expiring in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}. Renew now to continue your fitness journey!`,
          type: 'warning'
        });

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      return purchase.id;
    });

    const results = await Promise.all(notificationPromises);
    const sentCount = results.filter(r => r !== null).length;

    console.log(`Sent ${sentCount} expiry notifications`);

    return new Response(JSON.stringify({
      success: true,
      checked: expiringPurchases?.length || 0,
      sent: sentCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-expiring-plans function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to check expiring plans'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
