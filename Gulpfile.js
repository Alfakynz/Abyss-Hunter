'use strict';

var gulp = require('gulp');
var path = require('path');
var swPrecache = require('sw-precache');

gulp.task('generate-service-worker', function(callback) {
  var rootDir = 'views';
  swPrecache.write(path.join(rootDir, 'sw.js'), {
    staticFileGlobs: [
      rootDir + '/**/*.{js,html,css,scss,png,jpg,gif,ejs}',
    ],
    stripPrefix: rootDir,
    navigateFallback: '/',
    runtimeCaching: [{
      urlPattern: /\/planet/,
      handler: 'cacheFirst'
    }],
    verbose: true
  }, function(error) {
    if (error) {
      console.error('Erreur lors de la génération du Service Worker:', error);
    } else {
      console.log('Service Worker généré avec succès.');
    }
    callback(error);
  });
});

