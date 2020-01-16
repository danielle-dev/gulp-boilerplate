// Package variables
var gulp            = require('gulp');
var changed         = require('gulp-changed');
var cheerio         = require('gulp-cheerio');
var concat          = require('gulp-concat');
var imagemin        = require('gulp-imagemin');
var postcss         = require('gulp-postcss');
var rename          = require('gulp-rename');
var sass            = require('gulp-sass');
var svgmin          = require('gulp-svgmin');
var twig            = require('gulp-twig');
var uglify          = require('gulp-uglify');
var autoprefixer    = require('autoprefixer');
var browserSync     = require('browser-sync').create();
var cssnano         = require('cssnano');


// Starts a BrowerSync instance and watch files for changes
gulp.task('watch', function() {
  gulp.watch('site/**/*.html', gulp.series('templates')).on('change', browserSync.reload)
  gulp.watch('scss/*.scss', gulp.series('styles')).on('change', browserSync.reload)
  gulp.watch('js/*.js', gulp.series('scripts')).on('change', browserSync.reload)
  gulp.watch('img/**', gulp.series('images'))
  gulp.watch('svg/*', gulp.series('svg'));
})

// Compiles all HTML files
gulp.task('templates', function() {
  return gulp.src('site/*.html')
  .pipe(twig())
  .pipe(gulp.dest('dist'));
});

// Compiles Sass files into CSS
gulp.task('styles', function() {
  return gulp.src('scss/*.scss')
  .pipe(sass())
  .pipe(postcss([ autoprefixer(), cssnano() ]))
  .pipe(rename('main.min.css'))
  .pipe(gulp.dest('dist/assets/css'))
  .pipe(browserSync.stream());
});

// Compiles all scripts to one minified file
gulp.task('scripts', function() {
  return gulp.src('js/*.js')
  .pipe(concat('main.js'))
  .pipe(uglify())
  .pipe(rename('main.min.js'))
  .pipe(gulp.dest('dist/assets/js'));
});

// Minifies all images
gulp.task('images', function() {
  return gulp.src('img/**')
  .pipe(changed('dist/assets/img'))
  .pipe(imagemin())
  .pipe(gulp.dest('dist/assets/img'));
});

// Minifies all SVG's
gulp.task('svg', function() {
  return gulp.src('svg/*.svg')
  .pipe(svgmin())
  .pipe(gulp.dest('dist/assets/svg'));
});


// Builds the framework files
gulp.task('build', gulp.series('templates', 'styles', 'scripts', 'images', 'svg'));

// Starts a BrowerSync instance
gulp.task('serve', gulp.series('build', function(done){
  browserSync.init({
    server: {
      baseDir: './dist'
    }
  })
  done();
}));

// Runs all of the above tasks and then waits for files to change
gulp.task('default', gulp.series('serve', 'watch'));
