/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/things              ->  index
 * POST    /api/things              ->  create
 * GET     /api/things/:id          ->  show
 * PUT     /api/things/:id          ->  upsert
 * PATCH   /api/things/:id          ->  patch
 * DELETE  /api/things/:id          ->  destroy
 */
import { applyPatch } from 'fast-json-patch';
import {Thing} from '../../sqldb';
var fcm = require('fcm-notification');
let path = require('../locationtracker-13f62-firebase-adminsdk-sie5v-8488f77387');
var FCM = new fcm(path);
var token = 'ejY5AU1c9oM:APA91bFwfcJbK-vRs9zNkHtM0uFFt1nbAwQ0QP8siqqeT2PO1Tctx5_mVgnm9NNX1MpVCsYlnDwkqE6FJq8pXU6MCpWshT3eKxda7LZyhJL655EINxqkzTxIyM0xHH4B-VEfo-mjBx6Z';

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
                .then(() => res.status(204).end());
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

// Gets a list of Things
export function index(req, res) {
    // return Thing.findAll()
    //     .then(respondWithResult(res))
    //     .catch(handleError(res));
    let type = req.params.type;
    console.log(type);
    sendTemplateNotification(type);
    res.status(200).json('this is test');
}
function sendTemplateNotification(type) {
    var message = {
        notification: {
            title: 'Title of notification',
            body: 'Body of notification'
        },
        token
    };
    let ID = Math.floor(Math.random() * Math.floor(5000));
    if(type === 'create') {
        message.data = { //This is only optional, you can send any data

            message: ' {'
                + '        "msg": "You have assigned to newly Created Survey. Id :-' + ID + '",'
                + '        "josnTemplate": "jsonString"'
                + '    }'
        };
    } else if(type === 'update') {
        message.data = {
            message: ' {'
                + '"msg": "Servey is updated Please update to new version. Id :-' + ID + '",'
                + '"josnTemplate": "jsonString"'
                + '}'
        };
    }

    FCM.send(message, function(err, response) {
        if(err) {
            console.log('error found', err);
        } else {
            console.log('response here', response);
        }
    });
}

// Gets a single Thing from the DB
export function show(req, res) {
    return Thing.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Creates a new Thing in the DB
export function create(req, res) {
    let localStorage;

    if(typeof localStorage === 'undefined' || localStorage === null) {
        var LocalStorage = require('node-localstorage').LocalStorage;
        localStorage = new LocalStorage('./scratch');
    }
    localStorage.setItem('token', req.params.token);
    console.log(localStorage.getItem('token'));

    res.stautus(200).json(`Token Saved :${req.params.token}`);
    //
    // return Thing.create(req.body)
    //     .then(respondWithResult(res, 201))
    //     .catch(handleError(res));
}

// Upserts the given Thing in the DB at the specified ID
export function upsert(req, res) {
    if(req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }
    return Thing.upsert(req.body, {
        where: {
            _id: req.params.id
        }
    })
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Updates an existing Thing in the DB
export function patch(req, res) {
    if(req.body._id) {
        Reflect.deleteProperty(req.body, '_id');
    }
    return Thing.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(patchUpdates(req.body))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Deletes a Thing from the DB
export function destroy(req, res) {
    return Thing.find({
        where: {
            _id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(handleError(res));
}
