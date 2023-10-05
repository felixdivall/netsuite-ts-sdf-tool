const gulp = require('gulp')
const path = require('path')
const webpack = require('webpack-stream')
const del = require('del')
const rename = require('gulp-rename')
const projectConfig = require('./projectconfig.js')

const distDir = projectConfig.PATHS.dist
const srcDir = projectConfig.PATHS.src
const outputDirs = projectConfig.OutputDirs


function buildScripts() {
  return webpack(require('./webpack.config.js')).pipe(
    gulp.dest(path.resolve(distDir, outputDirs.scripts))
  )
}

function moveFileCabinetToDist () {
  return gulp.src('./src/FileCabinet/**/*').pipe(gulp.dest('./src/FileCabinet/'))
}

function moveManifest(cb) {
  gulp.src(['src/manifest.xml']).pipe(gulp.dest(distDir))
  cb()
}
function moveSDFFiles(cb) {
  gulp.src(['src/deploy.xml', 'src/manifest.xml']).pipe(gulp.dest(distDir))
  cb()
}

function moveObjects(cb) {
  gulp
    .src('./src/Objects/**/*.xml').pipe(gulp.dest(path.resolve(distDir,outputDirs.objects)))
  cb()
}

function moveObjectsToFlatStructure(cb) {
  gulp
  .src('./src/Objects/**/*.xml').pipe(rename({dirname:''})).pipe(gulp.dest(path.resolve(distDir,outputDirs.objects)))
cb()
}

function cleanDistDir(cb) {
  del(distDir).then((res) => cb())
}

function moveDeployAllFile(cb) {
  gulp.src('./src/deploy_all.xml').pipe(rename('deploy.xml')).pipe(gulp.dest(path.resolve(distDir)))
  cb()
}

exports.cleanAndBuild = gulp.series(
  //cleanDistDir,
  //gulp.parallel(buildScripts)
  gulp.parallel(buildScripts, moveObjects, moveSDFFiles)
)
exports.default = exports.cleanAndBuild
exports.cleanDist = cleanDistDir
exports.BuildAllFiles = gulp.series(
  //cleanDistDir,
  //gulp.parallel(buildScripts) 
  gulp.parallel(moveFileCabinetToDist, buildScripts, moveObjects, moveSDFFiles) 
)

