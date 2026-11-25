# Divy Library account setup

The account dialog uses Supabase Auth for email and password accounts. Passwords are sent directly to Supabase over HTTPS; this site does not keep password copies or manage its own password database.

## Connect a Supabase project

1. Create a Supabase project and open **Project Settings → API**.
2. Copy the project URL and the **anon / publishable** key into `auth-config.js`:

   ```js
   window.DIVY_AUTH_CONFIG = {
     url: "https://YOUR_PROJECT_REF.supabase.co",
     anonKey: "YOUR_PUBLIC_ANON_KEY"
   };
   ```

3. In **Authentication → URL Configuration**, set the Site URL to the deployed website origin. Add the local development origin and the production website URL to Redirect URLs. For a local XAMPP site, the redirect is commonly `http://localhost` (or the exact local path/origin you use).
4. In **Authentication → Providers → Email**, enable email signups and keep email confirmation enabled. Configure the confirmation and password reset email templates and SMTP sender for your domain before inviting real users.
5. Serve the site over HTTPS in production. Keep the Supabase `service_role` secret and database credentials out of this repository and all browser files. The browser only needs the public anon/publishable key; use Row Level Security policies for any future user-owned database records.

The dialog includes account creation, email/password login, confirmation instructions, password reset, password recovery, current session display, and logout. The saved-pack list remains in this browser's local storage; accounts do not sync saved packs across devices yet.
