const puppeteer = require('puppeteer');
const axios = require('axios');
var dbConn_sql = require('./config/db_sql.config');
var dbConn_mongo = require('./config/db_mongo.config');
const Branch_platform = require('./src/models/branch_platform.model');
const Customer = require('./src/models/customer.model');
const Item = require('./src/models/item.model');
const Order = require('./src/models/order.model');
const Session = require('./src/models/session.model');
const uber_id = 1;
const grubhub_id = 2;
const mysql = require('mysql');

// async function mysqlconnection() {
//     const connection = await mysql.createConnection({
//         host: 'localhost',
//         user: 'root',
//         password: 'p64266426',
//         database: 'mydb'
//     });
//     await connection.connect((err) => {
//         if (err) throw err;
//         console.log('Connected!');
//     });
// }

var postmates = [
    { "username": "dwoksaustin@digi-prex.com", "password": "Samarth16", "place_uuid": "202d71a2-0c71-468a-9b43-07ef9f4981a8", "merchant_uuid": "96e066d9-2625-49a3-9a5e-a7d57eab2e08" },
    { "username": "gunpowderaustin@digi-prex.com", "password": "Samarth16", "place_uuid": "cf0f4397-bb0f-4b4d-af5b-c43e65006f7a", "merchant_uuid": "82b534c5-645c-4b13-933c-ca47870ed826" },
    { "username": "csresearchblvd@gkcfood.com", "password": "Samarth16!", "place_uuid": "1479d262-9a5b-4b22-a44d-44705da2fabf", "merchant_uuid": "ca4eb846-bf87-4a7b-a10c-73c6a863948a" },
    { "username": "burgershalstead@digi-prex.com", "password": "Samarth16!", "place_uuid": "73b98390-03eb-4368-9d9d-4d60c0d3ab48", "merchant_uuid": "8584aafd-111e-4b74-9343-3c69786a4a3f" },
    { "username": "sandwichhalstead@digi-prex.com", "password": "Samarth16", "place_uuid": "9c7ded1a-970d-434a-8012-a207732e5b4f", "merchant_uuid": "429c378c-e571-410b-842c-383924dc39ce" },
    { "username": "locohalstead@digi-prex.com", "password": "Samarth16!", "place_uuid": "c8e52601-8096-4313-abe9-17bef3830a1c", "merchant_uuid": "1e05817c-6720-476c-8636-7ca74e2b1c5e" },
    { "username": "pbwashington@digi-prex.com", "password": "Samarth16", "place_uuid": "a5a5495c-a0eb-4298-aaa1-4fb80daab5bd", "merchant_uuid": "0dd8f202-5be2-4d44-92aa-d3d77c760d7b" },
    { "username": "scwashington@digi-prex.com", "password": "Samarth16", "place_uuid": "25d28a15-89e8-4c44-a83b-71577260c45f", "merchant_uuid": "ae4d4c48-c2d0-48a6-8313-2cf3018b5ce1" },
    { "username": "gunpowdertenth@digi-prex.com", "password": "Samarth16", "place_uuid": "9ed34e70-56e3-442a-ad47-89f48ece2246", "merchant_uuid": "7d64466a-6060-4d0a-99d5-f41ecedafccb" },
    { "username": "gunpowderclinton@digi-prex.com", "password": "Samarth16", "place_uuid": "dfdab49a-7b51-4b3e-a9a1-9cbd4efd392a", "merchant_uuid": "d691667a-0765-4784-89e1-c907b21b8455" },
    { "username": "tclinton@digi-prex.com", "password": "mughlai123", "place_uuid": "68c423f8-88be-49cd-9647-cb994185ee08", "merchant_uuid": "854c91fc-1347-4ea2-ad5f-5e4fc4c70a7b" },
    { "username": "vfactoryclintonst@gkcfood.com", "password": "postmates123", "place_uuid": "0fe69d0a-4e86-4d7d-bc71-e0ad71a0cfa5", "merchant_uuid": "a5227de5-2dd7-4302-91e2-9926a1b65eef" },
    { "username": "rwhwashington@digi-prex.com", "password": "Samarth16", "place_uuid": "88b92850-2908-484c-9ca9-76f2c70b2ff5", "merchant_uuid": "979d6ee5-23d5-4bea-bdfe-02bbd979b62c" },
];
async function get_Branch_details() {
    try {
        let grubhub;
        await Branch_platform.find_grubhub_credentials(grubhub_id, async function (err, grubhub_branch_details) {
            if (err)
                console.log(err);
             grubhub = await grubhub_branch_details;
        })
        // return grubhub;

    }
    catch (e) {
        console.log(e);
    }
}
// get_Branch_details();
// async function get_token() {
//     try {
//         await page.on('response', (async response => {
//             auth2 = await response.request().headers()
//         }))
//     }
//     catch (e) {
//         console.log(e);
//     }
// }

