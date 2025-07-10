# Auth Module

## Overview
The authentication module handles all user authentication, authorization, and session management for Postoko. It's built on top of Supabase Auth for secure, scalable user management.

## Quick Start

### Usage in Components
```tsx
import { useAuth } from '@modules/auth';

function MyComponent() {
  const { user, signIn, signOut, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <button onClick={() => signIn('email@example.com', 'password')}>Login</button>;
  }
  
  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### Protecting Routes
```tsx
import { ProtectedRoute } from '@modules/auth';

function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

### API Route Protection
```ts
import { withAuth } from '@modules/auth';

export const GET = withAuth(async (req, { user }) => {
  // User is guaranteed to be authenticated here
  return Response.json({ message: `Hello ${user.email}` });
});
```

## Features

### Email/Password Authentication
- Secure signup with email verification (optional)
- Password strength requirements
- Forgot password flow with email reset

### OAuth Integration
- Google Sign-In (more providers coming soon)
- Automatic account linking
- Profile picture sync

### Session Management
- Secure JWT tokens
- Automatic token refresh
- Persistent sessions
- Multi-device logout

## Architecture

The module is organized into:
- `hooks/` - React hooks for auth state
- `components/` - Auth UI components
- `lib/` - Core auth logic and utilities
- `middleware/` - Route protection
- `types/` - TypeScript definitions

## Security

- All passwords hashed with bcrypt (via Supabase)
- Tokens stored in httpOnly cookies
- CSRF protection enabled
- Rate limiting on auth endpoints
- OAuth state validation
- Secure headers configured

## Testing

Run module tests:
```bash
npm test modules/auth
```

Test coverage includes:
- Unit tests for utilities
- Integration tests for auth flows
- E2E tests for user journeys
- Security vulnerability tests