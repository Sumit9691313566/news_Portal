Steps to generate VAPID keys and configure backend

1. Run the generator (from backend folder):

```bash
npm run vapid:generate
```

This writes `vapid-keys.json` into the backend root and prints an .env snippet.

2. Add to your backend `.env` (backend/.env):

```
VAPID_PUBLIC_KEY=<paste publicKey>
VAPID_PRIVATE_KEY=<paste privateKey>
VAPID_CONTACT=mailto:you@yourdomain.com
FRONTEND_URL=http://localhost:5173
```

3. Restart backend server.

Notes:
- Never commit your private key to source control. Keep `.env` out of git.
- For production, use the same keys across servers so subscriptions remain valid.
