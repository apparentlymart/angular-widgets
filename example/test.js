
var t = angular.module('t', ['ng', 'ngw']);

t.config(
    function (ngwWidgetTypeProvider) {
        ngwWidgetTypeProvider.containerType(
            'simpleContainer',
            function () {
                console.log('in the simpleContainer type factory');
                return {
                    scope: {
                        name: '=name'
                    },
                    template: '<div>I am simpleContainer, {{ name }}!</div><content></content>'
                };
            }
        );
        ngwWidgetTypeProvider.type(
            'simpleLeaf',
            function () {
                console.log('in the simpleLeaf type factory');
                return {
                    scope: {
                        name: '=name'
                    },
                    template: '<div>I am simpleLeaf, {{ name }}!</div>'
                };
            }
        );
    }
);

t.controller(
    'TestController',
    function ($scope) {
        $scope.mainName = 'Jonas';
        $scope.otherNames = [
            'David',
            'Steve',
            'Peter',
            'Andrew'
        ];
    }
);