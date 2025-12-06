#!/usr/bin/env node

// Promo Image Generator for UniLive
// Generates personalized promotional images with language-specific overlays

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const QRCode = require('qrcode');

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

// Register fonts
function registerFonts() {
    const fontsDir = path.join(__dirname, 'fonts');
    
    // Map of font files to register
    const fontMap = {
        'Inter': 'Inter-Regular.ttf',
        'Noto Sans KR': 'NotoSansKR-Regular.ttf',
        'Noto Sans Arabic': 'NotoSansArabic-Regular.ttf',
        'Noto Sans SC': 'NotoSansSC-Regular.ttf',
        'Noto Sans JP': 'NotoSansJP-Regular.ttf',
        'Roboto': 'Roboto-Regular.ttf'
    };
    
    for (const [family, file] of Object.entries(fontMap)) {
        const fontPath = path.join(fontsDir, file);
        if (fs.existsSync(fontPath)) {
            registerFont(fontPath, { family });
        }
    }
}

// Generate QR code as data URL
async function generateQRCode(url, size = 200) {
    try {
        return await QRCode.toDataURL(url, {
            width: size,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
    } catch (err) {
        console.error('QR code generation error:', err);
        return null;
    }
}

// Draw text with shadow
function drawTextWithShadow(ctx, text, x, y, options = {}) {
    const {
        fontSize = 24,
        fontFamily = 'Inter',
        color = '#FFFFFF',
        align = 'left',
        shadow = true,
        fontWeight = 'normal'
    } = options;
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    
    if (shadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    }
    
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

// Draw rounded rectangle
function drawRoundedRect(ctx, x, y, width, height, radius, fillColor) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
}

// Generate promo image for a specific language
async function generatePromoImage(language) {
    const langConfig = config.languages[language];
    const template = config.templates[language] || config.templates.default;
    const { width, height } = config.output;
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    try {
        // Load and draw background
        const bgPath = path.join(__dirname, 'backgrounds', template.background);
        if (fs.existsSync(bgPath)) {
            const background = await loadImage(bgPath);
            ctx.drawImage(background, 0, 0, width, height);
        } else {
            // Fallback gradient background
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#0a0a0f');
            gradient.addColorStop(1, '#1a1a25');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }
        
        // Apply overlay
        ctx.fillStyle = template.overlayColor;
        ctx.fillRect(0, 0, width, height);
        
        // Draw logo
        const logoPath = path.join(__dirname, 'images', 'unilive-logo.png');
        if (fs.existsSync(logoPath)) {
            const logo = await loadImage(logoPath);
            ctx.drawImage(
                logo,
                config.styles.logo.x,
                config.styles.logo.y,
                config.styles.logo.width,
                config.styles.logo.height
            );
        }
        
        // Draw brand name
        drawTextWithShadow(
            ctx,
            config.styles.brand.text,
            config.styles.brand.x,
            config.styles.brand.y,
            {
                fontSize: config.styles.brand.fontSize,
                fontFamily: langConfig.font,
                color: config.styles.brand.color,
                fontWeight: config.styles.brand.fontWeight
            }
        );
        
        // Draw tagline
        drawTextWithShadow(
            ctx,
            langConfig.tagline,
            template.textPosition.tagline.x,
            template.textPosition.tagline.y,
            {
                fontSize: template.textPosition.tagline.fontSize,
                fontFamily: langConfig.font,
                color: config.styles.fontColors.primary,
                align: template.textPosition.tagline.align
            }
        );
        
        // Draw user info background
        const userInfoY = Math.min(
            template.textPosition.username.y,
            template.textPosition.inviteCode.y
        ) - 20;
        drawRoundedRect(
            ctx,
            30,
            userInfoY - 10,
            width - 60,
            180,
            10,
            'rgba(0, 0, 0, 0.6)'
        );
        
        // Draw avatar
        const avatarX = 50;
        const avatarY = userInfoY + 20;
        const avatarSize = config.styles.avatar.size;
        
        // Avatar placeholder or image
        ctx.save();
        ctx.beginPath();
        ctx.arc(
            avatarX + avatarSize / 2,
            avatarY + avatarSize / 2,
            avatarSize / 2,
            0,
            Math.PI * 2
        );
        ctx.closePath();
        ctx.clip();
        
        if (USER_DATA.profileImage && !USER_DATA.profileImage.includes('%')) {
            const profileImg = await loadImage(USER_DATA.profileImage);
            ctx.drawImage(profileImg, avatarX, avatarY, avatarSize, avatarSize);
        } else {
            // Gradient placeholder
            const gradient = ctx.createRadialGradient(
                avatarX + avatarSize / 2,
                avatarY + avatarSize / 2,
                0,
                avatarX + avatarSize / 2,
                avatarY + avatarSize / 2,
                avatarSize / 2
            );
            gradient.addColorStop(0, template.accentColor);
            gradient.addColorStop(1, '#00E676');
            ctx.fillStyle = gradient;
            ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        }
        ctx.restore();
        
        // Avatar border
        ctx.strokeStyle = template.accentColor;
        ctx.lineWidth = config.styles.avatar.borderWidth;
        ctx.beginPath();
        ctx.arc(
            avatarX + avatarSize / 2,
            avatarY + avatarSize / 2,
            avatarSize / 2,
            0,
            Math.PI * 2
        );
        ctx.stroke();
        
        // Draw username
        drawTextWithShadow(
            ctx,
            USER_DATA.username,
            template.textPosition.username.x,
            template.textPosition.username.y,
            {
                fontSize: template.textPosition.username.fontSize,
                fontFamily: langConfig.font,
                color: config.styles.fontColors.primary,
                fontWeight: 'bold'
            }
        );
        
        // Draw "Invitation" text
        drawTextWithShadow(
            ctx,
            'Invitation',
            template.textPosition.inviteCode.x,
            template.textPosition.inviteCode.y - 5,
            {
                fontSize: 16,
                fontFamily: langConfig.font,
                color: config.styles.fontColors.secondary
            }
        );
        
        // Draw invite code
        drawTextWithShadow(
            ctx,
            `Code: ${USER_DATA.inviteCode}`,
            template.textPosition.inviteCode.x,
            template.textPosition.inviteCode.y,
            {
                fontSize: template.textPosition.inviteCode.fontSize,
                fontFamily: langConfig.font,
                color: config.styles.fontColors.primary
            }
        );
        
        // Generate and draw QR code
        const qrDataUrl = await generateQRCode(USER_DATA.siteUrl, template.qrCode.size * 2);
        if (qrDataUrl) {
            const qrImage = await loadImage(qrDataUrl);
            
            // QR background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(
                template.qrCode.x - 10,
                template.qrCode.y - 10,
                template.qrCode.size + 20,
                template.qrCode.size + 20
            );
            
            ctx.drawImage(
                qrImage,
                template.qrCode.x,
                template.qrCode.y,
                template.qrCode.size,
                template.qrCode.size
            );
        }
        
        // Save image
        const outputDir = path.join(__dirname, 'images');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const outputPath = path.join(outputDir, `promo-${language}.png`);
        const buffer = canvas.toBuffer('image/png', { quality: config.output.quality / 100 });
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`Generated: ${outputPath}`);
        return outputPath;
        
    } catch (error) {
        console.error(`Error generating image for ${language}:`, error);
        return null;
    }
}

