/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/survey-responses              ->  index
 * POST    /api/survey-responses              ->  create
 * GET     /api/survey-responses/:id          ->  show
 * PUT     /api/survey-responses/:id          ->  upsert
 * PATCH   /api/survey-responses/:id          ->  patch
 * DELETE  /api/survey-responses/:id          ->  destroy
 */

import {applyPatch} from 'fast-json-patch';
import {SurveyResponse} from '../../sqldb';
import fs from 'fs';

var formidable = require('formidable');

const Minio = require('minio');

const minioClient = new Minio.Client({
    endPoint: process.env.minio_endPoint,
    useSSL: process.env.minio_useSSL === 'true',
    accessKey: process.env.minio_accessKey,
    secretKey: process.env.minio_secretKey,
});

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

// Gets a list of SurveyResponses
export function index(req, res) {
    return SurveyResponse.findAll()
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Gets a single SurveyResponse from the DB
export function show(req, res) {
    return SurveyResponse.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Gets a single SurveyResponse from the DB by user
export function getTotalResponseByUser(req, res) {

    return SurveyResponse.findAll({
        where: {
            responseBy: req.authData.PM_UserID
        }
    })
        .then((responseResult) => res.json({status: true, msg: 'Response List', data: responseResult}))
        .catch(handleError(res));
}

// Creates a new SurveyResponse in the DB
export function createSurveyResponse(req, res) {
    const clientId = req.authData.PM_Client_ID;
    const responseBy = req.authData.PM_UserID;
    console.log('clientId', req.body, clientId);
    req.body.responseBy = responseBy;
    const responseJson = req.body.responseJson;
    let template = JSON.parse(responseJson);
    //let tmpwithsign = template.filter((item) => {
    //   return item.type === 'signature';
    // })
    const post = {
        clientId,
        versionId: req.body.versionId,
        surveyName: req.body.surveyName,
        surveyId: req.body.surveyId,
        surveyTemplate: req.body.surveyTemplate,
        surveyUrl: req.body.surveyUrl,
        createdBy: req.body.createdBy,
        responseBy: responseBy,
        responseStatus: 'Submitted',
        responseAt: new Date().toString(),
        responseJson: req.body.responseJson,
        surveyType: req.body.surveyType,
        surveyStatus: req.body.surveyStatus,
    };
    SurveyResponse.create(post)
        .then(() => {
            res.status(200)
                .send({success: true, msg: 'Survey Response Submitted Successfully'});
        })
        .catch(err => {
            res.status(400)
                .send({success: false, msg: 'Error while Survey Response Submit:' + err});
        });
}

export function submitPartialSurveyResponse(req, res) {
    const clientId = req.authData.PM_Client_ID;
    const responseBy = req.authData.PM_UserID;
    console.log('clientId', req.body, clientId);
    req.body.responseBy = responseBy;
    const responseJson = req.body.responseJson;
    let template = JSON.parse(responseJson);
    //let tmpwithsign = template.filter((item) => {
    //   return item.type === 'signature';
    // })
    const post = {
        clientId,
        versionId: req.body.versionId,
        surveyName: req.body.surveyName,
        surveyId: req.body.surveyId,
        surveyTemplate: req.body.surveyTemplate,
        surveyUrl: req.body.surveyUrl,
        createdBy: req.body.createdBy,
        responseBy: responseBy,
        responseStatus: 'Partial',
        responseAt: new Date().toString(),
        responseJson: req.body.responseJson,
        surveyType: req.body.surveyType,
        surveyStatus: req.body.surveyStatus,
    };
    SurveyResponse.create(post)
        .then(() => {
            res.status(200)
                .send({success: true, msg: 'Survey Response Submitted Successfully'});
        })
        .catch(err => {
            res.status(400)
                .send({success: false, msg: 'Error while Survey Response Submit:' + err});
        });
}

// async function uploadSignature(authData, tmpwithsign) {
//     const bucket_name = `${process.env.minio_bucket_name}`;///${req.authData.PM_Client_ID}/${req.authData.PM_UserID}`
//     let count = 0;
//     return new Promise((resolve) => {
//         for (var i = 0; i < tmpwithsign.length; i++) {
//             count++;
//             console.log('in  loop', tmpwithsign[i],tmpwithsign.length);
//             if (tmpwithsign[i].type === 'signature') {
//                 console.log('if loop', tmpwithsign[i].type)
//                 let file = tmpwithsign[i].ans;
//                 let tmp = tmpwithsign[i];
//                 if (file) {
//                     let newPath = `surveymine_img_${Date.now()}_${Math.ceil(Math.random(100000) * 1000000)}.jpg`;
//                     const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
//                     if (matches.length !== 3) {
//                         // return new Error('Invalid input string');
//                         resolve([]);
//                     }
//                     const fileStream = new Buffer(matches[2], 'base64');
//                     const object_name = `${authData.PM_Client_ID}/${authData.PM_UserID}/${newPath}`
//                     minioClient.bucketExists(bucket_name, (err2, exists) => {
//                         if (err2) {
//                             console.log({status: 500, msg: 'Bucket is not exists'});
//                             resolve(err2);
//                         }
//                         if (exists) {
//                             console.log(bucket_name, '   --exists --- ')
//                             minioClient.putObject(bucket_name,
//                                 object_name, fileStream, (err3, etag) => {
//                                     if (err3) {
//                                         console.log({status: 500, msg: 'Image failed to push in Minio'});
//                                         resolve(err3);
//                                     }
//                                     tmp.ans = newPath;
//                                     console.log('etag ', etag, tmp);
//                                     tmpwithsign[i] = tmp;
//                                     console.log('this', tmpwithsign[i],i);
//                                     console.log('count in ', count, tmpwithsign);
//                                     if (count === tmpwithsign.length) {
//                                         console.log('if count in ', count)
//                                         resolve(JSON.stringify(tmpwithsign));
//                                     }
//                                 });
//                         } else {
//                             minioClient.makeBucket(bucket_name, 'us-east-1', (err1) => {
//                                 if (err1) {
//                                     console.log('errr ', err1);
//                                     console.log({status: 500, msg: 'Image Bucket is not created'});
//                                     resolve(err1);
//                                 }
//                                 console.log('created --- ', err1);
//                                 minioClient.putObject(bucket_name, object_name,
//                                     fileStream, (err3, etag) => {
//                                         if (err3) {
//                                             console.log({status: 500, msg: 'Image failed to push in Minio'});
//                                             resolve(err3);
//                                         }
//                                         tmp.ans = newPath;
//                                         console.log('etag ', etag);
//                                         tmpwithsign[i] = tmp;
//                                         console.log('this', tmpwithsign[i]);
//                                         console.log('count out ', count);
//                                         if (count === tmpwithsign.length) {
//                                             console.log('if count out', count)
//                                             resolve(JSON.stringify(tmpwithsign));
//                                         }
//                                     });
//                             });
//                         }
//                     });
//                 }
//
//             }
//         }
//     });
// }

export function uploadFileForAnswer(req, res) {
    //console.table(req.authData)
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        // console.log(files);
        const extension = files.file.name.split('.').pop();
        const oldPath = files.file.path;
        const randomName = `surveymine_img_${Date.now()}_${Math.ceil(Math.random(100000) * 1000000)}.${extension}`;
        const newPath = `${randomName}`.toLowerCase();
        console.log(extension, oldPath, newPath)
        /* return fs.rename(oldPath, newPath, (error) => {
         if (error) {
           console.log(error);
           return res.status(500).send(error);
         } */
        const fileStream = fs.createReadStream(oldPath);
        const bucket_name = `${process.env.minio_bucket_name}`;///${req.authData.PM_Client_ID}/${req.authData.PM_UserID}`
        const object_name = `${req.authData.PM_Client_ID}/${req.authData.PM_UserID}/${newPath}`
        console.log('bucket_name', bucket_name);
        return minioClient.bucketExists(bucket_name, (err2, exists) => {
            if (err2) {
                console.log(bucket_name, ' not exitst');
                return res.status(500).send('Bucket is not exists');
            }
            if (exists) {
                console.log(bucket_name, ' exists');
                return minioClient.putObject(bucket_name,
                    object_name, fileStream, (err3, etag) => {
                        if (err3) {
                            return res.status(500).send('Image failed to push in Minio');
                        }
                        console.log('etag ', etag, object_name);
                        res.json({status: 200, msg: 'Image Uploaded Successfully', data: newPath});
                    });
            }
            return minioClient.makeBucket(bucket_name, 'us-east-1', (err1) => {
                if (err1) {
                    console.log('Image Bucket is not created Error occurred ', err1);
                    return res.status(500).send('Image Bucket is not created');
                }
                console.log(bucket_name, 'created --- ', err1);
                return minioClient.putObject(bucket_name, object_name,
                    fileStream, (err3, etag) => {
                        if (err3) {
                            return res.status(500).send('Image failed to push in Minio');
                        }
                        console.log('etag --- ', etag, object_name);
                        res.json({status: 200, msg: 'Image Uploaded Successfully', data: newPath});
                    });
            });
        });
    });
}

// Upserts the given SurveyResponse in the DB at the specified ID
export function upsert(req, res) {
    if (req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }
    return SurveyResponse.upsert(req.body, {
        where: {
            _id: req.params.id
        }
    })
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Updates an existing SurveyResponse in the DB
export function patch(req, res) {
    if (req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }
    return SurveyResponse.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(patchUpdates(req.body))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Deletes a SurveyResponse from the DB
export function destroy(req, res) {
    return SurveyResponse.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(handleError(res));
}
