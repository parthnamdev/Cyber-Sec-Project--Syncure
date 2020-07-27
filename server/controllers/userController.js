const User = require('../models/userModel');
const Article = require('../models/articleModel');
const fs = require('fs');
const getSize = require('get-folder-size');

const index = (req, res, next) => {
    User.find(function(err, foundUsers) {
        if(!err) {
            res.json(foundUsers);
        } else {
            res.json({
                error: err
            });
        }
    });
}

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

const add = (req, res) => {
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
                const newUser = new User({
                    username: req.body.username,
                    password: req.body.password
                });
                const newArticle = new Article({
                    username: req.body.username,
                });
                const folder = `${"./uploads/" + req.body.username}`;
            
                fs.mkdir(folder, {recursive: true}, function(err) {
                    if(err) throw err;
                });
            
                newUser.save(function(err) {
                    if(!err){
                        console.log("succesfully added new user");
                    } else {
                        res.json({
                            error: err
                        });
                    }
                });
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
    });
    

}

const updateUsername = (req, res) => {

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

const updatePassword = (req, res) => {

    User.updateOne({username: req.body.username},  
        {password: req.body.newPassword}, function (err, docs) { 
        if (err){ 
            console.log(err) 
        } 
        else{ 
            res.json({
                message: "Updated password successfully",
                docs: docs
            }); 
        } 
    }); 
}

const remove = (req, res) => {
    User.deleteOne( {username: req.body.username}, function(err) {
        if(!err) {
            const folderToDelete = `${"./uploads/" + req.body.username}`;

            fs.rmdir(folderToDelete, {recursive: true}, function(err) {
                if(err) throw err;
            });
            console.log("succesfully deleted user");
        } else {
            res.json({
                error: err
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

const storage = (req, res) => {
    const myFolder = `${"./uploads/" + req.params.username}`;
    getSize(myFolder, (err, size) => {
        if (err) {throw err;}
       
        const bytes = size + ' bytes';
        const megaBytes = (size / 1024 / 1024).toFixed(2) + ' MB';
        res.json({
            bytes: bytes,
            megaBytes: megaBytes
        });
      });
}

module.exports = {
    index, find, add, updateUsername, updatePassword, remove, storage
}