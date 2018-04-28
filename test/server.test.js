'use strict';

/**
 * DISCLAIMER:
 * The examples shown below are superficial tests which only check the API responses.
 * They do not verify the responses against the data in the database. We will learn
 * how to crosscheck the API responses against the database in a later exercise.
 */
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const knex = require('../knex');
const seedData = require('../db/seedData');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Reality check', function () {

  it('true should be true', function () {
    expect(true).to.be.true;
  });

  it('2 + 2 should equal 4', function () {
    expect(2 + 2).to.equal(4);
  });

});

describe('Environment', () => {

  it('NODE_ENV should be "test"', () => {
    expect(process.env.NODE_ENV).to.equal('test');
  });

  it('connection should be test database', () => {
    expect(knex.client.connectionSettings.database).to.equal('noteful-test');
  });

});

describe('Noteful App', function () {

  beforeEach(function () {
    return seedData('./db/noteful.sql');//, 'dev'
  });

  after(function () {
    return knex.destroy(); // destroy the connection
  });

  describe('Static app', function () {

    it('GET request "/" should return the index page', function () {
      return chai.request(app)
        .get('/')
        .then(function (res) {
          expect(res).to.exist;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
        });
    });

  });

  describe('404 handler', function () {

    it('should respond with 404 when given a bad path', function () {
      return chai.request(app)
        .get('/bad/path')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });

  describe('GET /api/notes', function () {

    it('should return the default of 10 Notes ', function () {
      let count; 
      return knex('notes')
        .count()
        .then(([result]) => {
          count = Number(result.count);
          return chai.request(app).get('/api/notes');
        })
        .then(function (res){
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(count);
        });
    });

    it('should return a list with the correct right fields', function () {
      return knex('notes')
        .select()
        .then(res => {
          //console.log(res);
          res.forEach(item => {
            expect(item).to.include.keys('id', 'title', 'content');
            expect(item).to.be.a('object');
          });
          return chai.request(app).get('/api/notes');
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.have.length(10);
          expect(res.body).to.be.a('array');
        });
    });

    it('should return correct search results for a valid query', function () {
      let res;
      return chai.request(app).get('/api/notes?searchTerm=gaga')
        .then(function(_res){
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.be.an('object');
          return knex.select().from('notes').where('title', 'like', '%gaga%');
        })
        .then(data => {
          expect(res.body[0].id).to.equal(data[0].id);
        });
    });

    it('should return an empty array for an incorrect query', function () {
      let searchTerm = 'isael';
      return knex('notes')
        .select()
        .where({'notes.title': `%${searchTerm}%`})
        .then(res => {
          expect(res).to.be.a('array');
          expect(res).to.have.length(0);
          return chai.request(app).get(`/api/notes?searchTerm=${searchTerm}`);
        })
        .then(res => {
          expect(res).to.be.json;
          expect(res).to.have.status(200);
        });
    });

  });

  describe('GET /api/notes/:id', function () {

    it('should return correct notes', function () {

      const dataPromise = knex.first()
        .from('notes')
        .where('id', 1000);

      const apiPromise = chai.request(app)
        .get('/api/notes/1000');

      return Promise.all([dataPromise, apiPromise])
        .then(function ([data, res]) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'title', 'content');
          expect(res.body.id).to.equal(1000);
          expect(res.body.title).to.equal(data.title);
        });
    });

    it('should respond with a 404 for an invalid id', function () {
      const id = 123214;
      return knex('notes')
        .select()
        .where({'notes.id': id})
        .then(res => {
          expect(res).to.be.a('array');
          expect(res).to.have.length(0);
          return chai.request(app).get(`/api/notes/${id}`);
        })
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });

  describe('POST /api/notes', function () {

    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
        'tags': []
      };
      let body;
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('id', 'title', 'content');
          return knex.select().from('notes').where('id', body.id);
        })
        .then(([data]) => {
          expect(body.title).to.equal(data.title);
          expect(body.content).to.equal(data.content);
        });
    });

    it('should return an error when missing "title" field', function () {
      const newItem = {
        'foo': 'bar'
      };
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
          return knex('notes').select().where({'notes.title': !newItem.title ? '' : newItem.title});
        })
        .then((res) => {
          expect(res).to.be.a('array');
          expect(res).to.have.length(0);
        })
        .catch(err => {
          expect(err).to.throw();
          expect(err).to.be.an('error');
        });
    });

  });

  describe('PUT /api/notes/:id', function () {

    it('should update the note', function () {
      let id = 1000;
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof'
      };
      let body;
      return chai.request(app)
        .put(`/api/notes/${id}`)
        .send(updateItem)
        .then(res => {
          body = res.body;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content');
          expect(res.body.id).to.equal(id);
          expect(res.body.title).to.equal(updateItem.title);
          expect(res.body.content).to.equal(updateItem.content);
          return knex('notes').where({'notes.id': res.body.id});
        })
        .then(([res])=> {
          expect(res.title).to.equal(body.title);
          expect(res.content).to.equal(body.content);
        });
    });

    it('should respond with a 404 for an invalid id', function () {
      const id = 321312312;
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof'
      };
      return chai.request(app)
        .put(`/api/notes/${id}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
          return knex('notes').select().where({'notes.id': id});
        })
        .then(res => {
          expect(res).to.be.a('array');
          expect(res).to.have.length(0);
        });
    });

    it('should return an error when missing "title" field', function () {
      let id = 1000;
      const updateItem = {
        'foo': 'bar'
      };
      return chai.request(app)
        .put(`/api/notes/${id}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
          return knex('notes').select().where({'notes.title': !updateItem.title ? '' : updateItem.title});
        })
        .then(res => {
          expect(res).to.be.a('array');
          expect(res).to.have.length(0);
        });
    });

  });

  describe('PUT /api/tags/:id', function () {

    it('should update the tags', function () {
      let id = 1;
      const updateItem = {
        'name': 'test21421412'
      };
      let body;
      return chai.request(app)
        .put(`/api/tags/${id}`)
        .send(updateItem)
        .then(res => {
          body = res.body;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'name');
          expect(res.body.id).to.equal(id);
          expect(res.body.name).to.equal(updateItem.name);
          return knex('tags').where({'tags.id': res.body.id});
        })
        .then(([res])=> {
          expect(res.title).to.equal(body.title);
          expect(res.content).to.equal(body.content);
        });
    });

    it('should respond with a 404 for an invalid id', function () {
      const id = 421412421;
      const updateItem = {
        'name': 'isaellizama'
      };
      return chai.request(app)
        .put(`/api/tags/${id}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
          return knex('tags').select().where({'tags.id': id});
        })
        .then(res => {
          expect(res).to.be.a('array');
          expect(res).to.have.length(0);
        });
    });

    it('should return an error when missing "name" field', function () {
      let id = 1;
      const updateItem = {
        'foo': 'bar'
      };
      return chai.request(app)
        .put(`/api/tags/${id}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('missing name');
          return knex('tags').select().where({'tags.name': !updateItem.name ? '' : updateItem.name});
        })
        .then(res => {
          expect(res).to.be.a('array');
          expect(res).to.have.length(0);
        });
    });

  });

  describe('PUT /api/folders/:id', function () {

    it('should update the folders', function () {
      let id = 100;
      const updateItem = {
        'name': 'test21421412'
      };
      let body;
      return chai.request(app)
        .put(`/api/folders/${id}`)
        .send(updateItem)
        .then(res => {
          body = res.body;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'name');
          expect(res.body.id).to.equal(id);
          expect(res.body.name).to.equal(updateItem.name);
          return knex('folders').where({'folders.id': res.body.id});
        })
        .then(([res])=> {
          expect(res.title).to.equal(body.title);
          expect(res.content).to.equal(body.content);
        });
    });

    it('should respond with a 404 for an invalid id', function () {
      const id = 421412421;
      const updateItem = {
        'name': 'isaellizama'
      };
      return chai.request(app)
        .put(`/api/folders/${id}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
          return knex('folders').select().where({'folders.id': id});
        })
        .then(res => {
          expect(res).to.be.a('array');
          expect(res).to.have.length(0);
        });
    });

    it('should return an error when missing "name" field', function () {
      let id = 1;
      const updateItem = {
        'foo': 'bar'
      };
      return chai.request(app)
        .put(`/api/folders/${id}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('missing name');
          return knex('folders').select().where({'folders.name': !updateItem.name ? '' : updateItem.name});
        })
        .then(res => {
          expect(res).to.be.a('array');
          expect(res).to.have.length(0);
        });
    });

  });

  describe('DELETE  /api/notes/:id', function () {

    it('should delete an item by id', function () {
      const id = 1000;
      return knex('notes')
        .del()
        .where({'notes.id': id})
        .then(res => {
          expect(res).to.equal(1);
          return chai.request(app).delete(`/api/notes/${id}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
        });
    });

  });

  describe('DELETE  /api/tags/:id', function () {

    it('should delete an tag by id', function () {
      const id = 1;
      return knex('tags')
        .del()
        .where({'tags.id': id})
        .then(res => {
          expect(res).to.equal(1);
          return chai.request(app).delete(`/api/tags/${id}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
        });
    });

  });

  describe('DELETE  /api/folders/:id', function () {

    it('should delete an item by id', function () {
      const id = 100;
      return knex('folders')
        .del()
        .where({'folders.id': id})
        .then(res => {
          expect(res).to.equal(1);
          return chai.request(app).delete(`/api/folders/${id}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
        });
    });

  });

});