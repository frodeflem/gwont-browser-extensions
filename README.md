# Travian HTML Exporter Extension

This Chrome browser extension captures the HTML source of Travian game pages and uploads it to a specified external API for data analysis. It offers functionality similar to the Travco extension but was originally developed to work with a specific API maintained by the author.

While the extension was not designed for use with third-party APIs, you are welcome to adapt it for your own backend.

⚠️ Important: Use of this extension is subject to Travian Games' terms of service. This extension does not automate gameplay or send commands to the game server. It simply exports HTML for external processing.

Building is supported on Windows 11, using npm 10.2.5 and Node.js 24.11.1. It may still work on other OSes and versions.

## 🚀 Getting Started

### 1. Clone

```
git clone https://github.com/frodeflem/gwont-browser-extensions.git
cd gwont-browser-extensions
```

### 2. Build

Install dependencies and build:

```
npm i
npm run build
npm run zip
```

This will generate a `dist` folder containing the extension for supported browsers, in both zipped and unpacked formats.

## 📄 Disclaimer

This extension is an unofficial tool and is not affiliated with or endorsed by Travian Games. Use is at your own risk.
