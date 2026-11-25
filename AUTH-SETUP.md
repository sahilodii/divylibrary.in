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

3. In **Authentication → URL Configuration**, set the Site URL to the website origin. Add the exact local development URL and the confirmed production URL to Redirect URLs.
4. In **Authentication → Providers → Email**, enable email signups and keep email confirmation enabled. Configure the confirmation and password reset email templates and SMTP sender for your domain before inviting real users.
5. Serve the site over HTTPS in production. Keep the Supabase `service_role` secret and database credentials out of this repository and all browser files. The browser only needs the public anon/publishable key; use Row Level Security policies for any future user-owned database records.

## Member library data

Run [`supabase/migrations/202611250001_member_library.sql`](supabase/migrations/202611250001_member_library.sql) in the Supabase SQL Editor. It creates:

- `user_saved_packs`: users can read, save, and remove only their own packs, protected by Row Level Security.
- `user_pack_purchases`: users can read only their own `paid` purchase rows. Client sessions cannot create or modify purchase rows; a trusted payment webhook/server must record them after a successful payment and mark refunds as `refunded`.

The account view shows the signed-in user's verified-email status, saved packs, and confirmed purchases. Anonymous saved packs are imported into the first account that signs in on that browser, then account saves stay attached to that Supabase user and sync across devices. If the purchase table has no rows for a user, the account shows an empty state. No payment provider or purchase webhook is configured by this migration, so the existing offer buttons do not themselves create purchase records.

The site also supports account creation, email/password login, confirmation instructions, password reset, password recovery, current session display, and logout. The public publishable key may be kept in the browser; never put a service-role key, SMTP credential, payment secret, or database password in website code.
