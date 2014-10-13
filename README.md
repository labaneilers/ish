ish (image settings helper)
======

ish will recurse through a directory, searching for -2x.png images, and determines the best compression format for them. If their current settings (via imagesettings.xml files) don't match the best format, an override imagesettings.xml file is written.

ish takes into account language directory rules (i.e. www* directories).


Usage
------------------

<pre>
Options:
   -v, --verbose       Print verbose results
   --friendly          Print results in a friendly, non-technical (less-parsable) form
   -h, --help          Show help
   -s, --save          Saves imagesettings.xml for files that are not in the ideal format
   -f, --force         Overwrites existing imagesettings.xml files that aren't in the correct format
   -c, --concurrency   Maximum number of ImageMagick processes to spawn at one time  [6]
   -n, --nocolor       Disable color output
</pre>

Examples
------------------

Run ish in the current directory, processing all images recursively.
```shell
ish ./
```

Run ish in the current directory, processing all images recursively, creating imagesettings.xml files for all images that don't have the correct settings, and that don't already have an explicit imagesettings.xml.
```shell
ish ./ -s
```

Run ish in the current directory, processing all images recursively, creating imagesettings.xml files for all images that don't have the correct settings, overwriting any explicit imagesettings.xml files.
```shell
ish ./ -s -f
```

Run ish on the file paths piped in from a git command.
```shell
{some git command} | ish -s
```

Installation
------------------

ish requires the following:

* ImageMagick
  * Windows: http://www.imagemagick.org/script/binary-releases.php#windows
  * Mac: http://cactuslab.com/imagemagick/
* [node.js](http://nodejs.org) version 0.10.0 or higher.

Once you have node.js, run the following:

```shell
npm install {ish directory} -g
```

