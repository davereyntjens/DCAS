// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');

emailFactory = (services, config) => {

  sesConfig = config["aws.ses"]

  new AWS.Config({
    accessKeyId: sesConfig.accesskey,
    secretAccessKey: sesConfig.secretaccesskey,
    region: 'us-east-1'
  })
  AWS.config.update({region: 'us-east-1'})

  const sendEmail = async ({ to, subject, body }) => {
    // Create sendEmail params
    var params = {
      Destination: {
        CcAddresses: [],
        ToAddresses: [to]
      },
      Message: {
        Body: {
          /*
          Html: {
            Charset: "UTF-8",
            Data: "HTML_FORMAT_BODY"
          },
          */
          Text: {
            Charset: "UTF-8",
            Data: body
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: sesConfig.source_email,
      ReplyToAddresses: [sesConfig.source_email]
    }

    // Create the promise and SES service object
    await new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise()
  }

  services.email = {
    sendEmail
  }
}

module.exports = emailFactory
