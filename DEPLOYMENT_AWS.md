# Deploy to AWS

## Option 1: AWS App Runner (Easiest)

### Prerequisites
- AWS Account
- Docker Hub or AWS ECR access
- Supabase project

### Step 1: Build and Push Docker Image
```bash
# Build the image
docker build -t itglue-clone .

# Tag for AWS ECR (replace with your region/account)
docker tag itglue-clone:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/itglue-clone:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/itglue-clone:latest
```

### Step 2: Create App Runner Service
```bash
# Create apprunner.yaml
cat > apprunner.yaml << EOF
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "No build commands needed - using pre-built image"
run:
  runtime-version: latest
  command: npm start
  network:
    port: 3000
    env: PORT
  env:
    - name: NODE_ENV
      value: production
    - name: PORT
      value: 3000
EOF

# Deploy via AWS CLI
aws apprunner create-service \
  --service-name itglue-clone \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "123456789012.dkr.ecr.us-east-1.amazonaws.com/itglue-clone:latest",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true
  }'
```

## Option 2: AWS ECS with Fargate

### Step 1: Create ECS Task Definition
```json
{
  "family": "itglue-clone",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "itglue-clone",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/itglue-clone:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "secrets": [
        {"name": "NEXT_PUBLIC_SUPABASE_URL", "valueFrom": "arn:aws:secretsmanager:region:account:secret:itglue/supabase-url"},
        {"name": "NEXT_PUBLIC_SUPABASE_ANON_KEY", "valueFrom": "arn:aws:secretsmanager:region:account:secret:itglue/supabase-anon"},
        {"name": "SUPABASE_SERVICE_ROLE_KEY", "valueFrom": "arn:aws:secretsmanager:region:account:secret:itglue/supabase-service"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/itglue-clone",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Step 2: Create ECS Service
```bash
# Create cluster
aws ecs create-cluster --cluster-name itglue-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster itglue-cluster \
  --service-name itglue-clone \
  --task-definition itglue-clone:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

## Option 3: AWS Amplify

### Step 1: Create amplify.yml
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### Step 2: Deploy via AWS CLI
```bash
# Create Amplify app
aws amplify create-app --name itglue-clone --repository https://github.com/yourusername/itglue-clone

# Create branch
aws amplify create-branch --app-id YOUR_APP_ID --branch-name main

# Start deployment
aws amplify start-job --app-id YOUR_APP_ID --branch-name main --job-type RELEASE
```

## Environment Variables for AWS

Set these in your AWS service:
```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-aws-domain.com
NEXTAUTH_SECRET=your_secure_secret
```

## Cost Comparison
- **App Runner**: ~$25-50/month for small apps
- **ECS Fargate**: ~$15-30/month (more control)
- **Amplify**: ~$1-5/month (static + serverless functions)

## Recommendation
- **Vercel**: Best for development and small-medium apps
- **AWS App Runner**: Best for production with AWS ecosystem
- **AWS ECS**: Best for enterprise with full control
- **AWS Amplify**: Best for cost-effective hosting
