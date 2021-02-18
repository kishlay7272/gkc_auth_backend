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
const { Sequelize, QueryTypes } = require('sequelize');
const { db } = require('../../_helpers/db');
let secret = "he who must not be named";


module.exports = {

    signup: async function (req, res, next) {

        try {
            let salt = await bcrypt.genSalt(10);
            let hasPassword = await bcrypt.hash(req.body.password, salt);
            console.log(hasPassword);
            if (!req.body || !req.body.email || !req.body.role_id || !req.body.email || req.body.role_id == "undefined" || req.body.email == "undefined" || req.body.password == "undefined") {
                return res.status(400).json(
                    {
                        "status": "400",
                        "error": "missing email,roleid, password in body"
                    })
            }
            else {
                let salt = await bcrypt.genSalt(10);
                let hasPassword = await bcrypt.hash(req.body.password, salt);
                console.log(hasPassword);

                let email = req.body.email;
                let role_id = req.body.role_id;
                console.log(email, role_id);
                const prodsQuery1 = "select * from `user` where email=" + `'${email}'`;
                dbConn_sql.query(prodsQuery1, async function (error, results) {
                    console.log(prodsQuery1)
                    if (error)
                        res.status(500).json(
                            {
                                "error": error
                            }
                        );
                    if (!results || results.length == 0) {
                        const prodsQuery = "insert into `user`(email,role_id,`password`) values(" + `'${email}',` + `${role_id},` + `'${hasPassword}')`
                        console.log(prodsQuery);
                        dbConn_sql.query(prodsQuery, async function (error, results) {
                            console.log(prodsQuery)
                            if (error)
                                res.status(500).json(
                                    {
                                        "error": error
                                    })
                            if (results) {
                                return res.status(200).json(
                                    {
                                        "status": "200",
                                        "message": "user created successfully"
                                    }
                                );
                            }
                        })
                    }
                    else {
                        return res.status(200).json(
                            {
                                "status": "200",
                                "error": "user already exists"
                            })
                    }
                })
            }
        }
        catch (error) {
            res.status(500).json(
                {
                    "error": error
                })
        }
    },
    ready: async function (req, res, next) {
        try {
            if (!req.query.orderId || (req.query.orderId == "undefined")) {
                return res.status(400).json(
                    {
                        "status": "400",
                        "error": "missing ordeId in params"
                    }
                );
            }
            else {
                let orderId = req.query.orderId;
                console.log(orderId);
                const prodsQuery = "select * from `order` join session ON `order`.branch_id=`session`.branch_id where `order`.order_id=" + `"${orderId}"`
                dbConn_sql.query(prodsQuery, async function (error, results) {
                    console.log(prodsQuery)
                    if (error) throw error;
                    if (results) {
                        let legacyId = results[0].legacy_id;
                        let short_merchant_id = results[0].short_merchant_id;
                        let url1 = "https://api-gtm.grubhub.com/merchant/" + short_merchant_id + "/orders/" + legacyId + "/status";

                        let authentication_token = results[0].token;
                        console.log(url1)
                        await axios({
                            method: 'put',
                            url: url1,
                            data: { "status": "PICKUP_READY", "unpause_merchant": false },

                            headers: {
                                'Accept': 'application/json',
                                'content-type': 'application/json',
                                'authorization': authentication_token,
                                'origin': 'https://restaurant.grubhub.com'
                            }
                        }).then(response => {
                            res.status(200).json(response.data)
                            console.log(response.data)
                        }).catch(err => {
                            console.log(err);
                            res.status(404).json({ "error": err });
                        })
                    }
                })
            }
        } catch (error) {
            res.status(500).send(error);
        }
    },
    confirm: async function (req, res, next) {
        try {
            if (!req.query.orderId || (req.query.orderId == "undefined")) {
                return res.status(400).json(
                    {
                        "status": "400",
                        "error": "missing ordeId in params"
                    }
                );
            }
            else if (!req.body.token || req.body.token == "undefined") {
                return res.status(400).json(
                    {
                        "status": "400",
                        "error": "missing tioken in body"
                    }
                );
            }

            else {
                let token = jwt.sign({ id: user[0].id, user_email: req.body.email }, secret);
                console.log(orderId);
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
                    let userAccess
                    let userBranchPlatformPair = [];
                    for (key of userBranchRole) {
                        userBranchPlatformPair.push([key.branch_platform_id, key.role_id])
                    }
                    let userBranchRole = userBranchPlatformPair;
                    // req.body.role = userBranchRole[0].role_id;


                    const prodsQuery = "select * from `order` join session ON `order`.branch_id=`session`.branch_id where `order`.order_id=" + `"${orderId}"`
                    dbConn_sql.query(prodsQuery, async function (error, results) {
                        console.log(prodsQuery)
                        if (error) throw error;
                        if (results) {
                            for (key of userBranchRole) {
                                if (key.includes(results[0].branch_id, 0) && key.includes("1", 0)) {
                                    userAccess = true;
                                }
                            }                 
                        }
                        if(!userAccess)
                        {
                            return res.status(400).json(
                                {
                                    "status": "400",
                                    "error": "user do not have permission to the restaurant"
                                })
                        }
                        if(userAccess)
                        {
                    let legacyId = results[0].legacy_id;
                    let short_merchant_id = results[0].short_merchant_id;
                    let url1 = "https://api-gtm.grubhub.com/merchant/" + short_merchant_id + "/orders/" + legacyId + "/status";

                    let authentication_token = results[0].token;
                    console.log(url1)
                    await axios({
                        method: 'put',
                        url: url1,
                        data: { "status": "CONFIRMED", "wait_time_in_minutes": 10, "unpause_merchant": false },
                        headers: {
                            'Accept': 'application/json',
                            'content-type': 'application/json',
                            'authorization': authentication_token,
                            'origin': 'https://restaurant.grubhub.com'
                        }
                    }).then(response => {
                        res.status(200).json(response.data)
                        console.log(response.data)
                    }).catch(err => {
                        console.log(err);
                        res.status(404).json({ "error": err });
                    })
                }
                })
            }
        }     
} catch (error) {
    res.status(500).send(error);
}
    },
