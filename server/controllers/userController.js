const User = require('../models/userModel');
const Article = require('../models/articleModel');
const fs = require('fs');
const getSize = require('get-folder-size');
const { body, validationResult } = require('express-validator');
const passport = require('passport');

// const index = (req, res, next) => {
//     User.find(function(err, foundUsers) {
//         if(!err) {
//                 res.json(foundUsers);
//         } else {
//             res.json({
//                 error: err
//             });
//         }
//     });
// }

const find = (req, res) => {
    User.findOne( {username: req.params.username}, function(err, foundUser) {
        if(!err) {
            res.json(foundUser);
        } else {
            res.json({
                message: "no user found"
            });
        }
    });
}

const register = (req, res) => {
    User.findOne( {username: req.body.username}, function(err, foundUser) {
        if(err) {
            res.json({
                error: err
            });
        } else {
            if(foundUser) {
                res.json({
                    message: "username already exist !"
                });
            } else {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                  return res.status(400).json({ errors: errors.array() });
                } else {
                    User.register({username: req.body.username, email: req.body.email , name: req.body.name}, req.body.password, function(err, user){
                        if(err){
                            res.json({
                                error: err
                            });
                        } else{
                            passport.authenticate("local")(req, res, function(){
                                console.log("succesfully added new user");
                            });
                        }
                    });
                    // const newUser = new User({
                    //     username: req.body.username,
                    //     password: req.body.password,
                    //     email: req.body.email
                    // });
                    const newArticle = new Article({
                        username: req.body.username,
                    });
                    const folder = `${"./uploads/" + req.body.username}`;
                
                    fs.mkdir(folder, {recursive: true}, function(err) {
                        if(err) throw err;
                    });
                
                    // newUser.save(function(err) {
                    //     if(!err){
                    //         console.log("succesfully added new user");
                    //     } else {
                    //         res.json({
                    //             error: err
                    //         });
                    //     }
                    // });
                    newArticle.save(function(err) {
                        if(!err){
                            res.json({
                                message: "succesfully added new user"
                            });
                        } else {
                            res.json({
                                error: err
                            });
                        }
                    });
                }
                
            }
        }
    });
    

}

const updateUsername = (req, res) => {
    User.findOne( {username: req.body.newUsername}, function(err, foundUser) {
        if(err) {
            res.json({
                error: err
            });
        } else {
            if(foundUser) {
                res.json({
                    message: "username already exist !"
                });
            } else {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                  return res.status(400).json({ errors: errors.array() });
                } else {
                    User.updateOne({username: req.body.username},  
                        {username: req.body.newUsername}, function (err, docs) { 
                        if (err){ 
                            console.log(err) 
                        } 
                        else{
                            const currPath = `${"./uploads/" + req.body.username}`;
                            const newPath = `${"./uploads/" + req.body.newUsername}`;
                            fs.rename(currPath, newPath, function(err) {
                                if (err) {
                                  console.log(err)
                                } else {
                                  console.log("Successfully renamed the directory.")
                                }
                              }) 
                            console.log("Updated username successfully");
                        } 
                    });
                    Article.updateOne({username: req.body.username},  
                        {username: req.body.newUsername}, function (err, docs) { 
                        if (err){ 
                            console.log(err) 
                        } 
                        else{
                            res.json({
                                message: "Updated username successfully",
                                docs: docs
                            });
                        } 
                    });
                }
                
            }
        }
    });
}

const updatePassword = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        User.updateOne({username: req.body.username},  
            {password: req.body.newPassword}, function (err, docs) { 
            if (err){ 
                console.log(err) 
            } 
            else{ 
                if(docs.n !== 0){
                    res.json({
                        message: "Updated password successfully",
                        docs: docs
                    });
                } else {
                    res.json({
                        message: "user not found or update fail",
                        docs: docs
                    });
                }  
            } 
        }); 
    }
    
}

const updateEmail = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        User.updateOne({username: req.body.username},  
            {email: req.body.newEmail}, function (err, docs) { 
            if (err){ 
                console.log(err) 
            } 
            else{ 
                if(docs.n !== 0){
                    res.json({
                        message: "Updated email successfully",
                        docs: docs
                    });
                } else {
                    res.json({
                        message: "user not found or update fail",
                        docs: docs
                    });
                } 
            } 
        });
    }
}

const updateName = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        User.updateOne({username: req.body.username},  
            {name: req.body.newName}, function (err, docs) { 
            if (err){ 
                console.log(err) 
            } 
            else{
                if(docs.n !== 0){
                    res.json({
                        message: "Updated name successfully",
                        docs: docs
                    });
                } else {
                    res.json({
                        message: "user not found or update fail",
                        docs: docs
                    });
                } 
                 
            } 
        });
    }
} 

const remove = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        User.deleteOne( {username: req.body.username}, function(err) {
            if(!err) {
                const folderToDelete = `${"./uploads/" + req.body.username}`;
    
                fs.rmdir(folderToDelete, {recursive: true}, function(err) {
                    if(err) throw err;
                });
                console.log("succesfully deleted user");
            } else {
                res.json({
                    error: err,
                    message: "user not found"
                });
            }
        });
        
        Article.deleteOne( {username: req.body.username}, function(err) {
            if(!err) {
                res.json({
                    message: "successfully deleted user and all articles"
                });
            } else {
                res.json({
                    error: err
                });
            }
        }); 
    }
    
}

const storage = (req, res) => {
    const myFolder = `${"./uploads/" + req.params.username}`;
    getSize(myFolder, (err, size) => {
        if (err) {throw err;}
       
        const bytes = size + ' bytes';
        const megaBytes = (size / 1024 / 1024).toFixed(2) + ' mB';
        const available_storage = (100 * 1024 * 1024) - size;
        const available_storage_mb = (available_storage/ 1024/ 1024).toFixed(2) + 'mB';
        res.json({
            bytes: bytes,
            megaBytes: megaBytes,
            available_storage: `${available_storage}` + " bytes",
            available_storage_mb: available_storage_mb
        });
      });
}

module.exports = {
    find, register, updateUsername, updatePassword, remove, storage, updateEmail, updateName
}