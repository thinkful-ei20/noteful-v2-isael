'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();
const knex = require('../knex');
// TEMP: Simple In-Memory Database
// const data = require('../db/notes');
// const simDB = require('../db/simDB');
// const notes = simDB.initialize(data);
const hydrateNotes = require('../util/hydrateNotes');
// Get All (and search by query)
router.get('/notes', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;

  knex
    .select('notes.id', 'title', 'content',
      'folders.id as folder_id', 'folders.name as folderName',
      'tags.id as tagId', 'tags.name as tagName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .modify(queryBuilder => {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(function(queryBuilder){
      if(folderId){
        queryBuilder.where('folder_id', folderId);
      }
    })
    .modify(function(queryBuilder){
      if(tagId){
        queryBuilder.where('tag_id', tagId);
      }
    })
    .orderBy('notes.id')
    .then(results => {
      const hydrated = hydrateNotes(results);
      res.json(hydrated);
    })
    .catch(err => {
      next(err);
    });
});

// Get a single item
router.get('/notes/:id', (req, res, next) => {
  const id = req.params.id;

  knex('notes')
    .select('notes.id', 'title', 'content',
      'folders.id as folderId', 'folders.name as folderName',
      'tags.id as tagId', 'tags.name as tagName')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .where({'notes.id': id})
    .then(results => {
      if(results.length > 0) {
        const hydrated = hydrateNotes(results);
        res.json(hydrated[0]);
      }else{
        next();
      }
    })
    .catch(err => next(err));

});

// Put update an item
router.put('/notes/:id', (req, res, next) => {
  const id = req.params.id;
  //destructure the tags folderId title and content from req.body
  //if theyre isn't tags it defaults to an empty array
  let {tags = [], folderId, title, content} = req.body;
  /***** Never trust users - validate input *****/
  if (!folderId) folderId = null;//if their is  folder id it will set to folderId else null
  const updateObj = {
    title,
    content,
    folder_id: folderId
  };
  
  //console.log(JSON.stringify(updateObj, null, 2));
  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  let noteId = id;
  knex('notes')
    .update(updateObj)
    .where({'notes.id': noteId})
    .returning('id')
    .then(([id]) => {
      return knex
        .from('notes_tags')
        .del()
        .where({'note_id': id});
    })
    .then(() => {
      //if(!tags) return; if their was not tags it would return
      const tagsInsert = tags.map(tagId => ({note_id: noteId, tag_id: tagId}));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(()=> {
      return knex.select('notes.id', 'title', 'content',
        'folders.id as folder_id', 'folders.name as folderName',
        'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
      // return knex
      //   .from('notes')
      //   .select('notes.id', 'title', 'content',
      //     'folders.id as folder_id', 'folders.name as folderName',
      //     'tags.id as tagId', 'tags.name as tagName')
      //   .leftJoin('folders', 'notes.folder_id', 'folders.id')
      //   .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
      //   .where('notes.id', noteId);
    })
    .then(results => {
      if(results){
        const hydrated = hydrateNotes(results)[0];
        res.location(`${req.originalUrl}/${hydrated.id}`)
          .status(201)
          .json(hydrated);
      }else{
        next();
      }
    })
    .catch(err => next(err));
  // .where({'notes.id':id})
  // .returning('id')
  // .then(([id]) => {
  //   return knex('notes')
  //     .select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder_name')
  //     .leftJoin('folders', 'notes.folder_id', 'folders.id')
  //     .where({'notes.id': id});
  // })
  // .then( ([results]) => {
  //   res.json(results);
  // })
  // .catch(err => next(err));
});

// Post (insert) an item
router.post('/notes', (req, res, next) => {
  const { title, content, folder_id , tags} = req.body;

  const newItem = { title, content, folder_id};
  /***** Never trust users - validate input *****/
  let noteId;

  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex.insert(newItem).into('notes').returning('id')
    .then(([id]) => {
    // Insert related tags into notes_tags table
      noteId = id;
      if(!tags) return;
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
    // Select the new note and leftJoin on folders and tags
      return knex.select('notes.id', 'title', 'content',
        'folders.id as folder_id', 'folders.name as folderName',
        'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
      // Hydrate the results
        const hydrated = hydrateNotes(result)[0];
        // Respond with a location header, a 201 status and a note object
        res.location(`${req.originalUrl}/${hydrated.id}`).status(201).json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => next(err));

});

// Delete an item
router.delete('/notes/:id', (req, res, next) => {
  const id = req.params.id;

  knex('notes')
    .where({id: id})
    .del()
    .then(results => {
      res.status(204).end();
    });

});

module.exports = router;
