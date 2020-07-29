const jwt = require('jsonwebtoken');
const passport = require('passport');

const authenticate = (req, res, next) => {
    try {
        if(req.isAuthenticated()){
            const token = req.headers.authorization.split(' ')[1]
            const decode = jwt.verify(token, process.env.JWT_SECRET)

            req.user = decode
            next()
        } else {
            res.json({
                message: "unauthorised"
            })
        }
        

    } catch(err) {
        res.json({
            message: "authentication failed",
            error: err
        });
    }
}

module.exports = authenticate;