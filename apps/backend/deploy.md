# Backend Server Deployment Guide

This guide covers deploying the Compify MVP backend server to cloud hosting platforms.

## Prerequisites

- Go 1.21+ for local building
- Git repository with your code
- Account on chosen hosting platform (Render.com or Leapcell)

## Platform Options

### Option 1: Render.com (Recommended)

Render.com offers a generous free tier and simple deployment process.

#### Setup Steps:

1. **Create Web Service:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your Git repository

2. **Configure Service:**
   ```
   Name: compify-backend
   Environment: Go
   Build Command: cd apps/backend && go build -o ../../dist/compify-backend ./cmd
   Start Command: ./dist/compify-backend
   Plan: Free
   Region: Oregon (or closest to your users)
   ```

3. **Environment Variables:**
   Add these in the Render dashboard:
   ```
   PORT=10000
   ENVIRONMENT=production
   SESSION_SECRET=your-secure-session-secret-here
   CORS_ORIGINS=https://your-domain.com,https://sandbox.your-domain.com
   STATIC_SITE_URL=https://your-domain.com
   SANDBOX_URL=https://sandbox.your-domain.com
   SECURE_COOKIES=true
   CSRF_SECRET=your-csrf-secret-here
   RATE_LIMIT_REQUESTS=100
   RATE_LIMIT_WINDOW=60
   LOG_LEVEL=info
   LOG_FORMAT=json
   CACHE_TTL_SECONDS=300
   STATIC_CACHE_TTL_SECONDS=31536000
   HEALTH_CHECK_TIMEOUT=5s
   ```

4. **Auto-Deploy:**
   - Enable auto-deploy from your main branch
   - Set up build filters to only deploy on backend changes

5. **Health Check:**
   - Health check path: `/health`
   - Automatically configured by Render

#### Using Configuration File:

Copy `infra/render-deploy.yaml` to your repository root for automatic configuration:

```yaml
services:
  - type: web
    name: compify-backend
    env: go
    buildCommand: "cd apps/backend && go build -o ../../dist/compify-backend ./cmd"
    startCommand: "./dist/compify-backend"
    plan: free
    # ... (see full configuration in infra/render-deploy.yaml)
```

### Option 2: Leapcell

Leapcell offers competitive pricing and good performance.

#### Setup Steps:

1. **Install Leapcell CLI:**
   ```bash
   npm install -g @leapcell/cli
   # or
   curl -sSL https://cli.leapcell.io/install.sh | sh
   ```

2. **Login and Initialize:**
   ```bash
   leapcell login
   leapcell init
   ```

3. **Deploy using Configuration:**
   Use the configuration in `infra/leapcell-deploy.json`:
   ```bash
   leapcell deploy --config infra/leapcell-deploy.json
   ```

4. **Set Environment Variables:**
   ```bash
   leapcell env set SESSION_SECRET=your-secure-session-secret
   leapcell env set CSRF_SECRET=your-csrf-secret
   # ... (set all required variables)
   ```

## Environment Variables

### Required Variables:

```bash
# Server Configuration
PORT=8080                    # Port for the server (10000 for Render)
ENVIRONMENT=production       # Environment mode

# Security
SESSION_SECRET=your-secure-session-secret-here    # 32+ character random string
CSRF_SECRET=your-csrf-secret-here                 # 32+ character random string
SECURE_COOKIES=true                               # Enable secure cookies for HTTPS

# CORS Configuration
CORS_ORIGINS=https://your-domain.com,https://sandbox.your-domain.com
STATIC_SITE_URL=https://your-domain.com
SANDBOX_URL=https://sandbox.your-domain.com

# Rate Limiting
RATE_LIMIT_REQUESTS=100      # Requests per window
RATE_LIMIT_WINDOW=60         # Window in seconds

# Logging
LOG_LEVEL=info               # debug, info, warn, error
LOG_FORMAT=json              # json or text

# Caching
CACHE_TTL_SECONDS=300                    # 5 minutes
STATIC_CACHE_TTL_SECONDS=31536000        # 1 year
HEALTH_CHECK_TIMEOUT=5s
```

### Generating Secrets:

Use a secure random generator for secrets:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Go
go run -c "package main; import \"crypto/rand\"; import \"encoding/base64\"; import \"fmt\"; func main() { b := make([]byte, 32); rand.Read(b); fmt.Println(base64.StdEncoding.EncodeToString(b)) }"

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Local Testing

Before deploying, test the backend locally:

1. **Build the application:**
   ```bash
   cd apps/backend
   go mod tidy
   go build -o ../../dist/compify-backend ./cmd
   ```

2. **Set environment variables:**
   ```bash
   export PORT=8080
   export ENVIRONMENT=development
   export SESSION_SECRET=test-secret-for-development
   export CORS_ORIGINS=http://localhost:4321
   export STATIC_SITE_URL=http://localhost:4321
   export SANDBOX_URL=http://localhost:5173
   export SECURE_COOKIES=false
   export CSRF_SECRET=test-csrf-secret
   ```

3. **Run the server:**
   ```bash
   ./dist/compify-backend
   ```

4. **Test endpoints:**
   ```bash
   # Health check
   curl http://localhost:8080/health
   
   # Login page
   curl http://localhost:8080/auth/login
   
   # Register page
   curl http://localhost:8080/auth/register
   ```