setTimeout(async function run() {
    // await mysqlconnection();
    var grubhub1 = await get_Branch_details();
    var c= grubhub1.length();
    console.log(c);
    // for (let i = 0; i < grubhub.length; i++) {
    //     try {
    //         let browser = await puppeteer.launch({ headless: false });
    //         page = await browser.newPage();
    //         await page.goto('https://restaurant.grubhub.com/login');
    //         await page.waitForSelector(".gfr-textfield-text__input");
    //         await page.type(".gfr-textfield-text__input", grubhub[i].email);
    //         await page.waitForSelector('input[type="password"]', { visible: true });
    //         await page.type('input[type="password"]', grubhub[i].password)
    //         await page.click('[type="submit"]')
    //         await page.waitForNavigation({ timeout: 100000 });
            // await get_token(page);
            // await store_token();
           

            //         await getOrders(page, postmates[i]);
            //         await browser.close();
                // }
                // catch (e) {
                //     console.log(e);
                // }
            // }
        },1000);

async function getOrders(page, postmate) {
            try {
                let cookies = await page.cookies();
                let cookie = cookies.map(item => `${item.name}=${item.value}`).join('; ');
                let transport = axios.create({ withCredentials: true });
                let url = "https://partner.postmates.com/v1/partner/deliveries?page=1&place_uuid=" + postmate.place_uuid + "&start_date=2021-01-01&end_date=2021-01-20&merchant_uuid=" + postmate.merchant_uuid;
                let orders = await transport.get(url, {
                    headers: {
                        'accept': '*/*',
                        'x-requested-with': 'XMLHttpRequest',
                        'cookie': cookie
                    }
                })
                await storeOrders(orders, postmate);
            }
            catch (e) {
                console.log(e);
            }
        }
        async function storeOrders(order, postmate) {
            try {
                let order_data = order.data.jobs;
                if (order_data.length) {
                    for (let i = 0; i < order_data.length; i++) {
                        await order_data[i].email;
                        await order_data[i].email;
                        await order_data[i].no_of_orders;
                        order_data[i].email = postmate.username;
                        order_data[i].password = postmate.password;
                        if (i == 0)
                            order_data[i].no_of_orders = order_data.length;
                        await Order.updateOne(
                            { uuid: order_data[i].uuid },
                            order_data[i],
                            { upsert: true })
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
        }

        // run();


// var postmates = [
//     { "username": "dwoksaustin@digi-prex.com", "password": "Samarth16", "place_uuid": "202d71a2-0c71-468a-9b43-07ef9f4981a8", "merchant_uuid": "96e066d9-2625-49a3-9a5e-a7d57eab2e08" },
//     { "username": "gunpowderaustin@digi-prex.com", "password": "Samarth16", "place_uuid": "cf0f4397-bb0f-4b4d-af5b-c43e65006f7a", "merchant_uuid": "82b534c5-645c-4b13-933c-ca47870ed826" },
//     { "username": "csresearchblvd@gkcfood.com", "password": "Samarth16!", "place_uuid": "1479d262-9a5b-4b22-a44d-44705da2fabf", "merchant_uuid": "ca4eb846-bf87-4a7b-a10c-73c6a863948a" },
//     { "username": "burgershalstead@digi-prex.com", "password": "Samarth16!", "place_uuid": "73b98390-03eb-4368-9d9d-4d60c0d3ab48", "merchant_uuid": "8584aafd-111e-4b74-9343-3c69786a4a3f" },
//     { "username": "sandwichhalstead@digi-prex.com", "password": "Samarth16", "place_uuid": "9c7ded1a-970d-434a-8012-a207732e5b4f", "merchant_uuid": "429c378c-e571-410b-842c-383924dc39ce" },
//     { "username": "locohalstead@digi-prex.com", "password": "Samarth16!", "place_uuid": "c8e52601-8096-4313-abe9-17bef3830a1c", "merchant_uuid": "1e05817c-6720-476c-8636-7ca74e2b1c5e" },
//     { "username": "pbwashington@digi-prex.com", "password": "Samarth16", "place_uuid": "a5a5495c-a0eb-4298-aaa1-4fb80daab5bd", "merchant_uuid": "0dd8f202-5be2-4d44-92aa-d3d77c760d7b" },
//     { "username": "scwashington@digi-prex.com", "password": "Samarth16", "place_uuid": "25d28a15-89e8-4c44-a83b-71577260c45f", "merchant_uuid": "ae4d4c48-c2d0-48a6-8313-2cf3018b5ce1" },
//     { "username": "gunpowdertenth@digi-prex.com", "password": "Samarth16", "place_uuid": "9ed34e70-56e3-442a-ad47-89f48ece2246", "merchant_uuid": "7d64466a-6060-4d0a-99d5-f41ecedafccb" },
//     { "username": "gunpowderclinton@digi-prex.com", "password": "Samarth16", "place_uuid": "dfdab49a-7b51-4b3e-a9a1-9cbd4efd392a", "merchant_uuid": "d691667a-0765-4784-89e1-c907b21b8455" },
//     { "username": "tclinton@digi-prex.com", "password": "mughlai123", "place_uuid": "68c423f8-88be-49cd-9647-cb994185ee08", "merchant_uuid": "854c91fc-1347-4ea2-ad5f-5e4fc4c70a7b" },
//     { "username": "vfactoryclintonst@gkcfood.com", "password": "postmates123", "place_uuid": "0fe69d0a-4e86-4d7d-bc71-e0ad71a0cfa5", "merchant_uuid": "a5227de5-2dd7-4302-91e2-9926a1b65eef" },
//     { "username": "rwhwashington@digi-prex.com", "password": "Samarth16", "place_uuid": "88b92850-2908-484c-9ca9-76f2c70b2ff5", "merchant_uuid": "979d6ee5-23d5-4bea-bdfe-02bbd979b62c" },
// ];

// async function run() {
//     for (let i = 0; i < postmates.length; i++) {
//         try {
//             let browser = await puppeteer.launch({ headless: false });
//             page = await browser.newPage();
//             page = await browser.newPage();
//             page.goto('https://postmates.com/partner/login');
//             await page.waitForNavigation({ timeout: 100000 });
//             await page.type('input[name="email"]', postmates[i].username);
//             await page.type('input[name="password"]', postmates[i].password);
//             // TODO: Chnage approach to click enter
//             await page.click('.content');
//             await page.waitForNavigation({ timeout: 100000 });
//             await getOrders(page, postmates[i]);
//             await browser.close();
//         }
//         catch (e) {
//             console.log(e);
//         }
//     }
// }

// async function getOrders(page, postmate) {
//     try {
//         let cookies = await page.cookies();
//         let cookie = cookies.map(item => `${item.name}=${item.value}`).join('; ');
//         let transport = axios.create({ withCredentials: true });
//         let url = "https://partner.postmates.com/v1/partner/deliveries?page=1&place_uuid=" + postmate.place_uuid + "&start_date=2021-01-01&end_date=2021-01-20&merchant_uuid=" + postmate.merchant_uuid;
//         let orders = await transport.get(url, {
//             headers: {
//                 'accept': '*/*',
//                 'x-requested-with': 'XMLHttpRequest',
//                 'cookie': cookie
//             }
//         })
//         await storeOrders(orders, postmate);
//     }
//     catch (e) {
//         console.log(e);
//     }
// }
// async function storeOrders(order, postmate) {
//     try {
//         let order_data = order.data.jobs;
//         if (order_data.length) {
//             for (let i = 0; i < order_data.length; i++) {
//                 await order_data[i].email;
//                 await order_data[i].email;
//                 await order_data[i].no_of_orders;
//                 order_data[i].email = postmate.username;
//                 order_data[i].password = postmate.password;
//                 if (i == 0)
//                     order_data[i].no_of_orders = order_data.length;
//                 await Order.updateOne(
//                     { uuid: order_data[i].uuid },
//                     order_data[i],
//                     { upsert: true })
//             }
//         }
//     }
//     catch (e) {
//         console.log(e);
//     }
// }

// run();
