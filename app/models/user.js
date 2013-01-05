var uuid = require('node-uuid')
  , models = require('../models');

exports.addModel = function(db) {
  function User(params) {
    console.log('new User(' + JSON.stringify(params) + ')')
    this.username = params.username
    this.id = params.id
  }

  // TODO: create Anonymous model which is inherited from User
  User.anon = function(callback) {
    console.log('User.anon()')
    // init anonymous user if it doesn't exist yet
    var userId = uuid.v4();

    var returnAnon = function() {
      User.findByUsername('anonymous', function(user) {
        return callback(user.id);
      })
    }

    db.setnx('username:anonymous:uid', userId, function(err, res) {
      if (res == 1) {
        db.hsetnx('user:' + userId, 'username', 'anonymous', function(err, res) {
          returnAnon()
        })
      } else {
        returnAnon()
      }
    })
  }

  User.findByUsername = function(username, callback) {
    console.log('User.findByUsername("' + username + '")')
    db.get('username:' + username + ':uid', function (err, userId) {
      User.find(userId, function(user) { 
        return callback(user)
      })
    })  
  }

  User.find = function(userId, callback) {
    console.log('User.find("' + userId + '")')
    db.hgetall('user:' + userId, function(err, attrs) {
      // Seems it's either deleted user or broken session. Redirect to
      // auth method
      if (attrs === null) attrs = {}

      attrs.id = userId
      return callback(new User(attrs))
    })
  },

  User.auth = function(username, password) {
    // TODO: not implemented yet
  },

  User.prototype = {
    posts: function() {
      console.log('- user.posts()')
      Timeline.find(this.id)
    },

    newPost: function(attrs) {
      attrs.userId = this.id
      
      return new models.Post(attrs)
    },

    newComment: function(attrs) {
      attrs.userId = this.id

      return new models.Comment(attrs)
    },

    toJSON: function(callback) {
      console.log('- user.toJSON()')
      return callback({
        id: this.id,
        username: this.username
      })
    }

  }
  
  return User;
}
