const isLogged = (req, res, next) => {
    try {
        if(req.isAuthenticated()){
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

module.exports = isLogged;