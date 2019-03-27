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
import {Survey, SurveyUser, Sequelize} from '../../sqldb';

function respondWithResult(res, statusCode) {
    statusCode = statusCode || 200;
    return function (entity) {
        if (entity) {
            return res.status(statusCode)
                .json(entity);
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
                .then(() => res.status(204)
                    .end());
        }
    };
}

function handleEntityNotFound(res) {
    return function (entity) {
        if (!entity) {
            res.status(404)
                .end();
            return null;
        }
        return entity;
    };
}

function handleError(res, statusCode) {
    statusCode = statusCode || 500;
    return function (err) {
        res.status(statusCode)
            .send(err);
    };
}

// Gets a list of Surveys
export function getAllSurveyAssignedToUser(req, res) {
    // console.log('asjdhskjd', req.authData.PM_Client_ID, req.authData.PM_UserID);
    SurveyUser.findAll({
        where: {
            clientId: req.authData.PM_Client_ID,
            userId: req.authData.PM_UserID
        }
    })
        .then((surveyResult) => {
            let surveysByUser = [];
            let count = 0;
            surveyResult.forEach((item) => {
                Survey.findAll({
                    where: {
                        surveyId: item.surveyId
                    }
                })
                    .then((survey) => {
                        var found = surveysByUser.some(function (el) {
                            return el.surveyId.surveyId === item.surveyId;
                        });
                        if (!found) {
                            surveysByUser.push({surveyId: survey[0], versions: survey});
                        }
                        count++;
                        if (count === surveyResult.length) {
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

// Get Surveys Created By User
export function getAllSurveyCreatedByUser(req, res) {
    console.log(req.params.search);
    let condition = {};
    if (req.params.search === '0') {
        condition = {
            where: Sequelize.and({
                    clientId: req.authData.PM_Client_ID,
                    createdBy: req.authData.PM_UserID
                },
                Sequelize.or(
                    {
                        surveyStatus: 'Published',
                    },
                    {
                        surveyStatus: 'Draft',
                    },
                ),
            ),
        };
    } else {
        condition = {
            where: Sequelize.and({
                    clientId: req.authData.PM_Client_ID,
                    createdBy: req.authData.PM_UserID,
                    surveyName: {[Sequelize.Op.like]: `%${req.params.search}%`}
                },
                Sequelize.or(
                    {
                        surveyStatus: 'Published',
                    },
                    {
                        surveyStatus: 'Draft',
                    },
                ),
            ),
        };
    }
    // console.log('asjdhskjd', req.authData.PM_Client_ID, req.authData.PM_UserID);
    Survey.findAll(condition)
        .then((surveyResult) => res.json({status: true, msg: 'Survey List', data: surveyResult}))
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
    const clientId = req.authData.PM_Client_ID;
    const surveyName = req.body.surveyName;
    const creator = req.authData.PM_UserID;
    const bodyForImage = {
        clientId: req.authData.PM_Client_ID,
        imageData: req.body.imageData,
        whichImage: 'ProjectLogo',
    };
    console.log('clientId', req.body, clientId);

    Survey.findOne({
        where: {
            versionId: req.body.versionId,
            surveyId: req.body.surveyId,
            clientId
        }
    })
        .then((result) => {
            if (result) {
                return res.status(400)
                    .json({
                        success: false,
                        message: 'Survey with same Version already exist. Please change survey version or create new one.'
                    });
            }
            req.body.createdBy = creator;
            return surveyAdd(req.body, clientId, 'Published');
        })
        .then((result) => {
            addSurveyor(req.body.assignedTo, result, clientId, creator);
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
    const clientId = req.authData.PM_Client_ID;
    const surveyName = req.body.surveyName;
    const creator = req.authData.PM_UserID;
    const isdraftUpdate = req.body.draftUpdate;
    const bodyForImage = {
        clientId: req.authData.PM_Client_ID,
        imageData: req.body.imageData,
        whichImage: 'ProjectLogo',
    };
    console.log('clientId', req.body, clientId);

    Survey.findOne({
        where: {
            surveyName: req.body.surveyName,
            clientId
        }
    })
        .then((result) => {
            if (result && !isdraftUpdate) {
                return res.status(400)
                    .json({
                        success: false,
                        message: 'Draft with same name already exist. Please change draft name or create new one.'
                    });
            }
            if (isdraftUpdate) {
                req.body.createdBy = creator;
                return updateDraft(req.body, clientId, 'Draft');
            }
            else {
                console.log('eeeeeeeeeeee');

                req.body.createdBy = creator;
                return surveyAdd(req.body, clientId, 'Draft');
            }
        })
        .then(() => {
            if (isdraftUpdate) {
                res.status(200)
                    .send({success: true, msg: 'Survey Draft Updated Successfully'});
            }
            else {
                res.status(200)
                    .send({success: true, msg: 'Survey Saved as Draft Successfully'});
            }
        })
        .catch(err => {
            res.status(400)
                .send({success: true, msg: err});
        });
}

function addSurveyor(assigned_to, survey, clientId, creator) {
    return new Promise((resolve, reject) => {
        const post = assigned_to.split(',');
        console.log('assigned_to', post);
        let count = 0;
        post.forEach((item) => {
            let insertObj = {
                clientId,
                surveyId: survey.surveyId,
                createdBy: creator,
                versionId: survey.versionId,
                userId: item,
            };
            console.log('insertObj', insertObj);
            SurveyUser.create(insertObj, {isNewRecord: true})
                .then((x) => {
                    console.log('count', count);
                    count++;
                    if (count === post.length) {
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

function surveyAdd(userObj, clientId, surveyStatus) {
    return new Promise((resolve, reject) => {
        const post = {
            clientId,
            clientLogo: userObj.clientLogo,
            versionId: userObj.versionId,
            surveyName: userObj.surveyName,
            surveyId: userObj.surveyId,
            surveyTemplate: userObj.surveyTemplate,
            surveyUrl: userObj.surveyUrl,
            createdBy: userObj.createdBy,
            surveyCreatedAt: new Date().toString(),
            surveyDescription: userObj.surveyDescription,
            surveyType: userObj.surveyType,
            assignedTo: userObj.assignedTo,
            surveySettingsData: userObj.surveySettingsData,
            surveyStatus,
        };

        console.log('SurveyAdd', post);
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

// updateDraft

function updateDraft(userObj, clientId, surveyStatus) {
    console.log('updateDraft', userObj);
    return new Promise((resolve, reject) => {
        const post = {
            clientId,
            clientLogo: userObj.clientLogo,
            versionId: userObj.versionId,
            surveyName: userObj.surveyName,
            surveyId: userObj.surveyId,
            surveyTemplate: userObj.surveyTemplate,
            surveyUrl: userObj.surveyUrl,
            createdBy: userObj.createdBy,
            surveyCreatedAt: new Date().toString(),
            surveyDescription: userObj.surveyDescription,
            surveyType: userObj.surveyType,
            assignedTo: userObj.assignedTo,
            surveyStatus,
        };

        Survey.update(post, {
            where: {
                surveyId: userObj.surveyId
            }
        }).then((x) => {
            resolve(x);
        })
            .catch((err) => {
                logger.error({
                    msg: 'Unauthorised',
                    error: err,
                });
                reject(err);
            });
    })
        ;
}


// Upserts the given Survey in the DB at the specified ID
export function upsert(req, res) {
    if (req.body._id) {
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
    if (req.body._id) {
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
