export type UserRole = 'admin' | 'accountant' | 'student';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  pictureUrl: string;
  role: UserRole;
  preferences: string[];
}