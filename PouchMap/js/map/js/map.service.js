/**
 * Created by sm on 03.01.2016.
 */

(function () {
    'use strict';

    /**
     * @ngdoc service
     * @name app.map.olMap
     * @kind object
     *
     * @requires $log
     *
     * @description
     * OL3 map service
     */
    angular
        .module("app.map")
        .factory('olMap', olMap);

    olMap.$inject = ['$rootScope', '$timeout'];
    function olMap($rootScope, $timeout) {
        var map;
        var maxZoom = 20;
        var tileAttachments = {};
        var dbName = 'OSMTiles';
        var docName = 'tile';
        var pouchDataStore = new PouchDB(dbName);
        var raster = new ol.layer.Tile({
            source: new ol.source.OSM()
        });
        var defaultTileLoadFunction = raster.getSource().getTileLoadFunction();
        var olMapAPI = {
            /**
             * @ngdoc function
             * @name app.map.olMap#init
             * @methodOf app.map.olMap
             *
             * @description
             * Initializes the ol3 map with default map options.
             */
            init: init,

            /**
             * @ngdoc function
             * @name app.map.olMap#get
             * @methodOf app.map.olMap
             *
             * @description
             * Returns map object.
             *
             * @returns {object} map map object
             */
            get: get,

            /**
             * @ngdoc function
             * @name app.map.olMap#getMaxZoom
             * @methodOf app.map.olMap
             *
             * @description
             * Returns maximum zoom level of the map.
             *
             * @returns {number} maxZoom maximum zoom level of the map
             */
            getMaxZoom: getMaxZoom,

            /**
             * @ngdoc function
             * @name app.map.olMap#getBaseMapLayer
             * @methodOf app.map.olMap
             *
             * @description
             * Returns basemap layer object.
             *
             * @returns {object} basemaplayer basemap layer object
             */
            getBaseMapLayer: getBaseMapLayer,

            /**
             * @ngdoc function
             * @name app.map.olMap#toggleOfflineTiles
             * @methodOf app.map.olMap
             *
             * @description
             * Toggles mode from online tiles loading to offline from pouchDB and vice versa.
             *
             */
            toggleOfflineTiles: toggleOfflineTiles,

            /**
             * @ngdoc function
             * @name app.map.olMap#isDefaultTileLoadFunction
             * @methodOf app.map.olMap
             *
             * @description
             * Determines the default tile load function is set or not.
             *
             * @returns {boolean} isDefaultTileLoadFunction true/false based on default tile load function
             */
            isDefaultTileLoadFunction: isDefaultTileLoadFunction,

            /**
             * @ngdoc function
             * @name app.map.olMap#getPouchDataStore
             * @methodOf app.map.olMap
             *
             * @description
             * Returns pouch data store object.
             *
             * @returns {object} pouchDataStore pouch db object
             */
            getPouchDataStore: getPouchDataStore,

            /**
             * @ngdoc function
             * @name app.map.olMap#getPouchTiles
             * @methodOf app.map.olMap
             *
             * @description
             * Returns promise of pouch db get api.
             *
             * @params {string} attachmentId relevant attachment id
             *
             * @returns {object} promise pouch db get api promise
             */
            getPouchTiles: getPouchTiles,

            /**
             * @ngdoc function
             * @name app.map.olMap#getPouchAttachment
             * @methodOf app.map.olMap
             *
             * @description
             * Returns promise of pouch db getAttachment api.
             *
             * @returns {object} promise pouch db getAttachment api promise
             */
            getPouchAttachment: getPouchAttachment
        };

        return olMapAPI;

        function init(target){
            map = new ol.Map({
                layers: [raster],
                target: document.getElementById(target),
                controls: ol.control.defaults({
                    /** @type {olx.control.AttributionOptions} */
                    attributionOptions: ({
                        collapsible: false
                    })
                }),
                view: new ol.View({
                    center: ol.proj.transform([11.5775, 48.1368], 'EPSG:4326', 'EPSG:3857'),
                    maxZoom: maxZoom,
                    zoom: 12
                })
            });

            var intId = $timeout(function(){
                $rootScope.$emit("MAP_READY");
                $timeout.cancel(intId);
            },1000);

            map.on('moveend', onMapMoveEnd);
        }

        function get(){
            return map;
        }

        function getMaxZoom(){
            return maxZoom;
        }

        function getBaseMapLayer(){
            return raster;
        }

        function toggleOfflineTiles(isOnline){
            var useOnline = angular.isDefined(isOnline) ? isOnline : isDefaultTileLoadFunction();
            var currentRasterSource = raster.getSource();
            if(useOnline) {
                currentRasterSource.setTileLoadFunction(defaultTileLoadFunction);
            }
            else {
                currentRasterSource.setTileLoadFunction(osmTileLoadFunction);
            }
        }

        function isDefaultTileLoadFunction(){
            var currentRasterSource = raster.getSource();
            var currentTileLoadFunction = currentRasterSource.getTileLoadFunction();
            return angular.equals(currentTileLoadFunction.name, osmTileLoadFunction.name);
        }

        function getPouchDataStore(){
            return pouchDataStore;
        }

        function getPouchTiles(){
            return pouchDataStore.get(docName);
        }

        function getPouchAttachment(attachmentId){
            return pouchDataStore.getAttachment(docName, attachmentId);
        }

        function onMapMoveEnd(event){
            var intId = $timeout(function(){
                saveTileAttachments();
                $timeout.cancel(intId);
                $rootScope.$emit("MAP_MOVEEND");
            },2000);
        }

        function osmTileLoadFunction(imageTile, src) {
            var tileKey = imageTile.tileCoord.join("");
            var imgElement = imageTile.getImage();
            pouchDataStore.getAttachment(docName, tileKey).then(function (blob) {
                imageTile.getImage().src = URL.createObjectURL(blob);
                angular.extend(tileAttachments, getAttachment(tileKey, blob));
            }).catch(function (err) {
                imgElement.src = src;
                blobUtil.imgSrcToBlob(src, 'image/jpeg', {crossOrigin: 'Anonymous'}).then(function (blob) {
                    angular.extend(tileAttachments, getAttachment(tileKey, blob));
                });
            });
        }

        function saveTileAttachments(){
            var currentAttachmentsCount = Object.keys(tileAttachments).length;
            if(currentAttachmentsCount == 0) return;

            var doc = {
                "title": "Tiles",
                "_attachments": tileAttachments
            };
            pouchDataStore.get(docName).then(function(docs){
                var docAttachmentsCount = Object.keys(docs._attachments).length;
                if(currentAttachmentsCount > docAttachmentsCount){
                    $rootScope.$emit("MAP_POUCH_TILES_COUNT", currentAttachmentsCount);
                    return pouchDataStore.put(doc, docName, docs._rev);
                }
                return;
            }).catch(function(err){
                angular.extend(doc, {"_id": docName});
                return pouchDataStore.put(doc);
            });
        }

        function getAttachment(tileKey, blob){
            var result = new Object();
            result[tileKey] = {
                "content_type": "images/jpeg",
                "data": blob
            };
            return result;
        }
    }
})();