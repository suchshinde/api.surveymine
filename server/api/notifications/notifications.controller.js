/**
 * @Module Notofication Engine
 * @Developer Amit Ghodke
 * @Designation Software Engineer
 * @Company MobiNext Technologies Private Limited
 * @StartDate 4 MAR 2019
 * @LastModifiedDate  4 MAR 2019
 */

import nodemailer from 'nodemailer';
import axios from 'axios';
import fs from 'fs';
import handlebars from 'handlebars';
//import { subDays } from 'date-fns';


import {
  NotificationsEmailSms,
  NotificationsScreen,
  NotificationsTemplates,
  PermissionNotify,
  RegisterUser,
    Role,
    Sequelize,
    RolePermission,
} from '../../sqldb/';
import { getAllUserNoti } from '../user/user.controller';
import { RegisterClient } from '../../sqldb/portal.db';
//import { getImageUrl } from '../imageManagement/imageManagement.controller';
import _ from 'lodash';
// const createdDate = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');
// const updateStatusTimestamp = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');

function encodeBase64Image(filePath) {
  return new Promise((resolve) => {
    if (fs.existsSync(filePath)) {
      fs.readFile(filePath, (err, data) => {
        if (err) resolve(null);
        const buff = new Buffer(data);
        let imageData = buff.toString('base64');
        imageData = `data:image/${filePath.split('.')
          .pop()};base64,${imageData}`;
        resolve(imageData);
      });
    } else {
      resolve(null);
    }
  });
}


async function getUserProfile(data) {
  for (const item of data) {
    if (item.PM_User_ProfilePic) {
      const userUploadedFeedMessagesLocation = `${process.env.UPLOAD_PATH}/pmsuploads/images/profile/`;
      const userUploadedImagePath = `${userUploadedFeedMessagesLocation}${item.PM_User_ProfilePic}`;
      item.PM_User_ProfilePic = await encodeBase64Image(userUploadedImagePath);
    }
  }
  return data;
}


function getNotificationTypes(permissionArray) {
  return PermissionNotify.findAll({
    where: {
      permission_id: { [Sequelize.Op.in]: permissionArray },
    },
    raw: true,
  })
    .then((result) => {
      const array = [];
      for (let i = 0; i < result.length; i += 1) {
        if (!array.includes(result[i].notify_type)) {
          array.push(result[i].notify_type);
        }
      }
      return array;
    })
    .catch(() => []);
}

// find motification
export function find(req, res) {
  // console.log('req ---- ', req.authData);
  const id = parseInt(req.query.id, 10);
  const limitValue = parseInt(req.query.limit, 10);
  let skip = parseInt(req.query.count, 10);
  skip *= limitValue;
  const date = subDays(new Date(), 2);
  const permissionArray = [];

  for (let i = 0; i < req.authData.Permission.length; i += 1) {
    if (req.authData.Permission[i].Status === true) {
      permissionArray.push(req.authData.Permission[i].ID);
    }
  }

  getNotificationTypes(permissionArray)
    .then((notification) => {
      const notificationTypes2 = [];
      const notificationTypes1 = [];
      const notificationTypes = [];
      for (let i = 0; i < notification.length; i += 1) {
        if (notification[i] !== 'resource') {
          notificationTypes1.push(notification[i]);
        }
      }
      for (let i = 0; i < notificationTypes1.length; i += 1) {
        if (notificationTypes1[i] !== 'resourceRemove') {
          notificationTypes2.push(notificationTypes1[i]);
        }
      }
      for (let i = 0; i < notificationTypes2.length; i += 1) {
        if (notificationTypes2[i] !== 'resourcePublished') {
          notificationTypes.push(notificationTypes2[i]);
        }
      }
      console.log('notificationTypes ', notificationTypes);
      getProjectList(req.authData.PM_UserID, req.authData.PM_Client_ID)
        .then((projectIds) => {
          let whereCond = {};
          console.log('projectIds --- ', projectIds);
          console.log('user id --- ', req.authData.PM_UserID);
          console.log('req.authData.selectRoleID --- ', req.authData.selectRoleID);
          if (!permissionArray.includes(14)) {
            if (projectIds.length !== 0) {
            // if user is in present in project
              whereCond = {
                [Sequelize.Op.and]: [
                  { recipientId: id },
                  { clientId: req.authData.PM_Client_ID },
                  { createdAt: { [Sequelize.Op.gte]: date } },
                  {
                    [Sequelize.Op.or]: [
                      {
                        [Sequelize.Op.and]: [
                          { messageType: { [Sequelize.Op.in]: notificationTypes } },
                          { projectId: { [Sequelize.Op.in]: projectIds } },
                        ],
                      },
                      {
                        [Sequelize.Op.and]: [
                          { projectId: { [Sequelize.Op.in]: projectIds } },
                          { messageType: { [Sequelize.Op.in]: ['resource', 'resourcePublished'] } },
                          { roleId: req.authData.selectRoleID },
                        ],
                      },
                      {
                        [Sequelize.Op.and]: [
                          { messageType: { [Sequelize.Op.eq]: 'resourceRemove' } },
                          { roleId: req.authData.selectRoleID },
                        ],
                      },
                      {
                        messageType: { [Sequelize.Op.in]: ['default', 'firstLoginWelcome', 'firstLoginTips', 'firstLoginStartFirstProject'] },
                      },
                    ],
                  },
                  {
                    [Sequelize.Op.or]: [
                      {
                        [Sequelize.Op.and]: [
                          {
                            messageType: { [Sequelize.Op.in]: ['firstLoginWelcome', 'firstLoginTips', 'firstLoginStartFirstProject'] },
                          },
                          { senderId: { [Sequelize.Op.eq]: req.authData.PM_UserID } },
                        ],
                      },
                      { senderId: { [Sequelize.Op.ne]: req.authData.PM_UserID } },
                    ],
                  },
                ],
              };
            } else {
              console.log('else project ---- ');
              // if user is not present in any project
              whereCond = {
                [Sequelize.Op.and]: [
                  { recipientId: id },
                  { clientId: req.authData.PM_Client_ID },
                  { createdAt: { [Sequelize.Op.gte]: date } },
                  { [Sequelize.Op.or]: [
                    {
                      [Sequelize.Op.and]: [
                        { messageType: { [Sequelize.Op.in]: ['resource', 'resourcePublished'] } },
                        { roleId: req.authData.selectRoleID },
                      ],
                    },
                    {
                      [Sequelize.Op.and]: [
                        { messageType: { [Sequelize.Op.eq]: 'resourceRemove' } },
                        { roleId: req.authData.selectRoleID },
                      ],
                    },
                    {
                      messageType: { [Sequelize.Op.in]: ['default', 'firstLoginWelcome', 'firstLoginTips', 'firstLoginStartFirstProject'] },
                    },
                  ] },
                  { [Sequelize.Op.or]: [
                    {
                      [Sequelize.Op.and]: [
                        {
                          messageType: { [Sequelize.Op.in]: ['firstLoginWelcome', 'firstLoginTips', 'firstLoginStartFirstProject'] },
                        },
                        { senderId: { [Sequelize.Op.eq]: req.authData.PM_UserID } },
                      ],
                    },
                    { senderId: { [Sequelize.Op.ne]: req.authData.PM_UserID } },
                  ] },
                ],
              };
            }
          } else {
            whereCond = {
              recipientId: id,
              clientId: req.authData.PM_Client_ID,
              createdAt: { [Sequelize.Op.gte]: date },
              messageType: { [Sequelize.Op.in]: notificationTypes },
            };
          }
          // console.log('wheree  ', whereCond);
          RegisterUser.findAll({
            where: {
              PM_Client_ID: req.authData.PM_Client_ID,
            },
            include: [
              {
                model: NotificationsScreen,
                as: 'Notification',
                where: whereCond,
              },
            ],
            offset: skip,
            limit: limitValue,
            subQuery: false,
            order: [[{ model: NotificationsScreen, as: 'Notification' }, 'id', 'DESC']],
            raw: true,
          })
            /* .then((result) => {
              // return res.json(result);
              // console.log('------------------------- ', result);
              const data = result;
              return getUserProfile(data);
            }) */
            .then((results) => {
              let data = results;
              data = data.map((ele) => {
                const eleData = ele;
                eleData.notify_Id = eleData['Notification.id'];
                eleData.notity_senderId = eleData['Notification.senderId'];
                eleData.notity_recipientId = eleData['Notification.recipientId'];
                eleData.notity_messageType = eleData['Notification.messageType'];
                eleData.notity_messageSubject = eleData['Notification.messageSubject'];
                eleData.notity_description = eleData['Notification.description'];
                eleData.notity_status = eleData['Notification.status'];
                eleData.notity_isWeb = eleData['Notification.isWeb'];
                eleData.notity_isMob = eleData['Notification.isMob'];
                eleData.notity_clientId = eleData['Notification.clientId'];
                eleData.notity_projectId = eleData['Notification.projectId'];
                eleData.notity_subProjectId = eleData['Notification.subProjectId'];
                eleData.notity_milestoneId = eleData['Notification.milestoneId'];
                eleData.notity_taskId = eleData['Notification.taskId'];
                eleData.notity_createdAt = eleData['Notification.createdAt'].toString().substr(0, 15);
                eleData.notity_updatedAt = eleData['Notification.updatedAt'];
                eleData.notity_projectName = eleData['Notification.projectName'];
                eleData.notity_projectType = eleData['Notification.projectType'];
                eleData.notity_projectRole = eleData['Notification.projectRole'];
                eleData.notity_subProjectName = eleData['Notification.subProjectName'];
                eleData.notity_subProjectType = eleData['Notification.subProjectType'];
                eleData.notity_milestoneDescription = eleData['Notification.milestoneDescription'];
                eleData.notity_taskName = eleData['Notification.taskName'];
                eleData.notify_roleId = eleData['Notification.roleId'];
                eleData.notify_taskImgIds = eleData['Notification.taskImgIds'];
                eleData.notify_star = eleData['Notification.star'];
                eleData.notify_subProjectIds = eleData['Notification.subProjectIds'];
                eleData.notify_milestoneIds = eleData['Notification.milestoneIds'];
                eleData.notify_taskIds = eleData['Notification.taskIds'];


                eleData.statusForAngular = false;

                delete eleData['Notification.id'];
                delete eleData['Notification.senderId'];
                delete eleData['Notification.recipientId'];
                delete eleData['Notification.messageType'];
                delete eleData['Notification.messageSubject'];
                delete eleData['Notification.description'];
                delete eleData['Notification.status'];
                delete eleData['Notification.isWeb'];
                delete eleData['Notification.isMob'];
                delete eleData['Notification.clientId'];
                delete eleData['Notification.projectId'];
                delete eleData['Notification.subProjectId'];
                delete eleData['Notification.milestoneId'];
                delete eleData['Notification.taskId'];
                delete eleData['Notification.createdAt'];
                delete eleData['Notification.updatedAt'];
                delete eleData['Notification.projectName'];
                delete eleData['Notification.projectType'];
                delete eleData['Notification.projectRole'];
                delete eleData['Notification.subProjectName'];
                delete eleData['Notification.subProjectType'];
                delete eleData['Notification.milestoneDescription'];
                delete eleData['Notification.taskName'];
                delete eleData['Notification.roleId'];
                delete eleData['Notification.taskImgIds'];
                delete eleData['Notification.star'];
                delete eleData['Notification.subProjectIds'];
                delete eleData['Notification.milestoneIds'];
                delete eleData['Notification.taskIds'];

                return eleData;
              });

              return RegisterClient.findOne({ where: { PM_Client_ID: req.authData.PM_Client_ID },
                attributes: ['PM_Client_CompanyName'],
                raw: true }).then((companyName) => {
                for (let i = 0; i < data.length; i += 1) {
                  data[i].companyName = companyName.PM_Client_CompanyName;
                }

                if (data && data.length !== 0) {
                  getImageUrl(res, data, 0, 'User_PP');
                } else {
                  return res.json(data);
                }
                // return res.json(data);
              }).catch(() => res.json([]));
            })
            .catch(() => {
              res.json([]);
            });
        })
        .catch(() => {
          res.json([]);
        });
    })
    .catch(() => {
      res.json([]);
    });
}

export function update(req, res) {
  // const updatedDate = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');
  const updateValue = {};
  if (req.body.status) {
    updateValue.status = req.body.status;
  }
  if (req.body.star === false || req.body.star === true) {
    updateValue.star = req.body.star;
  }
  console.log('updateValue --- ', updateValue);
  NotificationsScreen.update(updateValue, {
    where: {
      id: req.body.id,
    },
  }).then(() => {
    const body = {
      statusCode: 200,
      message: {
        sucess: true,
        data: 'Notification Updated',
      },
    };
    res.json(body);
  })
    .catch(() => {
      const body = {
        statusCode: 500,
        message: {
          sucess: false,
          data: 'Notification Not Updated',
        },
      };
      res.json(body);
    });
}

// Start Save Notifications For Channels

