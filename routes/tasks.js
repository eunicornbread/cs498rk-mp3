var User = require('../models/user.js');
var Task = require('../models/task.js');

module.exports = function(router) {
    var taskRoute = router.route('/tasks');

    taskRoute.get(function(req, res) {
        Task.find(eval("(" + req.query.where + ")"))
        .sort(eval("(" + req.query.sort + ")"))
        .select(eval("(" + req.query.select + ")"))
        .skip(eval("(" + req.query.skip + ")"))
        .limit(eval("(" + req.query.limit + ")"))
        .exec()
        .then(function(data) {
            if(req.query.count) {
                return res.status(200).send({
                    message: 'Tasks Retrieved',
                    data: data.length
                });
            } else {
                return res.status(200).send({
                    message: 'Tasks Retrieved',
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

    taskRoute.post(function(req, res) {
        var task = new Task();

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

                    task.save().then(function(data) {
                        return res.status(201).send({
                            message: 'Task Created',
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

                    task.save()
                    .then(function(data) {
                        if(!data.completed) {
                            user.pendingTasks.push(data.id);
                            user.save().then(function() {
                                return res.status(201).send({
                                    message: 'Task Created',
                                    data: data
                                });
                            });
                        } else {
                            return res.status(201).send({
                                message: 'Task Created',
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

            task.save()
            .then(function(data) {
                return res.status(201).send({
                    message: 'Task Created',
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

    return router;
}