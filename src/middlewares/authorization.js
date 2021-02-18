require('../../app');
// const dbConn_sql = require('../../config/db_sql.config');
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
const  { db}  = require('../../_helpers/db');

module.exports = {
    login: async function (req, res, next) {
        try {
            if (!req.body || !req.body.email || !req.body.email || req.body.email == "undefined" || req.body.password == "undefined") {
                return res.status(400).json(
                    {
                        "status": "400",
                        "error": "missing email and password in body"
                    })
            }
            else if (!req.body.email || req.body.email == "undefined") {
                return res.status(400).json(
                    {
                        "status": "400",
                        "error": "missing email in body"
                    })
            }
            else if (!req.body.password || req.body.password == "undefined") {
                return res.status(400).json(
                    {
                        "status": "400",
                        "error": "missing paassword in body"
                    })
            }
            else {
                let email = req.body.email;
                let user = await db.query('select * from `user` where email=?', { replacements: [email], type: QueryTypes.SELECT });
                console.log(user);
                if (!user.length) {
                    return res.status(400).json(
                        {
                            "status": "400",
                            "error": "user does not exist"
                        })
                }
                else {
                    let validPassword = await bcrypt.compare(req.body.password, user[0].password);
                    if (!validPassword) {
                        return res.status(400).json(
                            {
                                "status": "400",
                                "error": "user does not exist"
                            })
                    }
                    else {
                        let token = jwt.sign({ id: user[0].id, user_email: req.body.email }, secret);
                        await db.query('UPDATE `user` SET token = ?  WHERE email=?', { replacements: [token, email], type: QueryTypes.INSERT });
                        return res.header("auth-token", token).status(400).json(
                            {
                                "status": "200",
                                "message": "logged in",
                                "token": token
                            })
                    }
                }
            }
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    }
}
