const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const passport = require('passport')
const localStrategy = require('passport-local').Strategy
const ejs = require('ejs')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const methodOverride = require('method-override')
const mysql = require('mysql2')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const { constants } = require('fs/promises')
const MongoClient = require('mongodb').MongoClient

// user details database setup
const uri =
  'mongodb+srv://owusuansaj:X7mSvk5OomL7NFAQ@cluster0.lcwv4fv.mongodb.net/node-auth-CarMS?retryWrites=true&w=majority'

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.info('Connected to DB')
  })
  .catch((e) => {
    console.log('Error: ', e)
  })

const app = express()

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
})

const User = mongoose.model('user', userSchema)

//upload images database setup
const imageSchema = new mongoose.Schema({
  image: {
    data: Buffer,
    contentType: String,
  },
})

const ImageModel = mongoose.model('Image', imageSchema)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
})

const upload = multer({ storage: storage })

// //sql connection
const mysqlConnection = mysql.createConnection({
  host: 'eu-cdbr-west-03.cleardb.net',
  user: 'bf933f1bdc65eb',
  password: 'a35e51f1',
  database: 'heroku_89b2fb9136451f1',
})

mysqlConnection.connect((err) => {
  if (!err) console.log('DB connection succeeded')
  else {
    console.log(
      'DB connection failed \n Error :' + JSON.stringify(err, undefined, 2)
    )
  }
})

app.set('view engine', 'ejs')
app.use('/', express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(cookieParser('secret'))
app.use(
  session({
    secret: 'secret',
    cookie: { maxAge: 60000 },
    resave: true,
    saveUninitialized: true,
  })
)
app.use(flash())
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

// get requests
app.get('/', (req, res) => {
  const message = req.flash('success')
  res.render('homepage', { message })
})

app.get('/homepage', (req, res) => {
  const message = req.flash('success')
  res.render('homepage', { message })
})

app.get('/login', (req, res) => {
  const message = req.flash('error')
  res.render('login', { message })
})

app.get('/register', (req, res) => {
  const message = req.flash('error')
  res.render('register', { message })
})

app.post('/test', (req, res) => {
  const newUser = new User({
    name: 'admin',
    email: 'admin@gmail.com',
    password: 'jawara',
  })

  newUser.save()
  res.send(newUser)
})

app.get('/timetable', (req, res) => {
  res.render('timetable')
})

app.get('/kanban', (req, res) => {
  ImageModel.find({}, (err, images) => {
    if (err) {
      console.log(err)
      res.status(500).send('An error occured', err)
    } else {
      res.render('kanban', { images: images })
    }
  })
})

app.get('/', (req, res) => {
  let sql1 = 'SELECT SUM(Amount) AS TotalPartsOrdered FROM ordersdb'

  let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
    if (!err1) {
      // res.render('index.ejs',{
      //   orders:rows
      // });
      console.log('Fetched total amount from ordersdb')
      total_sales = rows1
      console.log(typeof rows1)

      let sql2 = 'SELECT COUNT(PartID) AS NumberOfProducts FROM ordersdb'

      let query2 = mysqlConnection.query(sql2, (err2, rows2, fields2) => {
        if (!err2) {
          // res.render('index.ejs',{
          //   orders:rows
          // });
          ord_num = rows2
          console.log('Fetched total no. of orders from ordersdb')

          let sql3 = 'SELECT COUNT(PartID) AS NumberOfProducts FROM stockdb'

          let query3 = mysqlConnection.query(sql3, (err3, rows3, fields3) => {
            if (!err3) {
              // res.render('index.ejs',{
              //   orders:rows
              // });
              console.log('Fetched total no. of stocks from stockdb')
              stock_num = rows3

              let sql4 = 'SELECT SUM(Amount) AS TotalPartsOrdered FROM stockdb'
              let query4 = mysqlConnection.query(
                sql4,
                (err4, rows4, fields4) => {
                  if (!err3) {
                    total_stock = rows4
                    res.render('index.ejs', {
                      total_sales: rows1,
                      ord_num: rows2,
                      stock_num: rows3,
                      total_stock: rows4,
                    })
                  } else console.log(err4)
                }
              )
            } else console.log(err3)
          })
        } else console.log(err2)
      })
    } else console.log(err1)
  })
  // res.render('index.ejs', { name: req.user.name })

  // console.log(total_sales)
  // console.log(ord_num)
  // console.log(stock_num)
})

