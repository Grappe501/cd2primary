# Admin access (Overlay 10)

Overlay 10 introduces an `/admin/` area that is gated by **Netlify Identity** and a **server-enforced allowlist**.

## 1) Enable Identity
In Netlify:
- Site configuration → Identity → Enable Identity

## 2) Set the admin allowlist (required)
In Netlify:
- Site configuration → Environment variables

Add:

- `ADMIN_EMAILS` = comma-separated list of admin emails

Example:
```
ADMIN_EMAILS=alice@example.com,bob@example.com
```

Optional (advanced):
- `ADMIN_SUBS` = comma-separated list of Netlify Identity user IDs (`sub` claims)

## 3) Verify
1. Deploy
2. Visit `/admin/`
3. Sign in
4. If your email is in `ADMIN_EMAILS`, you should see the Admin Dashboard stub.
   Otherwise you’ll see “Not authorized”.

## Why this approach
- The **function** enforces admin status, not just the browser.
- It’s inspectable and easy to control without introducing a database.
