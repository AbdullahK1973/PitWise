# Publish PitWise Legal and Support Pages

The `site/` folder is a static website with:

- `privacy.html`
- `terms.html`
- `support.html`

Before publishing:

- Replace `[Insert date]`.
- Replace `[Insert support email]`.
- Replace any `pitwise.example` references in the app/build config with the final domain.
- Have the privacy policy and terms reviewed before public launch.

## Simple Hosting Options

Any static host works:

- Netlify: drag the `site/` folder into Netlify Drop or connect the repo and set publish directory to `site`.
- Vercel: import the repo and set the output/static directory to `site`.
- GitHub Pages: publish the `site/` folder from a branch or copy it into the Pages source.
- Render Static Site: create a Static Site and set publish directory to `site`.

Expected public URLs:

```text
https://YOUR_DOMAIN/privacy.html
https://YOUR_DOMAIN/terms.html
https://YOUR_DOMAIN/support.html
```

Use those URLs in:

- `frontend/eas.json`
- `frontend/.env`
- Apple App Store Connect
- Google Play Console
