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

     // This bit is just lifted right out of the angular $compile service, since Angular
     // doesn't allow us to call into its version of this function.
     var LOCAL_REGEXP = /^\s*([@=&#])(\??)\s*(\w*)\s*$/;
     function buildShadowScope(reqs, attrs, scope, $interpolate, $parse) {
         var isolateScope = scope.$new(true);
         angular.forEach(
             reqs,
             function(definition, scopeName) {
                 var match = definition.match(LOCAL_REGEXP);
                 var attrName = match[3] || scopeName;
                 var optional = (match[2] == '?');
                 var mode = match[1];
                 var parentGet, parentSet, compare, lastValue;

                 isolateScope.$$isolateBindings[scopeName] = mode + attrName;

                 switch (mode) {
                     case '@': {
                         attrs.$observe(
                             attrName,
                             function(value) {
                                 isolateScope[scopeName] = value;
                             }
                         );
                         attrs.$$observers[attrName].$$scope = scope;
                         if(attrs[attrName]) {
                             // If the attribute has been provided then we trigger an interpolation to ensure
                             // the value is there for use in the link fn
                             isolateScope[scopeName] = $interpolate(attrs[attrName])(scope);
                         }
                         break;
                     }

                     case '=': {
                         if (optional && !attrs[attrName]) {
                             return;
                         }
                         parentGet = $parse(attrs[attrName]);
                         if (parentGet.literal) {
                             compare = equals;
                         } else {
                             compare = function(a,b) { return a === b; };
                         }
                         parentSet = parentGet.assign || function() {
                             // reset the change, or we will throw this exception on every $digest
                             lastValue = isolateScope[scopeName] = parentGet(scope);
                             throw $compileMinErr(
                                 'nonassign',
                                 "Expression '{0}' used with directive '{1}' is non-assignable!",
                                 attrs[attrName], newIsolateScopeDirective.name
                             );
                         };
                         lastValue = isolateScope[scopeName] = parentGet(scope);
                         isolateScope.$watch(
                             function parentValueWatch() {
                                 var parentValue = parentGet(scope);
                                 if (!compare(parentValue, isolateScope[scopeName])) {
                                     // we are out of sync and need to copy
                                     if (!compare(parentValue, lastValue)) {
                                         // parent changed and it has precedence
                                         isolateScope[scopeName] = parentValue;
                                     } else {
                                         // if the parent can be assigned then do so
                                         parentSet(scope, parentValue = isolateScope[scopeName]);
                                     }
                                 }
                                 return lastValue = parentValue;
                             }, null, parentGet.literal
                         );
                         break;
                     }

                     case '&': {
                         parentGet = $parse(attrs[attrName]);
                         isolateScope[scopeName] = function(locals) {
                             return parentGet(scope, locals);
                         };

                         break;
                     }
                 }
             }
         );
         return isolateScope;
     }

     ngw.provider(
         'ngwWidgetType',
         function ($compileProvider) {
             var widgetTypes = {};

             function register(name, declFunc, isContainer) {

                 var directiveFactory = function (
                     $injector,
                     $http,
                     $sce,
                     $templateCache,
                     $compile,
                     $interpolate,
                     $parse
                 ) {

                     // Invoke the *widget type* factory to give us the decl information
                     // we'll use to build the *directive* definition.
                     var decl = $injector.invoke(declFunc);

                     var template = decl.template;
                     var templateUrl = decl.templateUrl; // not yet supported
                     var scopeReqs = decl.scope || {};

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

                                     // shadowScope is private to this widget instance and is
                                     // what the widget's template is linked to. This is similar
                                     // to the native isolate scope feature on AngularJS directives,
                                     // but ours is different because the shadow scope is used
                                     var shadowScope = buildShadowScope(
                                         scopeReqs,
                                         iAttrs,
                                         scope,
                                         $interpolate,
                                         $parse
                                     );

                                     // A widget's id is its shadow scope's id, so we can piggy-back
                                     // on the id allocator already present in Angular.
                                     var instanceId = shadowScope.$id;
                                     var instanceClass = instanceClassPrefix + instanceId;

                                     console.log('pre-linking instance', instanceId);

                                     var intData = {};
                                     iElement.data(intDataKey, intData);

                                     intData.instanceId = instanceId;
                                     intData.instanceClass = instanceClass;
                                     intData.shadowScope = shadowScope;
                                     intData.element = iElement;

                                     if (isContainer) {
                                         intData.registerChild = function (childIntData) {
                                             console.log('instance', instanceId, 'has child', childIntData.instanceId);
                                         };
                                         intData.unregisterChild = function (childIntData) {
                                             console.log('instance', instanceId, 'no longer has child', childIntData.instanceId);
                                         };
                                     }

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
                                         if (parentIntData.registerChild) {
                                             parentIntData.registerChild(intData);
                                         }
                                         iElement.bind(
                                             '$destroy',
                                             function () {
                                                 parentIntData.unregisterChild(intData);
                                             }
                                         );
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

                                     console.log('shadow scope is', intData.shadowScope);

                                     shadowLink(intData.shadowScope);
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
