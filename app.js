const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet')
const compression = require('compression')
const fileUpload = require('express-fileupload');
const cors = require('cors');
const morgan = require('morgan');
const _ = require('lodash');
const dotenv = require('dotenv');
dotenv.config();

var categoriesRouter = require('./routes/categories');
var subcategoriesRouter = require('./routes/subcategories');
var productsRouter = require('./routes/products');
var authRouter = require('./routes/auth');

var app = express();

app.use(compression());
app.use(helmet());

// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb', parameterLimit: 10 }));

app.use('/api/categories', categoriesRouter);
app.use('/api/subcategories', subcategoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.send('Page not found');
});

// error handler
app.use(function(err, req, res, next) {
  res.send(err);
});

module.exports = app;
