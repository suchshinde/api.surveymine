/* globals describe, expect, it, beforeEach, afterEach */

var app = require('../..');
import request from 'supertest';

var newSurvey;

describe('Survey API:', function() {
  describe('GET /api/surveys', function() {
    var surveys;

    beforeEach(function(done) {
      request(app)
        .get('/api/surveys')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          surveys = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      expect(surveys).to.be.instanceOf(Array);
    });
  });

  describe('POST /api/surveys', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/surveys')
        .send({
          name: 'New Survey',
          info: 'This is the brand new survey!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          newSurvey = res.body;
          done();
        });
    });

    it('should respond with the newly created survey', function() {
      expect(newSurvey.name).to.equal('New Survey');
      expect(newSurvey.info).to.equal('This is the brand new survey!!!');
    });
  });

  describe('GET /api/surveys/:id', function() {
    var survey;

    beforeEach(function(done) {
      request(app)
        .get(`/api/surveys/${newSurvey._id}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          survey = res.body;
          done();
        });
    });

    afterEach(function() {
      survey = {};
    });

    it('should respond with the requested survey', function() {
      expect(survey.name).to.equal('New Survey');
      expect(survey.info).to.equal('This is the brand new survey!!!');
    });
  });

  describe('PUT /api/surveys/:id', function() {
    var updatedSurvey;

    beforeEach(function(done) {
      request(app)
        .put(`/api/surveys/${newSurvey._id}`)
        .send({
          name: 'Updated Survey',
          info: 'This is the updated survey!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          updatedSurvey = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedSurvey = {};
    });

    it('should respond with the updated survey', function() {
      expect(updatedSurvey.name).to.equal('Updated Survey');
      expect(updatedSurvey.info).to.equal('This is the updated survey!!!');
    });

    it('should respond with the updated survey on a subsequent GET', function(done) {
      request(app)
        .get(`/api/surveys/${newSurvey._id}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          let survey = res.body;

          expect(survey.name).to.equal('Updated Survey');
          expect(survey.info).to.equal('This is the updated survey!!!');

          done();
        });
    });
  });

  describe('PATCH /api/surveys/:id', function() {
    var patchedSurvey;

    beforeEach(function(done) {
      request(app)
        .patch(`/api/surveys/${newSurvey._id}`)
        .send([
          { op: 'replace', path: '/name', value: 'Patched Survey' },
          { op: 'replace', path: '/info', value: 'This is the patched survey!!!' }
        ])
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          patchedSurvey = res.body;
          done();
        });
    });

    afterEach(function() {
      patchedSurvey = {};
    });

    it('should respond with the patched survey', function() {
      expect(patchedSurvey.name).to.equal('Patched Survey');
      expect(patchedSurvey.info).to.equal('This is the patched survey!!!');
    });
  });

  describe('DELETE /api/surveys/:id', function() {
    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete(`/api/surveys/${newSurvey._id}`)
        .expect(204)
        .end(err => {
          if(err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when survey does not exist', function(done) {
      request(app)
        .delete(`/api/surveys/${newSurvey._id}`)
        .expect(404)
        .end(err => {
          if(err) {
            return done(err);
          }
          done();
        });
    });
  });
});
