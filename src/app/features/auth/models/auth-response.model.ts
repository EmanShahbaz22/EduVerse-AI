export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user?: {
    id: string;
    email: string;
    role: 'student' | 'teacher' | 'admin' | 'super_admin' | 'super-admin';
    tenantId?: string | null;
    studentId?: string | null;
    teacherId?: string | null;
    adminId?: string | null;
    fullName?: string | null;
  };
}
