/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/surveyid-generators              ->  index
 * POST    /api/surveyid-generators              ->  create
 * GET     /api/surveyid-generators/:id          ->  show
 * PUT     /api/surveyid-generators/:id          ->  upsert
 * PATCH   /api/surveyid-generators/:id          ->  patch
 * DELETE  /api/surveyid-generators/:id          ->  destroy
 */

import {applyPatch} from 'fast-json-patch';
import {SurveyIdGenerator} from '../../sqldb';

function respondWithResult(res, statusCode) {
    statusCode = statusCode || 200;
    return function (entity) {
        if (entity) {
            return res.status(statusCode).json(entity);
        }
        return null;
    };
}

function patchUpdates(patches) {
    return function (entity) {
        try {
            applyPatch(entity, patches, /*validate*/ true);
        } catch (err) {
            return Promise.reject(err);
        }

        return entity.save();
    };
}

function removeEntity(res) {
    return function (entity) {
        if (entity) {
            return entity.destroy()
                .then(() => res.status(204).end());
        }
    };
}

function handleEntityNotFound(res) {
    return function (entity) {
        if (!entity) {
            res.status(404).end();
            return null;
        }
        return entity;
    };
}

function handleError(res, statusCode) {
    statusCode = statusCode || 500;
    return function (err) {
        res.status(statusCode).send(err);
    };
}

// Gets a list of SurveyidGenerators
export function index(req, res) {
    return SurveyIdGenerator.findAll()
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Gets a single SurveyidGenerator from the DB
export function show(req, res) {
    return SurveyIdGenerator.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Creates a new SurveyidGenerator in the DB
export function createSurveyId(req, res) {
    let body = {
        createdBy: req.authData.PM_UserID,
        clientId: req.authData.PM_Client_ID,
        createdAt: new Date().toString()
    };
    return SurveyIdGenerator.create(body)
        .then((surveyId) => {
            return res.status(200).json({result: true, sequence: surveyId});
        })
        .catch(handleError(res));
}

// Upserts the given SurveyidGenerator in the DB at the specified ID
export function upsert(req, res) {
    if (req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }
    return SurveyIdGenerator.upsert(req.body, {
        where: {
            _id: req.params.id
        }
    })
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Updates an existing SurveyidGenerator in the DB
export function patch(req, res) {
    if (req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }
    return SurveyIdGenerator.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(patchUpdates(req.body))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Deletes a SurveyidGenerator from the DB
export function destroy(req, res) {
    return SurveyIdGenerator.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(handleError(res));
}
