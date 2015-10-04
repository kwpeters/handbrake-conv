# handbrake-conv
An easier way to invoke handbrake.

# How to Use

## From the command line
You can invoke handbrake-conv directly from the command line, specifying the files you wish to convert.

```
node handbrake-conv file1 [, file2, file3, ...]
```

The "Unversal" preset will be used along with the x256 encoder and a MKV container.

## Specifying conversions in config.js
You can also specify the conversions to perform by modifying config.js.  Then, to start simply run:

```
node handbrake-conv
```
