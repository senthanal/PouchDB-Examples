/**
 * Created by sm on 02.01.2016.
 */

(function () {
    'use strict';

    /**
     * @ngdoc service
     * @name app.offline.internetConnection
     * @kind object
     *
     * @requires $log
     *
     * @description
     * Internet connectivity checker service
     */
    angular
        .module("app.offline")
        .factory('internetConnection', internetConnection);

    internetConnection.$inject = ['$rootScope', '$http', '$location', '$timeout', '$window'];
    function internetConnection($rootScope, $http, $location, $timeout, $window) {
        var timeoutPromise;
        var detectionTechnique = "html5";
        var internetConnection = {
            /**
             * @ngdoc function
             * @name app.offline.internetConnection#setTechnique
             * @methodOf app.offline.internetConnection
             *
             * @description
             *
             */
            setTechnique: setTechnique,
            /**
             * @ngdoc function
             * @name app.offline.internetConnection#watch
             * @methodOf app.offline.internetConnection
             *
             * @description
             *
             */
            watch: watch,
            /**
             * @ngdoc function
             * @name app.offline.internetConnection#unWatch
             * @methodOf app.offline.internetConnection
             *
             * @description
             *
             */
            unWatch: unWatch,
            /**
             * @ngdoc function
             * @name app.offline.internetConnection#ajaxTechnique
             * @methodOf app.offline.internetConnection
             *
             * @description
             *
             */
            ajaxTechnique: ajaxTechnique
        };

        return internetConnection;

        /**
         * Helper function
         */
        function setTechnique(technique) {
            detectionTechnique = technique;
        }

        /**
         * Helper function
         */
        function watch() {
            unWatch();

            if(angular.equals(detectionTechnique, "html5")){
                $rootScope.$emit("APP_OFFLINE_INTERNET_STATUS", $window.navigator.onLine);
                $window.addEventListener("offline", onDown, false);
                $window.addEventListener("online", onUp, false);
                return;
            }

            if(angular.equals(detectionTechnique, "ajax")){
                ajaxTechnique();
                return;
            }
        }

        /**
         * Helper function
         */
        function unWatch() {
            if(angular.equals(detectionTechnique, "html5")) {
                $window.removeEventListener("offline", onDown);
                $window.removeEventListener("online", onUp);
                return;
            }
            if(angular.equals(detectionTechnique, "ajax")) {
                $timeout.cancel(timeoutPromise);
                return;
            }
        }

        function onDown() {
            $rootScope.$emit("APP_OFFLINE_INTERNET_STATUS", false);
        }

        function onUp() {
            $rootScope.$emit("APP_OFFLINE_INTERNET_STATUS", true);
        }

        function ajaxTechnique(isWatch){
            var doWatch = angular.isDefined(isWatch) ? isWatch : true;
            var url = "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/1122px-Wikipedia-logo-v2.svg.png";
            timeoutPromise = $timeout(function(){
                $http.get(url)
                    .then(
                        function fetchImageSuccess(response) {
                            $rootScope.$emit("APP_OFFLINE_INTERNET_STATUS", true);
                            if(doWatch) watch();
                        },
                        function fetchImageFailure(response) {
                            $rootScope.$emit("APP_OFFLINE_INTERNET_STATUS", false);
                            if(doWatch) watch();
                        }
                    );
            }, 1000);
        }
    }
})();