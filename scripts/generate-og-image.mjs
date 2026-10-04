#!/usr/bin/env node
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 630px;
      background: linear-gradient(135deg, #0b0b0d 0%, #1a1a1f 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      color: white;
      padding: 80px;
      position: relative;
      overflow: hidden;
    }
    body::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%);
      border-radius: 50%;
    }
    body::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -10%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%);
      border-radius: 50%;
    }
    .content {
      position: relative;
      z-index: 1;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 40px;
      opacity: 0.9;
    }
    .logo-dot {
      display: inline-block;
      width: 12px;
      height: 12px;
      background: #a855f7;
      border-radius: 50%;
      margin-right: 12px;
      vertical-align: middle;
    }
    h1 {
      font-size: 72px;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 24px;
      background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .accent {
      color: #a855f7;
      -webkit-text-fill-color: #a855f7;
    }
    .tagline {
      font-size: 28px;
      opacity: 0.8;
      font-weight: 400;
      margin-bottom: 48px;
    }
    .footer {
      font-size: 20px;
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div class="content">
    <div class="logo">
      <span class="logo-dot"></span>Senai Technology
    </div>
    <h1>We build what's<span class="accent"> next</span></h1>
    <div class="tagline">AI · Apps · Brand · Motion</div>
    <div class="footer">Creative technology studio</div>
  </div>
</body>
</html>
`;

async function generateOGImage() {
  let browser;
  try {
    // Try to launch chromium
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 }
    });
    
    await page.setContent(html);
    await page.waitForTimeout(100);
    
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false
    });
    
    const outputPath = join(__dirname, '..', 'public', 'og-image.png');
    writeFileSync(outputPath, screenshot);
    
    console.log('✓ Generated og-image.png');
    
    await browser.close();
  } catch (error) {
    console.error('Failed to generate OG image with Playwright:', error.message);
    console.log('Creating a fallback SVG instead...');
    
    if (browser) await browser.close();
    
    // Fallback: create an SVG that can be used
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0b0b0d"/>
      <stop offset="100%" style="stop-color:#1a1a1f"/>
    </linearGradient>
    <radialGradient id="glow1" cx="80%" cy="20%">
      <stop offset="0%" style="stop-color:rgba(168,85,247,0.15)"/>
      <stop offset="70%" style="stop-color:transparent"/>
    </radialGradient>
    <radialGradient id="glow2" cx="20%" cy="80%">
      <stop offset="0%" style="stop-color:rgba(56,189,248,0.1)"/>
      <stop offset="70%" style="stop-color:transparent"/>
    </radialGradient>
  </defs>
  
  <rect width="1200" height="630" fill="url(#bg)"/>
  <ellipse cx="960" cy="150" rx="400" ry="400" fill="url(#glow1)"/>
  <ellipse cx="240" cy="480" rx="300" ry="300" fill="url(#glow2)"/>
  
  <text x="600" y="200" font-family="system-ui,-apple-system,sans-serif" font-size="32" font-weight="600" fill="rgba(255,255,255,0.9)" text-anchor="middle">
    <tspan fill="#a855f7">●</tspan> Senai Technology
  </text>
  
  <text x="600" y="300" font-family="system-ui,-apple-system,sans-serif" font-size="72" font-weight="700" fill="#ffffff" text-anchor="middle">
    We build what's
  </text>
  <text x="600" y="380" font-family="system-ui,-apple-system,sans-serif" font-size="72" font-weight="700" fill="#a855f7" text-anchor="middle">
    next
  </text>
  
  <text x="600" y="450" font-family="system-ui,-apple-system,sans-serif" font-size="28" fill="rgba(255,255,255,0.8)" text-anchor="middle">
    AI · Apps · Brand · Motion
  </text>
  
  <text x="600" y="520" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="rgba(255,255,255,0.6)" text-anchor="middle">
    Creative technology studio
  </text>
</svg>`;
    
    const svgPath = join(__dirname, '..', 'public', 'og-image.svg');
    writeFileSync(svgPath, svg);
    console.log('✓ Created og-image.svg as fallback');
    console.log('Note: For production, convert this to PNG for better social media compatibility');
  }
}

generateOGImage().catch(console.error);
