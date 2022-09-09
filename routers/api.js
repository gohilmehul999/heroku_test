var User = require('../models/user');
var jwt = require('jsonwebtoken');
var secret = 'harrypotter';

module.exports = function(router) {
    
    router.get('/', (req, res) => {
        res.send("Hello");
    });

    router.post('/user', (req, res) => {
        var user = new User();

        user.fname = req.body.fname;
        user.lname = req.body.lname;
        user.mobile = req.body.mobile;
        user.email = req.body.email;
        user.dob = req.body.dob;
        user.city = req.body.city;
        user.pincode = req.body.pincode;
        user.state = req.body.state;
        user.password = req.body.password;
        user.temporarytoken = jwt.sign({ email: user.email }, secret, { expiresIn: '24h' });

        if(req.body.fname == null || req.body.fname == "" || req.body.password == null || req.body.password == "" || req.body.email == null || req.body.email == "" || req.body.lname == null || req.body.lname == ""){
            res.json({ success: false, message: 'Ensure Firstname, Lastname, password and email were provided'});
        } else {
            user.save(function(err) {
                if(err) {
                    if (err.errors != null) {
                        if(err.errors.fname) {
                            res.json({ success: false, message: 'Required minimum digits 3 of First Name' });
                        } else if(err.errors.lname) {
                            res.json({ success: false, message: 'Required minimum digits 3 of Last Name' });
                        } else if(err.errors.city) {
                            res.json({ success: false, message: 'Reqired minimum digits 3 of City' });
                        } else if(err.errors.pincode) {
                            res.json({ success: false, message: 'Reqired minimum digits 6 of pin-code' });
                        } else if(err.errors.state) {
                            res.json({ success: false, message: 'Reqired minimum digits 3 of state' });
                        } else if(err.errors.email) {
                            res.json({ success: false, message: err.errors.email.message });
                        } else if(err.errors.password) {
                            res.json({ success: false, message: err.errors.password.message });
                        }
                    } else {
                        res.json({success:false, message:err});
                    }
                } else {
                    res.json({ success: true, message: 'Successfully Registered !'});
                }
            })
        }
    });

    router.post('/authenticate', function(req, res){
        User.findOne({ email: req.body.email }).select('email password').exec(function(err, user) {
            if (err) throw err;
            else {
                if (!user) {
                    res.json({ success: false, message: 'email and password not provided !!!' });
                } else if (user) {
                    if (!req.body.password) {
                        res.json({ success: false, message: 'No password provided' });
                    } else {
                        var validPassword = user.comparePassword(req.body.password);
                        if (!validPassword) {
                            res.json({ success: false, message: 'Could not authenticate password' });
                        } else{
                            //res.send(user);
                            var token = jwt.sign({ email: user.email, id: user._id }, secret, { expiresIn: '24h' }); 
                            res.json({ success: true, message: 'User authenticated!', token: token});
                        }             
                    }
                }
            }   
        });
    });

    router.use(function(req, res, next) {

        var token = req.body.token || req.body.query || req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, secret, function(err, decoded) {
                if (err) {
                    res.json({ success: false, message: 'Token invalid' });
                } else {
                    req.decoded = decoded;
                    next();
                }
            });
        } else {
            res.json({ success: false, message: 'No token provided' });
        }
    });

    router.get('/me', function(req, res) {
        User.findOne( {_id: req.decoded.id}, function(err, user) {
            if(err) throw err;
            if(!user) {
                res.json({ success: false, message: 'User not found'});
            } else {
                res.json({success: true, user: user});
            }
        });
    })

  /*  router.get('/me', function(req, res) {
        res.send(req.decoded);
    });
*/
    router.get('/edit/:id', function(req, res) { 
        User.findOne({ _id: req.params.id }, function(err, user) {
            if (err) throw err;
            if (!user) {
                res.json({ success: false, message: 'No user found' });
            } else {
                res.json({ success: true, user: user });
            }
        });
    });

    router.put('/edit/:id', function(req, res) {
        User.findOne({ _id: req.params.id }, function(err, user) {
            if (err) throw err;
            if (!user) {
                res.json({ success: false, message: 'No user found' });
            } else{
                user.fname = req.body.fname;
                user.lname = req.body.lname;
                user.mobile = req.body.mobile;
                user.email = req.body.email;
                user.dob = req.body.dob;
                user.city = req.body.city;
                user.pincode = req.body.pincode;
                user.state = req.body.state;
                user.save(function(err) {
                    if (err) {
                        console.log(err); 
                    } else {
                        res.json({ success: true, message: 'Details has been updated!' });
                    }
                });
            }
        });
    })

    router.get('/users', (req, res) => {
        User.find({}, function(err, users) {
            if(err) throw err;
            User.findOne({ email: req.decoded.email }, function(err, mainUser) {
                if (!mainUser) {
                    res.json({ success: false, message: 'No user found' });
                } else{
                    if (!users) {
                        res.json({ success: false, message: 'Users not found' }); 
                    } else {
                        res.json({ success: true, users: users });
                    }
                }
            });
        });
    });

    router.delete('/user/:id', function(req, res) {
        User.findByIdAndRemove({ _id: req.params.id }, function(err, user) {
            if(err) throw err;
            if(!user) {
                res.json({ success: false, message: 'No user found' });
            } else {
                res.json({ success: true, message: 'Your Account has been delete now !!!' });
            }
        })
    });

    return router;
}