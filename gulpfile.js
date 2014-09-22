var gulp = require("gulp");
var jshint = require("gulp-jshint");

gulp.task("default", ["jshint"]);

gulp.task("jshint", function () {
    return gulp.src(["./gulpfile.js", "./lib/**/*.js", "./bin/*.js"])
        .pipe(jshint())
        .pipe(jshint.reporter(require("jshint-stylish")))
        .pipe(jshint.reporter("fail"));
});