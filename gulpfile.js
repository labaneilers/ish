var gulp = require("gulp");
var jshint = require("gulp-jshint");
var mocha = require("gulp-mocha");

gulp.task("default", ["jshint", "mocha"]);

gulp.task("jshint", function () {
    return gulp.src(["./gulpfile.js", "./lib/**/*.js", "./bin/*.js"])
        .pipe(jshint())
        .pipe(jshint.reporter(require("jshint-stylish")))
        .pipe(jshint.reporter("fail"));
});

gulp.task("mocha", ["jshint"], function () {
    return gulp.src(["./test/**/*.js"], { read: false })
        .pipe(mocha({ reporter: "spec" }));
});