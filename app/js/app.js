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
		.state("lunch", {
			abstract: true,
			url: "/lunch",
			template: "<ui-view />",
			data: {
				access: "login"
			}
		})
		.state("lunch.home", {
			url: "/home",
			templateUrl: "/views/list.html",
			controller: "listController",
			data: {
				access: "login"
			}
		})
		.state("lunch.editOrder", {
			url: "/order/:id",
			templateUrl: "/views/edit.html",
			controller: "editController",
			data: {
				access: "login"
			}
		})
		.state("lunch.viewOrder", {
			url: "/view/:id",
			templateUrl: "/views/view.html",
			controller: "viewController",
			data: {
				access: "login"
			}
		})
		.state("lunch.new", {
			url: "/new",
			templateUrl: "/views/new.html",
			controller: "newController",
			data: {
				access: "login"
			}
		});
}]);

lunch.service("Authentication", ["$firebaseSimpleLogin", function($firebaseSimpleLogin) {
	var ref  = new Firebase("https://lunch-gm7.firebaseio.com/");
	var auth = $firebaseSimpleLogin(ref);

	this.checkSessionLogin = function() {
		return auth.$getCurrentUser();
	}

	this.getSession = function() {
		return auth.user;
	}

	this.loggedIn = function() {
		return auth.user !== null ? true : false;
	}

	this.login = function(loginInfo) {
		return auth.$login("password", loginInfo);
	}

	this.logout = function() {
		auth.$logout();
	}
}]);

lunch.controller("loginController", [
	"$scope",
	"Authentication",
	"$state",
	"$q",
	function($scope, Authentication, $state, $q) {

	var load = $q.defer();
	load.promise.then(function() {
		$scope.show = true;
		$scope.lockdown = false;

		$scope.loginInfo = {
			username: "",
			password: "",
			errorMessage: false
		};

		$scope.login = function() {
			$scope.lockdown = true;
			$scope.errorMessage = false;
			Authentication.login({
				email: $scope.loginInfo.username,
				password: $scope.loginInfo.password
			}).then(function(auth) {
				$scope.lockdown = false;
				$state.go("lunch.home");
			}, function(err) {
				$scope.lockdown = false;
				$scope.loginInfo.errorMessage = err.message;
			});
		}

		$scope.clearError = function() {
			$scope.loginInfo.errorMessage = false;
		}
	});

	Authentication.checkSessionLogin().then(function() {
		if (Authentication.loggedIn() == true) {
			load.reject();
			$state.go("lunch.home");
		}
		else {
			load.resolve();
		}
	});
}]);

lunch.controller("listController", [
	"$scope",
	"Authentication",
	"$state",
	"$firebase",
	"$q",
	function($scope, Authentication, $state, $firebase, $q) {

	var load = $q.defer();

	load.promise.then(function() {
		$scope.colors = ["red", "blue", "yellow", "purple", "orange", "green"];

		var ref  = new Firebase("https://lunch-gm7.firebaseio.com/");
		var sync = $firebase(ref);

		$scope.orders = sync.$asObject();

		$scope.loadOrderEdit = function(order) {
			$state.go("lunch.editOrder", {id: order.id});
		}

		$scope.loadOrderView = function(order) {
			$state.go("lunch.viewOrder", {id: order.id});
		}

		$scope.logout = function() {
			Authentication.logout();
			$state.go("login");
		}
	});

	Authentication.checkSessionLogin().then(function() {
		if (Authentication.loggedIn() != true) {
			load.reject();
			$state.go("login");
		}
		else {
			load.resolve();
		}
	});
}]);

