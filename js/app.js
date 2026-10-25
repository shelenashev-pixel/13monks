import { renderCards, highlightActiveCard } from './cards.js';
import { flyToMonk, showPopup, closeCurrentPopup } from './map.js';

let allMonksData = [];

// Функция открытия детального модального окна святого
function openMonkModal(monk, index) {
  const modal = document.getElementById('monk-detail-modal');
  if (!modal || !monk) return;

  document.getElementById('modal-monk-index').innerText = index;
  document.getElementById('modal-monk-name').innerText = monk.name;
  document.getElementById('modal-monk-icon').src = monk.iconUrl || `./images/icons/${monk.id}.jpg`;
  
  // Текст описания
  const descContainer = document.getElementById('modal-monk-desc');
  descContainer.innerHTML = `
    <p>${monk.notable || ''}</p>
    <p><strong class="text-stone-700">Repose:</strong> ${monk.martyrdom || ''}</p>
  `;

  // Ссылка Google Maps
  const gmapsBtn = document.getElementById('modal-monk-gmaps');
  if (gmapsBtn) {
    gmapsBtn.href = monk.gmapsUrl || '#';
  }

  modal.classList.remove('hidden');
}

// Закрытие модального окна
export function closeMonkModal() {
  const modal = document.getElementById('monk-detail-modal');
  if (modal) modal.classList.add('hidden');
  highlightActiveCard(null);
  if (typeof closeCurrentPopup === 'function') {
    closeCurrentPopup();
  }
}

// Единый обработчик выбора монаха (по клику на карточку или маркер)
export function handleSelectMonk(monkId) {
  const monk = allMonksData.find(m => m.id === monkId);
  if (!monk) return;

  const originalIndex = allMonksData.findIndex(m => m.id === monk.id) + 1;

  // 1. Подсветка в левом списке
  highlightActiveCard(monk.id);

  // 2. Открытие центрального окна святого
  openMonkModal(monk, originalIndex);

  // 3. Полёт карты к монастырю и открытие карточки над маркером
  flyToMonk(monk);
  showPopup(monk);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('./data/monks.json');
  allMonksData = await response.json();

  renderCards(allMonksData, allMonksData, handleSelectMonk);

  // Кнопка закрытия модального окна
  const closeBtn = document.getElementById('close-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMonkModal);
  }
});
