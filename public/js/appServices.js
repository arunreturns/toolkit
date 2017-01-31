/* global angular Notification navigator */

angular.module('appServices', []).
service("Notification", function(){
    var Notif = {
        createNotification: function(message){
            var options = {
                body: message,
                dir: "ltr",
                icon: "images/notif.png",
                vibrate: []
            };
            navigator.serviceWorker.ready.then(function(registration) {
                registration.showNotification('File Notification', options);
            });
        },
        notify: function(message) {
            
            // Let's check if the browser supports notifications
            if (!("Notification" in window)) {
                alert("This browser does not support desktop notification");
            }
            // Let's check if the user is okay to get some notification
            else if (Notification.permission === "granted") {
                // If it's okay let's create a notification
                this.createNotification(message);
            }
            else if (Notification.permission !== 'denied') {
                Notification.requestPermission(function(permission) {
                    if (permission === 'granted') {
                        this.createNotification(message);
                    }
                });
            }
        }
    };
    
    return Notif;
})

.service("HttpWrapper", function($http, UIService, $log){
    var HttpWrapper = {
        get: function(url, options){
            UIService.isLoading = true;
            let httpPromise = $http.get(url, options);
            
            httpPromise.success(function(resp){
                $log.info("Successful response during get of " + url);
                $log.info("Response " , resp);
                UIService.isLoading = false;
            }).error(function(err, data, status, headers){
                $log.info("Error during get of " + url);
                $log.info("Error " + err);
                $log.info("Status: " + status);
                UIService.isLoading = false;
            });
            
            return httpPromise;
        },
        
        post: function(url, body, options){
            UIService.isLoading = true;
            let httpPromise = $http.post(url, body, options);
            
            httpPromise.success(function(resp){
                $log.info("Successful response during post of " + url);
                $log.info("Response " , resp);
                UIService.isLoading = false;
            }).error(function(err, data, status, headers){
                $log.info("Error during post of " + url);
                $log.info("Error " + err);
                $log.info("Status: " + status);
                UIService.isLoading = false;
            });
            
            return httpPromise;
        }
    };
    
    return HttpWrapper;
})
.service("UIService", function(){
    var UIService = {
        isLoading: false,
    };
    
    return UIService;
});