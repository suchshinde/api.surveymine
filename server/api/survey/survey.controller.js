/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/surveys              ->  index
 * POST    /api/surveys              ->  create
 * GET     /api/surveys/:id          ->  show
 * PUT     /api/surveys/:id          ->  upsert
 * PATCH   /api/surveys/:id          ->  patch
 * DELETE  /api/surveys/:id          ->  destroy
 */

import {applyPatch} from 'fast-json-patch';
import {Role, Survey} from '../../sqldb';

function respondWithResult(res, statusCode) {
    statusCode = statusCode || 200;
    return function(entity) {
        if(entity) {
            return res.status(statusCode)
                .json(entity);
        }
        return null;
    };
}

function patchUpdates(patches) {
    return function(entity) {
        try {
            applyPatch(entity, patches, /*validate*/ true);
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
                .then(() => res.status(204)
                    .end());
        }
    };
}

function handleEntityNotFound(res) {
    return function(entity) {
        if(!entity) {
            res.status(404)
                .end();
            return null;
        }
        return entity;
    };
}

function handleError(res, statusCode) {
    statusCode = statusCode || 500;
    return function(err) {
        res.status(statusCode)
            .send(err);
    };
}

// Gets a list of Surveys
export function index(req, res) {
    return Survey.findAll()
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Gets a single Survey from the DB
export function show(req, res) {
    return Survey.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Creates a new Survey in the DB
export function create(req, res) {
    const client_id = req.authData.client_id;
    const survey_name = req.body.survey_name;
    const creator = req.authData.user_id;
    const bodyForImage = {
        client_id: req.authData.client_id,
        imageData: req.body.imageData,
        whichImage: 'ProjectLogo',
    };
    console.log('amit', req.body);
    Survey.findOne({where: {survey_name: survey_name, client_id: client_id}})
        .then((result) => {
            if(result) {
                return res.status(400)
                    .json({success: false, message: 'Survey with same name already exist. Please change project name.'});
            }
            req.body.survey_creator = creator;
            surveyAdd(req.body)
                .then((result) => {
                        // return addSurveyor(req.body.assigned_to, result.id, client_id, creator);
                        console.log('result', result);
                        res.status(200)
                            .send({success: true, msg: 'Survey Created Successfully'});
                    }
                );
        })
        .catch(err => res.json(err));
}

function addSurveyor(assigned_to, survey_id, client_id, creator) {
    return new Promise((resolve, reject) => {
        const post = assigned_to.split(',');

        console.log('post', post);
        let count = 0;
        post.forEach((item) => {
            let inserObj = {
                client_id: client_id,
                survey_id: survey_id,
                creator: creator,
                user_id: item
            };
            SurveyUser.create(insertObj, {isNewRecord: true});

        });

        Survey.create(post)
            .then((x) => {
                resolve(x);
            })
            .catch((err) => {
                // logger.error({
                //     msg: 'Unauthorised',
                //     error: err,
                // });
                reject(err);
            });
    });
}

function surveyAdd(userObj) {
    return new Promise((resolve, reject) => {
        const post = {
            client_id: userObj.client_id,
            version_id: userObj.version_id,
            survey_name: userObj.survey_name,
            survey_template: userObj.survey_template,
            survey_creator: userObj.survey_creator,
            survey_created_at: new Date().getDate(),
            survey_description: userObj.survey_description,
            survey_type: userObj.survey_type,
            assigned_to: userObj.assigned_to,
            survey_status: 'Created',

        };
        console.log('12324', post);
        Survey.create(post)
            .then((x) => {
                resolve(x);
            })
            .catch((err) => {
                // logger.error({
                //     msg: 'Unauthorised',
                //     error: err,
                // });
                reject(err);
            });
    });
}

// Upserts the given Survey in the DB at the specified ID
export function upsert(req, res) {
    if(req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }
    return Survey.upsert(req.body, {
        where: {
            _id: req.params.id
        }
    })
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Updates an existing Survey in the DB
export function patch(req, res) {
    if(req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }
    return Survey.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(patchUpdates(req.body))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Deletes a Survey from the DB
export function destroy(req, res) {
    return Survey.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(handleError(res));
}
