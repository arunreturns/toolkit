/* global angular,JSZip,saveAs,Blob */

angular.module('appControllers', ['ngMessages', 'ngFileUpload', 'ngMaterial'])

.controller('AppCtrl', function($scope, $window, $mdSidenav, UIService){
    $scope.ui = UIService;
    $scope.menuLinks = [
        { link : '#/get-file', icon: 'file_download', name: 'Get File' },
        { link : '#/compare-json', icon: 'compare_arrows', name: 'Compare JSON' },
        { link : '#/youtube-viewer', icon: 'subscriptions', name: 'Youtube Viewer' },
        { link : '#/parse-json', icon: 'compare_arrows', name: 'Parse JSON' },
        { link : '#/reddit-viewer', icon: 'home', name: 'Reddit Viewer' },
        { link : '#/game-player', icon: 'gamepad', name: 'Games' },
        { link : '#/mail-me', icon: 'mail', name: 'Mail' }
    ];
    
    $scope.links = [
        {
            display: 'Get File',
            url: '#/get'
        },
        {
            display: 'Validate JSON',
            url: '#/val'
        },
        {
            display: 'Frame Viewer',
            url: '#/frame'
        },
        {
            display: 'Parse JSON',
            url: '#/parse'
        },
        {
            display: 'Reddit Viewer',
            url: '#/reddit'
        },
        {
            display: 'Games',
            url: '#/game'
        },
        {
            display: 'Create GIF',
            url: '#/giffy'
        }
    ];
    
    
    $scope.toggleNav = function(){
        $mdSidenav('left').toggle();
    };
    
})

.controller('GetFileCtrl', function($scope, $log, HttpWrapper, Notification){
    $scope.getFile = function(){
        $log.info("Getting file");
        HttpWrapper.post('/getFile', {
            URL: $scope.fileUrl,
            zipName: $scope.zipName
        })
        .success(function(fileList){
            var zip = new JSZip();
            for ( var i = 0 ; i < fileList.length ; i++ ){
                zip.file(fileList[i].filename, fileList[i].filecontents);
            }
            $log.info("Generating zip");
            zip.generateAsync({
                type: "blob"
            }).then(function(blob) {
                $log.info("Saving zip file",$scope.zipName);
                saveAs(blob, $scope.zipName);
                Notification.notify("Zip file saved");
            }, function(err) {
                $log.error(err);
            });
        });
    };
})

.controller('ParseJSONCtrl', function($scope, $log, HttpWrapper){
    
    $scope.parseJSONToFile = function(){
        $log.info("Parsing JSON file");
        let currDate = new Date().toISOString();
        var fileDate = currDate.slice(0, 10) + "_" + currDate.slice(11, 19);
        var paths = $scope.jsonPath.split(".");
        var jsonData = JSON.parse($scope.jsonInput);
        var objectData = jsonData;
        for ( var i = 0; i < paths.length; i++ ){
            var path = paths[i];
            objectData = objectData[path] || {};
            if ( objectData === {} ) 
                return false;
        }
        var finalData = JSON.parse(objectData);
        $log.info(finalData);
        
        var data = new Blob([JSON.stringify(finalData)], { type: 'text/json;charset=utf-8' });
        saveAs(data, "output_" + fileDate + ".json");
    };
    
})

.controller('CompareJSONCtrl', function($scope, $log, HttpWrapper, Upload){
    $scope.validate = function(){
        HttpWrapper.get('/validate')
        .success(function(diff){
            $scope.differences = diff;
        }).error(function(err){
            $log.error(err);
            $scope.firstJSON = $scope.secondJSON = null;
        });
    };
    
    $scope.getColor = function(kind){
        var colorMap = {
            "D": "red",
            "N": "green",
            "A": "blue",
            "E": "yellow"
        };
        
        return colorMap[kind];
    };

    $scope.upload = function (file, type) {
        $scope[type] = file;
        if ( !file )
            return;
        file.upload = Upload.upload({
            url: 'uploadFiles',
            data: {
                file: file,
                type: type
            }
        });

        file.upload.then(function (resp) {
            $log.info('[UploadCtrl] => Success ' + resp.config.data.file.name + 'uploaded');
            $log.info('[UploadCtrl] => Response: ' + resp.data);
            $scope[type] = 'Done';
        }, function (resp) {
            $log.info('[UploadCtrl] => Error status: ' + resp.status);
        }, function (evt) {
            file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total, 10));
            $scope[type].progress = file.progress;
            $log.info('[UploadCtrl] => Progress: ' + file.progress + '% ' + evt.config.data.file.name);
        }, function (err) {
            if ( err ) {
                $log.error(err);
                return err;
            }
            $scope[type] = null;
        });
    };
    
})

.controller('YoutubeViewerCtrl', function($scope, $log){
    $scope.fullURL = null;
    $scope.frameWidth = $scope.frameHeight = 50;
    $scope.changeURL = function(){
        if ( $scope.urlVal.indexOf("youtube") === -1 )
            $scope.fullURL = 'https://www.youtube.com/embed/' + $scope.urlVal;
        else 
            $scope.fullURL = $scope.urlVal;
    };
})

