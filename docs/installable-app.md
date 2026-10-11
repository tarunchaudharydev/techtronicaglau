# Install Techtronica as an app

The Techtronica website is configured as an installable Progressive Web App (PWA). It opens in a standalone app window after installation and uses the existing responsive website.

## Install

### Android and desktop browsers
When available, use **Install** in the Techtronica prompt. You can also open the browser menu and choose **Install app** or **Add to Home screen**.

### iPhone and iPad
1. Open the site in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen**.
4. Tap **Add**.

If no prompt appears, the browser may not support the install prompt or the site may not be available over HTTPS. Use the browser menu when it offers an install option.

## Implementation notes

- `app/manifest.ts` defines the app name, standalone display mode, start URL, colors, and icons.
- `components/PwaInstallPrompt.tsx` uses the native browser install event where available and provides Safari instructions on iOS/iPadOS.
- `public/pwa-icon.svg` is the scalable app mark; `public/logo.png` is the large raster icon.
- No service worker or offline cache is registered. The app needs a network connection; authenticated pages and society data are not copied to an offline cache.
- Authentication and role checks work the same in the installed app as in the browser.

## Verify after deployment

1. Open the deployed HTTPS site and confirm `/manifest.webmanifest` loads.
2. Confirm both icon URLs return successfully.
3. Install from the prompt or browser menu and confirm the app opens at the home page.
4. On iPhone/iPad, use Safari Share → Add to Home Screen.
5. Confirm signed-out users cannot open member pages and that sign-out clears the authenticated session.
