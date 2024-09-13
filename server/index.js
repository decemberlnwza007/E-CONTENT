const mysql = require('mysql2/promise');
const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const port = 8000;
const secret = process.env.JWT_SECRET || 'secret';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, secret, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
}));

app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret,
    resave: false,
    saveUninitialized: true
}));

let conn = null;

const initMySQL = async () => {
    conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'e-content',
        port: '3306'
    });
};

app.post('/register', async (req, res) => {
    try {
        const { username, password, name, lastname } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        const userData = { username, password: passwordHash, name, lastname };
        const [results] = await conn.query('INSERT INTO user SET ?', userData);
        res.json({ message: 'Register Success!', results });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).send({ message: 'Please provide username and password' });
        }
        const [results] = await conn.query('SELECT id, password FROM user WHERE username = ?', [username]);
        if (results.length === 0) {
            return res.status(400).send({ message: 'Invalid username or password' });
        }
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).send({ message: 'Invalid username or password' });
        }
        const token = jwt.sign({ username }, secret, { expiresIn: '1h' });
        res.send({ message: 'Login successfully!', token });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

app.get('/protected', authenticateToken, (req, res) => {
    res.send('This is a protected route');
});

app.get('/data/get', async (req, res) => {
    try {
        const [results] = await conn.query('SELECT * FROM data');
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

app.post('/data/add', upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file ? req.file.filename : null;
        const { date, sender, receiver, subject, note } = req.body;
        const newData = { date, sender, receiver, subject, file: filePath, note };
        const [results] = await conn.query('INSERT INTO data SET ?', [newData]);
        res.status(201).send({ message: 'Data added successfully', id: results.insertId });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

app.put('/data/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, sender, receiver, file, note } = req.body;
        if (!date || !sender || !receiver || !file || !note) {
            return res.status(400).send({ message: 'All fields are required' });
        }
        const updatedData = { date, sender, receiver, file, note };
        const [results] = await conn.query('UPDATE data SET ? WHERE id = ?', [updatedData, id]);
        if (results.affectedRows === 0) {
            return res.status(404).send({ message: 'Record not found' });
        }
        res.send({ message: 'Data updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

app.delete('/data/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [results] = await conn.query('DELETE FROM data WHERE id = ?', [id]);
        if (results.affectedRows === 0) {
            return res.status(404).send({ message: 'Record not found' });
        }
        res.send({ message: 'Data deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

app.listen(port, async () => {
    await initMySQL();
    console.log('Connected');
    console.log(`Server is running on port ${port}`);
});
