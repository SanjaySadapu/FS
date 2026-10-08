const fs = require('fs').promises;

async function writeFileAsync() {
  try {
    await fs.writeFile('newfile.txt', 'Hello World!');
    console.log('File saved.');
  } catch (err) {
    console.error('Error writing file:', err);
  }
}


async function readFileAsync() {
    try {
        const data = await fs.readFile('newfile.txt','utf8');
        console.log(data)
    }catch(err){
        console.error('Error reading file: ',err);
    }
}


readFileAsync()
writeFileAsync()