// Core Requires
const crypto = require('crypto')
const fs = require('fs')
const { pipeline } = require('stream')
const path = require('path')

// Global Variables
const algorithm = 'aes-128-ctr'
let key = ''
let encryptFlag = false
let decryptFlag = false
let filePath = ''
// =============================

/**
 * This function will take a file path and encrypt the file and delete the unencrypted file
 * @param {string} fileToEncrypt - singular file path 
 */
const encrypt = (fileToEncrypt) => {
    // Create file streams to read and write
    let inputStream = fs.createReadStream(fileToEncrypt)
    let encStream = fs.createWriteStream(fileToEncrypt + '.enc')
   
    // Create initialization Vector
    const iv = crypto.randomBytes(16)

    // Create new cipher using algorith, key, and IV
    const cipher = crypto.createCipheriv(algorithm, key, iv)

    // Create new encrypted buffer
    encStream.write(iv)
    pipeline(inputStream, cipher, encStream, (err) => {
        if (err) throw err;
    })

    // Once all data is read from uncrypted, delete the original
    inputStream.on('close', () => {
        fs.unlink(fileToEncrypt, (err => {
            if (err) console.log(err)
            else {
                console.log('deleted file ... ' + fileToEncrypt)
            }
        }))
    })
}

/**
 * this function will take the encrypted file and decrypt it. It will also deleted the encrypted file
 * @param {string} inputPath - file path of encrypted file
 * @param {string} outputPath - file path to decrypt file to
 */
const decrypt = (inputPath, outputPath) => {
    // Read each file's init vector
    const readiv = fs.createReadStream(inputPath, {end: 15})

    let iv
    readiv.on('data', (chunk) => {
        iv = chunk
    })

    // After reading the IV (close event), read the rest of the file
    readiv.on('close', () => {
        const readStream = fs.createReadStream(inputPath, {start: 16})
        const decipher = crypto.createDecipheriv(algorithm, key, iv)
        const writeStream = fs.createWriteStream(outputPath)

        // Decrypt the readstream and pipe to a new unencrypted file
        pipeline(readStream, decipher, writeStream, (err) => {
            if (err) throw err;
        })

        // Once finished reading the encrypted file delete the encrypted file
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

/**
 * This function will recursively iterate through files and folders to encrypt or decrypt.
 * @param {string} directory - Directory Path
 */
const cryptoDir = (directory) => {
    fs.readdirSync(directory, { withFileTypes: true }).forEach(file => {
        targetFile = directory + file.name

        // If the file is a folder then recursively call this function
        if (file.isDirectory()) {
            try {
                cryptoDir(targetFile + '/')
            } catch (e) { 
                console.log(e)
            }
        } else if (file.isFile()) {

            // Check to see if we're encrypting
            if(encryptFlag) {
                encrypt(targetFile)
                console.log(`encrypting ... ${targetFile}`)
            }            
            
            // Check to see if we're decrypting
            if(decryptFlag) {
                if (path.extname(file.name) == ".enc") {
                    let unencryptedFileName = targetFile.substr(0, targetFile.length - 4)
                    decrypt(targetFile, unencryptedFileName)
                    console.log('Decrypting File ... ' + targetFile)
                }
            }            
        }
    })
}

/**
 * This function prints a help message on how to use the tool
 */
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


/**
 * this function will validate the arguments passed into the application
 * @returns boolean on success or failure
 */
const validate = () => {
    var myArgs = process.argv.slice(2)
    
    //if total args does not equal 4, fail
    if (myArgs.length != 4) {
        helpMsg()
        return false
    }

    // Parse through args
    for (const arg in myArgs) {
        argNum = Number(arg)

        // Set encrypt flag to true
        if (myArgs[arg] == '-e') {
            encryptFlag = true
            filePath = myArgs[argNum+1]
        }

        // Set decrypt flag to true
        if (myArgs[arg] == '-d') {
            decryptFlag = true
            filePath = myArgs[argNum + 1]
        }

        // Set passphrase
        if (myArgs[arg] == '-p') {
            key = crypto
                .createHash('sha256')
                .update(myArgs[argNum + 1])
                .digest('base64')
                .substr(0, 16);
        }
    }

    // Encrypt and Decrypt flags cant both be set to true or false simulaniously or be provided an empty passphrase
    if ((encryptFlag && decryptFlag) || (!encryptFlag && !decryptFlag) || key == '') {
        helpMsg()
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