# CreatorBridge AI

An AI-native creative marketplace for discovering AI filmmakers, animators, and generative creators; evaluating their portfolios and workflows; and preparing brand campaign briefs.

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite. To make a production build, run `npm.cmd run build`; the deployable static files are written to `dist/`.

### Run the backend locally

The API is a separate Node.js 22+ service in `server/`. Start PostgreSQL and Supabase Auth, copy `server/.env.example` to `server/.env`, fill the server-side settings, then run in a second PowerShell window:

```powershell
Set-Location server
npm.cmd install
npm.cmd run migrate
npm.cmd start
```

In the frontend root `.env.local`, set `VITE_API_BASE_URL=http://localhost:10000`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`, then restart Vite. Only a signed-in Supabase brand account can create or list briefs. The API checks the Supabase token and brand profile, then stores brief records in PostgreSQL. It does not report success when the API or database is unavailable.

## Marketplace flows

- Search, filter, sort, and paginate creators by specialty, AI tools, content type, location, experience, availability, and indicative budget.
- Review creator portfolios, tools/models, workflows, aspect ratios, commercial-use terms, and verification signals.
- Save creators, draft structured briefs (including an offline idea-to-brief helper), find brief-based creator matches, and record outreach and status updates.
- Submit a validated Creative Brief with project name/description, target audience, one of seven creative styles, one of six output formats, usage rights, optional INR budget, and optional image/document references. Signed-in brand submissions go through the Render-compatible Express API and are stored in PostgreSQL; the API validates every field, returns the inserted database row, and scopes reads by the verified brand ID. Duplicate clicks are guarded, and entered values remain on screen after failures. My Briefs reloads records from the API on sign-in/refresh. Brief submission never falls back to localStorage.
- Register and sign in as a creator or brand through Supabase Auth. The account panel summarizes activity for the current browser.
- Install the production app on desktop or phone as a PWA. The app-shell assets are cached for offline startup; marketplace data and external media need a connection.

Saved creators and invitation activity remain in the current browser's local storage. Demo invitations are not emailed, creator statuses are manually updated, and the prototype does not accept or transfer money.

## Supabase authentication and reference-file storage

1. The frontend `.env.local` uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for browser sign-in. These values are public client configuration; never place a database password or service-role key in a `VITE_` variable.
2. In the Supabase SQL Editor, run [`supabase/app_schema.sql`](./supabase/app_schema.sql) to create the existing Auth/profile and creator directory tables and policies. If you already ran an older version, run [`supabase/creative_brief_storage.sql`](./supabase/creative_brief_storage.sql). The current brief records themselves are in the PostgreSQL database configured for the API, not in Supabase's `creative_briefs` table.
3. The API uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only on the server to verify the bearer token and look up the user's `profiles.role`. Set the service-role key in `server/.env` locally and in Render's private environment settings. Never expose or commit it.
4. To populate the discoverable demo directory, run [`supabase/creator_profiles_demo.sql`](./supabase/creator_profiles_demo.sql) in that same Supabase project's SQL Editor. It creates `public.demo_creator_profiles`, seeds 1,000 fictional demo rows, and enables read-only access through a SELECT grant and RLS policy. The app queries this demo table; `public.creator_profiles` from `app_schema.sql` is a separate table for registered creator accounts.
5. If the app reports `PGRST205` after the table has been created, first verify the frontend's `VITE_SUPABASE_URL` points to the same Supabase project. If it does, run `notify pgrst, 'reload schema';` in that project's SQL Editor and reload the app. For a permission error, verify the seed's SELECT grant and read-only RLS policy; do not disable RLS.

The sample identities use reserved `example.test` addresses and illustrative media. They are not real people, contact methods, or usable accounts. Keep production user records separate from demo tables.

## PostgreSQL brief data model

`server/sql/schema.sql` creates the PostgreSQL `creative_briefs` table with a generated UUID, verified brand owner ID, the fields already present in the form (description, audience, style, output, content type, aspect ratio, usage rights, length, budget, deadline, requirements, reference paths), and a database-generated `created_at`. A brand/timestamp index supports retrieval. `npm run migrate` applies this idempotent schema.

The current form has no separate client-name or project-goals fields: the client is the authenticated `brand_id`, while project context/goals are captured in its existing description and additional-requirements fields. The API derives the owner from the verified Supabase session, not the request body. SQL parameters are used for inserts and reads are filtered by that brand ID. New submissions always insert a new row; no upsert or overwrite is used. Reference files continue to use the existing private Supabase Storage bucket.

## Deploy on Vercel and Render

This repository is configured as a small monorepo: Vercel serves the Vite frontend from the repository root; Render runs the Node API from `server/`. The included [`vercel.json`](./vercel.json) and [`render.yaml`](./render.yaml) record the matching build/output and backend health settings.

### Vercel frontend

1. Push the existing project to a GitHub repository. This workspace currently has no Git repository configured, so initialize one locally, review the files, and push to a repository you control. Check that `.env`, `.env.local`, and `server/.env` are not staged; `.gitignore` excludes them.
2. In Vercel, import that repository. Set the root directory to `./`, framework preset to **Vite**, build command to `npm run build`, and output directory to `dist`.
3. Add `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY` as Vercel environment variables for Preview and Production. The API base URL is public; the Supabase publishable key is not a database secret.
4. Deploy. Add the resulting exact Vercel origin to Render's `FRONTEND_ORIGINS` and to Supabase Auth's redirect/site URL allow list, then redeploy the Render service if its CORS value changed.

### Render API and PostgreSQL

1. In Render, create a managed PostgreSQL database. Use its **internal** connection string for a web service in the same Render region; set `DATABASE_SSL=false` for that internal connection. For an external TLS connection, set `DATABASE_SSL=true` and use the provider's secure connection string.
2. Create a Render Web Service from the same GitHub repository. Set root directory to `server`, runtime to Node, build command to `npm ci`, start command to `npm run migrate && npm start`, and health-check path to `/health`. The idempotent migration runs at service startup, when Render's private PostgreSQL network is available. `render.yaml` contains these service settings.
3. Set Render environment variables: `DATABASE_URL` (from the managed PostgreSQL database), `DATABASE_SSL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server secret only), `FRONTEND_ORIGINS` (comma-separated exact Vercel origins), and `NODE_ENV=production`. The service needs no Supabase database password or service-role credential in the browser.
4. After deployment, Render supplies the actual public service URL. Verify `https://<your-render-service>.onrender.com/health` returns `{"status":"ok","database":"connected"}`. Set that actual URL as Vercel's `VITE_API_BASE_URL`, then redeploy the frontend.

