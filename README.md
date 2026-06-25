# Cong.ltd

Cong.ltd personal studio static website.

## Pages

- `index.html`: studio homepage
- `tools.html`: small tools, including QR generation and finance quick calculation
- `preowned.html`: preowned items

## Project Structure

```text
.
├── index.html
├── tools.html
├── preowned.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
├── CNAME
├── _headers
├── _redirects
├── LICENSE
└── README.md
```

## Local Preview

Open `index.html` directly in a browser, or run a local static server:

```bash
python -m http.server 8000
```

Then visit `http://127.0.0.1:8000/`.

## Cloudflare Pages

This is a plain static site. Use these settings:

- Framework preset: `None`
- Build command: leave empty
- Build output directory: `/`
- Root directory: repository root

The QR tool loads `qrcode-generator` from jsDelivr.
