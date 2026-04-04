'use strict'

/**
 * Module dependencies.
 */

var express = require('express');
var fs = require('node:fs');
var path = require('node:path');

module.exports = function (parent, options) {
  var dir = path.join(__dirname, '..', 'controllers');
  var verbose = options.verbose;
  fs.readdirSync(dir).forEach(function (name) {
    var file = path.join(dir, name)
    if (!fs.statSync(file).isDirectory()) return;
    verbose && console.log('\n   %s:', name);
    var obj = require(file);
    var name = obj.name || name;
    var prefix = obj.prefix || '';
    var app = express();
    var handler;
    var method;
    var url;

    // allow specifying the view engine
    if (obj.engine) app.set('view engine', obj.engine);
    app.set('views', path.join(__dirname, '..', 'controllers', name, 'views'));

    // generate routes based
    // on the exported methods
    for (var key in obj) {
      // "reserved" exports
      if (~['name', 'prefix', 'engine', 'before', 'routes'].indexOf(key)) continue;
      // route exports
      switch (key) {
        case 'show':
          method = 'get';
          url = '/' + name + '/:' + name + '_id';
          break;
        case 'list':
          method = 'get';
          url = '/' + name + 's';
          break;
        case 'edit':
          method = 'get';
          url = '/' + name + '/:' + name + '_id/edit';
          break;
        case 'update':
          method = 'put';
          url = '/' + name + '/:' + name + '_id';
          break;
        case 'create':
          method = 'post';
          url = '/' + name;
          break;
        case 'index':
          method = 'get';
          url = '/';
          break;
        default:
          continue;
      }

      // setup
      handler = obj[key];
      url = prefix + url;

      // before middleware support
      if (obj.before) {
        app[method](url, obj.before, handler);
        verbose && console.log('     %s %s -> before -> %s', method.toUpperCase(), url, key);
      } else {
        app[method](url, handler);
        verbose && console.log('     %s %s -> %s', method.toUpperCase(), url, key);
      }
    }

    // handle custom routes
    if (obj.routes && Array.isArray(obj.routes)) {
      obj.routes.forEach(function (route) {
        var method = route.method.toLowerCase();
        var url = prefix + route.path;
        var handler = obj[route.handler];

        if (obj.before) {
          app[method](url, obj.before, handler);
          verbose && console.log('     %s %s -> before -> %s', method.toUpperCase(), url, route.handler);
        } else {
          app[method](url, handler);
          verbose && console.log('     %s %s -> %s', method.toUpperCase(), url, route.handler);
        }
      });
    }

    // mount the app
    parent.use(app);
  });
};
