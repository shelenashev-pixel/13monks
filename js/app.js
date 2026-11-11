import { renderCards, highlightActiveCard } from './cards.js';
import {
  initMap, flyToMonk, showPopup, closePopup, resetMapView, setActiveMarker, selectMobileCard
} from './map.js';

let allMonksData = [];
let selectionRevision = 0;

function openMonkModal(monk, index, direction = 0) {
  const modal = document.getElementById('monk-detail-modal');
  if (!modal || !monk) return;

  document.body.classList.add('monk-modal-open');
  const modalContent = modal.querySelector('.modal-content');
  if (modalContent) modalContent.scrollTop = 0;
  if (direction) {
    const outgoingCard = modal.cloneNode(true);
    outgoingCard.removeAttribute('id');
    outgoingCard.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    outgoingCard.classList.remove('hidden', 'slide-from-next', 'slide-from-previous');
    outgoingCard.classList.add('modal-transition-outgoing');
    outgoingCard.setAttribute('aria-hidden', 'true');
    outgoingCard.inert = true;
    outgoingCard.querySelector('.modal-content')?.classList.remove('slide-from-next', 'slide-from-previous');
    outgoingCard.querySelectorAll('.modal-close, .modal-footer').forEach((element) => {
      element.remove();
    });
    outgoingCard.classList.add(direction > 0 ? 'slide-to-previous' : 'slide-to-next');
    outgoingCard.addEventListener('animationend', () => outgoingCard.remove(), { once: true });
    document.body.appendChild(outgoingCard);
    window.setTimeout(() => outgoingCard.remove(), 500);

    const animationClass = direction > 0 ? 'slide-from-next' : 'slide-from-previous';
    modal.classList.remove('slide-from-next', 'slide-from-previous');
    void modal.offsetWidth;
    modal.classList.add(animationClass);
    modal.addEventListener('animationend', () => {
      modal.classList.remove(animationClass);
    }, { once: true });
  }
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

  descContainer.innerHTML = paragraphs.map(paragraph => `<p>${paragraph}</p>`).join('');
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

function updateMapViewButton() {
  const button = document.getElementById('reset-btn');
  if (!button) return;
  const isMapOnlyView = document.body.classList.contains('map-only-view');
  button.textContent = isMapOnlyView ? 'View list' : 'View map';
  button.setAttribute('aria-pressed', String(isMapOnlyView));
}

export function handleSelectMonk(monkId, {
  fromSwipe = false,
  keepModalOpen = false,
  modalDirection = 0
} = {}) {
  const monk = allMonksData.find(m => m.id === monkId);
  if (!monk) return;

  const revision = ++selectionRevision;
  const originalIndex = allMonksData.findIndex(m => m.id === monk.id) + 1;
  const isMobile = window.matchMedia('(max-width: 760px)').matches;

  if (!fromSwipe || !isMobile) closePopup({ notify: !keepModalOpen });
  if (!keepModalOpen) closeDetailModal();
  highlightActiveCard(monk.id, { scroll: !fromSwipe && !keepModalOpen });
  setMobileListOpen(false);

  if (fromSwipe && isMobile && !keepModalOpen) {
    void flyToMonk(monk, { duration: 450 }).catch((error) => {
      console.error(`Failed to navigate to ${monk.name}`, error);
    });
    return;
  }

  if (keepModalOpen && isMobile) {
    setActiveMarker(monk);
    selectMobileCard(originalIndex - 1);
    openMonkModal(monk, originalIndex, modalDirection);
    return;
  }

  if (!isMobile || keepModalOpen) openMonkModal(monk, originalIndex, modalDirection);

  void flyToMonk(monk, fromSwipe ? { duration: 450 } : undefined)
    .then(() => {
      if (revision !== selectionRevision) return;
      let popupSelectionRevision = revision;
      showPopup(
        monk,
        () => {
          closeDetailModal();
          highlightActiveCard(null);
        },
        () => openMonkModal(monk, originalIndex),
        originalIndex,
        (targetIndex) => {
          if (popupSelectionRevision !== selectionRevision) return;
          const nextMonk = allMonksData[targetIndex];
          if (!nextMonk) return;
          handleSelectMonk(nextMonk.id, { fromSwipe: true });
          popupSelectionRevision = selectionRevision;
        },
        allMonksData
      );
    })
    .catch((error) => {
      console.error(`Failed to navigate to ${monk.name}`, error);
    });
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
    selectionRevision += 1;
    if (searchInput) searchInput.value = '';
    renderFilteredCards();
    resetMapView();
    closeMonkModal();
    setMobileListOpen(false);
    document.body.classList.remove('map-only-view');
    updateMapViewButton();
  };
  document.getElementById('reset-btn')?.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 760px)').matches) {
      document.body.classList.toggle('map-only-view');
      updateMapViewButton();
      return;
    }
    resetMap();
  });
  document.getElementById('mobile-reset-btn')?.addEventListener('click', resetMap);
  document.getElementById('mobile-list-toggle')?.addEventListener('click', () => setMobileListOpen(true));
  document.getElementById('mobile-list-close')?.addEventListener('click', () => setMobileListOpen(false));

  renderFilteredCards();

  // Кнопка закрытия модального окна
  const closeBtn = document.getElementById('close-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDetailModal);
  }
  const selectAdjacentMonk = (offset) => {
    const currentName = document.getElementById('modal-monk-name')?.textContent;
    const currentIndex = allMonksData.findIndex((monk) => monk.name === currentName);
    if (currentIndex < 0 || !allMonksData.length) return;
    const nextIndex = (currentIndex + offset + allMonksData.length) % allMonksData.length;
    const modal = document.getElementById('monk-detail-modal');
    const keepModalOpen = window.matchMedia('(max-width: 760px)').matches
      && modal
      && !modal.classList.contains('hidden');
    handleSelectMonk(allMonksData[nextIndex].id, {
      fromSwipe: keepModalOpen,
      keepModalOpen,
      modalDirection: offset
    });
  };
  document.getElementById('detail-prev')?.addEventListener('click', () => selectAdjacentMonk(-1));
  document.getElementById('detail-next')?.addEventListener('click', () => selectAdjacentMonk(1));
  const modal = document.getElementById('monk-detail-modal');
  const modalContent = modal?.querySelector('.modal-content');
  let modalSwipeStart = null;
  modalContent?.addEventListener('pointerdown', (event) => {
    if (!window.matchMedia('(max-width: 760px)').matches
      || event.pointerType !== 'touch'
      || event.button !== 0
      || event.target.closest('button, a')) return;
    modalSwipeStart = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  modalContent?.addEventListener('pointerup', (event) => {
    if (!modalSwipeStart || event.pointerType !== 'touch') return;
    const deltaX = event.clientX - modalSwipeStart.x;
    const deltaY = event.clientY - modalSwipeStart.y;
    modalSwipeStart = null;
    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    selectAdjacentMonk(deltaX < 0 ? 1 : -1);
  }, { passive: true });
  modalContent?.addEventListener('pointercancel', () => {
    modalSwipeStart = null;
  }, { passive: true });
  document.addEventListener('keydown', (event) => {
    const modal = document.getElementById('monk-detail-modal');
    if (event.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      event.preventDefault();
      closeDetailModal();
    }
  });
});
