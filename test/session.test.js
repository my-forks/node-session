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
		},
		'should return generate distinct SID.' : function(topic) {
			var listId = [];
			for (i = 0; i < 1000; i++) {
				var session;
				assert.doesNotThrow(function() {
					session = topic.create();
				});
				assert.ok(listId.indexOf(session.getId()) < 0);
				listId.push(session.getId());
			}
		}
	},
	"read() " : {
		topic : function(item) {// Topic
			return Manager();
		},
		'should throw error if SID does not exists' : function(topic) {
			assert.throws(function() {
				topic.read('fldjslfkjdlks');
			});
		},
		'should return Session object if SID exists' : function(topic) {
			var session = topic.create();
			session.set('foo', 'bar');
			topic.update(session);

			var sessionStored = topic.read(session.getId());
			assert.notEqual(sessionStored, undefined);
			assert.equal(sessionStored.getId(), session.getId());
			assert.deepEqual(sessionStored.getData(), session.getData());
		}
	},
	"update() " : {
		topic : function(item) {// Topic
			return Manager();
		},
		'should throw error if SID does not exists' : function(topic) {
			assert.throws(function() {
				topic.update('fldjslfkjdlks', {});
			});
		},
		'should store session data if SID exists' : function(topic) {
			var session = topic.create();
			session.set('foo', 'bar');

			var sessionOld = topic.read(session.getId());
			assert.notEqual(session, sessionOld);
			assert.deepEqual(sessionOld.getData(), {});

			/* First syntax */
			topic.update(session.getId(), session.getData());
			sessionNew = topic.read(session.getId());
			assert.deepEqual(session.getData(), sessionNew.getData());

			/* Second syntax */
			session.set('foo', 'baz');
			topic.update(session);
			sessionNew = topic.read(session.getId());
			assert.deepEqual(session.getData(), sessionNew.getData());
		},
		'should return this' : function(topic) {
			var session = topic.create();
			assert.equal(topic.update(session.getId(), {}), topic);
		}
	},
	"has() " : {
		topic : function(item) {// Topic
			return Manager();
		},
		'should return false if SID does not exists' : function(topic) {
			assert.equal(topic.has('fsdqfjdlk'), false);
		},
		'should return true if SID exists' : function(topic) {
			var session = topic.create();
			assert.equal(topic.has(session.getId()), true);
		}
	},
	"destroy() " : {
		topic : function(item) {// Topic
			return Manager();
		},
		'should not send an error if SID does not exists' : function(topic) {
			assert.doesNotThrow(function() {
				topic.destroy('fsdfsd', {});
			}, topic);
		},
		'should return destroy session if exists' : function(topic) {
			var session = topic.create();
			assert.equal(topic.has(session.getId()), true);
			topic.destroy(session.getId());
			assert.equal(topic.has(session.getId()), false);
		},
		'should return this' : function(topic) {
			var session = topic.create();
			assert.equal(topic.destroy(session.getId()), topic);
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
	}
/*
 * "isExpired()" : { topic : function(item) {// Topic return new session.Session( { expiredAt : (new Date()).getTime() + 1000 }); }, 'should return
 * false when created' : function(topic) { assert.equal(topic.isExpired(), false); }, 'should delete true if expired' : function(topic) {
 * assert.equal(topic.isExpired(), false); topic.expiredAt -= 1001; assert.equal(topic.isExpired(), true); } }
 */

});