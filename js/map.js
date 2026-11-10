let mapInstance = null;
let markersMap = {};
let currentActivePopup = null;

export function initMap(monks, onMarkerClick) {
  // Координаты центра Грузии
  mapInstance = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty',
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

  // Расставляем маркеры монастырей
  monks.forEach((monk) => {
    if (!monk.coordinates) return;

    // Кастомный маркер с крестом
    const el = document.createElement('div');
    el.className = 'w-11 h-11 cursor-pointer flex items-center justify-center';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    const markerIcon = document.createElement('span');
    markerIcon.className = 'w-7 h-7 bg-stone-900 border-2 border-white rounded-full flex items-center justify-center text-white text-xs shadow-lg hover:scale-110 transition-transform';
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

// Плавный зум к выбранному монастырю
export function flyToMonk(monk, { duration } = {}) {
  if (!mapInstance || !monk || !monk.coordinates) return;

  Object.values(markersMap).forEach(({ marker, monk: markerMonk }) => {
    const markerIcon = marker.getElement().firstElementChild;
    if (markerIcon) {
      markerIcon.style.backgroundColor = markerMonk.id === monk.id ? '#a77a43' : '';
    }
  });

  const cameraOptions = {
    center: monk.coordinates,
    offset: window.innerWidth > 760 ? [Math.min(window.innerWidth * 0.33, 450), 165] : [0, 0],
    zoom: 11,
    essential: true,
    speed: 1.2
  };
  if (duration !== undefined) cameraOptions.duration = duration;
  mapInstance.flyTo(cameraOptions);
}

// Отображение всплывающей карточки над монастырем
export function showPopup(monk, onClose, onRead, index, onSwipe, monks = [monk]) {
  if (!mapInstance || !monk || !monk.coordinates) return;

  closePopup();

  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const popupContent = document.createElement('div');
  let activeIndex = -1;
  popupContent.className = isMobile ? 'mobile-monk-carousel' : 'w-[230px] bg-white rounded-2xl overflow-hidden font-sans text-stone-900 select-none';

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
          <p class="mobile-card-summary">${item.notable || item.martyrdom || ''}</p>
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
          ${monk.martyrdom || monk.notable || ''}
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
    const activeCard = popupContent.querySelector(`[data-monk-index="${activeIndex}"]`);
    let isCentering = false;
    let touchStart = null;
    const selectCard = (targetIndex) => {
      if (targetIndex === activeIndex || targetIndex < 0 || targetIndex >= monks.length) return;
      onSwipe?.(targetIndex);
    };
    const selectCenteredCard = () => {
      const cards = [...popupContent.querySelectorAll('.mobile-monk-card')];
      const center = popupContent.scrollLeft + popupContent.clientWidth / 2;
      const target = cards.reduce((closest, card) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        return Math.abs(cardCenter - center) < Math.abs(closest.offsetLeft + closest.offsetWidth / 2 - center)
          ? card
          : closest;
      }, cards[0]);
      const targetIndex = Number(target?.dataset.monkIndex);
      if (Number.isInteger(targetIndex)) selectCard(targetIndex);
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
      if (isCentering || touchStart) return;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(selectCenteredCard, 80);
    }, { passive: true });
    popupContent.addEventListener('scrollend', () => {
      if (isCentering || touchStart) return;
      clearTimeout(scrollTimer);
      selectCenteredCard();
    }, { passive: true });
    popupContent.addEventListener('touchstart', (event) => {
      if (event.touches.length !== 1 || event.target.closest('a, button')) {
        touchStart = null;
        return;
      }
      const touch = event.touches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
      clearTimeout(scrollTimer);
    }, { passive: true });
    popupContent.addEventListener('touchend', (event) => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
      selectCard(activeIndex + (deltaX < 0 ? 1 : -1));
    }, { passive: true });
    popupContent.addEventListener('touchcancel', () => {
      touchStart = null;
    }, { passive: true });

    popup.on('open', () => {
      const carousel = popupContent;
      const centerActiveCard = () => {
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
