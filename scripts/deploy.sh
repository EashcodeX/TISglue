#!/bin/bash

# ITGlue Clone Deployment Script
# Usage: ./scripts/deploy.sh [vercel|aws-apprunner|aws-ecs|aws-amplify]

set -e

DEPLOYMENT_TYPE=${1:-"vercel"}
PROJECT_NAME="itglue-clone"

echo "🚀 Deploying $PROJECT_NAME to $DEPLOYMENT_TYPE..."

case $DEPLOYMENT_TYPE in
  "vercel")
    echo "📦 Deploying to Vercel..."
    
    # Check if vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
      echo "Installing Vercel CLI..."
      npm i -g vercel
    fi
    
    # Build and deploy
    echo "Building for Vercel..."
    npm run build
    
    echo "Deploying to Vercel..."
    vercel --prod
    
    echo "✅ Deployed to Vercel!"
    echo "Don't forget to set environment variables in Vercel dashboard"
    ;;
    
  "aws-apprunner")
    echo "🐳 Deploying to AWS App Runner..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
      echo "❌ AWS CLI not found. Please install it first."
      exit 1
    fi
    
    # Build Docker image
    echo "Building Docker image..."
    DEPLOYMENT_TARGET=docker docker build -t $PROJECT_NAME .
    
    # Get AWS account ID and region
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGION=${AWS_DEFAULT_REGION:-us-east-1}
    ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME"
    
    # Create ECR repository if it doesn't exist
    aws ecr describe-repositories --repository-names $PROJECT_NAME --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name $PROJECT_NAME --region $AWS_REGION
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI
    
    # Tag and push
    docker tag $PROJECT_NAME:latest $ECR_URI:latest
    docker push $ECR_URI:latest
    
    echo "✅ Image pushed to ECR: $ECR_URI:latest"
    echo "Now create App Runner service in AWS console or use AWS CLI"
    ;;
    
  "aws-ecs")
    echo "🐳 Deploying to AWS ECS..."
    echo "Please follow the ECS deployment guide in DEPLOYMENT_AWS.md"
    ;;
    
  "aws-amplify")
    echo "⚡ Deploying to AWS Amplify..."
    
    # Check if Amplify CLI is installed
    if ! command -v amplify &> /dev/null; then
      echo "Installing Amplify CLI..."
      npm i -g @aws-amplify/cli
    fi
    
    echo "Please follow the Amplify deployment guide in DEPLOYMENT_AWS.md"
    ;;
    
  *)
    echo "❌ Unknown deployment type: $DEPLOYMENT_TYPE"
    echo "Usage: $0 [vercel|aws-apprunner|aws-ecs|aws-amplify]"
    exit 1
    ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo "📋 Next steps:"
echo "1. Set up environment variables in your deployment platform"
echo "2. Configure custom domain (optional)"
echo "3. Set up monitoring and alerts"
echo "4. Test the /api/health endpoint"
