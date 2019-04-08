var User = require('../models/user.js');
var Task = require('../models/task.js');

module.exports = function(router) {
    var oneTaskRoute = router.route('/tasks/:id');

    oneTaskRoute.get(function(req, res) {
        Task.findById(req.params.id)
        .exec()
        .then(function(data) {
            if(data == null) {
                return res.status(404).send({
                    message: 'No Task Matching Provided ID',
                    data: []
                });
            } else {
                return res.status(200).send({
                    message: 'Task Retrieved',
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

    oneTaskRoute.put(function(req, res) {
        Task.findById(req.params.id)
        .exec()
        .then(function(data) {
            if(data == null) {
                return res.status(404).send({
                    message: 'No Task Matching Provided ID',
                    data: []
                });
            } else {
                var cpr = [];
                if(data.assignedUser != "" && !data.completed) {
                    User.findById(data.assignedUser).exec().then(function(user) {
                        user.pendingTasks.remove(data.id);
                        cpr.push(user.save());
                    });
                }
                Promise.all(cpr).then(function() {
                    var task = {};

                    if('name' in req.body && req.body.name !== undefined) {
                        task.name = req.body.name;
                    } else {
                        return res.status(400).send({
                            message: 'Name Required',
                            data: []
                        });
                    }

                    if('description' in req.body && req.body.description !== undefined) {
                        task.description = req.body.description;
                    } else {
                        task.description = "";
                    }

                    if('deadline' in req.body && req.body.deadline !== undefined) {
                        task.deadline = req.body.deadline;
                    } else {
                        return res.status(400).send({
                            message: 'Deadline Required',
                            data: []
                        });
                    }

                    if('completed' in req.body && req.body.completed !== undefined) {
                        task.completed = req.body.completed;
                    } else {
                        task.completed = false;
                    }

                    if('assignedUser' in req.body && req.body.assignedUser !== undefined && req.body.assignedUser.length > 0) {
                        User.findById(req.body.assignedUser).exec().then(function(user) {
                            if(user == null) {
                                task.assignedUser = "";
                                task.assignedUserName = "unassigned";

                                Task.findByIdAndUpdate(data.id, task, {new: true})
                                .then(function(data) {
                                    return res.status(200).send({
                                        message: 'Task Modified',
                                        data: data
                                    });
                                })
                                .catch(function(error) {
                                    return res.status(500).send({
                                        message: 'Server Error',
                                        data: []
                                    });
                                });
                            } else {
                                task.assignedUser = user.id;
                                task.assignedUserName = user.name;

                                Task.findByIdAndUpdate(data.id, task, {new: true})
                                .then(function(data) {
                                    if(!data.completed) {
                                        user.pendingTasks.push(data.id);
                                        user.save().then(function() {
                                            return res.status(200).send({
                                                message: 'Task Modified',
                                                data: data
                                            });
                                        });
                                    } else {
                                        return res.status(200).send({
                                            message: 'Task Modified',
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
                            }
                        });
                    } else {
                        task.assignedUser = "";
                        task.assignedUserName = "unassigned";

                        Task.findByIdAndUpdate(data.id, task, {new: true})
                        .then(function(data) {
                            return res.status(200).send({
                                message: 'Task Modified',
                                data: data
                            });
                        })
                        .catch(function(error) {
                            return res.status(500).send({
                                message: 'Server Error',
                                data: []
                            });
                        });
                    }
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

    oneTaskRoute.delete(function(req, res) {
        Task.findById(req.params.id)
        .exec()
        .then(function(data) {
            if(data == null) {
                return res.status(404).send({
                    message: 'No Task Matching Provided ID',
                    data: []
                });
            } else {
                if(data.assignedUser != "" && !data.completed) {
                    User.findById(data.assignedUser).exec().then(function(user) {
                        if(user != null) {
                            user.pendingTasks.remove(data.id);
                            user.save().then(function() {
                                data.delete().then(function() {
                                    return res.status(200).send({
                                        message: 'Deleted Task',
                                        data: []
                                    });
                                });
                            }); 
                        } else {
                            data.delete().then(function() {
                                return res.status(200).send({
                                    message: 'Deleted Task',
                                    data: []
                                });
                            });
                        }
                    });
                } else {
                    data.delete().then(function() {
                        return res.status(200).send({
                            message: 'Task Deleted',
                            data: []
                        });
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

    return router;
}