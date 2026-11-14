let mapInstance = null;
let markersMap = {};
let currentActivePopup = null;
let currentMobileCardOverlay = null;
let currentMobileCardOnClose = null;
let currentMobileCardCleanup = null;
let currentMobileCardSelect = null;

export function initMap(monks, onMarkerClick) {
  mapInstance = new maplibregl.Map({
    container: 'map',
    style: './assets/i7nro2p20%20(1).json',
    center: [44.8, 41.9],
    zoom: 7.5,
    attributionControl: false
  });

  mapInstance.addControl(new maplibregl.NavigationControl(), 'bottom-right');
  mapInstance.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
  mapInstance.once('load', () => {
    const attribution = mapInstance.getContainer().querySelector('.maplibregl-ctrl-attrib');
    if (attribution?.classList.contains('maplibregl-compact')) {
      attribution.classList.remove('maplibregl-compact-show');
      attribution.removeAttribute('open');
    }
  });

  monks.forEach((monk) => {
    if (!monk.coordinates) return;

    const el = document.createElement('div');
    el.className = 'map-pin-wrap';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-pressed', 'false');
    const markerIcon = document.createElement('span');
    markerIcon.className = 'map-pin';
    markerIcon.innerHTML = '<i class="icon icon-cross" aria-hidden="true"></i>';
    el.appendChild(markerIcon);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(monk.coordinates)
      .addTo(mapInstance);
    marker.getElement().setAttribute('aria-label', `Show ${monk.name} on map`);

    const selectMarker = (event) => {
      event.stopPropagation();
      onMarkerClick?.(monk.id);
    };
    marker.getElement().addEventListener('click', selectMarker);
    marker.getElement().addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      selectMarker(event);
    });

    markersMap[monk.id] = { marker, monk };
  });

  return mapInstance;
}

export function flyToMonk(monk, { duration } = {}) {
  if (!mapInstance || !monk || !monk.coordinates) return Promise.resolve();

  mapInstance.stop();
  mapInstance.resize();
  setActiveMarker(monk);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cameraOptions = {
    center: monk.coordinates,
    offset: window.innerWidth > 760 ? [Math.min(window.innerWidth * 0.33, 450), 165] : [0, 0],
    zoom: 11,
    essential: !prefersReducedMotion,
    duration: prefersReducedMotion ? 0 : duration ?? 850
  };

  return new Promise((resolve) => {
    const startFlight = () => {
      const finishFlight = () => resolve();
      mapInstance.once('moveend', finishFlight);
      mapInstance.flyTo(cameraOptions);
      currentActivePopup?.setLngLat(monk.coordinates);
      if (!mapInstance.isMoving()) {
        mapInstance.off('moveend', finishFlight);
        resolve();
      }
    };

    if (mapInstance.isStyleLoaded()) {
      startFlight();
    } else {
      mapInstance.once('load', startFlight);
    }
  });
}

export function setActiveMarker(monk) {
  Object.values(markersMap).forEach(({ marker, monk: markerMonk }) => {
    const markerIcon = marker.getElement().querySelector('.map-pin');
    const isActive = markerMonk.id === monk?.id;
    marker.getElement().classList.toggle('is-active', isActive);
    if (markerIcon) {
      markerIcon.classList.toggle('is-active', isActive);
    }
    marker.getElement().setAttribute('aria-pressed', String(isActive));
  });
}

