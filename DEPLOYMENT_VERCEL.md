# Deploy to Vercel

## Prerequisites
- GitHub/GitLab/Bitbucket repository
- Supabase project set up
- Microsoft Azure app registration (for OneDrive integration)

## Step 1: Prepare Environment Variables

Copy your `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_secure_random_secret

# Microsoft Graph (Optional)
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
MICROSOFT_TENANT_ID=your_tenant_id
MICROSOFT_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback/microsoft
```

## Step 2: Deploy to Vercel

### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: itglue-clone
# - Directory: ./
# - Override settings? No

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXTAUTH_SECRET
# ... add all other variables

# Deploy to production
vercel --prod
```

### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure environment variables in the dashboard
5. Deploy

## Step 3: Configure Custom Domain (Optional)
```bash
# Add custom domain
vercel domains add yourdomain.com

# Update environment variables
vercel env add NEXT_PUBLIC_APP_URL production yourdomain.com
```

## Step 4: Verify Deployment
- Visit your deployed URL
- Check `/api/health` endpoint
- Test authentication and core features

## Vercel Configuration

Your `vercel.json` is already configured with:
- Proper function timeouts
- Static file caching
- Security headers

## Benefits of Vercel
- ✅ Zero configuration deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Preview deployments
- ✅ Built-in analytics
- ✅ Excellent Next.js integration
