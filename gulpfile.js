// Package variables
var gulp            = require('gulp');
var changed         = require('gulp-changed');
var concat          = require('gulp-concat');
var imagemin        = require('gulp-imagemin');
var include         = require('gulp-include');
var postcss         = require('gulp-postcss');
var rename          = require('gulp-rename');
var sass            = require('gulp-sass');
var svgmin          = require('gulp-svgmin');
var twig            = require('gulp-twig');
var uglify          = require('gulp-uglify');
var autoprefixer    = require('autoprefixer');
var browserSync     = require('browser-sync').create();
var cssnano         = require('cssnano');
var tailwindcss     = require('tailwindcss');
var purgecss        = require('@fullhuman/postcss-purgecss');

// Paths variables
var themeDir        = '../web/app/themes/coolbest';
var htmlSrc         = 'site/**/*.html';
var cssSrc          = 'scss/app.scss';
var editorCssSrc    = 'scss/editor.scss';
var cssDist         = 'dist/assets/css/';
var jsSrc           = 'js/*.js';
var jsDist          = 'dist/assets/js/';
var imgSrc          = 'img/**';
var imgDist         = 'dist/assets/img/';
var fontSrc         = 'font/**';
var fontDist        = 'dist/assets/font/';
var svgSrc          = 'svg/*.svg';
var svgDist         = 'dist/assets/svg';

// Starts a BrowerSync instance and watch files for changes
gulp.task('watch', function() {
  gulp.watch(htmlSrc, gulp.series('templates', 'styles')).on('change', browserSync.reload)
  gulp.watch('scss/*.scss', gulp.series('styles')).on('change', browserSync.reload)
  gulp.watch(jsSrc, gulp.series('scripts')).on('change', browserSync.reload)
  gulp.watch(imgSrc, gulp.series('images'))
  gulp.watch(svgSrc, gulp.series('svgs'))
  gulp.watch('tailwind.config.js', gulp.series('styles')).on('change', browserSync.reload);
})

// Watch for Wordpress
gulp.task('watch-wordpress', function() {
  gulp.watch('scss/*.scss', gulp.series('editor-styles'))
  gulp.watch('dist/assets/**', gulp.series('copy-to-wordpress'))
})

// Compiles all HTML files
gulp.task('templates', function() {
  return gulp.src('site/**.html')
  .pipe(twig())
  .pipe(gulp.dest('dist'));
});

// Compiles Sass files into CSS
gulp.task('styles', function() {
  return gulp.src(cssSrc)
  .pipe(sass())
  .pipe(postcss([
    tailwindcss(),
    purgecss({
      content: ['site/**/*.html', 'svg/*.svg'],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
    }),
    autoprefixer(),
    cssnano()
  ]))
  .pipe(rename('main.min.css'))
  .pipe(gulp.dest(cssDist))
  .pipe(browserSync.stream());
});

// Compiles Editor Styles Sass file into CSS
gulp.task('editor-styles', function() {
  return gulp.src(editorCssSrc, { allowEmpty: true })
    .pipe(include())
    .pipe(sass())
    .pipe(postcss([ autoprefixer(), cssnano() ]))
    .pipe(rename('editor-styles.css'))
    .pipe(gulp.dest(cssDist))
})

// Compiles all scripts to one minified file
gulp.task('scripts', function() {
  return gulp.src(jsSrc)
  .pipe(concat('main.js'))
  .pipe(uglify())
  .pipe(rename('main.min.js'))
  .pipe(gulp.dest(jsDist));
});

// Minifies all images
gulp.task('images', function() {
  return gulp.src(imgSrc)
  .pipe(changed(imgDist))
  .pipe(imagemin())
  .pipe(gulp.dest(imgDist));
});

// Minifies all SVG's
gulp.task('svgs', function() {
  return gulp.src(svgSrc)
  //.pipe(svgmin())
  .pipe(gulp.dest(svgDist));
});

// Task: fonts
gulp.task('fonts', function() {
  return gulp.src(fontSrc)
  .pipe(changed(fontDist))
  .pipe(gulp.dest(fontDist));
});

// Task: wordpress
gulp.task('copy-to-wordpress', done => {
  // Copy all CSS files
  gulp.src(cssDist + '/**/*')
  .pipe(gulp.dest(themeDir + '/assets/css/'))

  // Copy all JS files
  gulp.src(jsDist + '/**/*')
  .pipe(gulp.dest(themeDir + '/assets/js/'))

  // Copy all SVG files
  gulp.src(svgDist + '/**/*')
  .pipe(changed(themeDir + '/assets/svg/'))
  .pipe(gulp.dest(themeDir + '/assets/svg/'))

  // Copy all images except DEMO folder
  gulp.src([imgDist + '/**/*', '!' + imgDist + '/demo/**'])
  .pipe(changed(themeDir + '/assets/img/'))
  .pipe(gulp.dest(themeDir + '/assets/img/'))

  // Copy all fonts
  gulp.src(fontDist + '/**/*')
  .pipe(changed(themeDir + '/assets/font/'))
  .pipe(gulp.dest(themeDir + '/assets/font/'))

  done();
});

// Builds the framework files
gulp.task('build', gulp.parallel('svgs', 'styles', 'scripts', 'images', 'fonts'));

// Starts a BrowerSync instance
gulp.task('serve', gulp.series('build', 'templates', function(done){
  browserSync.init({
    server: {
      baseDir: './dist'
    }
  })
  done();
}));

// Runs all of the above tasks and then waits for files to change
gulp.task('default', gulp.series('serve', 'watch'));

//Run task: wordpress (move dist files to theme location)
gulp.task('wordpress', gulp.series('build', 'templates', 'editor-styles', 'copy-to-wordpress'));

//Run task: watch-wordpress (continually move dist files to theme location)
gulp.task('watch-wordpress', gulp.parallel('wordpress', 'watch', 'watch-wordpress', 'serve'));