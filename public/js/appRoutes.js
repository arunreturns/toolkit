/* global angular */

angular.module('appRoutes', ['ui.router'])
.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/get-file');
    $stateProvider
        .state('get-file', {
            url: '/get-file',
            templateUrl: 'views/get-file.html',
            controller: 'GetFileCtrl'
        })
        .state('parse-json', {
            url: '/parse-json',
            templateUrl: 'views/parse-json.html',
            controller: 'ParseJSONCtrl'
        })
        .state('compare-json', {
            url: '/compare-json',
            templateUrl: 'views/compare-json.html',
            controller: 'CompareJSONCtrl'
        })
        .state('youtube-viewer', {
            url: '/youtube-viewer',
            templateUrl: 'views/youtube-viewer.html',
            controller: 'YoutubeViewerCtrl'
        })
        .state('reddit-viewer', {
            url: '/reddit-viewer',
            templateUrl: 'views/reddit-viewer.html',
            controller: 'RedditViewerCtrl'
        })
        .state('game-player', {
            url: '/game-player',
            templateUrl: 'views/game-player.html',
            controller: 'GamePlayerCtrl'
        })
        .state('mail-me', {
            url: '/mail-me',
            templateUrl: 'views/mail-page.html',
            controller: 'MailCtrl'
        })
        .state('gif-creator', {
            url: '/gif-creator',
            templateUrl: 'views/gif-creator.html',
            controller: 'GifCreatorCtrl'
        });
});