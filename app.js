// app.js
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const jwt = require('./lib/jwt');
const errorHandler = require('./lib/error-handler');
const config = require('./config.json');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
// use JWT auth to secure the api
app.use(jwt());

// global error handler
app.use(errorHandler);

// Set up mongoose connection
let mongoDB = process.env.MONGODB_URI || config.connectionString;
mongoose.connect(mongoDB, { 
	useCreateIndex: true,
	useNewUrlParser: true,
	useFindAndModify: false
});
mongoose.Promise = global.Promise;
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Imports routes
const employer = require('./employer/employer.controller'); 

app.use(
  cors()
); 
app.options("*", cors()); // include before other routes


// routes
app.use('/employers', employer);


// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
const server = app.listen(port, function () {
    console.log('Server listening on port ' + port);
});