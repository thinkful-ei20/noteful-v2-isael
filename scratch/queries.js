'use strict';

const knex = require('../knex');

let searchTerm = 'gaga';
// knex
//   .select('notes.id', 'title', 'content')
//   .from('notes')
//   .modify(queryBuilder => {
//     if (searchTerm) {
//       queryBuilder.where('title', 'like', `%${searchTerm}%`);
//     }
//   })
//   .orderBy('notes.id')
//   .then(results => {
//     console.log(JSON.stringify(results, null, 2));
//   })
//   .catch(err => {
//     console.error(err);
//   });

// let id = 1005;
// knex('notes')
//   .select('id', 'title', 'content')
//   .where({id: id})
//   .orderBy('notes.id')
//   .then(results => console.log(JSON.stringify(results,null,2)))
//   .catch(err => console.log(err));

// let id = 1005;
// knex('notes')
//   .update(updatedObj)
//   .where({id: id})

// knex('notes')
//  .insert(newItem)
//  .returning('id')
//  .then(results => )