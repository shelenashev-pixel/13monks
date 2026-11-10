import { renderCards, highlightActiveCard } from './cards.js';
import { initMap, flyToMonk, showPopup, closePopup, resetMapView } from './map.js';

let allMonksData = [];

// Функция открытия детального модального окна святого
function openMonkModal(monk, index) {
  const modal = document.getElementById('monk-detail-modal');
  if (!modal || !monk) return;

  document.body.classList.add('monk-modal-open');
  document.getElementById('modal-monk-index').innerText = index;
  document.getElementById('modal-monk-name').innerText = monk.name;
  document.getElementById('modal-monk-icon').src = monk.iconUrl || `./images/icons/${monk.id}.jpg`;
  const gmapsLink = document.getElementById('modal-monk-gmaps');
  gmapsLink.href = monk.gmapsUrl || '#';
  gmapsLink.hidden = !monk.gmapsUrl;
  
  // Текст описания
  const descContainer = document.getElementById('modal-monk-desc');
  descContainer.innerHTML = `
    <p>${monk.notable || ''}</p>
    <p><strong class="text-stone-700">Repose:</strong> ${monk.martyrdom || ''}</p>
  `;

  modal.classList.remove('hidden');
}

// Закрытие модального окна
export function closeMonkModal() {
  closePopup();
  closeDetailModal();
  highlightActiveCard(null);
}

function closeDetailModal() {
  const modal = document.getElementById('monk-detail-modal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('monk-modal-open');
}

function setMobileListOpen(isOpen) {
  document.body.classList.toggle('mobile-list-open', isOpen);
  document.getElementById('mobile-list-toggle')?.setAttribute('aria-expanded', String(isOpen));
}

// Единый обработчик выбора монаха (по клику на карточку или маркер)
export function handleSelectMonk(monkId, { fromSwipe = false } = {}) {
  const monk = allMonksData.find(m => m.id === monkId);
  if (!monk) return;

  const originalIndex = allMonksData.findIndex(m => m.id === monk.id) + 1;

  // 1. Подсветка в левом списке
  highlightActiveCard(monk.id);

  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  setMobileListOpen(false);

  // 2. Desktop opens details immediately; mobile shows the compact map card first.
  if (!isMobile) openMonkModal(monk, originalIndex);

  // 3. Полёт карты к монастырю и открытие карточки над маркером
  flyToMonk(monk, fromSwipe ? { duration: 450 } : undefined);
  showPopup(
    monk,
    closeMonkModal,
    () => openMonkModal(monk, originalIndex),
    originalIndex,
    (targetIndex) => {
      const nextMonk = allMonksData[targetIndex];
      if (nextMonk) handleSelectMonk(nextMonk.id, { fromSwipe: true });
    },
    allMonksData
  );
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('./data/monks.json');
  if (!response.ok) {
    throw new Error(`Failed to load monastery data: ${response.status} ${response.statusText}`);
  }

  allMonksData = await response.json();

  initMap(allMonksData, handleSelectMonk);
  renderCards(allMonksData, allMonksData, handleSelectMonk);

  const searchInput = document.getElementById('search-input');
  const counter = document.getElementById('counter');
  const renderFilteredCards = () => {
    const query = searchInput?.value.trim().toLocaleLowerCase() ?? '';
    const filteredMonks = allMonksData.filter((monk) =>
      [monk.name, monk.monastery, monk.region]
        .some((value) => value?.toLocaleLowerCase().includes(query))
    );

    renderCards(filteredMonks, allMonksData, handleSelectMonk);
    if (counter) counter.textContent = `${filteredMonks.length} Monasteries`;
  };

  if (searchInput) {
    searchInput.addEventListener('input', renderFilteredCards);
  }

  const resetMap = () => {
    if (searchInput) searchInput.value = '';
    renderFilteredCards();
    resetMapView();
    closeMonkModal();
    setMobileListOpen(false);
  };
  document.getElementById('reset-btn')?.addEventListener('click', resetMap);
  document.getElementById('mobile-reset-btn')?.addEventListener('click', resetMap);
  document.getElementById('mobile-list-toggle')?.addEventListener('click', () => setMobileListOpen(true));
  document.getElementById('mobile-list-close')?.addEventListener('click', () => setMobileListOpen(false));

  renderFilteredCards();

  // Кнопка закрытия модального окна
  const closeBtn = document.getElementById('close-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDetailModal);
  }
  document.getElementById('modal-close-action')?.addEventListener('click', closeDetailModal);
});
