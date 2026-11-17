# MOHH Interiors — website and CRM concept

A homepage and client CRM concept for MOHH Interiors (Hyderabad), prepared by [WebAura Creative Technologies](https://webauraindia.com).

## Pages

| File | What it is |
|------|------------|
| `index.html` | Homepage: The Regent feature, portfolio filtered by project, services, process and consultation form |
| `crm.html` | Client CRM: enquiry pipeline, follow-ups, visit calendar and quick WhatsApp replies (sample data) |
| `whatsapp.html` | Preview of the instant WhatsApp reply a new enquiry receives |

All pages are responsive and built mobile first.

## Run locally

It is a static site with no build step. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Deploy

Works as-is on GitHub Pages, Netlify or Vercel. For GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.

## Structure

- `images/` — project photos supplied by MOHH
- `js/preact.min.js` — Preact (MIT, see `js/PREACT-LICENSE`)
- `js/dc.js` — small renderer for the page templates

The CRM uses sample enquiries for demonstration; it is not connected to a database or WhatsApp yet.
