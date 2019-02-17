var express = require('express');
var app = express();
var path = require("path");
var fs = require('fs');
var morgan = require('morgan');
var cors = require('cors');
var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
var $ = require('jquery')(window);
const apiKey = 'AIzaSyA0NwqdqMCpS9JbXNaCYIyjwnrs8diZcU8';
const {google} = require('googleapis');
const youtube = google.youtube({
	version: 'v3',
	auth: apiKey
});
var c = new Array();

app.use(morgan('timy'));
app.use(cors()); 
/* Main request, load index.html file, identified as
 * Request → site1840.tw.cs.unibo.it/
 */
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname+'/index.html'));
	});


/* Function to res the js to client */
app.get('/script.js', function(req, res){
	res.sendFile(path.join(__dirname+'/script.js'));
});

/* Load and parse the json file on fvitali api
 */
app.get('/listvideos/:id', function(req, res){
	$.get("https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + req.params.id + "&key=" + apiKey, function(data) {
        res.send(data);
        });
}); 

/* Youtube Search */
app.get('/ytsearch/:query', function(req, res){
	youtube.search.list({
		part: 'snippet',
		q: req.params.query,
		maxResults: 20,
		type: 'video',
		videoCategoryId: '10'}, function(err, ris){
			if (err) console.error('Error: '+err);
			if (ris) {res.send(ris.data.items);}
		});
});

/* Related Search */
app.get('/related/:id', function(req, res){
	youtube.search.list({
		part: 'snippet',
		maxResults: 20,
		type: 'video',
		videoCategoryId: '10',
		relatedToVideoId: req.params.id}, function(err, ris){
			if(err) console.error('Error: '+err);
			if(ris) {res.send(ris.data.items);}
		});
	});

/* Get comments */
app.get('/getcomments/:id', function(req, res){
	$.ajax({
            		url: "https://www.googleapis.com/youtube/v3/commentThreads",
            		method: 'GET',
            		dataType: "json",
            		data: {
            			key: apiKey,
            			part: "snippet",
            			videoId: req.params.id
            		},
            		success: function(data){res.send(data.items);},
			error: function(err){
				console.error('Error: '+err);
			}
	});

});

/* Get video's stat. */
app.get('/getstat/:id', function(req, res){
	$.get("https://www.googleapis.com/youtube/v3/videos?part=statistics&id=" + req.params.id + "&key=" + apiKey, function(data) {
        	res.send(data.items[0]);
        });
});

/* Adding videos to absolute cronology */
app.get('/localPop/:videoId/:timesWatched/:prevalentReason/:lastSelected', function(req, res){
	var newvideo = {
		"videoId": req.params.videoId,
		"timesWatched": req.params.timesWatched,
		"prevalentReason": req.params.prevalentReason,
		"lastSelected": req.params.lastSelected
	}
        var flag=false;
        var newcounter;
        //create new object
        /*var newvideo = {
                "videoID": req.params.id,
                "counter": 1
        };*/
        if(req.params.videoId!='default'){
        if(c.length==0){
                c.push(newvideo);
        }
        else{
        for(var i in c){
                if(c[i].videoId==req.params.videoId){
                        flag=true;
                        c[i].timesWatched++;
                        newvideo=c[i];
                        c.splice(i,1);
                }
        }
        if(flag){
                if (c.length==0){
                        c.push(newvideo);}
                else{
                i=0;
                while((flag)&&(i<c.length)){
                        if(newvideo.timesWatched>=c[i].timesWatched){
                                c.splice(i, 0, newvideo);
                                flag=false;
                        }
                        i++;
                }
                if(flag) {c.push(newvideo);}
                }
        }
        else c.push(newvideo);
        }}
        res.send(c);
});


/* Middleware handling not found error*/
function notFound(req, res, next){
	res.status(404);
	const error = new Error('Not Found');
	next(error);
}

/* Middleware erroHandler*/
function errorHandler(error, req, res, next){
	res.status(res.statusCode || 500);
	res.json({
		message:error.message
	});
}

app.use(notFound);
app.use(errorHandler);

app.listen(8000);
console.log('Running at Port 8000');
