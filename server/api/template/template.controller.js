/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/templates              ->  index
 * POST    /api/templates              ->  create
 * GET     /api/templates/:id          ->  show
 * PUT     /api/templates/:id          ->  upsert
 * PATCH   /api/templates/:id          ->  patch
 * DELETE  /api/templates/:id          ->  destroy
 */

'use strict';

import jsonpatch from 'fast-json-patch';
import {TemplateMaster} from '../../sqldb';
import {logger} from '../../components/logger';

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

// Gets a list of Templates
export function index(req, res) {
  return TemplateMaster.findAll()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Template from the DB
export function getTemplateByCatagory(req, res) {
    const condition = {
        where: {
            catagoryId: req.params.catagoryId }
    };
     TemplateMaster.findAll(condition)
      .then((templateResult) => res.json({status: true, msg: 'Template List', data: templateResult}))
      .catch(handleError(res));
}

// Creates a new Template in the DB
export function createNewTemplate(req, res) {
    const msg = 'Template already exist.';
    const creator = req.authData.PM_UserID;
    const clientId = req.authData.PM_Client_ID;


    TemplateMaster.findOne({
        where: {
            templateName: req.body.templateName,
            catagoryId: req.body.catagoryId
        }
    })
        .then((result) => {
            if(result) {
                return new Promise((resolve, reject) => {
                    reject(msg);
                });
            } else {
                req.body.createdBy = creator;
                return saveTemplate(req.body, clientId);
            }
           //  if (result) {
           //      return res.status(400)
           //          .json({
           //              success: false,
           //              message: 'Template already exist.'
           //          });
           //  }
           //  req.body.createdBy = creator;
           // return saveTemplate(req.body , clientId);
        })
        .then(() => {
            res.status(200)
                .send({success: true, msg: 'Template Created Successfully'});
        })
        .catch(err => {
            res.status(400)
                .send({success: true, msg: err});
        });
}

// Upserts the given Template in the DB at the specified ID
export function upsert(req, res) {
  if(req.body._id) {
    Reflect.deleteProperty(req.body, '_id');
  }

  return TemplateMaster.upsert(req.body, {
    where: {
      _id: req.params.id
    }
  })
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Template in the DB
export function patch(req, res) {
  if(req.body._id) {
    Reflect.deleteProperty(req.body, '_id');
  }
  return TemplateMaster.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Template from the DB
export function destroy(req, res) {
  return TemplateMaster.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}

function saveTemplate(userObj, clientId) {
    return new Promise((resolve, reject) => {
        const post = {
            clientId,
            templateName: userObj.templateName,
            template: userObj.template,
            catagoryId: userObj.catagoryId,
            createdBy: userObj.createdBy,
            templateDescr: userObj.templateDescr,
            createdAt: new Date().toString()
        };
        TemplateMaster.create(post)
            .then((x) => {
                resolve(x);
            })
            .catch((err) => {
                logger.error({
                    msg: 'Unauthorised',
                    error: err,
                });
                reject(err);
            });
    });
}