app.get('/employees', (req, res) => {
  mysqlConnection.query('SELECT * FROM warehouse', (err, rows, fields) => {
    if (!err) res.send(rows)
    else console.log(err)
  })
})

//View Orders
app.get('/orders', (req, res) => {
  let sql =
    'SELECT TransactionID,SUM(Amount) as Amount,TransactionDate,TransactionTime FROM ordersdb GROUP BY TransactionID'

  let query = mysqlConnection.query(sql, (err, rows, fields) => {
    if (!err) {
      let sql1 = 'SELECT * FROM ordersdb'
      let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
        if (!err1) {
          res.render('orders', {
            orders: rows,
            sub_orders: rows1,
            selected_part: 'None',
            month_name: 'None',
            year: 'None',
          })
        } else console.log(err1)
      })
    } else console.log(err)
  })
})

//View Stocks
app.get('/viewstocks', (req, res) => {
  let sql =
    'SELECT * FROM stockdb ORDER BY TYear DESC,Tmonth DESC, TDay DESC,StockTime DESC'

  let query = mysqlConnection.query(sql, (err, rows, fields) => {
    if (!err) {
      let sql1 = 'SELECT * FROM producersdb'
      let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
        if (!err1) {
          let sql2 = 'SELECT * FROM categorydb'
          let query2 = mysqlConnection.query(sql2, (err2, rows2, fields2) => {
            if (!err2) {
              res.render('viewstocks', {
                all_stocks: rows,
                producers: rows1,
                categories: rows2,
                display_content: 'None',
                filter_type: 'None',
                filter_name: 'None',
              })
            } else console.log(err2)
          })
        } else console.log(err1)
      })
    } else console.log(err)
  })
})

//Billing
app.get('/billing', (req, res) => {
  let sql1 = 'SELECT * FROM categorydb'

  let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
    if (!err1) {
      var category = rows1
      let sql2 = 'SELECT * FROM producersdb'
      let query2 = mysqlConnection.query(sql2, (err2, rows2, fields2) => {
        if (!err2) {
          var producers = rows2
          let sql3 = 'SELECT * FROM suppliersdb'
          let query3 = mysqlConnection.query(sql3, (err3, rows3, fields3) => {
            if (!err3) {
              var suppliers = rows3
              console.log(typeof category)
              console.log(category)
              console.log(producers)
              console.log(suppliers)
              res.render('billing', {
                category: category,
                producers: producers,
                suppliers: suppliers,
              })
            } else console.log(err3)
          })
        } else console.log(err2)
      })
    } else console.log(err1)
  })
})

//View Categories
app.get('/categories', (req, res) => {
  let sql1 = 'SELECT * FROM categorydb'
  let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
    if (!err1) {
      var category = rows1
      res.render('categories.ejs', { category: category })
    } else console.log(err1)
  })
})

//View Producers
app.get('/Producers', (req, res) => {
  let sql2 = 'SELECT * FROM producersdb'
  let query2 = mysqlConnection.query(sql2, (err2, rows2, fields2) => {
    if (!err2) {
      var producers = rows2
      res.render('producers', { producers: producers })
    } else console.log(err2)
  })
})

//View Suppliers
app.get('/suppliers', (req, res) => {
  let sql2 = 'SELECT * FROM suppliersb'
  let query2 = mysqlConnection.query(sql2, (err2, rows2, fields2) => {
    if (!err2) {
      var suppliers = rows2
      res.render('suppliers', { suppliers: suppliers })
    } else console.log(err2)
  })
})

