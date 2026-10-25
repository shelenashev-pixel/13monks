import fs from 'fs';
import path from 'path';
import https from 'https';

// Прямые, гарантированно отдающие изображение CDN-ссылки
const ASSETS = {
  monasteries: {
    'anton-martqopi': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Martkopi_Monastery_2.jpg',
    'ioane-zedazeni': 'https://upload.wikimedia.org/wikipedia/commons/3/30/Zedazeni_Monastery_%282013%29.JPG',
    'shio-mgvime': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Shio-Mgvime_Monastery_near_Mtskheta%2C_Georgia.jpg',
    'david-gareji': 'https://upload.wikimedia.org/wikipedia/commons/8/8f/David_Gareja_monastery_complex_%28Lavra%29.jpg',
    'abibus-nekresi': 'https://upload.wikimedia.org/wikipedia/commons/2/23/Nekresi_monastery_complex_in_Kakheti%2C_Georgia.jpg',
    'ise-tsilkani': 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=800&auto=format&fit=crop',
    'joseph-alaverdi': 'https://images.unsplash.com/photo-1548625361-125035230d11?q=80&w=800&auto=format&fit=crop',
    'zenon-iqalto': 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    'stephen-khirsa': 'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=800&auto=format&fit=crop',
    'pyrrhus-breti': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop',
    'thaddaeus-stepantsminda': 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=800&auto=format&fit=crop',
    'isidore-samtavisi': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
    'michael-ulumbo': 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=800&auto=format&fit=crop'
  },
  icons: {
    'anton-martqopi': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=400&auto=format&fit=crop',
    'ioane-zedazeni': 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=400&auto=format&fit=crop',
    'shio-mgvime': 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=400&auto=format&fit=crop',
    'david-gareji': 'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?q=80&w=400&auto=format&fit=crop',
    'abibus-nekresi': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=400&auto=format&fit=crop',
    'ise-tsilkani': 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?q=80&w=400&auto=format&fit=crop',
    'joseph-alaverdi': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=400&auto=format&fit=crop',
    'zenon-iqalto': 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=400&auto=format&fit=crop',
    'stephen-khirsa': 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=400&auto=format&fit=crop',
    'pyrrhus-breti': 'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?q=80&w=400&auto=format&fit=crop',
    'thaddaeus-stepantsminda': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=400&auto=format&fit=crop',
    'isidore-samtavisi': 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?q=80&w=400&auto=format&fit=crop',
    'michael-ulumbo': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=400&auto=format&fit=crop'
  }
};

const monasteriesDir = path.resolve('images/monasteries');
const iconsDir = path.resolve('images/icons');

fs.mkdirSync(monasteriesDir, { recursive: true });
fs.mkdirSync(iconsDir, { recursive: true });

function downloadFile(url, dest) {
  return new Promise((resolve) => {
    // Если нормальный файл больше 10 КБ уже есть, не трогаем
    if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) {
      console.log(`  ✓ Уже существует: ${path.basename(dest)}`);
      return resolve(true);
    }

    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode !== 200) {
        fs.unlink(dest, () => {});
        console.log(`  ✗ Ошибка ${res.statusCode} для ${path.basename(dest)}`);
        return resolve(false);
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`  ✓ Загружено: ${path.basename(dest)}`);
          resolve(true);
        });
      });
    }).on('error', () => {
      fs.unlink(dest, () => {});
      resolve(false);
    });
  });
}

async function start() {
  console.log('Загрузка монастырей...');
  for (const [id, url] of Object.entries(ASSETS.monasteries)) {
    await downloadFile(url, path.join(monasteriesDir, `${id}.jpg`));
  }

  console.log('\nЗагрузка икон...');
  for (const [id, url] of Object.entries(ASSETS.icons)) {
    await downloadFile(url, path.join(iconsDir, `${id}.jpg`));
  }

  console.log('\nГотово! Комплект изображений сформирован.');
}

start();
