angular.module('fileApp', ['appControllers','appDirectives','appServices','appRoutes','ngAnimate', 'ngMaterial'])
.config(function($sceDelegateProvider) {
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