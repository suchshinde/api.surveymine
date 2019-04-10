/**
 * Created by swati on 10/4/19.
 */

import {QuestionCategoryMaster} from '../../sqldb';
import {logger} from '../../components/logger';


// Creates a new addQuestionCategoryMaster in the DB

export function addquestionCategory(req, res) {
    // const creator = req.authData.PM_UserID;

    let msg = 'Catagory already exist.';
    const clientId = req.authData.PM_Client_ID;
    QuestionCategoryMaster.findOne({
        where: {
            categoryName: req.body.categoryName
        }
    })
        .then((result) => {
            if (result) {
                return new Promise((resolve, reject) => {
                    reject(msg);
                });
            } else {
                return saveCategory(req.body, clientId, req.authData.PM_UserID);
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

function saveCategory(userObj, clientId, UserId) {
    return new Promise((resolve, reject) => {
        const post = {
            clientId,
            categoryName: userObj.categoryName,
            createdBy: UserId,
            createdAt: new Date().toString()
        };
        QuestionCategoryMaster.create(post)
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

// Gets a list of Catagorys
export function getQuestionCategoryList(req, res) {
    QuestionCategoryMaster.findAll({
            attributes: ['Id', 'categoryName']
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

// Update Existing category
export function updateQuestionCategory(req, res) {
    const clientId = req.authData.PM_Client_ID;
    const msg = 'Catagory name already exist.';
    QuestionCategoryMaster.findOne({
        where: {
            categoryName: req.body.categoryName,
            clientId
        }
    })
        .then((result) => {
            if(result) {
                return new Promise((resolve, reject) => {
                    reject(msg);
                });
            } else {
                return updateCategoryName(req.body, clientId, req.authData.PM_UserID);
            }
        })
        .then(() => {
            res.status(200)
                .send({success: true, msg: 'Catagory Updated Successfully'});
        })
        .catch(err => {
            res.status(400)
                .send({success: true, msg: err});
        });
}

function updateCategoryName(userObj, clientId, UserId) {
    return new Promise((resolve, reject) => {
        const post = {
            clientId,
            categoryName: userObj.categoryName,
            createdBy: UserId,
            createdAt: new Date().toString()
        };

        QuestionCategoryMaster.update(post, {
            where: {
                Id: userObj.Id
            }
        })
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


