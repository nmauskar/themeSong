var express = require('express');
var request = require('request');
var async = require('async');
var mongoose = require('mongoose');
var conn = mongoose.connect("mongodb://localhost/27017");
var Schema = mongoose.Schema;
var router = express.Router();

//this is just an outline of what we are looking for
var UserSchema = new Schema({
    userid    : String,
    themeName : String,
    themeSong : String
});

//this connects to our database
var myUsers = conn.model('User', UserSchema);


const numItems = 10;

/* GET the theme song for alexa */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.post('/', function(req, res, next){
    //structures spotify search
    query = 'https://api.spotify.com/v1/search?q=' + req.body.query + '&type=track&limit=' + numItems;
    
    myUsers.count({userid : req.body.userid}, function(err, count){
        if(err){ 
            console.log(err);
        }
        if(count > 0){
            myUsers.findOne({userid : req.body.userid}, function(err, user){
                items = [];
                items.push({
                    name: user.themeName,
                    uri: user.themeSong
                });
                console.log(count);
                res.render('index', {title: req.body.query,
                                 songs: items});
            });
        } else {
            //performs http request for Spotify search
            request(query, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var items = [];
                    var given = JSON.parse(body).tracks.items;
                    //for loop to load all data into items[] 
                    async.eachSeries(given, 
                        function(data, cb){
                            items.push({
                                name: data.name,
                                uri: data.external_urls.spotify
                            });
                            cb(null);
                        }, 
                        function(err){
                            if(err){
                                console.log(err);
                            } else {
                                myUsers.create({userid: req.body.userid, themeName: items[0].name, themeSong: items[0].uri});
                                res.render('index', {title: req.body.query,
                                                 songs: items});
                            }
                        });
                }
            });

        }
    });

});

router.post('/device', function(req, res, next){
    req.body.userid;
});


module.exports = router;