// Generate images for all specified languages
async function generateAllImages() {
    console.log('UniLive Promo Image Generator');
    console.log('============================');
    
    // Register fonts
    registerFonts();
    
    // Parse preferred languages
    const languages = USER_DATA.preferredLanguages.split(',').map(l => l.trim());
    
    console.log(`Generating images for: ${languages.join(', ')}`);
    console.log(`User: ${USER_DATA.username}`);
    console.log(`Invite Code: ${USER_DATA.inviteCode}`);
    
    const results = [];
    
    for (const lang of languages) {
        if (config.languages[lang]) {
            console.log(`\nGenerating ${lang} version...`);
            const result = await generatePromoImage(lang);
            if (result) {
                results.push({ language: lang, path: result });
            }
        } else {
            console.warn(`Language '${lang}' not found in configuration`);
        }
    }
    
    // Create manifest
    const manifest = {
        generated: new Date().toISOString(),
        user: USER_DATA.username,
        inviteCode: USER_DATA.inviteCode,
        images: results
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'images', 'promo-manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    
    console.log('\nGeneration complete!');
    console.log(`Total images: ${results.length}`);
}

// Run if called directly
if (require.main === module) {
    generateAllImages().catch(console.error);
}

module.exports = { generatePromoImage, generateAllImages };