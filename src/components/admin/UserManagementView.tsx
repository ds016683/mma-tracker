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

type Tab = 'users' | 'requests' | 'invitations';

const ROLE_ORDER: AppRole[] = ['ths_user', 'mma_analytics', 'mma_regional'];

function RoleBadge({ role }: { role: AppRole }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${ROLE_COLORS[role]}22`, color: ROLE_COLORS[role] }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    approved: 'text-green-600 bg-green-50 border-green-200',
    accepted: 'text-green-600 bg-green-50 border-green-200',
    rejected: 'text-red-500 bg-red-50 border-red-200',
    expired: 'text-gray-400 bg-gray-50 border-gray-200',
  };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] ?? 'text-gray-500 bg-gray-50 border-gray-200'}`}>
      {status}
    </span>
  );
}

export function UserManagementView() {
  const { role: myRole, session } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('mma_regional');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const isThsUser = myRole === 'ths_user';
  const invitableRoles = myRole ? getInvitableRoles(myRole) : [];

  useEffect(() => { loadData(); }, [tab]);

  async function loadData() {
    setLoading(true);
    if (tab === 'users') {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .order('role')
        .order('display_name');
      setUsers((data ?? []) as UserProfile[]);
    } else if (tab === 'requests' && isThsUser) {
      const { data } = await supabase
        .from('account_requests')
        .select('*')
        .order('created_at', { ascending: false });
      setRequests((data ?? []) as AccountRequest[]);
    } else if (tab === 'invitations') {
      const { data } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });
      setInvitations((data ?? []) as Invitation[]);
    }
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMsg(null);
    const { data, error } = await supabase.functions.invoke('send-invitation', {
      body: { invited_email: inviteEmail, invited_role: inviteRole },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (error || data?.error) {
      setInviteMsg({ ok: false, text: data?.error ?? error?.message ?? 'Failed to send invite.' });
    } else {
      setInviteMsg({ ok: true, text: `Invitation sent to ${inviteEmail}` });
      setInviteEmail('');
      if (tab === 'invitations') loadData();
    }
    setInviteLoading(false);
  }

  async function handleApproveRequest(token: string, action: 'approve' | 'reject') {
    await supabase.functions.invoke('approve-account-request', {
      body: { token, action },
    });
    loadData();
  }

  // Group users by role for display
  const groupedUsers = ROLE_ORDER.map(role => ({
    role,
    users: users.filter(u => u.role === role),
  })).filter(g => g.users.length > 0);

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#001A41]">User Management</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {users.length} active user{users.length !== 1 ? 's' : ''} across {groupedUsers.length} role{groupedUsers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Invite form — always visible for authorized roles */}
      {myRole && canInvite(myRole) && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-[#001A41]">Send Invitation</h2>
          <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500">Email address</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@marshmma.com"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-[#009DE0] focus:outline-none focus:ring-1 focus:ring-[#009DE0]/30"
              />
            </div>
            <div className="w-full sm:w-56">
              <label className="mb-1 block text-xs font-medium text-gray-500">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as AppRole)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-[#009DE0] focus:outline-none"
              >
                {invitableRoles.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={inviteLoading}
              className="rounded-lg bg-[#009DE0] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#007ab8] disabled:opacity-50 whitespace-nowrap"
            >
              {inviteLoading ? 'Sending…' : 'Send Invite'}
            </button>
          </form>
          {inviteMsg && (
            <p className={`mt-3 text-xs font-medium ${inviteMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
              {inviteMsg.text}
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {(['users', ...(isThsUser ? ['requests'] : []), 'invitations'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-[#009DE0] text-[#009DE0]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t === 'users' ? 'Active Users' : t === 'requests' ? 'Account Requests' : 'Invitations'}
            {t === 'requests' && pendingRequests.length > 0 && (
              <span className="ml-1.5 rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-400">Loading…</div>
      ) : (
        <>
          {/* ── Active Users ── */}
          {tab === 'users' && (
            <div className="space-y-4">
              {groupedUsers.map(group => (
                <div key={group.role} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  {/* Group header */}
                  <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3"
                    style={{ backgroundColor: `${ROLE_COLORS[group.role]}0d` }}>
                    <RoleBadge role={group.role} />
                    <span className="text-xs text-gray-400">{group.users.length} user{group.users.length !== 1 ? 's' : ''}</span>
                  </div>
                  {/* Users */}
                  <div className="divide-y divide-gray-50">
                    {group.users.map(u => (
                      <div key={u.id} className="flex items-center gap-4 px-5 py-3">
                        {/* Avatar */}
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: ROLE_COLORS[u.role] }}>
                          {(u.display_name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-800">{u.display_name || '—'}</p>
                          <p className="truncate text-xs text-gray-400">{u.email}</p>
                        </div>
                        <span className="flex-shrink-0 text-xs text-gray-300">
                          {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Account Requests ── */}
          {tab === 'requests' && isThsUser && (
            <div className="space-y-3">
              {requests.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-12 text-sm text-gray-400">
                  No account requests yet
                </div>
              ) : requests.map(r => (
                <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-800">{r.display_name}</p>
                        <RoleBadge role={r.requested_role} />
                        <StatusPill status={r.status} />
                      </div>
                      <p className="text-xs text-gray-400">{r.email}</p>
                      {r.message && <p className="mt-2 text-xs text-gray-500 italic">"{r.message}"</p>}
                      <p className="mt-1 text-xs text-gray-300">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    {r.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApproveRequest(r.approval_token, 'approve')}
                          className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveRequest(r.approval_token, 'reject')}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Invitations ── */}
          {tab === 'invitations' && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {invitations.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                  No invitations sent yet
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Sent</th>
                      <th className="px-5 py-3">Expires</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invitations.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-50/60">
                        <td className="px-5 py-3 text-gray-700">{inv.invited_email}</td>
                        <td className="px-5 py-3"><RoleBadge role={inv.invited_role} /></td>
                        <td className="px-5 py-3"><StatusPill status={inv.status} /></td>
                        <td className="px-5 py-3 text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-xs text-gray-400">{new Date(inv.expires_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