//View Stocks
app.get('/stocks', (req, res) => {
  let sql1 = 'SELECT * FROM categorydb'

  let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
    if (!err1) {
      var category = rows1
      let sql2 = 'SELECT * FROM producersdb'
      let query2 = mysqlConnection.query(sql2, (err2, rows2, fields2) => {
        if (!err2) {
          var producers = rows2
          let sql3 = 'SELECT * FROM suppliersdb'
          let query3 = mysqlConnection.query(sql3, (err3, rows3, fields3) => {
            if (!err3) {
              var suppliers = rows3
              console.log(typeof category)
              console.log(category)
              console.log(producers)
              console.log(suppliers)
              res.render('stocks', {
                category: category,
                producers: producers,
                suppliers: suppliers,
              })
            } else console.log(err3)
          })
        } else console.log(err2)
      })
    } else console.log(err1)
  })
  // res.render('stocks.ejs')
})

//Sales Filter
app.get('/salesFilter', (req, res) => {
  rows = {}
  res.render('salesFilter', {
    is_paramater_set: false,
    time_type: 'none',
    filter_type: 'none',
    display_content: rows,
    month_name: 'None',
    year: 'None',
    total_amount: 'None',
  })
})

app.get('/stockFilter', (req, res) => {
  res.render('stockFilter.ejs', {
    filter_type: 'None',
    display_content: {},
    total_parts: {},
  })
})

//POST requests

//Stocks Query Filter
app.post('/stocks_query', (req, res) => {
  let sql =
    'SELECT * FROM stockdb ORDER BY TYear DESC,Tmonth DESC, TDay DESC,StockTime DESC'

  let query = mysqlConnection.query(sql, (err, rows, fields) => {
    if (!err) {
      let sql1 = 'SELECT * FROM producersdb'
      let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
        if (!err1) {
          let sql2 = 'SELECT * FROM categorydb'
          let query2 = mysqlConnection.query(sql2, (err2, rows2, fields2) => {
            if (!err2) {
              var selected_part = req.body['exampleRadios']
              if (selected_part == 'producers') {
                var producers_name = req.body['selected_producers']
                let sql3 = `SELECT * FROM stockdb WHERE Producers='${producers_name}'`
                let query3 = mysqlConnection.query(
                  sql3,
                  (err3, rows3, fields3) => {
                    if (!err3) {
                      res.render('viewstocks', {
                        all_stocks: rows,
                        producers: rows1,
                        categories: rows2,
                        display_content: rows3,
                        filter_type: 'producers',
                        filter_name: producers_name,
                      })
                    } else console.log(err3)
                  }
                )
              }

              if (selected_part == 'category') {
                var category_name = req.body['selected_category']
                let sql3 = `SELECT * FROM stockdb WHERE Category='${category_name}'`
                let query3 = mysqlConnection.query(
                  sql3,
                  (err3, rows3, fields3) => {
                    if (!err3) {
                      res.render('viewstocks', {
                        all_stocks: rows,
                        producers: rows1,
                        categories: rows2,
                        display_content: rows3,
                        filter_type: 'category',
                        filter_name: category_name,
                      })
                    } else console.log(err3)
                  }
                )
              }
            } else console.log(err2)
          })
        } else console.log(err1)
      })
    } else console.log(err)
  })
})

//Fetch Part by ID
app.post('/fetchpart', (req, res) => {
  part_id = req.body.partid
  console.log(req.body)

  let sql = 'SELECT * FROM stockdb WHERE PartID = ?'
  var response = {
    status: 'success',
    success: 'Updated Successfully',
  }

  let query = mysqlConnection.query(sql, [part_id], (err, rows, fields) => {
    if (!err) {
      console.log(rows)
      // res.render('viewstocks',{
      //   orders:rows
      // });
      res.json({ success: 'Updated Successfully', status: 200, rows: rows })
    } else console.log(err)
  })
})

//Add New Category
app.post('/addcategory', (req, res) => {
  let sql = `INSERT INTO categorydb(Category) VALUES ('${req.body.new}') `
  let query = mysqlConnection.query(sql, (err, rows, fields) => {
    if (!err) {
      res.redirect('/categories')
    } else console.log(err)
  })
})

//Add New Producer
app.post('/addproducers', (req, res) => {
  let sql = `INSERT INTO producersdb(Producers) VALUES ('${req.body.new}') `
  let query = mysqlConnection.query(sql, (err, rows, fields) => {
    if (!err) {
      res.redirect('/producers')
    } else console.log(err)
  })
})

