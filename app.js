var path        = require('path'),
    hbjs        = require('handbrake-js'),
    _           = require('lodash'),
    conversions = require('./config'),
    defaultConversionOptions = {
        preset: "Universal",
        encoder: 'x264'
    };

doIt();

function doIt() {
    //
    // If there are any conversion consisting of just a string, assume that the
    // string is the path to the input file.
    //
    conversions = _.map(conversions, function (curConversion) {
        var conversionObj = {};

        // If the current conversion is an object, do nothing.
        if (_.isObject(curConversion)) {return curConversion;}

        if (_.isString(curConversion)) {
            conversionObj = {
                input: curConversion
            };
        } else {
            throw new Error('Unknown configuration specified: ' + curConversion);
        }

        return conversionObj;
    });

    //
    // Assign default conversion options for any that have not been specified.
    //
    conversions = _.map(conversions, function (curConversion) {
        _.defaults(curConversion, defaultConversionOptions);
        return curConversion;
    });


    //
    // If output was not specified, assume a .mkv file in the same directory as the
    // input.
    //
    conversions = _.map(conversions, function (curConversion) {
        var inputPathParts;

        // If the current conversion has an output file specified, do nothing.
        if (curConversion.output) {return curConversion;}

        inputPathParts = splitPath(curConversion.input);
        curConversion.output = inputPathParts.dirName + '/' + inputPathParts.baseName + '.mkv';

        return curConversion;
    });


    conversions.forEach(function (curConversion) {
        var handbrake;
        console.log('--------------------------------------------------------------------------------');
        console.log('Starting conversion:');
        console.dir(curConversion);

        //runHandbrake(curConversion);
    });
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
