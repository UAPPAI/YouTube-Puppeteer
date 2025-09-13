const puppeteer = require("puppeteer");

(async () => {
  const searchTerm = process.env.SEARCH_TERM || "haulage trucks UK"; // Use env var or default

  console.log(`🚀 Starting YouTube search for: "${searchTerm}"`);

  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  const page = await browser.newPage();

  try {
    // Go to YouTube
    console.log("📺 Navigating to YouTube...");
    await page.goto("https://www.youtube.com", { waitUntil: "networkidle2" });

    // Handle cookie consent dialog
    console.log("🍪 Handling cookie consent...");
    try {
      // Wait a moment for any dialogs to appear
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to find and click accept button using multiple strategies
      const acceptButton = await page.evaluateHandle(() => {
        // Look for various accept button patterns
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
        
        // Fallback: look for buttons with text content
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

    // Type search term - try multiple selectors
    console.log(`🔍 Searching for: "${searchTerm}"`);
    
    // Wait for page to be fully loaded
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find and interact with the search input using a more flexible approach
    const searchSuccess = await page.evaluate((searchTerm) => {
      // Look for search input with various selectors
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
        // Focus and type in the search input
        searchInput.focus();
        searchInput.value = searchTerm;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Press Enter
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

    // Wait for results to load
    console.log("⏳ Waiting for search results...");
    await new Promise(resolve => setTimeout(resolve, 3000)); // Give time for results to load
    
    // Wait for any video element to appear
    await page.waitForSelector('ytd-video-renderer, ytd-rich-item-renderer, [id="video-title"]', { timeout: 15000 });

    // Get first video title with more comprehensive selectors
    const firstTitle = await page.evaluate(() => {
      // Try multiple selectors in order of preference
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

    // Wait a moment to see the results
    await new Promise(resolve => setTimeout(resolve, 2000));

  } catch (error) {
    console.error("❌ Error occurred:", error.message);
  } finally {
    // Close browser
    console.log("🔒 Closing browser...");
    await browser.close();
  }
})();
