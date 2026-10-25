let onCardClickCallback = null;

export function renderCards(monks, allMonks, onSelect) {
  onCardClickCallback = onSelect;

  const container = document.getElementById('monks-list') || 
                    document.getElementById('cards-container') || 
                    document.querySelector('.overflow-y-auto');

  if (!container) return;
  container.innerHTML = '';

  monks.forEach((monk) => {
    const originalIndex = allMonks.findIndex(m => m.id === monk.id) + 1;

    const card = document.createElement('div');
    card.id = `card-${monk.id}`;
    
    // Стили Default и Hover
    card.className = `
      monk-card group relative p-3.5 mb-2 rounded-2xl transition-all duration-200 cursor-pointer text-stone-900
      bg-white/80 backdrop-blur-sm border border-stone-200/60 shadow-sm
      hover:border-stone-800 hover:bg-white hover:shadow-md
    `.replace(/\s+/g, ' ').trim();

    card.innerHTML = `
      <div class="flex items-center gap-3">
        <!-- Номер -->
        <span class="font-serif text-2xl text-stone-900 w-6 text-center select-none flex-shrink-0">
          ${originalIndex}
        </span>

        <!-- Медальон иконы -->
        <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-stone-100 border border-stone-200">
          <img 
            src="${monk.iconUrl || `./images/icons/${monk.id}.jpg`}" 
            alt="${monk.name}" 
            class="w-full h-full object-cover"
            onerror="this.style.display='none'"
          />
        </div>

        <!-- Имя и монастырь -->
        <div class="flex-1 min-w-0 pr-1">
          <h3 class="font-serif text-base text-stone-900 leading-snug truncate font-normal">
            ${monk.name}
          </h3>
          <p class="font-sans text-[11px] text-stone-500 truncate mt-0.5">
            ${monk.monastery}
          </p>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      if (onCardClickCallback) {
        onCardClickCallback(monk.id);
      }
    });

    container.appendChild(card);
  });
}

/**
 * Подсветка активной карточки (пергаментный фон)
 */
export function highlightActiveCard(id) {
  document.querySelectorAll('.monk-card').forEach(c => {
    c.classList.remove('bg-[#f2ece1]', 'border-stone-800', 'shadow-md');
    c.classList.add('bg-white/80', 'border-stone-200/60', 'shadow-sm');
  });

  if (!id) return;

  const activeCard = document.getElementById(`card-${id}`);
  if (activeCard) {
    activeCard.classList.remove('bg-white/80', 'border-stone-200/60', 'shadow-sm');
    activeCard.classList.add('bg-[#f2ece1]', 'border-stone-800', 'shadow-md');
    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
