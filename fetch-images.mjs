import fs from 'fs';
import path from 'path';
import https from 'https';

// Соответствие id монаха и названий статей в английской Википедии
const WIKI_PAGES = {
  'anton-martqopi': {
    monkPage: 'Anton_of_Martqopi',
    monasteryPage: 'Martqopi_Monastery'
  },
  'ioane-zedazeni': {
    monkPage: 'John_of_Zedazeni',
    monasteryPage: 'Zedazeni_Monastery'
  },
  'shio-mgvime': {
    monkPage: 'Shio_of_Mgvime',
    monasteryPage: 'Shio-Mgvime_Monastery'
  },
  'david-gareji': {
    monkPage: 'David_Garejeli',
    monasteryPage: 'David_Gareja_monastery_complex'
  },
  'abibus-nekresi': {
    monkPage: 'Abibus_of_Nekresi',
    monasteryPage: 'Nekresi'
  },
  'ise-tsilkani': {
    monkPage: 'Jesse_of_Tsilkani',
    monasteryPage: 'Tsilkani_Cathedral'
  },
  'joseph-alaverdi': {
    monkPage: 'Joseph_of_Alaverdi',
    monasteryPage: 'Alaverdi_Monastery'
  },
  'zenon-iqalto': {
    monkPage: 'Zenon_of_Iqalto',
    monasteryPage: 'Iqalto_monastery'
  },
  'stephen-khirsa': {
    monkPage: 'Stephen_of_Khirsa',
    monasteryPage: 'Khirsa_Monastery'
  },
  'pyrrhus-breti': {
    monkPage: 'Pyrrhus_of_Breti',
    monasteryPage: 'Breti'
  },
  'thaddaeus-stepantsminda': {
    monkPage: 'Thaddaeus_of_Stepantsminda',
    monasteryPage: 'Stepantsminda'
  },
  'isidore-samtavisi': {
    monkPage: 'Isidore_of_Samtavisi',
    monasteryPage: 'Samtavisi_Cathedral'
  },
  'michael-ulumbo': {
    monkPage: 'Michael_of_Ulumbo',
    monasteryPage: 'Ulumbo_Monastery'
  }
};

// Папки назначения
const iconsDir = path.resolve('images/icons');
const monasteriesDir = path.resolve('images/monasteries');

fs.mkdirSync(iconsDir, { recursive: true });
fs.mkdirSync(monasteriesDir, { recursive: true });

// Запрос к Wikipedia API для получения URL главного изображения статьи
function getWikiImageUrl(pageTitle) {
  return new Promise((resolve) => {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    const req = https.get(url, { headers: { 'User-Agent': 'MonksProjectEducational/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.thumbnail ? json.thumbnail.source : null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
  });
}

// Скачивание файла по URL
function downloadFile(url, destPath) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const file = fs.createWriteStream(destPath);
    https.get(url, { headers: { 'User-Agent': 'MonksProjectEducational/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, destPath).then(resolve);
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(true)));
    }).on('error', () => {
      fs.unlink(destPath, () => {});
      resolve(false);
    });
  });
}

async function start() {
  console.log('Начинаем автоматический поиск и скачивание изображений...\n');

  for (const [id, pages] of Object.entries(WIKI_PAGES)) {
    console.log(`[${id}]`);

    // 1. Ищем и сохраняем иконку святого
    const iconUrl = await getWikiImageUrl(pages.monkPage);
    if (iconUrl) {
      const dest = path.join(iconsDir, `${id}.jpg`);
      await downloadFile(iconUrl, dest);
      console.log(`  ✓ Икона сохранена: images/icons/${id}.jpg`);
    } else {
      console.log(`  - Икона не найдена на Wikipedia для ${pages.monkPage}`);
    }

    // 2. Ищем и сохраняем фото монастыря
    const monasteryUrl = await getWikiImageUrl(pages.monasteryPage);
    if (monasteryUrl) {
      const dest = path.join(monasteriesDir, `${id}.jpg`);
      await downloadFile(monasteryUrl, dest);
      console.log(`  ✓ Монастырь сохранен: images/monasteries/${id}.jpg`);
    } else {
      console.log(`  - Фото не найдено на Wikipedia для ${pages.monasteryPage}`);
    }
  }

  console.log('\nГотово! Все найденные изображения распределены по папкам.');
}

start();