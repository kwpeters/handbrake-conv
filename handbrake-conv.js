var path        = require('path'),
    q           = require('q'),
    argv        = require('yargs').argv;
    hbjs        = require('handbrake-js'),
    _           = require('lodash'),
    defaultConversionOptions = {
        preset: "Universal",
        encoder: 'x264'
    };

doIt();

function doIt() {

    var conversions,
        funcs,
        numSucceeded = 0,
        numErrors = 0;

    if (argv._.length > 0) {
        // Command line arguments were used.  Treat each one as an input file.
        conversions = argv._;
    } else {
        // Consult config.js for conversion information.
        conversions= require('./config');
    }

    conversions = conversions.map(function (curConversion) {
        curConversion = normalizeConversion (curConversion);
        return curConversion;
    });

    funcs = conversions.map(function (curConversion, index, conversions) {
        return function () {
            var handbrakePromise;

            console.log('--------------------------------------------------------------------------------');
            console.log('Starting conversion %d of %d', index + 1, conversions.length);
            console.dir(curConversion);

            handbrakePromise = runHandbrake(curConversion);
            handbrakePromise.then(
                function onHandbrakeSuccess() {
                    numSucceeded += 1;
                },
                function onHandbrakeError() {
                    numErrors += 1;
                }
            );

            return handbrakePromise;
        };
    });

    runSequence(funcs)
        .then(function () {
            console.log('--------------------------------------------------------------------------------');
            console.log('%d transcodings finished successfully', numSucceeded);
            console.log('%d transcodings errored', numErrors);
        })
        .done();
}

////////////////////////////////////////////////////////////////////////////////
//
// Runs an array of promise returning functions in order and returns a promise
// for the last one.
//
////////////////////////////////////////////////////////////////////////////////
function runSequence(funcs) {
    return funcs.reduce(q.when, q('foo'));
}

////////////////////////////////////////////////////////////////////////////////
//
// Normalizes various configuration representations into a consistent object.
//
////////////////////////////////////////////////////////////////////////////////
function normalizeConversion(conversion) {
    //
    // If the current conversion is just a string, assume that the string is
    // the path to the input file.
    //
    if (_.isString(conversion)) {
        conversion = {input: conversion};
    }

    //
    // Assign default conversion options for any that have not been specified.
    //
    _.defaults(conversion, defaultConversionOptions);

    //
    // If output was not specified, assume a .mkv file in the same directory as the
    // input.
    //
    var inputPathParts;

    // If the current conversion has an output file specified, do nothing.
    if (conversion.output === undefined) {
        inputPathParts = splitPath(conversion.input);
        conversion.output = inputPathParts.dirName + '/' + inputPathParts.baseName + '.mkv';
    }

    return conversion;
}

////////////////////////////////////////////////////////////////////////////////
//
// Returns an object with properties: dirName, baseName and extName
//
////////////////////////////////////////////////////////////////////////////////
function splitPath(filePath) {
    var dirName,
        baseName,
        extName;

    dirName = path.dirname(filePath);
    extName = path.extname(filePath);
    baseName = path.basename(filePath, extName);

    return {
        dirName: dirName,
        baseName: baseName,
        extName: extName
    };
}

////////////////////////////////////////////////////////////////////////////////
//
// Runs Handbrake with the specified configuration.
//
////////////////////////////////////////////////////////////////////////////////
function runHandbrake(config) {
    var dfd = q.defer();

    handbrake = hbjs.spawn(config);

    handbrake.on('error', function onError(err) {
        console.log('Error encountered transcoding %s.', config.input);
        console.log(err);
        dfd.reject(err);
    });

    // handbrake.on('start', function onStart() {
    //     console.log('Start (CLI launched)');
    // });

    // handbrake.on('begin', function onBegin() {
    //     console.log('Begin (encoding has begun)');
    // });

    // handbrake.on('progress', function onProgress(progress) {
    //     // console.log(
    //     //     "Task %d of %d, percent complete: %s, ETA: %s",
    //     //     progress.taskNumber,
    //     //     progress.taskCount,
    //     //     progress.percentComplete,
    //     //     progress.eta
    //     // );
    //     //console.log('%s: %s', config.input, progress.percentComplete);
    // });

    // handbrake.on('output', function onOutput(output) {
    //     console.log(output);
    // });

    // handbrake.on('end', function onEnd() {
    //     console.log('End (encoding completed)');
    // });

    handbrake.on('complete', function onComplete() {
        //console.log('Complete (CLI exited)');
        dfd.resolve(config.output);
    });

    return dfd.promise;
}