//Add New Supplier
app.post('/addsupplier', (req, res) => {
  let sql = `INSERT INTO suppliersdb(Suppliers) VALUES ('${req.body.new}') `
  let query = mysqlConnection.query(sql, (err, rows, fields) => {
    if (!err) {
      res.redirect('/suppliers')
    } else console.log(err)
  })
})

//Orders Filter Query
app.post('/orders_query', (req, res) => {
  var time_type = req.body['exampleRadios']
  if (time_type == 'month') {
    var month = req.body['selected_month']
    var year = req.body['selected_year']

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    var month_name = monthNames[parseInt(month - 1)]

    let sql = `SELECT TransactionID,SUM(Amount) as Amount,TransactionDate,TransactionTime FROM ordersdb WHERE TMonth = ${month} AND TYear = ${year} GROUP BY TransactionID`

    let query = mysqlConnection.query(sql, (err, rows, fields) => {
      if (!err) {
        let sql1 = 'SELECT * FROM ordersdb'
        let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
          if (!err1) {
            res.render('orders', {
              orders: rows,
              sub_orders: rows1,
              selected_part: 'month',
              month_name: month_name,
              year: year,
            })
          } else console.log(err1)
        })
      } else console.log(err)
    })
  }

  if (time_type == 'year') {
    var year = req.body['selected_year']

    let sql = `SELECT TransactionID,SUM(Amount) as Amount,TransactionDate,TransactionTime FROM ordersdb WHERE TYear = ${year} GROUP BY TransactionID`

    let query = mysqlConnection.query(sql, (err, rows, fields) => {
      if (!err) {
        let sql1 = 'SELECT * FROM ordersdb'
        let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
          if (!err1) {
            res.render('orders', {
              orders: rows,
              sub_orders: rows1,
              selected_part: 'year',
              month_name: 'None',
              year: year,
            })
          } else console.log(err1)
        })
      } else console.log(err)
    })
  }
})

//Stock Filter
app.post('/stock_filter_query', (req, res) => {
  var filter_type = req.body['exampleRadios1']
  if (filter_type == 'producers') {
    let sql =
      'SELECT Producers,count(*) AS Count,SUM(Amount) AS Amount FROM stockdb GROUP BY Producers'
    let query = mysqlConnection.query(sql, (err, rows, fields) => {
      if (!err) {
        let sql1 = 'SELECT count(*) AS Count FROM stockdb'
        let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
          if (!err1) {
            res.render('stock_filter', {
              filter_type: filter_type,
              display_content: rows,
              total_parts: rows1,
            })
          } else console.log(err1)
        })
      } else console.log(err)
    })
  }
  if (filter_type == 'category') {
    let sql =
      'SELECT Category,count(*) AS Count,SUM(Amount) AS Amount FROM stockdb GROUP BY Category'
    let query = mysqlConnection.query(sql, (err, rows, fields) => {
      if (!err) {
        let sql1 = 'SELECT count(*) AS Count FROM stockdb'
        let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
          if (!err1) {
            res.render('stock_filter', {
              filter_type: filter_type,
              display_content: rows,
              total_parts: rows1,
            })
          } else console.log(err1)
        })
      } else console.log(err)
    })
  }
})

