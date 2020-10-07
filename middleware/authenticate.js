const jwt = require('jsonwebtoken');
const passport = require('passport');
const jwtInactive = require('../models/jwtInactiveModel');

const authenticate = (req, res, next) => {
    try {
            
        // if(req.isAuthenticated()){
            const token = req.headers.authorization.split(' ')[1]
            jwtInactive.findOne({token: token}, (err, found) => {
                if(!err & !found) {
                    try {
                        const decode = jwt.verify(token, process.env.JWT_SECRET)

                        req.user = decode
                        next() 
                    } catch (error) {
                        res.json({
                            message: "authentication failed. invalid jwt or jwt expired",
                            errors: [error],
                            status: "failure",
                            data: {}
                        });
                    }
                    
                } else {
                        res.json({
                            status: "failure",
                            message: "unauthorised - invalid jwt",
                            errors: [err],
                            data: {}
                        })
                    }
            });
            
        // } else {
        //     res.json({
        //         status: "failure",
        //         message: "unauthorised",
        //         errors: [],
        //         data: {}
        //     })
        // }
        

    } catch(err) {
        res.json({
            message: "authentication failed. invalid jwt or jwt expired",
            errors: [err],
            status: "failure",
            data: {}
        });
    }
}

module.exports = authenticate;