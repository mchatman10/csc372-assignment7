const API = '/jokebook';
const $ = sel => document.querySelector(sel);

function makeJokeElement({ setup, delivery, category }) {
  const div = document.createElement('div');
  div.classList.add('joke');
  const s = document.createElement('div');
  s.classList.add('setup');
  s.textContent = setup;
  const d = document.createElement('div');
  d.classList.add('delivery');
  d.textContent = ` ${delivery}${category ? ` (${category})` : ''}`;
  div.append(s, d);
  return div;
}

function renderJoke(container, joke) {
  container.textContent = '';
  if (joke) container.append(makeJokeElement(joke));
}

function renderJokeList(list, jokes) {
  list.textContent = '';
  jokes.forEach(j => {
    const li = document.createElement('li');
    li.classList.add('joke');
    li.append(makeJokeElement(j));
    list.append(li);
  });
}

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function loadRandom() {
  const box = document.querySelector('.random-joke');
  box.textContent = '';
  try {
    const joke = await fetchJSON(`${API}/random`);
    renderJoke(box, joke);
  } catch (err) {
    const p = document.createElement('p');
    p.textContent = err.message;
    p.classList.add('bad');
    box.append(p);
  }
}

async function loadCategories() {
  try {
    const { categories } = await fetchJSON(`${API}/categories`);
    const list = document.querySelector('.category-list');
    list.textContent = '';
    categories.forEach(cat => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.classList.add('btn');
      btn.textContent = cat;
      btn.addEventListener('click', () => fetchCategory(cat));
      li.append(btn);
      list.append(li);
    });
  } catch (err) {
    alert(err.message);
  }
}

async function fetchCategory(category, limit) {
  const title = document.querySelector('.jokes-title');
  const list = document.querySelector('.jokes-list');
  list.textContent = '';
  try {
    const url = new URL(`${API}/category/${encodeURIComponent(category)}`, window.location.origin);
    if (limit) url.searchParams.set('limit', limit);
    const { jokes, source } = await fetchJSON(url);
    title.textContent = `Jokes in '${category}' ${source === 'external-imported' ? '(imported)' : ''}`;
    renderJokeList(list, jokes);
  } catch (err) {
    title.textContent = 'Jokes';
    const li = document.createElement('li');
    li.textContent = err.message;
    li.classList.add('bad');
    list.append(li);
  }
}

document.querySelector('.btn-load-categories').addEventListener('click', loadCategories);
document.querySelector('.btn-random').addEventListener('click', loadRandom);

document.querySelector('.search-form').addEventListener('submit', e => {
  e.preventDefault();
  const category = document.querySelector('.search-input').value.trim();
  const limit = Number(document.querySelector('.search-limit').value) || undefined;
  if (category) fetchCategory(category, limit);
});

document.querySelector('.add-form').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.currentTarget;
  const status = document.querySelector('.add-status');
  const body = Object.fromEntries(new FormData(form).entries());
  status.textContent = 'Saving...';
  status.classList.remove('bad');
  try {
    await fetchJSON(`${API}/joke/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    status.textContent = 'Added!';
    document.querySelector('.search-input').value = body.category;
    fetchCategory(body.category);
    form.reset();
  } catch (err) {
    status.textContent = err.message;
    status.classList.add('bad');
  }
});

loadRandom();
