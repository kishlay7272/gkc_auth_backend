const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const port =  5000;

var uploadRouter = require('./src/routes/routes');
// app.use(fileUpload());

app.use('/', uploadRouter);
app.listen(port);

