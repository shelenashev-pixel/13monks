let onCardClickCallback = null;

export function renderCards(monks, allMonks, onSelect, emptyState = null) {
  onCardClickCallback = onSelect;

  const container = document.getElementById('monks-list') || 
                    document.getElementById('cards-container') || 
                    document.querySelector('.overflow-y-auto');

  if (!container) return;
  container.innerHTML = '';

  if (!monks.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const title = emptyState?.title || 'No monasteries found';
    const message = emptyState?.message || 'Try another name or region.';
    empty.innerHTML = `
      <div class="empty-state-card">
        <h3>${title}</h3>
        <p>${message}</p>
        ${emptyState?.onAction ? `<button type="button" class="empty-state-action">${emptyState.actionLabel || 'Clear search'}</button>` : ''}
      </div>
    `;
    const actionButton = empty.querySelector('.empty-state-action');
    actionButton?.addEventListener('click', () => emptyState.onAction?.());
    container.appendChild(empty);
    return;
  }

  monks.forEach((monk) => {
    const originalIndex = allMonks.findIndex(m => m.id === monk.id) + 1;

    const card = document.createElement('div');
    card.id = `card-${monk.id}`;
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

export function highlightActiveCard(id, { scroll = true } = {}) {
  document.querySelectorAll('.monk-card').forEach((card) => {
    card.removeAttribute('aria-current');
    card.classList.remove('is-active');
  });

  if (!id) return;

  const activeCard = document.getElementById(`card-${id}`);
  if (activeCard) {
    activeCard.setAttribute('aria-current', 'true');
    activeCard.classList.add('is-active');
    if (scroll) activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
