# Supabase Setup

1. Create or open a Supabase project.
2. Open the SQL editor and run `supabase.schema.sql`.
3. Copy your project URL and publishable key or anon public key.
4. Either paste them into `config.js`:

```js
window.DO_SUPABASE_CONFIG = {
  url: "https://your-project.supabase.co",
  anonKey: "your-publishable-or-anon-public-key"
};
```

Or open the app, go to `Me` -> `Backend`, paste both values, and save.

5. Use `Me` to join or sign in.

Notes:
- The anon key is designed to be public in browser apps. Row-level security in `supabase.schema.sql` protects user data.
- All database objects are namespaced with `do_task_bracket_v1_` so they do not collide with existing Supabase tables, functions, triggers, indexes, or policies.
- If you ran an earlier draft of this schema, it may have created `do_*` tables. The app no longer uses those names. Leave them alone unless you have checked they contain no data you need.
- Tasks and proof are private to the signed-in user.
- Public profile links expose reputation metrics and proof entries only.
- Support signals require a signed-in Supabase user when the backend is configured; otherwise the app falls back to share/import links.
