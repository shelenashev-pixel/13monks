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
    card.className = 'monk-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <span class="card-number">${originalIndex}</span>
      <span class="card-icon-frame">
        <img
          src="${monk.iconUrl || `./images/icons/${monk.id}.jpg`}"
          alt=""
          onerror="this.remove()"
        />
      </span>
      <span class="card-copy">
        <h3>${monk.name}</h3>
        <p>${monk.monastery}</p>
      </span>
    `;

    card.addEventListener('click', () => {
      if (onCardClickCallback) {
        onCardClickCallback(monk.id);
      }
    });
    card.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && onCardClickCallback) {
        event.preventDefault();
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
  document.querySelectorAll('.monk-card').forEach((card) => {
    card.removeAttribute('aria-current');
  });

  if (!id) return;

  const activeCard = document.getElementById(`card-${id}`);
  if (activeCard) {
    activeCard.setAttribute('aria-current', 'true');
    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
