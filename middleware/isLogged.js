const isLogged = (req, res, next) => {
    try {
        console.log(req.isAuthenticated());
        if(req.isAuthenticated()){
            next()
        } else {
            res.json({
                status: "failure",
                message: "unauthorised",
                errors: [],
                data: {}
            })
        }
    } catch(err) {
        res.json({
            status: "failure",
            message: "authentication failed",
            errors: [err],
            data: {}
        });
    }
}

module.exports = isLogged;