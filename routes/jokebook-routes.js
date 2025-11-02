const express = require('express');
const {
  listCategories,
  listJokes,
  randomJoke,
  createJoke
} = require('../controllers/jokebook-controller.js');

const router = express.Router();

router.get('/categories', listCategories);
router.get('/category/:category', listJokes);
router.get('/random', randomJoke);
router.post('/joke/add', createJoke);

module.exports = router;
