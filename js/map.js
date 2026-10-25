let mapInstance = null;
let markersMap = {};
let currentActivePopup = null;

export function initMap(monks, onMarkerClick) {
  // Координаты центра Грузии
  mapInstance = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        openstreetmap: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors'
        }
      },
      layers: [{
        id: 'openstreetmap',
        type: 'raster',
        source: 'openstreetmap'
      }]
    },
    center: [44.8, 41.9],
    zoom: 7.5
  });

  mapInstance.addControl(new maplibregl.NavigationControl(), 'bottom-right');

  // Расставляем маркеры монастырей
  monks.forEach((monk) => {
    if (!monk.coordinates) return;

    // Кастомный маркер с крестом
    const el = document.createElement('div');
    el.className = 'w-7 h-7 bg-stone-900 border-2 border-white rounded-full flex items-center justify-center text-white text-xs cursor-pointer shadow-lg hover:scale-110 transition-transform';
    el.innerHTML = '✝';

    const marker = new maplibregl.Marker(el)
      .setLngLat(monk.coordinates)
      .addTo(mapInstance);

    marker.getElement().addEventListener('click', (event) => {
      event.stopPropagation();
      if (onMarkerClick) onMarkerClick(monk.id);
    });

    markersMap[monk.id] = { marker, monk };
  });

  return mapInstance;
}

// Плавный зум к выбранному монастырю
export function flyToMonk(monk) {
  if (!mapInstance || !monk || !monk.coordinates) return;

  mapInstance.flyTo({
    center: monk.coordinates,
    zoom: 11,
    essential: true,
    speed: 1.2
  });
}

// Отображение всплывающей карточки над монастырем
export function showPopup(monk) {
  if (!mapInstance || !monk || !monk.coordinates) return;

  if (currentActivePopup) {
    currentActivePopup.remove();
  }

  const popupContent = document.createElement('div');
  popupContent.className = 'w-[230px] bg-white rounded-2xl overflow-hidden font-sans text-stone-900 select-none';
  popupContent.innerHTML = `
    <div class="w-full h-32 overflow-hidden bg-stone-100">
      <img
        src="${monk.imageUrl || `./images/monasteries/${monk.id}.jpg`}"
        alt="${monk.monastery}"
        class="w-full h-full object-cover"
        onerror="this.style.display='none'"
      />
    </div>
    <div class="p-4 text-center">
      <span class="text-[11px] font-sans text-stone-400 block tracking-wide">
        ${monk.region || ''}
      </span>
      <h4 class="font-serif text-xl text-stone-900 leading-snug mt-1 mb-2 font-normal">
        ${monk.monastery}
      </h4>
      <p class="text-[11px] leading-relaxed text-stone-500 font-normal">
        ${monk.martyrdom || monk.notable || ''}
      </p>
    </div>
  `;

  currentActivePopup = new maplibregl.Popup({
    offset: 25,
    closeButton: true,
    closeOnClick: false,
    className: 'custom-monk-popup'
  })
    .setLngLat(monk.coordinates)
    .setDOMContent(popupContent)
    .addTo(mapInstance);
}

// Сброс приближения карты к общему виду
export function resetMapView() {
  if (!mapInstance) return;
  if (currentActivePopup) currentActivePopup.remove();

  mapInstance.flyTo({
    center: [44.8, 41.9],
    zoom: 7.5,
    speed: 1.2
  });
}
