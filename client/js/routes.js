(function (angular) {
	'use strict';

	angular.module('mean').config([
		'$stateProvider',
		'$urlRouterProvider',
		'mementicProvider',
		function ($stateProvider, $urlRouterProvider, mementic) {
			mementic = mementic.$get();

			$urlRouterProvider.otherwise('/');

			//main state
			$stateProvider
				.state('main', {
					url: '/',
					templateUrl: 'main.html',
					controller: 'MainCtrl as ctrl'
				});

			//add elements states
			var elements = mementic.elementNames;
			for(var i = 0; i < elements.length; ++i) {
				$stateProvider.state('main.' + elements[i], {
					url: 'elements/' + elements[i],
					templateUrl: elements[i] + '.html'
				});
			}

			//add collection states
			var collections = mementic.collectionNames;
			for(i = 0; i < collections.length; ++i) {
				$stateProvider.state('main.' + collections[i], {
					url: 'collections/' + collections[i],
					templateUrl: collections[i] + '.html'
				});
			}

			//add view states
			var views = mementic.viewNames;
			for(i = 0; i < views.length; ++i) {
				$stateProvider.state('main.' + views[i], {
					url: 'views/' + views[i],
					templateUrl: views[i] + '.html'
				});
			}

		}]);
}(angular));