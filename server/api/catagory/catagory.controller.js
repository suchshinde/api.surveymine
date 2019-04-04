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
import {logger} from '../../components/logger';

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
            // eslint-disable-next-line prefer-reflect
            jsonpatch.apply(entity, patches, /*validate*/ true);
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
                .then(() => {
                    res.status(204).end();
                });
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

// Gets a list of Catagorys
export function getCatagoryList(req, res) {
    CatagoryMaster.findAll({
            attributes: ['Id', 'catagoryName']
        },
    )
        .then((obj) => {
            console.log('obj', obj);
            return res.json(obj);
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
export function addCatagory(req, res) {
    // const creator = req.authData.PM_UserID;

    let msg = 'Catagory already exist.';
    const clientId = req.authData.PM_Client_ID;
    CatagoryMaster.findOne({
        where: {
            catagoryName: req.body.catagoryName
        }
    })
        .then((result) => {
            if (result) {
                return new Promise((resolve, reject) => {
                    reject(msg);
                });
            } else {
                return saveCatagory(req.body, clientId, req.authData.PM_UserID);
            }
        })
        .then((data) => {
            console.log('weesdfsdfr212122', data);
            res.status(200)
                .send({success: true, msg: 'Catagory Created Successfully'});
        })
        .catch(err => {
            res.status(400)
                .send({success: false, msg: err});
        });
}

// Upserts the given Catagory in the DB at the specified ID
export function upsert(req, res) {
    if (req.body._id) {
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
    if (req.body._id) {
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
// export function deleteCatagory(req, res) {
//     console.log('requestttt', req.params.id);
//     return CatagoryMaster.destroy({
//         where: {
//             catagoryId: req.params.id
//         }
//     })
//         .then(() => {
//             res.status(200)
//                 .send({success: true, msg: 'Catagory Deleted Successfully'});
//         })
//         .catch(err => {
//             res.status(400)
//                 .send({success: true, msg: err});
//         });
//     // return CatagoryMaster.find({
//     //   where: {
//     //     _id: req.params.id
//     //   }
//     // })
//     //   .then(handleEntityNotFound(res))
//     //   .then(removeEntity(res))
//     //   .catch(handleError(res));
// }

// Update Existing catagory
// export function updateCatagory(req, res) {
//     console.log(req.authData);
//     // const clientId = req.authData.PM_Client_ID;
//     // const surveyName = req.body.surveyName;
//     // const creator = req.authData.PM_UserID;
//     // const isdraftUpdate = req.body.draftUpdate;
//     const bodyForImage = {
//
//         clientId: req.authData.PM_Client_ID,
//         imageData: req.body.imageData,
//         whichImage: 'ProjectLogo',
//     };
//     console.log('clientId', req.body, clientId);
//
//     Survey.findOne({
//         where: {
//             surveyName: req.body.surveyName,
//             clientId
//         }
//     })
//         .then((result) => {
//             if (result && isdraftUpdate) {
//                 return res.status(400)
//                     .json({
//                         success: false,
//                         message: 'Draft with same name already exist. Please change draft name or create new one.'
//                     });
//             }
//             if (isdraftUpdate) {
//                 req.body.createdBy = creator;
//                 return updateDraft(req.body, clientId, 'Draft');
//             }
//             else {
//                 console.log('eeeeeeeeeeee');
//
//                 req.body.createdBy = creator;
//                 return surveyAdd(req.body, clientId, 'Draft');
//             }
//         })
//         .then(() => {
//             if(isdraftUpdate) {
//                 res.status(200)
//                     .send({success: true, msg: 'Draft Updated Successfully'});
//             }
//             else {
//                 res.status(200)
//                     .send({success: true, msg: 'Survey Saved as Draft Successfully'});
//             }
//         })
//         .catch(err => {
//             res.status(400)
//                 .send({success: true, msg: err});
//         });
// }


function saveCatagory(userObj, clientId, UserId) {
    return new Promise((resolve, reject) => {
        const post = {
            clientId,
            catagoryName: userObj.catagoryName,
            createdBy: UserId,
            createdAt: new Date().toString()
        };
        CatagoryMaster.create(post)
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
