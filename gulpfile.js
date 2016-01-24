var gulp, browserSync, plugins

gulp = require('gulp')
plugins = require('gulp-load-plugins')()
browserSync = require('browser-sync').create()

gulp.task('uglify', function(){
    return gulp.src('src/*.js')
                .pipe(plugins.uglify())
                .pipe(gulp.dest('dist'))
})

gulp.task('server', ['uglify'], function(){
    browserSync.init({
        server : {
            baseDir : './'
        }
    })

    gulp.watch(['**/*.html', '**/*.css', '**/*.js'], ['uglify']).on('change', browserSync.reload)
})
