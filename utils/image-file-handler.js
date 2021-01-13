'use strict';

const path = require('path');
const fs = require('fs');
const storeDir = '../../brew-io-uploads/images';

exports.storeImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!path.extname(file.originalname).toLowerCase() === '.jpg') {
      reject({ status: 403, message: 'Invalid file type' });
    }

    const tmpPath = file.path;
    const targetPath = path.join(__dirname, `${storeDir}/${file.filename}.jpg`);

    fs.rename(tmpPath, targetPath, (error) => {
      if (error) {
        console.log('Image migration error', error);
        reject(error);
      }
      resolve(file);
    });
  });
};

exports.deleteTmpImage = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (error) => {
      if (error) {
        console.log('Image file removal error', error);
        reject(error);
      }
      resolve(null);
    });
  });
}
