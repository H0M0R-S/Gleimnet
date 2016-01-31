'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
const AuthPlugin = require('../auth');


const internals = {};


internals.applyRoutes = function (server, next) {

    const User = server.plugins['hapi-mongo-models'].User;
    const Conversation = server.plugins['hapi-mongo-models'].Conversation;
    const Message = server.plugins['hapi-mongo-models'].Message;

    server.route([{
        method: 'GET',
        path: '/conversations',
        config: {
            auth: {
                strategy: 'simple'
            },
            validate: {
            },
            pre: [{
                assign: 'conversation',
                method: function(request, reply) {
                    Conversation.findAllConversationsByUserId(request.auth.credentials.session.userId, (err, timeline) => {
                        if (err) {
                            return reply(err);
                        }
                        if (!timeline) {
                            return reply(Boom.notFound('Document not found.'));
                        }
                        reply(timeline);
                    });
                }
            }]
        },
        handler: function (request, reply) {
            reply ({conversations: request.pre.conversation});
        }
    }]);
    server.route([{
        method: 'GET',
        path: '/conversations/{id}',
        config: {
            auth: {
                strategy: 'simple'
            },
            validate: {
                params: {
                    id: Joi.string().length(24).hex().required()
                }
            },
            pre: [{
                assign: 'conversation',
                method: function(request, reply) {
                    Conversation.findById(request.params.id, (err, timeline) => {
                        if (err) {
                            return reply(err);
                        }
                        if (!timeline) {
                            return reply(Boom.notFound('Document not found.'));
                        }
                        reply(timeline);
                    });
                }
            }]
        },
        handler: function (request, reply) {
            reply (request.pre.conversation);
        }
    }]);
    server.route([{
        method: 'POST',
        path: '/conversations/{id}',
        config: {
            auth: {
                strategy: 'simple'
            },
            validate: {
                params: {
                    id: Joi.string().length(24).hex().required()
                },
                payload: {
                    content: Joi.string().required()
                }
            },
            pre: [{
                assign: 'conversation',
                method: function(request, reply) {
                    Conversation.findById(request.params.id, (err, conversation) => {
                        if (err) {
                            return reply(err);
                        }
                        if (!conversation) {
                            return reply(Boom.notFound('Document not found.'));
                        }
                        reply(conversation);
                    });
                }
            },{
                assign: 'message',
                method: function (request, reply) {
                    const userid = request.auth.credentials.session.userId;
                    Message.create(userid, request.payload.content, (err, message) => {
                        if (err) {
                            return reply(Boom.badRequest('Message not created'));
                        }
                        reply(message);
                    });
                }
            },{
                assign: 'addAuthor',
                method: function (request, reply) {
                    const userid = request.auth.credentials.session.userId;
                    Conversation.ensureAuthor(request.pre.conversation, userid, (err, conversation) => {
                        if (err) {
                            return reply(Boom.badRequest('Message not created'));
                        }
                        reply(conversation);
                    });
                }
            }
            ]
        },
        handler: function (request, reply) {
            console.log('dinge');
            request.pre.addAuthor.addMessage(request.auth.credentials.session.userId,request.pre.message._id.toString(), (err, conversation) => {
                if (err) {
                    return reply(err);
                }
                return reply(conversation);
            });
        }
    }]);
    server.route([{
        method: 'POST',
        path: '/conversations',
        config: {
            auth: {
                strategy: 'simple'
            },
            validate: {
                payload: {
                    username: Joi.string().token().lowercase().required()
                }
            },
            pre: [{
                assign: 'user',
                method: function (request, reply) {
                    User.findByUsername(request.payload.username, (err, user) => {
                        if (err) {
                            return reply(err);
                        }
                        if (!user) {
                            return reply(Boom.notFound('Document not found.'));
                        }
                        reply(user);
                    });
                }
            },{
                assign: 'conversation',
                method: function(request, reply) {
                    Conversation.createWithAuthor(request.auth.credentials.session.userId.toString(), reply);
                }
            },{
                assign: 'author',
                method: function (request, reply) {
                    console.log(request.pre.user);
                    Conversation.findByIdAndUpdate(self._id, {$push: {"authors": {id: mongo.ObjectId(request.pre.user._id)}}}, {
                        safe: true,
                        upsert: true,
                        new: true
                    }, (err, user) => {
                        if (err) {
                            return reply(err);
                        }
                        reply(user);
                    });
                    //request.pre.conversation.ensureAuthor(request.pre.user._id);
                }
            }]
        },
        handler: function (request, reply) {
            reply (request.pre.conversation)
            /*request.pre.conversation.addMessage(request.pre.user._id.toString(),request.pre.._id.toString(), (err, conversation) => {
                if (err) {
                    return reply(err);
                }
                return reply(conversation);
            });*/
        }
    }]);
    next();
};


exports.register = function (server, options, next) {
    server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);
    next();
};


exports.register.attributes = {
    name: 'conversations'
};
