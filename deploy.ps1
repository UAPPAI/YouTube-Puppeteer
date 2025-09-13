# YouTube Search API - Vercel Deployment Script
Write-Host "🚀 Deploying YouTube Search API to Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Run security checks before deployment
Write-Host "🔒 Running security checks..." -ForegroundColor Yellow
npm run security:test

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Security checks failed. Deployment aborted." -ForegroundColor Red
    exit 1
}

# Deploy to Vercel
Write-Host "📦 Deploying to Vercel..." -ForegroundColor Blue
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Your API is now live on Vercel!" -ForegroundColor Cyan
    Write-Host "📋 Update your n8n workflow to use the new Vercel URL" -ForegroundColor Yellow
} else {
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
}
