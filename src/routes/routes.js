const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));


const dbConn_sql = require('./../../config/db_sql.config');
const controller=require('../controllers/controller');




router.get('/getOrders',
    controller.getOrder
  );
  router.get('/getAllOrders',
    controller.getAllOrder
  );
  router.get('/totalOrders',controller.totalOrders);
  
  router.post('/grubhub/confirm',controller.confirm);
  router.post('/grubhub/ready',controller.ready);

  
   

router.get('/get_orders/grubhub',controller.get_grubhub_orders);
router.get('/get_orders/uber_eats',controller.get_uber_eats_orders);
router.get('/get_items/items',controller.get_items);

router.get('/get_items/:orderid',controller.get_items);
router.get('/get_customer/:orderid',controller.get_customer);
router.post('confirm',controller.confirm);

router.post('/login',controller.login);

// router.post('/get_items/auth',controller.authenticate);
// router.post('/public/user/registration',user.signup);
module.exports = router;






