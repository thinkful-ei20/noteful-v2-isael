'use strict';
const express= require('express');
const router = express.Router();
const knex  = require('../knex');

router.get('/tags', (req, res, next) => {
  knex('tags')
    .select(['id', 'name'])
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

router.get('/tags/:id', (req, res, next) => {
  const { id } = req.params;

  knex('tags')
    .select('id', 'name')
    .where({'tags.id': id})
    .then(results => {
      return results.length ? res.json(results[0]) : next();
    })
    .catch(err => next(err));

});

router.put('/tags/:id', (req, res, next) => {
  const {id} = req.params;
  const {name} = req.body;
  const updateObj = {};

  if(name){
    updateObj.name = name;
  }else{
    const err = new Error('missing name');
    err.status = 400;
    next(err);
  }

  knex('tags')
    .update(updateObj)
    .where({'tags.id': id})
    .returning(['id', 'name'])
    .then(results => res.json(results[0]))
    .catch(err => next(err));

});

router.post('/tags', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = { name };

  knex.insert(newItem)
    .into('tags')
    .returning(['id', 'name'])
    .then((results) => {
      // Uses Array index solution to get first item in results array
      const result = results[0];
      res.location(`${req.originalUrl}/${result.id}`)
        .status(201)
        .json(result);
    })
    .catch(err => next(err));
});

router.delete('/tags/:id', (req, res, next) => {
  const {id} = req.params;
  knex('tags')
    .where({'tags.id': id})
    .del()
    .then(result => res.sendStatus(204));
});

module.exports = router;