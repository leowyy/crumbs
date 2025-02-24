'use strict';
/**
 * @ngdoc overview
 * @name sbAdminApp
 * @description
 * # sbAdminApp
 *
 * Main module of the application.
 */
angular
.module('sbAdminApp', [
		'oc.lazyLoad',
		'ui.router',
		'ui.bootstrap',
		'angular-loading-bar',
])
.config(['$stateProvider','$urlRouterProvider','$ocLazyLoadProvider',function ($stateProvider,$urlRouterProvider,$ocLazyLoadProvider) {

	$ocLazyLoadProvider.config({
		debug:false,
		events:true,
	});

    //$modalProvider.options.animation = false;
	$urlRouterProvider.otherwise('/dashboard/mainpage');

	/*
	$routeProvider
		.when('/MyPredictions', {
			templateUrl: 'views/dashboard/MyPredictions.html',
			controller: 'PredictCtrl'
		})
		.otherwise({redirectTo: '/dashboard/home'});
		*/
	$stateProvider
		.state('dashboard', {
			url:'/dashboard',
			templateUrl: 'views/dashboard/main.html',
			resolve: {
				loadMyDirectives:function($ocLazyLoad){
					return $ocLazyLoad.load(
							{
								name:'sbAdminApp',
								files:[
									'scripts/directives/header/header.js',
									'scripts/directives/header/header-notification/header-notification.js',
									'scripts/directives/sidebar/sidebar.js',
									'scripts/directives/sidebar/sidebar-search/sidebar-search.js'
								]
							}),
					$ocLazyLoad.load(
							{
								name:'toggle-switch',
								files:["bower_components/angular-toggle-switch/angular-toggle-switch.min.js",
								"bower_components/angular-toggle-switch/angular-toggle-switch.css"
								]
							}),
					$ocLazyLoad.load(
							{
								name:'ngAnimate',
								files:['bower_components/angular-animate/angular-animate.js']
							})
					$ocLazyLoad.load(
							{
								name:'ngCookies',
								files:['bower_components/angular-cookies/angular-cookies.js']
							})
					$ocLazyLoad.load(
							{
								name:'ngResource',
								files:['bower_components/angular-resource/angular-resource.js']
							})
					$ocLazyLoad.load(
							{
								name:'ngSanitize',
								files:['bower_components/angular-sanitize/angular-sanitize.js']
							})
					$ocLazyLoad.load(
							{
								name:'ngTouch',
								files:['bower_components/angular-touch/angular-touch.js']
							})
				}
			}
		})
	.state('dashboard.home',{
		url:'/home',
		controller: 'MainCtrl',
		templateUrl:'views/dashboard/home.html',
		resolve: {
			loadMyFiles:function($ocLazyLoad) {
				return $ocLazyLoad.load({
					name:'sbAdminApp',
					files:[
						'scripts/controllers/main.js',
						'scripts/directives/dashboard/stats/stats.js',
						'scripts/services/transaction-service.js',
					    'scripts/services/prediction-service.js'
					]
				})
			}
		}
	})
	.state('dashboard.mainpage',{
		url:'/mainpage',
		controller: 'MainCtrl',
		templateUrl:'views/dashboard/mainpage.html',
		resolve: {
			loadMyFiles:function($ocLazyLoad) {
				return $ocLazyLoad.load({
					name:'chart.js',
					files:[
						'bower_components/angular-chart.js/dist/angular-chart.min.js',
						'bower_components/angular-chart.js/dist/angular-chart.css'
					]
				}),
				$ocLazyLoad.load({
					name:'sbAdminApp',
					files:[
						'scripts/controllers/main.js',
						'scripts/directives/dashboard/stats/stats.js',
						'scripts/services/transaction-service.js',
						'scripts/controllers/chartContoller.js',
					    'scripts/services/prediction-service.js'
					]
				})
			}
		}
	})
	.state('dashboard.MyPredictions',{
		url:'/MyPredictions',
		templateUrl:'views/dashboard/MyPredictions.html',
		controller: 'PredictCtrl',
		resolve: {
			loadMyFile:function($ocLazyLoad) {
				return $ocLazyLoad.load({
					name:'chart.js',
					files:[
						'bower_components/angular-chart.js/dist/angular-chart.min.js',
						'bower_components/angular-chart.js/dist/angular-chart.css'
					]
				}),
				$ocLazyLoad.load({
					name:'sbAdminApp',
					files:[
					    'scripts/controllers/MyPredictions.js',
					    'scripts/services/transaction-service.js',
					    'scripts/services/prediction-service.js'
					]
				})
			}
		}
	})
	.state('dashboard.InProgress',{
		url:'/InProgress',
		templateUrl:'views/MyTransactions/InProgress.html',
		controller: 'InProgressCtrl',
		resolve: {
			loadMyFile:function($ocLazyLoad) {
				return $ocLazyLoad.load({
					name:'sbAdminApp',
					files:[
					    'scripts/services/transaction-service.js',
					    'scripts/controllers/InProgress.js']
				})
			}
		}
	})
	.state('dashboard.InProgressSelling',{
		url:'/InProgressSelling/',
		templateUrl:'views/MyTransactions/InProgressSelling.html',
		controller: 'InProgressCtrl',
		params: {txSent: false, txDetails: null },
		resolve: {
			loadMyFile:function($ocLazyLoad) {
				return $ocLazyLoad.load({
					name:'sbAdminApp',
					files:[
					    'scripts/services/transaction-service.js',
					    'scripts/controllers/InProgress.js']
				})
			}
		}
	})
	.state('dashboard.InProgressBuying',{
		url:'/InProgressBuying',
		templateUrl:'views/MyTransactions/InProgressBuying.html',
		controller: 'InProgressCtrl',
		params: {txSent: false, txDetails: null },
		resolve: {
			loadMyFile:function($ocLazyLoad) {
				return $ocLazyLoad.load({
					name:'sbAdminApp',
					files:[
					    'scripts/services/transaction-service.js',
					    'scripts/controllers/InProgress.js']
				})
			}
		}
	})
	.state('dashboard.Completed',{
		url:'/Completed',
		templateUrl:'views/MyTransactions/Completed.html',
		controller: 'CompletedCtrl',
		params: {txSent: false, txDetails: null },
		resolve: {
			loadMyFile:function($ocLazyLoad) {
				return $ocLazyLoad.load({
					name:'sbAdminApp',
					files:[
					    'scripts/services/transaction-service.js',
					    'scripts/controllers/Completed.js']
				})
			}
		}
	})
	.state('dashboard.Market',{
		url:'/Market',
		templateUrl:'views/dashboard/Market.html',
		controller: 'MarketCtrl',
		resolve: {
			loadMyFile:function($ocLazyLoad) {
				return $ocLazyLoad.load({
					name:'sbAdminApp',
					files:['scripts/controllers/Market.js',
					        'scripts/services/transaction-service.js',
                            'scripts/services/prediction-service.js']
				})
			}
		}
	})
	.state('dashboard.Donations',{
        url:'/Donations',
        templateUrl:'views/dashboard/Donations.html',
        controller: 'DonationsCtrl',
        params: {txSent: false, txDetails: null },
        resolve: {
            loadMyFile:function($ocLazyLoad) {
                return $ocLazyLoad.load({
                    name:'sbAdminApp',
                    files:['scripts/controllers/Donations.js']
                })
            }
        }
    })
	.state('dashboard.Profile',{
        url:'/Profile',
        templateUrl:'views/user_profile/Profile.html',
		controller:'ProfileCtrl',
        resolve: {
            loadMyFile:function($ocLazyLoad) {
                return $ocLazyLoad.load({
                    name:'sbAdminApp',
                    files:['scripts/controllers/Profile.js']
                })
            }
        }
    })
	.state('dashboard.chart',{
		templateUrl:'views/chart.html',
		url:'/chart',
		controller:'ChartCtrl',
		resolve: {
			loadMyFile:function($ocLazyLoad) {
				return $ocLazyLoad.load({
					name:'chart.js',
					files:[
						'bower_components/angular-chart.js/dist/angular-chart.min.js',
						'bower_components/angular-chart.js/dist/angular-chart.css'
					]
				}),
				$ocLazyLoad.load({
					name:'sbAdminApp',
					files:['scripts/controllers/chartContoller.js']
				})
			}
		}
	})
}]);
