const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');
const eslint = require("eslint");
const gulpTslint = require("gulp-tslint");
const sourcemaps = require("gulp-sourcemaps");
const exec = require('child_process').exec;
const fs = require('fs');

const del = require("del");

const paths = {
    publicAssets: ['src/public/**/*', '!src/public/**/*.ts'],
    dist: ['dist/'],
    config: ['config/**'],
};

function clean() {
    return del(["dist/**/*"]);
}

function compileDebug() {
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject()).js
        .pipe(sourcemaps.write({
            // Return relative source map root directories per file.
            sourceRoot: (file) => {
                return file.cwd + '/src';
            }
        }))
        .pipe(gulp.dest(paths.dist));
}

function lint() {
    const program = eslint.Linter.createProgram(tsProject.configFileName);
    return tsProject.src()
        .pipe(gulpTslint({program, formatter: "verbose"}))
        .pipe(gulpTslint.report());
}


gulp.task("default", gulp.series(lint, compileDebug));

gulp.task("rebuild", gulp.series(clean, "default"));