//Sales Filter
app.post('/sales_filter_query', (req, res) => {
  console.log(req.body)
  var time_type = req.body['exampleRadios']

  if (time_type == 'month') {
    var month = req.body['selected_month']
    var year = req.body['selected_year']

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    var month_name = monthNames[parseInt(month - 1)]
    console.log(month_name)
    if (req.body['exampleRadios1'] == 'all') {
      let sql = `SELECT TransactionDate,count(*) as Count,SUM(Amount) as Amount FROM ordersdb WHERE TMonth = ${month} AND TYear = ${year} GROUP BY TransactionDate`
      let query = mysqlConnection.query(sql, (err, rows, fields) => {
        if (!err) {
          let sql1 = `SELECT SUM(Amount) as Amount,count(*) AS Count FROM ordersdb WHERE TMonth = ${month} AND TYear = ${year}`
          let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
            if (!err1) {
              var total_amount = rows1
              res.render('sales_filter.ejs', {
                is_paramater_set: true,
                time_type: 'month',
                filter_type: 'all',
                display_content: rows,
                month_name: month_name,
                year: year,
                total_amount: total_amount,
              })
            } else console.log(err1)
          })
        } else console.log(err)
      })
    }

    if (req.body['exampleRadios1'] == 'producers') {
      let sql = `SELECT Producers,count(*) AS Count,SUM(Amount) as Amount FROM ordersdb WHERE TMonth=${month} AND TYear = ${year} GROUP BY Producers`
      let query = mysqlConnection.query(sql, (err, rows, fields) => {
        if (!err) {
          let sql1 = `SELECT SUM(Amount) as Amount,count(*) AS Count FROM ordersdb WHERE TMonth = ${month} AND TYear = ${year}`
          let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
            if (!err1) {
              var total_amount = rows1
              res.render('sales_filter', {
                is_paramater_set: true,
                time_type: 'month',
                filter_type: 'producers',
                display_content: rows,
                month_name: month_name,
                year: year,
                total_amount: total_amount,
              })
            } else console.log(err1)
          })
        } else console.log(err)
      })
    }

    if (req.body['exampleRadios1'] == 'category') {
      let sql = `SELECT Category,count(*) AS Count,SUM(Amount) as Amount FROM ordersdb WHERE TMonth=${month} AND TYear = ${year} GROUP BY Category`
      let query = mysqlConnection.query(sql, (err, rows, fields) => {
        if (!err) {
          let sql1 = `SELECT SUM(Amount) as Amount,count(*) AS Count FROM ordersdb WHERE TMonth = ${month} AND TYear = ${year}`
          let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
            if (!err1) {
              var total_amount = rows1
              res.render('sales_filter', {
                is_paramater_set: true,
                time_type: 'month',
                filter_type: 'category',
                display_content: rows,
                month_name: month_name,
                year: year,
                total_amount: total_amount,
              })
            } else console.log(err1)
          })
        } else console.log(err)
      })
    }
  }

  if (time_type == 'year') var year = req.body['selected_year']

  if (req.body['exampleRadios1'] == 'all') {
    let sql = `SELECT TMonth,count(*) as Count,SUM(Amount) as Amount FROM ordersdb WHERE TYear = ${year} GROUP BY TMonth`
    let query = mysqlConnection.query(sql, (err, rows, fields) => {
      if (!err) {
        let sql1 = `SELECT SUM(Amount) as Amount,count(*) AS Count FROM ordersdb WHERE TYear = ${year}`
        let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
          if (!err1) {
            var total_amount = rows1
            res.render('sales_filter.ejs', {
              is_paramater_set: true,
              time_type: 'year',
              filter_type: 'all',
              display_content: rows,
              month_name: 'None',
              year: year,
              total_amount: total_amount,
            })
          } else console.log(err1)
        })
      } else console.log(err)
    })
  }

  if (req.body['exampleRadios1'] == 'producers') {
    let sql = `SELECT Producers,count(*) AS Count,SUM(Amount) as Amount FROM ordersdb WHERE TYear = ${year} GROUP BY Producers`
    let query = mysqlConnection.query(sql, (err, rows, fields) => {
      if (!err) {
        let sql1 = `SELECT SUM(Amount) as Amount,count(*) AS Count FROM ordersdb WHERE TYear = ${year}`
        let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
          if (!err1) {
            var total_amount = rows1
            res.render('sales_filter', {
              is_paramater_set: true,
              time_type: 'year',
              filter_type: 'producers',
              display_content: rows,
              month_name: 'None',
              year: year,
              total_amount: total_amount,
            })
          } else console.log(err1)
        })
      } else console.log(err)
    })
  }

  if (req.body['exampleRadios1'] == 'category') {
    let sql = `SELECT Category,count(*) AS Count,SUM(Amount) as Amount FROM ordersdb WHERE TYear = ${year} GROUP BY Category`
    let query = mysqlConnection.query(sql, (err, rows, fields) => {
      if (!err) {
        let sql1 = `SELECT SUM(Amount) as Amount,count(*) AS Count FROM ordersdb WHERE TYear = ${year}`
        let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1) => {
          if (!err1) {
            var total_amount = rows1
            res.render('sales_filter.ejs', {
              is_paramater_set: true,
              time_type: 'year',
              filter_type: 'category',
              display_content: rows,
              month_name: 'None',
              year: year,
              total_amount: total_amount,
            })
          } else console.log(err1)
        })
      } else console.log(err)
    })
  }
})

