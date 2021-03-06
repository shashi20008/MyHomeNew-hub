'use strict';
const path = require('path');
const fs = require('fs');
const DeviceModel = require('../models/devices');
const { decrypt } = require('../libs/crypto');
const crypto = require('crypto');

module.exports = function (req, res) {
  console.log(req.headers);

  // if current version same return 304

  const { name, id } = req.params;

  DeviceModel.findOne({name}).lean()
    .then(({encryptionKey}) => {
      if(!encryptionKey) {
        throw new Error('DEV_NOT_FOUND');
      }

      const decryptedTxt = decrypt(id, encryptionKey, 'utf8');
      const [filePath, frameNum] = decryptedTxt.split('-');

      if(!filePath || isNaN(frameNum)) {
        throw new Error('INVALID_ID_IN_REQ');
      }

      const fullPath = path.join(__dirname, '..', filePath);
      fs.readFile(fullPath, function(err, buffer) {
        if(err) {
          console.error('firmware read error', err.message);
          return;
        }

        const md5Hash = crypto.createHash('md5').update(buffer).digest('hex');

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', 'attachment; filename=firmware.bin');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('x-MD5', md5Hash);

        res.end(buffer);
      });
    })
    .catch(err => {
      console.log('FIRMWARE_STREAM_FAILED', err.message);
      res.status(400).json({ error: err.message });
    });
};
