var bodyParser      = require('body-parser');
var methodOverride  = require('method-override');
var morgan          = require('morgan');
var helmet          = require('helmet');
var compression     = require('compression');
var path            = require('path');
var favicon         = require("serve-favicon");

module.exports = function(app) {
    app.use(favicon(path.join(__dirname, 'favicon.ico')));
    
    app.use(morgan('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(methodOverride('X-HTTP-Method-Override'));
    /* Helmet is actually just a collection of nine smaller middleware functions that set security-related HTTP headers */
    app.use(helmet());
    /* Gzip compressing can greatly decrease the size of the response body and hence increase the speed of a web app */
    app.use(compression());
};