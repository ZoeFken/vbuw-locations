
const navModeSelect = document.getElementById('nav-mode');
let currentNavMode = navModeSelect.value;

function buildLink(lat, lon) {
  if (currentNavMode === 'google') {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  }
  return `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
}

navModeSelect.addEventListener('change', () => {
  currentNavMode = navModeSelect.value;
  document.getElementById('container').innerHTML = '';
  loadData(); // rebuild UI
});

function loadData() {
  fetch('coordinates.json')
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById('container');
      Object.keys(data).forEach(category => {
        const section = document.createElement('div');
        section.className = 'category';

        const title = document.createElement('h2');
        title.textContent = category;

        const ul = document.createElement('ul');
        ul.style.display = 'none'; // standaard ingeklapt

        title.addEventListener('click', () => {
          ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
        });

        data[category].forEach(loc => {
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
    });
}

loadData();