//Submit Bill
app.post('/submitbill', (req, res) => {
  console.log(`\nRequest body = `)
  console.log(req.body)
  var request1 = req.body

  var date_format = new Date()
  var transaction_date =
    date_format.getDate() +
    '/' +
    parseInt(date_format.getMonth() + 1).toString() +
    '/' +
    date_format.getFullYear()
  var transaction_time =
    date_format.getHours() +
    ':' +
    date_format.getMinutes() +
    ':' +
    date_format.getSeconds()
  var transaction_id =
    'SHW' +
    date_format.getDate() +
    date_format.getMonth() +
    date_format.getFullYear() +
    date_format.getHours() +
    date_format.getMinutes() +
    date_format.getSeconds()
  let new_req = {}

  var part_ids = []

  for (i in request1) {
    if (i.includes('partid')) {
      part_ids.push(request1[i])
    }
  }

  for (i in request1) {
    if (i.includes('number') || i.includes('total')) {
      delete i
    } else new_req[i] = request1[i]
  }

  const data = Object.entries(new_req).reduce((carry, [key, value]) => {
    const [text] = key.split(/\d+/)
    const index = key.substring(text.length) - 1
    if (!Array.isArray(carry[index])) carry[index] = []
    carry[index].push(value)
    return carry
  }, [])

  for (let i = 0; i < data.length; i++) {
    data[i].push(transaction_date)
    data[i].push(transaction_time)
    data[i].push(transaction_id)
    data[i].push(date_format.getDate())
    data[i].push(date_format.getMonth() + 1)
    data[i].push(date_format.getFullYear())
  }

  console.log(`\nINSERT Array = `)
  console.log(data)
  let sql = `INSERT INTO ordersdb(PartID,PartName,Category,Producers,Suppliers,Amount,CustomerNumber,TransactionDate,TransactionTime,TransactionID,TDay,TMonth,TYear) VALUES ? `
  let query = mysqlConnection.query(sql, [data], (err, rows, fields) => {
    if (!err) {
      console.log('Successfully inserted values into ordersdb')
      var sql2 = 'DELETE FROM stockdb WHERE PartID = ?'
      for (j = 0; j < part_ids.length; j++) {
        var query2 = mysqlConnection.query(
          sql2,
          [part_ids[j]],
          (err2, rows2, fields2) => {
            if (!err2) {
              console.log(
                'Successfully deleted corresponding values from stockdb'
              )
              // res.redirect('/orders')
            } else console.log(err2)
          }
        )
      }
      res.redirect('/orders')

      // res.redirect('/orders')
    } else console.log(err)
  })
})

//Submit Stock
app.post('/submitstock', (req, res) => {
  console.log(req.body)
  var request1 = req.body

  var date_format = new Date()
  var transaction_date =
    date_format.getDate() +
    '/' +
    parseInt(date_format.getMonth() + 1).toString() +
    '/' +
    date_format.getFullYear()
  console.log(parseInt(date_format.getMonth() + 1).toString())
  var transaction_time =
    date_format.getHours() +
    ':' +
    date_format.getMinutes() +
    ':' +
    date_format.getSeconds()
  let new_req = {}

  for (i in request1) {
    if (i.includes('number') || i.includes('total')) {
      delete i
    } else new_req[i] = request1[i]
  }

  const data = Object.entries(new_req).reduce((carry, [key, value]) => {
    const [text] = key.split(/\d+/)
    const index = key.substring(text.length) - 1
    if (!Array.isArray(carry[index])) carry[index] = []
    carry[index].push(value)
    return carry
  }, [])

  for (let i = 0; i < data.length; i++) {
    data[i].push(transaction_date)
    data[i].push(transaction_time)
    data[i].push(date_format.getDate())
    data[i].push(date_format.getMonth() + 1)
    data[i].push(date_format.getFullYear())
  }

  let sql = `INSERT INTO stockdb(PartID,PartName,Category,Producers,Suppliers,Amount,StockDate,StockTime,TDay,TMonth,TYear) VALUES ? `
  let query = mysqlConnection.query(sql, [data], (err, rows, fields) => {
    if (!err) {
      console.log('Successfully inserted values')
      res.redirect('/viewstocks')
    } else console.log(err)
  })
})

