const S3 = require('aws-sdk/clients/s3')
const fs = require('fs')

// source: https://developers.cloudflare.com/r2/examples/aws-sdk-js/
const s3Factory = async (config) => {
  const s3 = new S3({
    endpoint: `https://${config.accountid}.r2.cloudflarestorage.com`,
    accessKeyId: `${config.access_key_id}`,
    secretAccessKey: `${config.access_key_secret}`,
    signatureVersion: 'v4'
  })

  console.log('s3 buckets:', await s3.listBuckets().promise())

  const listObjects = async (bucketName, folder) => {
    return await s3.listObjectsV2({
      Bucket: bucketName,
      Prefix: folder
    }).promise()
  }

  const getGetUrl = async (bucketName, key) => {
    return await s3.getSignedUrlPromise('getObject', { Bucket: bucketName, Key: key, Expires: 3600 })
  }

  const getPutUrl = async (bucketName, key) => {
    return await s3.getSignedUrlPromise('putObject', { Bucket: bucketName, Key: key, Expires: 3600 })
  }

  const uploadFile = async (bucketName, file, deleteAfterUpload = true) => {
    const fileStream = fs.createReadStream(file.path)

    if (!bucketName) throw new Error('bucketName is required')
    const uploadParams = {
      Bucket: bucketName,
      Body: fileStream,
      Key: file.filename
    }

    await s3.upload(uploadParams).promise()
    if (deleteAfterUpload) {
      await fs.promises.rm(file.path)
    }
    const s3Filename = file.filename
    return s3Filename
  }

  const downloadFile = async (bucketName, key, localPath) => {
    const downloadParams = {
      Bucket: bucketName,
      Key: key
    }

    const fileStream = fs.createWriteStream(localPath)
    await s3.getObject(downloadParams).createReadStream().pipe(fileStream)
  }

  // downloads a file from s3
  function getFileStream (bucketName, fileKey) {
    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName
    }

    return s3.getObject(downloadParams).createReadStream()
  }

  const s3Client = {
    listObjects,
    getGetUrl,
    getPutUrl,
    uploadFile,
    downloadFile,
    getFileStream
  }

  return s3Client
}

module.exports = s3Factory