function bindEmailData(body, path) {
  return new Promise((resolve) => {
    fs.readFile(path, 'utf8', (error, data) => {
      if (error) {
        resolve(error);
      } else {
        let mainBody = body;
        const template = handlebars.compile(data);
        mainBody = mainBody.map((ele) => {
          const tempEle = ele;
          if (tempEle.messageChannel === 'email') {
            const dataArray = tempEle.messageString.split('|');
            const dataObject = {};
            let countLatest = 0;
            for (let i = 0; i < dataArray.length; i += 1) {
              const param = `param${i}`;
              dataObject[param] = dataArray[i];
              countLatest = i;
            }
            if (tempEle.subprojectArray) {
              tempEle.subprojectArray = JSON.stringify(tempEle.subprojectArray);
              tempEle.subprojectArray = JSON.parse(tempEle.subprojectArray);
              countLatest += 1;
              const param = `param${countLatest}`;
              dataObject[param] = tempEle.subprojectArray;
            }
            if (tempEle.milestoneArray) {
              tempEle.milestoneArray = JSON.stringify(tempEle.milestoneArray);
              tempEle.milestoneArray = JSON.parse(tempEle.milestoneArray);
              countLatest += 1;
              const param = `param${countLatest}`;
              dataObject[param] = tempEle.milestoneArray;
            }
            if (tempEle.taskArray) {
              tempEle.taskArray = JSON.stringify(tempEle.taskArray);
              tempEle.taskArray = JSON.parse(tempEle.taskArray);
              countLatest += 1;
              const param = `param${countLatest}`;
              dataObject[param] = tempEle.taskArray;
            }
            console.log('--- dataObject --- ', dataObject);
            tempEle.templateBody = template(dataObject);
          }
          return tempEle;
        });
        resolve(mainBody);
      }
    });
  });
}

function findEmailTemplateName(msgType) {
  return NotificationsTemplates.findOne({
    attributes: ['templateName', 'messageChannel', 'messageType'],
    where: {
      messageType: msgType,
      messageChannel: 'email',
    } })
    .then(results =>
      results,
    )
    .catch(err =>
      err,
    );
}

function bindMobData(body, path) {
  return new Promise((resolve) => {
    fs.readFile(path, 'utf8', (error, data) => {
      if (error) {
        resolve(error);
      } else {
        let mainBody = body;
        const template = handlebars.compile(data);
        mainBody = mainBody.map((ele) => {
          const tempEle = ele;
          if (tempEle.messageChannel === 'sms') {
            const dataArray = tempEle.messageString.split('|');
            const dataObject = {};
            for (let i = 0; i < dataArray.length; i += 1) {
              const param = `param${i}`;
              dataObject[param] = dataArray[i];
            }
            tempEle.templateBody = template(dataObject);
          }
          return tempEle;
        });
        resolve(mainBody);
      }
    });
  });
}

function findMobTemplateName(msgType) {
  return NotificationsTemplates.findOne({
    attributes: ['templateName', 'messageChannel', 'messageType'],
    where: {
      messageType: msgType,
      messageChannel: 'sms',
    } })
    .then(results =>
      results,
    )
    .catch(err =>
      err,
    );
}

async function findTemplatesAndBindData(getMainBody, emailPresent, mobPresent) {
  let mainBody = getMainBody;
  let emailTemplateObject;
  let mobTemplateObject;
  let newMainBody;
  if (emailPresent) {
    emailTemplateObject = await findEmailTemplateName(mainBody[0].messageType);
    const path = `${__dirname}/templates/email/${emailTemplateObject.templateName}`;
    newMainBody = await bindEmailData(mainBody, path);
    mainBody = newMainBody;
  }
  if (mobPresent) {
    mobTemplateObject = await findMobTemplateName(mainBody[0].messageType);
    const path = `${__dirname}/templates/sms/${mobTemplateObject.templateName}`;
    mainBody = await bindMobData(mainBody, path);
  }
  return mainBody;
}

export function saveEmailSms(req, res) {
  // return res.json({ msg: 'Success' });
  const body = req.body;
  /* body.clientId = req.authData.PM_Client_ID;
  body.senderId = req.authData.PM_UserID; */
  let bodyEmail = {};
  let bodyMobile = {};
  let emailPresent = false;
  let mobPresent = false;
  const mainBody = [];
  if (!body.messageType) {
    body.messageType = 'default';
  }
  for (let i = 0; i < body.recipientsAndData.length; i += 1) {
    if (body.priority === 'low' || body.priority === 'high') {
      bodyEmail.priority = body.priority;
      bodyMobile.priority = body.priority;
    } else {
      bodyEmail.priority = 'low';
      bodyMobile.priority = 'low';
    }
    if (body.recipientsAndData[i].email) {
      emailPresent = true;
      bodyEmail.clientId = body.clientId;
      bodyEmail.recipients = body.recipientsAndData[i].email;
      bodyEmail.senderId = body.senderId;
      bodyEmail.senderEmail = body.senderEmail;
      bodyEmail.senderMobile = body.senderMobile;
      bodyEmail.subject = body.subject;
      bodyEmail.messageType = body.messageType;
      bodyEmail.messageString = body.recipientsAndData[i].data;
      bodyEmail.messageChannel = 'email';
      bodyEmail.messageStatus = 'pending';
      mainBody.push(bodyEmail);
      bodyEmail = {};
    }
    if (body.recipientsAndData[i].mob) {
      mobPresent = true;
      bodyMobile.clientId = body.clientId;
      bodyMobile.recipients = `91${body.recipientsAndData[i].mob}`;
      bodyMobile.senderId = body.senderId;
      bodyMobile.senderEmail = body.senderEmail;
      bodyMobile.senderMobile = body.senderMobile;
      bodyMobile.subject = body.subject;
      bodyMobile.messageType = body.messageType;
      bodyMobile.messageString = body.recipientsAndData[i].data;
      bodyMobile.messageChannel = 'sms';
      bodyMobile.messageStatus = 'pending';
      mainBody.push(bodyMobile);
      bodyMobile = {};
    }
  }
  return findTemplatesAndBindData(mainBody, emailPresent, mobPresent)
    .then(results => NotificationsEmailSms.bulkCreate(results)
      .then(() => res.json({ status: 200, msg: 'Email sent' }))
      .catch(() => res.json({ status: 200, msg: 'Email not sent' })))
    .catch(() => res.json({ status: 200, msg: 'Email not sent' }));
}

function saveEmailSmsBacked2(reqBody) {
  const body = reqBody;
  let bodyEmail = {};
  let bodyMobile = {};
  let emailPresent = false;
  let mobPresent = false;
  const mainBody = [];
  if (!body.messageType) {
    body.messageType = 'default';
  }
  for (let i = 0; i < body.recipientsAndData.length; i += 1) {
    if (body.priority === 'low' || body.priority === 'high') {
      bodyEmail.priority = body.priority;
      bodyMobile.priority = body.priority;
    } else {
      bodyEmail.priority = 'low';
      bodyMobile.priority = 'low';
    }
    if (body.recipientsAndData[i].email) {
      emailPresent = true;
      bodyEmail.clientId = body.clientId;
      bodyEmail.recipients = body.recipientsAndData[i].email;
      bodyEmail.senderId = body.senderId;
      bodyEmail.senderEmail = body.senderEmail;
      bodyEmail.senderMobile = body.senderMobile;
      bodyEmail.subject = body.subject;
      bodyEmail.messageType = body.messageType;
      bodyEmail.messageString = body.recipientsAndData[i].data;
      bodyEmail.messageChannel = 'email';
      bodyEmail.messageStatus = 'pending';
      if (body.subprojectArray) {
        bodyEmail.subprojectArray = body.subprojectArray;
      }
      if (body.milestoneArray) {
        bodyEmail.milestoneArray = body.milestoneArray;
      }
      if (body.taskArray) {
        bodyEmail.taskArray = body.taskArray;
      }

      mainBody.push(bodyEmail);
      bodyEmail = {};
    }
    if (body.recipientsAndData[i].mob) {
      mobPresent = true;
      bodyMobile.clientId = body.clientId;
      bodyMobile.recipients = `91${body.recipientsAndData[i].mob}`;
      bodyMobile.senderId = body.senderId;
      bodyMobile.senderEmail = body.senderEmail;
      bodyMobile.senderMobile = body.senderMobile;
      bodyMobile.subject = body.subject;
      bodyMobile.messageType = body.messageType;
      bodyMobile.messageString = body.recipientsAndData[i].data;
      bodyMobile.messageChannel = 'sms';
      bodyMobile.messageStatus = 'pending';
      mainBody.push(bodyMobile);
      bodyMobile = {};
    }
  }
    console.log('senttttttttttt',mainBody,mainBody,mobPresent)
  findTemplatesAndBindData(mainBody, mainBody, mobPresent)
    .then((results) => {
        console.log('senttttttttttt',results)
      NotificationsEmailSms.bulkCreate(results)

        .then(() => {})
        .catch(() => {});
    })
    .catch(() => {
    });
}

function checkTypeEmail(type) {
  if (type === 'newUserAdded' || type === 'welcomepms') {
    return true;
  }
  return false;
}

export function saveEmailSmsBacked(reqBody) {
  if (checkTypeEmail(reqBody.messageType)) {
    saveEmailSmsBacked2(reqBody);
  } else {
    isProjectPublished(reqBody.clientId, reqBody.projectId)
      .then((data) => {
        if (data && data[0].isPublished) {
          saveEmailSmsBacked2(reqBody);
        }
      })
      .catch();
  }
}

// End Save Notifications For Channels

/* function findScreenTemplate(msgType) {
  return NotificationsTemplates.findOne({
    attributes: ['templateName', 'messageChannel', 'messageType'],
    where: {
      messageType: msgType,
      messageChannel: 'screen',
    } })
    .then(results =>
      results,
    )
    .catch(err =>
      err,
    );
}

function bindDataScreen(body, path) {
  return new Promise((resolve) => {
    fs.readFile(path, 'utf8', (error, data) => {

      if (error) {
        resolve(error);
      } else {
        let mainBody = body;

        const template = handlebars.compile(data);
        mainBody = mainBody.map((ele) => {
          const tempEle = ele;
          const dataArray = tempEle.messageString.split('|');
          const dataObject = {};
          for (let i = 0; i < dataArray.length; i += 1) {
            const param = `param${i}`;
            dataObject[param] = dataArray[i];
          }

          tempEle.templateBody = template(dataObject);
          return tempEle;
        });
        resolve(mainBody);
      }
    });
  });
} */

// Start Save templates

/* async function findScreenTemplateAndBindData(body) {
  let mainBody = body;
  // const path = `${__dirname}/templates/${emailTemplateObject.templateName}`;
  const templateObject = await findScreenTemplate(mainBody[0].messageType);

  const path = `${__dirname}/templates/screen/${templateObject.templateName}`;
  mainBody = await bindDataScreen(mainBody, path);
  return mainBody;
} */

async function getUsers(req) {
  const data = await getAllUserNoti(req);
  return data;
}

function checkType(type) {
  if (type === 'firstLoginWelcome' ||
        type === 'firstLoginTips' ||
        type === 'firstLoginStartFirstProject' ||
        type === 'default') {
    return true;
  }
  return false;
}

export function saveScreenBackend2(req) {
  const mainBody = [];
  let tempObj = {};
  for (let i = 0; i < req.body.recipientIdData.length; i += 1) {
    tempObj = {};
    tempObj.senderId = req.authData.PM_UserID;
    tempObj.clientId = req.authData.PM_Client_ID;
    tempObj.messageType = req.body.messageType;
    tempObj.messageSubject = req.body.messageSubject;
    tempObj.description = req.body.description;
    tempObj.isWeb = req.body.isWeb;
    tempObj.isMob = req.body.isMob;
    tempObj.recipientId = req.body.recipientIdData[i].PM_UserID;
    // tempObj.messageString = req.body.recipientIdData[i].messageString;
    tempObj.status = 'unread';

    if (req.body.projectId) {
      tempObj.projectId = req.body.projectId;
    }
    if (req.body.subProjectId) {
      tempObj.subProjectId = req.body.subProjectId;
    }
    if (req.body.milestoneId) {
      tempObj.milestoneId = req.body.milestoneId;
    }
    if (req.body.taskId) {
      tempObj.taskId = req.body.taskId;
    }
    if (req.body.projectName) {
      tempObj.projectName = req.body.projectName;
    }
    if (req.body.projectType) {
      tempObj.projectType = req.body.projectType;
    }
    if (req.body.projectRole) {
      tempObj.projectRole = req.body.projectRole;
    }
    if (req.body.subProjectName) {
      tempObj.subProjectName = req.body.subProjectName;
    }
    if (req.body.subProjectType) {
      tempObj.subProjectType = req.body.subProjectType;
    }
    if (req.body.milestoneDescription) {
      tempObj.milestoneDescription = req.body.milestoneDescription;
    }
    if (req.body.taskName) {
      tempObj.taskName = req.body.taskName;
    }
    if (req.body.roleId) {
      tempObj.roleId = req.body.roleId;
    }
    if (req.body.taskImgIds) {
      tempObj.taskImgIds = req.body.taskImgIds;
    }
    if (req.body.taskImgIds) {
      tempObj.taskImgIds = req.body.taskImgIds;
    }
    if (req.body.subProjectIds) {
      tempObj.subProjectIds = req.body.subProjectIds;
    }
    if (req.body.milestoneIds) {
      tempObj.milestoneIds = req.body.milestoneIds;
    }
    if (req.body.taskIds) {
      tempObj.taskIds = req.body.taskIds;
    }
    mainBody.push(tempObj);
  }
  /* findScreenTemplateAndBindData(mainBody)
        .then((results) => { */
  return NotificationsScreen.bulkCreate(mainBody)
    .then(s => s)
    .catch(e => e);
}

