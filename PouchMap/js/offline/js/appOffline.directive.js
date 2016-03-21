/**
 * Created by sm on 23.12.2015.
 */

(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @restrict E
     * @name app.offline.directive:appOffline
     *
     * @description
     * appOffline directive provides offline component to the view.
     */
    angular
        .module('app.offline')
        .directive('appOffline', offlineDirective);

    /**
     * Helper function.
     * Defined appOffline directive definition object.
     * @returns {{restrict: string, replace: boolean, scope: {}, templateUrl: string, controller: app.offline.OfflineController, controllerAs: string, bindToController: boolean}}
     */
    function offlineDirective() {
        return {
            restrict: 'EA',
            replace: true,
            scope: {},
            templateUrl: 'js/offline/partials/offline.html',
            controller: OfflineController,
            controllerAs: 'offline',
            bindToController: true // because the scope is isolated
        };
    }

    OfflineController.$inject = ['$scope', '$rootScope', 'internetConnection'];

    /**
     * @ngdoc controller
     * @name app.offline.controller:OfflineController
     *
     * @description
     * serviceAreaModal directive controller
     *
     * @requires $scope
     * @requires $rootScope
     * @requires $log
     *
     * @constructor
     */
    function OfflineController($scope, $rootScope) {
        var unbindList = [];
        var wkt = new ol.format.WKT();
        var features = [];
        var pouchDataStore, dbName = "Features", docName = "poi", currentFeatureIndex = 0;
        var offline = this;
        offline.feature = false;
        offline.featuresCount = 0;
        offline.formData = false;
        offline.remove = remove;
        offline.clear = clear;
        offline.read = read;
        offline.changed = changed;
        offline.previousFeature = previousFeature;
        offline.nextFeature = nextFeature;
        offline.firstFeature = firstFeature;
        offline.lastFeature = lastFeature;

        $scope.$on("$destroy", onDestroy);
        unbindList.push($rootScope.$on("APP_MAP_FEATURES_NEW", onMapFeaturesNew));
        unbindList.push($rootScope.$on("APP_MAP_FEATURES_CLEAR", onMapFeaturesClear));
        unbindList.push($rootScope.$on("APP_MAP_FEATURES_REMOVEALL", onMapFeaturesRemoveAll));

        init();

        function onDestroy(){
            angular.forEach(unbindList, function(unbind, key){
                unbind();
            });
        }

        function onMapFeaturesNew($event, feature){
            var featureObj = getFeatureWKT(feature);
            features.push(featureObj);
            $scope.$apply(function(){
                lastFeature();
            });
            updateDB();
        }

        function onMapFeaturesClear(){
            features = [];
            offline.feature = false;
        }

        function onMapFeaturesRemoveAll(){
            features = [];
            updateContent(false);
            $scope.$apply(function(){
                offline.feature = false;
            });
        }

        function init(){
            pouchDataStore = new PouchDB(dbName);

            pouchDataStore.changes({
                since : 'now',
                live : true,
                include_docs: true
            }).on('change', updateForm);

            pouchDataStore.get(docName).then(function (doc) {
                $scope.$apply(function(){
                    offline.featuresCount = angular.isDefined(doc.data) ? doc.data.length : 0;
                    firstFeature();
                });
            }).catch(function(err){

            });
        }

        function read(){
            pouchDataStore.get(docName).then(function (doc) {
                features = doc.data;
                updateContent(doc.data);
                $rootScope.$emit("APP_OFFLINE_READ_DATA", doc.data);
                $scope.$apply(function(){
                    firstFeature();
                });
            }).catch(function (err) {
                updateContent(err.reason);
            });
        }

        function clear(){
            offline.formData = false;
        }

        function remove(){
            pouchDataStore.get(docName).then(function(doc) {
                return pouchDataStore.remove(doc);
            }).then(function (result) {
                $rootScope.$emit("APP_MAP_FEATURES_REMOVEALL");
            }).catch(function (err) {
                updateContent(err.reason);
            });
        }

        function changed(){
            updateDB();
        }

        function previousFeature(){
            currentFeatureIndex -= 1;
            offline.feature = features[currentFeatureIndex];
            offline.disabled = currentFeatureIndex == 0 ? "Prev" : "";
            $rootScope.$emit("APP_OFFLINE_SELECTED_FEATURE", offline.feature);
        }

        function nextFeature(){
            currentFeatureIndex += 1;
            offline.feature = features[currentFeatureIndex];
            offline.disabled = currentFeatureIndex == features.length-1 ? "Next" : "";
            $rootScope.$emit("APP_OFFLINE_SELECTED_FEATURE", offline.feature);
        }

        function firstFeature(){
            currentFeatureIndex = 0;
            offline.feature = features[currentFeatureIndex];
            offline.disabled = "Prev";
            $rootScope.$emit("APP_OFFLINE_SELECTED_FEATURE", offline.feature);
        }

        function lastFeature(){
            currentFeatureIndex = features.length-1;
            offline.feature = features[currentFeatureIndex];
            offline.disabled = "Next";
            $rootScope.$emit("APP_OFFLINE_SELECTED_FEATURE", offline.feature);
        }

        function updateDB(){
            var pouchData = {
                _id : docName,
                name : docName,
                data : features
            };
            pouchDataStore.get(docName).then(function(doc) {
                pouchData = angular.extend({}, pouchData,{_rev: doc._rev});
                return pouchDataStore.put(pouchData);
            }).catch(function(err){
                pouchDataStore.put(pouchData);
            });
        }

        function updateContent(data){
            $scope.$apply(function(){
                offline.formData = data;
            });
        }

        function updateForm(response){
            updateContent(response.doc.data);
            offline.featuresCount = angular.isDefined(response.doc.data) ? response.doc.data.length : 0;
            $scope.$apply();
        }

        function getFeatureWKT(feature){
            return {
                id: feature.id,
                geom: wkt.writeGeometry(feature.geom),
                name: feature.name
            }
        }
    }
})();