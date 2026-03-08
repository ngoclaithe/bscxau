# HTTP-Only Cookie Authentication Setup

## Problem Solved
- Admin and users stay logged in after F5 (page refresh)
- HTTP-only cookies prevent XSS attacks (not accessible via JavaScript)
- Cross-domain authentication works (Vercel frontend → Custom VPS backend)
- Session verification ensures security

## Architecture

```
Frontend (https://bscxau.vercel.app)
                |
    credentials: 'include' (sends cookies)
                |
Backend (https://bscxau.vanquyenhair.name.vn)
                |
    CORS: { credentials: true }
    Sets: admin_access_token (HTTP-only cookie)
                |
JWT Strategy reads from req.cookies
                |
Returns admin info for persistent session
```

## Environment Configuration Required

### Backend (.env file in `be/`)

```env
# Required for Cookie Strategy
NODE_ENV=production

# CORS Configuration - Frontend URLs
FRONTEND_URL="https://bscxau.vercel.app, http://localhost:5173"

# Database
DATABASE_URL=your_database_url

# JWT
JWT_SECRET=your-secure-jwt-secret

# Port
PORT=3000

# Other settings...
```

**Important:** 
- `NODE_ENV=production` enables `secure: true` and `sameSite: 'none'` for cookies
- `NODE_ENV=development` uses `secure: false` and `sameSite: 'lax'` for local testing
- Multiple frontend URLs must be comma-separated

### Frontend (.env file in `fe/`)

```env
# Backend API URL - must be HTTPS in production
VITE_API_URL=https://bscxau.vanquyenhair.name.vn/api/v1
```

## How It Works

### 1. Admin Login Flow
```
POST /admin-auth/login
  ↓
Backend validates credentials
  ↓
Backend generates JWT token
  ↓
Backend sets HTTP-only cookie:
  - Cookie name: admin_access_token
  - httpOnly: true (JS cannot access)
  - secure: true (HTTPS only)
  - sameSite: 'none' (cross-domain)
  - maxAge: 7 days
  ↓
Response returns admin info (without token in body)
  ↓
Frontend stores isAuthenticated in localStorage (via persist middleware)
```

### 2. Persistent Session After F5
```
User presses F5
  ↓
App.tsx useEffect runs on mount
  ↓
Checks if isAuthenticated = true from localStorage
  ↓
Calls verifyAdminSession() → GET /admin-auth/me
  ↓
JWT Strategy READS browser cookies automatically
  ↓
If cookie found → token validated → session restored
If cookie not found → session cleared → redirect to login
```

### 3. Protected Admin Routes
```
GET /admin-auth/me (protected with @UseGuards(AuthGuard('jwt')))
  ↓
JwtStrategy.jwtFromRequest() reads cookies:
  - Checks for admin_access_token
  - Falls back to access_token
  - Falls back to Authorization header
  ↓
Validates JWT signature
  ↓
Returns admin info if valid
```

## Authentication Files Modified

### Backend
1. **src/main.ts**
   - CORS with `credentials: true`
   - `app.set('trust proxy', 1)` - for Nginx reverse proxy
   - `cookieParser()` middleware

2. **src/modules/admin/admin-auth.controller.ts**
   - Sets `admin_access_token` cookie on login
   - Environment-aware cookie options (production vs development)
   - Clear logging for debugging

3. **src/modules/admin/admin-auth.service.ts**
   - Validates admin credentials
   - Returns admin info and JWT token

4. **src/modules/auth/auth.strategy.ts**
   - Reads cookies: `admin_access_token` or `access_token`
   - Falls back to Authorization header
   - Enhanced logging for debugging

### Frontend
1. **src/stores/admin-store.ts**
   - Added `verifyAdminSession()` function
   - Calls `/admin-auth/me` to validate session
   - Clears auth state if session invalid

2. **src/app/App.tsx**
   - Added session verification effect
   - Verifies session on app mount
   - Redirects to login if session invalid

3. **src/lib/api.ts** (already configured)
   - All requests use `credentials: 'include'`
   - Automatically sends cookies with each request

## Testing the Implementation

### Local Testing (Development Mode)

1. **Start Backend**
   ```bash
   cd be
   NODE_ENV=development npm run dev
   ```
   Cookies will use `sameSite: 'lax'` and `secure: false`