export function saveScreenBackend(req) {
  if (checkType(req.body.messageType)) {
    return saveScreenBackend2(req)
      .then(s => s)
      .catch(e => e);
  }
  return isProjectPublished(req.authData.PM_Client_ID, req.body.projectId)
    .then((data) => {
      if (data && data[0].isPublished) {
        return saveScreenBackend2(req)
          .then(s => s)
          .catch(e => e);
      }
    })
    .catch(e => e);
}

function saveScreen2(req, res) {
  if (req.body.recipientIdData.length === 0) {
    const mainBody = [];
    let tempObj = {};
    getUsers(req)
      .then((results) => {
        for (let i = 0; i < results.length; i += 1) {
          tempObj = {};
          tempObj.senderId = req.authData.PM_UserID;
          tempObj.clientId = req.authData.PM_Client_ID;
          tempObj.messageType = req.body.messageType;
          tempObj.messageSubject = req.body.messageSubject;
          tempObj.description = req.body.description;
          tempObj.isWeb = req.body.isWeb;
          tempObj.isMob = req.body.isMob;
          tempObj.recipientId = results[i].PM_UserID;
          tempObj.status = 'unread';

                    if(req.body.projectId) {
                        tempObj.projectId = req.body.projectId;
                    }
                    if(req.body.subProjectId) {
                        tempObj.subProjectId = req.body.subProjectId;
                    }
                    if(req.body.milestoneId) {
                        tempObj.milestoneId = req.body.milestoneId;
                    }
                    if(req.body.taskId) {
                        tempObj.taskId = req.body.taskId;
                    }
                    if(req.body.projectName) {
                        tempObj.projectName = req.body.projectName;
                    }
                    if(req.body.projectType) {
                        tempObj.projectType = req.body.projectType;
                    }
                    if(req.body.projectRole) {
                        tempObj.projectRole = req.body.projectRole;
                    }
                    if(req.body.subProjectName) {
                        tempObj.subProjectName = req.body.subProjectName;
                    }
                    if(req.body.subProjectType) {
                        tempObj.subProjectType = req.body.subProjectType;
                    }
                    if(req.body.milestoneDescription) {
                        tempObj.milestoneDescription = req.body.milestoneDescription;
                    }
                    if(req.body.taskName) {
                        tempObj.taskName = req.body.taskName;
                    }
                    if(req.body.roleId) {
                        tempObj.roleId = req.body.roleId;
                    }
                    if(req.body.taskImgIds) {
                        tempObj.taskImgIds = req.body.taskImgIds;
                    }
                    if(req.body.subProjectIds) {
                        tempObj.subProjectIds = req.body.subProjectIds;
                    }
                    if(req.body.milestoneIds) {
                        tempObj.milestoneIds = req.body.milestoneIds;
                    }
                    if(req.body.taskIds) {
                        tempObj.taskIds = req.body.taskIds;
                    }
                    mainBody.push(tempObj);
                }
                // return findScreenTemplateAndBindData(mainBody);
                return NotificationsScreen.bulkCreate(mainBody);
            })
            .then(() => {
                const body = {
                    statusCode: 200,
                    message: {
                        sucess: true,
                        data: 'Notification Sent',
                    },
                };
                res.json(body);
            })
            .catch(() => {
                const body = {
                    statusCode: 500,
                    message: {
                        sucess: false,
                        data: 'Something went wrong !!!',
                    },
                };
                res.json(body);
            });
    } else {
        const mainBody = [];
        let tempObj = {};
        for(let i = 0; i < req.body.recipientIdData.length; i += 1) {
            tempObj = {};
            tempObj.senderId = req.authData.PM_UserID;
            tempObj.clientId = req.authData.PM_Client_ID;
            tempObj.messageType = req.body.messageType;
            tempObj.messageSubject = req.body.messageSubject;
            tempObj.description = req.body.description;
            tempObj.isWeb = req.body.isWeb;
            tempObj.isMob = req.body.isMob;
            tempObj.recipientId = req.body.recipientIdData[i].PM_UserID;
            // tempObj.messageString = req.body.recipientIdData[i].messageString;
            tempObj.status = 'unread';

            if(req.body.projectId) {
                tempObj.projectId = req.body.projectId;
            }
            if(req.body.subProjectId) {
                tempObj.subProjectId = req.body.subProjectId;
            }
            if(req.body.milestoneId) {
                tempObj.milestoneId = req.body.milestoneId;
            }
            if(req.body.taskId) {
                tempObj.taskId = req.body.taskId;
            }
            if(req.body.projectName) {
                tempObj.projectName = req.body.projectName;
            }
            if(req.body.projectType) {
                tempObj.projectType = req.body.projectType;
            }
            if(req.body.projectRole) {
                tempObj.projectRole = req.body.projectRole;
            }
            if(req.body.subProjectName) {
                tempObj.subProjectName = req.body.subProjectName;
            }
            if(req.body.subProjectType) {
                tempObj.subProjectType = req.body.subProjectType;
            }
            if(req.body.milestoneDescription) {
                tempObj.milestoneDescription = req.body.milestoneDescription;
            }
            if(req.body.taskName) {
                tempObj.taskName = req.body.taskName;
            }
            if(req.body.roleId) {
                tempObj.roleId = req.body.roleId;
            }
            if(req.body.taskImgIds) {
                tempObj.taskImgIds = req.body.taskImgIds;
            }
            if(req.body.subProjectIds) {
                tempObj.subProjectIds = req.body.subProjectIds;
            }
            if(req.body.milestoneIds) {
                tempObj.milestoneIds = req.body.milestoneIds;
            }
            if(req.body.taskIds) {
                tempObj.taskIds = req.body.taskIds;
            }

            mainBody.push(tempObj);
        }
        /* findScreenTemplateAndBindData(mainBody)
            .then((results) => { */
        NotificationsScreen.bulkCreate(mainBody)
            .then(() => {
                const body = {
                    statusCode: 200,
                    message: {
                        sucess: true,
                        data: 'Notification Sent',
                    },
                };
                res.json(body);
            })
            .catch(() => {
                const body = {
                    statusCode: 500,
                    message: {
                        sucess: false,
                        data: 'Something went wrong !!!',
                    },
                };
                res.json(body);
            });
    }
}

export function saveScreen(req, res) {
    if(checkType(req.body.messageType)) {
        saveScreen2(req, res);
    } else {
        console.log('req.body.PM_Client_ID -- ', req.body.PM_Client_ID, ' -- req.body.projectId ', req.body.projectId);
        isProjectPublished(req.authData.PM_Client_ID, req.body.projectId)
            .then((data) => {
                if(data && data[0].isPublished) {
                    saveScreen2(req, res);
                } else {
                    const body = {
                        statusCode: 500,
                        message: {
                            sucess: false,
                            data: 'Something went wrong !!!',
                        },
                    };
                    res.json(body);
                }
            })
            .catch(() => {
                const body = {
                    statusCode: 500,
                    message: {
                        sucess: false,
                        data: 'Something went wrong !!!',
                    },
                };
                res.json(body);
            });
    }
}

// End Save templates

export function saveTemplates(req, res) {
    // req.body.createdAtTimestamp = createdDate;
    // req.body.updatedTimestamp = updateStatusTimestamp;
    if(req.body.messageChannel.toLowerCase() === 'email' || req.body.messageChannel.toLowerCase() === 'sms' ||
        req.body.messageChannel.toLowerCase() === 'screen') {
        NotificationsTemplates.create(req.body)
            .then(results => res.json(results))
            .catch(err => res.send(err));
    } else {
        res.send({message: 'messageChannel must be one of the following options - email, sms '});
    }
}

// Send Mail
function preProcessAndSendMail(notifications) {
    notifications.map((ele) => {
        const tempEle = ele;
        const mailOptions = {};
        mailOptions.from = process.env.EMAIL; // tempEle.senderEmail;
        mailOptions.to = tempEle.recipients;
        mailOptions.subject = tempEle.subject;
        mailOptions.html = tempEle.templateBody;

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        transporter.sendMail(mailOptions, (error) => {
            // const updatedDate = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');
            if(error) {
                console.log('error --- ', error);
                NotificationsEmailSms.update({
                    messageStatus: 'pending',
                }, {
                    where: {
                        id: tempEle.id,
                    },
                })
                    .then(() => {
                    })
                    .catch(() => {
                    });
            } else {
                console.log('sent -- to ', tempEle.recipients);
                NotificationsEmailSms.update({
                    messageStatus: 'sent',
                }, {
                    where: {
                        id: tempEle.id,
                    },
                })
                    .then((s) => {
                        console.log('updated mail to sent --- ', s);
                    })
                    .catch((e) => {
                        console.log('not update  mail to sent --- ', e);
                    });
            }
        });
        return tempEle;
    });
}

function sendEmailStart() {
  NotificationsEmailSms.findAll({
    where: {
      messageStatus: 'pending',
      messageChannel: 'email',
      [Sequelize.Op.or]: [
        {
          [Sequelize.Op.and]: [
            {
              messageType: { [Sequelize.Op.in]: ['welcomepms'] },
            },
            { senderEmail: { [Sequelize.Op.eq]: { [Sequelize.Op.col]: 'recipients' } } },
          ],
        },
        { senderEmail: { [Sequelize.Op.ne]: { [Sequelize.Op.col]: 'recipients' } } },
      ],

        },
        order: [['createdAt', 'ASC']],
        limit: 10,
        raw: true,
    })
        .then((results) => {

            const notifications = results;
            if(notifications.length > 0) {
                const notifyIds = [];
                console.log('notifications --- ', notifications.length);
                for(let i = 0; i < notifications.length; i += 1) {
                    notifyIds.push(notifications[i].id);
                    if(i === notifications.length - 1) {
                        NotificationsEmailSms.update({
                            messageStatus: 'processing',
                        }, {
                            where: {
                                id: {[Sequelize.Op.in]: notifyIds},
                            },
                        })
                            .then((updated) => {
                                console.log('updated --- ', updated);
                                preProcessAndSendMail(notifications);
                            })
                            .catch(() => {
                            });
                    }
                }
            }
        })
        .catch(() => {
        });
}

export function sendMsg(notifications) {
    for(let i = 0; i < notifications.length; i += 1) {
        axios({
            method: 'post',
            url: `https://api.textlocal.in/send?apikey=${process.env.SMS_API_KEY}&sender=${process.env.SMS_SENDER_ID}&numbers=${notifications[i].recipients}&message=${notifications[i].templateBody}`,
        })
            .then((r) => {
                console.log('r ', r);
                // res.json(r);
            })
            .catch((e) => {
                console.log('e ', e);
                // res.json(e);
            });
    }
}

function sendMsgStart() {
    NotificationsEmailSms.findAll({
        where: {
            messageStatus: 'pending',
            messageChannel: 'sms',
            [Sequelize.Op.or]: [
                {
                    [Sequelize.Op.and]: [
                        {
                            messageType: {[Sequelize.Op.in]: ['welcomepms']},
                        },
                        {senderMobile: {[Sequelize.Op.eq]: {[Sequelize.Op.col]: 'recipients'}}},
                    ],
                },
                {senderMobile: {[Sequelize.Op.ne]: {[Sequelize.Op.col]: 'recipients'}}},
            ],

        },
        order: [['createdAt', 'ASC']],
        limit: 10,
        raw: true,
    })
        .then((results) => {
            const notifications = results;
            if(notifications.length > 0) {
                const notifyIds = [];
                console.log('notifications --- sms ', notifications.length);
                for(let i = 0; i < notifications.length; i += 1) {
                    notifyIds.push(notifications[i].id);
                    if(i === notifications.length - 1) {
                        NotificationsEmailSms.update({
                            messageStatus: 'processing',
                        }, {
                            where: {
                                id: {[Sequelize.Op.in]: notifyIds},
                            },
                        })
                            .then((updated) => {
                                console.log('updated ---sms--- ', updated);
                                sendMsg(notifications);
                            })
                            .catch(() => {
                            });
                    }
                }
            }
        })
        .catch(() => {
        });
}

if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    if (process.env.pm_id === process.env.CLUSTER_ID) {
      console.log('process.env.pm_id , CONFIG.cluster_id match --- ');
      sendEmailStart();
    } else {
      console.log('process.env.pm_id , CONFIG.cluster_id not match --- ');
    }
  }, 20000);
  setInterval(() => {
    if (process.env.pm_id === process.env.CLUSTER_ID) {
      console.log('process.env.pm_id , CONFIG.cluster_id match sms --- ');
      sendMsgStart();
    } else {
      console.log('process.env.pm_id , CONFIG.cluster_id not match sms --- ');
    }
  }, 20000);
}

