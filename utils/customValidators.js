const path = require('path');

exports.isImage = (filename) => {
  const extension = (path.extname(filename)).toLowerCase();
  switch (extension) {
      case '.jpg':
          return '.jpg';
      case '.jpeg':
          return '.jpeg';
      case  '.png':
          return '.png';
      default:
          return false;
  }  
}

exports.isPDF = (filename) => {
  const extension = (path.extname(filename)).toLowerCase();
  return extension == '.pdf';  
}