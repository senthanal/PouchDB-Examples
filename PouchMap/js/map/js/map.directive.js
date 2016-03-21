/**
 * Created by sm on 03.01.2016.
 */

(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @restrict E
     * @name app.map.directive:appMap
     *
     * @description
     * appMap directive provides map component to the view.
     */
    angular
        .module('app.map')
        .directive('appMap', mapDirective);

    /**
     * Helper function.
     * Defined appMap directive definition object.
     * @returns {{restrict: string, replace: boolean, scope: {}, templateUrl: string, controller: app.map.MapController, controllerAs: string, bindToController: boolean}}
     */
    function mapDirective() {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                id: '@'
            },
            templateUrl: 'js/map/partials/map.html',
            controller: MapController,
            controllerAs: 'map',
            bindToController: true // because the scope is isolated
        };
    }

    MapController.$inject = ['$scope', '$rootScope', 'olMap'];

    /**
     * @ngdoc controller
     * @name app.map.controller:MapController
     *
     * @description
     * Map directive controller
     *
     * @requires $scope
     * @requires $rootScope
     * @requires $log
     *
     * @constructor
     */
    function MapController($scope, $rootScope, olMap) {
        var unbindList = [];
        var map = this;
        $scope.$on("$destroy", onDestroy);
        //unbindList.push($rootScope.$on("OFFLINE_EMIT_DATA", onOfflineEmitData));

        olMap.init(map.id);

        function onDestroy(){
            angular.forEach(unbindList, function(unbind, key){
                unbind();
            });
        }
    }
})();