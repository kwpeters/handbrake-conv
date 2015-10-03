var hbjs = require('handbrake-js');


var info = {
    input: 'Bubble Guppies s02e02.m4v',
    output: 'Bubble Guppies s02e02 (test output).mkv'
};

var hbConfig = {
    input: info.input,
    output: info.output
};

var hb = hbjs.spawn;
hb.on('error', function onError(err) {
    console.log('Error!');
    console.log(err);
});

hb.on('start', function onStart() {
    console.log('Start (CLI launched)');
});

hb.on('begin', function onBegin() {
    console.log('Begin (encoding has begun)');
});

hb.on('progress', function onProgress(progress) {
    console.log(
        "Task %d of %d, percent complete: %s, ETA: %s",
        progress.taskNumber,
        progress.taskCount,
        progress.percentComplete,
        progress.eta
    );
});
hb.on('output', function onOutput(output) {
    console.log('Output:');
    console.log(output);
});

hb.on('end', function onEnd() {
    console.log('End (encoding completed)');
});

hb.on('complete', function onComplete() {
    console.log('Complete (CLI exited)');
});