export function findM(req, res) {
    const id = req.authData.PM_UserID;
    const date = subDays(new Date(), 2);
    const permissionArray = [];

    if(req.params.projectId) {
        for(let i = 0; i < req.authData.Permission.length; i += 1) {
            if(req.authData.Permission[i].Status === true) {
                permissionArray.push(req.authData.Permission[i].ID);
            }
        }

        getNotificationTypes(permissionArray)
            .then((notification) => {
                const notificationTypes2 = [];
                const notificationTypes1 = [];
                const notificationTypes = [];
                for(let i = 0; i < notification.length; i += 1) {
                    if(notification[i] !== 'resource') {
                        notificationTypes1.push(notification[i]);
                    }
                }
                for(let i = 0; i < notificationTypes1.length; i += 1) {
                    if(notificationTypes1[i] !== 'resourceRemove') {
                        notificationTypes2.push(notificationTypes1[i]);
                    }
                }
                for(let i = 0; i < notificationTypes2.length; i += 1) {
                    if(notificationTypes2[i] !== 'resourcePublished') {
                        notificationTypes.push(notificationTypes2[i]);
                    }
                }

                let whereCond = {};
                const projectIds = [];
                projectIds.push(parseInt(req.params.projectId, 10));
                // return res.send(parseInt(req.params.projectId, 10));
                if(!permissionArray.includes(14)) {
                    if(projectIds.length !== 0) {
                        // if user is in present in project
                        whereCond = {
                            [Sequelize.Op.and]: [
                                {recipientId: id},
                                {clientId: req.authData.PM_Client_ID},
                                {createdAt: {[Sequelize.Op.gte]: date}},
                                {
                                    [Sequelize.Op.or]: [
                                        {
                                            [Sequelize.Op.and]: [
                                                {messageType: {[Sequelize.Op.in]: notificationTypes}},
                                                {projectId: {[Sequelize.Op.in]: projectIds}},
                                            ],
                                        },
                                        {
                                            [Sequelize.Op.and]: [
                                                {projectId: {[Sequelize.Op.in]: projectIds}},
                                                {messageType: {[Sequelize.Op.in]: ['resource', 'resourcePublished', 'resourceRemove']}},
                                                {roleId: req.authData.selectRoleID},
                                            ],
                                        },
                                        {
                                            messageType: {[Sequelize.Op.in]: ['default', 'firstLoginWelcome']},
                                        },
                                    ],
                                },
                                {
                                    [Sequelize.Op.or]: [
                                        {
                                            [Sequelize.Op.and]: [
                                                {
                                                    messageType: {[Sequelize.Op.in]: ['firstLoginWelcome']},
                                                },
                                                {senderId: {[Sequelize.Op.eq]: req.authData.PM_UserID}},
                                            ],
                                        },
                                        {senderId: {[Sequelize.Op.ne]: req.authData.PM_UserID}},
                                    ],
                                },
                            ],
                        };
                    } /* else {
          // console.log('else project ---- ');
          // if user is not present in any project
            whereCond = {
              [Sequelize.Op.and]: [
                { recipientId: id },
                { clientId: req.authData.PM_Client_ID },
                { createdAt: { [Sequelize.Op.gte]: date } },
                { [Sequelize.Op.or]: [
                  {
                    [Sequelize.Op.and]: [
                      { messageType: { [Sequelize.Op.in]: ['resource', 'resourcePublished'] } },
                      { roleId: req.authData.selectRoleID },
                    ],
                  },
                  {
                    [Sequelize.Op.and]: [
                      { messageType: { [Sequelize.Op.eq]: 'resourceRemove' } },
                      { roleId: req.authData.selectRoleID },
                    ],
                  },
                  {
                    messageType: { [Sequelize.Op.in]: ['default', 'firstLoginWelcome'] },
                  },
                ] },
                { [Sequelize.Op.or]: [
                  {
                    [Sequelize.Op.and]: [
                      {
                        messageType: { [Sequelize.Op.in]: ['firstLoginWelcome'] },
                      },
                      { senderId: { [Sequelize.Op.eq]: req.authData.PM_UserID } },
                    ],
                  },
                  { senderId: { [Sequelize.Op.ne]: req.authData.PM_UserID } },
                ] }],
            };
          } */
                } else {
                    whereCond = {
                        recipientId: id,
                        projectId: {[Sequelize.Op.in]: projectIds},
                        clientId: req.authData.PM_Client_ID,
                        createdAt: {[Sequelize.Op.gte]: date},
                        messageType: {[Sequelize.Op.in]: notificationTypes},
                    };
                }
                console.log('wheree  ', whereCond);
                RegisterUser.findAll({
                    where: {
                        PM_Client_ID: req.authData.PM_Client_ID,
                    },
                    include: [
                        {
                            model: NotificationsScreen,
                            as: 'Notification',
                            where: whereCond,
                        },
                    ],
                    attributes: ['PM_UserID', 'PM_User_FullName', 'PM_User_ProfilePic'],
                    subQuery: false,
                    order: [[{model: NotificationsScreen, as: 'Notification'}, 'id', 'DESC']],
                    raw: true,
                })
                    .then((results) => {
                        let data = results;
                        data = data.map((ele) => {
                            const eleData = ele;
                            eleData.ID = eleData['Notification.id'];
                            eleData.senderId = eleData['Notification.senderId'];
                            // eleData.notity_recipientId = eleData['Notification.recipientId'];
                            eleData.messageType = eleData['Notification.messageType'];
                            eleData.messageSubject = eleData['Notification.messageSubject'];
                            eleData.description = eleData['Notification.description'];
                            eleData.status = eleData['Notification.status'];
                            // eleData.notity_isWeb = eleData['Notification.isWeb'];
                            // eleData.notity_isMob = eleData['Notification.isMob'];
                            // eleData.notity_clientId = eleData['Notification.clientId'];
                            eleData.notity_projectId = eleData['Notification.projectId'];
                            eleData.notity_subProjectId = eleData['Notification.subProjectId'];
                            eleData.notity_milestoneId = eleData['Notification.milestoneId'];
                            eleData.notity_taskId = eleData['Notification.taskId'];
                            eleData.notity_createdAt = eleData['Notification.createdAt'].toString()
                                .substr(0, 15);
                            // eleData.notity_updatedAt = eleData['Notification.updatedAt'];
                            eleData.notity_projectName = eleData['Notification.projectName'];
                            eleData.notity_projectType = eleData['Notification.projectType'];
                            eleData.notity_projectRole = eleData['Notification.projectRole'];
                            eleData.notity_subProjectName = eleData['Notification.subProjectName'];
                            eleData.notity_subProjectType = eleData['Notification.subProjectType'];
                            eleData.notity_milestoneDescription = eleData['Notification.milestoneDescription'];
                            eleData.notity_taskName = eleData['Notification.taskName'];
                            // eleData.notify_roleId = eleData['Notification.roleId'];
                            eleData.notify_taskImgIds = eleData['Notification.taskImgIds'];
                            eleData.notify_star = eleData['Notification.star'];
                            eleData.notify_subProjectIds = eleData['Notification.subProjectIds'];
                            eleData.notify_milestoneIds = eleData['Notification.milestoneIds'];
                            eleData.notify_taskIds = eleData['Notification.taskIds'];


                            eleData.statusForAngular = false;

                            delete eleData['Notification.id'];
                            delete eleData['Notification.senderId'];
                            delete eleData['Notification.recipientId'];
                            delete eleData['Notification.messageType'];
                            delete eleData['Notification.messageSubject'];
                            delete eleData['Notification.description'];
                            delete eleData['Notification.status'];
                            delete eleData['Notification.isWeb'];
                            delete eleData['Notification.isMob'];
                            delete eleData['Notification.clientId'];
                            delete eleData['Notification.projectId'];
                            delete eleData['Notification.subProjectId'];
                            delete eleData['Notification.milestoneId'];
                            delete eleData['Notification.taskId'];
                            delete eleData['Notification.createdAt'];
                            delete eleData['Notification.updatedAt'];
                            delete eleData['Notification.projectName'];
                            delete eleData['Notification.projectType'];
                            delete eleData['Notification.projectRole'];
                            delete eleData['Notification.subProjectName'];
                            delete eleData['Notification.subProjectType'];
                            delete eleData['Notification.milestoneDescription'];
                            delete eleData['Notification.taskName'];
                            delete eleData['Notification.roleId'];
                            delete eleData['Notification.taskImgIds'];
                            delete eleData['Notification.star'];
                            delete eleData['Notification.subProjectIds'];
                            delete eleData['Notification.milestoneIds'];
                            delete eleData['Notification.taskIds'];

                            return eleData;
                        });

                        return RegisterClient.findOne({
                            where: {PM_Client_ID: req.authData.PM_Client_ID},
                            attributes: ['PM_Client_CompanyName'],
                            raw: true
                        })
                            .then((companyName) => {
                                for(let i = 0; i < data.length; i += 1) {
                                    data[i].companyName = companyName.PM_Client_CompanyName;
                                }

                                if(data && data.length !== 0) {
                                    getImageUrl(res, data, 0, 'User_PP');
                                } else {
                                    return res.json(data);
                                }
                                // return res.json(data);
                            })
                            .catch(() => res.json([]));
                    })
                    .catch(() => {
                        res.json([]);
                    });
            })
            .catch(() => {
                res.json([]);
            });
    } else {
        res.json([]);
    }
}


function findNotifications(req, query) {
    return new Promise((resolve) => {
        RegisterUser.findAll(query)
            .then((results) => {
                let data = results;
                data = data.map((ele) => {
                    const eleData = ele;
                    eleData.notify_Id = eleData['Notification.id'];
                    eleData.notity_senderId = eleData['Notification.senderId'];
                    eleData.notity_recipientId = eleData['Notification.recipientId'];
                    eleData.notity_messageType = eleData['Notification.messageType'];
                    eleData.notity_messageSubject = eleData['Notification.messageSubject'];
                    eleData.notity_description = eleData['Notification.description'];
                    eleData.notity_status = eleData['Notification.status'];
                    eleData.notity_isWeb = eleData['Notification.isWeb'];
                    eleData.notity_isMob = eleData['Notification.isMob'];
                    eleData.notity_clientId = eleData['Notification.clientId'];
                    eleData.notity_projectId = eleData['Notification.projectId'];
                    eleData.notity_subProjectId = eleData['Notification.subProjectId'];
                    eleData.notity_milestoneId = eleData['Notification.milestoneId'];
                    eleData.notity_taskId = eleData['Notification.taskId'];
                    eleData.notity_createdAt = eleData['Notification.createdAt'].toString()
                        .substr(0, 15);
                    eleData.notity_updatedAt = eleData['Notification.updatedAt'];
                    eleData.notity_projectName = eleData['Notification.projectName'];
                    eleData.notity_projectType = eleData['Notification.projectType'];
                    eleData.notity_projectRole = eleData['Notification.projectRole'];
                    eleData.notity_subProjectName = eleData['Notification.subProjectName'];
                    eleData.notity_subProjectType = eleData['Notification.subProjectType'];
                    eleData.notity_milestoneDescription = eleData['Notification.milestoneDescription'];
                    eleData.notity_taskName = eleData['Notification.taskName'];
                    eleData.notify_roleId = eleData['Notification.roleId'];
                    eleData.notify_taskImgIds = eleData['Notification.taskImgIds'];
                    eleData.notify_star = eleData['Notification.star'];
                    eleData.notify_subProjectIds = eleData['Notification.subProjectIds'];
                    eleData.notify_milestoneIds = eleData['Notification.milestoneIds'];
                    eleData.notify_taskIds = eleData['Notification.taskIds'];

                    eleData.statusForAngular = false;

                    delete eleData['Notification.id'];
                    delete eleData['Notification.senderId'];
                    delete eleData['Notification.recipientId'];
                    delete eleData['Notification.messageType'];
                    delete eleData['Notification.messageSubject'];
                    delete eleData['Notification.description'];
                    delete eleData['Notification.status'];
                    delete eleData['Notification.isWeb'];
                    delete eleData['Notification.isMob'];
                    delete eleData['Notification.clientId'];
                    delete eleData['Notification.projectId'];
                    delete eleData['Notification.subProjectId'];
                    delete eleData['Notification.milestoneId'];
                    delete eleData['Notification.taskId'];
                    delete eleData['Notification.createdAt'];
                    delete eleData['Notification.updatedAt'];
                    delete eleData['Notification.projectName'];
                    delete eleData['Notification.projectType'];
                    delete eleData['Notification.projectRole'];
                    delete eleData['Notification.subProjectName'];
                    delete eleData['Notification.subProjectType'];
                    delete eleData['Notification.milestoneDescription'];
                    delete eleData['Notification.taskName'];
                    delete eleData['Notification.roleId'];
                    delete eleData['Notification.taskImgIds'];
                    delete eleData['Notification.star'];
                    delete eleData['Notification.subProjectIds'];
                    delete eleData['Notification.milestoneIds'];
                    delete eleData['Notification.taskIds'];

                    return eleData;
                });

                return RegisterClient.findOne({
                    where: {PM_Client_ID: req.authData.PM_Client_ID},
                    attributes: ['PM_Client_CompanyName'],
                    raw: true,
                })
                    .then((companyName) => {
                        for(let i = 0; i < data.length; i += 1) {
                            data[i].companyName = companyName.PM_Client_CompanyName;
                        }
                        resolve(data);
                    })
                    .catch(err => resolve(err));
            })
            .catch(err => resolve(err));
    });
}

