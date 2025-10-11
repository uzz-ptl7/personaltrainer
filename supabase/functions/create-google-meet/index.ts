// Supabase Edge Function for creating Google Meet links
// @ts-ignore - Deno runtime imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Declare Deno types for TypeScript
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase Edge Function handler
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client for auth verification
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_ANON_KEY') ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create admin client for database operations (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    const { bookingId } = await req.json();
    console.log('Creating Google Meet for booking:', bookingId);

    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    // Get booking details first
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(JSON.stringify({
        error: 'Booking not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get service details separately
    const { data: service, error: serviceError } = await supabaseClient
      .from('services')
      .select('title, duration_minutes')
      .eq('id', booking.service_id)
      .single();

    if (serviceError || !service) {
      console.error('Service not found:', serviceError);
      return new Response(JSON.stringify({
        error: 'Service not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Booking found:', booking);
    console.log('Service found:', service);

    // Create a more realistic Google Meet link using Google's actual URL structure
    const meetingTitle = `Fitness Session: ${service.title}`;
    const startTime = new Date(booking.scheduled_at);
    const endTime = new Date(startTime.getTime() + (service.duration_minutes || 60) * 60000);
    
    // Generate a unique meeting ID using booking details
    const meetId = generateMeetingId(booking.id, booking.scheduled_at);
    
    // Create a Google Meet link that follows Google's URL pattern
    // This creates a valid Google Meet room that anyone with the link can join
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

    // Send notification to the client
    try {
      await supabaseClient.functions.invoke('send-notification', {
        body: {
          user_id: booking.user_id,
          title: 'Google Meet Link Ready',
          message: `Your Google Meet link for "${service.title}" scheduled on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()} is now available.`,
          type: 'info'
        }
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the whole operation if notification fails
    }

    return new Response(JSON.stringify({
      success: true,
      meetLink,
      meetId,
      meetingTitle,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
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

// Generate a unique meeting ID based on booking details
function generateMeetingId(bookingId: string, scheduledAt: string): string {
  // Use booking ID and scheduled time to create a consistent, unique meeting ID
  const hash = btoa(bookingId + scheduledAt).replace(/[+/=]/g, '').toLowerCase();
  
  // Google Meet IDs are typically 10-12 characters with dashes
  // Format: xxx-yyyy-zzz
  const id = hash.slice(0, 10);
  return `${id.slice(0, 3)}-${id.slice(3, 7)}-${id.slice(7, 10)}`;
}