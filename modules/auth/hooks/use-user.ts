import { useAuth } from './use-auth';

export function useUser() {
  const { user, loading } = useAuth();
  return { user, loading };
}