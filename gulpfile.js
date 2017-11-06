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
gulp.task('default', ['browser-sync']);

gulp.task('default-save-1', [], function() {
    gulp.watch([
        'app.js',
        'client/src/**/*',
        'server/**/*'
    ], browserSync.reload);
    gulp.watch(dir.src + 'images/**/*', ['images'], browserSync.reload);
    gulp.watch(dir.src + 'scripts/**/*', ['scripts'], browserSync.reload);
    gulp.watch(dir.src + 'styles/**/*', ['styles'], browserSync.reload);
});

// ---------------------------------------------------------------
// tasks - TOP LEVEL
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// tasks - ARCHIVE
// ---------------------------------------------------------------
gulp.task('build:dist', [
    'copy:src:root',
    'copy:src:css',
    'copy:src:images',
    'copy:src:js',
    'css',
    'js',
    'images'
]);

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
    .pipe(gulp.dest(dir.dist));
});

// ---------------------------------------------------------------
// tasks - IMAGES
// ---------------------------------------------------------------
gulp.task('images', function() {
    var out = dir.dist + 'images';
    return gulp.src(dir.src + 'images/**/*')
        .pipe(newer(out))
        .pipe(imagemin({ optimizationLevel: 5 }))
        .pipe(gulp.dest(out));
});

// ---------------------------------------------------------------
// tasks - NODEMON
// ---------------------------------------------------------------
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
            console.error('application has crashed...\n');
            // stream.emit('restart', 10); // restart the server in 10 seconds
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
        .pipe(gulp.dest(dir.dist_scripts));
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

// ---------------------------------------------------------------
// tasks - SANDBOX
// ---------------------------------------------------------------
gulp.task('test-1', function() {
    return console.log('running the test-1 task');
});

gulp.task('test-2', function() {
    return console.log('running the test-2 task');
});

gulp.task('run', ['test-2', 'test-1'], function() {
    return console.log('running run task...');
});

gulp.task('js', function() {
    var jsbuild = gulp.src(dir.src + 'js/**/*')
        .pipe(deporder())
        .pipe(concat('main.js'));

    if (!devBuild) {
        jsbuild = jsbuild
            .pipe(stripdebug())
            .pipe(uglify());
    }

    return jsbuild.pipe(gulp.dest(folder.dist + 'js/'));
});

gulp.task('favicon', function() {
    return gulp.src(folder.src + 'favicon.ico')
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

gulp.task('js-smash', function() {
    return gulp.src([
            'node_modules/jquery/dist/jquery.js',
            'node_modules/bootstrap/dist/js/bootstrap.js'
        ])
        .pipe(uglify())
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest(folder.dist + 'js'));
});

gulp.task('css-smash', function() {
    return gulp.src([
            'node_modules/bootstrap/dist/css/bootstrap.css'
        ])
        .pipe(uglify())
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest(folder.dist + 'js'));
});

gulp.task('archive', function() {
    return gulp.src(['./**/*.*', '!./node_modules/**'], { base: './', dot: true })
        .pipe(zip('_archive.zip'))
        .pipe(gulp.dest('./'));
});

