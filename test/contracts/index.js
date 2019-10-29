const fs = require('fs')

const files = fs.readdirSync('./').filter(x => x.slice(-5) === '.json')
console.log(JSON.stringify(files))