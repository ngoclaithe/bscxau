import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, '../public/images');

async function optimizeImages() {
    const files = fs.readdirSync(imagesDir);

    for (const file of files) {
        const filePath = path.join(imagesDir, file);
        const ext = path.extname(file).toLowerCase();

        if (['.png', '.jpg', '.jpeg'].includes(ext)) {
            const baseName = path.basename(file, ext);
            const webpPath = path.join(imagesDir, `${baseName}.webp`);

            // Skip if WebP already exists
            if (fs.existsSync(webpPath)) {
                console.log(`Skipping ${file} - WebP exists`);
                continue;
            }

            try {
                const stats = fs.statSync(filePath);
                console.log(`Processing ${file} (${(stats.size / 1024).toFixed(1)}KB)...`);

                // Create optimized WebP version
                await sharp(filePath)
                    .webp({
                        quality: 80,
                        effort: 6
                    })
                    .toFile(webpPath);

                const webpStats = fs.statSync(webpPath);
                const savings = ((1 - webpStats.size / stats.size) * 100).toFixed(1);
                console.log(`  -> ${baseName}.webp (${(webpStats.size / 1024).toFixed(1)}KB, ${savings}% smaller)`);

            } catch (err) {
                console.error(`Error processing ${file}:`, err.message);
            }
        }
    }

    // Create optimized logo version
    const logoPath = path.join(imagesDir, 'logo.png');
    const logoOptPath = path.join(imagesDir, 'logo-optimized.webp');

    if (fs.existsSync(logoPath) && !fs.existsSync(logoOptPath)) {
        console.log('Creating optimized logo...');
        await sharp(logoPath)
            .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 85 })
            .toFile(logoOptPath);

        const optStats = fs.statSync(logoOptPath);
        console.log(`  -> logo-optimized.webp (${(optStats.size / 1024).toFixed(1)}KB)`);
    }

    console.log('\nDone! Image optimization complete.');
}

optimizeImages().catch(console.error);
