# Remote Passages Architecture Plan

## 🏗️ System Architecture

### API Endpoint Structure
```
GET /api/passages?difficulty=beginner&count=1
GET /api/passages?difficulty=intermediate&count=5
GET /api/passages?difficulty=expert&count=1&refresh=true
```

### Response Format
```json
{
  "success": true,
  "passages": [
    {
      "id": "unique_passage_id",
      "text": "The actual passage text for typing...",
      "difficulty": "beginner",
      "source": "sensible-lorem",
      "grade": 6,
      "length": 128,
      "wordCount": 24,
      "metadata": {
        "created": "2024-01-15T10:30:00Z",
        "bookSource": "generated"
      }
    }
  ],
  "cache": {
    "maxAge": 3600,
    "etag": "abc123"
  }
}
```

## 🛠️ Implementation Options

### Option 1: Vercel Serverless Functions ⭐ (Recommended)
**Pros:**
- Zero server management
- Automatic scaling
- Built-in caching
- Easy deployment with current Vite setup

**Structure:**
```
api/
├── passages.js          # Main passage endpoint
├── books/
│   ├── alice.txt       # Pre-processed book content
│   ├── tom.txt
│   └── darwin.txt
└── lib/
    ├── textProcessor.js # Server-side processing
    └── difficultyAnalyzer.js
```

### Option 2: Express.js API Server
**Pros:**
- Full control
- Traditional setup
- Easy local development

**Cons:**
- Need to manage hosting
- More complex deployment

### Option 3: Headless CMS (Strapi/Contentful)
**Pros:**
- Admin interface
- Built-in API
- Content management

**Cons:**
- Overkill for this use case
- Additional complexity

## 📦 Client-Side Changes

### New Remote Passage Service
```javascript
// src/modules/remotePassageService.js
class RemotePassageService {
  async fetchPassages(difficulty, count = 1) {
    const response = await fetch(`/api/passages?difficulty=${difficulty}&count=${count}`);
    return await response.json();
  }
  
  async getPassage(difficulty) {
    // Check cache first
    const cached = this.getCachedPassage(difficulty);
    if (cached) return cached;
    
    // Fetch from API
    const result = await this.fetchPassages(difficulty, 1);
    this.cachePassage(result.passages[0]);
    return result.passages[0];
  }
}
```

### Updated Passage Generator
```javascript
// Simplified passageGenerator.js
export async function getRandom(difficulty) {
  if (difficulty === 'beginner') {
    return await remotePassageService.getPassage('beginner');
  }
  
  // For intermediate/expert, fetch from pre-processed books
  return await remotePassageService.getPassage(difficulty);
}
```

## 🔄 Migration Strategy

### Phase 1: API Development (Day 1)
1. **Create Vercel API endpoints**
   - Set up `/api/passages` endpoint
   - Implement beginner (sensible-lorem) generation
   - Test with Postman/curl

### Phase 2: Book Processing (Day 1-2)
1. **Server-side book processing**
   - Move textProcessor.js to API
   - Pre-process books into passage database
   - Implement difficulty filtering

### Phase 3: Client Updates (Day 2)
1. **Replace local generation**
   - Create RemotePassageService
   - Update passageGenerator.js
   - Remove heavy client-side processing

### Phase 4: Optimization (Day 3)
1. **Performance enhancements**
   - Implement smart caching
   - Add request deduplication
   - Background passage pre-fetching

### Phase 5: Fallbacks (Day 3)
1. **Offline support**
   - Cache passages in IndexedDB
   - Fallback to sensible-lorem if API fails
   - Error handling and retry logic

## 📊 Benefits Analysis

### Performance Improvements
- **Initial Load**: 1MB+ → ~50KB (95% reduction)
- **Time to First Passage**: 3-5s → <500ms (90% improvement)
- **Memory Usage**: Heavy → Minimal
- **Bandwidth**: High → Low

### User Experience
- ✅ **Instant startup** - No book loading delays
- ✅ **Smooth experience** - Passages load instantly
- ✅ **Unlimited content** - Never run out of passages
- ✅ **Better variety** - Fresh content on each request

### Developer Experience
- ✅ **Easier maintenance** - Server-side content management
- ✅ **Better testing** - API can be tested independently
- ✅ **Scalability** - Add new books/sources easily
- ✅ **Analytics** - Track passage usage patterns

## 🔧 Technical Specifications

### API Requirements
- **Response Time**: <200ms for single passage
- **Caching**: 1 hour browser cache, 5 min CDN cache
- **Rate Limiting**: 100 requests/minute per IP
- **Error Handling**: Graceful degradation

### Client Caching Strategy
```javascript
const cacheConfig = {
  beginner: { maxAge: 300, maxCount: 20 },      // 5 min, 20 passages
  intermediate: { maxAge: 600, maxCount: 15 },  // 10 min, 15 passages  
  expert: { maxAge: 900, maxCount: 10 }         // 15 min, 10 passages
};
```

### Fallback Strategy
1. **Primary**: Fetch from API
2. **Secondary**: Use cached passages
3. **Tertiary**: Generate sensible-lorem locally
4. **Last Resort**: Show error with retry option

## 🚀 Deployment Plan

### Vercel Setup
```javascript
// vercel.json
{
  "functions": {
    "api/passages.js": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "s-maxage=300, stale-while-revalidate" }
      ]
    }
  ]
}
```

### Environment Variables
```
PASSAGES_CACHE_TTL=3600
RATE_LIMIT_MAX=100
SENSIBLE_LOREM_CONFIG={"maxWords": 25}
```

## 📈 Success Metrics

### Before Migration
- Initial load: 3-5 seconds
- Bundle size: 1.2MB
- Time to first passage: 5 seconds
- IndexedDB usage: 5MB

### After Migration Target
- Initial load: <1 second
- Bundle size: <200KB
- Time to first passage: <500ms
- Local storage: <1MB

## 🔒 Security Considerations

- **Rate limiting** to prevent abuse
- **Input validation** for difficulty parameters
- **CORS configuration** for API access
- **Content filtering** to ensure appropriate passages
- **Error message sanitization** to prevent information leakage

## 🧪 Testing Strategy

### API Testing
- Unit tests for passage generation
- Integration tests for full API flow
- Load testing for concurrent users
- Error scenario testing

### Client Testing
- Cache functionality testing
- Offline behavior testing
- Network failure simulation
- Performance regression testing