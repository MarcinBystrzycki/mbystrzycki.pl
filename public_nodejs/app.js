const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const uuid = require('uuid');
const app = express();
const nodemailer = require('nodemailer');
const history = require('connect-history-api-fallback');

dotenv.config();

// database query builder
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
  },
  acquireConnectionTimeout: 10000,
});

// const whitelist = process.env.DB_WHITELISTED_ORIGIN.split(',');
// const corsOptions = {
//   methods: ['GET', 'POST', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'X-Requested-With'],
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       console.log('whitelist', origin)
//       callback(null, true);
//     } else {
//       console.log('origin', origin)
//       callback(new Error('Not allowed by CORS'));
//     }
//   }
// };

// middlewares
app.use(express.static(path.join(__dirname, '../public_html/')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cors(corsOptions));

const parseUserID = (idToken) => {
  if (jwt.decode(idToken).sub) {
    return jwt.decode(idToken).sub.replace('auth0|', '');  
  } else {
    return null;
  }
};

// routes
app.get('/', (req, res) => {
  res.sendFile('/public_html/portfolio_page/index.html', {root: '..'});
});

app.get('/redirect', (req, res) => {
  res.sendFile('/public_html/portfolio_page/redirect.html', {root: '..'});
});

app.get('/moviedb', (req, res) => {
  res.sendFile('/public_html/moviedb_search/build/index.html', {root: '..'});
});

app.get('/todoapp', (req, res) => {
  res.sendFile('/public_html/react_redux_todo/build/index.html', {root: '..'});
});

app.get('/kanban', (req, res) => {
  res.sendFile('/public_html/kanban_board/build/index.html', {root: '..'});
});

app.get(['/cashvue', '/cashvue/*'], (req, res) => {
  res.sendFile('/public_html/cash_vue/dist/index.html', {root: '..'});
});

// nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS
    }
});

// nodemailer post
app.post('/', (req, res) => {

  const mailOptions = {
    from: 'PortfolioNodemailer <nodemailerportfolio@gmail.com>',
    to: process.env.NODEMAILER_EMAIL, 
    subject: req.body.subject, 
    text: req.body.message, 
    html: '<p>My email: <b>' + req.body.email + '</b></p><p>' + req.body.message + '</p>'
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent:' + info.response);
    }
  });

  res.redirect('/redirect');
});

// cashvue endpoints
app.get('/get/users/:id_token', (req, res) => {

  knex.select().from('usersSettings').where({ id: parseUserID(req.params.id_token) })
    .then((result) => {
      res.send(result);
    })
    .catch((error) => {
      console.log('Get user exception:', error);
    });

});

app.get('/get/accounts/:id_token', (req, res) => {
  const userID = parseUserID(req.params.id_token);

  knex.select().from('accounts').where({ userID })
    .then((accounts) => {
      knex.select()
        .from('notes')
        .where({ userID })
        .orderBy('index', 'desc')
        .then((notes) => {
          res.send({
            accounts,
            notes
          });
        });
    })
    .catch((error) => {
      console.log('Get accounts exception:', error);
    });

});

app.get('/get/accounts/info/:id', (req, res) => {

  knex.select().from('settlements').where({ accountID: req.params.id })
    .then((results) => {
      res.send(results);
    })
    .catch((error) => {
      console.log('Get account info exception:', error);
    });

});

app.post('/post/user', (req, res) => {

  knex('usersSettings')
    .where({ id: parseUserID(req.body.tokenID) })
    .update({
      name: req.body.user.name,
      lastname: req.body.user.lastname,
      email: req.body.user.email,
      birthDate: req.body.user.birthDate,
      nickname: req.body.user.nickname,
      gender: req.body.user.gender
    })
    .then((results) => {
      res.sendStatus(200);
    })
    .catch((error) => {
      console.log('Update user profile exception:', error);
    });
    
});

app.post('/post/accounts/add', (req, res) => {

  knex('accounts')
    .insert({
      id: uuid.v4(),
      userID: parseUserID(req.body.tokenID),
      name: req.body.account.name,
      initialBalance: req.body.account.initialBalance,
      actualBalance: req.body.account.initialBalance,
      defaultCurrency: req.body.account.defaultCurrency,
      color: req.body.account.color
    })
    .then((results) => {
      res.sendStatus(200);
    })
    .catch((error) => {
      console.log('Add account exception:', error);
    });

});

app.post('/post/accounts/update', (req, res) => {

  knex('accounts')
    .where({ id: req.body.id })
    .update({
      name: req.body.name,
      actualBalance: req.body.actualBalance,
      defaultCurrency: req.body.defaultCurrency,
      color: req.body.color
    })
    .then((results) => {
      res.sendStatus(200);
    })
    .catch((error) => {
      console.log('Update account exception:', error);
    });

});

app.post('/post/settlements/add', (req, res) => {

  knex('settlements')
    .insert({
      id: uuid.v4(),
      name: req.body.name,
      accountID: req.body.accountID,
      type: req.body.type,
      amount: req.body.amount,
      category: req.body.category,
      time: req.body.time,
      place: req.body.place
    })
    .then((results) => {

      if (req.body.type === 'expense') {
        knex('accounts')
          .where({ id: req.body.accountID })
          .decrement('actualBalance', req.body.amount)
          .then(() => {
            res.sendStatus(200);
          });
      } else {
        knex('accounts')
          .where({ id: req.body.accountID })
          .increment('actualBalance', req.body.amount)
          .then(() => {
            res.sendStatus(200);
          });
      }

    })
    .catch((error) => {
      console.log('Add setllement exception:', error);
    });

});

