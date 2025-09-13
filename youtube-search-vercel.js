const puppeteer = require("puppeteer");

(async () => {
  const searchTerm = process.env.SEARCH_TERM || "haulage trucks UK";

  console.log(`🚀 Starting YouTube search for: "${searchTerm}"`);

  // Launch browser with Vercel-optimized settings
  const browser = await puppeteer.launch({ 
    headless: true, // Must be headless in serverless
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });
  
  const page = await browser.newPage();

  try {
    // Go to YouTube
    console.log("📺 Navigating to YouTube...");
    await page.goto("https://www.youtube.com", { 
      waitUntil: "networkidle2",
      timeout: 15000 
    });

    // Handle cookie consent dialog
    console.log("🍪 Handling cookie consent...");
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const acceptButton = await page.evaluateHandle(() => {
        const selectors = [
          'button[aria-label*="Accept all"]',
          'button[aria-label*="Accept"]',
          'button:contains("Accept all")',
          'button:contains("I agree")',
          'button:contains("Accept")',
          '[role="button"]:contains("Accept all")',
          'yt-button-renderer:contains("Accept all")'
        ];
        
        for (const selector of selectors) {
          const button = document.querySelector(selector);
          if (button && button.offsetParent !== null) {
            return button;
          }
        }
        
        const buttons = document.querySelectorAll('button, [role="button"]');
        for (const button of buttons) {
          const text = button.textContent?.toLowerCase() || '';
          if (text.includes('accept all') || text.includes('i agree') || text.includes('accept')) {
            return button;
          }
        }
        return null;
      });
      
      if (acceptButton && acceptButton.asElement()) {
        await acceptButton.asElement().click();
        console.log("✅ Cookie consent accepted");
      } else {
        console.log("ℹ️ No cookie dialog found or already accepted");
      }
    } catch (cookieError) {
      console.log("ℹ️ Cookie dialog handling failed:", cookieError.message);
    }

    // Type search term
    console.log(`🔍 Searching for: "${searchTerm}"`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const searchSuccess = await page.evaluate((searchTerm) => {
      const selectors = [
        'input[placeholder*="Search"]',
        'input#search', 
        'input[name="search_query"]',
        'input[aria-label*="Search"]',
        'input[type="text"]',
        '#search-input',
        '.search-input'
      ];
      
      let searchInput = null;
      for (const selector of selectors) {
        searchInput = document.querySelector(selector);
        if (searchInput && searchInput.offsetParent !== null) {
          break;
        }
      }
      
      if (searchInput) {
        searchInput.focus();
        searchInput.value = searchTerm;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        });
        searchInput.dispatchEvent(enterEvent);
        
        return true;
      }
      return false;
    }, searchTerm);
    
    if (!searchSuccess) {
      throw new Error("Could not find or interact with search input element");
    }

    // Wait for results
    console.log("⏳ Waiting for search results...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.waitForSelector('ytd-video-renderer, ytd-rich-item-renderer, [id="video-title"]', { 
      timeout: 15000 
    });

    const firstTitle = await page.evaluate(() => {
      const selectors = [
        'ytd-video-renderer h3 a#video-title',
        'ytd-rich-item-renderer h3 a#video-title', 
        'a#video-title',
        'h3 a[href*="/watch"]',
        'ytd-video-renderer h3 a',
        'ytd-rich-item-renderer h3 a',
        '[id="video-title"]'
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element && element.textContent && element.textContent.trim()) {
            return element.textContent.trim();
          }
        }
      }
      return "No title found";
    });

    console.log(`✅ Search completed!`);
    console.log(`📋 First result: ${firstTitle}`);

  } catch (error) {
    console.error("❌ Error occurred:", error.message);
    throw error; // Re-throw to be caught by the API handler
  } finally {
    console.log("🔒 Closing browser...");
    await browser.close();
  }
})();
