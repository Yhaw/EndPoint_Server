// Import dependencies
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');


// Create a MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'users'
});

// Connect to the database
db.connect((err) => {
  if (err) throw err;
  console.log('MySQL connected');
});

// Create an Express app
const app = express();

// Use JSON middleware
app.use(cors('*'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



 app.post('/signup', (req, res) => {
   const { name, email, password , contact} = req.body;


   if(name == "" || email == '' || password == "" || contact == ""){
    res.send("Empty data");
   }
   else if(req == undefined){
    res.send("Bad request");
   }
   else{
   bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;

     const user = { name, email, password: hash, contact };
    db.query('INSERT INTO data SET ?', user, (err, result) => {
      if (err) throw err;
      res.send('User created');
    });
  });}
});

app.post('/login', (req, res) => {
   const { email, password } = req.body;


if (email == "" || password == "" || email == undefined || password == undefined){
    res.send("Empty data");
   }
   db.query('SELECT * FROM data WHERE email = ?', email, (err, results) => {
    if (err) throw err;

     if (results.length === 0) {
      res.status(401).send('Invalid email or password');
    } else {
       bcrypt.compare(password, results[0].password, (err, result) => {
        if (err) throw err;

         if (result) {
          const token = jwt.sign({ id: results[0].id }, 'azaykey');
          res.send({ token });
        } else {
          res.status(401).send('Invalid email or password');
        }
      });
    }
  });
});

 app.get('/protected', verifyToken, (req, res) => {
  res.send('Protected route');
});

 function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, 'azaykey', (err, user) => {
    if (err) return res.sendStatus(403);

    req.user = user;
    next();
  });
}

// Start the server
const port = 4000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
