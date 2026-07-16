import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS, ROLE_COLORS, getInvitableRoles, canInvite } from '../../lib/roles';
import type { AppRole } from '../../lib/roles';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: AppRole;
  created_at: string;
  approved_at: string | null;
}

interface AccountRequest {
  id: string;
  email: string;
  display_name: string;
  requested_role: AppRole;
  message: string;
  status: string;
  created_at: string;
  approval_token: string;
}

interface Invitation {
  id: string;
  invited_email: string;
  invited_role: AppRole;
  status: string;
  created_at: string;
  expires_at: string;
}

export function UserManagementView() {
  const { role: myRole, session } = useAuth();
  type Tab = 'users' | 'requests' | 'invitations';
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'mma_regional' as AppRole });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const isThsUser = myRole === 'ths_user';

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    if (tab === 'users') {
      const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
      setUsers(data ?? []);
    } else if (tab === 'requests' && isThsUser) {
      const { data } = await supabase.from('account_requests').select('*').order('created_at', { ascending: false });
      setRequests(data ?? []);
    } else if (tab === 'invitations') {
      const { data } = await supabase.from('invitations').select('*').order('created_at', { ascending: false });
      setInvitations(data ?? []);
    }
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMsg(null);
    const { data, error } = await supabase.functions.invoke('send-invitation', {
      body: { invited_email: inviteForm.email, invited_role: inviteForm.role },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (error || data?.error) {
      setInviteMsg({ ok: false, text: data?.error ?? error?.message ?? 'Failed to send invite.' });
    } else {
      setInviteMsg({ ok: true, text: `Invitation sent to ${inviteForm.email}` });
      setInviteForm(f => ({ ...f, email: '' }));
      loadData();
    }
    setInviteLoading(false);
  }

  async function handleApproveRequest(token: string, action: 'approve' | 'reject') {
    const { data, error } = await supabase.functions.invoke('approve-account-request', {
      body: { token, action },
    });
    if (!error && !data?.error) loadData();
  }

  const invitableRoles = myRole ? getInvitableRoles(myRole) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-1">User Management</h1>
      <p className="text-sm text-white/40 mb-6">Manage access to the MMA Master Tracker</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        {(['users', ...(isThsUser ? ['requests' as Tab] : []), 'invitations'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-[#009DE0] text-[#009DE0]'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            {t === 'requests' ? 'Account Requests' : t === 'invitations' ? 'Invitations' : 'Active Users'}
          </button>
        ))}
      </div>

      {/* Active Users */}
      {tab === 'users' && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-white/40">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-white/30 text-xs">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-white/30 text-xs">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-white font-medium">{u.display_name || '—'}</td>
                  <td className="px-4 py-3 text-white/60">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: `${ROLE_COLORS[u.role]}20`, color: ROLE_COLORS[u.role] }}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Account Requests (THS only) */}
      {tab === 'requests' && isThsUser && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-white/40">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Requested Role</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-white/30 text-xs">Loading…</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-white/30 text-xs">No requests</td></tr>
              ) : requests.map(r => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-white font-medium">{r.display_name}</td>
                  <td className="px-4 py-3 text-white/60">{r.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: `${ROLE_COLORS[r.requested_role]}20`, color: ROLE_COLORS[r.requested_role] }}>
                      {ROLE_LABELS[r.requested_role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs max-w-[200px] truncate">{r.message || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${
                      r.status === 'pending' ? 'text-yellow-400' :
                      r.status === 'approved' ? 'text-green-400' : 'text-red-400'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(r.approval_token, 'approve')}
                          className="rounded px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        >Approve</button>
                        <button
                          onClick={() => handleApproveRequest(r.approval_token, 'reject')}
                          className="rounded px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invitations */}
      {tab === 'invitations' && (
        <div className="space-y-6">
          {/* Send invite form */}
          {canInvite(myRole!) && (
            <div className="rounded-xl border border-white/10 bg-[#16232f] p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Send Invitation</h2>
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-white/50">Email</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="colleague@marshmma.com"
                    className="w-full rounded-lg border border-white/10 bg-[#0d1a26] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#009DE0] focus:outline-none"
                  />
                </div>
                <div className="w-52">
                  <label className="mb-1 block text-xs font-medium text-white/50">Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={e => setInviteForm(f => ({ ...f, role: e.target.value as AppRole }))}
                    className="w-full rounded-lg border border-white/10 bg-[#0d1a26] px-3 py-2 text-sm text-white focus:border-[#009DE0] focus:outline-none"
                  >
                    {invitableRoles.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="rounded-lg bg-[#009DE0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007ab8] disabled:opacity-50 whitespace-nowrap"
                >
                  {inviteLoading ? 'Sending…' : 'Send Invite'}
                </button>
              </form>
              {inviteMsg && (
                <p className={`mt-3 text-xs ${inviteMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{inviteMsg.text}</p>
              )}
            </div>
          )}

          {/* Invitations table */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/40">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Sent</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-white/30 text-xs">Loading…</td></tr>
                ) : invitations.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-white/30 text-xs">No invitations yet</td></tr>
                ) : invitations.map(inv => (
                  <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 text-white/70">{inv.invited_email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: `${ROLE_COLORS[inv.invited_role]}20`, color: ROLE_COLORS[inv.invited_role] }}>
                        {ROLE_LABELS[inv.invited_role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        inv.status === 'pending' ? 'text-yellow-400' :
                        inv.status === 'accepted' ? 'text-green-400' : 'text-white/30'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{new Date(inv.expires_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
