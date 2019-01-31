/*eslint no-process-env:0*/

import path from 'path';
import dotenv from 'dotenv';

const root = path.normalize(`${__dirname}/../../../`);

const env = dotenv.config({ path: path.join(root, '.env') });

const all = {
    env: process.env.NODE_ENV,

    // Root path of server
    root: path.normalize(`${__dirname}/../../..`),

    // dev client port
    clientPort: process.env.CLIENT_PORT || 3000,

    // Server port
    PORT: process.env.PORT || 9000,

    DB_HOST: process.env.DB_HOST,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,

    // Server IP
    IP: process.env.IP || '0.0.0.0',
    seedDB: false,

    // Secret for session, you will want to change this and make it an environment variable
    secrets: {
        session: 'setup-secret',
    },
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = all;

