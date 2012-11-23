# Node-PDFReader

A PDF reader for Node. Based on [PDF.JS](https://github.com/mozilla/pdf.js).

# WARNING

This is super experimental. It's more a proof of concept. Some terrible things:

* no test coverage
* hacked up code
* sync file operations to first store font files on disk and later read them again (yeah, it's really that awful)
* use special version of node-canvas to load fonts (not really tested)
* no windows support (due to lack of freetype support)

# Overview

Right now you can:

* Render single or all pages to PNG files
* Get the text content of single pages

# Installation

You need to have node and build tools installed.

If you haven't installed the cairo library or installed it but without with freetype support, you can install it by running this script (make sure to change into a directory, where you can store some temporary files created during the build process of the libraries):

```bash
$ cd <download-folder or somewhere you can put some temporary build-files>
$ bash <(curl -fsSk https://raw.github.com/jviereck/node-canvas/font/install)
```

Once that is done, install the dependencies:

```bash
$ npm install
```

This will fetch node-canvas and build it.

# Usage

See the example directory. You can run the example from the root directory using

```bash
$ node example/simple.js
```

This will show the text on the first page of the trace-monkey paper, render the frist page with a white background and all other pages in the PDF. The result is placed in the `example/` directory.

The code of the `simple.js` file looks like this:

```javascript
var PDFReader = require('../index').PDFReader;

function errorDumper(err) {
  if (err) {
    console.log('something went wrong :/');
    throw err;
  }
}

var pdf = new PDFReader(__dirname + '/trace.pdf');
pdf.on('error', errorDumper);
pdf.on('ready', function(pdf) {
  // Render a single page.
  pdf.render(1 /* First page */, {
    bg: true,  /* Enable white background */
    output: __dirname + '/page-single.png'
  }, errorDumper);

  // Render all pages.
  pdf.renderAll({
    output: function(pageNum) {
      return __dirname + '/page' + pageNum + '.png';
    }
  }, errorDumper);

  // Get the text content of single pages (similar to pdf2txt).
  pdf.getContent(1 /* First page */, function(err, content) {
    console.log(content);
  }, errorDumper);
});
```

# FAQ

## I get the error "Need to compile node-canvas/cairo with font support."

You need to have a version of cairo with freetype2 font support. Best is to first compile and install the freetype2 library and then compile cairo. At the end of running `./configure` when building cairo, you should see the freetype listed "yes" as one of the font backends.

## Is there windows support?

Not for rendering. I just haven't tested the special node-canvas build on windows, so I've disabled windows support.

## Can you please implement X?

No. I don't want to invest too much time in this project. It's a proof of concept for me. However, I'm happy to help others to implement missing features and accept PR :)

## Is that necessary to compile cairo/freetype/node-canvas just to extract text?

No. This was just the easiest way for me to get something out the door.