function findNotificationsMob(req, query) {
    return new Promise((resolve) => {
        RegisterUser.findAll(query)
            .then((results) => {
                let data = results;
                data = data.map((ele) => {
                    const eleData = ele;
                    eleData.ID = eleData['Notification.id'];
                    eleData.senderId = eleData['Notification.senderId'];
                    // eleData.notity_recipientId = eleData['Notification.recipientId'];
                    eleData.messageType = eleData['Notification.messageType'];
                    eleData.messageSubject = eleData['Notification.messageSubject'];
                    eleData.description = eleData['Notification.description'];
                    eleData.status = eleData['Notification.status'];
                    // eleData.notity_isWeb = eleData['Notification.isWeb'];
                    // eleData.notity_isMob = eleData['Notification.isMob'];
                    // eleData.notity_clientId = eleData['Notification.clientId'];
                    eleData.notity_projectId = eleData['Notification.projectId'];
                    eleData.notity_subProjectId = eleData['Notification.subProjectId'];
                    eleData.notity_milestoneId = eleData['Notification.milestoneId'];
                    eleData.notity_taskId = eleData['Notification.taskId'];
                    eleData.notity_createdAt = eleData['Notification.createdAt'].toString()
                        .substr(0, 15);
                    // eleData.notity_updatedAt = eleData['Notification.updatedAt'];
                    eleData.notity_projectName = eleData['Notification.projectName'];
                    eleData.notity_projectType = eleData['Notification.projectType'];
                    eleData.notity_projectRole = eleData['Notification.projectRole'];
                    eleData.notity_subProjectName = eleData['Notification.subProjectName'];
                    eleData.notity_subProjectType = eleData['Notification.subProjectType'];
                    eleData.notity_milestoneDescription = eleData['Notification.milestoneDescription'];
                    eleData.notity_taskName = eleData['Notification.taskName'];
                    // eleData.notify_roleId = eleData['Notification.roleId'];
                    eleData.notify_taskImgIds = eleData['Notification.taskImgIds'];
                    eleData.notify_star = eleData['Notification.star'];
                    eleData.notify_subProjectIds = eleData['Notification.subProjectIds'];
                    eleData.notify_milestoneIds = eleData['Notification.milestoneIds'];
                    eleData.notify_taskIds = eleData['Notification.taskIds'];


                    eleData.statusForAngular = false;

                    delete eleData['Notification.id'];
                    delete eleData['Notification.senderId'];
                    delete eleData['Notification.recipientId'];
                    delete eleData['Notification.messageType'];
                    delete eleData['Notification.messageSubject'];
                    delete eleData['Notification.description'];
                    delete eleData['Notification.status'];
                    delete eleData['Notification.isWeb'];
                    delete eleData['Notification.isMob'];
                    delete eleData['Notification.clientId'];
                    delete eleData['Notification.projectId'];
                    delete eleData['Notification.subProjectId'];
                    delete eleData['Notification.milestoneId'];
                    delete eleData['Notification.taskId'];
                    delete eleData['Notification.createdAt'];
                    delete eleData['Notification.updatedAt'];
                    delete eleData['Notification.projectName'];
                    delete eleData['Notification.projectType'];
                    delete eleData['Notification.projectRole'];
                    delete eleData['Notification.subProjectName'];
                    delete eleData['Notification.subProjectType'];
                    delete eleData['Notification.milestoneDescription'];
                    delete eleData['Notification.taskName'];
                    delete eleData['Notification.roleId'];
                    delete eleData['Notification.taskImgIds'];
                    delete eleData['Notification.star'];
                    delete eleData['Notification.subProjectIds'];
                    delete eleData['Notification.milestoneIds'];
                    delete eleData['Notification.taskIds'];

                    return eleData;
                });

                return RegisterClient.findOne({
                    where: {PM_Client_ID: req.authData.PM_Client_ID},
                    attributes: ['PM_Client_CompanyName'],
                    raw: true,
                })
                    .then((companyName) => {
                        for(let i = 0; i < data.length; i += 1) {
                            data[i].companyName = companyName.PM_Client_CompanyName;
                        }
                        resolve(data);
                    })
                    .catch(err => resolve(err));
            })
            .catch(err => resolve(err));
    });
}

