# Node-PDFReader

A PDF reader for Node. Based on [PDF.JS](https://github.com/mozilla/pdf.js).

# WARNING

This is super experimental. It's more a proof of concept. Some terrible things:

* no test coverage
* hacked up code
* sync file operations to first store font files on disk and later read them again
* use special version of node-cairo to load fonts (not really tested)

# Usage

Look at the example file:

```
node example/simple.js
```

Right now you can:

* Render single or all pages to PNG files
* Get the text content of single pages

# FAQ

## I get the error "Need to compile node-canvas/cairo with font support."

You need to have a version of cairo with freetype2 font support. Best is to first compile and install the freetype2 library and then compile cairo. At the end of running `./configure`, you should see the freetype listed "yes" as one of the font backends.

## Is there windows support?

No. I just haven't tested the special node-canvas build on windows, so I've disabled windows support.

## Can you please implement X?

No. I don't want to invest too much time in this project. It's a proof of concept for me. However, I'm happy to help others to implement missing features and accept PR :)
