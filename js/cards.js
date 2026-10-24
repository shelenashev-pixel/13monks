// Модуль работы с карточками монастырей

export function renderCards(list, allMonks, onSelectCallback) {
  const sidebar = document.getElementById('monks-list');
  const counter = document.getElementById('counter');
  if (!sidebar) return;

  sidebar.innerHTML = '';
  if (counter) counter.innerText = `${list.length} of ${allMonks.length} Monasteries`;

  if (list.length === 0) {
    sidebar.innerHTML = '<p class="text-center text-xs text-stone-500 py-8">No matching monks or monasteries found.</p>';
    return;
  }

  list.forEach(father => {
    const isMartyr = father.martyrdom.toLowerCase().startsWith('martyred');
    const card = document.createElement('article');
    card.id = `card-${father.id}`;
    card.className = "p-3.5 rounded-xl border bg-white cursor-pointer shadow-sm hover:shadow-md hover:border-amber-500 transition duration-150 border-stone-200/90 text-xs";

    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div>
          <div class="flex items-center gap-1.5 mb-1">
            <span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isMartyr ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-stone-100 text-stone-700 border border-stone-200'}">
              ${father.region}
            </span>
            ${isMartyr ? '<span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-800">Hieromartyr</span>' : ''}
          </div>
          <h2 class="font-serif font-bold text-sm text-stone-900 transition">
            ${father.name}
          </h2>
          <div class="text-[11px] text-stone-500 italic mb-2">
            <span>${father.georgianName}</span> • <span class="font-semibold text-amber-800 not-italic">${father.monastery}</span>
          </div>
        </div>
        <button class="p-1.5 rounded-lg bg-stone-100 text-stone-500 hover:text-amber-800 shrink-0" title="Fly to location">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </button>
      </div>
      <p class="text-stone-600 leading-relaxed mt-1 mb-2">
        ${father.notable}
      </p>
      <div class="pt-2 border-t border-stone-100 text-[11px] ${isMartyr ? 'text-red-900 font-medium' : 'text-stone-500'}">
        <strong>Repose:</strong> ${father.martyrdom}
      </div>
    `;

    card.addEventListener('click', () => onSelectCallback(father.id));
    sidebar.appendChild(card);
  });
}

export function highlightActiveCard(id) {
  document.querySelectorAll('#monks-list article').forEach(el => {
    el.classList.remove('ring-2', 'ring-amber-700', 'bg-amber-50/40', 'border-amber-500');
  });
  const activeCard = document.getElementById(`card-${id}`);
  if (activeCard) {
    activeCard.classList.add('ring-2', 'ring-amber-700', 'bg-amber-50/40', 'border-amber-500');
    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}