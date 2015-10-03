var path        = require('path'),
    argv        = require('yargs').argv;
    hbjs        = require('handbrake-js'),
    _           = require('lodash'),
    defaultConversionOptions = {
        preset: "Universal",
        encoder: 'x264'
    };

doIt();

function doIt() {

    var conversions;

    if (argv._.length > 0) {
        // Command line arguments were used.  Treat each one as an input file.
        conversions = argv._;
    } else {
        // Consult config.js for conversion information.
        conversions= require('./config');
    }

    conversions = _.map(conversions, function (curConversion) {
        curConversion = normalizeConversion (curConversion);
        return curConversion;
    });

    conversions.forEach(function (curConversion) {
        var handbrake;
        console.log('--------------------------------------------------------------------------------');
        console.log('Starting conversion:');
        console.dir(curConversion);

        if (!argv.dryrun) {
            runHandbrake(curConversion);
        }

    });
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

    handbrake = hbjs.spawn(config);

    handbrake.on('error', function onError(err) {
        console.log('Error!');
        console.log(err);
    });

    handbrake.on('start', function onStart() {
        //console.log('Start (CLI launched)');
    });

    handbrake.on('begin', function onBegin() {
        console.log('Begin (encoding has begun)');
    });

    handbrake.on('progress', function onProgress(progress) {
        // console.log(
        //     "Task %d of %d, percent complete: %s, ETA: %s",
        //     progress.taskNumber,
        //     progress.taskCount,
        //     progress.percentComplete,
        //     progress.eta
        // );
    });

    handbrake.on('output', function onOutput(output) {
        console.log(output);
    });

    handbrake.on('end', function onEnd() {
        //console.log('End (encoding completed)');
    });

    handbrake.on('complete', function onComplete() {
        //console.log('Complete (CLI exited)');
    });

}
