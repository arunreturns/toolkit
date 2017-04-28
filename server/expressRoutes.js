var fs                      = require('fs');
var JSZip 		            = require("jszip");
var wget                    = require('wget-improved');
var reddit                  = require('redwrap');
var multiparty 				= require('connect-multiparty');
var multipartyMiddleware 	= multiparty();
var path                    = require('path');
var gifify                  = require('gifify');
var request                 = require('request').defaults({ encoding: null });
module.exports = function(app) {
    
    var download = function(uri, resp, callback) {
        request.head(uri, function(err, res, body) {
            if ( err ){
                console.log(err);
            }
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);
            res.headers['content-type'] = "data:" + res.headers["content-type"] + ";base64";
            
            request.get(uri, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
                    resp.send(data);
                }
            });
        });
    };
    
    function sendZipData(res, filename){
        fs.readFile(filename, function(err, data) {
            if (err) throw err;
            
            try {
                var zip = new JSZip(data);    
                var files = zip.files;
                var FileList = [];
                var FileData;
                for (var name in files) {
                    var zipEntry = files[name];
                    FileData = {};
                    FileData.filename = zipEntry.name;
                    FileData.filecontents = zipEntry.asText();
                    FileList.push(FileData);
                }
                res.status(200).send(FileList);  
            } catch ( err ) {
                res.status(500).send('Not a valid zip: ' + err);
            }
        });
    }
    
    app.post('/getImage', function(req, res){
        var imageUrl = req.body.imageUrl;

        download(imageUrl, res, function() {
            console.log('done');
        });
    });
    
    app.post('/getFile', function(req, res){
        var src = req.body.URL;
        var outputFile = __dirname + "/fetch/" + req.body.zipName + ".zip";
        
        var download = wget.download(src, outputFile);
        download.on('error', function(err) {
            res.status(500).send('Incorrect URL: ' + err);
        });
        download.on('start', function(fileSize) {
            //console.log("Starting",fileSize);
        });
        download.on('end', function(output) {
            console.log(output);
            sendZipData(res, outputFile);
            fs.unlinkSync(outputFile);
        });
        download.on('progress', function(progress) {
            //console.log(progress);
        });
    });

    app.get('/validate', function (req, res) {
        var diff = require('deep-diff').diff;
        var firstJSON = require(__dirname + '/server/firstJSON.json');
        var secondJSON = require(__dirname + '/server/secondJSON.json');
        
        var differences = diff(firstJSON, secondJSON);

        fs.unlinkSync(__dirname + '/server/firstJSON.json');
        fs.unlinkSync(__dirname + '/server/secondJSON.json');
        //console.log("Diff", differences);
        res.status(200).send(differences);
    });

    app.post('/uploadFiles', multipartyMiddleware, function (req, res) {
        //console.log("{uploadFiles} => Inside Upload File");
        var file = req.files.file;
        var type = req.body.type;

        var readStream = fs.createReadStream(file.path);

        var writeStream = fs.createWriteStream(__dirname + '/server/' + type + '.json');
        
        readStream.pipe(writeStream);

        writeStream.on('close', function (writtenFile) {
            //console.log("{uploadFiles} => " + writtenFile + 'Written To DB');
            res.status(200).send("File Uploaded successfully");
        });
    });
    
    app.post('/renderPage', function(req, res){
        var subReddit = req.body.subReddit;
        reddit.r(subReddit, function(err, data, resp) {
            if ( err ){
                console.error(err);
                res.status(500).send(err);
            }
            res.status(200).send(data); //outputs object representing first page of WTF subreddit 
        });
    });
    
    app.post('/nextPage', function(req, res){
        var subReddit = req.body.subReddit;
        var Id = req.body.Id;
        reddit.r(subReddit).count(25).after(Id , function(err, data, resp) {
            if ( err ){
                console.error(err);
                res.status(500).send(err);
            }
            res.status(200).send(data); //outputs object representing first page of WTF subreddit 
        });
    });
    
    app.post('/prevPage', function(req, res){
        var subReddit = req.body.subReddit;
        var Id = req.body.Id;
        reddit.r(subReddit).count(25).before(Id , function(err, data, resp) {
            if ( err ){
                console.error(err);
                res.status(500).send(err);
            }
            res.status(200).send(data); //outputs object representing first page of WTF subreddit 
        });
    });
    
    app.get('/getGames', function(req, res){
        fs.readdir(__dirname + '/public', function(err, files){
            if ( err ){
                console.log(err);
                res.end();
            }
            var filesList = [];
            for (var i in files) {
                if (path.extname(files[i]) === ".swf") {
                    filesList.push(files[i]);
                }
            }
            res.status(200).send(filesList);
        });
    });
    
    app.get('/testURL', function(req, res){
        res.status(200).send("Success");  
    });
    
    app.post('/getFileFromUrl', function(req, res){
        var src = req.body.url;
        console.log("URL Is ", src);
        var outputFile = __dirname + "/server/fetch/videos/output.mp4";
        
        var download = wget.download(src, outputFile);
        download.on('error', function(err) {
            res.status(500).send('Incorrect URL: ' + err);
        });
        download.on('start', function(fileSize) {
            //console.log("Starting",fileSize);
        });
        download.on('end', function(output) {
            console.log("End " + output);
            createGifFromVideo(outputFile, function(){
                res.sendfile(__dirname + "/server/fetch/gifs/output.gif");
            });
        });
        download.on('progress', function(progress) {
            //console.log(progress);
        });
    });
    
    app.post('/convertFileToGif', function(req, res){
        var filename = req.body.filename;
        
        createGifFromVideo(filename);
    });
    
    function createGifFromVideo(filename, callback) {
        console.log("Inside createGifFromVideo");
        var input = path.join(__dirname, '/server/fetch/videos/', filename);
        var output = path.join(__dirname, '/server/fetch/gifs/', 'output.gif');
    
        var gif = fs.createWriteStream(output);
    
        var options = {};
    
        gifify(input, options).pipe(gif);
    
        gif.on('close', function end() {
            console.log('gifified ' + input + ' to ' + output);
            callback(output);
        });
    }
};