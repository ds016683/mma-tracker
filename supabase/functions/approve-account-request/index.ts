import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://ds016683.github.io/mma-tracker';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { token, action, reviewer_email } = await req.json();

    if (!token || !action || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'token and action (approve|reject) required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: request, error: fetchErr } = await supabase
      .from('account_requests')
      .select('*')
      .eq('approval_token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!request) {
      return new Response(JSON.stringify({ error: 'Request not found or already reviewed.' }), {
        status: 404, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reject') {
      await supabase.from('account_requests').update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer_email ?? 'unknown',
      }).eq('id', request.id);

      // Notify requester
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'MMA Tracker <noreply@thirdhorizon.com>',
          to: request.email,
          subject: 'MMA Tracker — Account Request Update',
          html: `<p>Hi ${request.display_name},</p><p>Your request to access the MMA Master Tracker has not been approved at this time. If you believe this is an error, please reach out to your MMA contact.</p>`,
        }),
      });

      return new Response(JSON.stringify({ success: true, action: 'rejected' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // APPROVE: create Supabase auth user
    const tempPassword = crypto.randomUUID();
    const { data: authUser, error: createErr } = await supabase.auth.admin.createUser({
      email: request.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { display_name: request.display_name },
    });

    if (createErr) throw createErr;

    // Insert user_profile with role
    await supabase.from('user_profiles').insert({
      id: authUser.user.id,
      role: request.requested_role,
      display_name: request.display_name,
      email: request.email,
      approved_at: new Date().toISOString(),
    });

    // Mark request approved
    await supabase.from('account_requests').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewer_email ?? 'unknown',
    }).eq('id', request.id);

    // Send password reset so user sets their own password
    await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: request.email,
    });

    const { data: resetLink } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: request.email,
    });

    const roleLabel: Record<string, string> = {
      ths_user: 'Third Horizon',
      mma_regional: 'MMA Regional',
      mma_analytics: 'MMA Actuarial & Analytics',
    };

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'MMA Tracker <noreply@thirdhorizon.com>',
        to: request.email,
        subject: 'Your MMA Tracker account is ready',
        html: `
          <p>Hi ${request.display_name},</p>
          <p>Your account has been approved with <strong>${roleLabel[request.requested_role]}</strong> access.</p>
          <p>
            <a href="${resetLink?.properties?.action_link}" style="background:#009DE0;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">
              Set Your Password & Sign In
            </a>
          </p>
          <p style="color:#999;font-size:12px">This link expires in 24 hours. After setting your password, you can sign in at <a href="${SITE_URL}">${SITE_URL}</a>.</p>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: true, action: 'approved', email: request.email }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
