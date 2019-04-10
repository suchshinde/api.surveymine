/**
 * Created by swati on 2/4/19.
 */
import {QuestionBankMaster} from '../../sqldb';

// Creates a new QuestionBank in the DB

export function createNewQuestionBank(req, res, clientId) {
    console.log('REQ===', req.body)
    const creator = req.authData.PM_UserID;
    // console.log('QbAdd', post);
    const questionArray = req.body.question;
    console.log('QUESARRAY', questionArray.questionData);
    var qType = [];
    var sepQuestion = [];
    for(var i = 0; i < questionArray.questionData.length; i++) {
        qType.push(questionArray.questionData[i].type);
        sepQuestion.push(questionArray.questionData[i]);
    }
    console.log('qType', qType);
    console.log('sepQues', sepQuestion)

    for(var j = 0; j < questionArray.questionData.length; j++) {
        const post = {
            clientId,
            question: sepQuestion[j],
            questionType: qType[j],
            categoryId: req.body.categoryId,
            questionAnswers: req.body.questionAnswers,
            createdBy: creator,
            createdAt: new Date().toString(),
        };
    QuestionBankMaster.create(post)
        .then(() => {
            res.status(200)
                .send({success: true, msg: 'Questions Added Successfully'});
        })
        .catch(err => {
            res.status(400)
                .send({success: true, msg: err});
        });
    }
    // .then((x) => {
    //     resolve(x);
    // })
    // .catch((err) => {
    //     logger.error({
    //         msg: 'Unauthorised',
    //         error: err,
    //     });
    //     reject(err);
    // });
}
