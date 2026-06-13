const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const app = express();
const PORT = process.env.WEB_PORT || 3000;
const WEB_USER = process.env.WEB_USER || 'admin';
const WEB_PASSWORD = process.env.WEB_PASSWORD || 'admin123';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'discord-bot-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

function requireAuth(req, res, next) {
  if (req.session.authenticated) return next();
  res.redirect('/login');
}

// Auth routes
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === WEB_USER && password === WEB_PASSWORD) {
    req.session.authenticated = true;
    req.session.user = username;
    return res.redirect('/');
  }
  res.render('login', { error: 'Falscher Benutzername oder Passwort!' });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  if (req.session.authenticated) return res.redirect('/');
  res.render('login', { error: null });
});

app.get('/', requireAuth, (req, res) => {
  res.render('dashboard', { user: req.session.user, activePage: 'dashboard' });
});

// API routes
app.use('/api', require('./routes/api'));

app.listen(PORT, () => {
  console.log(`  🌐 Web Dashboard: http://localhost:${PORT}`);
  console.log(`  🔑 Login: ${WEB_USER} / ${WEB_PASSWORD}\n`);
});

module.exports = app;
