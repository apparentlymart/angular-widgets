(function (angular, document) {

     var intDataKey = 'ngwInternalData';
     var widgetClass = 'ngw-widget';
     var instanceClassPrefix = 'ngw-instance-';

     // Determine what the shadow DOM creation function is called here.
     // If an app wants to use Polymer to try to polyfill shadow DOM
     // then that must be loaded before loading this source file.
     var shadowCreateName;
     if (document.body.createShadowRoot !== undefined) {
         shadowCreateName = 'createShadowRoot';
     }
     else if (document.body.webkitCreateShadowRoot !== undefined) {
         shadowCreateName = 'webkitCreateShadowRoot';
     }

     var ngw = angular.module('ngw', ['ng']);

     ngw.provider(
         'ngwWidgetType',
         function ($compileProvider) {
             var widgetTypes = {};
             var nextInstanceId = 1;

             function register(name, declFunc, isContainer) {

                 var directiveFactory = function ($injector, $http, $sce, $templateCache, $compile) {

                     // Invoke the *widget type* factory to give us the decl information
                     // we'll use to build the *directive* definition.
                     var decl = $injector.invoke(declFunc);

                     var template = decl.template;
                     var templateUrl = decl.templateUrl; // not yet supported

                     var directiveDecl = {
                         restrict: 'E', // widgets can only be used as elements
                         scope: false, // we'll manage our own separate shadow scope
                         compile: function (tElement, tAttrs) {
                             // If the current browser doesn't seem to support shadow DOM, then bail here.
                             // We wait until this point so that an app can choose to use widgets only for
                             // part of its functionality, and only require shadow DOM for that part.
                             if (shadowCreateName === undefined) {
                                 throw new Error('Cannot use widget ' + name + '; shadow DOM not supported');
                             }

                             return {
                                 pre: function (scope, iElement, iAttrs) {

                                     var instanceId = nextInstanceId++;
                                     var instanceClass = instanceClassPrefix + instanceId;

                                     console.log('pre-linking instance', instanceId);

                                     var intData = {};
                                     intData.instanceId = instanceId;
                                     intData.instanceClass = instanceClass;
                                     iElement.data(intDataKey, intData);

                                     // We add general widget class to all widget elements, and we
                                     // also add an instance-specific class so we can find a particular
                                     // instance during DOM traversals later.
                                     iAttrs.$addClass(widgetClass);
                                     iAttrs.$addClass(instanceClass);

                                     var parentIntData;
                                     var parentElement = iElement.parent();
                                     if (parentElement) {
                                         parentIntData = parentElement.data(intDataKey);
                                     }
                                     if (parentIntData) {
                                         console.log('instance', instanceId, 'has parent', parentIntData.instanceId);
                                     }
                                 },
                                 post: function (scope, iElement, iAttrs) {
                                     var intData = iElement.data(intDataKey);
                                     console.log('post-linking instance', intData.instanceId);

                                     var shadowRoot = angular.element(
                                         iElement[0][shadowCreateName].apply(iElement[0], [])
                                     );

                                     shadowRoot.html(template);
                                     var shadowLink = $compile(shadowRoot);

                                     shadowLink(scope);

                                 }
                             };
                         }
                     };

                     return directiveDecl;
                 };

                 $compileProvider.directive(name, directiveFactory);

             }

             this.type = function (name, decl) {
                 return register(name, decl, false);
             };

             this.containerType = function (name, decl) {
                 return register(name, decl, true);
             };

             this.$get = function () {
                 var ngwWidgetType = function (name) {
                     // Not really sure what we'll be returning here, since $compile takes care of
                     // instantiating widgets via the directive interface.
                 };
             };
         }
     );

})(angular, document);
