
const navModeSelect = document.getElementById('nav-mode');
const searchInput = document.getElementById('search');
let currentNavMode = navModeSelect.value;
let globalData = {};

function buildLink(lat, lon) {
  if (currentNavMode === 'google') {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  }
  return `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
}

navModeSelect.addEventListener('change', () => {
  currentNavMode = navModeSelect.value;
  renderData(globalData, searchInput.value);
});

searchInput.addEventListener('input', () => {
  renderData(globalData, searchInput.value);
});

function loadData() {
  fetch('coordinates.json')
    .then(response => response.json())
    .then(data => {
      globalData = data;
      renderData(globalData, '');
    });
}

function renderData(data, filterText) {
  const container = document.getElementById('container');
  container.innerHTML = '';
  filterText = filterText.trim().toLowerCase();

  let anyResults = false;

  Object.keys(data).forEach(category => {
    const matches = data[category].filter(loc =>
      loc.name.toLowerCase().includes(filterText)
    );

    if (matches.length === 0) return;

    anyResults = true;
    const section = document.createElement('div');
    section.className = 'category';

    const title = document.createElement('h2');
    title.textContent = category;

    const ul = document.createElement('ul');
    ul.style.display = 'none';

    title.addEventListener('click', () => {
      ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
    });

    matches.forEach(loc => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = buildLink(loc.lat, loc.lon);
      a.textContent = loc.name;
      a.target = '_blank';
      li.appendChild(a);
      ul.appendChild(li);
    });

    section.appendChild(title);
    section.appendChild(ul);
    container.appendChild(section);
  });

  if (!anyResults) {
    const msg = document.createElement('div');
    msg.id = 'no-results';
    msg.textContent = 'Geen resultaten gevonden.';
    container.appendChild(msg);
  }
}

loadData();
