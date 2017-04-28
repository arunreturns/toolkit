angular.module('toolkitApp', ['appControllers', 'appDirectives', 'appServices', 'appRoutes', 'ngAnimate', 'ngMaterial'])
    .config(function($sceDelegateProvider, $mdThemingProvider) {

        $mdThemingProvider.theme('default')
            .primaryPalette('indigo')
            .accentPalette('pink');

        if ('serviceWorker' in navigator) {
            console.log('Service Worker is supported');
            navigator.serviceWorker.register('sw.js').then(function(reg) {
                console.log(':^)', reg);
            }).catch(function(err) {
                console.log(':^(', err);
            });
        }
        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            'https://www.youtube.com/**',
            'https://www.reddit.com/**'
        ]);
    })
    .run(
        function($rootScope, $state, UIService) {
            $rootScope.$on('$stateChangeStart', function() {
                UIService.isLoading = true;
            });
            $rootScope.$on('$stateChangeSuccess', function() {
                UIService.isLoading = false;
            });
            $rootScope.$on('$stateChangeError', function() {
                UIService.isLoading = false;
            });
        }
    );