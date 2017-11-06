// ---------------------------------------------------------------
// include gulp and plugins
// ---------------------------------------------------------------
var gulp = require('gulp');

var assets = require('postcss-assets');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var cssnano = require('cssnano');
var del = require('del');
var deporder = require('gulp-deporder');
var imagemin = require('gulp-imagemin');
var mqpacker = require('css-mqpacker');
var newer = require('gulp-newer');
var nodemon = require('gulp-nodemon');
var postcss = require('gulp-postcss');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var stripdebug = require('gulp-strip-debug');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('tsconfig.json');
var uglify = require('gulp-uglify');
var zip = require('gulp-zip');

// ---------------------------------------------------------------
// variables
// ---------------------------------------------------------------
var devBuild = (process.env.NODE_ENV !== 'production');
var dir = {
    src: 'client/src/',
    get src_scripts() {
        return this.src + 'scripts/';
    },
    get src_styles() {
        return this.src + 'styles/';
    },
    dist: 'client/dist/',
    get dist_scripts() {
        return this.dist + 'scripts/';
    },
    get dist_styles() {
        return this.dist + 'styles/';
    }
};

var file = {
    jquery_scripts: 'node_modules/jquery/dist/jquery.js',
    bootstrap_scripts: 'node_modules/bootstrap/dist/js/bootstrap.js',
    bootstrap_styles: 'node_modules/bootstrap/dist/css/bootstrap.css',
    js_scripts: dir.src + 'scripts/**/*.js',
    ts_scripts: dir.src + 'scripts/**/*.ts',
    ts_scripts_outfile: 'scripts-ts.js',
    scripts_file: 'scripts.js',
    css_styles: dir.src + 'styles/**/*.css',
    scss_styles: dir.src + 'styles/**/*.scss',
    styles_file: 'styles.css'
};

// ---------------------------------------------------------------
// tasks - DEFAULT
// ---------------------------------------------------------------
gulp.task('default', ['copy', 'images', 'styles', 'scripts', 'browser-sync'], function() {
    gulp.watch([
        'app.js',
        'client/src/**/*',
        'server/**/*'
    ], browserSync.reload);
});

// ---------------------------------------------------------------
// tasks - ARCHIVE
// ---------------------------------------------------------------
gulp.task('archive', function() {
    return gulp.src(['./**/*.*', '!./node_modules/**'], { base: './', dot: true })
        .pipe(zip('_archive.zip'))
        .pipe(gulp.dest('./'));
});

// ---------------------------------------------------------------
// tasks - BROWSERSYNC
// ---------------------------------------------------------------
gulp.task('browser-sync', ['nodemon'], function() {
    return browserSync({
        proxy: "localhost:3000", // local node app address
        port: 3001, // use *different* port than above
        notify: true
    });
});

// ---------------------------------------------------------------
// tasks - BUILD
// ---------------------------------------------------------------
gulp.task('build', ['copy', 'images', 'styles', 'scripts']);

// ---------------------------------------------------------------
// tasks - CLEAN
// ---------------------------------------------------------------
gulp.task('clean', function() {
    return del([
        'client/dist'
    ]);
});

// ---------------------------------------------------------------
// tasks - COPY
// ---------------------------------------------------------------
gulp.task('copy', function() {
    gulp.src([
        dir.src + '*.*'
    ], {
        "base": dir.src
    })
    .pipe(gulp.dest(dir.dist))
    .pipe(browserSync.stream());
});

// ---------------------------------------------------------------
// tasks - IMAGES
// ---------------------------------------------------------------
gulp.task('images', function() {
    var out = dir.dist + 'images';
    return gulp.src(dir.src + 'images/**/*')
        .pipe(newer(out))
        .pipe(imagemin({ optimizationLevel: 5 }))
        .pipe(gulp.dest(out))
        .pipe(browserSync.stream());
});

// ---------------------------------------------------------------
// tasks - NODEMON
// ---------------------------------------------------------------
gulp.task('nodemon', function(cb) {
    var called = false;

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
        .on('start', function() {
            if (!called) {
                called = true;
                cb();
            }
        })
        .on('restart', function() {
            setTimeout(function() {
                browserSync.reload({ stream: false });
                console.log('application restarted...');                
            }, 1000);
        })
        .on('crash', function() {
            console.error('application has crashed...\n');
        });
});

// ---------------------------------------------------------------
// tasks - SCRIPTS
// ---------------------------------------------------------------
gulp.task('scripts', ['scripts:js']);

gulp.task('scripts:js', ['scripts:ts'], function() {
    return gulp.src([
            file.jquery_scripts,
            file.bootstrap_scripts,
            file.js_scripts
        ])
        .pipe(uglify())
        .pipe(concat(file.scripts_file))
        .pipe(gulp.dest(dir.dist_scripts))
        .pipe(browserSync.stream());
});

gulp.task('scripts:ts', function() {
    return gulp.src(file.ts_scripts)
        .pipe(ts({
            noImplicitAny: true,
            outFile: file.ts_scripts_outfile
        }))
        .pipe(gulp.dest(dir.src_scripts));
});

// ---------------------------------------------------------------
// tasks - STYLES
// ---------------------------------------------------------------
gulp.task('styles', ['styles:css']);

gulp.task('styles:css', [], function() {
    return gulp.src([
        file.bootstrap_styles,
        file.css_styles
    ])
    .pipe(cleanCSS())
    .pipe(concat(file.styles_file))
    .pipe(gulp.dest(dir.dist_styles))
    .pipe(browserSync.stream());
});

gulp.task('styles:scss', function() {
    return gulp.src(file.scss_styles)
        // .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
        // .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        // .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest(dir.src_styles));
});