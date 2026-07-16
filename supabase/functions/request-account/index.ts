import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APPROVER_EMAILS = ['alex.meyer@marshmma.com', 'tanner@thirdhorizon.com'];
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://ds016683.github.io/mma-tracker';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { email, display_name, requested_role, message } = await req.json();

    if (!email || !display_name) {
      return new Response(JSON.stringify({ error: 'email and display_name required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Validate role — public requests can only ask for mma_regional or mma_analytics
    const allowedRoles = ['mma_regional', 'mma_analytics'];
    const role = allowedRoles.includes(requested_role) ? requested_role : 'mma_regional';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for duplicate pending request
    const { data: existing } = await supabase
      .from('account_requests')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'A pending request already exists for this email.' }), {
        status: 409, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { data: request, error } = await supabase
      .from('account_requests')
      .insert({
        email: email.toLowerCase(),
        display_name,
        requested_role: role,
        message: message ?? '',
      })
      .select()
      .single();

    if (error) throw error;

    const approveUrl = `${SITE_URL}/approve-request?token=${request.approval_token}&action=approve`;
    const rejectUrl  = `${SITE_URL}/approve-request?token=${request.approval_token}&action=reject`;

    const roleLabel: Record<string, string> = {
      mma_regional: 'MMA Regional',
      mma_analytics: 'MMA Actuarial & Analytics',
    };

    // Send approval emails
    await Promise.all(APPROVER_EMAILS.map(to =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'MMA Tracker <noreply@thirdhorizon.com>',
          to,
          subject: `Account Request: ${display_name} (${roleLabel[role]})`,
          html: `
            <p>A new account request has been submitted for the MMA Master Tracker.</p>
            <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
              <tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td><strong>${display_name}</strong></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td>${email}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666">Requested Role</td><td>${roleLabel[role]}</td></tr>
              ${message ? `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">Message</td><td>${message}</td></tr>` : ''}
            </table>
            <p style="margin-top:24px">
              <a href="${approveUrl}" style="background:#009DE0;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;margin-right:12px">✅ Approve</a>
              <a href="${rejectUrl}" style="background:#EF4E45;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">❌ Reject</a>
            </p>
            <p style="color:#999;font-size:12px">Clicking Approve or Reject will take you to the MMA Tracker to confirm.</p>
          `,
        }),
      })
    ));

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
