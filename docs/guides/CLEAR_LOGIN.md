# Fix Auto-Login Issue

## Problem
The website automatically logs you in because there's a stored authentication token in your browser's localStorage.

## Solution - Choose ONE of these methods:

### Method 1: Clear Browser Storage (Easiest)
1. Open your browser's Developer Tools (F12)
2. Go to the "Application" or "Storage" tab
3. Find "Local Storage" in the left sidebar
4. Click on your website URL (e.g., `http://localhost:5173`)
5. Delete these keys:
   - `token`
   - `rememberMe`
6. Refresh the page

### Method 2: Use Browser Console (Quick)
1. Open Developer Tools (F12)
2. Go to "Console" tab
3. Type this command and press Enter:
   ```javascript
   localStorage.clear(); location.reload();
   ```

### Method 3: Logout Button
1. If you can access the website, click on your profile dropdown
2. Click "Sign out" or "Logout"
3. This will clear the token automatically

### Method 4: Private/Incognito Window
1. Open a new Private/Incognito browser window
2. Navigate to your website
3. You'll start as a logged-out user

## Why This Happens
- When you login with "Remember Me" checked, the token is stored in localStorage
- The token persists even after closing the browser
- On page load, the app checks for a stored token and auto-logs you in
- This is **normal behavior** for "Remember Me" functionality

## To Prevent This in Future
- Don't check "Remember Me" when logging in
- Always use the Logout button when done
- Use Private/Incognito mode for testing logged-out state
