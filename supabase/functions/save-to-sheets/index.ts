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

    const GOOGLE_SHEETS_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    const SPREADSHEET_ID = '1RAkUwMIBspZU9po1_pjPj_WWDFR2-blv2Zp5-DkAf_Q';
    const RANGE = 'Sheet1!A:C'; // Adjust range as needed

    if (!GOOGLE_SHEETS_API_KEY) {
      throw new Error('Google Sheets API key not configured');
    }

    // Prepare the data to append
    const values = [[name, email, timestamp]];

    // Make request to Google Sheets API
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}:append?valueInputOption=USER_ENTERED&key=${GOOGLE_SHEETS_API_KEY}`;
    
    const response = await fetch(sheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: values
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', errorText);
      throw new Error(`Google Sheets API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Successfully saved to Google Sheets:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email saved successfully',
        sheetsResponse: result 
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