
var t = angular.module('t', ['ng', 'ngw']);

t.config(
    function (ngwWidgetTypeProvider) {
        ngwWidgetTypeProvider.containerType(
            'headerLayout',
            function () {
                return {
                    controller: function ($scope) {
                        console.log('in the headerLayout controller');
                        var widgets = {
                            header: [],
                            footer: [],
                            leader: [],
                            trailer: [],
                            main: []
                        };

                        $scope.widgets = widgets;

                        // TODO: this interface should also tell us which widget to add the new one after,
                        // if any. Otherwise we don't know the order of the children.
                        this.addChild = function (widget) {
                            // TODO: We ought to $observe this attribute to allow for it to possibly change
                            // later.
                            console.log('headerLayout accepts child', widget);
                            var place = widget.attrs.layoutPlace;
                            console.log('wants to be in', place);
                            if (!place) return;
                            var placeWidgets = widgets[place];
                            console.log('widgets there are', placeWidgets);
                            if (!placeWidgets) return;
                            placeWidgets.push(widget);
                            console.log('and now', placeWidgets);
                        };
                        this.removeChild = function (widget) {
                            var place = widget.attrs.layoutPlace;
                            if (!place) return;
                            var placeWidgets = widgets[place];
                            if (!placeWidgets) return;
                            placeWidgets = placeWidgets.splice(
                                placeWidgets.indexOf(widget), 1
                            );
                        };
                    },
                    template: '<style>div {display: flex;justify-content: space-between;} .outer, .header, .leading, .main, .trailing, .footer { flex-direction: column }</style><div class="outer"><div class="header"><ngw-child widget="widget" ng-repeat="widget in widgets.header"></ngw-child></div><div class="middle"><div class="leading"><ngw-child widget="widget" ng-repeat="widget in widgets.leader"></ngw-child></div><div class="main"><ngw-child widget="widget" ng-repeat="widgets in widgets.main"></ngw-child></div><div class="trailing"><ngw-child widget="widget" ng-repeat="widget in widgets.trailer"></ngw-child></div></div><div class="footer"><ngw-child widget="widget" ng-repeat="widget in widgets.footer"></ngw-child></div></div>'
                };
            }
        );
        ngwWidgetTypeProvider.type(
            'htmlWidget',
            function () {
                return {
                    template: '<content></content>'
                };
            }
        );
    }
);

t.controller(
    'TestController',
    function ($scope) {
    }
);