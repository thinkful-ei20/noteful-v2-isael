'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
// const app = require('../server');
chai.use(chaiHttp);

describe('Reality check', function(){
  it('should return true', function(){
    expect(true).to.be.true;
  });
});
//added comment to test
// describe('Get Notes', function () {
//   it('should retrieve all the notes from the database', function (){
//     return chai.request(app)
//       .get('/api/notes')
//       .then(function (res){
//         expect(res).to.exist;
//       });
//   });
// });