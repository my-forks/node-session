var vows = require('vows');
var assert = require('assert');

var session = require('../lib/session');

function Manager(options) {
	options = options || {};
	options.debug = options.debug == undefined ? true : options.debug;
	return new session.SessionManager(options);
}

/**
 * Session Test class
 */
exports.SessionManagerTest = vows.describe('SessionManager class').addBatch( {
	"create()" : {
		topic : function(item) {// Topic
			return Manager();
		},
		'should return a new session' : function(topic) {
			var sessionNew = topic.create();
			assert.notEqual(sessionNew, undefined);
			assert.notEqual(sessionNew.getId(), undefined);
			assert.deepEqual(sessionNew.getData(), {});
		}
	},
	"read() " : {
		topic : function(item) {// Topic
			return Manager();
		},
		'should return undefined if key does not exists' : function(topic) {
			assert.equal(topic.read('fldjslfkjdlks'), undefined);
		},
		'should return Session object if key exists' : function(topic) {
			var session = {
				data : 'helloworld'
			};
			topic.create('myId', session);
			assert.equal(topic.read('myId'), session);
		}
	},
	"update() " : {
		topic : function(item) {// Topic
			return Manager();
		},
		'should return this' : function(topic) {
			assert.equal(topic.update('test_return_this', {}), topic);
		},
		'should return Session object if key exists' : function(topic) {
			var session = {
				data : 'helloworld'
			};
			topic.update('myId', session);
			assert.equal(topic.read('myId'), session);
		}
	},
	"has() " : {
		topic : function(item) {// Topic
			return Manager();
		},
		'should return false if key does not exists' : function(topic) {
			assert.equal(topic.has('fsdqfjdlk'), false);
		},
		'should return true if key exists' : function(topic) {
			var session = {
				data : 'helloworld'
			};
			topic.update('myId', session);
			assert.equal(topic.has('myId'), true);
		}
	},
	"destroy() " : {
		topic : function(item) {// Topic
			return Manager();
		},
		'should return this' : function(topic) {
			assert.equal(topic.destroy('test_return_this', {}), topic);
		},
		'should return Session object if key exists' : function(topic) {
			var session = {
				data : 'helloworld'
			};
			topic.create('myId', session);
			assert.equal(topic.has('myId'), true);
			topic.destroy('myId');
			assert.equal(topic.has('myId'), false);
		}
	}

});

/**
 * Session class
 */
exports.SessionTest = vows.describe('Session class').addBatch( {
	"get() " : {
		topic : function(item) {// Topic
			return new session.Session();
		},
		'should return undefined if key does not exists' : function(topic) {
			assert.equal(topic.get('fldjslfkjdlks'), undefined);
		},
		'should return defaultValue if key does not exists' : function(topic) {
			assert.equal(topic.get('fldjslfkjdlks', 'defaultArg'), 'defaultArg');
		},
		'should return data if key exists' : function(topic) {
			topic.set('myId', 'helloworld');
			assert.equal(topic.get('myId'), 'helloworld');
		}
	},
	"set() " : {
		topic : function(item) {// Topic
			return new session.Session();
		},
		'should return this' : function(topic) {
			assert.equal(topic.set('fldjslfkjdlks', 'jkljlm'), topic);
		},
		'should return set data' : function(topic) {
			topic.set('myId', 'helloworld');
			assert.equal(topic.get('myId'), 'helloworld');
		}
	},
	"isset() " : {
		topic : function(item) {// Topic
			return new session.Session();
		},
		'should return false if key does not exists' : function(topic) {
			assert.equal(topic.isset('fsdqfjdlk'), false);
		},
		'should return true if key exists' : function(topic) {
			topic.set('myId', 'helloworld');
			assert.equal(topic.isset('myId'), true);
		}
	},
	"unset()" : {
		topic : function(item) {// Topic
			return new session.Session();
		},
		'should return this' : function(topic) {
			assert.equal(topic.unset('jakhhk', {}), topic);
		},
		'should delete element if existing' : function(topic) {
			topic.set('myId', 'helloworld');
			assert.equal(topic.isset('myId'), true);
			topic.unset('myId');
			assert.equal(topic.isset('myId'), false);
		}
	},
	"isExpired()" : {
		topic : function(item) {// Topic
			return new session.Session( {
				expiredAt : (new Date()).getTime() + 1000
			});
		},
		'should return false when created' : function(topic) {
			assert.equal(topic.isExpired(), false);
		},
		'should delete true if expired' : function(topic) {
			assert.equal(topic.isExpired(), false);
			topic.expiredAt -= 1001;
			assert.equal(topic.isExpired(), true);
		}
	}

});