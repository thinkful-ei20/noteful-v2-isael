'use strict';
const router = require('express').Router();
const knex = require('../knex');

router.get('/folders', (req, res, next) => {
  knex('folders')
    .select('id', 'name')
    .then( results => {
      res.json(results);
    })
    .catch(err => next(err));
});

router.get('/folders/:id', (req, res, next) => {
  let { id } = req.params;
  knex('folders')
    .select('id', 'name')
    .where({'folders.id' : id})
    .then(results => {
      return results.length ? res.json(results[0]) : next();
      // if(results.length){
      //   res.json(results[0]);
      // }else{
      //   next();
      // }
    })
    .catch(err => console.log(err));
});

router.put('/folders/:id', (req, res, next) => {
  const {id} = req.params;
  const updateObj = {};

  if(req.body.name){
    updateObj.name = req.body.name;
  }else{
    const err = new Error('missing name');
    err.status = 400;
    next(err);
  }

  knex('folders')
    .update(updateObj)
    .where({'folders.id': id})
    .returning(['id', 'folders.name'])
    .then(results => {
      if(results.length){
        res.json(results[0]);
      }else{
        res.status(404).send({error: 'invalid Id'}).end();
        next();
      }
    })
    .catch(err => next(err));
});

router.post('/folders', (req, res, next) => {
  const newItem = {};

  if(req.body.name){
    newItem.name = req.body.name;
  }else{
    const err = new Error('missing name');
    err.status = 400;
    next(err);
  }

  knex('folders')
    .insert(newItem)
    .returning(['folders.id', 'name'])
    .then(results => {
      res.location(`http://${req.headers.host}/notes/${results[0].id}`)
        .status(201)
        .json(results[0]);
    })
    .catch(err => next(err));

});

router.delete('/folders/:id', (req, res, next) => {
  const {id} = req.params;
  knex('folders')
    .where({'folders.id': id})
    .del()
    .then(results => {
      res.sendStatus(204);
    })
    .catch(err => next(err));
});
module.exports = router;