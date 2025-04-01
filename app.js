const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
const {parse, isValid} = require('date-fns')
console.log(dbPath)
let db
app.use(express.json())

const dbIntializer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000)
    console.log('Server is running on 3000')
  } catch (e) {
    console.log('error' + e)
  }
}

dbIntializer()

const checkPostReq = (req, res, next) => {
  const {status, priority, category, dueDate} = req.body
  console.log(dueDate)
  const validStatus = ['TO DO', 'IN PROGRESS', 'DONE']
  const validPriority = ['HIGH', 'MEDIUM', 'LOW']
  const validCategory = ['WORK', 'HOME', 'LEARNING']
  const parsedDate = parse(dueDate, 'yyyy-MM-dd', new Date())
  if (dueDate !== undefined) {
    if (!isValid(parsedDate)) {
      return res.status(400).send('Invalid Due Date')
    }
  }

  if (status !== undefined) {
    if (!validStatus.includes(status)) {
      return res.status(400).send('Invalid Todo Status')
    }
  }
  if (priority !== undefined) {
    if (!validPriority.includes(priority) && !priority !== undefined) {
      return res.status(400).send('Invalid Todo Priority')
    }
  }
  if (category !== undefined) {
    if (!validCategory.includes(category) && !category !== undefined) {
      return res.status(400).send('Invalid Todo Category')
    }
  }

  next()
}

const checkQuery = (req, res, next) => {
  const {status, priority, category} = req.query

  const validStatus = ['TO DO', 'IN PROGRESS', 'DONE']
  const validPriority = ['HIGH', 'MEDIUM', 'LOW']
  const validCategory = ['WORK', 'HOME', 'LEARNING']

  if (status !== undefined && priority !== undefined) {
    console.log('Checking status and priority:', status, priority)

    if (!validStatus.includes(status)) {
      return res.status(400).send('Invalid Todo Status')
    }
    if (!validPriority.includes(priority)) {
      return res.status(400).send('Invalid Todo Priority')
    }
    return next()
  }

  if (priority !== undefined) {
    console.log('Checking priority:', priority)

    if (!validPriority.includes(priority)) {
      return res.status(400).send('Invalid Todo Priority')
    }
    return next()
  }

  if (status !== undefined) {
    console.log('Checking status:', status)

    if (!validStatus.includes(status)) {
      return res.status(400).send('Invalid Todo Status')
    }
    return next()
  }
  if (category !== undefined && status !== undefined) {
    if (!validCategory.includes(category)) {
      res.status(400).send('Invalid Todo Category')
    }
    if (!validStatus.includes(status)) {
      res.status(400).send('Invalid Todo Status')
    }
    return next()
  }

  if (category !== undefined && priority !== undefined) {
    if (!validCategory.includes(category)) {
      res.status(400).send('Invalid Todo Category')
    }
    if (!validPriority.includes(priority)) {
      res.status(400).send('Invalid Todo Priority')
    }
    return next()
  }
  if (category !== undefined) {
    if (!validCategory.includes(category)) {
      return res.status(400).send('Invalid Todo Category')
    }
    return next()
  }

  next()
}

app.get('/todos/', checkQuery, async (req, res) => {
  const {search_q = '', priority = '', status = '', category = ''} = req.query
  const query = `SELECT id , todo , priority , status , category , due_date as dueDate FROM todo 
  WHERE todo LIKE "%${search_q}%" 
  AND priority LIKE "%${priority}%" 
  AND status LIKE "%${status}%" 
  AND category LIKE "%${category}%"`
  console.log(category)
  const ans = await db.all(query)
  res.send(ans)
})

app.get('/todos/:todoId/', async (req, res) => {
  const {todoId} = req.params
  const query = `select id , todo , priority , status , category , due_date as dueDate from todo where id = ${todoId}`
  const ans = await db.get(query)
  res.send(ans)
})

app.get('/agenda/', async (req, res) => {
  const {date} = req.query
  console.log(date)
  const parsedDate = parse(date, 'yyyy-MM-dd', new Date())

  if (!isValid(parsedDate)) {
    return res.status(400).send('Invalid Date Format')
  }

  const query = `select id , todo , priority , status , category , due_date as dueDate from todo where due_date = "${date}"`
  const ans = await db.all(query)
  res.send(ans)
})

app.post('/todos/', checkPostReq, async (req, res) => {
  const {id, todo, priority, status, category, dueDate} = req.body
  const query = `insert into todo values(${id} , "${todo}"  , "${priority}" ,   "${status}" ,"${category}"  , "${dueDate}")`
  const ans = await db.run(query)
  res.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', checkPostReq, async (req, res) => {
  const {todoId} = req.params
  const {status, priority, todo, category, dueDate} = req.body
  let query = ''

  if (status !== undefined) {
    query = `update todo set status = "${status}" where id = ${todoId}`
    response = 'Status Updated'
  } else if (priority !== undefined) {
    query = `update todo set priority = "${priority}"  where id = ${todoId}`
    response = 'Priority Updated'
  } else if (todo !== undefined) {
    query = `update todo set todo = "${todo}"  where id = ${todoId}`
    response = 'Todo Updated'
  } else if (category !== undefined) {
    query = `update todo set category = "${category}"  where id = ${todoId}`
    response = 'Category Updated'
  } else if (dueDate !== undefined) {
    query = `update todo set due_date = "${dueDate}"  where id = ${todoId}`
    response = 'dueDate Updated'
  }
  const ans = await db.run(query)
  res.send(response)
})

app.delete('/todos/:todoId/', async (req, res) => {
  const {todoId} = req.params
  const query = `delete from todo where id = ${todoId}`
  const ans = await db.run(query)
  res.send('Todo Deleted')
})

module.exports = app
