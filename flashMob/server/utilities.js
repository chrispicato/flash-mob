var User = require('./db/db').User;
var Event = require('./db/db').Event;
var Session = require('./db/db');
var sequelize = require('./db/db').sequelize;
var bcrypt = require('bcrypt');
var Store = require('express-mysql-session')(Session);

var options = {
  host: 'localhost',
  port: 3000,
  user: 'root',
  password: 'hr47',
  database: 'flashMob'
};

var store = new Store(options);


// hashes a plaintext input and returns hashed value
var hashPassword = function (password, username) {

  bcrypt.genSalt(10, function (err, salt) {

    if (err) {
      console.log(err);
      return;
    }
    
    bcrypt.hash(password, salt, function (err, hash) {

      if (err) {
        console.log(err);
        return;
      } else {
        // new user created in database
        return User.create({
          username: username,
          password: hash
        });
      }

    });

  });

};

// return a boolean value comparison of a plaintext and hashed password
var comparePassword = function (plaintext, hashedPassword) {

  return bcrypt.compareSync(plaintext, hashedPassword);

};

var createUser = function (req, res) {

  // creates new user with data from req.body
  User.sync().then(function () {

    hashPassword(req.body.password, req.body.username);

  });

};

var createSession = function (req, res) {

  // creates new session with data from request body
  Session.sync().then(function() {

    return Session.create({

      username: req.body.username,
      secret: 'Purposeful_Llama_secret',
      store: store,
      resave: true,
      saveUninitialized: true

    });

  });

};

module.exports.findUser = function (req, res) {

  // searches users table for user
  // { replacements } gives a value to :username in the sequelize query
  sequelize.query('SELECT * FROM Users WHERE username = :username',
     { replacements: {username: req.body.username}, type: sequelize.QueryTypes.SELECT }
    )
  .then(function (users) {

    // if user does not exist, create user
    if (users.length === 0) {
      createUser(req, res);
      res.send('User created');
    } else {
      res.status(400).send('Username already exists');
    }

  });

};

module.exports.login = function (req, res) {

  // searches users table for user
  // { replacements } gives a value to :username in the sequelize query
  sequelize.query('SELECT password FROM Users WHERE username = :username',
    { replacements: {
      username: req.body.username
      }, 
      type: sequelize.QueryTypes.SELECT 
    })
    .then(function (hashedVal) {

      // the sequelize query returns a results array with an object
      if (hashedVal.length === 1) {
        // use bcrypt to compare plain text password with password from hashedVal
        if (comparePassword(req.body.password, hashedVal[0].password)) {
          // if passwords match, redirect to events page
          // create session (future addition)
          res.status(303).redirect('/api/events');
        } else {
          // if passwords do not match, send error code
          res.status(400).send('The password does not match the given username');  
        }
      } else {
        // if username does not exist, send error code
        res.status(400).send('The username provided does not match any records');
      }
      
    });

};

module.exports.createEvent = function (req, res) {

  // adds new event from parsed request body
  Event.sync().then(function () {

    // new event created in database
    return Event.create({
      title: req.body.title,
      category: req.body.category,
      location: req.body.location,
      date: req.body.date,
      description: req.body.description
      // organizer to be added later
      // organizer: req.body.organizer

    });

  });

  res.status(201).send('Event created');

};

module.exports.getEvents = function (req, res) {

  // queries events table and returns array of results
  // results limited to ten in ascending order by date
  Event.findAll({
    limit: 10,
    order: [['date', 'ASC']]
  }).then(function (results) {
    res.send(results);
  });

};