// find motification
export function searchInNotification(req, res) {
    const id = parseInt(req.query.id, 10);

    const date = subDays(new Date(), 2);
    const permissionArray = [];

    for(let i = 0; i < req.authData.Permission.length; i += 1) {
        if(req.authData.Permission[i].Status === true) {
            permissionArray.push(req.authData.Permission[i].ID);
        }
    }
    if(req.query.projectId) {
        getNotificationTypes(permissionArray)
            .then((notification) => {
                const notificationTypes2 = [];
                const notificationTypes1 = [];
                const notificationTypes = [];
                for(let i = 0; i < notification.length; i += 1) {
                    if(notification[i] !== 'resource') {
                        notificationTypes1.push(notification[i]);
                    }
                }
                for(let i = 0; i < notificationTypes1.length; i += 1) {
                    if(notificationTypes1[i] !== 'resourceRemove') {
                        notificationTypes2.push(notificationTypes1[i]);
                    }
                }
                for(let i = 0; i < notificationTypes2.length; i += 1) {
                    if(notificationTypes2[i] !== 'resourcePublished') {
                        notificationTypes.push(notificationTypes2[i]);
                    }
                }

                let whereCond = {};
                let whereCond1 = {};
                const projectIds = [];
                projectIds.push(parseInt(req.query.projectId, 10));
                if(!permissionArray.includes(14)) {
                    if(projectIds.length !== 0) {
                        // if user is in present in project
                        console.log('innn');
                        whereCond = {
                            [Sequelize.Op.and]: [
                                {recipientId: id},
                                {clientId: req.authData.PM_Client_ID},
                                {createdAt: {[Sequelize.Op.gte]: date}},
                                {
                                    [Sequelize.Op.or]: [
                                        {
                                            [Sequelize.Op.and]: [
                                                {messageType: {[Sequelize.Op.in]: notificationTypes}},
                                                {projectId: {[Sequelize.Op.in]: projectIds}},
                                                {
                                                    [Sequelize.Op.or]:
                                                        [
                                                            // { messageType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {projectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {projectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {projectRole: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {subProjectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {subProjectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {milestoneDescription: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {taskName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                        ],
                                                },
                                            ],
                                        },
                                        {
                                            [Sequelize.Op.and]: [
                                                {messageType: {[Sequelize.Op.in]: ['resource', 'resourcePublished', 'resourceRemove']}},
                                                {projectId: {[Sequelize.Op.in]: projectIds}},
                                                {roleId: req.authData.selectRoleID},
                                                {
                                                    [Sequelize.Op.or]:
                                                        [
                                                            // { messageType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {projectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {projectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {projectRole: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {subProjectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {subProjectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {milestoneDescription: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {taskName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                        ],
                                                },
                                            ],
                                        },
                                        {
                                            [Sequelize.Op.and]: [
                                                {messageType: {[Sequelize.Op.in]: ['default', 'firstLoginWelcome', 'firstLoginTips', 'firstLoginStartFirstProject']}},
                                                {
                                                    [Sequelize.Op.or]:
                                                        [
                                                            // { messageType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            // { projectName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            // { projectType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            // { projectRole: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            // { subProjectName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            // { subProjectType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            // { milestoneDescription: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            // { taskName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                        ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    [Sequelize.Op.or]: [
                                        {
                                            [Sequelize.Op.and]: [
                                                {
                                                    messageType: {[Sequelize.Op.in]: ['firstLoginWelcome', 'firstLoginTips', 'firstLoginStartFirstProject']},
                                                },
                                                {
                                                    [Sequelize.Op.or]:
                                                        [
                                                            // { messageType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {projectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {projectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {projectRole: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {subProjectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {subProjectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {milestoneDescription: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            {taskName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                            // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                        ],
                                                },
                                                {senderId: {[Sequelize.Op.eq]: req.authData.PM_UserID}},
                                            ],
                                        },
                                        {senderId: {[Sequelize.Op.ne]: req.authData.PM_UserID}},
                                    ],
                                },
                            ],
                        };
                        whereCond1 = {
                            [Sequelize.Op.and]: [
                                {recipientId: id},
                                {clientId: req.authData.PM_Client_ID},
                                {createdAt: {[Sequelize.Op.gte]: date}},
                                {
                                    [Sequelize.Op.or]: [
                                        {
                                            [Sequelize.Op.and]: [
                                                {messageType: {[Sequelize.Op.in]: notificationTypes}},
                                                {projectId: {[Sequelize.Op.in]: projectIds}},
                                            ],
                                        },
                                        {
                                            [Sequelize.Op.and]: [
                                                {projectId: {[Sequelize.Op.in]: projectIds}},
                                                {messageType: {[Sequelize.Op.in]: ['resource', 'resourcePublished', 'resourceRemove']}},
                                                {roleId: req.authData.selectRoleID},
                                            ],
                                        },
                                        {
                                            messageType: {[Sequelize.Op.in]: ['default']},
                                        },
                                    ],
                                },
                                {
                                    senderId: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                                },
                            ],
                        };
                    } /* else {
          // console.log('else project ---- ');
          // if user is not present in any project
            whereCond = {
              [Sequelize.Op.and]: [
                { recipientId: id },
                { clientId: req.authData.PM_Client_ID },
                { createdAt: { [Sequelize.Op.gte]: date } },
                { [Sequelize.Op.or]: [
                  {
                    [Sequelize.Op.and]: [
                      { messageType: { [Sequelize.Op.in]: ['resource', 'resourcePublished'] } },
                      { roleId: req.authData.selectRoleID },
                      {
                        [Sequelize.Op.or]:
                                                    [
                                                      // { messageType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { messageSubject: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { description: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { projectName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { projectType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { projectRole: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { subProjectName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { subProjectType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { milestoneDescription: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { taskName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                    ],
                      },
                    ],
                  },
                  {
                    [Sequelize.Op.and]: [
                      { messageType: { [Sequelize.Op.eq]: 'resourceRemove' } },
                      { roleId: req.authData.selectRoleID },
                      {
                        [Sequelize.Op.or]:
                                                    [
                                                      // { messageType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { messageSubject: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { description: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { projectName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { projectType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { projectRole: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { subProjectName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { subProjectType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { milestoneDescription: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { taskName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                    ],
                      },
                    ],
                  },
                  {
                    [Sequelize.Op.and]: [
                      {
                        messageType: { [Sequelize.Op.in]: ['default', 'firstLoginWelcome', 'firstLoginTips', 'firstLoginStartFirstProject'] },
                      },
                      {
                        [Sequelize.Op.or]:
                                                    [
                                                      // { messageType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { messageSubject: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { description: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { projectName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { projectType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { projectRole: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { subProjectName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { subProjectType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { milestoneDescription: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { taskName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                    ],
                      },
                    ],
                  },
                ] },
                { [Sequelize.Op.or]: [
                  {
                    [Sequelize.Op.and]: [
                      {
                        messageType: { [Sequelize.Op.in]: ['firstLoginWelcome', 'firstLoginTips', 'firstLoginStartFirstProject'] },
                      },
                      {
                        [Sequelize.Op.or]:
                                                    [
                                                      // { messageType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { messageSubject: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { description: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { projectName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { projectType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { projectRole: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { subProjectName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { subProjectType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { milestoneDescription: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      { taskName: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                      // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                    ],
                      },
                      { senderId: { [Sequelize.Op.eq]: req.authData.PM_UserID } },
                    ],
                  },
                  { senderId: { [Sequelize.Op.ne]: req.authData.PM_UserID } },
                ] }],
            };
            whereCond1 = {
              [Sequelize.Op.and]: [
                { recipientId: id },
                { clientId: req.authData.PM_Client_ID },
                { createdAt: { [Sequelize.Op.gte]: date } },
                { [Sequelize.Op.or]: [
                  {
                    [Sequelize.Op.and]: [
                      { messageType: { [Sequelize.Op.in]: ['resource', 'resourcePublished'] } },
                      { roleId: req.authData.selectRoleID },
                    ],
                  },
                  {
                    [Sequelize.Op.and]: [
                      { messageType: { [Sequelize.Op.eq]: 'resourceRemove' } },
                      { roleId: req.authData.selectRoleID },
                    ],
                  },
                  {
                    messageType: { [Sequelize.Op.in]: ['default'] },
                  },
                ] },
                { senderId: { [Sequelize.Op.ne]: req.authData.PM_UserID } }],
            };
          } */
                } else {
                    whereCond = {
                        projectId: {[Sequelize.Op.in]: projectIds},
                        recipientId: id,
                        clientId: req.authData.PM_Client_ID,
                        createdAt: {[Sequelize.Op.gte]: date},
                        messageType: {[Sequelize.Op.in]: notificationTypes},
                        [Sequelize.Op.or]:
                            [
                                // { messageType: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                {projectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                {projectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                {projectRole: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                {subProjectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                {subProjectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                {milestoneDescription: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                {taskName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                            ],
                    };
                    whereCond1 = {
                        projectId: {[Sequelize.Op.in]: projectIds},
                        recipientId: id,
                        clientId: req.authData.PM_Client_ID,
                        createdAt: {[Sequelize.Op.gte]: date},
                        messageType: {[Sequelize.Op.in]: notificationTypes},
                    };
                }
                // console.log('wheree  ', whereCond);
                let query = {
                    where: {
                        PM_Client_ID: req.authData.PM_Client_ID,
                    },
                    include: [
                        {
                            model: NotificationsScreen,
                            as: 'Notification',
                            where: whereCond,
                        },
                    ],
                    subQuery: false,
                    order: [[{model: NotificationsScreen, as: 'Notification'}, 'id', 'DESC']],
                    raw: true,
                };
                findNotificationsMob(req, query)
                    .then((data) => {
                        let notifications = [];
                        notifications = data;
                        query = {
                            where: {
                                PM_Client_ID: req.authData.PM_Client_ID,
                                PM_User_FullName: {[Sequelize.Op.like]: `%${req.query.search}%`},
                            },
                            include: [
                                {
                                    model: NotificationsScreen,
                                    as: 'Notification',
                                    where: whereCond1,
                                },
                            ],
                            subQuery: false,
                            order: [[{model: NotificationsScreen, as: 'Notification'}, 'id', 'DESC']],
                            raw: true,
                        };
                        findNotificationsMob(req, query)
                            .then((data2) => {
                                notifications = notifications.concat(data2);
                                notifications = _.uniqBy(notifications, 'ID');
                                // res.json(notifications);
                                if(notifications && notifications.length !== 0) {
                                    getImageUrl(res, notifications, 0, 'User_PP');
                                } else {
                                    return res.json(notifications);
                                }
                            });
                    });
            })
            .catch(() => {
                res.json([]);
            });
    } else {
        res.json([]);
    }
}

export function addNotificationType(req, res) {
    const array = [];
    for(let i = 0; i < req.body.permission_id.length; i += 1) {
        const body = {
            permission_id: req.body.permission_id[i],
            notify_type: req.body.notify_type,
        };
        array.push(body);
    }
    PermissionNotify.bulkCreate(array)
        .then(result => res.json(result))
        .catch(err => res.json(err));
}

export function searchInNotifyWeb(req, res) {
    const id = parseInt(req.query.id, 10);

    const date = subDays(new Date(), 2);
    const permissionArray = [];

    for(let i = 0; i < req.authData.Permission.length; i += 1) {
        if(req.authData.Permission[i].Status === true) {
            permissionArray.push(req.authData.Permission[i].ID);
        }
    }

    getNotificationTypes(permissionArray)
        .then((notification) => {
            const notificationTypes2 = [];
            const notificationTypes1 = [];
            const notificationTypes = [];
            for(let i = 0; i < notification.length; i += 1) {
                if(notification[i] !== 'resource') {
                    notificationTypes1.push(notification[i]);
                }
            }
            for(let i = 0; i < notificationTypes1.length; i += 1) {
                if(notificationTypes1[i] !== 'resourceRemove') {
                    notificationTypes2.push(notificationTypes1[i]);
                }
            }
            for(let i = 0; i < notificationTypes2.length; i += 1) {
                if(notificationTypes2[i] !== 'resourcePublished') {
                    notificationTypes.push(notificationTypes2[i]);
                }
            }

            getProjectList(req.authData.PM_UserID, req.authData.PM_Client_ID)
                .then((projectIds) => {
                    let whereCond = {};
                    let whereCond1 = {};
                    if(!permissionArray.includes(14)) {
                        if(projectIds.length !== 0) {
                            // if user is in present in project
                            console.log('innn');
                            whereCond = {
                                [Sequelize.Op.and]: [
                                    {recipientId: id},
                                    {clientId: req.authData.PM_Client_ID},
                                    {createdAt: {[Sequelize.Op.gte]: date}},
                                    {
                                        [Sequelize.Op.or]: [
                                            {
                                                [Sequelize.Op.and]: [
                                                    {messageType: {[Sequelize.Op.in]: notificationTypes}},
                                                    {projectId: {[Sequelize.Op.in]: projectIds}},
                                                    {
                                                        [Sequelize.Op.or]:
                                                            [
                                                                {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectRole: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {milestoneDescription: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {taskName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                                // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            ],
                                                    },
                                                ],
                                            },
                                            {
                                                [Sequelize.Op.and]: [
                                                    {projectId: {[Sequelize.Op.in]: projectIds}},
                                                    {messageType: {[Sequelize.Op.in]: ['resource', 'resourcePublished']}},
                                                    {roleId: req.authData.selectRoleID},
                                                    {
                                                        [Sequelize.Op.or]:
                                                            [
                                                                {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectRole: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {milestoneDescription: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {taskName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                                // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            ],
                                                    },
                                                ],
                                            },
                                            {
                                                [Sequelize.Op.and]: [
                                                    {messageType: {[Sequelize.Op.eq]: 'resourceRemove'}},
                                                    {roleId: req.authData.selectRoleID},
                                                    {
                                                        [Sequelize.Op.or]:
                                                            [
                                                                {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectRole: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {milestoneDescription: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {taskName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                                // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            ],
                                                    },
                                                ],
                                            },
                                            {
                                                [Sequelize.Op.and]: [
                                                    {messageType: {[Sequelize.Op.in]: ['default', 'firstLoginWelcome', 'firstLoginTips', 'firstLoginStartFirstProject']}},
                                                    {
                                                        [Sequelize.Op.or]:
                                                            [
                                                                {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                                // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            ],
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        [Sequelize.Op.or]: [
                                            {
                                                [Sequelize.Op.and]: [
                                                    {
                                                        messageType: {[Sequelize.Op.in]: ['firstLoginWelcome', 'firstLoginTips', 'firstLoginStartFirstProject']},
                                                    },
                                                    {
                                                        [Sequelize.Op.or]:
                                                            [
                                                                {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectRole: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {milestoneDescription: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {taskName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                                // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            ],
                                                    },
                                                    {senderId: {[Sequelize.Op.eq]: req.authData.PM_UserID}},
                                                ],
                                            },
                                            {senderId: {[Sequelize.Op.ne]: req.authData.PM_UserID}},
                                        ],
                                    },
                                ],
                            };
                            whereCond1 = {
                                [Sequelize.Op.and]: [
                                    {recipientId: id},
                                    {clientId: req.authData.PM_Client_ID},
                                    {createdAt: {[Sequelize.Op.gte]: date}},
                                    {
                                        [Sequelize.Op.or]: [
                                            {
                                                [Sequelize.Op.and]: [
                                                    {messageType: {[Sequelize.Op.in]: notificationTypes}},
                                                    {projectId: {[Sequelize.Op.in]: projectIds}},
                                                ],
                                            },
                                            {
                                                [Sequelize.Op.and]: [
                                                    {messageType: {[Sequelize.Op.in]: ['resource', 'resourcePublished']}},
                                                    {roleId: req.authData.selectRoleID},
                                                ],
                                            },
                                            {
                                                [Sequelize.Op.and]: [
                                                    {messageType: {[Sequelize.Op.eq]: 'resourceRemove'}},
                                                    {roleId: req.authData.selectRoleID},
                                                ],
                                            },
                                            {
                                                messageType: {[Sequelize.Op.in]: ['default']},
                                            },
                                        ],
                                    },
                                    {
                                        senderId: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                                    },
                                ],
                            };
                        } else {
                            // console.log('else project ---- ');
                            // if user is not present in any project
                            whereCond = {
                                [Sequelize.Op.and]: [
                                    {recipientId: id},
                                    {clientId: req.authData.PM_Client_ID},
                                    {createdAt: {[Sequelize.Op.gte]: date}},
                                    {
                                        [Sequelize.Op.or]: [
                                            {
                                                [Sequelize.Op.and]: [
                                                    {messageType: {[Sequelize.Op.in]: ['resource', 'resourcePublished']}},
                                                    {roleId: req.authData.selectRoleID},
                                                    {
                                                        [Sequelize.Op.or]:
                                                            [
                                                                {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectRole: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {milestoneDescription: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {taskName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                                // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            ],
                                                    },
                                                ],
                                            },
                                            {
                                                [Sequelize.Op.and]: [
                                                    {messageType: {[Sequelize.Op.eq]: 'resourceRemove'}},
                                                    {roleId: req.authData.selectRoleID},
                                                    {
                                                        [Sequelize.Op.or]:
                                                            [
                                                                {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectRole: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {milestoneDescription: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {taskName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                                // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            ],
                                                    },
                                                ],
                                            },
                                            {
                                                [Sequelize.Op.and]: [
                                                    {
                                                        messageType: {[Sequelize.Op.in]: ['default', 'firstLoginWelcome', 'firstLoginTips', 'firstLoginStartFirstProject']},
                                                    },
                                                    {
                                                        [Sequelize.Op.or]:
                                                            [
                                                                {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectRole: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {milestoneDescription: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {taskName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                                // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            ],
                                                    },
                                                ],
                                            },
                                        ]
                                    },
                                    {
                                        [Sequelize.Op.or]: [
                                            {
                                                [Sequelize.Op.and]: [
                                                    {
                                                        messageType: {[Sequelize.Op.in]: ['firstLoginWelcome', 'firstLoginTips', 'firstLoginStartFirstProject']},
                                                    },
                                                    {
                                                        [Sequelize.Op.or]:
                                                            [
                                                                {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {projectRole: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {subProjectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {milestoneDescription: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                {taskName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                                                // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                                // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                                            ],
                                                    },
                                                    {senderId: {[Sequelize.Op.eq]: req.authData.PM_UserID}},
                                                ],
                                            },
                                            {senderId: {[Sequelize.Op.ne]: req.authData.PM_UserID}},
                                        ]
                                    }],
                            };
                            whereCond1 = {
                                [Sequelize.Op.and]: [
                                    {recipientId: id},
                                    {clientId: req.authData.PM_Client_ID},
                                    {createdAt: {[Sequelize.Op.gte]: date}},
                                    {
                                        [Sequelize.Op.or]: [
                                            {
                                                [Sequelize.Op.and]: [
                                                    {messageType: {[Sequelize.Op.in]: ['resource', 'resourcePublished']}},
                                                    {roleId: req.authData.selectRoleID},
                                                ],
                                            },
                                            {
                                                [Sequelize.Op.and]: [
                                                    {messageType: {[Sequelize.Op.eq]: 'resourceRemove'}},
                                                    {roleId: req.authData.selectRoleID},
                                                ],
                                            },
                                            {
                                                messageType: {[Sequelize.Op.in]: ['default']},
                                            },
                                        ]
                                    },
                                    {senderId: {[Sequelize.Op.ne]: req.authData.PM_UserID}}],
                            };
                        }
                    } else {
                        whereCond = {
                            recipientId: id,
                            clientId: req.authData.PM_Client_ID,
                            createdAt: {[Sequelize.Op.gte]: date},
                            messageType: {[Sequelize.Op.in]: notificationTypes},
                            [Sequelize.Op.or]:
                                [
                                    {messageSubject: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                    {description: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                    {projectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                    {projectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                    {projectRole: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                    {subProjectName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                    {subProjectType: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                    {milestoneDescription: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                    {taskName: {[Sequelize.Op.like]: `%${req.query.search}%`}},
                                    // { createdAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                    // { updatedAt: { [Sequelize.Op.like]: `%${req.query.search}%` } },
                                ],
                        };
                        whereCond1 = {
                            recipientId: id,
                            clientId: req.authData.PM_Client_ID,
                            createdAt: {[Sequelize.Op.gte]: date},
                            messageType: {[Sequelize.Op.in]: notificationTypes},
                        };
                    }
                    // console.log('wheree  ', whereCond);
                    let query = {
                        where: {
                            PM_Client_ID: req.authData.PM_Client_ID,
                        },
                        include: [
                            {
                                model: NotificationsScreen,
                                as: 'Notification',
                                where: whereCond,
                            },
                        ],
                        subQuery: false,
                        order: [[{model: NotificationsScreen, as: 'Notification'}, 'id', 'DESC']],
                        raw: true,
                    };
                    findNotifications(req, query)
                        .then((data) => {
                            let notifications = [];
                            notifications = data;
                            query = {
                                where: {
                                    PM_Client_ID: req.authData.PM_Client_ID,
                                    PM_User_FullName: {[Sequelize.Op.like]: `%${req.query.search}%`},
                                },
                                include: [
                                    {
                                        model: NotificationsScreen,
                                        as: 'Notification',
                                        where: whereCond1,
                                    },
                                ],
                                subQuery: false,
                                order: [[{model: NotificationsScreen, as: 'Notification'}, 'id', 'DESC']],
                                raw: true,
                            };
                            findNotifications(req, query)
                                .then((data2) => {
                                    notifications = notifications.concat(data2);
                                    notifications = _.uniqBy(notifications, 'notify_Id');
                                    // res.json(notifications);
                                    if(notifications && notifications.length !== 0) {
                                        getImageUrl(res, notifications, 0, 'User_PP');
                                    } else {
                                        return res.json(notifications);
                                    }
                                });
                        });
                })
                .catch(() => {
                    res.json([]);
                });
        })
        .catch(() => {
            res.json([]);
        });
}

export function createBodyAndSendNotification(req, channelType, notifyType) {
    return new Promise((resolve) => {
        if(channelType === 'screen') {
            let users = [];
            let bodyScreen = {};
            if(notifyType === 'firstLoginWelcome') {
                users = [
                    {
                        PM_UserID: req.body.PM_UserID,
                    },
                ];
                bodyScreen = {
                    body: {
                        messageType: 'firstLoginWelcome',
                        messageSubject: `Welcome to ETAPMS ${req.body.PM_User_FullName}`,
                        isWeb: true,
                        isMob: true,
                        description: `Hi ${req.body.PM_User_FullName}, welcome to your ETAPMS Dashboard...`,
                        recipientIdData: users,
                    },
                    authData: req.authData,
                };
                return saveScreenBackend(bodyScreen)
                    .then(s => resolve(s))
                    .catch(e => resolve(e));
            } else if(notifyType === 'firstLoginTips') {
                users = [
                    {
                        PM_UserID: req.body.PM_UserID,
                    },
                ];
                bodyScreen = {
                    body: {
                        messageType: 'firstLoginTips',
                        messageSubject: 'Tips for using ETAPMS',
                        isWeb: true,
                        isMob: true,
                        description: 'Hi, Here are few tips to start your journey...',
                        recipientIdData: users,
                    },
                    authData: req.authData,
                };
                return saveScreenBackend(bodyScreen)
                    .then(s => resolve(s))
                    .catch(e => resolve(e));
            } else if(notifyType === 'firstLoginStartFirstProject') {
                users = [
                    {
                        PM_UserID: req.body.PM_UserID,
                    },
                ];
                bodyScreen = {
                    body: {
                        messageType: 'firstLoginStartFirstProject',
                        messageSubject: 'Start your first project',
                        isWeb: true,
                        isMob: true,
                        description: 'Hi, Start creating your first project follow below steps',
                        recipientIdData: users,
                    },
                    authData: req.authData,
                };
                return saveScreenBackend(bodyScreen)
                    .then(s => resolve(s))
                    .catch(e => resolve(e));
            }
        } else if(channelType === 'emailPublishProject') {
            const bodyWelcome = {
                clientId: req.authData.PM_Client_ID,
                senderId: req.authData.PM_UserID,
                senderEmail: req.authData.PM_User_Email_ID,
                senderMobile: req.authData.PM_User_MobileNumber,
                messageType: 'assignedPublished',
                subject: `${req.authData.PM_User_FullName} ${process.env.ASSIGNED_PROJECT}`,
                priority: 'low',
                projectId: req.body[0].PM_Project_ID,
                recipientsAndData: [
                    {
                        email: req.body[1].PM_User_Email_ID,
                        // mob: req.body[1].PM_User_MobileNumber,
                        data: `${req.body[1].PM_User_FullName}|
                        ${req.authData.PM_User_FullName} ${process.env.ASSIGNED_PROJECT}|
                        ${req.body[0].PM_Project_Name}|
                        ${process.env.PROTOCOL}${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}|
                        ${req.authData.PM_Domain.toLowerCase()}.${process.env.MAIN_DOMAIN}`,
                    },
                ],
            };
            bodyWelcome.subprojectArray = req.body[0].subproject;
            bodyWelcome.milestoneArray = req.body[0].projMilestone;
            bodyWelcome.taskArray = req.body[0].projTask;
            saveEmailSmsBacked(bodyWelcome);
        } else if(channelType === 'screenPublished') {
            if(notifyType === 'resource') {
                const users = [{PM_UserID: req.body[1].PM_UserID}];
                const bodyScreen = {
                    body: {
                        messageType: 'resource',
                        messageSubject: 'You are now added to a project',
                        isWeb: true,
                        isMob: true,
                        description: '',
                        projectId: req.body[0].PM_Project_ID,
                        projectName: req.body[0].PM_Project_Name,
                        projectType: req.body[0].PM_Project_Type,
                        projectRole: req.roleName,
                        recipientIdData: users,
                        roleId: req.role,
                    },
                    authData: req.authData,
                };
                console.log('send notification screen --- ');
                return saveScreenBackend(bodyScreen)
                    .then(s => resolve(s))
                    .catch(e => resolve(e));
            } else if(notifyType === 'resourcePublished') {
                const users = [{PM_UserID: req.body[1].PM_UserID}];
                const bodyScreen = {
                    body: {
                        messageType: 'resourcePublished',
                        messageSubject: 'You are now added to a project',
                        isWeb: true,
                        isMob: true,
                        description: '',
                        projectId: req.body[0].PM_Project_ID,
                        projectName: req.body[0].PM_Project_Name,
                        projectType: req.body[0].PM_Project_Type,
                        projectRole: req.roleName,
                        recipientIdData: users,
                        roleId: req.role,
                        // subProjectIds: req.body[0].subproject,
                        // milestoneIds: req.body[0].projMilestone,
                        // taskIds: req.body[0].projTask,
                    },
                    authData: req.authData,
                };
                if(req.body[0].subproject) {
                    bodyScreen.body.subProjectIds = req.body[0].subproject;
                }
                if(req.body[0].projMilestone) {
                    bodyScreen.body.milestoneIds = req.body[0].projMilestone;
                }
                if(req.body[0].projTask) {
                    bodyScreen.body.taskIds = req.body[0].projTask;
                }
                console.log('send notification screen --- ', req);
                console.log('bodyScreen ', bodyScreen);
                return saveScreenBackend(bodyScreen)
                    .then(s => resolve(s))
                    .catch(e => resolve(e));
            }
        }
    });
}

function findUsersSMT(projectId, clientId, users, index, req) {
    let indexA = index;
    Project.findAll({
        where: {
            PM_Project_ID: projectId,
            PM_Client_ID: clientId,
        },
        attributes: ['PM_Project_ID', 'PM_Project_Name'],
        required: false,
        include: [
            {
                model: SubProject,
                as: 'subproject',
                where: {
                    PM_Project_ID: projectId,
                    PM_Client_ID: clientId,
                    [Sequelize.Op.or]:
                        [
                            {PM_SubProject_Assignee: users[index].PM_UserID},
                            {PM_SubProject_Auditor: users[index].PM_UserID},
                            {PM_SubProject_Approver: users[index].PM_UserID},
                        ],
                },
                attributes: ['PM_SubProject_ID', 'PM_SubProject_Name'],
                required: false,
            },
            {
                model: Milestone,
                as: 'projMilestone',
                where: {
                    PM_Project_ID: projectId,
                    PM_Client_ID: clientId,
                    [Sequelize.Op.or]:
                        [
                            {PM_Milestone_Assignee: users[index].PM_UserID},
                            {PM_Milestone_Auditor: users[index].PM_UserID},
                            {PM_Milestone_Approver: users[index].PM_UserID},
                        ],
                },
                attributes: ['PM_Milestone_ID', 'PM_Milestone'],
                required: false,
            },
            {
                model: Task,
                as: 'projTask',
                where: {
                    PM_Project_ID: projectId,
                    PM_Client_ID: clientId,
                    [Sequelize.Op.or]:
                        [
                            {PM_Task_Assignee: users[index].PM_UserID},
                            {PM_Task_Auditor: users[index].PM_UserID},
                            {PM_Task_Approver: users[index].PM_UserID},
                        ],
                },
                attributes: ['PM_Task_ID', 'PM_Task_Name'],
                required: false,
            },
        ],
        // raw: true,
    })
        .then((r) => {
            // console.log('data ', r);
            // r.push(users);
            const data = r;
            if(data) {
                data.push(users[index]);
                const bodyU = {
                    authData: req.authData,
                    body: data,
                };
                createBodyAndSendNotification(bodyU, 'emailPublishProject', 'assignedPublished');
                indexA += 1;
                if(indexA !== users.length) {
                    findUsersSMT(projectId, req.authData.PM_Client_ID, users, indexA, req);
                }
                // return res.json(data);
            }
            // return res.json([]);
        })
        .catch((e) => {
            // console.log('e ', e);
            indexA += 1;
            if(indexA !== users.length) {
                findUsersSMT(projectId, req.authData.PM_Client_ID, users, indexA, req);
            }
        });
}

function findRoleWisePermissions(req, projectId, users, userIndex, roleIndex) {
    console.log('users - ', users[userIndex].PM_User_FullName, ' --u index ', userIndex, ' --r index ', roleIndex);
    Role.find({
        where: {
            PM_Client_ID: req.authData.PM_Client_ID,
            Status: 1,
        },
        include: [{
            model: RolePermission,
            as: 'RoleP',
            where: {
                clientID: req.authData.PM_Client_ID,
                roleID: users[userIndex].UserResource[roleIndex].resource_user_role,
                // permissionID: { [Sequelize.Op.in]: [1, 6, 12] },
                status: 1,
            },
        }],
    })
    /* RolePermission.find({
    where: {
      clientID: req.authData.PM_Client_ID,
      roleID: users[userIndex].UserResource[roleIndex].resource_user_role,
      permissionID: { [Sequelize.Op.in]: [1, 6, 12] },
    },
  }) */
        .then((permission) => {
            console.log('users[userIndex].UserResource[roleIndex].resource_user_role ', users[userIndex].UserResource[roleIndex].resource_user_role);
            console.log('Role Description --- ', permission.Description);

            let selectedPerm = 'none';
            for(let i = 0; i < permission.RoleP.length; i += 1) {
                if(permission.RoleP[i].permissionID === 6) {
                    // assignee
                    selectedPerm = '6';
                    break;
                } else if(permission.RoleP[i].permissionID === 12) {
                    // auditor
                    selectedPerm = '12';
                    break;
                } else if(permission.RoleP[i].permissionID === 1) {
                    // approver
                    selectedPerm = '1';
                    break;
                } else if(permission.RoleP[i].permissionID === 14) {
                    // customer
                    selectedPerm = '14';
                }
            }
            console.log('selectedPerm -- ', selectedPerm);

            if(selectedPerm === '6' || selectedPerm === '12' || selectedPerm === '1') {
                // permissions assignee, auditor, approver
                console.log('6 12 1');
                let queryConditon = {};
                if(selectedPerm === '6') {
                    queryConditon = {
                        where: {
                            PM_Project_ID: projectId,
                            PM_Client_ID: req.authData.PM_Client_ID,
                        },
                        attributes: ['PM_Project_ID', 'PM_Project_Name', 'PM_Project_Type'],
                        required: false,
                        include: [
                            {
                                model: SubProject,
                                as: 'subproject',
                                where: {
                                    PM_Project_ID: projectId,
                                    PM_Client_ID: req.authData.PM_Client_ID,
                                    [Sequelize.Op.or]:
                                        [
                                            {PM_SubProject_Assignee: users[userIndex].PM_UserID},
                                        ],
                                },
                                attributes: ['PM_SubProject_ID'],
                                required: false,
                            },
                            {
                                model: Milestone,
                                as: 'projMilestone',
                                where: {
                                    PM_Project_ID: projectId,
                                    PM_Client_ID: req.authData.PM_Client_ID,
                                    [Sequelize.Op.or]:
                                        [
                                            {PM_Milestone_Assignee: users[userIndex].PM_UserID},
                                        ],
                                },
                                attributes: ['PM_Milestone_ID'],
                                required: false,
                            },
                            {
                                model: Task,
                                as: 'projTask',
                                where: {
                                    PM_Project_ID: projectId,
                                    PM_Client_ID: req.authData.PM_Client_ID,
                                    [Sequelize.Op.or]:
                                        [
                                            {PM_Task_Assignee: users[userIndex].PM_UserID},
                                        ],
                                },
                                attributes: ['PM_Task_ID'],
                                required: false,
                            },
                        ],
                        // raw: true,
                    };
                } else if(selectedPerm === '12') {
                    queryConditon = {
                        where: {
                            PM_Project_ID: projectId,
                            PM_Client_ID: req.authData.PM_Client_ID,
                        },
                        attributes: ['PM_Project_ID', 'PM_Project_Name', 'PM_Project_Type'],
                        required: false,
                        include: [
                            {
                                model: SubProject,
                                as: 'subproject',
                                where: {
                                    PM_Project_ID: projectId,
                                    PM_Client_ID: req.authData.PM_Client_ID,
                                    [Sequelize.Op.or]:
                                        [
                                            {PM_SubProject_Auditor: users[userIndex].PM_UserID},
                                        ],
                                },
                                attributes: ['PM_SubProject_ID'],
                                required: false,
                            },
                            {
                                model: Milestone,
                                as: 'projMilestone',
                                where: {
                                    PM_Project_ID: projectId,
                                    PM_Client_ID: req.authData.PM_Client_ID,
                                    [Sequelize.Op.or]:
                                        [
                                            {PM_Milestone_Auditor: users[userIndex].PM_UserID},
                                        ],
                                },
                                attributes: ['PM_Milestone_ID'],
                                required: false,
                            },
                            {
                                model: Task,
                                as: 'projTask',
                                where: {
                                    PM_Project_ID: projectId,
                                    PM_Client_ID: req.authData.PM_Client_ID,
                                    [Sequelize.Op.or]:
                                        [
                                            {PM_Task_Auditor: users[userIndex].PM_UserID},
                                        ],
                                },
                                attributes: ['PM_Task_ID'],
                                required: false,
                            },
                        ],
                        // raw: true,
                    };
                } else if(selectedPerm === '1') {
                    queryConditon = {
                        where: {
                            PM_Project_ID: projectId,
                            PM_Client_ID: req.authData.PM_Client_ID,
                        },
                        attributes: ['PM_Project_ID', 'PM_Project_Name', 'PM_Project_Type'],
                        required: false,
                        include: [
                            {
                                model: SubProject,
                                as: 'subproject',
                                where: {
                                    PM_Project_ID: projectId,
                                    PM_Client_ID: req.authData.PM_Client_ID,
                                    [Sequelize.Op.or]:
                                        [
                                            {PM_SubProject_Approver: users[userIndex].PM_UserID},
                                        ],
                                },
                                attributes: ['PM_SubProject_ID'],
                                required: false,
                            },
                            {
                                model: Milestone,
                                as: 'projMilestone',
                                where: {
                                    PM_Project_ID: projectId,
                                    PM_Client_ID: req.authData.PM_Client_ID,
                                    [Sequelize.Op.or]:
                                        [
                                            {PM_Milestone_Approver: users[userIndex].PM_UserID},
                                        ],
                                },
                                attributes: ['PM_Milestone_ID'],
                                required: false,
                            },
                            {
                                model: Task,
                                as: 'projTask',
                                where: {
                                    PM_Project_ID: projectId,
                                    PM_Client_ID: req.authData.PM_Client_ID,
                                    [Sequelize.Op.or]:
                                        [
                                            {PM_Task_Approver: users[userIndex].PM_UserID},
                                        ],
                                },
                                attributes: ['PM_Task_ID'],
                                required: false,
                            },
                        ],
                        // raw: true,
                    };
                }
                Project.findAll(queryConditon)
                    .then((dataA) => {
                        let data = JSON.stringify(dataA);
                        data = JSON.parse(data);
                        console.log('data --- ', data);
                        data.push(users[userIndex]);
                        if(data[0].subproject) {
                            let string = '';
                            for(let i = 0; i < data[0].subproject.length; i += 1) {
                                string += data[0].subproject[i].PM_SubProject_ID;
                                if((i !== data[0].subproject.length - 1)) {
                                    string += ',';
                                }
                            }
                            data[0].subproject = string;
                        }
                        if(data[0].projMilestone) {
                            let string = '';
                            for(let i = 0; i < data[0].projMilestone.length; i += 1) {
                                string += data[0].projMilestone[i].PM_Milestone_ID;
                                if((i !== data[0].projMilestone.length - 1)) {
                                    string += ',';
                                }
                            }
                            data[0].projMilestone = string;
                        }
                        if(data[0].projTask) {
                            let string = '';
                            for(let i = 0; i < data[0].projTask.length; i += 1) {
                                string += data[0].projTask[i].PM_Task_ID;
                                if((i !== data[0].projTask.length - 1)) {
                                    string += ',';
                                }
                            }
                            data[0].projTask = string;
                        }
                        if(selectedPerm === '6') {
                            // data.push(users[userIndex]);
                            const bodyU = {
                                authData: req.authData,
                                body: data,
                                role: users[userIndex].UserResource[roleIndex].resource_user_role,
                                roleName: permission.Description,
                            };
                            console.log('ddd dddd dddd ddd ');
                            createBodyAndSendNotification(bodyU, 'screenPublished', 'resourcePublished');
                            const tempRoleIndex = roleIndex + 1;
                            if(tempRoleIndex !== users[userIndex].UserResource.length) {
                                // next role
                                findRoleWisePermissions(req, projectId, users, userIndex, tempRoleIndex);
                            } else {
                                // next user
                                const tempUserIndex = userIndex + 1;
                                if(tempUserIndex !== users.length) {
                                    findRoleWisePermissions(req, projectId, users, tempUserIndex, 0);
                                }
                            }
                            // return res.json(data);
                        } else if(selectedPerm === '12') {
                            const bodyU = {
                                authData: req.authData,
                                body: data,
                                role: users[userIndex].UserResource[roleIndex].resource_user_role,
                                roleName: permission.Description,
                            };
                            console.log('ddd dddd dddd ddd ');
                            createBodyAndSendNotification(bodyU, 'screenPublished', 'resourcePublished');
                            const tempRoleIndex = roleIndex + 1;
                            if(tempRoleIndex !== users[userIndex].UserResource.length) {
                                // next role
                                findRoleWisePermissions(req, projectId, users, userIndex, tempRoleIndex);
                            } else {
                                // next user
                                const tempUserIndex = userIndex + 1;
                                if(tempUserIndex !== users.length) {
                                    findRoleWisePermissions(req, projectId, users, tempUserIndex, 0);
                                }
                            }
                            // return res.json(data);
                        } else if(selectedPerm === '1') {
                            // data.push(users[userIndex]);
                            const bodyU = {
                                authData: req.authData,
                                body: data,
                                role: users[userIndex].UserResource[roleIndex].resource_user_role,
                                roleName: permission.Description,
                            };
                            console.log('ddd dddd dddd ddd ');
                            createBodyAndSendNotification(bodyU, 'screenPublished', 'resourcePublished');
                            const tempRoleIndex = roleIndex + 1;
                            if(tempRoleIndex !== users[userIndex].UserResource.length) {
                                // next role
                                findRoleWisePermissions(req, projectId, users, userIndex, tempRoleIndex);
                            } else {
                                // next user
                                const tempUserIndex = userIndex + 1;
                                if(tempUserIndex !== users.length) {
                                    findRoleWisePermissions(req, projectId, users, tempUserIndex, 0);
                                }
                            }
                            // return res.json(data);
                        }
                    })
                    .catch((e) => {
                        console.log('e ', e);
                    });
                // res.json(permission);
            } else if(selectedPerm === 'none') {
                // other permissions
                console.log('none');
                Project.find({
                    where: {
                        PM_Client_ID: req.authData.PM_Client_ID,
                        PM_Project_ID: projectId,
                    },
                    attributes: ['PM_Project_ID', 'PM_Project_Name', 'PM_Project_Type'],
                })
                    .then((data) => {
                        if(data) {
                            const array = [];
                            array.push(data);
                            array.push(users[userIndex]);
                            const bodyU = {
                                authData: req.authData,
                                body: array,
                                role: users[userIndex].UserResource[roleIndex].resource_user_role,
                                roleName: permission.Description,
                            };
                            console.log('ddd dddd dddd ddd ');
                            createBodyAndSendNotification(bodyU, 'screenPublished', 'resource');
                            const tempRoleIndex = roleIndex + 1;
                            if(tempRoleIndex !== users[userIndex].UserResource.length) {
                                // next role
                                findRoleWisePermissions(req, projectId, users, userIndex, tempRoleIndex);
                            } else {
                                // next user
                                const tempUserIndex = userIndex + 1;
                                if(tempUserIndex !== users.length) {
                                    findRoleWisePermissions(req, projectId, users, tempUserIndex, 0);
                                }
                            }
                            // return res.json(bodyU);
                        }
                    })
                    .catch((e) => {
                        console.log('e2', e);
                        const tempRoleIndex = roleIndex + 1;
                        if(tempRoleIndex !== users[userIndex].UserResource.length) {
                            // next role
                            findRoleWisePermissions(req, projectId, users, userIndex, tempRoleIndex);
                        } else {
                            // next user
                            const tempUserIndex = userIndex + 1;
                            if(tempUserIndex !== users.length) {
                                findRoleWisePermissions(req, projectId, users, tempUserIndex, 0);
                            }
                        }
                    });
                // res.json([1]);
            } else if(selectedPerm === '14') {
                // increment role
                const tempRoleIndex = roleIndex + 1;
                if(tempRoleIndex !== users[userIndex].UserResource.length) {
                    // next role
                    findRoleWisePermissions(req, projectId, users, userIndex, tempRoleIndex);
                } else {
                    // next user
                    const tempUserIndex = userIndex + 1;
                    if(tempUserIndex !== users.length) {
                        findRoleWisePermissions(req, projectId, users, tempUserIndex, 0);
                    }
                }
                console.log('showCase');
            }
        })
        .catch((e) => {
            console.log('e1 ', e);
            const tempRoleIndex = roleIndex + 1;
            if(tempRoleIndex !== users[userIndex].UserResource.length) {
                // next role
                findRoleWisePermissions(req, projectId, users, userIndex, tempRoleIndex);
            } else {
                // next user
                const tempUserIndex = userIndex + 1;
                if(tempUserIndex !== users.length) {
                    findRoleWisePermissions(req, projectId, users, tempUserIndex, 0);
                }
            }
        });
}

/* export function nt(req, res) {
  const projectId = parseInt(req.query.projectId, 10);
  RegisterUser.findAll({
    where: {
      PM_UserID: { [Sequelize.Op.ne]: req.authData.PM_UserID },
      PM_Client_ID: req.authData.PM_Client_ID,
    },
    include: [
      {
        model: userResource,
        as: 'UserResource',
        where: {
          resource_project_id: projectId,
          resource_client_id: req.authData.PM_Client_ID,
          resource_status: true,
        },
        attributes: ['resource_user_role'],
      },
    ],
    // order: [[{ model: userResource, as: 'UserResource' }, 'createdAt', 'DESC']],
    order: [['PM_User_FullName', 'ASC']],
    attributes: [
      'PM_UserID',
      'PM_User_FullName',
      'PM_User_MobileNumber',
      'PM_User_Email_ID',
    ],
    // raw: true,
  }).then((users) => {
    // return res.json(users);
    findRoleWisePermissions(req, res, projectId, users, 0, 0);
    // return res.json(users);
  })
    .catch((e) => {
      console.log('resource not found published projects', e);
    });
} */

export function publishNotificationScreen(req, whatToPublish) {
    const projectId = req.body.PM_Project_ID;
    if(whatToPublish === 'Project') {
        RegisterUser.findAll({
            where: {
                PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                PM_Client_ID: req.authData.PM_Client_ID,
            },
            include: [
                {
                    model: userResource,
                    as: 'UserResource',
                    where: {
                        resource_project_id: projectId,
                        resource_client_id: req.authData.PM_Client_ID,
                        resource_status: true,
                    },
                    attributes: ['resource_user_role'],
                },
            ],
            // order: [[{ model: userResource, as: 'UserResource' }, 'createdAt', 'DESC']],
            order: [['PM_User_FullName', 'ASC']],
            attributes: [
                'PM_UserID',
                'PM_User_FullName',
                'PM_User_MobileNumber',
                'PM_User_Email_ID',
            ],
            // raw: true,
        })
            .then((users) => {
                // return res.json(users);
                findRoleWisePermissions(req, projectId, users, 0, 0);
                // return res.json(users);
            })
            .catch((e) => {
                console.log('resource not found published projects', e);
            });
    }
}

export function publishNotifications(req, whatToPublish) {
    const projectId = req.body.PM_Project_ID;
    if(whatToPublish === 'Project') {
        RegisterUser.findAll({
            where: {
                PM_UserID: {[Sequelize.Op.ne]: req.authData.PM_UserID},
                PM_Client_ID: req.authData.PM_Client_ID,
            },
            include: [
                {
                    model: userResource,
                    as: 'UserResource',
                    where: {
                        resource_project_id: projectId,
                        resource_client_id: req.authData.PM_Client_ID,
                        resource_status: true,
                    },
                    attributes: ['resource_user_id', 'resource_user_role'],
                },
            ],
            // order: [[{ model: userResource, as: 'UserResource' }, 'createdAt', 'DESC']],
            order: [['PM_User_FullName', 'ASC']],
            attributes: [
                'PM_UserID',
                'PM_User_FullName',
                'PM_User_MobileNumber',
                'PM_User_Email_ID',
            ],
            raw: true,
        })
            .then((users) => {
                const user = _.uniqBy(users, 'PM_UserID');
                findUsersSMT(projectId, req.authData.PM_Client_ID, user, 0, req);
                // return res.send(user);
            })
            .catch((e) => {
                console.log('resource not found published projects', e);
            });
    }
}
