var gulp = require('gulp');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');
var newer = require('gulp-newer');
var imagemin = require('gulp-imagemin');
var concat = require('gulp-concat');
var deporder = require('gulp-deporder');
var stripdebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var assets = require('postcss-assets');
var autoprefixer = require('autoprefixer');
var mqpacker = require('css-mqpacker');
var cssnano = require('cssnano');
var del = require('del');

var devBuild = (process.env.NODE_ENV !== 'production');
var folder = {
  src: 'client/src/',
  dist: 'client/dist/'
}

gulp.task('styles:css', function() {
  var postCssOpts = [
    assets({ loadPaths: ['images'] }),
    autoprefixer({ browsers: ['last 2 versions', '> 2%'] }),
    mqpacker
  ];

  if (!devBuild) {
    postCssOpts.push(cssnano);
  }

  return gulp.src(folder.src + 'scss/**/*')
    .pipe(sass({
      outputStyle: 'nested',
      imagePath: 'images/',
      precision: 3,
      errLogToConsole: true
    }))
    .pipe(postcss(postCssOpts))
    .pipe(gulp.dest(folder.dist + 'css/'));
});

gulp.task('js', function() {
  var jsbuild = gulp.src(folder.src + 'js/**/*')
    .pipe(deporder())
    .pipe(concat('main.js'));

  if (!devBuild) {
    jsbuild = jsbuild
      .pipe(stripdebug())
      .pipe(uglify());
  }

  return jsbuild.pipe(gulp.dest(folder.dist + 'js/'));
});

gulp.task('images', function() {
  var out = folder.dist + 'images';
  return gulp.src(folder.src + 'images/**/*')
    .pipe(newer(out))
    .pipe(imagemin({ optimizationLevel: 5 }))
    .pipe(gulp.dest(out));
});

gulp.task('browser-sync', ['nodemon'], function() {
  return browserSync({
    proxy: "localhost:3000", // local node app address
    port: 3001, // use *different* port than above
    notify: true
  })
});

gulp.task('nodemon', function() {
  return nodemon({
    script: './server/bin/www',
    ignore: [
      'node_modules/',
      'gulpfile.js'
    ],
    tasks: [
      // 'process-something'
    ]
  })
  .on('restart', function() {
    console.log('application restarted...');
  })
  .on('crash', function() {
    console.error('Application has crashed...\n')
    stream.emit('restart', 10);  // restart the server in 10 seconds
  })   
});

gulp.task('default', ['run', 'browser-sync'], function() {  
  gulp.watch([
    'app.js',
    'client/src/**/*',
    'server/**/*'
  ], browserSync.reload);
  gulp.watch(folder.src + 'images/**/*', ['images'], browserSync.reload);
  gulp.watch(folder.src + 'scripts/**/*', ['scripts'], browserSync.reload);
  gulp.watch(folder.src + 'styles/**/*', ['styles'], browserSync.reload);
});

gulp.task('favicon', function() {
  gulp.src(folder.src + 'favicon.ico')
    .pipe(gulp.dest(folder.dist));
});

gulp.task('copy:src:root', function() {
  return gulp.src(folder.src + '*.*')
    .pipe(gulp.dest(folder.dist));
});

gulp.task('copy:src:css', function() {
  return gulp.src(folder.src + 'css/**/*')
    .pipe(gulp.dest(folder.dist + 'css'));
});

gulp.task('copy:src:images', function() {
  return gulp.src(folder.src + 'images/**/*')
    .pipe(gulp.dest(folder.dist + 'images'));
});

gulp.task('copy:src:js', function() {
  return gulp.src(folder.src + 'js/**/*')
  .pipe(gulp.dest(folder.dist + 'js'));
});

gulp.task('clean:dist', function() {
  return del([
    'client/dist'
  ]);
});

gulp.task('build:dist', [
  'copy:src:root',
  'copy:src:css',
  'copy:src:images',
  'copy:src:js',
  'css',
  'js',
  'images'
]);

gulp.task('js-smash', function() {
  gulp.src([
    'node_modules/jquery/dist/jquery.js',
    'node_modules/bootstrap/dist/js/bootstrap.js'
  ])
  .pipe(uglify())
  .pipe(concat('vendor.js'))
  .pipe(gulp.dest(folder.dist + 'js'));
});

gulp.task('css-smash', function() {
  gulp.src([
    'node_modules/bootstrap/dist/css/bootstrap.css'
  ])
  .pipe(uglify())
  .pipe(concat('vendor.js'))
  .pipe(gulp.dest(folder.dist + 'js'));
});

gulp.task('run', ['css', 'js']);
