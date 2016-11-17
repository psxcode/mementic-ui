(function (angular) {
	'use strict';

	angular.module('mean', ['ui.router']);

	angular.module('mean').controller('MainCtrl', [
		'$scope',
		'mementic',
		function ($scope, mementic) {
			var vm = this;

			vm.elementNames = mementic.elementNames;
		}]);


	angular.module('mean').factory('mementic', [
		function() {
			var elements = [
				'button',
				'button-basic',
				'button-compact',
				'button-icon-labeled',
				'container',
				'divider',
				'header',
				'icon',
				'image',
				'input',
				'label',
				'list',
				'loader',
				'rail',
				'reveal',
				'segment',
				'step'
			];
			var collections = [
				'breadcrumb',
				'form',
				'grid',
				'menu',
				'message',
				'table'
			];
			var views = [
				'ad',
				'card',
				'comment',
				'feed',
				'item',
				'statistic'
			];

			//interface
			return {
				elementNames: elements,
				collectionNames: collections,
				viewNames: views
			}
		}]);
}(angular));