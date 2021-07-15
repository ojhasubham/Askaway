const fs = require('fs');
const path = require('path');
const Axios = require('axios');

const dirname = process.cwd();

module.exports.downloadAndSaveFile = (url, folderPath, filename) => new Promise(async (resolve, reject) => {
  const filePath = path.resolve(dirname, folderPath, filename);
  const writer = fs.createWriteStream(filePath);
  console.log('downloading ', filename);

  const response = await Axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  writer.on('finish', () => {
    console.log('saved ', filename);
    resolve(true);
  });

  writer.on('error', () => {
    console.log('error in saving ', filename);
    resolve(false);
  });
});

module.exports.getFile = (folderPath, filename) => new Promise(resolve => {
  const filePath = path.join(dirname, folderPath, filename);
  if (fs.existsSync(filePath)) {
    resolve(filePath);
  } else {
    resolve(false);
  }
});
