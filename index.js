const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const app = express();
const http = require('http');
const server = http.createServer(app);
const socketIO = require('socket.io');
const io = socketIO(server);
const port = 3000;

const Database = require("@replit/database");
const db = new Database();

const i18n = require('i18n');
const bcrypt = require('bcrypt');
const saltRounds = 10;

let connectedUsers = 0;
let date;
const link = /https:\/\/\S+/g;

function decrypt(passwordTest, password) {
  return bcrypt.compareSync(passwordTest, password);
}

function encrypt(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(saltRounds, function(err, salt) {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, function(err, hash) {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  });
}

i18n.configure({
  locales: ['en', 'fr', 'es'],
  defaultLocale: 'en',
  queryParameter: 'lang',
  directory: __dirname + '/locales',
  register: global,
});
app.use(session({
  secret: 'votre-secret-de-session',
  resave: false,
  saveUninitialized: true,
}));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('views'));
app.use(i18n.init);

function writeJSON() {
  db.list().then(async keys => {
    const data = {};
    for (const key of keys) {
      data[key] = await db.get(key);
    }
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFile('database.json', jsonData, 'utf8', function(err) {
      if (err) {
        console.log(err);
      }
      else {
        console.log('Keys and values have been written to database.json\n');
      }
    });
  });
}

db.delete("users").then(async () => {
  db.set("users", [
    {
      email: "test@test.test",
      username: "test",
      password: await encrypt("test"),
      color: "#00ffff",
      friends: ['a', 'b']
    },
    {
      email: "a@a.a",
      username: "a",
      password: await encrypt("a"),
      color: "#ff00ff",    
      friends: []
    },
    {
      email: "b@b.b",
      username: "b",
      password: await encrypt("b"),
      color: "#ffff00",
      friends: []
    }
  ]).then(() => {
    writeJSON();
  });
});

app.get('/', (req, res) => {
  if (req.session.loggedin) {
    res.redirect('/welcome');
  }
  else {
    res.render('index', {
      msg: {
        signup: res.__('signup'),
        login: res.__('login'),
        username: res.__('username'),
        password: res.__('password'),
        email: res.__('email'),
        confirm_password: res.__('confirm_password'),
        signup_error: false,
        login_error: false
      }
    });
  }
});

app.get('/welcome', (req, res) => {
  if (req.session.loggedin) {
    db.get("users").then(value => {
      var users = value;
      users.forEach(function(user) {
        if (user && user.password) {
          delete user.password;
        }
      });
      res.render('welcome', {
        msg: {
          username: res.__('username'),
          email: res.__('email'),
          title: res.__('title'),
          welcome: res.__('welcome'),
          info: res.__('info'),
          players: res.__('players'),
          disconnect: res.__('disconnect'),
          delete_account: res.__('delete_account'),
          friends: res.__('friends'),
          add_friend: res.__('add_friend'),
          remove_friend: res.__('remove_friend'),
          no_friends: res.__('no_friends'),
          search_user: res.__('search_user'),
          user_not_found: res.__('user_not_found'),
          user_connected: res.__('user_connected'),
          users_connected: res.__('users_connected'),
          home: res.__('home')
        },
        user: {
          username: req.session.username,
          email: req.session.email,
          color: req.session.color,
          friends: req.session.friends
        },
        users: users
      });
    });
  }
  else {
    res.redirect('/');
  }
});

app.get('/chat', (req, res) => {
  if (req.session.loggedin) {
    res.render('chat', {
      msg: {
        user_connected: res.__('user_connected'),
        users_connected: res.__('users_connected'),
        send: res.__('send'),
        message: res.__('message')
      },
      user: {
        username: req.session.username,
        color: req.session.color
      }
    });
  }
  else {
    res.redirect('/');
  }
});

app.post('/signup', (req, res) => {
  const email = req.body.signEmail;
  const username = req.body.signUsername;
  const password = req.body.signPassword;
  const confirmPassword = req.body.signConfirmPassword;
  //const color = req.body.signColor;
  if (password !== confirmPassword) {
    res.render('index', {
      msg: {
        signup: res.__('signup'),
        login: res.__('login'),
        username: res.__('username'),
        password: res.__('password'),
        email: res.__('email'),
        confirm_password: res.__('confirm_password'),
        signup_error: res.__('password_diff'),
        login_Error: false
      }
    });
  }
  else if (password.length < 6) {
    res.render('index', {
      msg: {
        signup: res.__('signup'),
        login: res.__('login'),
        username: res.__('username'),
        password: res.__('password'),
        email: res.__('email'),
        confirm_password: res.__('confirm_password'),
        signup_error: res.__('password_short'),
        login_Error: false
      }
    });
  }
  else if (username.length < 3) {
    res.render('index', {
      msg: {
        signup: res.__('signup'),
        login: res.__('login'),
        username: res.__('username'),
        password: res.__('password'),
        email: res.__('email'),
        confirm_password: res.__('confirm_password'),
        signup_error: res.__('username_short'),
        login_Error: false
      }
    });
  }
  else if (username.length > 20) {
    res.render('index', {
      msg: {
        signup: res.__('signup'),
        login: res.__('login'),
        username: res.__('username'),
        password: res.__('password'),
        email: res.__('email'),
        confirm_password: res.__('confirm_password'),
        signup_error: res.__('username_long'),
        login_Error: false
      }
    });
  }
  else {
    db.get("users").then(async value => {
      for (let i = 0; i < value.length; i++) {
        if (value[i].username === username) {
          res.render('index', {
            msg: {
              signup: res.__('signup'),
              login: res.__('login'),
              username: res.__('username'),
              password: res.__('password'),
              email: res.__('email'),
              confirm_password: res.__('confirm_password'),
              signup_error: res.__('user_exist'),
              login_error: false
            }
          }
          );
          return;
        }
        else if (value[i].email === email) {
          res.render('index', {
            msg: {
              signup: res.__('signup'),
              login: res.__('login'),
              username: res.__('username'),
              password: res.__('password'),
              email: res.__('email'),
              confirm_password: res.__('confirm_password'),
              signup_error: res.__('email_use'),
              login_error: false
            }
          }
          );
          return;
        }
      }
      const newUser = {
        email: email,
        username: username,
        password: await encrypt(password),
        color: "#ffffff",
        friends: []
      };
      value.push(newUser);
      db.set("users", value);
      writeJSON();
      db.get("users").then(value => {
        var users = value;
        users.forEach(function(user) {
          delete user.password;
        });
        req.session.loggedin = true;
        req.session.username = username;
        req.session.email = email;
        req.session.color = color;
        req.session.friends = [];
        res.redirect('/welcome');
      });
    });
  }
});

