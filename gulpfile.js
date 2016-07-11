var postcss = require("gulp-postcss"),
    gulp = require("gulp"),
    sourcemaps = require("gulp-sourcemaps"),
    gutil = require('gulp-util'),
    imagemin = require('gulp-imagemin'),
    browserSync = require('browser-sync'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    babelify = require('babelify'),
    vueify = require('vueify'),
    uglify = require('gulp-uglify'),
    nano = require('gulp-cssnano'),
    swig  = require('gulp-swig'),
    convert = require('gulp-convert'),
    markdown = require('gulp-markdown'),
    mkdirp = require('mkdirp'),
    del = require('del'),
    _ = require('lodash'),
    fs = require('fs'),
    path = require('path');


// meta tasks
gulp.task('default', ['watch', 'browser-sync']);
gulp.task('build', ['css', 'js-app', 'replace', 'imagemin', 'move']);
gulp.task('datagen', ['clean', 'markdown', 'convert', 'transform']);

// return true if convertable to number
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// transform csv2json array to id: {y_2012: value} object format
function jsonTransform(jsonArray) {
    var jsonOut = {};
    for(var i = 0; i < jsonArray.length; i++) {
        jsonOut[jsonArray[i]["id"]] = {};
        for(var key in jsonArray[i]) {
            if (key !== 'id') {
                if (isNumeric(jsonArray[i][key])) {
                    jsonOut[jsonArray[i]["id"]][key] = Number(jsonArray[i][key]);
                } else {
                    jsonOut[jsonArray[i]["id"]][key] = null;
                }
            }
        }
    }
    return jsonOut;
}



// Live reload server
gulp.task('browser-sync', function() {
    browserSync(['./public/**/*'], {
        server: {
            baseDir: "./public"
        }
    });
});

// watch tasks
gulp.task('watch', function () {
    gulp.watch(['./app/*.html'], ['replace']);
    gulp.watch(['./app/css/**/*.css'], ['css']);
    gulp.watch(['./app/js/**/*.js', './app/js/**/*.vue'], ['js-app']);
    gulp.watch('./app/img/**/*', ['imagemin']);
});

// template stuff
gulp.task('replace', function() {
    return gulp.src(['./app/index.html', './app/embed.html'])
        .pipe(swig({
            defaults: { cache: false },
            data: {
                cachebuster: Math.floor((Math.random() * 100000) + 1),
                gaKey: 'UA-48797957-1'
            }
        }))
        .pipe(gulp.dest('./public/'));
});

// move fonts
gulp.task('move', function() {
    gulp.src('./app/fonts/*.*')
        .pipe(gulp.dest('./public/fonts/'));
    gulp.src('./data/npa.geojson.json')
        .pipe(gulp.dest('./public/data/'));
    gulp.src('./app/style/**/*')
            .pipe(gulp.dest('./public/style/'));
});

// JavaScript
gulp.task('js-app', function () {
    //_.each(['app.js', 'embed.js'], function(file) {
    _.each(['embed.js'], function(file) {
        browserify(`./app/js/${file}`)
              .transform(vueify)
              .transform(babelify)
              .bundle()
              .pipe(source(file))
              .pipe(buffer())
              .pipe(sourcemaps.init({loadMaps: true}))
              .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
              .on('error', gutil.log)
              .pipe(sourcemaps.write('./'))
              .pipe(gulp.dest('./public/js/'));
    });
});

// CSS
gulp.task("css", function() {
    return gulp.src(['./app/css/main.css', './app/css/embed.css'])
        .pipe(sourcemaps.init())
        .pipe(postcss([
            require("postcss-import")(),
            require("postcss-cssnext")({
                'browers': ['last 3 version'],
                'customProperties': true,
                'colorFunction': true,
                'customSelectors': true
            })
        ]))
        .pipe(gutil.env.type === 'production' ? nano() : gutil.noop())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css'));
});

// image minification
gulp.task('imagemin', function() {
    return gulp.src('./app/img/*')
        .pipe(imagemin({
            optimizationLevel: 5,
            svgoPlugins: [{removeViewBox: false}]
        }))
        .pipe(gulp.dest('public/img'));
});

// csv to jxon
gulp.task('convert', ['clean'], function() {
    console.log('Convert CSV...');
    return gulp.src('data/metric/*.csv')
        .pipe(convert({
            from: 'csv',
            to: 'json'
        }))
        .pipe(gulp.dest('tmp/'));
});

// convert/move json files
gulp.task('transform', ['clean', 'convert'], function(cb) {
    console.log('Transform JSON...');
    var dest = "./public/data/metric";
    var config = require('./data/config/config.js').metricConfig;

    mkdirp(dest);

    _.each(config, function(m) {
        if (m.type === "sum") {
            var r = require('./tmp/r' + m.metric + '.json');
            fs.writeFileSync(path.join(dest, `map${m.metric}.json`), JSON.stringify(jsonTransform(r), null, '  '));
            // if (m.accuracy) {
            //     var a = require('./tmp/m' + m.metric + '-accuracy.json');
            //     fs.writeFileSync(path.join(dest, `a${m.metric}.json`), JSON.stringify(jsonTransform(a), null, '  '));
            // }
        }
        if (m.type === "mean") {
            var n = require('./tmp/r' + m.metric + '.json');
            fs.writeFileSync(path.join(dest, `map${m.metric}.json`), JSON.stringify(jsonTransform(n), null, '  '));
            // if (m.raw_label) {
            //     var r = require('./tmp/r' + m.metric + '.json');
            //     fs.writeFileSync(path.join(dest, `r${m.metric}.json`), JSON.stringify(jsonTransform(r), null, '  '));
            // }
            // if (m.accuracy) {
            //     var a = require('./tmp/m' + m.metric + '-accuracy.json');
            //     fs.writeFileSync(path.join(dest, `a${m.metric}.json`), JSON.stringify(jsonTransform(a), null, '  '));
            // }
        }
        if (m.type === "weighted") {
            // if (m.accuracy) {
            //     var a = require('./tmp/m' + m.metric + '-accuracy.json');
            //     fs.writeFileSync(path.join(dest, `a${m.metric}.json`), JSON.stringify(jsonTransform(a), null, '  '));
            // }
            var r = require('./tmp/r' + m.metric + '.json');
            var d = require('./tmp/d' + m.metric + '.json');
            var jsonArrayR = jsonTransform(r);
            var jsonArrayD = jsonTransform(d);
            for (key in jsonArrayR) {
                for (key2 in jsonArrayR[key]) {
                    if (isNumeric(jsonArrayR[key][key2]) && isNumeric(jsonArrayD[key][key2])) {
                        jsonArrayR[key][key2] = Math.round((jsonArrayR[key][key2] / jsonArrayD[key][key2]) * 100) / 100 ;
                    } else {
                        jsonArrayR[key][key2] = null;
                    }
                }
            }
            fs.writeFileSync(path.join(dest, `map${m.metric}.json`), JSON.stringify(jsonArrayR, null, '  '));
            //fs.writeFileSync(path.join(dest, `w${m.metric}.json`), JSON.stringify(jsonArrayD, null, '  '));
        }
    });
    del(['./tmp/**']);
    cb();
});

// markdown conversion
gulp.task('markdown', ['clean'], function() {
    console.log('Markdown...');
    return gulp.src('data/meta/*.md')
        .pipe(markdown())
        .pipe(gulp.dest('public/data/meta/'));
});

// clean junk before build
gulp.task('clean', function(cb) {
    console.log('Cleaning...');
    del([
        'public/data/meta/*.html',
        'public/data/metric/*.json',
        'tmp/*.json'
    ], cb());
});
