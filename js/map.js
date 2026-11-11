let mapInstance = null;
let markersMap = {};
let currentActivePopup = null;

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
    const markerIcon = document.createElement('span');
    markerIcon.className = 'map-pin';
    markerIcon.textContent = '✝';
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
  if (!mapInstance || !monk || !monk.coordinates) return;

  mapInstance.resize();
  mapInstance.stop();
  setActiveMarker(monk);

  const cameraOptions = {
    center: monk.coordinates,
    offset: window.innerWidth > 760 ? [Math.min(window.innerWidth * 0.33, 450), 165] : [0, 0],
    zoom: 11,
    essential: true,
    speed: 1.2
  };
  if (duration !== undefined) cameraOptions.duration = duration;
  mapInstance.flyTo(cameraOptions);
  currentActivePopup?.setLngLat(monk.coordinates);
}

export function setActiveMarker(monk) {
  Object.values(markersMap).forEach(({ marker, monk: markerMonk }) => {
    const markerIcon = marker.getElement().querySelector('.map-pin');
    const isActive = markerMonk.id === monk?.id;
    marker.getElement().classList.toggle('is-active', isActive);
    if (markerIcon) {
      markerIcon.classList.toggle('is-active', isActive);
      markerIcon.setAttribute('aria-pressed', String(isActive));
    }
  });
}