// Отображение всплывающей карточки над монастырем
export function showPopup(monk, onClose, onRead, index, onSwipe, monks = [monk]) {
  if (!mapInstance || !monk || !monk.coordinates) return;

  closePopup({ notify: false });

  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const popupContent = document.createElement('div');
  let activeIndex = -1;
  popupContent.className = isMobile ? 'mobile-monk-carousel' : 'place-card-wrap';

  if (isMobile) {
    popupContent.setAttribute('role', 'group');
    popupContent.setAttribute('aria-label', 'Swipe to browse monasteries');
    activeIndex = monks.findIndex((item) => item.id === monk.id);
    popupContent.innerHTML = monks.map((item, itemIndex) => `
      <article class="mobile-monk-card" data-monk-index="${itemIndex}" aria-current="${item.id === monk.id}">
        <div class="mobile-card-image">
          <img src="${item.imageUrl || `./images/monasteries/${item.id}.jpg`}" alt="${item.monastery}" onerror="this.style.display='none'" />
          <span class="mobile-card-number">${itemIndex + 1}</span>
          ${item.gmapsUrl ? `
            <a class="mobile-card-location" href="${item.gmapsUrl}" target="_blank" rel="noopener noreferrer" aria-label="Open ${item.monastery} in Google Maps">
              <i class="icon icon-map-pin" aria-hidden="true"></i>
            </a>
          ` : ''}
        </div>
        <img class="mobile-card-icon" src="${item.iconUrl || `./images/icons/${item.id}.jpg`}" alt="" onerror="this.style.display='none'" />
        <div class="mobile-card-content">
          <h2 class="mobile-card-name">${item.name}</h2>
          <p class="mobile-card-monastery">${item.monastery}</p>
          <div class="mobile-card-actions">
            <button class="mobile-card-read" type="button" data-action="read" data-monk-id="${item.id}">Read more</button>
          </div>
        </div>
      </article>
    `).join('');
    popupContent.dataset.activeIndex = String(activeIndex);
  } else {
    popupContent.style.touchAction = 'pan-y';
    popupContent.innerHTML = `
      <article class="place-card">
        <div class="place-card-image">
          <img
            src="${monk.imageUrl || `./images/monasteries/${monk.id}.jpg`}"
            alt="${monk.monastery}"
            onerror="this.style.display='none'"
          />
        </div>
        <div class="place-card-body">
          <div class="place-card-text">
            <h4 class="place-card-title">${monk.monastery}</h4>
            <span class="place-card-region">${monk.region || ''}</span>
          </div>
          ${monk.gmapsUrl ? `
            <a
              class="monk-popup-gmaps"
              href="${monk.gmapsUrl}"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Open in Google Maps</span>
              <i class="icon icon-map-pin" aria-hidden="true"></i>
            </a>
          ` : ''}
        </div>
      </article>
      <button class="place-card-close" type="button" aria-label="Close">
        <i class="icon icon-close" aria-hidden="true"></i>
      </button>
    `;
  }

  const popup = isMobile
    ? null
    : new maplibregl.Popup({
      offset: 40,
      closeButton: true,
      closeOnClick: false,
      className: 'custom-monk-popup'
    })
      .setLngLat(monk.coordinates)
      .setDOMContent(popupContent);

  let scrollTimer;
  if (isMobile) {
    let isMobileOverlayActive = true;
    let isProgrammaticScroll = true;
    let programmaticScrollTimer;
    let programmaticScrollRevision = 0;
    const selectCard = (targetIndex) => {
      if (targetIndex === activeIndex || targetIndex < 0 || targetIndex >= monks.length) return;
      activeIndex = targetIndex;
      popupContent.dataset.activeIndex = String(targetIndex);
      popupContent.querySelectorAll('.mobile-monk-card').forEach((card, cardIndex) => {
        card.setAttribute('aria-current', String(cardIndex === targetIndex));
      });
      onSwipe?.(targetIndex);
    };
    const centerCard = (targetIndex) => {
      const card = popupContent.querySelector(`[data-monk-index="${targetIndex}"]`);
      if (!card) return;
      const carouselRect = popupContent.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const targetScrollLeft = popupContent.scrollLeft + cardRect.left - carouselRect.left
        - (popupContent.clientWidth - cardRect.width) / 2;

      isProgrammaticScroll = true;
      clearTimeout(programmaticScrollTimer);
      popupContent.scrollLeft = targetScrollLeft;
      const currentScroll = ++programmaticScrollRevision;
      const carouselCenter = popupContent.getBoundingClientRect().left + popupContent.clientWidth / 2;
      const cardCenter = card.getBoundingClientRect().left + card.offsetWidth / 2;
      if (Math.abs(cardCenter - carouselCenter) < 1) {
        isProgrammaticScroll = false;
      } else {
        programmaticScrollTimer = setTimeout(() => {
          if (currentScroll === programmaticScrollRevision) isProgrammaticScroll = false;
        }, 150);
      }
    };
    const selectCenteredCard = () => {
      const cards = [...popupContent.querySelectorAll('.mobile-monk-card')];
      if (!cards.length) return;
      const carouselCenter = popupContent.getBoundingClientRect().left + popupContent.clientWidth / 2;
      const target = cards.reduce((closest, card) => {
        const cardCenter = card.getBoundingClientRect().left + card.offsetWidth / 2;
        const closestCenter = closest.getBoundingClientRect().left + closest.offsetWidth / 2;
        return Math.abs(cardCenter - carouselCenter) < Math.abs(closestCenter - carouselCenter)
          ? card
          : closest;
      }, cards[0]);
      let targetIndex = Number(target?.dataset.monkIndex);
      if (!Number.isInteger(targetIndex)) return;
      if (Math.abs(targetIndex - activeIndex) > 1) {
        targetIndex = activeIndex + Math.sign(targetIndex - activeIndex);
        centerCard(targetIndex);
      }
      selectCard(targetIndex);
    };
    const centerActiveCard = () => {
      centerCard(activeIndex);
    };
    const selectMobileCard = (targetIndex) => {
      if (targetIndex < 0 || targetIndex >= monks.length) return;
      if (targetIndex !== activeIndex) {
        activeIndex = targetIndex;
        popupContent.dataset.activeIndex = String(targetIndex);
        popupContent.querySelectorAll('.mobile-monk-card').forEach((card, cardIndex) => {
          card.setAttribute('aria-current', String(cardIndex === targetIndex));
        });
      }
      centerCard(targetIndex);
    };
    const settleUserScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (!isMobileOverlayActive || isProgrammaticScroll) return;
        selectCenteredCard();
      }, 150);
    };

    popupContent.querySelectorAll('.mobile-card-read').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const monkId = event.currentTarget.dataset.monkId;
        const targetIndex = monks.findIndex((item) => item.id === monkId);
        const targetMonk = monks[targetIndex];
        if (!targetMonk) throw new Error(`Unknown monk on mobile card: ${monkId}`);
        onRead?.(monkId, targetIndex, targetMonk);
      });
    });
    popupContent.addEventListener('scroll', () => {
      if (!isMobileOverlayActive) return;
      if (isProgrammaticScroll) {
        const activeCard = popupContent.querySelector(`[data-monk-index="${activeIndex}"]`);
        if (activeCard) {
          const carouselRect = popupContent.getBoundingClientRect();
          const cardRect = activeCard.getBoundingClientRect();
          const centered = Math.abs(
            cardRect.left + cardRect.width / 2 - (carouselRect.left + popupContent.clientWidth / 2)
          ) < 1;
          if (centered) {
            clearTimeout(programmaticScrollTimer);
            isProgrammaticScroll = false;
          }
        }
        return;
      }
      settleUserScroll();
    }, { passive: true });
    popupContent.addEventListener('scrollend', () => {
      if (!isMobileOverlayActive) return;
      clearTimeout(scrollTimer);
      if (isProgrammaticScroll) {
        clearTimeout(programmaticScrollTimer);
        isProgrammaticScroll = false;
        return;
      }
      selectCenteredCard();
    }, { passive: true });
    const mobileOverlay = document.getElementById('mobile-card-overlay');
    if (!mobileOverlay) throw new Error('Missing #mobile-card-overlay');
    mobileOverlay.replaceChildren(popupContent);
    mobileOverlay.hidden = false;
    currentMobileCardOverlay = mobileOverlay;
    currentMobileCardOnClose = onClose;
    currentMobileCardSelect = selectMobileCard;
    currentMobileCardCleanup = () => {
      isMobileOverlayActive = false;
      clearTimeout(scrollTimer);
      clearTimeout(programmaticScrollTimer);
      if (currentMobileCardSelect === selectMobileCard) currentMobileCardSelect = null;
    };
    requestAnimationFrame(centerActiveCard);
  } else {
    let swipeStart = null;
    popupContent.addEventListener('touchstart', (event) => {
      if (event.touches.length !== 1 || event.target.closest('a, button')) return;
      const touch = event.touches[0];
      swipeStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    popupContent.addEventListener('touchend', (event) => {
      if (!swipeStart) return;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - swipeStart.x;
      const deltaY = touch.clientY - swipeStart.y;
      swipeStart = null;

      if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
      onSwipe?.(index - 1 + (deltaX < 0 ? 1 : -1));
    }, { passive: true });
    popupContent.addEventListener('touchcancel', () => {
      swipeStart = null;
    }, { passive: true });
  }

  if (popup) {
    currentActivePopup = popup;
    popupContent.querySelector('.place-card-close')?.addEventListener('click', () => popup.remove());
    popup.on('close', () => {
      if (currentActivePopup !== popup) return;
      clearTimeout(scrollTimer);
      currentActivePopup = null;
      onClose?.();
    });
    popup.addTo(mapInstance);
  }
}

export function selectMobileCard(index) {
  currentMobileCardSelect?.(index);
}

export function closePopup({ notify = true } = {}) {
  const popup = currentActivePopup;
  currentActivePopup = null;
  popup?.remove();

  const mobileOverlay = currentMobileCardOverlay;
  const onClose = currentMobileCardOnClose;
  const cleanup = currentMobileCardCleanup;
  currentMobileCardOverlay = null;
  currentMobileCardOnClose = null;
  currentMobileCardCleanup = null;
  cleanup?.();
  if (mobileOverlay) {
    mobileOverlay.replaceChildren();
    mobileOverlay.hidden = true;
    if (notify) onClose?.();
  }
}

// Сброс приближения карты к общему виду
export function resetMapView() {
  if (!mapInstance) return;
  closePopup();

  mapInstance.flyTo({
    center: [44.8, 41.9],
    zoom: 7.5,
    speed: 1.2
  });
}
