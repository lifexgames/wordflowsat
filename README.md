# WordFlow — updated Vercel project

Includes the existing vocabulary app plus:
- mobile bottom navigation
- New Test
- Convert uploaded PDF/PNG/JPG/DOCX/TXT into interactive SAT practice
- Generate new SAT-style tests from study material
- My Tests
- saved scores/review in Supabase

Run `tests.sql` once in Supabase.

Vercel Environment Variables:
- OPENAI_API_KEY
- OPENAI_MODEL (e.g. gpt-5)
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY

Never expose the OpenAI secret key in frontend code.