.controller('MailCtrl', function($scope, $log, $http, Upload){
    $scope.uploadAttachment = function (file, type) {
        $scope[type] = file;
        if ( !file )
            return;
        file.upload = Upload.upload({
            url: 'uploadAttachment',
            data: {
                file: file,
                type: type
            }
        });

        file.upload.then(function (resp) {
            $scope.attachmentFileName = resp.config.data.file.name;
            $log.info('[MailCtrl] => Success ' + resp.config.data.file.name + 'uploaded');
            $log.info('[MailCtrl] => Response: ' + resp.data);
            $scope[type] = 'Done';
        }, function (resp) {
            $log.info('[MailCtrl] => Error status: ' + resp.status);
        }, function (evt) {
            file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total, 10));
            $scope[type].progress = file.progress;
            $log.info('[MailCtrl] => Progress: ' + file.progress + '% ' + evt.config.data.file.name);
        }, function (err) {
            if ( err ) {
                $log.error(err);
                return err;
            }
            $scope[type] = null;
        });
    };
    $scope.sendMail = function(){
        $http.post("/sendMail", {
            mailContent: $scope.mailContent,
            emailAddress: $scope.emailAddress,
            mailSubject: $scope.mailSubject,
            attachmentFileName: $scope.attachmentFileName
        })
        .success(function() {
            $log.info("Mail Sent");
        })
        .error(function(err) {
            $log.error(err);
        });
    };
})

.controller('RedditViewerCtrl', function($scope, $log, HttpWrapper) {
    $scope.subreddits = ['Jokes', 'WTF', 'DirtyJokes', 'Funny'];
    
    $scope.posts = [];
    $scope.getPage = function() {
        HttpWrapper.post('/renderPage', {
            subReddit: $scope.selectedSubReddit
        })
        .success(function(subredditData) {
            $log.info(subredditData.data.children);
            $scope.posts = subredditData.data.children;
        })
        .error(function(err) {
            $log.error(err);
        });
    };
    
    $scope.getImage = function(post){
        var availableResolutions = post.data.preview.images[0].resolutions;
        var expectedResolution = availableResolutions[availableResolutions.length - (availableResolutions.length/2)];
        var imageUrl = expectedResolution.url; // Pretty big right?
        HttpWrapper.post('/getImage', {
            imageUrl: imageUrl
        }, { hideLoader: false })
        .success(function(image) {
            post.imageUrl = image;
        })
        .error(function(err) {
            $log.error(err);
        });
    };

    $scope.nextPage = function() {
        var Id = $scope.posts[$scope.posts.length - 1].data.name;
        $log.info("Fetching for next id ", Id);
        HttpWrapper.post('/nextPage', {
            subReddit: $scope.selectedSubReddit,
            Id: Id
        })
        .success(function(subredditData) {
            $scope.posts = subredditData.data.children;
        });
    };
    
    $scope.prevPage = function() {
        var Id = $scope.posts[0].data.name;
        $log.info("Fetching for next id ", Id);
        HttpWrapper.post('/prevPage', {
            subReddit: $scope.selectedSubReddit,
            Id: Id
        })
        .success(function(subredditData) {
            $scope.posts = subredditData.data.children;
        });
    };
})

.controller('GamePlayerCtrl', function($scope, $log, HttpWrapper){
    
    $scope.getGames = function(){
        HttpWrapper.get('/getGames')
        .success(function(gamesList){
            $scope.games = gamesList;
        });
    };
    
})

.controller('GifCreatorCtrl', function($scope, $log, HttpWrapper, Upload){
    $scope.inputTypes = ['URL', 'Upload'];
    
    $scope.uploadFileAndConvert = function (file, type) {
        $scope[type] = file;
        if ( !file )
            return;
        file.upload = Upload.upload({
            url: 'uploadFiles',
            data: {
                file: file,
                type: type
            }
        });

        file.upload.then(function (resp) {
            $log.info('[GifCtrl] => Success ' + resp.config.data.file.name + 'uploaded');
            $scope.filename =  resp.config.data.file.name;
            $log.info('[GifCtrl] => Response: ' + resp.data);
            $scope[type] = 'Done';
        }, function (resp) {
            $log.info('[GifCtrl] => Error status: ' + resp.status);
        }, function (evt) {
            file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total, 10));
            $log.info('[GifCtrl] => Progress: ' + file.progress + '% ' + evt.config.data.file.name);
        }, function (err) {
            if ( err ) {
                $log.error(err);
                return err;
            }
            $scope[type] = null;
        });
    };
    
    $scope.convertFileFromURL = function(){
        $log.info("Getting video from " + $scope.videoUrl);
        HttpWrapper.post('/getFileFromUrl', {
            url: $scope.videoUrl
        })
        .success(function(file) {
            saveAs(file, "test.gif");
        });
    };
    
    $scope.convertFileFromSrc = function(){
        HttpWrapper.post('/convertFileToGif', {
            filename: $scope.filename
        })
        .success(function(file) {
            $log.info(file);
        });
    };
})