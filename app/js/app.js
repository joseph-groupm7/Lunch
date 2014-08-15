var lunch = angular.module("Lunch", ["firebase", "ui.router"]);

lunch.config(["$stateProvider", "$urlRouterProvider", function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise("/");

	$stateProvider
		.state("login", {
			url: "/",
			templateUrl: "/views/login.html",
			controller: "loginController",
			data: {
				access: "all"
			}
		})
		.state("home", {
			url: "/home",
			template: "The order list page."
		})
		.state("editOrder", {
			url: "/order/:id",
			template: "The order edit page."
		})
		.state("orderView", {
			url: "/view/:id",
			template: "The order view page."
		});
}]);

lunch.run(["$rootScope", "$state", function($rootScope, $state) {
	$rootScope.$on('$stateChangeStart', 
		function(event, toState, toParams, fromState, fromParams) {

		});
}]);

lunch.service("Authentication", [function() {
	var authObject = undefined;

	this.login = function(auth) {
		authObject = auth;
	}

	this.getLoggedIn = function() {
		return authObject === undefined ? false : true;
	}

	this.getUser = function() {
		return authObject.uid;
	}
}]);

lunch.controller("loginController", ["$scope", "$firebaseSimpleLogin", "Authentication", function($scope, $firebaseSimpleLogin, Authentication) {
	$scope.loginInfo = {
		username: "",
		password: "",
		errorMessage: false
	};

	var ref  = new Firebase("https://lunch-gm7.firebaseio.com/");
	var auth = $firebaseSimpleLogin(ref);

	$scope.login = function() {
		auth.$login("password", {
			email: $scope.loginInfo.username,
			password: $scope.loginInfo.password
		}).then(function(auth) {
			Authentication.login(auth);
		}, function(err) {
			$scope.loginInfo.errorMessage = err.message;
		});
	}

	$scope.clearError = function() {
		$scope.loginInfo.errorMessage = false;
	}
}]);

/*
	Routes:
	/ => The login page 							DONE
		* Login correctly, go to home 				DONE
	/home => The list of orders
		* Click an order, go into it
	/order/:id
		* Load the ID from Firebase
		* Bind the model
		* Make the user's ID editable
	/view/:id
		* Load the ID
		* Bind the model
		* DON'T make the sections editable
	
	Features:
	* Authentication								DONE
	* Cookie-based login storage
	* Keep non-logged-in users off the backpages	
 */