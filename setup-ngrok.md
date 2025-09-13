# Setup ngrok for Cloud n8n Access

## 1. Install ngrok
```bash
# Download from https://ngrok.com/download
# Or use package manager
npm install -g ngrok
```

## 2. Start your API server
```bash
node http-server.js
```

## 3. In another terminal, expose your API
```bash
ngrok http 3001
```

## 4. Use the ngrok URL in n8n
- ngrok will give you a URL like: `https://abc123.ngrok.io`
- Use this URL in your n8n HTTP Request node instead of localhost

## 5. n8n Configuration
- **URL**: `https://abc123.ngrok.io/search`
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Body**: `{"searchTerm": "your search term"}`
