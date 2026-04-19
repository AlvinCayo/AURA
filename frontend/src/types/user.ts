export type UserRole = 'usuario' | 'centro' | 'administrador';

export interface User {
  id: string;
  role: UserRole;
}