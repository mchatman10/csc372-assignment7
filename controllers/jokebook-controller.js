const {
  getCategories,
  getJokes,
  getRandomJoke,
  addJoke,
  insertJokes,
  getCategoryIdByName
} = require('../models/jokebook-model.js');

const JOKEAPI_BASE = 'https://v2.jokeapi.dev/joke';

async function listCategories(req, res, next) {
  try {
    const categories = await getCategories();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

async function listJokes(req, res, next) {
  try {
    const category = req.params.category;
    const limit = req.query.limit ? Math.max(1, Math.min(100, Number(req.query.limit))) : undefined;

    let jokes = await getJokes(category, limit);
    if (jokes.length) return res.json({ category, jokes, source: 'local' });

    const url = `${JOKEAPI_BASE}/${encodeURIComponent(category)}?type=twopart&amount=3&safe-mode&blacklistFlags=nsfw,religious,political,sexist,explicit,racist`;
    const response = await fetch(url);
    if (!response.ok) return res.status(404).json({ error: `Category '${category}' not found` });

    const data = await response.json();
    const fetched = Array.isArray(data.jokes) ? data.jokes : (data.error ? [] : [data]);
    const clean = fetched
      .filter(j => j.type === 'twopart' && j.setup && j.delivery)
      .slice(0, 3)
      .map(j => ({ setup: j.setup, delivery: j.delivery }));

    if (!clean.length)
      return res.status(404).json({ error: `Inappropriate '${category}'` });

    const exists = await getCategoryIdByName(category);
    if (!exists) await insertJokes(category, clean);

    jokes = await getJokes(category, limit);
    res.json({ category, jokes, source: 'external-imported' });
  } catch (err) {
    next(err);
  }
}

async function randomJoke(req, res, next) {
  try {
    const joke = await getRandomJoke();
    if (!joke) return res.status(404).json({ error: 'No jokes found' });
    res.json(joke);
  } catch (err) {
    next(err);
  }
}

async function createJoke(req, res, next) {
  try {
    const { category, setup, delivery } = req.body || {};
    if (!category || !setup || !delivery)
      return res.status(400).json({ error: 'Missing category, setup, or delivery' });

    await addJoke({ category, setup, delivery });
    const jokes = await getJokes(category);
    res.status(201).json({ category, jokes });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  listJokes,
  randomJoke,
  createJoke
};
