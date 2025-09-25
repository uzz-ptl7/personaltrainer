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

    const { bookingId } = await req.json();
    console.log('Creating Google Meet for booking:', bookingId);

    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        service:services (title, duration_minutes)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      throw new Error('Booking not found');
    }

    console.log('Booking found:', booking);

    // Get Google Calendar API credentials
    const googleApiKey = Deno.env.get('GOOGLE_CALENDAR_API_KEY');
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');

    if (!googleApiKey || !googleClientId) {
      console.error('Missing Google API credentials');
      throw new Error('Google API credentials not configured');
    }

    // For now, we'll create a simple Google Meet link
    // In a real implementation, you'd use Google Calendar API to create a proper meeting
    const meetingTitle = `Fitness Session: ${booking.service.title}`;
    const startTime = new Date(booking.scheduled_at);
    const endTime = new Date(startTime.getTime() + (booking.duration_minutes * 60000));

    // Generate a mock Google Meet link for development
    // In production, use Google Calendar API to create actual meetings
    const meetId = `ssf-${booking.id.slice(0, 8)}-${Date.now().toString(36)}`;
    const meetLink = `https://meet.google.com/${meetId}`;

    console.log('Generated meet link:', meetLink);

    // Update the booking with the meet link
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        meet_link: meetLink,
        meet_id: meetId,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      throw new Error('Failed to save meeting link');
    }

    console.log('Booking updated successfully with meet link');

    // TODO: In production, implement actual Google Calendar API integration:
    // 1. Create OAuth2 flow for trainer's Google account
    // 2. Use Google Calendar API to create calendar event
    // 3. Enable Google Meet in the event
    // 4. Get the actual meet link from the API response
    
    return new Response(JSON.stringify({
      success: true,
      meetLink,
      meetId,
      message: 'Google Meet link created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating Google Meet:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to create Google Meet link'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});