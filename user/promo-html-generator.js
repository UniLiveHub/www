#!/usr/bin/env node

// HTML-based Promo Image Generator
// Alternative solution using HTML/CSS for better font support

const fs = require('fs');
const path = require('path');

// Load configuration
const CONFIG_PATH = path.join(__dirname, 'promo-config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// User data (replaced during build)
const USER_DATA = {
    username: 'UniLiveHub',
    inviteCode: 'ITfssi',
    profileImage: '%PROFILE_IMAGE%',
    siteUrl: 'https://unilivehub.com/user',
    preferredLanguages: '%PREFERRED_LANGUAGES%' || 'english,korea,russia'
};

// Generate CSS for a specific template
function generateCSS(language) {
    const langConfig = config.languages[language];
    const template = config.templates[language] || config.templates.default;
    
    return `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&family=Noto+Sans+SC:wght@400;700&family=Noto+Sans+JP:wght@400;700&family=Roboto:wght@400;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            width: ${config.output.width}px;
            height: ${config.output.height}px;
            overflow: hidden;
            position: relative;
            font-family: '${langConfig.font}', sans-serif;
            direction: ${langConfig.direction};
        }
        
        .background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a25 100%);
            z-index: 1;
        }
        
        .background-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${template.overlayColor};
            z-index: 2;
        }
        
        .content {
            position: relative;
            z-index: 3;
            width: 100%;
            height: 100%;
        }
        
        .logo {
            position: absolute;
            top: ${config.styles.logo.y}px;
            left: ${config.styles.logo.x}px;
            width: ${config.styles.logo.width}px;
            height: ${config.styles.logo.height}px;
            background: ${template.accentColor};
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 20px;
            color: #000;
        }
        
        .brand {
            position: absolute;
            top: ${config.styles.brand.y}px;
            left: ${config.styles.brand.x}px;
            font-size: ${config.styles.brand.fontSize}px;
            font-weight: ${config.styles.brand.fontWeight};
            color: ${config.styles.brand.color};
            text-shadow: ${config.styles.textShadow};
        }
        
        .tagline {
            position: absolute;
            top: ${template.textPosition.tagline.y}px;
            left: ${template.textPosition.tagline.x}px;
            font-size: ${template.textPosition.tagline.fontSize}px;
            color: ${config.styles.fontColors.primary};
            text-shadow: ${config.styles.textShadow};
            ${template.textPosition.tagline.align === 'center' ? 'text-align: center; width: 100%;' : ''}
        }
        
        .user-info {
            position: absolute;
            top: ${Math.min(template.textPosition.username.y, template.textPosition.inviteCode.y) - 30}px;
            left: 30px;
            right: 30px;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 10px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .avatar {
            width: ${config.styles.avatar.size}px;
            height: ${config.styles.avatar.size}px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${template.accentColor}, #00E676);
            border: ${config.styles.avatar.borderWidth}px solid ${template.accentColor};
            flex-shrink: 0;
        }
        
        .avatar img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
        }
        
        .user-details {
            flex-grow: 1;
        }
        
        .username {
            font-size: ${template.textPosition.username.fontSize}px;
            font-weight: bold;
            color: ${config.styles.fontColors.primary};
            margin-bottom: 5px;
        }
        
        .invitation-label {
            font-size: 16px;
            color: ${config.styles.fontColors.secondary};
            margin-bottom: 3px;
        }
        
        .invite-code {
            font-size: ${template.textPosition.inviteCode.fontSize}px;
            color: ${config.styles.fontColors.primary};
        }
        
        .qr-container {
            position: absolute;
            top: ${template.qrCode.y}px;
            left: ${template.qrCode.x}px;
            background: white;
            padding: 10px;
            border-radius: 8px;
        }
        
        .qr-code {
            width: ${template.qrCode.size}px;
            height: ${template.qrCode.size}px;
        }
        
        ${langConfig.direction === 'rtl' ? `
        .logo { right: ${config.styles.logo.x}px; left: auto; }
        .brand { right: ${config.styles.brand.x}px; left: auto; }
        .tagline { right: ${template.textPosition.tagline.x}px; left: auto; }
        .qr-container { right: ${template.qrCode.x}px; left: auto; }
        ` : ''}
    </style>
    `;
}

// Generate HTML for promo image
function generateHTML(language) {
    const langConfig = config.languages[language];
    const template = config.templates[language] || config.templates.default;
    
    // Generate QR code URL for embedding
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${template.qrCode.size * 2}x${template.qrCode.size * 2}&data=${encodeURIComponent(USER_DATA.siteUrl)}&color=000000&bgcolor=FFFFFF`;
    
    return `<!DOCTYPE html>
<html lang="${langConfig.locale}" dir="${langConfig.direction}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${langConfig.name} Promo - ${USER_DATA.username}</title>
    ${generateCSS(language)}
</head>
<body>
    <div class="background">
        ${template.background !== 'default-bg.jpg' ? 
            `<!-- Background image would go here -->
            <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #0a0a0f 0%, #2a1a3e 50%, #1a1a25 100%);"></div>` : 
            '<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #0a0a0f 0%, #1a1a25 100%);"></div>'}
    </div>
    <div class="overlay"></div>
    <div class="content">
        <div class="logo">UniLive</div>
        <div class="brand">UniLive</div>
        <div class="tagline">${langConfig.tagline}</div>
        
        <div class="user-info">
            <div class="avatar">
                ${USER_DATA.profileImage && !USER_DATA.profileImage.includes('%') ?
                    `<img src="${USER_DATA.profileImage}" alt="${USER_DATA.username}">` : ''}
            </div>
            <div class="user-details">
                <div class="username">${USER_DATA.username}</div>
                <div class="invitation-label">Invitation</div>
                <div class="invite-code">Code: ${USER_DATA.inviteCode}</div>
            </div>
        </div>
        
        <div class="qr-container">
            <img class="qr-code" src="${qrApiUrl}" alt="QR Code">
        </div>
    </div>
</body>
</html>`;
}

// Generate all HTML files
function generateAllHTML() {
    console.log('Generating HTML templates for promo images...');
    
    const outputDir = path.join(__dirname, 'promo-html');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const languages = USER_DATA.preferredLanguages.split(',').map(l => l.trim());
    
    for (const lang of languages) {
        if (config.languages[lang]) {
            const html = generateHTML(lang);
            const outputPath = path.join(outputDir, `promo-${lang}.html`);
            fs.writeFileSync(outputPath, html);
            console.log(`Generated: ${outputPath}`);
        }
    }
    
    // Generate capture script
    const captureScript = `#!/bin/bash
# Capture HTML as images using Chrome/Chromium headless

OUTPUT_DIR="images"
mkdir -p "$OUTPUT_DIR"

for file in promo-html/*.html; do
    if [ -f "$file" ]; then
        basename=$(basename "$file" .html)
        echo "Capturing $basename..."
        
        # Using Chrome headless to capture
        # On macOS: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome
        # On Linux: google-chrome or chromium
        
        if command -v google-chrome &> /dev/null; then
            google-chrome --headless --disable-gpu --screenshot="$OUTPUT_DIR/$basename.png" --window-size=${config.output.width},${config.output.height} "file://$(pwd)/$file"
        elif command -v chromium &> /dev/null; then
            chromium --headless --disable-gpu --screenshot="$OUTPUT_DIR/$basename.png" --window-size=${config.output.width},${config.output.height} "file://$(pwd)/$file"
        elif [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --screenshot="$OUTPUT_DIR/$basename.png" --window-size=${config.output.width},${config.output.height} "file://$(pwd)/$file"
        else
            echo "Chrome/Chromium not found. Please install Chrome or Chromium."
            exit 1
        fi
    fi
done

echo "Capture complete! Images saved to $OUTPUT_DIR/"
`;
    
    fs.writeFileSync(path.join(__dirname, 'capture-promo-images.sh'), captureScript);
    fs.chmodSync(path.join(__dirname, 'capture-promo-images.sh'), '755');
    
    console.log('\nHTML templates generated!');
    console.log('To capture as images, run: ./capture-promo-images.sh');
}

// Run if called directly
if (require.main === module) {
    generateAllHTML();
}

module.exports = { generateHTML, generateAllHTML };