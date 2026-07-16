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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { token, display_name, password } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'token required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Fetch invitation
    const { data: invitation, error: fetchErr } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!invitation) {
      return new Response(JSON.stringify({ error: 'Invitation not found or already used.' }), {
        status: 404, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Check expiry
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase.from('invitations').update({ status: 'expired' }).eq('id', invitation.id);
      return new Response(JSON.stringify({ error: 'This invitation has expired.' }), {
        status: 410, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // GET request = just return invitation metadata for the confirm page
    if (req.method === 'GET' || !password) {
      return new Response(JSON.stringify({
        email: invitation.invited_email,
        role: invitation.invited_role,
        expires_at: invitation.expires_at,
      }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // POST with password = create the account
    const { data: authUser, error: createErr } = await supabase.auth.admin.createUser({
      email: invitation.invited_email,
      password,
      email_confirm: true,
      user_metadata: { display_name: display_name ?? invitation.invited_email },
    });

    if (createErr) throw createErr;

    await supabase.from('user_profiles').insert({
      id: authUser.user.id,
      role: invitation.invited_role,
      display_name: display_name ?? invitation.invited_email,
      email: invitation.invited_email,
      approved_at: new Date().toISOString(),
    });

    await supabase.from('invitations').update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    }).eq('id', invitation.id);

    return new Response(JSON.stringify({ success: true, email: invitation.invited_email }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
