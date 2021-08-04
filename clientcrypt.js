const crypto = require('crypto')
const fs = require('fs')
const { pipeline } = require('stream')
const path = require('path')
// import { argv } from 'process'

const algorithm = 'aes-128-ctr'

let key = ''
let encryptFlag = false
let decryptFlag = false
let filePath = ''

const encrypt = (fileToEncrypt) => {
    let inputStream = fs.createReadStream(fileToEncrypt)
    let encStream = fs.createWriteStream(fileToEncrypt + '.enc')
   
    // Create initialization Vector
    const iv = crypto.randomBytes(16)

    // Create new cipher using algorith, key, and IV
    const cipher = crypto.createCipheriv(algorithm, key, iv)

    // Create new encrypted buffer
    // const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()])
    encStream.write(iv)
    pipeline(inputStream, cipher, encStream, (err) => {
        if (err) throw err;
    })

    inputStream.on('close', () => {
        fs.unlink(fileToEncrypt, (err => {
            if (err) console.log(err)
            else {
                console.log('deleted file ... ' + fileToEncrypt)
            }
        }))
    })
}

const decrypt = (inputPath, outputPath) => {
    const readiv = fs.createReadStream(inputPath, {end: 15})

    let iv
    readiv.on('data', (chunk) => {
        iv = chunk
    })

    readiv.on('close', () => {
        const readStream = fs.createReadStream(inputPath, {start: 16})
        const decipher = crypto.createDecipheriv(algorithm, key, iv)
        const writeStream = fs.createWriteStream(outputPath)

        pipeline(readStream, decipher, writeStream, (err) => {
            if (err) throw err;
        })

        readStream.on('close', () => {
            fs.unlink(inputPath, (err => {
                if (err) console.log(err)
                else {
                    console.log('deleted file ... ' + inputPath)
                }
            }))
        })
    })
}

const cryptoDir = (directory, stack) => {
    fs.readdirSync(directory, { withFileTypes: true }).forEach(file => {
        targetFile = directory + file.name

        if (file.isDirectory()) {
            try {
                listDir(targetFile + '\\', stack)
            } catch (e) { }
        } else if (file.isFile()) {
        
            if(encryptFlag) {
                encrypt(targetFile)
                console.log(`encrypting ... ${directory}${file.name}`)
            }            
            
            if(decryptFlag) {
                if (path.extname(file.name) == ".enc") {
                    decrypt(targetFile, targetFile.substr(0, targetFile.length - 4))
                    console.log('Decrypting File ... ' + targetFile)
                }
            }            
        }
    })
}

const helpMsg = () => {
    console.log('\nFLAGS' + '\n' +
                '  -e "/path/to/some folder/" = Encrypt all files recursively within folder' + '\n' + 
                '  -d "/path/to/some folder/" = Decrypt all files recursively within folder' + '\n' +
                '  -p "encryption passphrase" = Passphrase. Do not lose this as you will not be able to decrypt without it' + '\n\n' +
                'INFO' + '\n' +
                '  encrypt and decrypt flags cannot be used together.' + '\n' +
                '  passhrase is mandetory. without the passphrase the script will not execute' + '\n\n' +
                'EXAMPLE' + '\n' +
                '  node crypt.js -e "/path/to/some folder/" -p "SECRET"\n')
}

const validate = () => {
    var myArgs = process.argv.slice(2)
    if (myArgs.length != 4) {
        helpMsg()
        return false
    }

    for (const arg in myArgs) {
        argNum = Number(arg)

        if (myArgs[arg] == '-e') {
            encryptFlag = true
            filePath = myArgs[argNum+1]
        }

        if (myArgs[arg] == '-d') {
            decryptFlag = true
            filePath = myArgs[argNum + 1]
        }

        if (myArgs[arg] == '-p') {
            key = crypto.createHash('sha256').update(myArgs[argNum + 1]).digest('base64').substr(0, 16);
        }
    }

    if ((encryptFlag && decryptFlag) || (!encryptFlag && !decryptFlag) || key == '') {
        return false
    } else {
        return true
    } 
}

const __MAIN__ = () => {
    if(validate()) {
        cryptoDir(filePath)
    }
}
__MAIN__()