// const express = require('express');
require('../../app');
const dbConn_sql = require('../../config/db_sql.config');
const Order = require('../models/order.model');
const Customer = require('../models/customer.model');

const Item = require('../models/item.model');
const userService = require('../services/user.services');
const Branch_platform = require('../models/branch_platform.model');
const User = require('../models/user.model');
const axios = require('axios');

module.exports = {

    authenticate: async function (req, res, next) {
        try{
            console.log(req.body);
            const token= await userService.authenticate(req.body)
            await Branch_platform.update_token(token, async function (err, token) {
                if (err)
                    console.log(err);
                    else
                    console.log(token)
            })


            res.json(token);

        }
      catch (error) {
          console.log(error)
        return next();
      }
    },
    login: async function (req, res, next) {
        try{
            console.log("kk",req.body);
            console.log(req.headers);
            const token= await userService.authenticate(req.body)
            console.log("contoller",token);
            const auth_details=req.body;
             auth_details.token1=token;
            await User.login(auth_details, async function (err, auth_details) {
                if (err)
                    console.log(err);
                    else
                    {
                        console.log(auth_details)

                        // await User.update_token(token, async function (err, token) {
                        //     if (err)
                        //         console.log(err);
                        //         else
                        //         console.log(token)
                        // })
                    }
            })




            res.json(token);

        }
      catch (error) {
          console.log(error)
        return next();
      }
    },
    ready: async function (req, res, next) {
        try {
            if (!req.query.orderId || (req.query.orderId=="undefined")) {
                return res.status(400).json(
                    {
                        "status": "400",
                        "error": "missing ordeId in params"
                    }
                );
            }
            else{
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
            console.log(error);
        }
    },
    confirm: async function (req, res, next) {
        try {
            if (!req.query.orderId || (req.query.orderId=="undefined")) {
                return res.status(400).json(
                    {
                        "status": "400",
                        "error": "missing ordeId in params"
                    }
                );
            }
            else{
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
        } catch (error) {
            console.log(error);
        }
    },

    getOrder: async function (req, res, next) {
        try {
            if (!req.query.orderId || (req.query.orderId=="undefined")) {
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
                const prodsQuery = "select * from `order`  JOIN `customer` ON  `order`.customer_id=customer.customer_id JOIN item ON `item`.order_id=`order`.order_id where `order`.`order_id`= " + `"${orderId}"`
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
        catch (e) {
            console.log("upload - catch block");
            console.log(e);
            return next();

        }
    },
    getAllOrder: async function (req, res, next) {
        try {
            console.log(req.query.page, req.query.limit);
            if (!req.query.limit || !req.query.page  || (req.query.limit=="undefined") || (req.query.page="undefined")) {
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
                    const prodsQuery1 = "select * from `order`  JOIN `customer` ON  `order`.customer_id=customer.customer_id JOIN item ON `item`.order_id=`order`.order_id  where `order`.status='delivered' "
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
                    const prodsQuery1 = "select * from `order`  JOIN `customer` ON  `order`.customer_id=customer.customer_id JOIN item ON `item`.order_id=`order`.order_id where `order`.status='ready' "
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
            }

        }
        catch (e) {
            console.log("upload - catch block");
            console.log(e);
            return next();

        }
    },
    totalOrders: async function (req, res, next) {
        try {
            if (!req.query.limit || !req.query.page  || (req.query.limit=="undefined") || (req.query.page="undefined")) {
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

                let prodsQuery1 = "select b.Branch_name,c.Name,o.order_id,o.total,created_date,group_concat(i.item_name) as item from `order`  o JOIN `customer` c ON  o.customer_id=c.customer_id JOIN  item i ON i.order_id=o.order_id JOIN branch b ON b.branch_id=o.branch_id group by o.order_id limit "+ `${limit}` + " offset " + `${offset}`
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
            console.log(error);
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

        catch (e) {
            console.log("upload - catch block");
            console.log(e);
            return next();
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

        catch (e) {
            console.log("upload - catch block");
            console.log(e);
            return next();
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
                console.log(req.params.orderid)
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