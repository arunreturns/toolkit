var fs = require('fs');
var JSZip = require("jszip");
var wget = require('wget-improved');
var reddit = require('redwrap');
var multiparty = require('connect-multiparty');
var multipartyMiddleware = multiparty();
var path = require('path');
var gifify = require('gifify');
var request = require('request').defaults({
    encoding: null
});
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var mailer;
module.exports = function(app) {

    request.get('https://api.heroku.com/apps/toolykit/config-vars', {
        encoding: 'utf-8'
    }, function(error, response, body) {
        if (error) {
            console.log(error);
        }
        var options = {
		    auth: {
		        api_key: process.env.SENDGRID_KEY
		    }
		};
		mailer = nodemailer.createTransport(sgTransport(options));
    });
    
    var download = function(uri, resp, callback) {
        request.get(uri, {
            timeout: 1500
        }, function(error, response, body) {
            console.log(response.statusCode);
            if (error) {
                console.log(error);
            }
            if (!error && response.statusCode == 200) {
                console.log("Parsing data");
                var data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
                resp.send(data);
            }
            else {
                resp.status(500).send("Error while fetching Image");
            }
        });
    };
    
    /*
		Method to send mail to the user
		Params: methodName		=>	For logging
				userEmail		=> 	The email address to where the mail is to be sent
				subject			=> 	The subject of the mail
				content			=> 	The content of the mail
				res				=> 	The response object for error and data
				attachment		=> 	Attachement to be sent along with the mail
	*/
	var sendMail = function(methodName, userEmail, subject, content, res, attachment, cb){
		var email = {
			to: userEmail,
			from: 'FileStore',
			subject: subject,
			text: content,
			html: content,
			attachments: []
		};
		if ( attachment && attachment !== null ) {
			email.attachments.push(attachment);
		}
		
		mailer.sendMail(email, function(err, resp) {
			if (err) {
				console.log("{" + methodName + "} Error while sending mail " + err);
				res.status(500).send(err);	
				res.end();
			} else {
				console.log("{" + methodName + "} => Mail response is " , resp);
				res.status(200).send(resp);
				cb();
				res.end();
			}
		});
	};

    function sendZipData(res, filename) {
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
            }
            catch (err) {
                res.status(500).send('Not a valid zip: ' + err);
            }
        });
    }

    app.post('/sendMail', function(req, res) {
        var mailContent = req.body.mailContent;
        var emailAddress = req.body.emailAddress;
        var mailSubject = req.body.mailSubject;
        var attachmentFileName = req.body.attachmentFileName;
        var attachment = null;
        
        if ( attachmentFileName ){
            var attachmentPath = path.join(__dirname, attachmentFileName);
            console.log("Reading ", attachmentPath);
            attachment = {
        		filename: attachmentFileName,
        		content: fs.createReadStream(attachmentPath)
    		};
        }
        sendMail("sendMail", emailAddress, mailSubject, mailContent, res, attachment, function(){
            fs.unlinkSync(path.join(__dirname, attachmentFileName));
        });
    });

    app.post('/getImage', function(req, res) {
        var imageUrl = req.body.imageUrl;

        download(imageUrl, res, function() {
            console.log('done');
        });
    });

    app.post('/getFile', function(req, res) {
        var src = req.body.URL;
        var outputFile = path.join(__dirname, "fetch", req.body.zipName + ".zip");

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

    app.get('/validate', function(req, res) {
        var diff = require('deep-diff').diff;
        var firstJSONPath = path.join(__dirname, "firstJSON.json");
        var secondJSONPath = path.join(__dirname, "secondJSON.json");
        console.log("[/validate] => First JSON Path " + firstJSONPath);
        console.log("[/validate] => Second JSON Path " + secondJSONPath);
        var firstJSON = require(firstJSONPath);
        var secondJSON = require(secondJSONPath);

        var differences = diff(firstJSON, secondJSON);

        fs.unlinkSync(firstJSONPath);
        fs.unlinkSync(secondJSONPath);
        //console.log("Diff", differences);
        res.status(200).send(differences);
    });

    app.post('/uploadFiles', multipartyMiddleware, function(req, res) {
        console.log("[/uploadFiles] => Inside Upload File");
        var file = req.files.file;
        var type = req.body.type;
        var filePath = path.join(__dirname, type + ".json");
        console.log("[/uploadFiles] => File Path is " + filePath);

        if (!fs.existsSync(filePath)) {
            console.log("[/uploadFiles] => Path doesn't exist");
            fs.closeSync(fs.openSync(filePath, 'a'));
        }
        var readStream = fs.createReadStream(file.path);
        var writeStream = fs.createWriteStream(filePath);

        readStream.pipe(writeStream);

        writeStream.on('close', function(writtenFile) {
            console.log("[/uploadFiles] => File Uploaded successfully");
            res.status(200).send("File Uploaded successfully");
        });
    });

    app.post('/uploadAttachment', multipartyMiddleware, function(req, res) {
        console.log("[/uploadAttachment] => Inside uploadAttachment");
        var file = req.files.file;
        var filePath = path.join(__dirname, file.name);
        console.log("[/uploadAttachment] => File Path is " + filePath);

        if (!fs.existsSync(filePath)) {
            console.log("[/uploadAttachment] => Path doesn't exist");
            fs.closeSync(fs.openSync(filePath, 'a'));
        }
        var readStream = fs.createReadStream(file.path);
        var writeStream = fs.createWriteStream(filePath);

        readStream.pipe(writeStream);

        writeStream.on('close', function(writtenFile) {
            console.log("[/uploadAttachment] => File Uploaded successfully");
            res.status(200).send("File Uploaded successfully");
        });
    });

    app.post('/renderPage', function(req, res) {
        var subReddit = req.body.subReddit;
        reddit.r(subReddit, function(err, data, resp) {
            if (err) {
                console.error(err);
                res.status(500).send(err);
            }
            res.status(200).send(data);
        });
    });

    app.post('/nextPage', function(req, res) {
        var subReddit = req.body.subReddit;
        var Id = req.body.Id;
        reddit.r(subReddit).count(25).after(Id, function(err, data, resp) {
            if (err) {
                console.error(err);
                res.status(500).send(err);
            }
            res.status(200).send(data);
        });
    });

    app.post('/prevPage', function(req, res) {
        var subReddit = req.body.subReddit;
        var Id = req.body.Id;
        reddit.r(subReddit).count(25).before(Id, function(err, data, resp) {
            if (err) {
                console.error(err);
                res.status(500).send(err);
            }
            res.status(200).send(data);
        });
    });

    app.get('/getGames', function(req, res) {
        fs.readdir(__dirname + '/public', function(err, files) {
            if (err) {
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

    app.get('/testURL', function(req, res) {
        res.status(200).send("Success");
    });

    app.post('/getFileFromUrl', function(req, res) {
        var src = req.body.url;
        console.log("URL Is ", src);
        var outputFile = path.join(__dirname, 'fetch', "output.mp4");

        var download = wget.download(src, outputFile);
        download.on('error', function(err) {
            res.status(500).send('Incorrect URL: ' + err);
        });
        download.on('start', function(fileSize) {
            //console.log("Starting",fileSize);
        });
        download.on('end', function(output) {
            console.log("End " + output);
            createGifFromVideo(outputFile, function() {
                res.sendfile(path.join(__dirname, 'fetch', "output.gif"));
            });
        });
        download.on('progress', function(progress) {
            //console.log(progress);
        });
    });

    app.post('/convertFileToGif', function(req, res) {
        var filename = req.body.filename;

        createGifFromVideo(filename);
    });

    function createGifFromVideo(filename, callback) {
        console.log("Inside createGifFromVideo");
        var input = path.join(__dirname, 'fetch', filename);
        var output = path.join(__dirname, 'fetch', 'output.gif');

        var gif = fs.createWriteStream(output);

        var options = {};

        gifify(input, options).pipe(gif);

        gif.on('close', function end() {
            console.log('gifified ' + input + ' to ' + output);
            callback(output);
        });
    }
};