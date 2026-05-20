#!/usr/bin/env node
/**
 * fix-paths.js
 *
 * Faz 9d — Mobile /m/ PWA deploy fix.
 *
 * Expo'nun `experiments.baseUrl: "/m"` ayarı yalnızca bundler çıktılarını
 * (`_expo/static/...` JS chunks) prefix'ler. Statik HTML <link> tag'leri
 * (manifest, icons, favicon, apple-touch-icon) `/m/` prefix'i almaz ve
 * /m/manifest.json yerine /manifest.json'a istek atar → 404 → PWA install
 * çalışmaz.
 *
 * Bu script `expo export --output-dir ../frontend/public/m` sonrası çalışır
 * ve üretilen tüm HTML dosyalarındaki kök-relatif statik asset yollarını
 * `/m/` ile prefix'ler.
 */

const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'm');
const BASE_URL = '/m';

// Yalnızca açıkça bilinen, kök-relatif statik asset path'leri.
// Bundler çıktıları (/m/_expo/...) ZATEN doğru olduğu için dokunulmaz.
const REPLACEMENTS = [
  // PWA manifest — kritik
  { from: /href="\/manifest\.json"/g, to: `href="${BASE_URL}/manifest.json"` },
  // PWA + favicon icon'ları
  { from: /href="\/icon-192\.png"/g, to: `href="${BASE_URL}/icon-192.png"` },
  { from: /href="\/icon-512\.png"/g, to: `href="${BASE_URL}/icon-512.png"` },
  { from: /href="\/apple-touch-icon\.png"/g, to: `href="${BASE_URL}/apple-touch-icon.png"` },
  { from: /href="\/favicon\.png"/g, to: `href="${BASE_URL}/favicon.png"` },
  { from: /href="\/favicon\.ico"/g, to: `href="${BASE_URL}/favicon.ico"` },
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  if (!fs.existsSync(TARGET_DIR)) {
    console.error(`[fix-paths] HATA: ${TARGET_DIR} bulunamadı. Önce expo export çalıştırın.`);
    process.exit(1);
  }

  const htmlFiles = walk(TARGET_DIR);
  console.log(`[fix-paths] ${htmlFiles.length} HTML dosyası bulundu, /m/ prefix uygulanıyor...`);

  let totalChanges = 0;
  let filesChanged = 0;

  for (const file of htmlFiles) {
    const original = fs.readFileSync(file, 'utf8');
    let updated = original;
    let fileChanges = 0;

    for (const { from, to } of REPLACEMENTS) {
      const matches = updated.match(from);
      if (matches) {
        fileChanges += matches.length;
        updated = updated.replace(from, to);
      }
    }

    if (updated !== original) {
      fs.writeFileSync(file, updated, 'utf8');
      filesChanged += 1;
      totalChanges += fileChanges;
      const rel = path.relative(TARGET_DIR, file);
      console.log(`  ✓ ${rel} — ${fileChanges} replacement(s)`);
    }
  }

  console.log(
    `[fix-paths] Tamamlandı: ${filesChanged}/${htmlFiles.length} dosya güncellendi, toplam ${totalChanges} replacement.`
  );
}

main();
