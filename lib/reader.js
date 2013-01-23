/**
 * Module dependencies.
 */

var Canvas = require('canvas')
  , Font = Canvas.Font
  , fs = require('fs')
  , EventEmitter = require('events').EventEmitter
  , util = require('util')
  ;


// -----------------------------------------------------------------------------
// HACKING :P
// ---

var PDFJS = require('./pdf.js');

// === Some NODE specific stuff.
// Turn of worker support for now.
PDFJS.disableWorker = true;

PDFJS.createScratchCanvas = function nodeCreateScratchCanvas(width, height) {
  var canvas = new Canvas(width, height);
  return canvas;
};

// Change the font loader logic - THERE IS NO DOM HERE.
PDFJS.FontLoader.bind = function nodeFontLoaderBind(pdf, fonts, callback) {
	if (!Font) {
		throw new Error("Need to compile node-canvas/cairo with font support.");
	}


  for (var i = 0, ii = fonts.length; i < ii; i++) {
    var font = fonts[i];

    // Add the font to the DOM only once or skip if the font
    // is already loaded.
    if (font.attached || font.loading == false) {
      continue;
    }
    font.attached = true;

    var data = font.data;

    // Some fonts don't come with data.
    if (!data) {
      continue;
    }

    var fontName = font.loadedName;
    var fontFile = 'temp/' + pdf._idx + '_' + fontName + '.ttf';

    // Temporary hack for loading the font. Write it to file such that a font
    // object can get created from it and use it on the context.
    var buf = new Buffer(data);

    fs.writeFileSync(fontFile, buf);
    var fontObj = new Font(fontName, fontFile);

    pdf.useFont(fontObj);
  }

  callback();
};

// === Let's get started

var idxCounter = 0

function PDFReader(path) {
  EventEmitter.call(this);

  var self = this;

  this.fontList = [];
  this.busyContextList = [];
  this._useFont = this._useFont.bind(this);
  this._idx = idxCounter++;

  var buf = this._loadPDF(path);

  // PDFJS.getDocument might return right away, but then the listerns
  // for the `ready` event are not bound yet.
  // Delay the function until the next tick.
  process.nextTick(function() {
    // Basic parsing of the PDF document.
    PDFJS.getDocument(buf).then(function(pdf) {
      pdf.useFont = self._useFont;
      pdf._idx = self._idx;

      self.pdf = pdf;
      self.emit('ready', self);

    }, function(err) {
      console.log('error');
      self.emit('error', err);
    });
  });
}

util.inherits(PDFReader, EventEmitter);

PDFReader.prototype._useFont = function(font) {
  this.fontList.push(font);
  this.busyContextList.forEach(function(ctx) {
    ctx.addFont(this);
  }, font);
};

PDFReader.prototype._addBusyContext = function(context) {
  this.busyContextList.push(context);

  // Make context know all already loaded fonts.
  this.fontList.forEach(function(font) {
    context.addFont(font);
  });
};

PDFReader.prototype._removeBusyContext = function(context) {
  var list = this.busyContextList;
  list.splice(list.indexOf(context), 1);
};

PDFReader.prototype._loadPDF = function(path) {
   // TODO: Check file exist.
  var state = fs.statSync(path);
  var size = state.size;
  var buf = new Buffer(size);

  var fd = fs.openSync(path, 'r');
  fs.readSync(fd, buf, 0, size, 0);

  // Set the buffer length, such that the PDF.JS `isArrayBuffer` think it's
  // a real typed-array buffer ;)
  buf.byteLength = size;
  return buf;
};

PDFReader.prototype._pdfNotReady = function(callback) {
  callback('PDF not ready yet');
};

PDFReader.prototype.render = function(pageNum, opt, callback) {
  var pdf = this.pdf;
  var self = this;

  if (!pdf) {
    return this._pdfNotReady(callback);
  }

  opt.scale = opt.scale || 1.0;

  pdf.getPage(pageNum).then(function(page) {

    var viewport = page.getViewport(opt.scale);

    var canvas = new Canvas(viewport.width, viewport.height);
    var context = canvas.getContext('2d');

    // Store reference to the context, such that new loaded fonts can be
    // registered. Also adds in all already loaded fonts in the PDF on the
    // context.
    self._addBusyContext(context);

    if (opt.bg) {
      context.save();
      context.fillStyle = 'white';
      context.fillRect(0, 0, viewport.width, viewport.height);
      context.restore();
    }

    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    page.render(renderContext).then(function() {
      var file = '';
      if (typeof opt.output === 'string') {
        file = opt.output;
      } else {
        // TODO: Error handling if it's not a function.
        file = opt.output(pageNum);
      }

      console.log('finished page: %d - write to file: %s', pageNum, file);

      var out = fs.createWriteStream(file);
      var stream = canvas.createPNGStream();

      stream.on('data', function(chunk){
        out.write(chunk);
      });

      stream.on('end', function() {
        self._removeBusyContext(context);
        callback();
      });
    }, function(error) {
      self._removeBusyContext(context);
      callback(error);
    });
  });
};

PDFReader.prototype.renderAll = function(opt, callback) {
  if (!this.pdf) {
    return this._pdfNotReady(callback);
  }

  var numPages = this.pdf.numPages;
  var i = 1;
  var next = function() {
    if (i > numPages) {
      callback();
      return;
    }

    this.render(i, opt, function(err) {
      if (err) {
        callback(err);
        return;
      }
      i++;
      next();
    });
  };
  next = next.bind(this);
  next();
};

PDFReader.prototype.getContent = function(pageNum, callback) {
  var pdf = this.pdf;
  if (!pdf) {
    return this._pdfNotReady(callback);
  }

  pdf.getPage(pageNum).then(function(page) {
    page.getTextContent().then(function(arr) {
      // TODO: Handle RTL properly here.
      var content = arr.bidiTexts.map(function(bit) {
        return bit.str;
      }).join(' ');
      callback(null, content);
    }, function(err) {
      callback(err);
    });
  }, function(err) {
    callback(err);
  });
};

exports.PDFReader = PDFReader;
