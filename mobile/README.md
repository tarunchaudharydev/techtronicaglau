# Techtronica Mobile

React Native app using Expo SDK 58. It lives in this separate folder so native development stays separate from the production website deployment.

## Current scope

The first mobile slice includes a native navigation shell, Clerk hosted sign-in and sign-up, account display, and Supabase-backed clubs, upcoming events, and verified internship listings. It uses the same Clerk instance, Supabase project, schema, and row-level security policies as the website.

This is not yet full feature parity with the website. Member and admin workflows—including applications, registrations, attendance, notifications, role and position management, membership review, invitations, and content administration—still need mobile screens. See [FEATURES.md](FEATURES.md) for an explicit coverage list.

## Requirements

- Node.js 22.13 or newer
- npm
- Xcode 26.4+ for iOS builds; Android Studio and Android SDK 37 for Android builds
- A Clerk native app configured for this app’s bundle/package identifiers
- Existing Techtronica Clerk and Supabase configuration

## Setup

From the repository root:

~~~sh
cp mobile/.env.example mobile/.env.local
cd mobile
npm install
npx expo install --fix
npx expo start --dev-client
~~~

Set these in mobile/.env.local:

- EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: publishable key for the same Clerk instance as the website.
- EXPO_PUBLIC_SUPABASE_URL: URL for the same Supabase project as the website.
- EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Supabase publishable key used by the website.

Never use CLERK_SECRET_KEY, SUPABASE_SECRET_KEY, a service-role key, or CRON_SECRET in this app. They are server-only. Register the app as a native application in Clerk and configure its callback before sign-in testing. Clerk’s secure token cache stores the mobile session. Supabase requests receive the Clerk session token through the supported accessToken callback, preserving existing RLS as the permission boundary.

Clerk hosted sign-in needs a development build configured with native callbacks. Build with npm run android or npm run ios.

## Commands

~~~sh
npm run start
npm run android
npm run ios
npm run typecheck
~~~

Expo SDK 58 targets React Native 0.88 and React 19.3. Use npx expo install for Expo SDK packages and commit the generated package-lock.json with future dependency changes.

## Data and privacy

The app reads website records through Supabase using the same project. Private records depend on the same RLS policies and the authenticated Clerk identity. The app does not ship privileged keys or treat hidden UI as authorization. Do not cache private records beyond a user's session without a privacy review.
