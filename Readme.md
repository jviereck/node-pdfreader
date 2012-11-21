# Node-PDFReader

A PDF reader for Node. Based on [PDF.JS](https://github.com/mozilla/pdf.js).

# WARNING

This is super experimental. It's more a proof of concept. Some terrible things:

* no test coverage
* hacked up code
* sync file operations to first store font files on disk and later read them again (yeah, it's really that awful)
* use special version of node-canvas to load fonts (not really tested)

# Overview

Right now you can:

* Render single or all pages to PNG files
* Get the text content of single pages

# Usage

See the example directory. You can run the example from the root directory using

```bash
$ node example/simple.js
```

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
    output: __dirname + '/page-single.png'
  }, errorDumper);

  // Render all pages.
  pdf.renderAll({
    output: function(pageNum) {
      return __dirname + '/page' + pageNum + '.png';
    }
  }, errorDumper);

  // Get the text content of a single page.
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
