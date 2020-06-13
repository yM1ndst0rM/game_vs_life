const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');
const gulpEslint = require("gulp-eslint");
const sourcemaps = require("gulp-sourcemaps");

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
    return tsProject.src()
        // eslint() attaches the lint output to the "eslint" property
        // of the file object so it can be used by other modules.
        .pipe(gulpEslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(gulpEslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(gulpEslint.failAfterError());
}

function exportPublicNonScriptAssets() {
    return gulp.src(paths.publicAssets).pipe(gulp.dest(paths.dist + "/public"));
}

gulp.task("default", gulp.series(lint, compileDebug, exportPublicNonScriptAssets));

gulp.task(lint)

gulp.task("rebuild", gulp.series(clean, "default"));
