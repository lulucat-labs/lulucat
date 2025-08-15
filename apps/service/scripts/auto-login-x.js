const { chromium } = require('playwright');

async function autoLoginTwitter(authToken) {
  let browser;
  try {
    // Launch browser
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false, // Set to true for headless mode
    });

    // Create new context
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });

    // Create new page
    const page = await context.newPage();

    // Add auth token cookie before navigating
    await context.addCookies([
      {
        name: 'auth_token',
        value: authToken,
        domain: '.x.com',
        path: '/',
        secure: true,
        sameSite: 'None',
      },
    ]);

    // Navigate to X.com
    await page.goto('https://x.com');

    // Wait for the home timeline to confirm we're logged in
    await page.waitForSelector('div[data-testid="primaryColumn"]', {
      timeout: 10000,
    });

    console.log('Successfully logged in!');

    // Keep the browser open for testing
    await page.waitForTimeout(100000);
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Usage example
const AUTH_TOKEN = 'c032330238d07e6cdd3189dc811fba101116c5a7';

// Run the function
autoLoginTwitter(AUTH_TOKEN).catch(console.error);
