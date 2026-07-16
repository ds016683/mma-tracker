import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://ds016683.github.io/mma-tracker';

// Role hierarchy: what each role is allowed to invite
const INVITE_PERMISSIONS: Record<string, string[]> = {
  ths_user: ['ths_user', 'mma_analytics', 'mma_regional'],
  mma_analytics: ['mma_analytics', 'mma_regional'],
  mma_regional: [], // cannot invite
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Get sender's role
    const { data: senderProfile } = await supabase
      .from('user_profiles')
      .select('role, display_name')
      .eq('id', user.id)
      .single();

    if (!senderProfile) {
      return new Response(JSON.stringify({ error: 'Sender profile not found' }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { invited_email, invited_role } = await req.json();

    if (!invited_email || !invited_role) {
      return new Response(JSON.stringify({ error: 'invited_email and invited_role required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Enforce role cap
    const allowed = INVITE_PERMISSIONS[senderProfile.role] ?? [];
    if (!allowed.includes(invited_role)) {
      return new Response(JSON.stringify({ error: `Your role (${senderProfile.role}) cannot invite ${invited_role} users.` }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Check for existing pending invitation
    const { data: existing } = await supabase
      .from('invitations')
      .select('id')
      .eq('invited_email', invited_email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'A pending invitation already exists for this email.' }), {
        status: 409, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { data: invitation, error: insertErr } = await supabase
      .from('invitations')
      .insert({
        invited_email: invited_email.toLowerCase(),
        invited_role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    const acceptUrl = `${SITE_URL}/accept-invitation?token=${invitation.token}`;

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
        to: invited_email,
        subject: `You've been invited to the MMA Master Tracker`,
        html: `
          <p>Hi,</p>
          <p><strong>${senderProfile.display_name}</strong> has invited you to access the MMA Master Tracker with <strong>${roleLabel[invited_role]}</strong> access.</p>
          <p>
            <a href="${acceptUrl}" style="background:#009DE0;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">
              Accept Invitation & Create Account
            </a>
          </p>
          <p style="color:#999;font-size:12px">This invitation expires in 7 days.</p>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: true, invitation_id: invitation.id }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
