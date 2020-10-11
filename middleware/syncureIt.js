const fs = require("fs");
const AES = require('crypto-js/aes');
const enc = require('crypto-js/enc-utf8');

async function newEncryptIt(file) {

    const test = fs.readFileSync(file, {encoding: 'base64'});
    const ciphertext = AES.encrypt(test, process.env.AES_KEY).toString();
    fs.writeFileSync(file, ciphertext);
}

// async function newDecryptIt(file) {
//     const test = fs.readFileSync(file, {encoding: 'utf8'});
//     const bytes  = AES.decrypt(test, process.env.AES_KEY);
//     const originalText = bytes.toString(enc);
//     console.log(originalText);
//     fs.writeFileSync(file, originalText, {encoding: 'base64'});
// }

const syncureIt = async (req, res, next) => {
    try {
        
        if(req.file) {
            
            await newEncryptIt("./"+req.file.path);
            next();
           
        }   

    } catch(err) {
        res.json({
            message: "failure encrypting the media",
            errors: [err],
            status: "failure",
            data: {}
        });
    }
}

module.exports = syncureIt;