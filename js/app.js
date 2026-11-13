import { renderCards, highlightActiveCard } from './cards.js';
import {
  initMap, flyToMonk, showPopup, closePopup, resetMapView, setActiveMarker, selectMobileCard
} from './map.js';

let allMonksData = [];
let selectionRevision = 0;
let activeMonkId = null;

function openMonkModal(monk, index, direction = 0) {
  const modal = document.getElementById('monk-detail-modal');
  if (!modal || !monk) return;

  document.getElementById('detail-overlay')?.classList.remove('hidden');
  document.body.classList.add('monk-modal-open');
  const modalContent = modal.querySelector('.modal-content');
  if (modalContent) modalContent.scrollTop = 0;
  if (direction && window.matchMedia('(max-width: 760px)').matches) {
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
  const icon = document.getElementById('modal-monk-icon');
  const iconFrame = document.getElementById('modal-icon-frame');
  iconFrame?.classList.remove('is-missing');
  icon.onload = () => iconFrame?.classList.remove('is-missing');
  icon.onerror = () => iconFrame?.classList.add('is-missing');
  icon.src = monk.iconUrl || `./images/icons/${monk.id}.jpg`;
  const gmapsLink = document.getElementById('modal-monk-gmaps');
  gmapsLink.href = monk.gmapsUrl || '#';
  gmapsLink.hidden = !monk.gmapsUrl;

  const descContainer = document.getElementById('modal-monk-desc');
  if (Array.isArray(monk.detailSections)) {
    descContainer.replaceChildren(...monk.detailSections.map(({ heading, paragraphs }) => {
      const section = document.createElement('section');
      const title = document.createElement('h3');
      title.textContent = heading;
      section.appendChild(title);
      paragraphs.forEach((text) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        section.appendChild(paragraph);
      });
      return section;
    }));
  } else {
    const notable = monk.notable ? monk.notable.trim() : '';
    const martyrdom = monk.martyrdom ? monk.martyrdom.trim() : '';
    const paragraphs = [
      notable,
      martyrdom ? `<strong class="text-stone-700">Repose:</strong> ${martyrdom}` : ''
    ].filter(Boolean);

    descContainer.innerHTML = paragraphs.map(paragraph => `<p>${paragraph}</p>`).join('');
  }
  modal.classList.remove('hidden');
}

function openMonkDetails(monkId) {
  const index = allMonksData.findIndex((monk) => monk.id === monkId);
  if (index < 0) throw new Error(`Unknown monk requested for details: ${monkId}`);

  const monk = allMonksData[index];
  syncActiveMonkOnMobile(monkId, { syncMiniCarousel: true });
  openMonkModal(monk, index + 1);
}

export function closeMonkModal() {
  closePopup();
  closeDetailModal();
  highlightActiveCard(null);
}

function closeDetailModal({ syncMap = true } = {}) {
  const modal = document.getElementById('monk-detail-modal');
  const wasOpen = modal && !modal.classList.contains('hidden');
  if (modal) modal.classList.add('hidden');
  document.getElementById('detail-overlay')?.classList.add('hidden');
  document.body.classList.remove('monk-modal-open');
  if (syncMap && wasOpen && window.matchMedia('(max-width: 760px)').matches && activeMonkId) {
    syncActiveMonkOnMobile(activeMonkId, { syncMiniCarousel: true, flyMap: true });
  }
}

function setMobileListOpen(isOpen) {
  if (isOpen) {
    document.body.classList.remove('map-only-view');
    updateMapViewButton();
  }
  document.body.classList.toggle('mobile-list-open', isOpen);
  document.getElementById('mobile-list-toggle')?.setAttribute('aria-expanded', String(isOpen));
}

function updateMapViewButton() {
  const button = document.getElementById('reset-btn');
  const isMapOnlyView = document.body.classList.contains('map-only-view');
  if (button) {
    button.textContent = isMapOnlyView ? 'View list' : 'View map';
    button.setAttribute('aria-pressed', String(isMapOnlyView));
  }
  const mobileOverlay = document.getElementById('mobile-card-overlay');
  if (mobileOverlay) {
    mobileOverlay.inert = isMapOnlyView;
    mobileOverlay.setAttribute('aria-hidden', String(isMapOnlyView));
  }
}