### Production verification

1. Open the Vercel HTTPS site and sign in with a brand account.
2. Submit a brief with a unique test project name. The success summary is rendered only after the API returns the inserted PostgreSQL row and its generated ID/timestamp.
3. Confirm persistence through `GET https://<your-render-service>.onrender.com/api/creative-briefs` while authenticated (the route requires the signed-in brand bearer token) or inspect the Render PostgreSQL database:

```sql
select id, brand_id, title, project_description, target_audience, created_at
from creative_briefs
order by created_at desc
limit 10;
```

4. Refresh the Vercel page, check **My briefs**, and submit a second unique project; both rows should remain. Check Render logs and browser console for request failures. This workspace cannot deploy or verify those hosted services without your GitHub, Vercel, Render, and Supabase account access.

## Install on desktop and phone

Deploy the `dist/` directory to an HTTPS host first; installation on another device cannot use your computer's `localhost` address. On supported browsers, use the **Install app** button or the browser's install control.

- **Windows/macOS/Chromebook:** Open the hosted site in Chrome or Edge and select the install control in the address bar or browser menu.
- **Android:** Open the hosted site in Chrome, then choose **Install app** or **Add to Home screen** from the browser menu.
- **iPhone/iPad:** Open the hosted site in Safari, tap **Share**, choose **Add to Home Screen**, and confirm.

## Deployment and production requirements

No public hosting account, production domain, payment-provider credentials, or server-side payment verifier is configured in this workspace. This project is ready to build as a static web/PWA app, but it has not been deployed publicly. Real payments require a merchant account and trusted server-side order creation, signature verification, authenticated webhooks, idempotent records, and production security review. Real creator uploads require Supabase Storage buckets and policies. Do not represent local demo invitations as contracts, email delivery, or payments.

## Verify

```powershell
npm.cmd run lint
npm.cmd run build
```
