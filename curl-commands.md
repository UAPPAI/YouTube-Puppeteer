# YouTube Search API - Curl Commands for n8n Testing

## 🧪 **Test Commands**

### Basic Search Test
```bash
curl -X POST http://localhost:3001/search \
  -H "Content-Type: application/json" \
  -d '{"searchTerm": "haulage trucks UK"}'
```

### PowerShell Version (Windows)
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/search" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"searchTerm":"haulage trucks UK"}'
```

### Test with Different Search Terms
```bash
# Test with different search terms
curl -X POST http://localhost:3001/search \
  -H "Content-Type: application/json" \
  -d '{"searchTerm": "cooking recipes"}'

curl -X POST http://localhost:3001/search \
  -H "Content-Type: application/json" \
  -d '{"searchTerm": "tech tutorials"}'
```

## 📋 **n8n HTTP Request Node Configuration**

### Node Settings:
- **Method**: `POST`
- **URL**: `http://localhost:3001/search`
- **Headers**: 
  - `Content-Type`: `application/json`
- **Body**: 
  ```json
  {
    "searchTerm": "{{ $json.searchTerm || 'haulage trucks UK' }}"
  }
  ```

### Expected Response:
```json
{
  "success": true,
  "searchTerm": "haulage trucks UK",
  "firstResult": "150 Tonne DAF XG Heavy Haulage Truck Walkaround",
  "fullOutput": "🚀 Starting YouTube search for: \"haulage trucks UK\"..."
}
```

## 🔧 **Health Check**
```bash
curl -X GET http://localhost:3001/health
```

## 📝 **Notes**
- Make sure your YouTube Search API server is running on port 3001
- The API will open a Chrome browser window (headless: false)
- Search results may vary as YouTube's algorithm changes
- The API handles cookie consent automatically