function syncActiveMonkOnMobile(monkId, {
  syncMiniCarousel = true,
  syncDetailCarousel = false,
  flyMap = false,
  modalDirection = 0
} = {}) {
  const index = allMonksData.findIndex((monk) => monk.id === monkId);
  if (index < 0) throw new Error(`Unknown monk requested for mobile sync: ${monkId}`);

  const monk = allMonksData[index];
  activeMonkId = monkId;
  document.body.classList.remove('map-only-view');
  updateMapViewButton();
  setActiveMarker(monk);
  highlightActiveCard(monkId, { scroll: false });
  if (syncMiniCarousel) selectMobileCard(index);
  if (syncDetailCarousel) openMonkModal(monk, index + 1, modalDirection);
  if (flyMap) {
    void flyToMonk(monk, { duration: 450 }).catch((error) => {
      console.error(`Failed to navigate to ${monk.name}`, error);
    });
  }
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
  activeMonkId = monk.id;

  document.body.classList.remove('map-only-view');
  updateMapViewButton();
  if (!fromSwipe || !isMobile) closePopup({ notify: !keepModalOpen });
  if (!keepModalOpen) closeDetailModal({ syncMap: false });
  highlightActiveCard(monk.id, { scroll: !fromSwipe && !keepModalOpen });
  setMobileListOpen(false);

  if (fromSwipe && isMobile && !keepModalOpen) {
    syncActiveMonkOnMobile(monk.id, { syncMiniCarousel: false, flyMap: true });
    return;
  }

  if (keepModalOpen && isMobile) {
    syncActiveMonkOnMobile(monk.id, {
      syncMiniCarousel: true,
      syncDetailCarousel: true,
      modalDirection
    });
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
        (selectedMonkId) => openMonkDetails(selectedMonkId || monk.id),
        originalIndex,
        (targetIndex) => {
          if (!isMobile && popupSelectionRevision !== selectionRevision) return;
          const nextMonk = allMonksData[targetIndex];
          if (!nextMonk) return;
          if (isMobile) {
            syncActiveMonkOnMobile(nextMonk.id, { syncMiniCarousel: false, flyMap: true });
          } else {
            handleSelectMonk(nextMonk.id, { fromSwipe: true });
            popupSelectionRevision = selectionRevision;
          }
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
  const status = document.getElementById('app-status');
  const statusMessage = document.getElementById('app-status-message');
  const retryButton = document.getElementById('app-status-retry');
  const monkList = document.getElementById('monks-list');
  retryButton?.addEventListener('click', () => window.location.reload());

  try {
    const response = await fetch('./data/monks.json');
    if (!response.ok) {
      throw new Error(`Failed to load monastery data: ${response.status} ${response.statusText}`);
    }

    allMonksData = await response.json();
    if (!Array.isArray(allMonksData)) {
      throw new Error('Monastery data must be an array');
    }
  } catch (error) {
    console.error('Unable to load monastery data', error);
    if (monkList) {
      monkList.replaceChildren();
      monkList.setAttribute('aria-busy', 'false');
    }
    if (status && statusMessage) {
      status.classList.add('is-error');
      status.setAttribute('role', 'alert');
      status.setAttribute('aria-live', 'assertive');
      statusMessage.textContent = 'Monastery locations could not be loaded. Check your connection and retry.';
      retryButton?.removeAttribute('hidden');
    }
    return;
  }

  status?.classList.add('hidden');

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
    document.body.classList.toggle('map-only-view');
    updateMapViewButton();
  });
  document.getElementById('mobile-reset-btn')?.addEventListener('click', resetMap);
  document.getElementById('mobile-list-toggle')?.addEventListener('click', () => setMobileListOpen(true));
  document.getElementById('mobile-list-close')?.addEventListener('click', () => setMobileListOpen(false));

  renderFilteredCards();
  monkList?.setAttribute('aria-busy', 'false');
  if (window.matchMedia('(max-width: 760px)').matches && allMonksData[0]?.coordinates) {
    showPopup(
      allMonksData[0],
      () => {
        closeDetailModal();
        highlightActiveCard(null);
      },
      (selectedMonkId) => openMonkDetails(selectedMonkId),
      1,
      (targetIndex) => {
        const selectedMonk = allMonksData[targetIndex];
        if (selectedMonk) handleSelectMonk(selectedMonk.id, { fromSwipe: true });
      },
      allMonksData
    );
  }

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
    if (keepModalOpen) {
      syncActiveMonkOnMobile(allMonksData[nextIndex].id, {
        syncMiniCarousel: true,
        syncDetailCarousel: true,
        modalDirection: offset
      });
    } else {
      handleSelectMonk(allMonksData[nextIndex].id);
    }
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
