var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var prepBower = require('bower-files');
var inject = require('gulp-inject');
var series = require('stream-series');
var del = require('del');
var bower = require('gulp-bower');
var colors = require('colors');
var taskListing = require('gulp-task-listing');
var betterConsole = require('better-console');
var ghPages = require('gulp-gh-pages');
var connect = require('gulp-connect');
var print = require('gulp-print');
var underscore = require('underscore');
var merge = require('merge-stream');
var install = require("gulp-install");

var modules = ["datasets", "grid", "datatype", "methodology"];

gulp.task('default', ["bower", "clean", "buildDev"]);

gulp.task('help', taskListing);

gulp.task('bower', function() {
  return bower().pipe(gulp.dest('bower_components/'))
});

gulp.task('npm', function() {
  return gulp.src(['./package.json'])
    .pipe(install());
});

gulp.task('clean', function() {
  return del.sync(['out/']);
});

gulp.task('buildDev', ['npm', 'bower', 'clean'], function() {
    var lib = prepBower();
    
    var bowerJs = gulp.src(lib.ext('js').files)
        .pipe(gulp.dest('out/common/js'));

    var bowerCss = gulp.src(lib.ext('css').files)
        .pipe(gulp.dest('out/common/css'));

    var bowerWoff = gulp.src(lib.ext('woff').files)
        .pipe(gulp.dest('out/common/fonts'));

    var commonCss = gulp.src('./public/common/css/**.css')
        .pipe(gulp.dest('out/common/css'));

    var commonJs = gulp.src('./public/common/js/**.js')
        .pipe(gulp.dest('out/common/js'));

    gulp.src('./public/common/vendor/**.*')
        .pipe(gulp.dest('out/common/vendor'));

    gulp.src('./public/common/CNAME')
        .pipe(gulp.dest('out/'));

    return merge(underscore.map(modules, function(module) {
        var target = gulp.src('./public/' + module + '/*.html');

        var customJs = gulp.src('./public/' + module + '/js/**.js')
            .pipe(gulp.dest('out/' + module + '/js'));

        var customCss = gulp.src('./public/' + module + '/css/**.css')
            .pipe(gulp.dest('out/' + module + '/css'));

        var images = gulp.src('./public/' + module + '/img/**.*')
            .pipe(gulp.dest('out/' + module + '/img'));

        var data = gulp.src('./public/' + module + '/data/**.*')
            .pipe(gulp.dest('out/' + module + '/data'));

        return merge([target.pipe(inject(series(bowerJs, commonJs, customJs), {
                ignorePath: '/out/'
            }))
            .pipe(inject(series(bowerCss, commonCss, customCss), {
                ignorePath: '/out/'
            }))
            .pipe(inject(bowerWoff, {ignorePath:'/out/'}))
            //OKAY so bummer, it doesn't sound like gulp-inject supports dynamic
            //injection tags so we'll need to hard code these for now. Hopefully
            //there won't be more than just the nav.
            .pipe(inject(gulp.src(['./public/common/partials/nav.html']), {
                starttag: '<!-- inject:nav:html -->',
                transform: function (filePath, file) {
                    return file.contents.toString('utf8')
                  }
            }))
            .pipe(inject(
              gulp.src(['./public/common/templates/*.html'], {
                read: true
              }), {
                starttag: '<!-- inject:templates:html -->',
                transform: function(filePath, file) {
                  return '<script id="' + toFileName(filePath) + '" type="text/x-handlebars-template">' + file.contents.toString('utf8') +"</script>";
                }
              }
            ))
            .pipe(gulp.dest('out/'))
            .pipe(connect.reload()), images, data])
    }));
});

gulp.task('watch', ['buildDev'], function() {
  return gulp.watch("public/**/*", ['buildDev']);
});

gulp.task('connect', function() {
  connect.server({
    root: 'out',
    port: 8000,
    livereload: true
  });
});

gulp.task('devServer', ['connect', 'watch'])

