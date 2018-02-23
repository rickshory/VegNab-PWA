var gulp = require('gulp');
var browserSync = require('browser-sync');
gulp.task('default', ['serve']);
gulp.task('serve', [], () => {
  browserSync.init({
    server: '.',
    port: 3000
  });
  gulp.watch('css/*.css', [])
    .on('change', browserSync.reload);
  gulp.watch('js/*js', [])
    .on('change', browserSync.reload);
  gulp.watch('*.html')
    .on('change', browserSync.reload);
});
