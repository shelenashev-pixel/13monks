// Модуль интерактивной карты Mapbox

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2hlbGVuYXNoZXYiLCJhIjoiY212anhlcGk0MDlyMjJ4czk2Z20yazJvdSJ9.XDfXRGzxSVT3SIbw7dYh_Q';

let mapInstance = null;
const markersRegistry = {};

export function initMap(monks, onMarkerClick) {
  if (typeof mapboxgl === 'undefined') return;
  mapboxgl.accessToken = MAPBOX_TOKEN;

  mapInstance = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: [44.95, 41.85],
    zoom: 8.5
  });

  mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

  monks.forEach(father => {
    const isMartyr = father.martyrdom.toLowerCase().startsWith('martyred');
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.id = `marker-${father.id}`;
    if (isMartyr) el.style.backgroundColor = '#991b1b';
    el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v20M7 8h10M8 15h8"/></svg>`;

    const popup = new mapboxgl.Popup({ offset: 20, closeOnClick: true }).setHTML(`
      <div>
        <div style="height: 125px; width: 100%; position: relative; background: #292524;">
          <img src="${father.imageUrl}" alt="${father.monastery}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);"></div>
          <span style="position: absolute; bottom: 8px; left: 10px; font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.95); color: #1c1917;">
            ${father.region}
          </span>
        </div>
        <div style="padding: 10px 12px 12px;">
          <h3 style="font-family: 'Cinzel', serif; font-weight: bold; font-size: 13px; color: #1c1917; margin: 0 0 2px;">${father.monastery}</h3>
          <p style="font-size: 11px; color: #78716c; font-style: italic; margin: 0 0 10px;">${father.name}</p>
          <a href="${father.gmapsUrl}" target="_blank" rel="noopener noreferrer" 
             style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 7px 10px; border-radius: 6px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 600;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <span>Google Maps Photos & 3D</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/></svg>
          </a>
        </div>
      </div>
    `);

    const marker = new mapboxgl.Marker(el)
      .setLngLat(father.coordinates)
      .setPopup(popup)
      .addTo(mapInstance);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onMarkerClick(father.id);
    });

    markersRegistry[father.id] = { marker, popup, coords: father.coordinates };
  });

  setTimeout(() => mapInstance.resize(), 200);
  window.addEventListener('resize', () => mapInstance.resize());
}

export function focusMarker(id, shouldFly = true) {
  const item = markersRegistry[id];
  if (!item || !mapInstance) return;

  Object.values(markersRegistry).forEach(({ popup }) => {
    if (popup && popup.isOpen()) popup.remove();
  });

  document.querySelectorAll('.custom-marker').forEach(m => m.classList.remove('active'));
  const el = document.getElementById(`marker-${id}`);
  if (el) el.classList.add('active');

  if (shouldFly) {
    mapInstance.flyTo({
      center: item.coords,
      zoom: 12.5,
      duration: 1400,
      essential: true
    });
  }

  setTimeout(() => {
    item.popup.addTo(mapInstance);
  }, shouldFly ? 700 : 50);
}

export function resetMapCamera() {
  if (!mapInstance) return;
  Object.values(markersRegistry).forEach(({ popup }) => {
    if (popup && popup.isOpen()) popup.remove();
  });
  document.querySelectorAll('.custom-marker').forEach(m => m.classList.remove('active'));
  mapInstance.flyTo({ center: [44.95, 41.85], zoom: 8.5, duration: 1000 });
}

export function filterMarkersVisibility(visibleIds) {
  Object.entries(markersRegistry).forEach(([id, { marker }]) => {
    marker.getElement().style.display = visibleIds.includes(id) ? 'flex' : 'none';
  });
}
