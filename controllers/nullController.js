//The 404 Route 
const get =  function(req, res){
    res.status(404).json({
        status: "failure",
        message: "The route doesn't exist. Please refer the documentation. make sure you didn't make a get request by mistake",
        errors: [
            {
                type: "404 - file not found"
            }
        ],
        data: {}
    });
};
const post = function(req, res){
    res.status(404).json({
        status: "failure",
        message: "The route doesn't exist. Please refer the documentation. make sure you didn't make a post request by mistake",
        errors: [
            {
                type: "404 - file not found"
            }
        ],
        data: {}
    });
};
const put = function(req, res){
    res.status(404).json({
        status: "failure",
        message: "The route doesn't exist. Please refer the documentation. make sure you didn't make a put request by mistake",
        errors: [
            {
                type: "404 - file not found"
            }
        ],
        data: {}
    });
};
const patch = function(req, res){
    res.status(404).json({
        status: "failure",
        message: "The route doesn't exist. Please refer the documentation. make sure you didn't make a patch request by mistake",
        errors: [
            {
                type: "404 - file not found"
            }
        ],
        data: {}
    });
};
const del = function(req, res){
    res.status(404).json({
        status: "failure",
        message: "The route doesn't exist. Please refer the documentation. make sure you didn't make a delete method request by mistake",
        errors: [
            {
                type: "404 - file not found"
            }
        ],
        data: {}
    });
};

module.exports = { get, post, put, patch, del }