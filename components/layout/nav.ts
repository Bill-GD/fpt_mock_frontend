export type NavItem = {
  href: string;
  label: string;
  badge?: string;
};

export const TEACHER_NAV: NavItem[] = [
  { href: '/teacher', label: 'Tổng quan' },
  { href: '/teacher/exams', label: 'Danh sách đề' },
  { href: '/teacher/exams/new', label: 'Tạo đề mới', badge: 'CSV/Manual/AI' },
  { href: '/teacher/results', label: 'Kết quả & Vi phạm' },
];
