/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/things              ->  index
 * POST    /api/things              ->  create
 * GET     /api/things/:id          ->  show
 * PUT     /api/things/:id          ->  upsert
 * PATCH   /api/things/:id          ->  patch
 * DELETE  /api/things/:id          ->  destroy
 */
import {applyPatch} from 'fast-json-patch';
import {Thing} from '../../sqldb';

var fcm = require('fcm-notification');
let path = require('../locationtracker-13f62-firebase-adminsdk-sie5v-8488f77387');

var token = 'ejY5AU1c9oM:APA91bFwfcJbK-vRs9zNkHtM0uFFt1nbAwQ0QP8siqqeT2PO1Tctx5_mVgnm9NNX1MpVCsYlnDwkqE6FJq8pXU6MCpWshT3eKxda7LZyhJL655EINxqkzTxIyM0xHH4B-VEfo-mjBx6Z';
let localStorage;

let jsnObj = {
    'type': 'service_account',
    'project_id': 'locationtracker-13f62',
    'private_key_id': '8488f77387ca08ad4789f29457fff0bf372326de',
    'private_key': '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCu3cx/6t46qtEZ\ngKX/YLNlrGGyzlKLNM/NiVanb+jUTSt31OkO/786zu/QahBQQkryO2A9BB/RnTpj\ne0Qt1+NN6rxK9LZNBuU/PEg9uHooJ8u9l0Bg6bte/YdIA6XhLBa+Z03yS4CIK8Wh\n4LRIiz/8RVvrW9zFmw9mkw07QYUpuZRkAVy9M9i76MjidpNy+iiAeP1/fg1EyCmG\n+z0MDDCl+nu5823X/zU6yG1Wz2K7jAu6W2YuuWrRSAx22YxVDG8xZ8pEPqONxhZA\nyjzIWXZNtr7LMN64nPPzH7buuEXEHHtzKpR9g8g2WoOPVC/B54kbsU5tfrIWbDyi\n5cQQ0roFAgMBAAECggEAH3vIn3lShJ6PojdS681lz1b/ihlyrCSYi2mARAo2kc7J\nFjyrr2sla3mpnM0T3ddptf4xwBqXff6AbjvZ1SUrBDLQrvArSGgG62E3ooEt4T/1\nA1ARo8FBXoNoEXOysH1nJOXll0u3uwyiexhBbVRA83Mrbw8tixh1Z+Lu/W25A39d\nbyZZGrg/3CX1C2c3dj1mVfD24IrhNnYfF1L6nuNIvrFu4dQyChOaPazJ3v/8qxzW\nTAlCg2K6N+FLnVGIAVzYJI5NKfBOgtBnO2I4cE0Jwx6kv30ifTBdtRkups20zHZE\n95RcSyTSWI2tMh7CC5tnKsK7uydrUYp7EsJ/O35JkQKBgQDdfT5P+xjWqdEM1VPy\ngffumeQH78/30BImIanR7dZ/7BOAcClgddRx40E5ZtSl3q352eHqPD0Z4dUT7vom\nAnR7w+/ka12baXronwzqNApvz2A8LdgaylNGRaqtLKTcyxb1TwWvmqF7CU9oLSr0\nf5yw5jqgEb0/lKtJR5nJEQXRnQKBgQDKHN191d+ivcwp7tINo3W+dzizndpIlejC\nOQC2DCZnGhN3nxLrrE86E8Kz5KhEqmnmxR1n7f1GIOTD/efaouSie4zXJJ6tGnpo\nuZsiQFtvG35mn8d6zEhhAVi1csqeSV7hPANmAklFJrUs2l4qbQjGWYCmh1bd+mBF\ngLAjs2ixiQKBgQCAviIQP3YqoL7g5MdM+PryeAUyD9UkyI8kFwEtA0BhTwnu6ENE\nzHjWUjBBe2IzoAIkbt+AVc92UeyXD5vbqCWpIzU34qigg2lr+bd6ExHV+AaKNGOe\n/uf0ut4AlyilJm+L24kEj685YyoC9e43/E1KDikZjfYhFPuTNslPNFPbiQKBgQCj\nt7QXPYr1Ced6xDC0yYcULQDqRmDOUViFE6Wm0bq945qHWHz8GMzoj581F3DShnRY\nca17RYXXK8gDlwYbzb2EfK4+jDRYpk0nzcmDejxWiR/fw2fT6exrX6ra+Ex24ZoQ\nuwtJs2pksJEr7ws+NKpZ+aBDxPexwiH/ytljYe3ZeQKBgQDWxl2n6aSdGO6IdZ5E\nEqxZcPeZXlycAEyJwSYrM9dZOuSYxX08gCBQb6oUD6o8NkUSOqBnUym0DQ+OpUnR\njT5FeO2F+MCUCUls/VHweVqb3ixXHQXDgF0LIGkspKHSAI9/IMr160AZzCp1uCQc\nbnsbX8efFZZrnAljVeyUxIXPgQ==\n-----END PRIVATE KEY-----\n',
    'client_email': 'firebase-adminsdk-sie5v@locationtracker-13f62.iam.gserviceaccount.com',
    'client_id': '118405902975542535255',
    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
    'token_uri': 'https://oauth2.googleapis.com/token',
    'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
    'client_x509_cert_url': 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-sie5v%40locationtracker-13f62.iam.gserviceaccount.com'
}
var FCM = new fcm(jsnObj);

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

// Gets a list of Things
export function index(req, res) {
    Thing.findAll()
        .then(response => {
        })
        .catch(handleError(res));
    let type = req.params.type;
    console.log(type);
    sendTemplateNotification(type);
    res.status(200).json('this is test');
}

function sendTemplateNotification(type) {
    let tk = localStorage.getItem('token');
    console.log('tk', tk)
    var message = {
        notification: {
            title: 'Title of notification',
            body: 'Body of notification'
        },
        token: tk
    };
    let ID = Math.floor(Math.random() * Math.floor(5000));
    if (type === 'create') {
        message.data = { //This is only optional, you can send any data
            message: ' {'
                + '        "msg": "You have assigned to newly Created Survey. Id :' + ID + '",'
                + '        "josnTemplate": "jsonString"'
                + '    }'
        };
    } else if (type === 'update') {
        message.data = {
            message: ' {'
                + '"msg": "Survey is updated Please update to new version. Id :-' + ID + '",'
                + '"josnTemplate": "jsonString"'
                + '}'
        };
    }
    console.log('message', message)

    FCM.send(message, function (err, response) {
        if (err) {
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
    Thing.create(req.body)
        .then(response => {
        })
        .catch(handleError(res));
    if (typeof localStorage === 'undefined' || localStorage === null) {
        var LocalStorage = require('node-localstorage').LocalStorage;
        localStorage = new LocalStorage('./scratch');
    }
    localStorage.setItem('token', req.body.token);
    console.log(localStorage.getItem('token'));
    res.status(200).json(`Token Saved :${req.body.token}`);

}

// Upserts the given Thing in the DB at the specified ID
export function upsert(req, res) {
    if (req.body._id) {
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
    if (req.body._id) {
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
