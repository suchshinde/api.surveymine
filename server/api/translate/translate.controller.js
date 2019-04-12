/**

 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/translate              ->  index
 * POST    /api/translate              ->  create
 * GET     /api/translate/:id          ->  show
 * PUT     /api/translate/:id          ->  upsert
 * PATCH   /api/translate/:id          ->  patch
 * DELETE  /api/translate/:id          ->  destroy
 */

import {applyPatch} from 'fast-json-patch';

const {Translate} = require('@google-cloud/translate');


// Creates a new Translate in the DB
export function translateData(req, res) {
    let target = req.body.target_lang;
    let trans_type = req.body.trans_type;
// Your Google Cloud Platform project ID
//    const projectId = 'surveymine-translate';
// Instantiates a client
    console.log('target', target)
    console.log('trans_type', trans_type)
    let questiontemp = req.body.template;
    console.log('template', questiontemp)
    counter = 0;
    newArray = [];
    if (trans_type === 'edit')
        translateEditTemplate(questiontemp, res, target);
    else if (trans_type === 'preview')
        translatePreviewTemplate(questiontemp, res, target);
}
let counter;
let newArray;
export function translateEditTemplate(questiontemp, res, target) {
    const text = questiontemp[counter];
    console.log(`text: ${text}`);
    console.log(`counter: ${counter}`);

    var translate = new Translate({
        key: 'AIzaSyDcjaFh0146I0hnyA3Udx2H05QT1wxaSLs'
    });
    translate
        .translate(text.name, target)
        .then(results => {
            let response = questiontemp[counter];
            response.name = results[0];
            const translation = results[0];
            console.log(`Text: ${text.name}`);
            console.log(`Translation: ${translation}`);
            newArray.push(response);
            console.log(counter, questiontemp.length);
            counter++;
            if (counter === questiontemp.length) {
                console.log('if', counter);
                res.status(200).json({success: true, data: newArray});
            }
            else {
                translateEditTemplate(questiontemp, res, target);
            }
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
}
export function translatePreviewTemplate(questiontemp, res, target) {
    const text = questiontemp[counter].jsondata;
    console.log(`text: ${text}`);
    console.log(`counter: ${counter}`);

    var translate = new Translate({
        key: 'AIzaSyDcjaFh0146I0hnyA3Udx2H05QT1wxaSLs'
    });
    translate
        .translate(text.name, target)
        .then(results => {
            let response = questiontemp[counter];
            response.jsondata.name = results[0];
            const translation = results[0];
            console.log(`Text: ${text.name}`);
            console.log(`Translation: ${translation}`);
            newArray.push(response);
            console.log(counter, questiontemp.length);
            counter++;
            if (counter === questiontemp.length) {
                console.log('if', counter, newArray);
                res.status(200).json({success: true, data: newArray});
            }
            else {
                translatePreviewTemplate(questiontemp, res, target);
            }
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
}
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

// Gets a list of Translates3
export function index(req, res) {
    return Translate.findAll()
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Gets a single Translate from the DB
export function show(req, res) {
    return Translate.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Upserts the given Translate in the DB at the specified ID
export function upsert(req, res) {
    if (req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }
    return Translate.upsert(req.body, {
        where: {
            _id: req.params.id
        }
    })
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Updates an existing Translate in the DB
export function patch(req, res) {
    if (req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }
    return Translate.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(patchUpdates(req.body))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Deletes a Translate from the DB
export function destroy(req, res) {
    return Translate.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(handleError(res));
}