lunch.controller("editController", [
	"$scope",
	"Authentication",
	"$state",
	"$firebase",
	"$stateParams",
	"$q",
	"$timeout",
	function($scope, Authentication, $state, $firebase, $stateParams, $q, $timeout) {

	$scope.colors = ["red", "blue", "yellow", "purple", "orange", "green"];
	$scope.locked = false;

	var load = $q.defer();
	load.promise.then(function(edit) {
		$scope.order = sync;
		edit.$bindTo($scope, "edit");

		$scope.withdraw = function() {
			if (confirm("Are you sure you want to withdraw from this order?")) {
				delete $scope.edit;
				$scope.locked = true;
			}
		}
	});

	var syncRef = new Firebase("https://lunch-gm7.firebaseio.com/" + $stateParams.id);
	var sync    = $firebase(syncRef).$asObject();

	$q.all(Authentication.checkSessionLogin(), sync.$loaded()).then(function() {
		if (Authentication.loggedIn() != true) {
			load.reject();
			$state.go("login");
		}
		else {
			var editRef = new Firebase("https://lunch-gm7.firebaseio.com/" + $stateParams.id + "/orders/" + Authentication.getSession().uid);
			var edit    = $firebase(editRef).$asObject();

			edit.$loaded().then(function() {
				edit.name = Authentication.getSession().email;
				edit.$save();
				load.resolve(edit);
			});
		}
	});
}]);

lunch.controller("viewController", [
	"$scope",
	"$state",
	"$firebase",
	"$stateParams",
	"$q",
	"Authentication",
	function($scope, $state, $firebase, $stateParams, $q, Authentication) {

	var load = $q.defer();
	load.promise.then(function() {
		$scope.order = sync;
	});

	var ref  = new Firebase("https://lunch-gm7.firebaseio.com/" + $stateParams.id);
	var sync = $firebase(ref).$asObject();

	$q.all(Authentication.checkSessionLogin(), sync.$loaded()).then(function() {
		if (Authentication.loggedIn() != true) {
			load.reject();
			$state.go("login");
		}
		else {
			load.resolve();
		}
	});
}]);

lunch.controller("newController", [
	"$scope",
	"$state",
	"$firebase",
	"$stateParams",
	"$q",
	"Authentication",
	function($scope, $state, $firebase, $stateParams, $q, Authentication) {

	var load = $q.defer();
	load.promise.then(function() {
		$scope.details = {};

		$scope.create = function() {
			var now = new Date();
			var id = now.getFullYear() + "" + (now.getMonth() + 1) + "" + now.getDate() + "" + (now.getHours() + 1) + "" + (now.getMinutes() + 1) + "" + (now.getSeconds() + 1);
			var ref  = new Firebase("https://lunch-gm7.firebaseio.com/" + id);
			var sync = $firebase(ref).$asObject();

			sync.$loaded().then(function() {
				sync.id = id;
				sync.date = now.toISOString();
				sync.location = $scope.details.location;
				sync.href = $scope.details.href;
				sync.lockdown = false;
				sync.admin = Authentication.getSession().email;

				sync.$save().then(function() {
					$state.go("lunch.home");
				});
			});
		}
	});

	Authentication.checkSessionLogin().then(function() {
		if (Authentication.loggedIn() != true) {
			load.reject();
			$state.go("login");
		}
		else {
			load.resolve();
		}
	});
}]);

lunch.directive("randClass", function () {
    return {
        restrict: 'EA',
        replace: false,
        scope: {
            randClass: "="
        },
        link: function (scope, elem, attr) {
            elem.addClass(scope.randClass[Math.floor(Math.random() * (scope.randClass.length))]);
        }
    }
});

/*
	Routes:
	/ => The login page 							DONE
		* Login correctly, go to home 				DONE
	/home => The list of orders
		* Click an order, go into it 				DONE
		* Pretty									DONE
	/order/:id
		* Load the ID from Firebase 				DONE
		* Bind the model 							DONE
		* Make the user's ID editable 				DONE
		* Pretty 									DONE
	/view/:id
		* Load the ID 								DONE
		* Bind the model 							DONE
		* DON'T make the sections editable 			DONE
	/new
		* Set the model's creator ID 				DONE
		* Assigne a unique ID 						DONE
		
	Model:
		Database
			Lunch - ID'd by date/time
				Location
				Menu
				Creator-ID
				Orders
					UserID
						Item
						Notes
					UserID
						Item
						Notes
					...
			Lunch - ID'd by date/time
				...
			...
	
	Features:
	* Authentication								DONE
	* Cookie-based login storage					DONE
	* Keep non-logged-in users off the backpages	DONE
 */