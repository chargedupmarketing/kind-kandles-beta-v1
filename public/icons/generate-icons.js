// This is a placeholder script to generate PWA icons
// In production, you would use actual branded icons

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon as a placeholder
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#14b8a6"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="#ffffff" opacity="0.9"/>
  <text x="${size/2}" y="${size/2 + 8}" text-anchor="middle" fill="#14b8a6" font-family="Arial" font-size="${size/8}" font-weight="bold">🕯️</text>
</svg>
`;

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(__dirname, filename), svg);
  console.log(`Created ${filename}`);
});

console.log('PWA icons generated! Convert these SVGs to PNG for production use.');
