// var dbConn_sql = require('./config/db_sql.config');
// var dbConn_sqlg = require('./config/db_sql1.config');
var dbConn_mongo = require('./config/db_mongo.config');
const Branch_platform = require('./src/models/branch_platform.model');
const Customer = require('./src/models/customer.model');
const Item = require('./src/models/item.model');
const Order = require('./src/models/order.model');
const Session = require('./src/models/session.model');
const uber_id = 1;
const grubhub_id = 2;
const puppeteer = require('puppeteer');
const axios = require('axios');
var cors = require("cors");
async function integration() {
    await Branch_platform.find_grubhub_credentials(grubhub_id, async function (err, grubhub_branch_details) {
        if (err)
            console.log(err);
        console.log(grubhub_branch_details);
        var grubhub = await grubhub_branch_details;

        for (let i = 0; i < grubhub.length; i++) {
            let browser, url, res, data1, response, timestamp, page, auth2, auth = 0, grubhub_orders, currentDate, currentDate_plus_900seconds, Branch_id, token, values, sql, sql1, token_valid_to, token_valid_from, token_valid_till, token_validity;
                        setTimeout(async function get_token() {
                            try {
                                browser = await puppeteer.launch({ headless: false });
                                page = await browser.newPage();
                                await page.goto('https://restaurant.grubhub.com/login');
                                await page.waitForSelector(".gfr-textfield-text__input");
                                await page.type(".gfr-textfield-text__input", grubhub[i].email);
                                await page.waitForSelector('input[type="password"]', { visible: true });
                                await page.type('input[type="password"]', grubhub[i].password)
                                await page.click('[type="submit"]')
                                await page.waitForNavigation();
                                await page.setRequestInterception(true);
                                page.on('response', (async response => {
                                    auth2 = await response.request().headers()
                                    if (auth2.authorization && auth2.authorization != auth) {
                                        currentDate = await new Date().getTime();
                                        currentDate_plus_900seconds = await currentDate + 900000;
                                        Branch_id = await grubhub[i].Branch_id;
                                        token = await auth2.authorization;
                                        grubhub_authentication = [token, currentDate, currentDate_plus_900seconds, '2', Branch_id];
                                        console.log()
                                        await Session.create_grubhub_authentication(grubhub_authentication, async function (err, auth_details) {
                                            if (err)
                                                console.log(err);
                                            console.log(auth_details);
                                        });
                                        const grubhub_timestamp_update = ["2220052"];
                                        await Session.get_grubhub_timestamp_for_updation(grubhub_timestamp_update, async function (err, timestamp) {
                                            if (err)
                                                console.log(err);
                                            console.log(timestamp);
                                            token_valid_from = await Number(timestamp[0].token_valid_to);
                                            token_valid_till = await token_valid_from + 900000;
                                            updated_grubhub_auth = [auth2.authorization, token_valid_from, token_valid_till, "2220052"];
                                            // await Session.update_grubhub_authentication(updated_grubhub_auth, async function (err, updated_auth_details) {
                                            //     if (err)
                                            //         console.log(err);
                                            //     console.log(updated_auth_details);
                                            // });

                                        });
                                        console.log(auth2.authorization)
                                        auth = auth2.authorization
                                        await browser.close();
                                    }
                                }))
                            }
                            catch (error) {
                                console.log(' -> somethign in run went wrong !', error);
                            }
                            setTimeout(get_token, 900000)
                        }, 1000)




                setTimeout(async function get_order() {
                    let grubhub_Branch_id = ["2220052"];
                    await Session.get_grubhub_timestamp_for_url(grubhub_Branch_id, async function (err, url_timestamp) {
                        if (err)
                            console.log(err);
                        console.log(url_timestamp);
                        let token_validty_starts=await url_timestamp[0].token_valid_from;
                        url = "https://api-gtm.grubhub.com/merchant/2220052,2220818,2218384,2219349,2221715,2218188,2221811,2218970/orders?timestamp=" + token_validty_starts;
                        console.log(url);
                        res = await axios.get(url, {
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
                                                  let grubhub_order_number=await grubhub_orders[i].order_number;
                                                  let grubhub_order_details=await grubhub_orders[i];
                                                  let grubhub_order_data= [grubhub_order_number, grubhub_order_details];
                                                  console.log(grubhub_order_details);

                                                //   await Order.create_grubhub_order(grubhub_order_data, async function (err, grubhub_jsonorder_details) {
                                                //     if (err)
                                                //         console.log(err);
                                                //     console.log(grubhub_jsonorder_details);
                                                // });

                                                await dbConn_mongo.updateOne(
                                                    { order_number:  grubhub_order_number},
                                                    grubhub_order_details,
                                                    { upsert: true })
                                                let order = await dbConn_mongo.find({ order_number: grubhub_order_number})
                                                let customer_id = await grubhub_order_number;
                                                let name = await order[0]._doc.contact_info.name;
                                                let phone = await order[0]._doc.contact_info.phone;
                                                let sub_total_charges = await order[0]._doc.charges.sub_total;
                                                let total_tax = await order[0]._doc.charges.taxes.total;
                                                let total_charges = await order[0]._doc.charges.total;

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
                    })
                    setTimeout(get_order, 10000);
                }, 50000)
        }
    });
    // setTimeout(async function run_uber() {

    //     await Branch_platform.find_uber_credentials(uber_id, async function (err, uber_branch_details) {
    //         if (err)
    //             console.log(err);
    //         console.log(uber_branch_details);
    //         var uber = await uber_branch_details;
    //         for (let i = 0; i < uber.length; i++) {
    //             let browser, Branch_id, values, sql, page, active_order_url, a, ts, sid, csid, transport, res, data1, cookie_string, timestamp, currentDate_plus_900seconds, currentDate, bsid, bcid, sql1;
    //             try {
    //                 Branch_id = await uber[i].Branch_id;
    //                 if (browser)
    //                     await browser.close();
    //                 browser = await puppeteer.launch({ headless: false });
    //                 page = await browser.newPage()
    //                 await page.goto('https://restaurant-dashboard.uber.com/');

    //                 await page.waitForSelector("#useridInput")
    //                 await page.type("#useridInput", uber[i].email);
    //                 await page.click('.btn.btn--arrow.btn--full')

    //                 await page.waitForNavigation({ timeout: 100000 });
    //                 await page.waitForSelector("#password");
    //                 await page.type("#password", uber[i].password);
    //                 await page.click(".btn.btn--arrow.btn--full.push--top");
    //                 await page.waitForNavigation({ timeout: 100000 });

    //                 await page.setRequestInterception(true);
    //                 page.on('request', (async interceptedRequest => {
    //                     active_order_url = await "https://restaurant-dashboard.uber.com/rt/eats/v1/stores/" + Branch_id + "/active-orders"
    //                     transport = axios.create({ withCredentials: true });
    //                     a = await page.cookies();
    //                     currentDate = await new Date().getTime();
    //                     currentDate_plus_900seconds = await currentDate + 900000;
    //                     sid = await a.find(o => o.name === 'sid');
    //                     csid = await a.find(o => o.name === 'csid');
    //                     cookie_string = await "sid=" + sid.value + ";" + "csid=" + csid.value + ";"
    //                     console.log("Branch_id", Branch_id, cookie_string);
    //                     // if (interceptedRequest.url()) {
    //                     //     currentDate = await new Date().getTime();
    //                     //     currentDate_plus_900seconds = await currentDate + 900000;
    //                     //     values = [[sid.value, csid.value, currentDate, currentDate_plus_900seconds, currentDate, currentDate_plus_900seconds, "1", Branch_id]];
    //                     //     sql = "INSERT IGNORE into session (sid,cid,sid_valid_from,sid_valid_to,cid_valid_from,cid_valid_to,platform_id,Branch_id) VALUES ?";
    //                     //     await connection.query(sql, [values], function (err, result) {
    //                     //         if (err) throw err;
    //                     //         console.log("Number of records inserted: " + result.affectedRows);
    //                     //     });

    //                     // }
    //                     let ubereats_authentication = [sid.value, csid.value, currentDate, currentDate_plus_900seconds, currentDate, currentDate_plus_900seconds, "1", Branch_id]
    //                     await Session.create_ubereats_authentication(ubereats_authentication, async function (err, auth_details) {
    //                         if (err)
    //                             console.log(err);
    //                         console.log(auth_details);
    //                     });
    //                     await Session.find_uber_auth(Branch_id, async function (err, uber_auth) {
    //                         if (err)
    //                             console.log(err);
    //                         console.log(uber_auth);


    //                         let ts = await uber_auth;
    //                         bsid = await ts[0].sid;
    //                         bcid = await ts[0].cid;
    //                         if (bsid != sid.value || bcid != csid.value) {
    //                             let uber_update_auth_details = [sid.value, csid.value, currentDate, currentDate_plus_900seconds, currentDate, currentDate_plus_900seconds, Branch_id]
    //                             await Session.update_uber_auth(uber_update_auth_details, async function (err, uber_auth_update) {
    //                                 if (err)
    //                                     console.log(err);
    //                                 console.log(uber_auth_update);
    //                             });
    //                         }

    //                     })
    //                     if (interceptedRequest.url()) {
    //                         res = await transport.get(active_order_url, {
    //                             headers: {
    //                                 'accept': '*/*',
    //                                 'cookie': cookie_string
    //                             }
    //                         }).catch(err => {
    //                             console.log("error in await", err);
    //                         })
    //                         data1 = await res.data.orders;
    //                         console.log("done", data1, cookie_string);
    //                         if (data1) {
    //                             if (data1.length > 0) {

    //                                 for (i = 0; i < data1.length; i++) {
    //                                     await data1[i].status;
    //                                     data1[i].status = "active";
    //                                     await Order.updateOne(
    //                                         { uuid: data1[i].restaurantOrder.uuid },
    //                                         data1[i],
    //                                         { upsert: true })
    //                                     let customer_id = await data1[i].restaurantOrder.uuid;
    //                                     let total_charges = await data1[i].restaurantOrder.checkoutInfo[3].rawValue;
    //                                     let sub_total_charges = await data1[i].restaurantOrder.checkoutInfo[0].rawValue;
    //                                     let total_tax = await data1[i].restaurantOrder.checkoutInfo[1].rawValue;
    //                                     let order_values = [[customer_id, sub_total_charges, total_tax, total_charges, Branch_id, "1", customer_id]];
    //                                     let uber_order = [customer_id, sub_total_charges, total_tax, total_charges, Branch_id, "1", customer_id];

    //                                     await Order.create_uber_order(uber_order, async function (err, uber_order_details) {
    //                                         if (err)
    //                                             console.log(err);
    //                                         console.log(uber_order_details);
    //                                     });
    //                                     let name1 = await data1[i].restaurantOrder.customerInfos[0].firstName;
    //                                     let phone = await data1[i].restaurantOrder.customerInfos[0].phone;

    //                                     let uber_customer_values = [customer_id, name1, phone];
    //                                     await Customer.create_uber_customer(uber_customer_values, async function (err, uber_customer_details) {
    //                                         if (err)
    //                                             console.log(err);
    //                                         console.log(uber_customer_details);
    //                                         console.log("Number of records inserted: " + uber_customer_details.affectedRows);
    //                                     });
    //                                     let length = await data1[i].restaurantOrder.items.length;
    //                                     for (let i = 0; i < length; i++) {
    //                                         let item_id = await data1[i].restaurantOrder.items[0].uuid;
    //                                         let item_name = await data1[i].restaurantOrder.items[0].title;
    //                                         let item_price = await Number(data1[i].restaurantOrder.items[0].price);
    //                                         let item_quantity = await data1[i].restaurantOrder.items[0].quantity;
    //                                         let uber_item_values = [item_id, item_name, item_price, item_quantity, data1[i].restaurantOrder.uuid];
    //                                         await Item.create_uber_item(uber_item_values, async function (err, uber_item_details) {
    //                                             if (err)
    //                                                 console.log(err);
    //                                             console.log(uber_item_details);
    //                                             console.log("Number of records inserted: " + uber_item_details.affectedRows);
    //                                         });
    //                                     }
    //                                 }
    //                             }
    //                         }
    //                     }


    //                 }))
    //             }
    //             catch (error) {
    //                 console.log(' -> somethign in run went wrong !', error);
    //             }
    //         }
    //     });
    //     setTimeout(run_uber, 1800000);
    // }, 0)
//     const postmates = [{ "username": "vfactoryclintonst@gkcfood.com", "password": "postmates123" }]
// const doordash = [{ "username": "gunpowderaustin@digi-prex.com", "password": "Samarth16" }]
// for (let i = 0; i < 1; i++) {
//     setTimeout(async function run_postmates() {
//         try {
//             let browser, page, auth2, auth = 0, a;
//             timestamp = new Date().getTime();
//             browser = await puppeteer.launch({ headless: false });
//             page = await browser.newPage()
//             page.goto('https://postmates.com/partner/login');
//             await page.waitForNavigation({ timeout: 100000 });
//             await page.type('input[name="email"]', postmates[i].username);
//             await page.type('input[name="password"]', postmates[i].password)
//             await page.click('.content');
//             await page.waitForNavigation({ timeout: 100000 });
//             await page.setRequestInterception(true);
//             page.on('request', (async interceptedRequest => {
//                 if (interceptedRequest.url()) {
//                     if (interceptedRequest.postData()) {
//                         let method = await interceptedRequest.method();
//                         let cookie = await page.cookies();
//                         let url = await interceptedRequest.url();
//                         let req_header = await interceptedRequest.headers();
//                         let response = "ok";
//                         let post_data = await interceptedRequest.postData();
//                         await dbConn_mongo.updateOne(
//                             { "url": url },
//                             { "url": url, "method": method, "cookies": cookie, "req_header": req_header, "response": response, "post_data": post_data, "restraunt": postmates[i].username },
//                             { upsert: true })
//                         console.log('test');
//                     }
//                     else {
//                         let method = await interceptedRequest.method();
//                         let cookie = await page.cookies();
//                         if (cookie) {
//                             let result = cookie.map(a => a.value);
//                             let result1 = cookie.map(a => a.name);
//                             var str = ""
//                             for (let i = 0; i < result.length; i++) {
//                                 str = str + result1[i] + "=" + result[i] + ";" + " "
//                             }
//                             console.log(str);
//                             transport = axios.create({ withCredentials: true });
//                             let url = "https://partner.postmates.com/v1/partner/deliveries?page=1&place_uuid=0fe69d0a-4e86-4d7d-bc71-e0ad71a0cfa5&start_date=2021-01-05&end_date=2021-01-13&merchant_uuid=a5227de5-2dd7-4302-91e2-9926a1b65eef"
//                             res = await transport.get(url, {
//                                 headers: {
//                                     'accept': '*/*',
//                                     'x-requested-with': 'XMLHttpRequest',
//                                     'cookie': str
//                                 }
//                             }).catch(err => {
//                                 console.log("error in await", err);
//                             })
//                             data1 = await res.data;
//                             console.log(data1);
//                         }
//                         let url = await interceptedRequest.url();
//                         let req_header = await interceptedRequest.headers();
//                         let response = "ok";
//                         await dbConn_mongo.updateOne(
//                             { "url": url },
//                             { "url": url, "method": method, "cookies": cookie, "req_header": req_header, "response": response, "restraunt": postmates[i].username },
//                             { upsert: true })
//                         console.log('test');
//                     }
//                 }
//                 interceptedRequest.continue();
//             }));
//             page.on('response', (async interceptedResponse => {
//                 if (interceptedResponse.request().url()) {
//                     let url = await interceptedResponse.request().url();
//                     let response = "ok"
//                     let res_headers = await interceptedResponse.headers()
//                     await dbConn_mongo.updateOne(
//                         { "url": url },
//                         { "response": response, "res_headers": res_headers },
//                         { upsert: true })
//                     console.log('test2');
//                 }

//             }));
//         }
//         catch (error) {
//             console.log(' -> somethign in run went wrong !', error);
//         }
//         setTimeout(run_postmates, 600000)
//     }, 1000)
//     setTimeout(async function run_doordash() {
//         try {
//             let page, browser, res;
//             timestamp = new Date().getTime();
//             browser = await puppeteer.launch({ headless: false });
//             page = await browser.newPage()
//             page.goto('https://identity.doordash.com/auth?client_id=1643580605860775164&redirect_uri=https%3A%2F%2Fmerchant-portal.doordash.com%2Fauth_callback&scope=*&prompt=none&response_type=code&layout=merchant_web_v2&state=f17797cb-4aa8-45b7-8ee6-aee82811a437&allowRedirect=true&failureRedirect=%2Fmerchant%2Flogin');
//             await page.waitForNavigation({ timeout: 100000 });
//             await page.waitForSelector(".sc-krDsej.kSJlec")
//             await page.type('.sc-krDsej.kSJlec', doordash[i].username);
//             await page.waitForSelector("#FieldWrapper-3")
//             await page.type('#FieldWrapper-3', doordash[i].password)
//             await page.click('.sc-gZMcBi.htNBbC');
//             await page.waitForNavigation({ timeout: 100000 });
//             await page.goto('https://merchant-portal.doordash.com/merchant/deliveries/list?store_id=863701');
//             await page.setRequestInterception(true);
//             page.on('request', (async interceptedRequest => {
//                 if (interceptedRequest.url()) {

//                     if (interceptedRequest.postData()) {
//                         let method = await interceptedRequest.method();
//                         let cookie = await page.cookies();
//                         let url = await interceptedRequest.url();
//                         let req_header = await interceptedRequest.headers();
//                         let response = "ok";
//                         let post_data = await interceptedRequest.postData();
//                         await dbConn_mongo.updateOne(
//                             { "url": url },
//                             { "url": url, "method": method, "cookies": cookie, "req_header": req_header, "response": response, "post_data": post_data, "restraunt": doordash[i].username },
//                             { upsert: true })
//                         console.log('test');
//                     }
//                     else {
//                         let method = await interceptedRequest.method();
//                         let cookie = await page.cookies();
//                         if (cookie) {
//                             let result = cookie.map(a => a.value);
//                             let result1 = cookie.map(a => a.name);
//                             var str = ""
//                             for (let i = 0; i < result.length; i++) {
//                                 str = str + result1[i] + "=" + result[i] + ";" + " "
//                             }
//                             console.log(str);
//                             transport = axios.create({ withCredentials: true });
//                             let url = "https://merchant-portal.doordash.com/api/v1/stores/863701/deliveries/analytics/?active_date%5Bgte%5D=2021-01-01&active_date%5Blte%5D=2021-01-12&filter_by_quoted_delivery_time=true&from_partner=false&platform=marketplace&platform=storefront"
//                             res = await transport.get(url, {
//                                 headers: {
//                                     'accept': '*/*',
//                                     'cookie': str
//                                 }
//                             }).catch(err => {
//                                 console.log("error in await", err);
//                             })
//                             data1 = await res.data;
//                             console.log(data1);

//                         }
//                         let url = await interceptedRequest.url();
//                         let req_header = await interceptedRequest.headers();
//                         let response = "ok";
//                         await dbConn_mongo.updateOne(
//                             { "url": url },
//                             { "url": url, "method": method, "cookies": cookie, "req_header": req_header, "response": response, "restraunt": doordash[i].username },
//                             { upsert: true })
//                         console.log('test3');
//                     }
//                 }

//                 interceptedRequest.continue();
//             }));
//             page.on('response', (async interceptedResponse => {
//                 if (interceptedResponse.request().url()) {
//                     let url = await interceptedResponse.request().url();

//                     let response = "ok"
//                     let res_headers = await interceptedResponse.headers()
//                     await dbConn_mongo.updateOne(
//                         { "url": url },

//                         { "response": response, "res_headers": res_headers },
//                         { upsert: true })
//                     console.log('test4');
//                 }

//             }));
//         }
//         catch (error) {
//             console.log(' -> somethign in run went wrong !', error);
//         }
//         setTimeout(run_doordash, 600000)
//     }, 2000)
// }
}
integration();

