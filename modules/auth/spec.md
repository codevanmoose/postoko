# MODULE: Authentication

## Purpose
Handles user authentication, authorization, and session management for Postoko. Integrates with Supabase Auth for secure user management and supports OAuth providers (Google, social platforms).

## Features
- Email/password authentication
- Google OAuth integration
- Session management with JWT tokens
- Password reset functionality
- Email verification (optional)
- Role-based access control
- Secure token refresh

## User Stories
- As a new user, I want to sign up with email/password so that I can create an account
- As a new user, I want to sign up with Google so that I can quickly create an account
- As an existing user, I want to log in so that I can access my dashboard
- As a user, I forgot my password and want to reset it via email
- As a logged-in user, I want my session to persist so I don't have to log in repeatedly
- As a user, I want to log out securely from all devices

## Data Models
```yaml
User:
  id: uuid (from auth.users)
  email: string
  full_name: string (optional)
  avatar_url: string (optional)
  stripe_customer_id: string (optional)
  subscription_tier: enum (starter, pro, growth, studio, enterprise)
  subscription_status: enum (active, canceled, past_due, trialing)
  timezone: string (default: UTC)
  created_at: timestamp
  updated_at: timestamp

Session:
  access_token: string (JWT)
  refresh_token: string
  expires_at: timestamp
  user: User
```

## API Endpoints
| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | /auth/signup | Create new user account | No |
| POST | /auth/login | Authenticate user | No |
| POST | /auth/logout | End session | Yes |
| POST | /auth/refresh | Refresh access token | No (refresh token) |
| POST | /auth/forgot-password | Send password reset email | No |
| POST | /auth/reset-password | Reset password with token | No |
| GET | /auth/me | Get current user | Yes |
| PUT | /auth/me | Update user profile | Yes |
| GET | /auth/callback/google | Google OAuth callback | No |
| DELETE | /auth/account | Delete user account | Yes |

## Dependencies
- Internal: None (first module)
- External: 
  - @supabase/supabase-js
  - @supabase/auth-helpers-nextjs
  - Next.js middleware

## Success Criteria
- [ ] Users can sign up with email/password
- [ ] Users can sign up/login with Google OAuth
- [ ] Passwords are securely hashed (handled by Supabase)
- [ ] JWT tokens expire after appropriate time
- [ ] Refresh tokens work correctly
- [ ] Session persists across page reloads
- [ ] Logout clears all tokens
- [ ] Password reset emails are sent
- [ ] Protected routes redirect to login
- [ ] User profile can be updated

## Error Handling
- Invalid credentials: 401 Unauthorized with message "Invalid email or password"
- Duplicate email: 409 Conflict with message "Email already registered"
- Invalid token: 401 Unauthorized with message "Invalid or expired token"
- Rate limiting: 429 Too Many Requests
- Server error: 500 with correlation ID

## Security Considerations
- All tokens stored securely (httpOnly cookies)
- CSRF protection enabled
- Rate limiting on auth endpoints
- Password requirements enforced
- OAuth state parameter validation
- Secure headers (HSTS, CSP, etc.)

## Implementation Notes
- Use Supabase Auth for all authentication logic
- Implement auth context with React Context API
- Create useAuth hook for components
- Add middleware for protected routes
- Set up proper CORS for API calls
- Implement proper loading states

## Testing Requirements
- Unit tests for auth utilities
- Integration tests for auth flow
- E2E tests for signup/login/logout
- Test OAuth flow with mock provider
- Test session persistence
- Test error scenarios
- Test rate limiting

## Module Exports
```typescript
// Types
export type User
export type Session
export type AuthError

// Hooks
export function useAuth()
export function useUser()
export function useSession()

// Components
export function AuthProvider({ children })
export function ProtectedRoute({ children })

// Utilities
export async function signUp(email: string, password: string)
export async function signIn(email: string, password: string)
export async function signOut()
export async function resetPassword(email: string)
export async function updateProfile(data: Partial<User>)

// Middleware
export function withAuth(handler)
export function requireAuth(req, res)
```

## Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```