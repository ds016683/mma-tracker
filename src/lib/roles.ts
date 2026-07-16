export type AppRole = 'ths_user' | 'mma_analytics' | 'mma_regional';

export const ROLE_LABELS: Record<AppRole, string> = {
  ths_user: 'Third Horizon',
  mma_analytics: 'MMA Actuarial & Analytics',
  mma_regional: 'MMA Regional',
};

export const ROLE_COLORS: Record<AppRole, string> = {
  ths_user: '#009DE0',
  mma_analytics: '#00AC41',
  mma_regional: '#FFBE00',
};

// What roles each role is allowed to invite
export const INVITE_PERMISSIONS: Record<AppRole, AppRole[]> = {
  ths_user: ['ths_user', 'mma_analytics', 'mma_regional'],
  mma_analytics: ['mma_analytics', 'mma_regional'],
  mma_regional: [],
};

export function canInvite(senderRole: AppRole): boolean {
  return INVITE_PERMISSIONS[senderRole].length > 0;
}

export function getInvitableRoles(senderRole: AppRole): AppRole[] {
  return INVITE_PERMISSIONS[senderRole];
}

// What sections each role can access
export const ROLE_ACCESS: Record<AppRole, 'full' | 'region_only'> = {
  ths_user: 'full',
  mma_analytics: 'full',
  mma_regional: 'region_only',
};

export function canUpload(role: AppRole): boolean {
  return role === 'ths_user';
}

export function canEdit(role: AppRole): boolean {
  return role === 'ths_user';
}