//Delete Order
app.post('/deletepart', (req, res) => {
  console.log('deletepart called')
  var deletepart = req.body.deletepart
  let sql = 'DELETE FROM ordersdb WHERE PartID = ?'
  let query = mysqlConnection.query(sql, [deletepart], (err, rows, fields) => {
    if (!err) {
      console.log('Successfully deleted a value')
      res.redirect('/orders')
    } else console.log(err)
  })
})

//Delete Category
app.post('/deletecategory', (req, res) => {
  console.log('deletecategory called')
  var deleteid = req.body.deleteid
  let sql = 'DELETE FROM categorydb WHERE Category = ?'
  let query = mysqlConnection.query(sql, [deleteid], (err, rows, fields) => {
    if (!err) {
      console.log('Successfully deleted a category')
      res.redirect('/categories')
    } else console.log(err)
  })
})

//Delete Producer
app.post('/deleteproducers', (req, res) => {
  console.log('deleteproducers called')
  var deleteid = req.body.deleteid
  let sql = 'DELETE FROM producersdb WHERE Producers = ?'
  let query = mysqlConnection.query(sql, [deleteid], (err, rows, fields) => {
    if (!err) {
      console.log('Successfully deleted a producer')
      res.redirect('/producers')
    } else console.log(err)
  })
})

//Delete Suppliers
app.post('/deletesuppliers', (req, res) => {
  console.log('deletesupplier called')
  var deleteid = req.body.deleteid
  let sql = 'DELETE FROM suppliersdb WHERE Suppliers = ?'
  let query = mysqlConnection.query(sql, [deleteid], (err, rows, fields) => {
    if (!err) {
      console.log('Successfully deleted a supplier')
      res.redirect('/suppliers')
    } else console.log(err)
  })
})

//Delete Stock
app.post('/deletestock', (req, res) => {
  console.log('deleteitem called')
  var deleteid = req.body.deleteid
  let sql = 'DELETE FROM stockdb WHERE PartID = ?'
  let query = mysqlConnection.query(sql, [deleteid], (err, rows, fields) => {
    if (!err) {
      console.log('Successfully deleted a value')
      res.redirect('/viewstocks')
    } else console.log(err)
  })
})

app.post('/uploadPhoto', upload.single('myImage'), (req, res) => {
  const obj = {
    img: {
      data: fs.readFileSync(
        path.join(__dirname + '/uploads/' + req.file.filename)
      ),
      contentType: 'image/jpeg',
    },
  }
  const newImage = new ImageModel({
    image: obj.img,
  })
  newImage.save((err) => {
    err ? console.log(err) : res.redirect('/kanban')
  })
})

//Authenticate new/old users
app.post('/register', async (req, res) => {
  const exists = await User.exists({ email: req.body.email })

  if (exists) {
    req.flash('error', 'User already exists')
    res.redirect('/register')
    return
  }

  console.log(req.body.name, req.body.email, req.body.password)

  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  })

  await user.save((err) => {
    if (err) return console.log('ERROR: ', err)
    console.log('saved')
    req.flash('success', 'Successfully registered!')
    res.redirect('/homepage')
  })
})

//login new users
app.post('/login', (req, res) => {
  const userEmail = req.body.email
  const userPassword = req.body.password

  User.findOne({ email: userEmail }, (err, foundUser) => {
    if (err) {
      return console.log('hey', err)
    }
    if (!foundUser || foundUser.password !== userPassword) {
      req.flash('error', 'Incorrect credentials, Please try again')
      return res.redirect('/login')
    }
    req.flash('success', 'Successfully logged In, Welcome!')
    res.redirect('/')
    console.log(req.body)
  })
})

app.listen(process.env.PORT || 3001, () => {
  console.log('Server running on port 3000')
})