2. **Start Frontend**
   ```bash
   cd fe
   npm run dev
   # Access at http://localhost:5173
   ```

3. **Test Login Flow**
   - Go to admin login page
   - Login with admin credentials
   - Check browser DevTools → Application → Cookies
   - Verify `admin_access_token` cookie exists
   - Press F5 and verify you stay logged in

### Production Testing (VPS)

1. **Verify HTTPS**
   ```bash
   # Both URLs must be HTTPS
   Frontend: https://bscxau.vercel.app (Vercel auto-HTTPS)
   Backend: https://bscxau.vanquyenhair.name.vn (check your SSL cert)
   ```

2. **Check Nginx Configuration**
   ```nginx
   server {
       listen 443 ssl;
       server_name bscxau.vanquyenhair.name.vn;
       ssl_certificate /path/to/cert;
       ssl_certificate_key /path/to/key;
       
       location /api/v1 {
           proxy_pass http://localhost:3000/api/v1;
           proxy_set_header X-Forwarded-For $remote_addr;
           proxy_set_header X-Forwarded-Proto https;  # IMPORTANT!
           proxy_cookie_path / /;    # Cookie path
       }
   }
   ```

3. **Verify Backend is Production Mode**
   ```bash
   # Backend should have NODE_ENV=production
   # Check with: ps aux | grep node
   ```

## Debugging

### Cookies Not Being Set

**Check Backend Logs:**
```
[AdminAuth] Setting admin_access_token cookie with options: { 
  httpOnly: true, 
  secure: true, 
  sameSite: 'none',
  maxAge: 604800000,
  path: '/' 
}
```

**Check Browser Console:**
- Open DevTools → Application → Cookies
- Look for `admin_access_token` cookie
- Verify cookie domain and path are correct

### Cookies Not Being Sent with Requests

**Check Network Tab:**
- Go to admin dashboard
- Check Request Headers: `cookie: admin_access_token=...`
- If missing, cookies aren't being sent

**Possible Causes:**
1. Frontend not using `credentials: 'include'` ✓ (already fixed)
2. Backend not sending `Access-Control-Allow-Credentials: true` ✓ (via CORS)
3. Cookie domain/path mismatch
4. HTTPS not configured properly on VPS

### Session Verification Fails

**Check Backend Logs:**
```
[JwtStrategy] Token extracted from: admin_access_token Token exists: YES
[JwtStrategy] Validating payload: { sub: '...', email: 'admin@bscxau.io', role: 'ADMIN' }
```

If token not found:
```
[JwtStrategy] Token extracted from: none Token exists: false
```

**Check Backend:**
- Verify `cookieParser()` middleware is loaded
- Verify `app.set('trust proxy', 1)` is set for Nginx
- Check if cookies are being sent in request headers

## Security Notes

⚠️ **Important:** 
- HTTP-only cookies cannot be accessed by JavaScript (prevents XSS theft)
- `secure: true` requires HTTPS (prevents cookie transmission over HTTP)
- `sameSite: 'none'` allows cross-domain cookies but requires HTTPS
- Backend validates JWT signature on every request
- Session timeout: 7 days (set in maxAge)

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Found token in cookies: NO" | Cookie not set or not sent | Check Nginx SSL headers |
| F5 still logs out | Session verification not called | Check App.tsx useEffect |
| Cookie only works on localhost | Missing production env vars | Set NODE_ENV=production |
| Admin can't access dashboard | JWT validation fails | Check JWT_SECRET matches |
| CORS error on login | Frontend URL not in CORS list | Update FRONTEND_URL in .env |

## Endpoints

### Admin Authentication
- `POST /api/v1/admin-auth/login` - Login with email/password
- `POST /api/v1/admin-auth/logout` - Logout and clear cookie
- `GET /api/v1/admin-auth/me` - Get current admin info (validates session)

### User Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout

All endpoints automatically set HTTP-only `access_token` or `admin_access_token` cookie.

## Rollout Checklist

- [ ] Ensure `NODE_ENV=production` on backend VPS
- [ ] Verify HTTPS on both frontend and backend
- [ ] Test login → F5 → still logged in
- [ ] Test logout works
- [ ] Test session verification on app load
- [ ] Check browser cookies in DevTools
- [ ] Monitor backend logs for errors
- [ ] Test from different browsers/devices
