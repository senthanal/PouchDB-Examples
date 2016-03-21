/**
 * Created by sm on 03.01.2016.
 */

(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @restrict E
     * @name app.map.directive:appMapTools
     *
     * @description
     * appMapTools directive provides map tools component to the view.
     */
    angular
        .module('app.map')
        .directive('appMapTools', mapToolsDirective);

    /**
     * Helper function.
     * Defined appMapTools directive definition object.
     * @returns {{restrict: string, replace: boolean, scope: {}, templateUrl: string, controller: app.map.MapToolsController, controllerAs: string, bindToController: boolean}}
     */
    function mapToolsDirective() {
        return {
            restrict: 'EA',
            replace: true,
            scope: {},
            templateUrl: 'js/map/partials/mapTools.html',
            controller: MapToolsController,
            controllerAs: 'mapTools',
            bindToController: true // because the scope is isolated
        };
    }

    MapToolsController.$inject = ['$scope', '$rootScope', 'olMap'];

    /**
     * @ngdoc controller
     * @name app.map.controller:MapToolsController
     *
     * @description
     * Map tools directive controller
     *
     * @requires $scope
     * @requires $rootScope
     * @requires $log
     *
     * @constructor
     */
    function MapToolsController($scope, $rootScope, olMap) {
        var unbindList = [];
        var wkt = new ol.format.WKT();
        var clearMode = {
            name: 'Clear',
            title: "None",
            olType: 'None',
            isActive: true
        };
        var source, vector;
        var draw; // global so we can remove it later
        var select = new ol.interaction.Select({
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#FFF',
                    width: 10
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: '#FFF',
                        width: 10
                    })
                }),
                zIndex: 2
            })
        });
        var selectedFeatures = select.getFeatures();

        var mapTools = this;
        mapTools.features = {
            visible: false,
            mode: clearMode,
            modeOptions: [
                {
                    name: 'Point',
                    title: "Point",
                    olType: 'Point',
                    isActive: false
                },
                {
                    name: 'Circle',
                    title: "Circle",
                    olType: 'Circle',
                    isActive: false
                },
                {
                    name: 'Rectangle',
                    title: "Rectangle",
                    olType: 'Box',
                    isActive: false
                },
                {
                    name: 'Polygon',
                    title: "Polygon",
                    olType: 'Polygon',
                    isActive: false
                },
                clearMode
            ],
            toggleMode: toggleMode
        };
        mapTools.geolocate = geolocate;
        mapTools.clear = clear;

        $scope.$on("$destroy", onDestroy);
        unbindList.push($rootScope.$on("MAP_READY", onMapReady));
        unbindList.push($rootScope.$on("APP_OFFLINE_READ_DATA", onOfflineReadData));
        unbindList.push($rootScope.$on("APP_OFFLINE_SELECTED_FEATURE", onOfflineSelectedFeature));
        unbindList.push($rootScope.$on("APP_MAP_FEATURES_REMOVEALL", onMapFeaturesRemoveAll));

        function onDestroy(){
            if(angular.isDefined(source)) source.un('addfeature', onAddFeature);
            angular.forEach(unbindList, function(unbind, key){
                unbind();
            });
        }

        function onMapReady(){
            olMap.get().addInteraction(select);
        }

        function onOfflineSelectedFeature($event, feature){
            if(angular.isUndefined(vector)) return;

            selectedFeatures.clear();
            selectedFeatures.push(vector.getSource().getFeatureById(feature.id));
        }

        function onOfflineReadData($event, data){
            if(angular.isDefined(vector) && vector.getSource().getFeatures().length > 0) return;
            if(angular.isUndefined(vector)) initFeatures();
            source.un('addfeature', onAddFeature);
            angular.forEach(data, function forEachFeature(feature, key){
                var feat = wkt.readFeature(feature.geom);
                feat.setId(feature.id);
                vector.getSource().addFeature(feat);
            });
            source.on('addfeature', onAddFeature);
        }

        function onMapFeaturesRemoveAll(){
            if(angular.isUndefined(vector)) return;
            vector.getSource().clear();
        }

        function geolocate(){
            var view = olMap.get().getView();
            var geolocation = new ol.Geolocation({
                projection: view.getProjection(),
                tracking: true
            });
            geolocation.once('change:position', function() {
                view.setCenter(geolocation.getPosition());
                //view.setResolution(2.388657133911758);
            });
        }

        function onAddFeature(event){
            var geom = event.feature.getGeometry();
            var feats = vector.getSource().getFeatures();
            event.feature.setId(feats.length-1);
            if(angular.equals(mapTools.features.mode.olType, "Circle")) {
                geom = ol.geom.Polygon.fromCircle(geom);
            }
            $rootScope.$emit("APP_MAP_FEATURES_NEW", {
                name: mapTools.features.mode.title,
                geom: geom,
                id: event.feature.getId()
            });
        }

        function initFeatures(){
            source = new ol.source.Vector({
                wrapX: false,
                projection: olMap.get().getView().getProjection()
            });
            source.on('addfeature', onAddFeature);

            // http://openlayers.org/en/v3.8.2/examples/draw-features.html
            vector = new ol.layer.Vector({
                name: "Selections",
                source: source,
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(0, 153, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#0099FF',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 5,
                        fill: new ol.style.Fill({
                            color: '#0099FF'
                        })
                    }),
                    zIndex: 1
                }),
                map: olMap.get()
            });
        }

        function addInteraction(type) {
            if (angular.equals(type,'None')) return;

            var geometryFunction, maxPoints;
            if(angular.equals(type, "Box")){
                type = "LineString";
                maxPoints = 2;
                geometryFunction = function(coordinates, geometry) {
                    if (!geometry) {
                        geometry = new ol.geom.Polygon(null);
                    }
                    var start = coordinates[0];
                    var end = coordinates[1];
                    geometry.setCoordinates([
                        [start, [start[0], end[1]], end, [end[0], start[1]], start]
                    ]);
                    return geometry;
                };
            }
            draw = new ol.interaction.Draw({
                source: source,
                type: type,
                geometryFunction: geometryFunction,
                maxPoints: maxPoints
            });
            olMap.get().addInteraction(draw);
        }

        function clear(){
            if(angular.isUndefined(vector)) return;

            vector.getSource().clear();
            $rootScope.$emit("APP_MAP_FEATURES_CLEAR");
        }

        function toggleMode(mode){
            if(angular.isUndefined(vector)) initFeatures();

            angular.forEach(mapTools.features.modeOptions, function(mode, key){
                mode.isActive = false;
            });
            mode.isActive = true;
            mapTools.features.mode = mode;
            olMap.get().removeInteraction(draw);
            addInteraction(mode.olType);
            $rootScope.$emit("APP_MAP_FEATURES_MODE_CHANGED", mode);
        }
    }
})();