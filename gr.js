var dbConn_mongo = require('./config/db_mongo.config');
const Branch_platform = require('./src/models/branch_platform.model');
const Customer = require('./src/models/customer.model');
const Item = require('./src/models/item.model');
const Order = require('./src/models/order.model');
const Session = require('./src/models/session.model');
const Delivery = require('./src/models/delivery.model');
const uber_id = 1;
const grubhub_id = 2;
const puppeteer = require('puppeteer');
const axios = require('axios');
var cors = require("cors");
const mysql = require('mysql');
var timestamp;
async function run() {
    try {
        let grubhub;
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'p64266426',
            database: 'mydb'
        });
        await connection.connect((err) => {
            if (err) throw err;
            console.log('Connected!');
        });
        await connection.query('SELECT * FROM branch_platform where platform_id="2"', async (err, rows) => {
            if (err) throw err;
            grubhub = await rows;
            console.log(grubhub.length)

            for (let i = 0; i < grubhub.length; i++) {
                let browser, page;
                let auth2, auth = 0, a;

                timestamp = new Date().getTime();
                browser = await puppeteer.launch({ headless: false });
                page = await browser.newPage()
                await page.goto('https://restaurant.grubhub.com/login');
                await page.waitForSelector(".gfr-textfield-text__input");
                await page.type(".gfr-textfield-text__input", grubhub[i].email);
                await page.waitForSelector('input[type="password"]', { visible: true });
                await page.type('input[type="password"]', grubhub[i].password)
                await page.click('[type="submit"]')
                await page.waitForNavigation();
                await page.setRequestInterception(true);
                await page.on('response', (async response => {
                    auth2 = await response.request().headers()
                    if (auth2.authorization && auth2.authorization != auth) {
                        console.log(auth2.authorization)
                        auth = auth2.authorization
                        let currentDate = await new Date().getTime();
                        let currentDate_plus_900seconds = await currentDate + 900000;
                        let Branch_id = await grubhub[i].Branch_id;
                        let token = await auth;
                        let values = [[token, currentDate, currentDate_plus_900seconds, '2', Branch_id]];
                        let sql = "INSERT IGNORE into session (token,token_valid_from,token_valid_to,platform_id,Branch_id) VALUES ?";

                        await connection.query(sql, [values], function (err, result) {
                            if (err) throw err;
                            console.log("Number of records inserted: " + result.affectedRows);
                        });
                        await browser.close();

                    }
                }))
                setTimeout(async function done() {
                    await connection.query('SELECT token FROM session where Branch_id="2220052"', async (err, rows) => {
                        if (err) throw err;
                        response = await rows;
                        let auth = await response[0].token;
                        let timestamp = new Date().getTime() - 300000;
                        url = "https://api-gtm.grubhub.com/merchant/2220052,2220818,2218384,2219349,2221715,2218188,2221811,2218970/orders?timestamp=" + timestamp;
                        console.log(auth)
                        console.log
                        const res = await axios.get(url, {
                            headers: {

                                'Accept': 'application/json',
                                'authorization': auth,
                                'origin': 'https://restaurant.grubhub.com'
                            }
                        }).catch(err => {
                            console.log("error in await", err);
                        })
                        data1 = await res.data;
                        if (data1) {
                            for (let key in data1) {
                                if (typeof data1[key] === 'object') {
                                    if (data1[key].orders) {
                                        grubhub_orders = await data1[key].orders;
                                        console.log([0])
                                        if (grubhub_orders.length > 0) {
                                            for (let i = 0; i < grubhub_orders.length; i++) {
                                                // console.log(grubhub_order[i].order_number);
                                                // await grubhub_order[i].token
                                                // grubhub_order[i].token = auth;
                                                // console.log(grubhub_order[i].order_number)
                                                let grubhub_order_number = await grubhub_orders[i].order_number;
                                                let grubhub_order_details = await grubhub_orders[i];
                                                let grubhub_order_data = [grubhub_order_number, grubhub_order_details];
                                                console.log(grubhub_order_details);

                                                //   await Order.create_grubhub_order(grubhub_order_data, async function (err, grubhub_jsonorder_details) {
                                                //     if (err)
                                                //         console.log(err);
                                                //     console.log(grubhub_jsonorder_details);
                                                // });

                                                await dbConn_mongo.updateOne(
                                                    { order_number: grubhub_order_number },
                                                    grubhub_order_details,
                                                    { upsert: true })
                                                let order = await dbConn_mongo.find({ order_number: grubhub_order_number })
                                                let customer_id = await grubhub_order_number;
                                                let name = await order[0]._doc.contact_info.name;
                                                let phone = await order[0]._doc.contact_info.phone;
                                                let sub_total_charges = await order[0]._doc.charges.sub_total;
                                                let total_tax = await order[0]._doc.charges.taxes.total;
                                                let total_charges = await order[0]._doc.charges.total;
                                                if (order[0]._doc.delivery.delivery_info) {
                                                    let delivery_person_name = await order[0]._doc.delivery.delivery_info.courier.name;
                                                    let delivey_person_phone = await order[0]._doc.delivery.delivery_info.courier.phone;
                                                    let delivey_person_vehicle = await order[0]._doc.delivery.delivery_info.courier.vehicle.type;
                                                    let delivery_details = [delivery_person_name, delivey_person_phone, delivey_person_vehicle, grubhub_orders[0].order_number];
                                                    await Delivery.create_grubhub_delivery(delivery_details, async function (err, delivery_details) {
                                                        if (err)
                                                            console.log(err);
                                                        console.log(delivery_details);
                                                    });
                                                }



                                                let grubhub_order = [customer_id, sub_total_charges, total_tax, total_charges, "2220052", "2", customer_id];

                                                await Order.create_grubhub_order(grubhub_order, async function (err, grubhub_order_details) {
                                                    if (err)
                                                        console.log(err);
                                                    console.log(grubhub_order_details);
                                                });


                                                let grubhub_customer = [customer_id, name, phone];

                                                await Customer.create_grubhub_customer(grubhub_customer, async function (err, grubhub_customer_details) {
                                                    if (err)
                                                        console.log(err);
                                                    console.log(grubhub_customer_details);
                                                });
                                                let length = await order[0]._doc.diners.length;
                                                for (let i = 0; i < length; i++) {
                                                    let item_id = await order[0]._doc.diners[0].lines[0].id;
                                                    let item_name = await order[0]._doc.diners[0].lines[0].name;
                                                    let item_price = await order[0]._doc.diners[0].lines[0].price;
                                                    let item_quantity = await order[0]._doc.diners[0].lines[0].quantity;
                                                    let grubhub_item = [item_id, item_name, item_price, item_quantity, grubhub_orders[0].order_number];

                                                    await Item.create_grubhub_item(grubhub_item, async function (err, grubhub_item_details) {
                                                        if (err)
                                                            console.log(err);
                                                        console.log(grubhub_item_details);
                                                    });

                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        await dbConn_mongo.find({ "brand": "GRUBHUB" })
                        let order1 = await dbConn_mongo.find({ "brand": "GRUBHUB" })
                        for(let j=0;j<order1.length;j++)
                        {
                        let customer_id = await order1[j]._doc.order_number;
                        let name = await order1[j]._doc.contact_info.name;
                        let phone = await order1[j]._doc.contact_info.phone;
                        let sub_total_charges = await order1[j]._doc.charges.sub_total;
                        let total_tax = await order1[j]._doc.charges.taxes.total;
                        let total_charges = await order1[j]._doc.charges.total;
                        if (order1[j]._doc.delivery.delivery_info) {
                            let delivery_person_name = await order1[j]._doc.delivery.delivery_info.courier.name;
                            let delivey_person_phone = await order1[j]._doc.delivery.delivery_info.courier.phone;
                            let delivey_person_vehicle = await order1[j]._doc.delivery.delivery_info.courier.vehicle.type;
                            let delivery_details = [delivery_person_name, delivey_person_phone, delivey_person_vehicle, order1[j]._doc.order_number];
                            await Delivery.create_grubhub_delivery(delivery_details, async function (err, delivery_details) {
                                if (err)
                                    console.log(err);
                                console.log(delivery_details);
                            });
                        }



                        let grubhub_order = [order1[j]._doc.order_number, sub_total_charges, total_tax, total_charges, "2220052", "2", order1[j]._doc.order_number];

                        await Order.create_grubhub_order(grubhub_order, async function (err, grubhub_order_details) {
                            if (err)
                                console.log(err);
                            console.log(grubhub_order_details);
                        });


                        let grubhub_customer = [customer_id, name, phone];

                        await Customer.create_grubhub_customer(grubhub_customer, async function (err, grubhub_customer_details) {
                            if (err)
                                console.log(err);
                            console.log(grubhub_customer_details);
                        });
                        let length = await order[0]._doc.diners.length;
                        for (let i = 0; i < length; i++) {
                            let item_id = await order1[j]._doc.diners[0].lines[0].id;
                            let item_name = await order1[j]._doc.diners[0].lines[0].name;
                            let item_price = await order1[j]._doc.diners[0].lines[0].price;
                            let item_quantity = await order1[j]._doc.diners[0].lines[0].quantity;
                            let grubhub_item = [item_id, item_name, item_price, item_quantity, order1[j]._doc.order_number];

                            await Item.create_grubhub_item(grubhub_item, async function (err, grubhub_item_details) {
                                if (err)
                                    console.log(err);
                                console.log(grubhub_item_details);
                            });

                        }
                    }


                    })

                    setTimeout(done, 10000);
                }, 60000);
                setTimeout(async function time() {
                    for (let i = 0; i < grubhub.length; i++) {
                        let browser, page;
                        let auth2, auth = 0, a;

                        timestamp = new Date().getTime();
                        browser = await puppeteer.launch({ headless: false });
                        page = await browser.newPage()
                        await page.goto('https://restaurant.grubhub.com/login');
                        await page.waitForSelector(".gfr-textfield-text__input");
                        await page.type(".gfr-textfield-text__input", grubhub[i].email);
                        await page.waitForSelector('input[type="password"]', { visible: true });
                        await page.type('input[type="password"]', grubhub[i].password)
                        await page.click('[type="submit"]')
                        await page.waitForNavigation();
                        await page.setRequestInterception(true);
                        await page.on('response', (async response => {
                            auth2 = await response.request().headers()
                            if (auth2.authorization && auth2.authorization != auth) {
                                console.log(auth2.authorization)
                                auth = auth2.authorization
                                let currentDate = await new Date().getTime();
                                let currentDate_plus_900seconds = await currentDate + 900000;
                                let Branch_id = await grubhub[i].Branch_id;
                                let token = await auth;
                                let values = token;
                                sql1 = 'UPDATE session SET token = ?  WHERE Branch_id="2220052"';

                                await connection.query(sql1, values, function (err, result) {
                                    if (err) throw err;
                                    console.log("Number of records updated: " + result.updatedRows);
                                });
                                await browser.close();
                            }
                        }))


                    }

                    setTimeout(time, 1800000);
                }, 30000)
            }
        });
    }
    catch (error) {
        console.log(' -> somethign in run went wrong !', error);
    }
}
run();
