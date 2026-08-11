# WordFlow — Complete Cloud Version

This is the multi-user version of WordFlow.

## Stack

- Static HTML/CSS/JavaScript frontend
- Supabase Auth for accounts
- Supabase Postgres for vocabulary and progress
- Row Level Security (RLS) so each user can access only their own data

## 1. Create a Supabase project

Create a project at https://supabase.com/.

Then open **SQL Editor** and run all of `supabase.sql`.

## 2. Get the project credentials

In Supabase, open your project's API settings and copy:

- Project URL
- Publishable key

Do NOT put a secret/service-role key into the website.

## 3. Configure the frontend

Open `index.html` and replace:

YOUR_SUPABASE_URL
YOUR_SUPABASE_PUBLISHABLE_KEY

with your project's Project URL and Publishable key.

## 4. Configure authentication

In Supabase Authentication settings:

- Enable Email provider.
- Choose whether users must confirm their email.
- Add your deployed website URL to the allowed Site URL / Redirect URLs.

For example:

https://your-domain.com

If you deploy under a different URL, use that exact URL.

## 5. Deploy

Upload `index.html` to any static host.

The site has no build step.

## Features

- Real account registration
- Email/password sign-in
- Password reset
- Cloud-saved categories
- Cloud-saved words
- Add words to existing categories
- Duplicate-word protection per category
- Flashcards
- Quiz
- Correct/wrong progress
- Learned state
- Progress saved to the user's account
- Light/dark mode
- Each user sees only their own vocabulary
- Responsive desktop/mobile UI

## Security

The browser uses only the public/publishable Supabase key.
RLS policies enforce user ownership at the database level.

Never expose a Supabase secret/service-role key in `index.html`.

## Notes

The current progress model records whether a word was learned, correct answers, wrong answers, and the last review timestamp.

A future version can add spaced repetition, streaks, XP, achievements, Google login, pronunciation, admin-created public word packs, and subscriptions.


## Deploy on Vercel

### Recommended: GitHub + Vercel

1. Create a GitHub repository and upload:
   - `index.html`
   - `supabase.sql`
   - `README.md`
2. In Vercel, choose **Add New → Project** and import the GitHub repository.
3. Because this is a static site, no framework/build command is required.
4. Deploy.
5. In Supabase Authentication → URL Configuration, set the production **Site URL** to your Vercel URL and add the same URL to allowed redirect URLs.
6. Keep your Supabase URL and publishable key in `index.html` (the publishable key is intended for browser use; never put a secret/service-role key there).
7. If you later add a custom domain, update the Supabase Site URL/redirect URLs to that domain.

### Fastest option: Vercel Drop

You can also upload the project folder/ZIP directly through Vercel Drop. For long-term updates, connect the project to GitHub so pushes create deployments automatically.

### Important

This project is static and uses the Supabase browser client. Vercel Environment Variables are not automatically injected into a plain `index.html` file at runtime. If you want to keep configuration outside the HTML, convert the project to a small Vite build first. For the current static version, replacing the two public Supabase placeholders in `index.html` is the simplest setup.

The Supabase publishable/anon browser key is not a database secret; RLS is what protects user data. Never expose a service-role/secret key in the frontend.
