'use client';

import { AppShell } from '@/components/layout/app-shell';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SkeletonGrid } from '@/components/ui/skeleton';
import { getTeacherStats } from '@/lib/api/http';
import { TeacherStats, UserRole } from '@/lib/api/types';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== UserRole.teacher) {
      router.push('/student');
      return;
    }
    
    getTeacherStats()
      .then(setStats)
      .catch(() => setStats({ totalExams: 0, totalAttempts: 0, totalViolations: 0, violationRate: 0 }))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);
  
  return (
    <AppShell
      title="Teacher Dashboard"
      subtitle="Quản lý đề thi • Phòng thi • Vi phạm"
      nav={[
        { href: '/teacher', label: 'Tổng quan' },
        { href: '/teacher/exams', label: 'Danh sách đề' },
        { href: '/teacher/exams/new', label: 'Tạo đề mới', badge: 'CSV/Manual/AI' },
        { href: '/teacher/results', label: 'Kết quả & Vi phạm' },
      ]}
    >
      <div className="page-stack">
        <div className="section-head flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-900">Tổng quan</h1>
            {user && (
              <p className="mt-1 text-sm text-zinc-600">
                Xin chào, <span className="font-bold">{user.username}</span>! Xem nhanh thống kê đề thi, lượt thi, và vi
                phạm.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <ButtonLink href="/teacher/exams/new">Tạo đề</ButtonLink>
            <ButtonLink href="/teacher/exams" variant="secondary">
              Xem danh sách
            </ButtonLink>
          </div>
        </div>
        
        {loading || !stats ? (
          <SkeletonGrid count={4} cols={2} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Đề thi" shadow="green">
              <span className="text-3xl font-black text-zinc-900">{stats.totalExams}</span>
            </Card>
            <Card title="Lượt thi" shadow="orange">
              <span className="text-3xl font-black text-zinc-900">{stats.totalAttempts}</span>
            </Card>
            <Card title="Vi phạm" shadow="red">
              <span className="text-3xl font-black text-zinc-900">{stats.totalViolations}</span>
            </Card>
            <Card title="Tỷ lệ vi phạm" shadow="dark">
              <span className="text-3xl font-black text-zinc-900">{stats.violationRate}%</span>
            </Card>
          </div>
        )}
        
        <Card
          title="Bắt đầu nhanh"
          description="Các tác vụ thường dùng"
          shadow="dark"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <ButtonLink href="/teacher/exams/new" className="justify-center">
              📝 Tạo đề mới
            </ButtonLink>
            <ButtonLink href="/teacher/exams" variant="secondary" className="justify-center">
              📋 Danh sách đề
            </ButtonLink>
            <ButtonLink href="/teacher/results" variant="secondary" className="justify-center">
              📊 Kết quả thi
            </ButtonLink>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
