// const isAdmin = (req, res, next) => {
//     try {
//         if(req.body.admin == process.env.ADMIN && req.body.password == process.env.ADMIN_PASSWORD){
//             next()
//         } else {
//             res.json({
//                 message: "unauthorised"
//             })
//         }
        

//     } catch(err) {
//         res.json({
//             message: "authentication failed",
//             error: err
//         });
//     }
// }

// module.exports = isAdmin;