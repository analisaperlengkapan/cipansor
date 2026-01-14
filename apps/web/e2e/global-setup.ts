  // 1. Check backend API health
  console.log('📡 Checking backend API health...');
  let backendAvailable = false;
  try {
    const response = await fetch(`${apiURL}/health`);
    if (!response.ok) {
      console.warn(`⚠️ Backend API health check failed: ${response.status}`);
    } else {
      console.log('✅ Backend API is healthy');
      backendAvailable = true;
    }
  } catch (error) {
    console.warn('⚠️ Backend API is not accessible (Mocking might be required):', error);
  }

  // 2. Check frontend is accessible
  console.log('🌐 Checking frontend accessibility...');
  try {
    const response = await fetch(baseURL);
    if (!response.ok && response.status !== 404) {
      console.warn(`⚠️ Frontend check failed: ${response.status}`);
    } else {
      console.log('✅ Frontend is accessible');
    }
  } catch (error) {
    console.warn('⚠️ Frontend is not accessible:', error);
  }

  // 3. Pre-authenticate users and save state (Only if backend is available)
  if (backendAvailable) {
    console.log('🔐 Pre-authenticating test users...');
    const browser = await chromium.launch();

    for (const [key, user] of Object.entries(testUsers)) {
      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();

      try {
        // Login
        await page.goto('/login');
        await page.getByLabel(/email/i).fill(user.email);
        await page.getByLabel(/password|kata sandi/i).fill(user.password);
        await page.getByRole('button', { name: /sign in|masuk|login/i }).click();

        // Wait for successful login
        await page.waitForURL(/dashboard/, { timeout: 15000 });

        // Save authenticated state
        await context.storageState({ path: `playwright/.auth/${key}.json` });
        console.log(`✅ Authenticated ${key} (${user.email})`);
      } catch (error) {
        console.warn(`⚠️  Failed to authenticate ${key}:`, error);
        // Don't fail the whole setup if one user fails
      } finally {
        await page.close();
        await context.close();
      }
    }

    await browser.close();
  } else {
    console.log('⚠️ Skipping pre-authentication due to unavailable backend.');
  }