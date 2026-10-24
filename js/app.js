// Главная точка входа приложения

import { renderCards, highlightActiveCard } from './cards.js';
import { initMap, focusMarker, resetMapCamera, filterMarkersVisibility } from './map.js';

let monksData = [];

function handleSelect(id, shouldFly = true) {
  highlightActiveCard(id);
  focusMarker(id, shouldFly);
}

function handleSearch(query) {
  const q = query.toLowerCase().trim();
  const filtered = monksData.filter(f => 
    f.name.toLowerCase().includes(q) ||
    f.monastery.toLowerCase().includes(q) ||
    f.georgianName.toLowerCase().includes(q) ||
    f.region.toLowerCase().includes(q) ||
    f.notable.toLowerCase().includes(q) ||
    f.martyrdom.toLowerCase().includes(q)
  );

  renderCards(filtered, monksData, (id) => handleSelect(id, true));
  filterMarkersVisibility(filtered.map(f => f.id));
}

function handleReset() {
  resetMapCamera();
  renderCards(monksData, monksData, (id) => handleSelect(id, true));
  filterMarkersVisibility(monksData.map(f => f.id));
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
}

async function start() {
  try {
    const res = await fetch('./data/monks.json');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    monksData = await res.json();
  } catch (err) {
    console.error('Ошибка загрузки monks.json:', err);
    return;
  }

  // Отрисовка списка и инициализация карты
  renderCards(monksData, monksData, (id) => handleSelect(id, true));
  initMap(monksData, (id) => handleSelect(id, false));

  // Подключение поиска и кнопки сброса
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  }

  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', handleReset);
  }
}

document.addEventListener('DOMContentLoaded', start);