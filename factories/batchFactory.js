/*
* What is a general purpose batch processing architecture?
* 1. Use the database as a source of tasks ... poll the database
* 2. Use a queue to distribute tasks to workers (bull) .. . this is not persistent
* 3. Flag completed tasks in the database
*/

const { Queue, Worker } = require('bullmq')

function batchFactory (isWorker, mysqlClient, mysqlTableName, queueName) {
  const workerConcurrency = 1
  const options = {
    priority: 'high',
    delay: 1000
  }
  const myQueue = new Queue(queueName)

  if (!isWorker) {
    const pollForJobs = async () => {
      console.log('Polling for jobs')
      const rows = await mysqlClient.queryAsync(`SELECT * FROM ${mysqlTableName} WHERE status = 'pending'`)
      for (const row of rows) {
        console.log('Adding job: ' + row.id)
        const job = await myQueue.add('paint',{
          data: 'my row data',
          rowId: row.id // JSON.stringify(row, null, 2)
        })
        await mysqlClient.queryAsync(`UPDATE ${mysqlTableName} SET status = 'queued' WHERE id = ${row.id}`)
      }
    }
    setInterval(async () => {
      await pollForJobs()
    }, 1000)

  } else {

    const worker = new Worker(queueName, async (job) => {
      console.log('Processing job: ' + job.id)
      const result = await processJobAndReturnResult(job)
      console.log('Job result: ' + JSON.stringify(result))
      return result
    })
    worker.on('completed', async(job, returnvalue) => {
      console.log('Job completed with result ' + returnvalue)
      const fields = Object.keys(returnvalue)
      const values = Object.values(returnvalue)
      const updates = fields.map(field => `${field} = ?`).join(',')
      const sql = `UPDATE ${mysqlTableName} SET ${updates} WHERE id = ${job.data.rowId}`

      await mysqlClient.queryAsync(sql, values)
      await mysqlClient.queryAsync(`UPDATE ${mysqlTableName} SET status = 'completed' WHERE id = ?`, [job.data.rowId])
    })
  }
}

module.exports = batchFactory