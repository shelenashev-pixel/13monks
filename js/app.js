import { renderCards, highlightActiveCard } from './cards.js';
import { initMap, flyToMonk, showPopup, closePopup, resetMapView } from './map.js';

let allMonksData = [];

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

  const descContainer = document.getElementById('modal-monk-desc');
  const notable = monk.notable ? monk.notable.trim() : '';
  const martyrdom = monk.martyrdom ? monk.martyrdom.trim() : '';
  const paragraphs = [
    notable,
    martyrdom ? `<strong class="text-stone-700">Repose:</strong> ${martyrdom}` : ''
  ].filter(Boolean);

  descContainer.innerHTML = paragraphs.join('');
  modal.classList.remove('hidden');
}

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

export function handleSelectMonk(monkId, { fromSwipe = false } = {}) {
  const monk = allMonksData.find(m => m.id === monkId);
  if (!monk) return;

  const originalIndex = allMonksData.findIndex(m => m.id === monk.id) + 1;
  const isMobile = window.matchMedia('(max-width: 760px)').matches;

  closeDetailModal();
  highlightActiveCard(monk.id, { scroll: !fromSwipe });
  setMobileListOpen(false);

  if (fromSwipe && isMobile) {
    flyToMonk(monk, { duration: 450 });
    return;
  }

  flyToMonk(monk, fromSwipe ? { duration: 450 } : undefined);
  showPopup(
    monk,
    () => {
      closeDetailModal();
      highlightActiveCard(null);
    },
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

    if (!filteredMonks.length) {
      renderCards(filteredMonks, allMonksData, handleSelectMonk, {
        title: 'No monasteries found',
        message: 'Try another monk, monastery, or region.',
        actionLabel: 'Clear search',
        onAction: () => {
          if (searchInput) searchInput.value = '';
          renderFilteredCards();
        }
      });
      if (counter) counter.textContent = '0 monasteries';
      return;
    }

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
  document.addEventListener('keydown', (event) => {
    const modal = document.getElementById('monk-detail-modal');
    if (event.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      event.preventDefault();
      closeDetailModal();
    }
  });
});
