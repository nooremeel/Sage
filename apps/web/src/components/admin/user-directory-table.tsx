'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Search, Shield, User, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { AuthUserDto, UserRole } from '@sage/shared';

interface UserDirectoryTableProps {
  users: AuthUserDto[];
  onRoleChange: (userId: string, newRole: UserRole) => Promise<void>;
}

export function UserDirectoryTable({
  users,
  onRoleChange,
}: UserDirectoryTableProps) {
  const tAdmin = useTranslations('admin');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<'all' | UserRole>('all');
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleSelectRole = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    try {
      await onRoleChange(userId, newRole);
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadgeVariant = (role: UserRole): 'sage' | 'accent' | 'secondary' => {
    switch (role) {
      case 'admin':
        return 'accent';
      case 'instructor':
        return 'sage';
      case 'student':
        return 'secondary';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3.5 w-3.5 text-accent" />;
      case 'instructor':
        return <GraduationCap className="h-3.5 w-3.5 text-sage-600 dark:text-sage-400" />;
      case 'student':
        return <User className="h-3.5 w-3.5 text-text-muted" />;
    }
  };

  return (
    <div className="space-y-4 text-start">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tAdmin('searchUsersPlaceholder')}
            className="ps-9"
          />
        </div>

        {/* Role Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'student', 'instructor', 'admin'] as const).map((r) => {
            const isSelected = roleFilter === r;
            const labelMap = {
              all: tAdmin('filterRoleAll'),
              student: tAdmin('roleStudent'),
              instructor: tAdmin('roleInstructor'),
              admin: tAdmin('roleAdmin'),
            };

            return (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-primary text-on-primary'
                    : 'text-text-muted hover:text-text hover:bg-bg-subtle'
                }`}
              >
                {labelMap[r]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-subtle text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 text-start">{tAdmin('thUser')}</th>
                <th className="py-3 px-4 text-start">{tAdmin('thRole')}</th>
                <th className="py-3 px-4 text-start">{tAdmin('thLocale')}</th>
                <th className="py-3 px-4 text-start">{tAdmin('thJoined')}</th>
                <th className="py-3 px-4 text-end">{tAdmin('thActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isUpdating = updatingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-bg-subtle/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-text">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-paper-200 dark:bg-bg-subtle flex items-center justify-center shrink-0">
                            {getRoleIcon(user.role)}
                          </div>
                          <div>
                            <span className="block font-semibold text-text">{user.email}</span>
                            <span className="font-mono text-[10px] text-text-muted">{user.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize text-[11px]">
                          {user.role}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 uppercase font-mono text-text-muted">
                        {user.locale}
                      </td>

                      <td className="py-3.5 px-4 text-text-muted font-mono">
                        {user.createdAt ? user.createdAt.split('T')[0] : '2026-10-01'}
                      </td>

                      <td className="py-3.5 px-4 text-end">
                        <select
                          disabled={isUpdating}
                          value={user.role}
                          onChange={(e) => handleSelectRole(user.id, e.target.value as UserRole)}
                          className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-text focus-ring font-medium"
                          aria-label={`Change role for ${user.email}`}
                        >
                          <option value="student">{tAdmin('roleStudent')}</option>
                          <option value="instructor">{tAdmin('roleInstructor')}</option>
                          <option value="admin">{tAdmin('roleAdmin')}</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-text-muted">
                    {tAdmin('noUsersFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