// Отображение всплывающей карточки над монастырем
export function showPopup(monk, onClose, onRead, index, onSwipe, monks = [monk]) {
  if (!mapInstance || !monk || !monk.coordinates) return;

  closePopup();

  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const popupContent = document.createElement('div');
  let activeIndex = -1;
  popupContent.className = isMobile ? 'mobile-monk-carousel' : 'w-[230px] bg-white rounded-2xl overflow-hidden font-sans text-stone-900 select-none';

  const popupSummary = (item) => {
    const sentence = (item.notable || item.martyrdom || '').split('.').filter(Boolean)[0];
    return sentence ? `${sentence.trim()}.` : item.region || 'Featured monk';
  };

  if (isMobile) {
    popupContent.setAttribute('role', 'group');
    popupContent.setAttribute('aria-label', 'Swipe to browse monasteries');
    activeIndex = monks.findIndex((item) => item.id === monk.id);
    popupContent.innerHTML = monks.map((item, itemIndex) => `
      <article class="mobile-monk-card" data-monk-index="${itemIndex}" aria-current="${item.id === monk.id}">
        <div class="mobile-card-image">
          <img src="${item.imageUrl || `./images/monasteries/${item.id}.jpg`}" alt="${item.monastery}" onerror="this.style.display='none'" />
          <span class="mobile-card-number">${itemIndex + 1}</span>
          <button class="mobile-card-close" type="button" aria-label="Close monastery card">×</button>
        </div>
        <div class="mobile-card-content">
          <img class="mobile-card-icon" src="${item.iconUrl || `./images/icons/${item.id}.jpg`}" alt="" onerror="this.style.display='none'" />
          <h2 class="mobile-card-name">${item.name}</h2>
          <p class="mobile-card-monastery">${item.monastery}</p>
          <p class="mobile-card-summary">${popupSummary(item)}</p>
          <div class="mobile-card-actions">
            ${item.gmapsUrl ? `<a class="mobile-card-maps" href="${item.gmapsUrl}" target="_blank" rel="noopener noreferrer">Google Maps</a>` : ''}
            <button class="mobile-card-read" type="button" data-action="read">Read</button>
          </div>
        </div>
      </article>
    `).join('');
    popupContent.dataset.activeIndex = String(activeIndex);
  } else {
    popupContent.style.touchAction = 'pan-y';
    popupContent.innerHTML = `
      <div class="monk-popup-image relative w-full h-32 overflow-hidden bg-stone-100">
        <img
          src="${monk.imageUrl || `./images/monasteries/${monk.id}.jpg`}"
          alt="${monk.monastery}"
          class="w-full h-full object-cover"
          onerror="this.style.display='none'"
        />
        <span class="absolute top-2 left-3 text-white font-serif text-xl drop-shadow">${index}</span>
      </div>
      <div class="monk-popup-details p-4 text-center">
        <div class="monk-popup-title-row">
          <img class="monk-popup-icon" src="${monk.iconUrl || `./images/icons/${monk.id}.jpg`}" alt="" />
          <h4 class="monk-popup-title font-serif text-xl text-stone-900 leading-snug mt-1 mb-2 font-normal">
            ${monk.monastery}
          </h4>
          <button class="monk-popup-read" type="button">Read</button>
        </div>
        <span class="monk-popup-region text-[11px] font-sans text-stone-400 block tracking-wide">
          ${monk.region || ''}
        </span>
        <p class="monk-popup-summary text-[11px] leading-relaxed text-stone-500 font-normal">
          ${popupSummary(monk)}
        </p>
        ${monk.gmapsUrl ? `
          <a
            class="monk-popup-gmaps"
            href="${monk.gmapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Open in Google Maps</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 3h7v7M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            </svg>
          </a>
        ` : ''}
      </div>
    `;
  }

  const popup = new maplibregl.Popup({
    offset: 40,
    closeButton: !isMobile,
    closeOnClick: false,
    className: 'custom-monk-popup'
  })
    .setLngLat(monk.coordinates)
    .setDOMContent(popupContent);

  let scrollTimer;
  if (isMobile) {
    let isCentering = false;
    let isUserTouching = false;
    let hasUserScrolled = false;
    let touchStartX = 0;
    let touchStartY = 0;
    const selectCard = (targetIndex) => {
      if (targetIndex === activeIndex || targetIndex < 0 || targetIndex >= monks.length) return;
      activeIndex = targetIndex;
      popupContent.dataset.activeIndex = String(targetIndex);
      popupContent.querySelectorAll('.mobile-monk-card').forEach((card, cardIndex) => {
        card.setAttribute('aria-current', String(cardIndex === targetIndex));
      });
      onSwipe?.(targetIndex);
    };
    const selectCenteredCard = () => {
      const cards = [...popupContent.querySelectorAll('.mobile-monk-card')];
      const carouselCenter = popupContent.getBoundingClientRect().left + popupContent.clientWidth / 2;
      const target = cards.reduce((closest, card) => {
        const cardCenter = card.getBoundingClientRect().left + card.offsetWidth / 2;
        const closestCenter = closest.getBoundingClientRect().left + closest.offsetWidth / 2;
        return Math.abs(cardCenter - carouselCenter) < Math.abs(closestCenter - carouselCenter)
          ? card
          : closest;
      }, cards[0]);
      const targetIndex = Number(target?.dataset.monkIndex);
      if (Number.isInteger(targetIndex)) selectCard(targetIndex);
    };
    const settleUserScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (isCentering || isUserTouching || !hasUserScrolled) return;
        hasUserScrolled = false;
        selectCenteredCard();
      }, 150);
    };

    popupContent.querySelectorAll('.mobile-card-read').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        onRead?.();
      });
    });
    popupContent.querySelectorAll('.mobile-card-close').forEach((button) => {
      button.addEventListener('click', () => popup.remove());
    });
    popupContent.addEventListener('scroll', () => {
      if (isCentering) return;
      hasUserScrolled = true;
      settleUserScroll();
    }, { passive: true });
    popupContent.addEventListener('touchstart', (event) => {
      event.stopPropagation();
      if (event.touches.length !== 1) return;
      isUserTouching = true;
      hasUserScrolled = false;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      clearTimeout(scrollTimer);
    }, { passive: true });
    popupContent.addEventListener('touchmove', (event) => {
      event.stopPropagation();
    }, { passive: true });
    popupContent.addEventListener('touchend', (event) => {
      event.stopPropagation();
      if (!isUserTouching) return;
      isUserTouching = false;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      if (hasUserScrolled) {
        settleUserScroll();
      } else if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
        const targetIndex = activeIndex + (deltaX < 0 ? 1 : -1);
        const targetCard = popupContent.querySelector(`[data-monk-index="${targetIndex}"]`);
        if (targetCard) {
          isCentering = true;
          popupContent.scrollLeft = targetCard.offsetLeft - (popupContent.clientWidth - targetCard.offsetWidth) / 2;
          selectCard(targetIndex);
          requestAnimationFrame(() => {
            isCentering = false;
          });
        }
      }
    }, { passive: true });
    popupContent.addEventListener('touchcancel', (event) => {
      event.stopPropagation();
      if (!isUserTouching) return;
      isUserTouching = false;
      if (hasUserScrolled) settleUserScroll();
    }, { passive: true });
    popupContent.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      hasUserScrolled = true;
      settleUserScroll();
    }, { passive: true });

    popup.on('open', () => {
      const carousel = popupContent;
      const centerActiveCard = () => {
        const activeCard = carousel.querySelector(`[data-monk-index="${activeIndex}"]`);
        if (!activeCard) return;
        isCentering = true;
        const currentScrollBehavior = carousel.style.scrollBehavior;
        carousel.style.scrollBehavior = 'auto';
        carousel.scrollLeft = activeCard.offsetLeft - (carousel.clientWidth - activeCard.offsetWidth) / 2;
        carousel.style.scrollBehavior = currentScrollBehavior;
        setTimeout(() => {
          isCentering = false;
        }, 100);
      };
      requestAnimationFrame(centerActiveCard);
    });
  } else {
    popupContent.querySelector('.monk-popup-read')?.addEventListener('click', (event) => {
      event.stopPropagation();
      onRead?.();
    });

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

  currentActivePopup = popup;
  popup.on('close', () => {
    if (currentActivePopup !== popup) return;
    clearTimeout(scrollTimer);
    currentActivePopup = null;
    onClose?.();
  });
  popup.addTo(mapInstance);
}

export function closePopup() {
  const popup = currentActivePopup;
  currentActivePopup = null;
  popup?.remove();
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
