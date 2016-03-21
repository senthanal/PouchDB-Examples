/**
 * Created by sm on 05.01.2016.
 */

(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @restrict E
     * @name app.offline.directive:internetConnectionStatus
     *
     * @description
     * internetConnectionStatus directive provides status information component to the view.
     */
    angular
        .module('app.offline')
        .directive('internetConnectionStatus', internetConnectionStatusDirective);

    /**
     * Helper function.
     * Defined internetConnectionStatus directive definition object.
     * @returns {{restrict: string, replace: boolean, scope: {}, templateUrl: string, controller: app.offline.InternetConnectionStatusController, controllerAs: string, bindToController: boolean}}
     */
    function internetConnectionStatusDirective() {
        return {
            restrict: 'EA',
            replace: true,
            scope: {},
            templateUrl: 'js/offline/partials/internetConnectionStatus.html',
            controller: InternetConnectionStatusController,
            controllerAs: 'internetConnectionStatus',
            bindToController: true // because the scope is isolated
        };
    }

    InternetConnectionStatusController.$inject = ['$scope', '$rootScope', 'internetConnection'];

    /**
     * @ngdoc controller
     * @name app.offline.controller:InternetConnectionStatusController
     *
     * @description
     * internet connection status directive controller
     *
     * @requires $scope
     * @requires $rootScope
     * @requires $log
     *
     * @constructor
     */
    function InternetConnectionStatusController($scope, $rootScope, internetConnection) {
        var unbindList = [];
        var internetConnectionStatus = this;
        internetConnectionStatus.isUp = true;
        internetConnectionStatus.technique = "html5";
        internetConnectionStatus.changeTechnique = changeTechnique;
        internetConnectionStatus.checkConnectivity = checkConnectivity;

        $scope.$on("$destroy", onDestroy);
        unbindList.push($rootScope.$on("APP_OFFLINE_INTERNET_STATUS", onOfflineInternetStatus));

        //internetConnection.setTechnique(internetConnectionStatus.technique);
        //internetConnection.watch();
        internetConnection.ajaxTechnique(false);

        function onDestroy(){
            angular.forEach(unbindList, function(unbind, key){
                unbind();
            });
            internetConnection.unwatch("html5");
            internetConnection.unwatch("ajax");
        }

        function onOfflineInternetStatus($event, status){
            internetConnectionStatus.isUp = status;
        }

        function changeTechnique(technique){
            internetConnectionStatus.technique = technique;
            internetConnection.setTechnique(technique);
            internetConnection.watch();
        }

        function checkConnectivity(){
            internetConnection.ajaxTechnique(false);
        }
    }
})();