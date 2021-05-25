'use strict';

const path = require('path');
const fs = require('fs');
const storeDir = '../../../brew-io-uploads/images';

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

exports.deleteImage = (filename) => {
  const filePath = path.join(__dirname, `${storeDir}/${filename}.jpg`);
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (error) => {
      if (error) {
        console.log('Image file removal error', error);
        resolve(error);
      }
      resolve(null);
    });
  });
}
