const jwt = require('jsonwebtoken');
const passport = require('passport');

const authenticate = (req, res, next) => {
    try {
        // if(req.isAuthenticated()){
            const token = req.headers.authorization.split(' ')[1]
            const decode = jwt.verify(token, process.env.JWT_SECRET)

            req.user = decode
            next()
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
            message: "authentication failed",
            errors: [err],
            status: "failure",
            data: {}
        });
    }
}

module.exports = authenticate;