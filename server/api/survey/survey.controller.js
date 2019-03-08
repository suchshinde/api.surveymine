/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/surveys              ->  index
 * POST    /api/surveys              ->  create
 * GET     /api/surveys/:id          ->  show
 * PUT     /api/surveys/:id          ->  upsert
 * PATCH   /api/surveys/:id          ->  patch
 * DELETE  /api/surveys/:id          ->  destroy
 */
import {logger} from '../../components/logger';
import {applyPatch} from 'fast-json-patch';
import {Survey, SurveyUser} from '../../sqldb';

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
export function getAllSurveyByUser(req, res) {
    // console.log('asjdhskjd', req.authData.PM_Client_ID, req.authData.PM_UserID);
    SurveyUser.findAll({
        where: {
            client_id: req.authData.PM_Client_ID,
            user_id: req.authData.PM_UserID
        }
    })
        .then((surveyResult) => {
            let surveysByUser = [];
            let count = 0;
            surveyResult.forEach((item) => {
                Survey.findAll({
                    where: {
                        survey_id: item.survey_id
                    }
                })
                    .then((survey) => {
                        var found = surveysByUser.some(function(el) {
                            return el.survey_id.survey_id === item.survey_id;
                        });
                        if(!found) {
                            surveysByUser.push({survey_id: survey[0], versions: survey});
                        }
                        count++;
                        if(count === surveyResult.length) {
                            return res.status(200)
                                .json({
                                    success: false,
                                    msg: '', data: surveysByUser
                                });
                        }
                        // else {
                        //     console.log('in else count: ' + count, surveysByUser.length);
                        // }
                    });
            });
        })
        // .then(respondWithResult(res))
        .catch(handleError(res));
}

// Gets a single Survey from the DB as published
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
export function createSurvey(req, res) {
    console.log(req.authData);
    const client_id = req.authData.PM_Client_ID;
    const survey_name = req.body.survey_name;
    const creator = req.authData.PM_UserID;
    const bodyForImage = {
        client_id: req.authData.PM_Client_ID,
        imageData: req.body.imageData,
        whichImage: 'ProjectLogo',
    };
    console.log('amit', req.body, client_id);

    Survey.findOne({
        where: {
            version_id: req.body.version_id,
            survey_id: req.body.survey_id,
            client_id: client_id
        }
    })
        .then((result) => {
            if(result) {
                return res.status(400)
                    .json({success: false, message: 'Survey with same Version already exist. Please change survey version or create new one.'});
            }
            req.body.created_by = creator;
            return surveyAdd(req.body, client_id, 'Published');
        })
        .then((result) => {
            addSurveyor(req.body.assigned_to, result, client_id, creator);
        })
        .then(() => {
            res.status(200)
                .send({success: true, msg: 'Survey Published Successfully'});
        })
        .catch(err => {
            res.status(400)
                .send({success: true, msg: err});
        });
}

// Creates a new Survey in the DB as draft
export function draftSurvey(req, res) {
    console.log(req.authData);
    const client_id = req.authData.PM_Client_ID;
    const survey_name = req.body.survey_name;
    const creator = req.authData.PM_UserID;
    const bodyForImage = {
        client_id: req.authData.PM_Client_ID,
        imageData: req.body.imageData,
        whichImage: 'ProjectLogo',
    };
    console.log('amit', req.body, client_id);

    Survey.findOne({
        where: {
            version_id: req.body.version_id,
            survey_id: req.body.survey_id,
            client_id: client_id
        }
    })
        .then((result) => {
            if(result) {
                return res.status(400)
                    .json({success: false, message: 'Survey with same Version already exist. Please change survey version or create new one.'});
            }
            req.body.created_by = creator;
            return surveyAdd(req.body, client_id, 'Draft');
        })
        .then(() => {
            res.status(200)
                .send({success: true, msg: 'Survey Saved as Draft Successfully'});
        })
        .catch(err => {
            res.status(400)
                .send({success: true, msg: err});
        });
}

function addSurveyor(assigned_to, survey, client_id, creator) {
    return new Promise((resolve, reject) => {
        const post = assigned_to.split(',');
        console.log('assigned_to', post);
        let count = 0;
        post.forEach((item) => {
            let insertObj = {
                client_id: client_id,
                survey_id: survey.survey_id,
                creator: creator,
                version_id: survey.version_id,
                user_id: item,
            };
            console.log('insertObj', insertObj);
            SurveyUser.create(insertObj, {isNewRecord: true})
                .then((x) => {
                    console.log('count', count);
                    count++;
                    if(count === post.length) {
                        console.log('saved user srvue ', count);
                        resolve(x);
                    }
                })
                .catch((err) => {
                    logger.error({
                        msg: 'Unauthorised',
                        error: err,
                    });
                    reject(err);
                });
        });
    });
}

function surveyAdd(userObj, client_id, survey_status) {
    return new Promise((resolve, reject) => {
        const post = {
            client_id: client_id,
            client_logo: userObj.client_logo,
            version_id: userObj.version_id,
            survey_name: userObj.survey_name,
            survey_id: userObj.survey_id,
            survey_template: userObj.survey_template,
            survey_url: userObj.survey_url,
            created_by: userObj.created_by,
            survey_created_at: new Date().toString(),
            survey_description: userObj.survey_description,
            survey_type: userObj.survey_type,
            assigned_to: userObj.assigned_to,
            survey_status: survey_status,
        };

        Survey.create(post)
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
