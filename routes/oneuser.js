var User = require('../models/user.js');
var Task = require('../models/task.js');

module.exports = function(router) {
    var oneUserRoute = router.route('/users/:id');

    oneUserRoute.get(function(req, res) {
        User.findById(req.params.id)
        .exec()
        .then(function(data) {
            if(data == null) {
                return res.status(404).send({
                    message: 'No User Matching Provided ID',
                    data: []
                });
            } else {
                return res.status(200).send({
                    message: 'Retrieved User',
                    data: data
                });
            }
        })
        .catch(function(error) {
            return res.status(500).send({
                message: 'Server Error',
                data: []
            });
        });
    });

    oneUserRoute.put(function(req, res) {
        User
        .findById(req.params.id)
        .exec()
        .then(function(data) {
            if(data == null) {
                return res.status(404).send({
                    message: 'No User Matching Provided ID',
                    data: []
                });
            } else {
                var user = {};

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
                    .then(function(match) {
                        if(match == null || match.id == data.id) {
                            user.email = req.body.email;

                            Task
                            .updateMany({assignedUser: data.id}, {assignedUser: "", assignedUserName: "unassigned"})
                            .then(function() {
                                var promises = [];
                                if('pendingTasks' in req.body && req.body.pendingTasks !== undefined) {
                                    req.body.pendingTasks.forEach(function(id) {
                                        promises.push(Task.findById(id).exec());
                                    });
                                }
                                user.pendingTasks = [];
                                Promise.all(promises).then(function(values) {
                                    values.forEach(function(task) {
                                        if(task != null) {
                                            user.pendingTasks.push(task.id);
                                        }
                                    });
                                    User.findByIdAndUpdate(data.id, user, {new: true})
                                    .then(function(updated) {
                                        var newUserId = updated.id;
                                        var newUserName = updated.name;

                                        var newPromises = [];
                                        updated.pendingTasks.forEach(function(id) {
                                            newPromises.push(Task.findById(id).exec());
                                        });

                                        Promise.all(newPromises).then(function(tasks) {
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
                                                return res.status(200).send({
                                                    message: 'User Modified',
                                                    data: updated
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

            }
        })
        .catch(function(error) {
            return res.status(500).send({
                message: 'Server Error',
                data: []
            });
        });
    });

    oneUserRoute.delete(function(req, res) {
        User
        .findById(req.params.id)
        .exec()
        .then(function(data) {
            if(data == null) {
                return res.status(404).send({
                    message: 'No User Matching Provided ID',
                    data: []
                });
            } else {
                var promises = [];
                Task
                .updateMany({assignedUser: data.id}, {assignedUser: "", assignedUserName: "unassigned"})
                .then(function() {
                    data.delete().then(function() {
                        return res.status(200).send({
                            message: 'User Deleted',
                            data: []
                        });
                    });
                });
            }
        })
        .catch(function(error) {
            return res.status(500).send({
                message: 'Server Error',
                data: []
            });
        });
    });

    return router;
}