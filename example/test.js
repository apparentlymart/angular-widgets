
var t = angular.module('t', ['ng', 'ngw']);

t.config(
    function (ngwWidgetTypeProvider) {
        ngwWidgetTypeProvider.containerType(
            'simpleContainer',
            function () {
                console.log('in the simpleContainer type factory');
                return {};
            }
        );
        ngwWidgetTypeProvider.type(
            'simpleLeaf',
            function () {
                console.log('in the simpleLeaf type factory');
                return {};
            }
        );
    }
);
