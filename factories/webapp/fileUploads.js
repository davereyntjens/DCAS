const session = require('express-session')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const { FILE_UPLOAD } = require('../DOSGuardFactory.js')

// Makes it so that req.files is present on all post requests ...
// <form method="post" enctype="multipart/form-data"> // enctype is important!
//   <input type="file" name="file" />
//   <input type="submit" value="Upload" />
// </form>

async function fileUploadsFactory (services) {
  const { config, dosGuard } = services
  const { file_upload_folder } = config.webapp.file_upload

  await fs.promises.mkdir(file_upload_folder, { recursive: true })

  const cleanOldFiles = async (millies) => {
    for (const file of await fs.promises.readdir(file_upload_folder)) {
      const stats = await fs.promises.stat(path.join(file_upload_folder, file))
      const now = new Date().getTime()
      const endTime = new Date(stats.ctime).getTime() + millies
      if (now > endTime) {
        await fs.promises.unlink(path.join(file_upload_folder, file))
      }
    }
  }

  setInterval(() => {
    cleanOldFiles(config.file_upload_folder, 1000 * 60 * 5)
  }, 1000 * 60 * 5) // every 5 minutes

  const fileuploadMiddleware = multer({
    dest: file_upload_folder,
    limits: {
      // see https://www.npmjs.com/package/multer#limits
      fileSize: 1024 * 1024 * 10, // 10 MB
      files: 5
    },
    fileFilter: (req, file, cb) => {
      dosGuard.throttle(FILE_UPLOAD, {
        ip: req.ip,
        session: req.session,
        user: req.user
      }).then( () => {
        cb(null, true)
      }).catch((err) => {
        cb(err)
      })
    }
  }).any()

  services.middlewares = services.middlewares || {}
  services.middlewares.fileuploadMiddleware = fileuploadMiddleware
}

module.exports = fileUploadsFactory
