/* global angular */

angular.module('appDirectives', [])
    .directive('flashEmbed', [function() {
        return {
            restrict: 'A',
            replace: true,
            template: ['',
                '<object data="{{src}}" type="application/x-shockwave-flash">',
                '<param name="allowscriptaccess" value="always" />',
                '<param name="allowfullscreen" value="true" />',
                '<param name="wmode" value="transparent" />',
                '</object>'
            ].join(''),
            scope: {
                width: '@',
                height: '@',
                src: '@'
            },
            compile: function(elem, attrs, transcludeFn) {
                return function link(scope, element, attrs) {
                    scope.$watch('src', function(src) {
                        element.append('<param name="movie" value="' + src + '" />');
                    });
                };
            }
        };
    }]);