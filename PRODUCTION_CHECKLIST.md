# Production Deployment Checklist

## ✅ Pre-Deployment (Completed)
- [x] All TypeScript errors fixed (83 → 0)
- [x] Production build working (`npm run build`)
- [x] Health API endpoint created (`/api/health`)
- [x] Next.js configuration optimized
- [x] Environment variables template created
- [x] Docker configuration ready
- [x] Security headers configured

## 🔧 Environment Setup Required

### 1. Supabase Configuration
- [ ] Create Supabase project
- [ ] Run database migrations
- [ ] Set up RLS policies
- [ ] Get project URL and keys

### 2. Microsoft Graph Setup (Optional)
- [ ] Create Azure App Registration
- [ ] Configure redirect URIs
- [ ] Get client ID, secret, and tenant ID
- [ ] Set up OneDrive permissions

### 3. Environment Variables
Copy from `.env.example` and configure:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
NEXTAUTH_SECRET=
```

## 🚀 Deployment Options

### Vercel (Recommended)
**Pros:** Easiest, zero config, excellent Next.js support
**Cons:** Vendor lock-in, function limits
**Cost:** Free tier available, ~$20/month for pro

```bash
./scripts/deploy.sh vercel
```

### AWS App Runner
**Pros:** AWS ecosystem, Docker support, auto-scaling
**Cons:** More complex setup, AWS knowledge required
**Cost:** ~$25-50/month

```bash
./scripts/deploy.sh aws-apprunner
```

### AWS ECS Fargate
**Pros:** Full control, enterprise-ready, scalable
**Cons:** Complex setup, requires AWS expertise
**Cost:** ~$15-30/month

### AWS Amplify
**Pros:** Cost-effective, good for static sites
**Cons:** Limited server-side capabilities
**Cost:** ~$1-5/month

## 🔍 Post-Deployment Testing

### 1. Health Check
```bash
curl https://your-domain.com/api/health
```
Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Core Functionality
- [ ] User authentication works
- [ ] Organization creation/editing
- [ ] Document upload/download
- [ ] Sidebar navigation
- [ ] Search functionality

### 3. Performance
- [ ] Page load times < 3 seconds
- [ ] API responses < 1 second
- [ ] Images optimized and loading

### 4. Security
- [ ] HTTPS enabled
- [ ] Security headers present
- [ ] Environment variables secure
- [ ] Database RLS policies active

## 🔧 Production Optimizations

### 1. Database
- [ ] Enable connection pooling
- [ ] Set up read replicas (if needed)
- [ ] Configure backups
- [ ] Monitor query performance

### 2. Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Create performance dashboards

### 3. CDN & Caching
- [ ] Configure CDN for static assets
- [ ] Set up Redis for session storage
- [ ] Enable browser caching
- [ ] Optimize images

## 🚨 Troubleshooting

### Common Issues
1. **Build fails**: Check TypeScript errors with `npm run type-check`
2. **Health check fails**: Verify Supabase connection
3. **Authentication issues**: Check NEXTAUTH_SECRET and URLs
4. **OneDrive integration**: Verify Microsoft Graph credentials

### Debug Commands
```bash
# Check build locally
npm run build

# Test health endpoint
npm run dev
curl http://localhost:3000/api/health

# Check environment variables
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

## 📞 Support
- Check deployment guides: `DEPLOYMENT_VERCEL.md`, `DEPLOYMENT_AWS.md`
- Review application logs for errors
- Test health endpoint: `/api/health`
- Verify environment variables are set correctly
