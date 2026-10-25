// Модуль отрисовки и управления карточками монастырей

let onCardClickCallback = null;

export function renderCards(monks, allMonks, onSelect) {
  onCardClickCallback = onSelect;

  // Ищем контейнер по возможным id из index.html
  const container = document.getElementById('monks-list') || 
                    document.getElementById('cards-container') || 
                    document.querySelector('#sidebar .overflow-y-auto') ||
                    document.querySelector('.overflow-y-auto');

  if (!container) {
    console.error("Контейнер для карточек не найден в HTML разметке");
    return;
  }

  container.innerHTML = '';

  // Обновляем счетчик монастырей, если элемент есть
  const countBadge = document.getElementById('counter-badge') || 
                     document.getElementById('monk-count') ||
                     document.querySelector('[id*="count"]');
  if (countBadge) {
    countBadge.innerText = `${monks.length} of ${allMonks.length} Monasteries`;
  }

  if (monks.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-stone-500">
        <p class="font-serif text-lg mb-1">No monasteries found</p>
        <p class="text-xs">Try searching by another name, region, or keyword</p>
      </div>
    `;
    return;
  }

  monks.forEach((monk) => {
    // Индекс 01, 02 ... 13
    const originalIndex = allMonks.findIndex(m => m.id === monk.id) + 1;
    const formattedIndex = originalIndex < 10 ? `0${originalIndex}` : `${originalIndex}`;

    const card = document.createElement('div');
    card.id = `card-${monk.id}`;
    
    // Стили карточки по макету Figma
    card.className = `
      monk-card group relative p-6 mb-4 rounded-xl transition-all duration-200 cursor-pointer text-stone-900
      bg-white border border-transparent shadow-sm
      hover:border-stone-800 hover:shadow-md
    `.replace(/\s+/g, ' ').trim();

    card.innerHTML = `
      <div class="flex items-start gap-5 mb-5">
        <!-- Левая колонка с крупным номером и линией -->
        <div class="flex flex-col items-center flex-shrink-0 w-12">
          <span class="font-serif text-4xl leading-none tracking-tight text-stone-900 select-none">
            ${formattedIndex}
          </span>
          <div class="w-full h-[1px] bg-stone-300 mt-3 group-hover:bg-stone-800 transition-colors"></div>
        </div>

        <!-- Центр: Имя и Монастырь -->
        <div class="flex-1 text-center pr-6">
          <h3 class="font-serif text-2xl text-stone-900 leading-snug font-normal">
            ${monk.name}
          </h3>
          <p class="font-sans text-sm text-stone-600 mt-1">
            ${monk.monastery}
          </p>
        </div>
      </div>

      <!-- Описание деяний и кончины -->
      <div class="font-sans text-[13px] leading-relaxed text-stone-800">
        <p>
          ${monk.notable || ''} 
          <span class="text-stone-600">Repose: ${monk.martyrdom || ''}</span>
        </p>
      </div>

      <!-- Ссылка на карты -->
      ${monk.gmapsUrl ? `
        <div class="mt-3 pt-3 border-t border-stone-100 flex justify-end">
          <a 
            href="${monk.gmapsUrl}" 
            target="_blank" 
            rel="noopener noreferrer"
            onclick="event.stopPropagation()"
            class="text-[11px] font-sans text-stone-400 hover:text-stone-800 transition-colors flex items-center gap-1"
          >
            <span>Open in Google Maps</span>
            <span>↗</span>
          </a>
        </div>
      ` : ''}
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
 * Подсветка выбранной карточки (состояние Selected из Figma)
 */
export function highlightActiveCard(id) {
  document.querySelectorAll('.monk-card').forEach(c => {
    c.classList.remove('bg-[#f2ece1]', 'border-stone-800', 'shadow-md');
    c.classList.add('bg-white', 'border-transparent', 'shadow-sm');
  });

  const activeCard = document.getElementById(`card-${id}`);
  if (activeCard) {
    activeCard.classList.remove('bg-white', 'border-transparent', 'shadow-sm');
    activeCard.classList.add('bg-[#f2ece1]', 'border-stone-800', 'shadow-md');
    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
