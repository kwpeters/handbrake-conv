/* global process */

var path        = require('path'),
    os          = require('os'),
    q           = require('q'),
    argv        = require('yargs').argv,
    glob        = require('glob-all'),
    hbjs        = require('handbrake-js'),
    _           = require('lodash'),
    defaultConversionOptions = {
        preset: "Universal",
        encoder: 'x264'
    };

main();

function main() {
    "use strict";

    if (argv.help || argv.usage) {
        printUsage();
        process.exit(0);
    }

    var conversions,
        funcs,
        numSucceeded = 0,
        numErrors = 0;

    if (argv._.length > 0) {
        // Command line arguments were used.  Treat each one as a file glob.
        conversions = glob.sync(argv._);
    } else {
        // Consult config.js for conversion information.
        // todo: Invoking with zero arguments should probably show usage instead.
        conversions= require('./config');
    }

    //
    // At this point we should have some conversions.
    //
    if (conversions.length === 0) {
        console.log('No conversions specified.');
        process.exit(1);
    }

    //
    // Normalize the conversion objects to fill in any missing properties.
    //
    conversions = conversions.map(function (curConversion) {
        curConversion = normalizeConversion(curConversion);
        return curConversion;
    });

    //
    // Create an array of functions that will perform each conversion.
    //
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

    //
    // Run the conversions.
    //
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
// Prints usage information.
//
////////////////////////////////////////////////////////////////////////////////
function printUsage() {
    "use strict";

    var text = [
        "usage:",
        "    node handbrake-conv [--help | --usage]",
        "        Displays usage information for this program.",
        "",
        "    node handbrake-conv.js file1 [file2 file3 ...]",
        "        Converts the specified files to mkv files using the Universal",
        "        preset.",
        "",
        "    node handbrake-conv.js",
        "        Conversions will be read from config.js."
    ];

    console.log(text.join(os.EOL));
}


////////////////////////////////////////////////////////////////////////////////
//
// Executes an array of promise returning functions in order and returns a
// promise for the last one.
//
////////////////////////////////////////////////////////////////////////////////
function runSequence(funcs) {
    "use strict";
    return funcs.reduce(q.when, q('foo'));
}


////////////////////////////////////////////////////////////////////////////////
//
// Normalizes various configuration representations into a consistent object.
//
////////////////////////////////////////////////////////////////////////////////
function normalizeConversion(conversion) {
    "use strict";

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
    // Normalize the input file path.  This is done so that string comparisons
    // can be made with calculated output file names.
    // For example, filename.mpg needs to be equal to ./filename.mpg.
    //
    conversion.input = normalizePath(conversion.input);

    //
    // If output was not specified, assume a .mkv file in the same directory as the
    // input.
    //
    var inputPathParts,
        outputPath;

    // If the current conversion has an output file specified, do nothing.
    if (conversion.output === undefined) {
        inputPathParts = splitPath(conversion.input);
        outputPath = inputPathParts.dirName + '/' + inputPathParts.baseName + '.mkv';

        // If the outputPath we just formulated matches the input path, then
        // postfix the basename with a constant string to make the output
        // filename unique.
        if (outputPath === conversion.input) {
            outputPath = inputPathParts.dirName + '/' + inputPathParts.baseName + '-converted.mkv';
        }

        conversion.output = outputPath;
    }

    return conversion;
}


////////////////////////////////////////////////////////////////////////////////
//
// Returns an object with properties: dirName (does not include trailing "/"),
// baseName and extName (extName includes the ".").
//
////////////////////////////////////////////////////////////////////////////////
function splitPath(filePath) {
    "use strict";

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


function normalizePath(filePath) {
    "use strict";

    var pathParts = splitPath(filePath);
    return pathParts.dirName + '/' + pathParts.baseName + pathParts.extName;
}

////////////////////////////////////////////////////////////////////////////////
//
// Runs Handbrake with the specified configuration.
//
////////////////////////////////////////////////////////////////////////////////
function runHandbrake(config) {
    "use strict";

    var dfd = q.defer();

    var handbrake = hbjs.spawn(config);

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