app.post('/post/settlements/update', (req, res) => {
  let actualAmount, accountID, type;

  knex.select()
    .from('settlements')
    .where({ id: req.body.id })
    .then((results) => {
      actualAmount = results[0].amount || 0;
      accountID = results[0].accountID || '';
      type = results[0].type || '';

      if (req.body.amount > actualAmount) {
        const difference = (req.body.amount - actualAmount).toFixed(2);

        if (type === 'expense') {
          knex('accounts')
            .where({ id: accountID })
            .decrement('actualBalance', difference)
            .then(() => {

              knex('settlements')
                .where({ id: req.body.id })
                .update({
                  name: req.body.name,
                  amount: req.body.amount,
                  category: req.body.category,
                  time: req.body.time,
                  place: req.body.place
                })
                .then(() => {
                  res.sendStatus(200);
                })
                .catch((error) => {
                  console.log('Update settlement exception 1:', error);
                });
            })
            .catch((error) => {
              console.log('Update settlement exception 2:', error);
            });

        } else if (type === 'earning') {
          
          knex('accounts')
            .where({ id: accountID })
            .increment('actualBalance', difference)
            .then(() => {

              knex('settlements')
                .where({ id: req.body.id })
                .update({
                  name: req.body.name,
                  amount: req.body.amount,
                  category: req.body.category,
                  time: req.body.time,
                  place: req.body.place
                })
                .then(() => {
                  res.sendStatus(200);
                })
                .catch((error) => {
                  console.log('Update settlement exception 3:', error);
                });

            })
            .catch((error) => {
              console.log('Update settlement exception 4:', error);
            });

        }
      } else if (req.body.amount <= actualAmount) {
        const difference = (actualAmount - req.body.amount).toFixed(2);

        if (type === 'expense') {
          knex('accounts')
            .where({ id: accountID })
            .increment('actualBalance', difference)
            .then(() => {

              knex('settlements')
                .where({ id: req.body.id })
                .update({
                  name: req.body.name,
                  amount: req.body.amount,
                  category: req.body.category,
                  time: req.body.time,
                  place: req.body.place
                })
                .then(() => {
                  res.sendStatus(200)
                })
                .catch((error) => {
                  console.log('Update settlement exception 5:', error);
                });
            })
            .catch((error) => {
              console.log('Update settlement exception 6:', error);
            });

        } else if (type === 'earning') {

          knex('accounts')
            .where({ id: accountID })
            .decrement('actualBalance', difference)
            .then(() => {

              knex('settlements')
                .where({ id: req.body.id })
                .update({
                  name: req.body.name,
                  amount: req.body.amount,
                  category: req.body.category,
                  time: req.body.time,
                  place: req.body.place
                })
                .then(() => {
                  res.sendStatus(200)
                })
                .catch((error) => {
                  console.log('Update settlement exception 7:', error);
                });
            })
            .catch((error) => {
              console.log('Update settlement exception 8:', error);
            });
        }
      }
    })

});

app.delete('/delete/accounts/:id', (req, res) => {

  knex('accounts')
    .where({ id: req.params.id })
    .del()
    .then((acc) => {

      knex('settlements')
        .where({ accountID: req.params.id })
        .del()
        .then((sett) => {
          console.log(sett)
        });

      res.sendStatus(200);
    });
});

app.delete('/delete/settlements/:id', (req, res) => {
  let amount, accountID, type;

  knex.select()
    .from('settlements')
    .where({ id: req.params.id })
    .then((results) => {
      amount = results[0].amount || 0;
      accountID = results[0].accountID || '';
      type = results[0].type || '';

      knex('settlements')
        .where({ id: req.params.id })
        .del()
        .then(() => {

          if (type === 'earning') {
          knex('accounts')
            .where({ id: accountID })
            .decrement('actualBalance', amount)
            .then(() => {
              res.sendStatus(200);
            });
          } else {
          knex('accounts')
            .where({ id: accountID })
            .increment('actualBalance', amount)
            .then(() => {
              res.sendStatus(200);
            });
          }

        });
    })
});

app.post('/post/notes/add', (req, res) => {

  knex('notes')
    .insert({
      id: uuid.v4(),
      userID: parseUserID(req.body.tokenID),
      content: req.body.content,
      state: 0,
      priority: 'medium',
    })
    .then(() => {
      res.sendStatus(200);
    })
    .catch((error) => {
      console.log('Add note exception:', error);
    });
});

app.post('/post/notes/update', (req, res) => {

  knex('notes')
    .where({ id: req.body.id })
    .update({
      content: req.body.content,
      state: req.body.state,
      priority: req.body.priority,
    })
    .then(() => {
      res.sendStatus(200);
    })
    .catch((error) => {
      console.log('Update note exception', error);
    });
});

app.delete('/delete/notes/:id', (req, res) => {

  knex('notes')
    .where({ id: req.params.id })
    .del()
    .then(() => {
      res.sendStatus(200)
    })
    .catch((error) => {
      console.log('Delete note exception', error);
    });
});

app.get('/get/notes/:id_token', (req, res) => {

  knex.select()
    .from('notes')
    .where({ userID: parseUserID(req.params.id_token) })
    .orderBy('index', 'desc')
    .then((result) => {
      console.log(result)
      res.send(result);
    })
    .catch((error) => {
      console.log('Get notes exception:', error);
    });
});

app.listen(process.env.PORT || 6060, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Listening on port on 6060');
  }
});
