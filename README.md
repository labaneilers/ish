ish (image settings helper)
======

ish will recurse through a directory, searching for -2x.png images, and determines the best compression format for them. If their current settings (via imagesettings.xml files) don't match the best format, an override imagesettings.xml file is written.

ish takes into account language directory rules (i.e. www* directories).


Usage
------------------

<pre>
Options:
   -v, --verbose       Print verbose results
   -h, --help          Show help
   -s, --save          Saves imagesettings.xml for files that are not in the ideal format
   -f, --force         Overwrites existing imagesettings.xml files that aren't in the correct format
   -c, --concurrency   Maximum number of ImageMagick processes to spawn at one time  [8]
   -n, --nocolor       Disable color output
</pre>

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

