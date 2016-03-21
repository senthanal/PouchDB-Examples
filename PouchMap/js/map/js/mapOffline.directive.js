/**
 * Created by sm on 05.01.2016.
 */

(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @restrict E
     * @name app.map.directive:appMapOffline
     *
     * @description
     * appMapOffline directive provides map component to the view.
     */
    angular
        .module('app.map')
        .directive('appMapOffline', mapOfflineDirective);

    /**
     * Helper function.
     * Defined mapOffline directive definition object.
     * @returns {{restrict: string, replace: boolean, scope: {}, templateUrl: string, controller: app.map.MapOfflineController, controllerAs: string, bindToController: boolean}}
     */
    function mapOfflineDirective() {
        return {
            restrict: 'EA',
            replace: true,
            scope: {},
            templateUrl: 'js/map/partials/mapOffline.html',
            controller: MapOfflineController,
            controllerAs: 'mapOffline',
            bindToController: true // because the scope is isolated
        };
    }

    MapOfflineController.$inject = ['$scope', '$rootScope', 'olMap', '$timeout'];

    /**
     * @ngdoc controller
     * @name app.map.controller:MapOfflineController
     *
     * @description
     * Map offline directive controller
     *
     * @requires $scope
     * @requires $rootScope
     * @requires $log
     *
     * @constructor
     */
    function MapOfflineController($scope, $rootScope, olMap, $timeout) {
        var unbindList = [];
        var zoomLevel = 1, initialZoomLevel = 1;
        var unbind;
        var tileAttachments = [], currentAttachmentIndex = 0;
        var defaultTileAttachment = {
            image: ""
        };
        var mapOffline = this;
        mapOffline.disabled = "Prev";
        mapOffline.offlineTilesText = "";
        mapOffline.tileAttachment = angular.copy(defaultTileAttachment);
        mapOffline.tilesCount = 0;
        mapOffline.toggleOfflineTiles = toggleOfflineTiles;
        mapOffline.previousTile = previousTile;
        mapOffline.nextTile = nextTile;
        mapOffline.firstTile = firstTile;
        mapOffline.lastTile = lastTile;
        mapOffline.removeOfflineTiles = removeOfflineTiles;
        mapOffline.seedOfflineTiles = seedOfflineTiles;

        $scope.$on("$destroy", onDestroy);
        unbindList.push($rootScope.$on("MAP_READY", onMapReady));
        unbindList.push($rootScope.$on("MAP_POUCH_TILES_COUNT", onMapPouchTilesCount));
        unbindList.push($rootScope.$on("APP_OFFLINE_INTERNET_STATUS", onAppOfflineInternetStatus));

        function onDestroy(){
            angular.forEach(unbindList, function(unbind, key){
                unbind();
            });
        }

        function onMapReady($event){
            updateOfflineTilesText();
            updateTileAttachments();
        }

        function onMapPouchTilesCount($event, count){
            mapOffline.tilesCount = count;
        }

        function onAppOfflineInternetStatus($event, status){
            olMap.toggleOfflineTiles(status);
            updateOfflineTilesText();
        }

        function toggleOfflineTiles(){
            olMap.toggleOfflineTiles();
            updateOfflineTilesText();
        }

        function previousTile(){
            currentAttachmentIndex -= 1;
            mapOffline.tileAttachment = tileAttachments[currentAttachmentIndex];
            mapOffline.disabled = currentAttachmentIndex == 0 ? "Prev" : "";
        }

        function nextTile(){
            currentAttachmentIndex += 1;
            mapOffline.tileAttachment = tileAttachments[currentAttachmentIndex];
            mapOffline.disabled = currentAttachmentIndex == tileAttachments.length-1 ? "Next" : "";
        }

        function firstTile(){
            currentAttachmentIndex = 0;
            mapOffline.tileAttachment = tileAttachments[currentAttachmentIndex];
            mapOffline.disabled = "Prev";
        }

        function lastTile(){
            currentAttachmentIndex = tileAttachments.length-1;
            mapOffline.tileAttachment = tileAttachments[currentAttachmentIndex];
            mapOffline.disabled = "Next";
        }

        function removeOfflineTiles(){
            return olMap.getPouchTiles().then(function(doc) {
                return olMap.getPouchDataStore().remove(doc);
            }).then(function(){
                tileAttachments = [];
                applyTilesCount(0);
                applyTileAttachment(defaultTileAttachment);
            })
            .catch(function(err){
                applyTilesCount(0);
                applyTileAttachment(defaultTileAttachment);
            });
        }

        function seedOfflineTiles(){
            removeOfflineTiles().then(function(){
                zoomLevel = 0;
                initialZoomLevel = olMap.get().getView().getZoom();
                if(!olMap.isDefaultTileLoadFunction()) olMap.toggleOfflineTiles();
                seed();
                olMap.get().getView().setZoom(zoomLevel);
                zoomLevel++;
            });
        }

        function seed(){
            unbind = $rootScope.$on("MAP_MOVEEND", onMoveend);
        }

        function onMoveend(){
            olMap.get().getView().setZoom(zoomLevel);
            zoomLevel++;
            unbind();
            if(olMap.get().getView().getZoom() < olMap.getMaxZoom()) {
                seed();
            }
            else{
                olMap.get().getView().setZoom(initialZoomLevel);
                toggleOfflineTiles();
                updateTileAttachments();
            }
        }

        function updateOfflineTilesText(){
            mapOffline.offlineTilesText = olMap.isDefaultTileLoadFunction() == true ? "Read from Internet First" : "Read from PouchDB First";
        }

        function updateTileAttachments(){
            olMap.getPouchTiles().then(function(doc){
                if(Object.keys(doc._attachments).length == 0) return;

                tileAttachments = toArray(doc._attachments);
                firstTile();
                applyTilesCount(tileAttachments.length);
            }).catch(function(err){
                applyTilesCount(0);
            });
        }

        function toArray(attachments){
            var result = [];
            var ind = 0;
            for(var i in attachments){
                var t = {
                    tileCoord: i
                };
                result.push(t);
                getUrlFromBlob(i, result[ind]);
                ind++;
            }
            return result;
        }

        function getUrlFromBlob(attachmentId, tile){
            olMap.getPouchAttachment(attachmentId).then(function(blob){
                tile.image = URL.createObjectURL(blob);
                $scope.$apply();
            });
        }

        function applyTilesCount(count){
            $scope.$apply(function(){
                mapOffline.tilesCount = count;
            });
        }

        function applyTileAttachment(attachment){
            $scope.$apply(function(){
                mapOffline.tileAttachment = attachment;
            });
        }
    }
})();