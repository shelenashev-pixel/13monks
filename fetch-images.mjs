import fs from 'fs';
import path from 'path';
import https from 'https';

// Имена файлов на Викискладе (Wikimedia Commons)
const FILES = {
  monasteries: {
    'anton-martqopi': 'Martkopi_Monastery_2.jpg',
    'ioane-zedazeni': 'Zedazeni_Monastery_(2013).JPG',
    'shio-mgvime': 'Shio-Mgvime_Monastery_near_Mtskheta,_Georgia.jpg',
    'david-gareji': 'David_Gareja_monastery_complex_(Lavra).jpg',
    'abibus-nekresi': 'Nekresi_monastery_complex_in_Kakheti,_Georgia.jpg',
    'ise-tsilkani': 'Tsilkani_Cathedral.JPG',
    'joseph-alaverdi': 'Alaverdi_Cathedral_(2012).JPG',
    'zenon-iqalto': 'Ikalto_Monastery,_Georgia.jpg',
    'stephen-khirsa': 'Khirsa_Monastery.jpg',
    'pyrrhus-breti': 'Breti_Church.JPG',
    'thaddaeus-stepantsminda': 'Gergeti_Trinity_Church_(2011).JPG',
    'isidore-samtavisi': 'Samtavisi_Cathedral_2008.jpg',
    'michael-ulumbo': 'Ali_Church_Surami.JPG'
  },
  icons: {
    'anton-martqopi': 'Anton_of_Martqopi.jpg',
    'ioane-zedazeni': 'John_of_Zedazeni.jpg',
    'shio-mgvime': 'Shio_Mgvimeli.jpg',
    'david-gareji': 'David_Garejeli.jpg',
    'abibus-nekresi': 'Abibus_of_Nekresi.jpg',
    'ise-tsilkani': 'Jesse_of_Tsilkani.jpg',
    'joseph-alaverdi': 'Joseph_of_Alaverdi.jpg',
    'zenon-iqalto': 'Zenon_of_Iqalto.jpg',
    'stephen-khirsa': 'Stephen_of_Khirsa.jpg',
    'pyrrhus-breti': 'Thirteen_Assyrian_Fathers_fresco_detail.jpg',
    'thaddaeus-stepantsminda': 'Thaddaeus_of_Stepantsminda.jpg',
    'isidore-samtavisi': 'Isidore_of_Samtavisi.jpg',
    'michael-ulumbo': 'Michael_of_Ulumbo.jpg'
  }
};

const USER_AGENT = 'GeorgianMonksEducationalProject/1.0 (contact@example.com)';

// Получение прямой рабочей ссылки на изображение через API Commons
function getDirectUrl(filename) {
  return new Promise((resolve) => {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
    
    https.get(apiUrl, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          const fileUrl = pages[pageId]?.imageinfo?.[0]?.url;
          resolve(fileUrl || null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// Загрузка файла с обработкой редиректов
function download(url, dest) {
  return new Promise((resolve) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) {
      console.log(`  ✓ Уже существует: ${path.basename(dest)}`);
      return resolve(true);
    }

    if (!url) return resolve(false);

    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode !== 200) {
        fs.unlink(dest, () => {});
        console.log(`  ✗ HTTP ${res.statusCode} для ${path.basename(dest)}`);
        return resolve(false);
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`  ✓ Скачано: ${path.basename(dest)}`);
          resolve(true);
        });
      });
    }).on('error', () => {
      fs.unlink(dest, () => {});
      resolve(false);
    });
  });
}

async function run() {
  const monasteriesDir = path.resolve('images/monasteries');
  const iconsDir = path.resolve('images/icons');

  console.log('Загрузка монастырей...');
  for (const [id, filename] of Object.entries(FILES.monasteries)) {
    const dest = path.join(monasteriesDir, `${id}.jpg`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) {
      console.log(`  ✓ Уже существует: ${id}.jpg`);
      continue;
    }
    const directUrl = await getDirectUrl(filename);
    await download(directUrl, dest);
  }

  console.log('\nЗагрузка икон...');
  for (const [id, filename] of Object.entries(FILES.icons)) {
    const dest = path.join(iconsDir, `${id}.jpg`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) {
      console.log(`  ✓ Уже существует: ${id}.jpg`);
      continue;
    }
    const directUrl = await getDirectUrl(filename);
    await download(directUrl, dest);
  }

  console.log('\nГотово! Все изображения сохранены.');
}

run();