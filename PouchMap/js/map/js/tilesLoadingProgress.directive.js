/**
 * Created by sm on 05.01.2016.
 */

(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @restrict E
     * @name app.map.directive:tilesLoadingProgress
     *
     * @description
     * tilesLoadingProgress directive provides tiles loading progress bar component to the view.
     */
    angular
        .module('app.map')
        .directive('tilesLoadingProgress', tilesLoadingProgressDirective);

    /**
     * Helper function.
     * Defined tilesLoadingProgress directive definition object.
     * @returns {{restrict: string, replace: boolean, scope: {}, templateUrl: string, controller: app.map.TilesLoadingProgressController, controllerAs: string, bindToController: boolean}}
     */
    function tilesLoadingProgressDirective() {
        return {
            restrict: 'EA',
            replace: true,
            scope: {},
            templateUrl: 'js/map/partials/tilesLoadingProgress.html',
            controller: TilesLoadingProgressController,
            controllerAs: 'tilesLoadingProgress',
            bindToController: true // because the scope is isolated
        };
    }

    TilesLoadingProgressController.$inject = ['$scope', '$element', '$timeout', '$rootScope', 'olMap'];

    /**
     * @ngdoc controller
     * @name app.map.controller:TilesLoadingProgressController
     *
     * @description
     * Tile loading progress bar directive controller
     *
     * @requires $scope
     * @requires $rootScope
     * @requires $log
     *
     * @constructor
     */
    function TilesLoadingProgressController($scope, $element, $timeout, $rootScope, olMap) {
        var unbindList = [];
        var loading = 0, loaded = 0, source;
        var tilesLoadingProgress = this;

        $scope.$on("$destroy", onDestroy);
        unbindList.push($rootScope.$on("MAP_READY", onMapReady));


        function onDestroy() {
            angular.forEach(unbindList, function (unbind, key) {
                unbind();
            });
            tilesLoadingProgress.source.un('tileloadstart', onTileLoadStart);
            tilesLoadingProgress.source.un('tileloadend', onTileLoadEnd);
            tilesLoadingProgress.source.un('tileloaderror', onTileLoadError);
        }

        function onMapReady($event){
            source = olMap.getBaseMapLayer().getSource();
            source.on('tileloadstart', onTileLoadStart);
            source.on('tileloadend', onTileLoadEnd);
            source.on('tileloaderror', onTileLoadError);
        }

        function onTileLoadStart(event){
            addLoading();
        }

        function onTileLoadEnd(event){
            addLoaded();
        }

        function onTileLoadError(event){
            addLoaded();
        }

        /**
         * Increment the count of loading tiles.
         */
        function addLoading() {
            if (loading === 0) {
                show();
            }
            ++loading;
            update();
        }


        /**
         * Increment the count of loaded tiles.
         */
        function addLoaded() {
            $timeout(function () {
                ++loaded;
                update();
            }, 100);
        }


        /**
         * Update the progress bar.
         */
        function update() {
            var w = (loaded / loading * 100).toFixed(1);
            w = w >= 100 ? 100 : w;
            var width = w + '%';
            $element[0].style.width = width;
            if (loading === loaded) {
                loading = 0;
                loaded = 0;
                $timeout(function () {
                    hide();
                }, 400);
            }
        }


        /**
         * Show the progress bar.
         */
        function show() {
            $element[0].style.visibility = 'visible';
        }


        /**
         * Hide the progress bar.
         */
        function hide() {
            if (loading >= loaded) {
                $element[0].style.visibility = 'hidden';
                $element[0].style.width = 0;
            }
        }

    }
})();