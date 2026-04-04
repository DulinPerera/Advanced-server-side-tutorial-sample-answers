'use strict'

exports.routes = [
  { method: 'get', path: '', handler: 'index' }
];

exports.index = function(req, res){
  res.redirect('/profile');
};