getOrders: async function (req, res, next) {
    try {
        if (!req.body.userBranchRole || (req.body.userBranchRole == "undefined")) {
            return res.status(400).json(
                {
                    "status": "400",
                    "error": "user do not have permission to restaurant"
                }
            );
        }
        else {
            let userBranch = [];
            let userRole = [];
            let status = ["ready", "confirmed", "delivered"];
            if (req.query.status)
                status = req.query.status;
            for (key of req.body.userBranchRole) {
                userBranch.push(key.branchPlatformId)
                userRole.push(key.role)
            }
            let order = await db.query('select * from `order`  JOIN `Customer` ON  `order`.customer_id=Customer.id JOIN item ON `item`.order_id=`order`.id JOIN Delivery ON `order`.Delivery_id=`Delivery`.id  where `order`.status in (?) and branch_platform_id in (?)', { replacements: [status, userBranch], type: QueryTypes.SELECT });
            if (!order.length) {
                return res.status(200).json(
                    {
                        "status": "200",
                        "orders": []
                    })
            }
            else {
                let orders = [];
                for (key of order) {
                    let items = [];
                    let singleOrder = [key];
                    for (key of singleOrder) {
                        items.push({ item_id: key.item_id, item_name: key.item_name, item_price: key.price, item_quantity: key.quantity });
                    }
                    let orderObject = {
                        "order_id": order[0].order_id,
                        "sub_total": order[0].sub_total,
                        "tax": order[0].tax,
                        "total": order[0].total,
                        "branch_platform_id": order[0].branch_platform_id,
                        "customer_id": order[0].customer_id,
                        "status": order[0].status,
                        "note": order[0].note,
                        "order_time": order[0].order_recieved_time,
                        "name": order[0].name,
                        "phone": order[0].phone,
                        "address": order[0].address,
                        "item_count": items.length,
                        "items": items
                    }
                    orders.push(orderObject)
                }
                return res.status(200).json(
                    {
                        "status": "200",
                        "orders": orders
                    })
            }
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
},

getOrder: async function (req, res, next) {
    try {
        console.log(req.body);
        if (!req.query.orderId || (req.query.orderId == "undefined")) {
            return res.status(400).json(
                {
                    "status": "400",
                    "error": "missing ordeId in params"
                }
            );
        }
        else {
            const orderId = req.query.orderId;
            // query for fetching data with page number and offset
            const prodsQuery = "select * from `order`  JOIN `customer` ON  `order`.customer_id=customer.customer_id JOIN item ON `item`.order_id=`order`.order_id where `order`.`order_id`= " + `"${orderId} "` + " and `order`.`Branch_id` IN ('ce1a1d32-4053-45c5-93e5-79fde0bf0d06')"
            dbConn_sql.query(prodsQuery, function (error, results) {
                console.log(prodsQuery)
                if (error) throw error;
                if (results) {
                    let item_count = results.length;
                    let items = [];
                    for (key of results) {
                        items.push({ item_id: key.item_id, item_name: key.item_name, item_price: key.price, item_quantity: key.quantity });
                    }
                    let orderObject = {
                        "order_id": results[0].order_id,
                        "sub_total": results[0].sub_total,
                        "tax": results[0].tax,
                        "total": results[0].total,
                        "Branch_id": results[0].Branch_id,
                        "platform_id": results[0].platform_id,
                        "customer_id": results[0].customer_id,
                        "status": results[0].status,
                        "note": results[0].note,
                        "order_time": results[0].order_time,
                        "Name": results[0].Name,
                        "phone": results[0].phone,
                        "address": results[0].address,
                        "item_count": items.length,
                        "items": items
                    }
                    res.send([orderObject]);
                }

            })
        }

    }
    catch (eroor) {
        res.status(500).send(error);
    }
},
getAllOrder: async function (req, res, next) {
    try {
        console.log(req.query.page, req.query.limit);
        if (!req.query.limit || !req.query.page) {
            return res.status(400).json(
                {
                    "status": "400",
                    "error": "missing size in params"
                }
            );
        }
        else {
            let req_token = req.headers.token;
            const limit = req.query.limit;
            // page number
            const page = req.query.page;
            // calculate offset
            const offset = (page - 1) * limit;
            let totalPage;

            if (req.query.state == "confirmed") {
                const prodsQuery1 = "select * from `order`  JOIN `Customer` ON  `order`.customer_id=customer.customer_id JOIN item ON `item`.order_id=`order`.order_id  where `order`.status='delivered' "
                dbConn_sql.query(prodsQuery1, function (error, results) {
                    if (error) throw error;
                    if (results) {
                        totalPage = Math.ceil(results.length / limit);

                    }

                })
                // query for fetching data with page number and offset
                const prodsQuery = "select * from `order`  JOIN `customer` ON  `order`.customer_id=customer.customer_id JOIN item ON `item`.order_id=`order`.order_id limit " + `${limit}` + " offset " + `${offset}`
                dbConn_sql.query(prodsQuery, function (error, results) {
                    if (error) throw error;
                    if (results) {

                        res.send({
                            "currentpage": page,
                            "limit": limit,
                            "pageCount": totalPage,
                            "orders": results
                        });
                    }

                })
            }
            else if (req.query.state == "ready") {
                console.log("ready");
                const prodsQuery1 = "select * from `order`  JOIN `Customer` ON  `order`.customer_id=Customer.customer_id JOIN item ON `item`.order_id=`order`.order_id where `order`.status='ready' "
                dbConn_sql.query(prodsQuery1, function (error, results) {
                    if (error) throw error;
                    if (results) {
                        totalPage = Math.ceil(results.length / limit);

                    }

                })
                // query for fetching data with page number and offset
                const prodsQuery = "select * from `order`  JOIN `Customer` ON  `order`.customer_id=Customer.customer_id JOIN item ON `item`.order_id=`order`.order_id limit " + `${limit}` + " offset " + `${offset}`
                dbConn_sql.query(prodsQuery, function (error, results) {
                    if (error) throw error;
                    if (results) {
                        res.send({
                            "currentpage": page,
                            "limit": limit,
                            "pageCount": totalPage,
                            "orders": results
                        });
                    }

                })
            }
        }

    }
    catch (error) {
        res.status(500).send(error);


    }
},
totalOrders: async function (req, res, next) {
    try {
        if (!req.body.branch_platform_id || !req.body.role || (req.body.branch_platform_id == "undefined") || (req.body.role == "undefined")) {
            return res.status(400).json(
                {
                    "status": "400",
                    "error": "user do not have permission"
                }
            );
        }
        else if (!req.query.limit || !req.query.page || (req.query.limit == "undefined") || (req.query.page = "undefined")) {
            return res.status(400).json(
                {
                    "status": "400",
                    "error": "missing limit ofr page number in params"
                }
            );
        }
        else {
            const limit = req.query.limit;
            // page number
            const page = req.query.page;
            // calculate offset
            const offset = (page - 1) * limit;
            let totalPage;

            let prodsQuery1 = "select b.Branch_name,c.Name,o.order_id,o.total,created_date,group_concat(i.item_name) as item from `order`  o JOIN `customer` c ON  o.customer_id=c.customer_id JOIN  item i ON i.order_id=o.order_id JOIN branch b ON b.branch_id=o.branch_id group by o.order_id limit " + `${limit}` + " offset " + `${offset}`
            dbConn_sql.query(prodsQuery1, function (error, results) {
                if (error) throw error;
                if (results) {
                    totalPage = Math.ceil(results.length / limit);

                    for (key of results) {
                        let item = key.item;
                        let items = item.split(',');
                        console.log(items);
                        key.items = items
                    }
                    res.send({
                        "currentpage": page,
                        "limit": limit,
                        "pageCount": totalPage,
                        "orders": results
                    });
                }

            })
        }

    } catch (error) {
        res.status(500).send(error);
    }
},
get_customer: async function (req, res, next) {

    try {
        console.log(req);
        let id = req.params.orderid;
        await Customer.get_customer_details(id, async function (err, customer_details) {
            if (err)
                console.log(err);
            else {
                if (!customer_details) {
                    return res.status(200).json(
                        {
                            "status": "200",
                            "state": "no record found"
                        }
                    );
                }
                res.status(200).json(
                    {
                        "status": "200",
                        "state": "successfull",
                        "Customer": customer_details
                    }
                );
            }
        });
    }

    catch (error) {
        res.status(500).send(error);

    }
},
get_grubhub_orders: async function (req, res, next) {

    try {
        let id = 2;
        console.log(req);
        await Order.get_grubhub_order(id, async function (err, all_grubhub_orders) {
            if (err)
                console.log(err);
            else {
                if (all_grubhub_orders.length == 0) {
                    return res.status(200).json(
                        {
                            "status": "200",
                            "state": "no record found"
                        }
                    );
                }
                res.status(200).json(
                    {
                        "status": "200",
                        "state": "successfull",
                        "Grubhub Orders": all_grubhub_orders
                    }
                );
            }
        });
    }

    catch (error) {
        res.status(500).send(error);

    }
},

get_uber_eats_orders: async function (req, res, next) {

    try {
        let id = 1;
        await Order.get_uber_eats_order1(id, async function (err, all_uber_eats_orders) {
            if (err)
                console.log(err);
            else {
                if (all_uber_eats_orders.length == 0) {
                    return res.status(200).json(
                        {
                            "status": "200",
                            "state": "no record found"
                        }
                    );
                }
                res.json(
                    {
                        "status": "200",
                        "state": "successfull",
                        "Uber-eats Orders": all_uber_eats_orders
                    }
                );
            }
        });
    }
    catch (error) {
        console.log("upload - catch block");
        console.log(error);
        return next();

    }
},

get_items: async function (req, res, next) {

    try {
        console.log(req.body);

        if (!req.params.orderid) {
            return res.status(400).json(
                {
                    "status": "400",
                    "error": "missing orderid in params"
                }
            );
        }
        else {
            let orderid = await Number(req.params.orderid);
            console.log(req.params.orderid);
            await Item.get_items(orderid, async function (err, all_item_details) {
                if (err)
                    console.log(err);
                else {
                    if (all_item_details.length == 0) {
                        return res.status(400).json(
                            {
                                "status": "200",
                                "state": "no record found"
                            }
                        );
                    }
                    console.log(all_item_details[0]);
                    let item = new Array();
                    for (let j = 0; j < all_item_details.length; j++) {
                        item[j] = await all_item_details[j]
                    }
                    res.status(200).json(
                        {
                            "status": "200",
                            "state": "successfull",
                            "items": item
                        }
                    );
                }
            });
        }
    }
    catch (e) {
        console.log("upload - catch block");
        console.log(e);
        return next();
    }
}
}