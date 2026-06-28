# Cong.ltd

Cong.ltd personal studio static website.
Cong.ltd 个人工作室静态网站。

## Pages
页面说明：

- `index.html`: studio homepage，工作室首页
- `tools.html`: small tools, including QR generation and finance quick calculation，小工具页面，包含二维码生成和财务快速计算
- `preowned.html`: preowned items，二手物品页面

## Project Structure
项目结构说明：

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
本地预览方式：

Open `index.html` directly in a browser, or run a local static server:
可以直接在浏览器中打开 `index.html`，或者运行本地静态服务器：

```bash
python -m http.server 8000
```

Then visit `http://127.0.0.1:8000/`.
然后访问 `http://127.0.0.1:8000/`。

## Cloudflare Pages
Cloudflare Pages 部署说明：

This is a plain static site. Use these settings:
这是一个纯静态站点，建议使用以下配置：

- Framework preset: `None`，框架预设选择 `None`
- Build command: leave empty，构建命令留空
- Build output directory: `/`，构建输出目录填写 `/`
- Root directory: repository root，根目录使用仓库根目录

The QR tool and Excel parsing tool are hosted locally in `assets/vendor/`.
二维码工具和 Excel 解析工具已改为本地托管，位于 `assets/vendor/`。
二维码工具通过 jsDelivr 加载 `qrcode-generator`。