## Deployment Verification

After deployment, verify your backend using the verification script:

```bash
# Set your backend URL
export BACKEND_URL=https://your-backend-url.com

# Build and run verification
cd apps/backend
go run verify-deployment.go
```

The script checks:
- ✅ Health endpoint responds correctly
- ✅ Authentication pages are accessible
- ✅ Response times are acceptable
- ✅ Security headers are present
- ✅ JSON responses are valid

## Monitoring and Logging

### Health Checks

The backend provides a health endpoint at `/health`:

```json
{
  "status": "ok",
  "timestamp": "2024-01-08T15:30:45Z",
  "version": "1.0.0",
  "uptime": "2h30m15s",
  "checks": {
    "memory": "ok",
    "disk": "ok"
  }
}
```

### Logging

The backend uses structured logging in production:

```json
{
  "level": "info",
  "timestamp": "2024-01-08T15:30:45Z",
  "message": "HTTP request",
  "method": "GET",
  "path": "/health",
  "status": 200,
  "duration": "2ms",
  "ip": "192.168.1.1"
}
```

### Metrics

Monitor these key metrics:
- **Response time**: < 500ms for most endpoints
- **Error rate**: < 1% of requests
- **Memory usage**: < 80% of allocated memory
- **CPU usage**: < 70% average

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   ```
   Error: go: cannot find main module
   Solution: Ensure you're in the correct directory and go.mod exists
   ```

2. **Port Binding Errors:**
   ```
   Error: bind: address already in use
   Solution: Check PORT environment variable and ensure no other process is using the port
   ```

3. **CORS Errors:**
   ```
   Error: CORS policy blocks request
   Solution: Verify CORS_ORIGINS includes your frontend domain
   ```

4. **Session Issues:**
   ```
   Error: sessions not working
   Solution: Check SESSION_SECRET is set and SECURE_COOKIES matches your HTTPS setup
   ```

### Debug Mode:

Enable debug logging for troubleshooting:

```bash
export LOG_LEVEL=debug
```

This will show detailed request/response information.

### Memory Issues:

If experiencing memory issues on free tiers:

1. **Monitor memory usage** in platform dashboard
2. **Optimize session storage** (consider external session store for high traffic)
3. **Enable garbage collection logging**:
   ```bash
   export GOGC=100
   export GODEBUG=gctrace=1
   ```

## Security Considerations

### Production Checklist:

- [ ] `SESSION_SECRET` is a secure random string (32+ characters)
- [ ] `CSRF_SECRET` is a secure random string (32+ characters)
- [ ] `SECURE_COOKIES=true` for HTTPS deployments
- [ ] `CORS_ORIGINS` only includes trusted domains
- [ ] Rate limiting is enabled and configured appropriately
- [ ] Security headers are configured
- [ ] Logs don't contain sensitive information
- [ ] Health endpoint doesn't expose sensitive system information

### HTTPS Configuration:

Both Render and Leapcell provide automatic HTTPS:
- SSL certificates are automatically provisioned
- HTTP requests are redirected to HTTPS
- Set `SECURE_COOKIES=true` for production

## Performance Optimization

### Free Tier Optimization:

1. **Minimize cold starts:**
   - Keep the service warm with periodic health checks
   - Use lightweight health check endpoints

2. **Optimize memory usage:**
   - Use efficient data structures
   - Implement proper garbage collection
   - Monitor memory usage

3. **Cache effectively:**
   - Use in-memory caching for frequently accessed data
   - Set appropriate cache TTL values
   - Implement cache invalidation strategies

### Scaling Considerations:

For future scaling beyond free tiers:
- **Database**: Add persistent database (PostgreSQL/MySQL)
- **Session Store**: Use Redis for session storage
- **Load Balancing**: Multiple instances behind load balancer
- **CDN**: Use CDN for static assets served by backend

## Backup and Recovery

### Important Data:

- Environment variables and secrets
- Application logs (if persistent storage is used)
- Session data (if using persistent sessions)

### Backup Strategy:

1. **Configuration Backup:**
   - Keep deployment configurations in Git
   - Document environment variables securely
   - Maintain deployment runbooks

2. **Code Backup:**
   - Git repository serves as primary backup
   - Tag releases for easy rollback
   - Maintain deployment history

3. **Monitoring:**
   - Set up uptime monitoring
   - Configure alerting for errors
   - Monitor resource usage

## Updates and Maintenance

### Deployment Process:

1. **Development:**
   - Test changes locally
   - Run verification script
   - Check all tests pass

2. **Staging:**
   - Deploy to preview environment
   - Run integration tests
   - Verify with frontend

3. **Production:**
   - Deploy using established process
   - Monitor for issues
   - Verify deployment with verification script

### Rollback Strategy:

- **Git-based rollback**: Revert to previous commit and redeploy
- **Platform rollback**: Use platform-specific rollback features
- **Health monitoring**: Automatic rollback on health check failures

---

For additional help:
- [Render.com Documentation](https://render.com/docs)
- [Leapcell Documentation](https://docs.leapcell.io/)
- [Go Deployment Best Practices](https://golang.org/doc/)