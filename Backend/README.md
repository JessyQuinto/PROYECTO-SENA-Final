# Backend - Marketplace API

This is the backend API for the Tesoros Chocó marketplace project.

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev
```

### Production Build
```bash
# Build optimized version for production
npm run build:optimized

# Start production server
npm start
```

## 📁 Project Structure

- `src/index.ts` - Development version (basic middleware)
- `src/index.optimized.ts` - Production version (with compression, helmet, enhanced security)
- `src/lib/` - Utility libraries (Supabase admin, cache manager)

## 🔧 Build Scripts

- `npm run dev` - Development server with hot reload
- `npm run build` - Build all TypeScript files (legacy)
- `npm run build:optimized` - Build only the optimized production version
- `npm start` - Start production server (uses optimized build)

## 🚀 Deployment

The project uses GitHub Actions for automated deployment to Azure Web App.

### Build Process
1. **Install Dependencies**: Uses npm workspaces to install all dependencies
2. **Build**: Compiles `index.optimized.ts` to JavaScript
3. **Package**: Creates production deployment package with only necessary files
4. **Deploy**: Uploads to Azure Web App

### Environment Variables
Required environment variables for production:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `FRONTEND_ORIGINS` - Comma-separated list of allowed frontend origins
- `PORT` - Server port (defaults to 4000)

## 🧪 Testing Build Locally

Before pushing to GitHub, test the build process:

```bash
# Make the test script executable
chmod +x test-build.sh

# Run the test
./test-build.sh
```

This will verify that:
- Dependencies install correctly
- TypeScript compilation works
- Build output is generated
- Start script points to the right file

## 🔒 Security Features

The optimized production build includes:
- **Helmet.js** - Security headers and CSP
- **Compression** - Gzip/Brotli compression
- **Enhanced CORS** - Configurable origin validation
- **Request validation** - Zod schema validation
- **Error handling** - Secure error responses

## 📊 Performance Optimizations

- Response compression for text-based content
- CORS preflight caching (24 hours)
- Morgan logging with health check filtering
- Graceful shutdown handling
- Memory usage monitoring

## 🐛 Troubleshooting

### Build Errors
If you get TypeScript compilation errors:
1. Ensure all dependencies are installed: `npm install`
2. Check that `compression` and `helmet` are in dependencies
3. Verify TypeScript configuration in `tsconfig.json`

### Runtime Errors
- Check environment variables are set correctly
- Verify Supabase credentials
- Check CORS configuration for frontend origins

### Deployment Issues
- Verify GitHub Actions workflow file exists
- Check Azure Web App configuration
- Ensure publish profile secret is set in GitHub
