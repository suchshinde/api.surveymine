/**
 * Main application routes
 */

import errors from './components/errors';
import path from 'path';

export default function(app) {
    // Insert routes below
    app.use('/api/surveyid-generator', require('./api/surveyid-generator'));
    app.use('/api/questionbank', require('./api/questionbank'));
    app.use('/api/categorys', require('./api/category'));
    app.use('/api/templates', require('./api/template'));
    app.use('/api/surveyresponse', require('./api/survey-response'));
    app.use('/api/surveyuser', require('./api/survey-user'));
    app.use('/api/surveys', require('./api/survey'));
    app.use('/api/login', require('./api/login'));
    app.use('/api/register', require('./api/register'));
    app.use('/api/role', require('./api/rolemgm'));
    app.use('/api/user', require('./api/user'));
    app.use('/api/notifications', require('./api/notifications'));
    app.use('/auth', require('./auth').default);
    /*app.use('/api/things', require('./api/thing'));*/
    app.use('/api/logout', require('./api/logout'));

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|bower_components|assets)/*')
        .get(errors[404]);

    // All other routes should redirect to the app.html
    app.route('/*')
        .get((req, res) => {
            res.sendFile(path.resolve(`${app.get('appPath')}/app.html`));
        });
}