app.post('/login', (req, res) => {
  const email = req.body.logEmail;
  const password = req.body.logPassword;
  db.get("users").then(value => {
    if (value) {
      for (let i = 0; i < value.length; i++) {
        if (value[i].email === email) {
          if (decrypt(password, value[i].password)) {
            const username = value[i].username;
            const color = value[i].color;
            const friends = value[i].friends;
            db.get("users").then(value => {
              var users = value;
              users.forEach(function(user) {
                delete user.password;
              });
              req.session.loggedin = true;
              req.session.username = username;
              req.session.email = email;
              req.session.color = color;
              req.session.friends = friends;
              res.redirect('/welcome');
            });
            return;
          }
        }
        if (i === value.length - 1) {
          res.render('index', {
            msg: {
              signup: res.__('signup'),
              login: res.__('login'),
              username: res.__('username'),
              password: res.__('password'),
              email: res.__('email'),
              confirm_password: res.__('confirm_password'),
              signup_error: false,
              login_error: res.__('bad_email_or_password')
            }
          });
        }
      }
    }
  });
});

app.post('/disconnect', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.post('/deleteAccount', (req, res) => {
  if (req.session.loggedin) {
    db.get("users").then(value => {
      const email = req.session.email;
      const username = req.session.username;
      const updatedUsers = value.filter(user => user.email !== email && user.username !== username);
      db.set("users", updatedUsers);
      writeJSON();
      req.session.destroy(() => {
        res.redirect('/');
      });
    });
  }
  else {
    res.redirect('/');
  }
});

app.post('/addFriend/:friendUsername', (req, res) => {
  if (req.session.loggedin) {
    const username = req.session.username;
    const friends = req.session.friends;
    const friendUsername = req.params.friendUsername;
    if (!friends.includes(friendUsername) && friendUsername !== username) {
      db.get("users").then(value => {
        const users = value;
        const friend = users.find(user => user.username === friendUsername);
        const updateUser = users.map(user => {
          if (user.username === username) {
            return {
              ...user,
              friends: [...user.friends, friend.username]
            }
          }
          return user;
        });
        req.session.friends = updateUser.find(user => user.username === username).friends;
        db.set("users", updateUser);
        writeJSON();
        res.redirect('/welcome');
      });
    }
    else {
      res.redirect('/welcome');
    }
  }
  else {
    res.redirect('/');
  }
});

app.post('/removeFriend/:friendUsername', (req, res) => {
  if (req.session.loggedin) {
    const username = req.session.username;
    const friends = req.session.friends;
    const friendUsername = req.params.friendUsername;

    if (friends.includes(friendUsername)) {
      db.get("users").then(value => {
        const users = value;
        const updateUser = users.map(user => {
          if (user.username === username) {
            return {
              ...user,
              friends: user.friends.filter(friend => friend !== friendUsername)
            };
          }
          else {
            return user;
          }
        });

        req.session.friends = updateUser.find(user => user.username === username).friends;
        db.set("users", updateUser);
        writeJSON();
        res.redirect('/welcome');
      });
    }
    else {
      res.redirect('/welcome');
    }
  }
  else {
    res.redirect('/');
  }
});

app.use((req, res) => {
  res.status(404).render('404', { 
    msg: {
      title: res.__('404'),
      return_welcome: res.__('return_welcome')
    } 
  });
});

io.on('connection', (socket) => {
  socket.on('page', (page) => {
    if (page === 'chat') {
      console.log('Utilisateur connecté');
      connectedUsers++;
    }
    io.emit("connectedUsers", connectedUsers);
  });

  socket.on('disconnection', () => {
    if (connectedUsers > 0) {
      console.log('Utilisateur déconnecté');
      connectedUsers--;
      io.emit("connectedUsers", connectedUsers);
    }
  });

  socket.on('chat message', (msg, username, color) => {
    var liens = msg.match(link);
    if (liens) {
      msg = msg.replace(link, function(match) {
        return `<a href="${match}" target="_blank">${match}</a>`;
      });
    }
    date = new Date(Date.now())
    var hours = date.getHours() + 2;
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();
    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    if (!/^\s*$/.test(msg)) {
      io.emit('chat message', `<span class="user" style="color:${color};">${username}</span> <br> <span class="msg">${msg}</span> <span class="date">(${formattedTime})</span>`)
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
