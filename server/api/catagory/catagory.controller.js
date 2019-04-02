/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/catagorys              ->  index
 * POST    /api/catagorys              ->  create
 * GET     /api/catagorys/:id          ->  show
 * PUT     /api/catagorys/:id          ->  upsert
 * PATCH   /api/catagorys/:id          ->  patch
 * DELETE  /api/catagorys/:id          ->  destroy
 */

'use strict';

import jsonpatch from 'fast-json-patch';
import {CatagoryMaster} from '../../sqldb';

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if(entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function(entity) {
    try {
      // eslint-disable-next-line prefer-reflect
      jsonpatch.apply(entity, patches, /*validate*/ true);
    } catch(err) {
      return Promise.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function(entity) {
    if(entity) {
      return entity.destroy()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if(!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of Catagorys
export function getCatagoryList(req, res) {
    CatagoryMaster.findAll({
            attributes: ['Id', 'catagoryName', 'catagoryDescription']
        },
    )
        .then((obj) => {
            res.json(obj);
            console.log('obj', obj);
        })
        .catch((error) => {
            console.log('error', error);
            res.status(500)
                .send({success: false, msg: 'Something Went Wrong'});
        });
}

// Gets a single Catagory from the DB
export function show(req, res) {
  return CatagoryMaster.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Catagory in the DB
export function create(req, res) {
  return CatagoryMaster.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Upserts the given Catagory in the DB at the specified ID
export function upsert(req, res) {
  if(req.body._id) {
    Reflect.deleteProperty(req.body, '_id');
  }

  return CatagoryMaster.upsert(req.body, {
    where: {
      _id: req.params.id
    }
  })
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Catagory in the DB
export function patch(req, res) {
  if(req.body._id) {
    Reflect.deleteProperty(req.body, '_id');
  }
  return CatagoryMaster.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Catagory from the DB
export function destroy(req, res) {
  return CatagoryMaster.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
