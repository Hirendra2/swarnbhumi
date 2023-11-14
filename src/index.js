const express = require ('express');
const routes = require('./route/route'); // import the routes
var bodyParser = require('body-parser');
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use('/', routes); //to use the routes

const path = require('path');
const helmet =  require('helmet');

const appVersion = '1.0.3'; // Change this to your actual application version
app.get('/getAppVersion', (req, res) => {
    res.status(200).send({status: true, version: appVersion });
  });

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use('/images', express.static('./images'));



const listener = app.listen(3457, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})