gulp.task('buildProd', ['bower'], function() {
    var lib = prepBower();


    var bowerJs = gulp.src(lib.ext('js').files)
        .pipe(concat('lib.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('Open-Data-Census/common/js'));

    var bowerCss = gulp.src(lib.ext('css').files)
        .pipe(concat('lib.min.css'))
        .pipe(gulp.dest('Open-Data-Census/common/css'));

    var bowerWoff = gulp.src(lib.ext('woff').files)
        .pipe(gulp.dest('Open-Data-Census/common/fonts'));

    var commonCss = gulp.src('./public/common/css/**.css')
        .pipe(gulp.dest('Open-Data-Census/common/css'));

    var commonJs = gulp.src('./public/common/js/**.js')
        .pipe(concat('common.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('Open-Data-Census/common/js'));

    gulp.src('./public/common/vendor/**.*')
        .pipe(gulp.dest('Open-Data-Census/common/vendor'));

    gulp.src('./public/common/favicon.ico')
      .pipe(gulp.dest('Open-Data-Census/'));

    gulp.src('./public/common/CNAME')
      .pipe(gulp.dest('Open-Data-Census/'));

    return merge(underscore.map(modules, function(module) {
        var target = gulp.src('./public/' + module + '/*.html');

        var customJs = gulp.src('./public/' + module + '/js/**.js')
            .pipe(concat('app.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest('Open-Data-Census/' + module + '/js'));

        var customCss = gulp.src('./public/' + module + '/css/**.css')
            .pipe(concat('app.min.css'))
            .pipe(gulp.dest('Open-Data-Census/' + module + '/css'));


        var images = gulp.src('./public/' + module + '/img/**.*')
            .pipe(gulp.dest('Open-Data-Census/' + module + '/img'));

        var data = gulp.src('./public/' + module + '/data/**.*')
            .pipe(gulp.dest('Open-Data-Census/' + module + '/data'));

        return merge([target.pipe(inject(series(bowerJs, commonJs, customJs), {
                ignorePath: '/Open-Data-Census/'
            }))
            .pipe(inject(series(bowerCss, commonCss, customCss), {
                ignorePath: '/Open-Data-Census/'
            }))
            .pipe(inject(bowerWoff, {
                ignorePath: '/Open-Data-Census/'
            }))
            .pipe(inject(gulp.src(['./public/common/partials/nav.html']), {
                starttag: '<!-- inject:nav:html -->',
                transform: function (filePath, file) {
                    return file.contents.toString('utf8')
                  }
            }))
            .pipe(inject(
              gulp.src(['./public/common/templates/*.html'], {
                read: true
              }), {
                starttag: '<!-- inject:templates:html -->',
                transform: function(filePath, file) {
                  return '<script id="' + toFileName(filePath) + '" type="text/x-handlebars-template">' + file.contents.toString('utf8') +"</script>";
                }
              }
            ))
            .pipe(gulp.dest('Open-Data-Census/'))
            .pipe(connect.reload()), images, data])
    }));

});

gulp.task('cleanPublish', function() {
  return del.sync(['.publish/']);
});
gulp.task('gh-pages', ["buildProd", "cleanPublish"], function() {
  return gulp.src('./Open-Data-Census/**/*')
    .pipe(ghPages());
});

gulp.task('deploy', ["gh-pages"], function() {
  return del.sync(['Open-Data-Census/']);
});

var toFileName = function (filePath){
  return filePath.split('\\').pop().split('/').pop().replace(/\.[^/.]+$/, "");
}

gulp.task('readme', function() {
  betterConsole.clear()
  console.log("______________________________________________".red);
  console.log(" _____   _____  _______ __   _".white);
  console.log("|     | |_____] |______ | \\  |".white);
  console.log("|_____| |       |______ |  \\_|".white);
  console.log("______  _______ _______ _______".white);
  console.log("|     \\ |_____|    |    |_____|".white);
  console.log("|_____/ |     |    |    |     |".white);
  console.log("_______ _______ __   _ _______ _     _ _______".blue);
  console.log("|       |______ | \\  | |______ |     | |______".blue);
  console.log("|_____  |______ |  \\_| ______| |_____| ______|".blue);
  console.log("______________________________________________".blue);
  console.log();
  console.log();
  console.log("The Census is a static site. Census data is embedded at build time from");
  console.log("'Census Data.xlsx' via public/common/js/data.js.")
  console.log();
  console.log("The site is otherwise a fairly bogstandard Bootstrap/jQuery build. All that");
  console.log("should be required to get the development environment up is:");
  console.log();
  console.log("                       gulp")
  console.log();
  console.log("which will build the site in the 'out' directory where it can be served by")
  console.log("your static site server of choice. If you're going to be working on the site,")
  console.log();
  console.log("                       gulp devServer")
  console.log();
  console.log("will watch changes to the 'public' directory, serve a live updating version of")
  console.log("the site at localhost:8000 and live refresh when changes occur.")
  console.log("To minify and concat resouces, and then publish the site to gh-pages:")
  console.log();
  console.log("                       gulp deploy")
  console.log();
});
