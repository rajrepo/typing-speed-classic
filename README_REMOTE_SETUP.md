# Remote Passages Setup Guide

## 🚀 Quick Start

### Development with Vercel Functions
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Start development server with API support
npm run vercel-dev
# OR
vercel dev

# Alternative: Use regular Vite dev (API won't work locally)
npm run dev
```

### Testing the API
```bash
# Test API endpoints
curl "http://localhost:3000/api/passages?difficulty=beginner&count=1"
curl "http://localhost:3000/api/passages?difficulty=intermediate&count=1"  
curl "http://localhost:3000/api/passages?difficulty=expert&count=1"
```

### Browser Console Commands
```javascript
// Test API connectivity
testAPIConnection()

// Clear passage cache
clearPassageCache()

// Get cache statistics
getCacheStats()
```

## 📊 Performance Improvements

### Before (Local Books)
- **Initial Load**: 3-5 seconds
- **Bundle Size**: 1.2MB+ (with books)
- **IndexedDB Usage**: 5MB+
- **First Passage**: 5+ seconds

### After (Remote API)
- **Initial Load**: <1 second
- **Bundle Size**: ~200KB 
- **Local Storage**: <1MB
- **First Passage**: <500ms

## 🏗️ Architecture Overview

```
Browser                     Vercel Edge
┌─────────────────┐        ┌─────────────────┐
│ Typing App      │──GET──→│ /api/passages   │
│                 │        │                 │
│ • Remote Service│←──JSON─│ • Sensible-Lorem│
│ • Smart Cache   │        │ • Book Samples  │
│ • Fallbacks     │        │ • Caching       │
└─────────────────┘        └─────────────────┘
```

## 🔧 API Endpoints

### GET /api/passages
**Parameters:**
- `difficulty`: beginner | intermediate | expert
- `count`: 1-10 (default: 1)
- `refresh`: true | false (default: false)

**Response:**
```json
{
  "success": true,
  "passages": [
    {
      "id": "unique_id",
      "text": "Passage content...",
      "difficulty": "beginner",
      "source": "sensible-lorem",
      "grade": 6,
      "length": 128,
      "wordCount": 24
    }
  ],
  "metadata": {
    "difficulty": "beginner",
    "count": 1,
    "generated": "2024-01-15T10:30:00Z"
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Deploy to production
npm run deploy
# OR
vercel --prod
```

### Environment Variables
No environment variables required for basic setup.

## 🔄 Fallback Strategy

1. **Primary**: Fetch from `/api/passages`
2. **Secondary**: Use cached passages
3. **Tertiary**: Generate sensible-lorem locally (beginner only)
4. **Last Resort**: Static fallback text

## 📈 Monitoring

### Cache Hit Rates
- Target: >80% cache hit rate
- Monitoring: Browser console logs
- Debugging: `getCacheStats()` command

### API Performance
- Target: <200ms response time
- CDN Caching: 5-minute edge cache
- Error Rate: <1%

## 🐛 Debugging

### Common Issues

**API Not Found (404)**
```bash
# Make sure you're using vercel dev
vercel dev
# NOT just
npm run dev
```

**CORS Errors**
- Check vercel.json configuration
- Ensure proper headers are set

**Slow Performance**
- Check network tab for API calls
- Verify caching is working
- Use `getCacheStats()` to debug

### Debug Commands
```javascript
// Test single API call
fetch('/api/passages?difficulty=beginner').then(r => r.json()).then(console.log)

// Test fallback system
remotePassageService.getFallbackPassage('beginner')

// Clear cache and test
clearPassageCache(); getRandom('beginner');
```

## 🎯 Next Steps

1. **Add More Book Content**: Update `api/passages.js` with more book samples
2. **Implement Database**: Replace in-memory samples with proper database
3. **Add Analytics**: Track passage usage and performance
4. **Add Admin Panel**: Manage content and view statistics
5. **Optimize Caching**: Implement more sophisticated cache strategies