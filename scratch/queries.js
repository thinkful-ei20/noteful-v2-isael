'use strict';

const knex = require('../knex');

// let searchTerm = 'gaga';
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

// knex('folders')
//   .select('id', 'name')
//   .then( results => {
//     console.log(JSON.stringify(results, null, 2));
//   })
//   .catch(err => console.log(err));

// let id = 100;
// knex('folders')
//   .select('id', 'name')
//   .where({'folders.id' : id})
//   .then(results => {
//     console.log(JSON.stringify(results,null,2));
//   })
//   .catch(err => console.log(err));

// let id = 100;
// let updateObj = {name: 'isael'};
// knex('folders')
//   .update(updateObj)
//   .where({'folders.id': id})
//   .returning(['id', 'folders.name'])
//   .then(results => {
//     console.log(JSON.stringify(results, null, 2));
//   })
//   .catch(err => console.log(err));

// let newItem = {name: 'isael432'};
// knex('folders')
//   .insert(newItem)
//   .returning(['folders.id', 'name'])
//   .then(results => {
//     console.log(JSON.stringify(results,null,2));
//   })
//   .catch(err => console.log(err));
const noteId = 99;
const result = [34, 56, 78].map(tagId => ({ note_id: noteId, tag_id: tagId }));
console.log(`insert: ${result} into notes_tags`);