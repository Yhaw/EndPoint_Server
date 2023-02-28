const express = require('express');
const bcrypt = require('bcrypt');
const pg = require('pg');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

const config = {
  connectionString: 'postgres://azay:8H0vRDrfyKk9suxUhPx0GKs6U7sjQwbm@dpg-cfuvstd3t39doav3ufag-a/azay123',
};

const pool = new pg.Pool(config);

app.use(express.json());
app.use(cors('*'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/signup', async (req, res) => {
  try {
    const { email, username, password, contact } = req.body;
    if (!username || !email || !password || !contact) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE email=$1', [email]);
    if (result.rowCount > 0) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertResult = await client.query(
      'INSERT INTO users(username, email, password, contact) VALUES($1, $2, $3, $4) RETURNING id, email, username, contact',
      [username, email, hashedPassword, contact],
    );

    const token = jwt.sign({ id: insertResult.rows[0].id }, 'azaykey');

    res.status(201).json({ message: 'User created successfully', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);

    const user = result.rows[0];
    client.release();

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, 'azaykey');
    res.status(200).json({
      message: 'User logged in successfully',
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const createTable = async () => {
    const pool = new pg.Pool({
        connectionString: 'postgres://azay:8H0vRDrfyKk9suxUhPx0GKs6U7sjQwbm@dpg-cfuvstd3t39doav3ufag-a/azay123',
        ssl: {
        rejectUnauthorized: false,
      },
    });
  
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          contact TEXT NOT NULL
        )
      `);
      console.log('Table created successfully');
    } catch (error) {
      console.error(error);
    } finally {
      client.release();
    }
  };
  
  createTable();
  
  app.listen(port, () => {
    console.log(`Server running`);
  });
   
