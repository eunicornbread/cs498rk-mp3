var User = require('../models/user.js');
var Task = require('../models/task.js');

module.exports = function (router) {
    var userRoute = router.route('/users');

    userRoute.get(function (req, res) {
        User.find(eval("(" + req.query.where + ")"))
        .sort(eval("(" + req.query.sort + ")"))
        .select(eval("(" + req.query.select + ")"))
        .skip(eval("(" + req.query.skip + ")"))
        .limit(eval("(" + req.query.limit + ")"))
        .exec()
        .then(function (data) {
            if(req.query.count) {
                return res.status(200).send({
                    message: 'Users Retrieved',
                    data: data.length
                });
            } else {
                return res.status(200).send({
                    message: 'Users Retrieved',
                    data: data
                });
            }
        })
        .catch(function (error) {
            return res.status(500).send({
                message: 'Server Error',
                data: []
            });
        });
    });

    userRoute.post(function (req, res) {
        var user = new User();

        if('name' in req.body && req.body.name !== undefined) {
            user.name = req.body.name;
        } else {
            return res.status(400).send({
                message: 'Name Required',
                data: []
            });
        }

        if('email' in req.body && req.body.email !== undefined) {
            User.findOne({email: req.body.email}).exec()
            .then(function (match) {
                if(match == null) {
                    user.email = req.body.email;
                    var promises = [];
                    if('pendingTasks' in req.body && req.body.pendingTasks !== undefined) {
                        req.body.pendingTasks.forEach(function (id) {
                            promises.push(Task.findById(id).exec());
                        });
                    }
                    user.pendingTasks = [];
                    Promise.all(promises).then(function (values) {
                        values.forEach(function (task) {
                            if(task != null) {
                                user.pendingTasks.push(task.id);
                            }
                        });
                        user.save()
                        .then(function (data) {
                            var newUserId = data.id;
                            var newUserName = data.name;

                            var newPromises = [];
                            data.pendingTasks.forEach(function (id) {
                                newPromises.push(Task.findById(id).exec());
                            });

                            Promise.all(newPromises).then(function (tasks) {
                                var finalPromises = [];

                                tasks.forEach(function(task) {
                                    var userPromises = [];

                                    if(task.assignedUser !== "") {
                                        userPromises.push(User.findById(task.assignedUser).exec());
                                    }

                                    Promise.all(userPromises).then(function(users) {
                                        users.forEach(function(user) {
                                            user.pendingTasks.remove(task.id);
                                            finalPromises.push(user.save());
                                        });
                                    });

                                    task.completed = false;
                                    task.assignedUser = newUserId;
                                    task.assignedUserName = newUserName;
                                    finalPromises.push(task.save());
                                });

                                Promise.all(finalPromises).then(function() {
                                    return res.status(201).send({
                                        message: 'User Created',
                                        data: data
                                    });
                                });
                            });
                        })
                        .catch(function(error) {
                            return res.status(500).send({
                                message: 'Server Error',
                                data: []
                            });
                        });
                    });
                } else {
                    return res.status(400).send({
                        message: 'Email Duplicate',
                        data: []
                    });
                }
            });
        } else {
            return res.status(400).send({
                message: 'Email Required',
                data: []
            });
        }
    });

    return router;
}