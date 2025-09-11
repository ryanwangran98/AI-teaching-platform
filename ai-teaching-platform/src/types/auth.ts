export interface User {
  id: string;
  username: string;
  email: string;
  realName: string;
  phone?: string;
  role: 'teacher' | 'student' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  realName: string;
  phone?: string;
  role: 'teacher' | 'student' | 'admin';
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UpdateProfileData {
  realName?: string;
  phone?: string;
  avatar?: string;
}