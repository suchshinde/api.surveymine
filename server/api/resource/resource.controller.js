import { Resource } from '../../config/sqldb';

export function create(req, res) {
  Resource.bulkCreate(req.body).then(() => {
    res.json([{ status: 200, message: ' resource added' }]);
  })
    .catch((err) => {
      res.json(err);
    });
}

export function createResource(req) {
  return new Promise((resolve, reject) => {
    Resource.bulkCreate(req.body).then((x) => {
      resolve(x);
    })
      .catch((err) => {
        reject(err);
      });
  });
}

export function findAll(req, res) {
  const clientID = req.authData.PM_Client_ID;
  const projectID = parseInt(req.params.projID, 10);
  let subprojID = parseInt(req.params.subprojID, 10);
  let mileID = parseInt(req.params.mileID, 10);
  const taskID = parseInt(req.params.taskID, 10);

  if (isNaN(subprojID)) {
    subprojID = null;
  }
  if (isNaN(mileID)) {
    mileID = null;
  }

  Resource.findAll({
    where: {
      PM_Client_ID: clientID,
      PM_Project_ID: projectID,
      PM_SubProject_ID: subprojID,
      PM_Milestone_ID: mileID,
      PM_Task_ID: taskID,
    },
  })
    .then(result => res.json(result))
    .catch(err => res.json(err));
}
