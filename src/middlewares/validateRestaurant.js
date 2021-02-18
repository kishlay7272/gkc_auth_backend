require('../../app');
const dbConn_sql = require('../../config/db_sql.config');
const Order = require('../models/order.model');
const Customer = require('../models/customer.model');
const Item = require('../models/item.model');
const Branch_platform = require('../models/branch_platform.model');
const User = require('../models/user.model');
const axios = require('axios');
var bcrypt = require('bcryptjs');
var jwt = require("jsonwebtoken");
let secret = "he who must not be named";
const { Sequelize, QueryTypes } = require('sequelize');
const { db } = require('../../_helpers/db');


module.exports = {
    validateRestaurantAccess: async function (req, res, next) {
        try {
            if (!req.body.token || req.body.token == "undefined") {
                return res.status(400).json(
                    {
                        "status": "400",
                        "error": "missing token in body"
                    })
            }
            else {
                let token = req.body.token;
                let tokenDetails = jwt.verify(token, secret);
                let userId = tokenDetails.id;
                let userBranchRole = await db.query('select branch_platform_id,role_id from `user_permissions`  where user_id=?', { replacements: [userId], type: QueryTypes.SELECT });
                if (!userBranchRole) {
                    return res.status(400).json(
                        {
                            "status": "400",
                            "error": "user do not have permission to the restaurant"
                        }
                    );
                }
                if (userBranchRole) {
                    let userBranchPlatformPair=[];
                    for(key of userBranchRole)
                        {
                           userBranchPlatformPair.push({branchPlatformId:key.branch_platform_id,role:key.role_id})
                        }
                    req.body.userBranchRole = userBranchPlatformPair;
                    // req.body.role = userBranchRole[0].role_id;
                    next();
                }
            }
        } catch (error) {
            res.status(500).send(error);
        }
    }
}
