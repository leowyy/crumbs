'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:RequestsCtrl
 * @description
 * # RequestsCtrl
 */
angular.module('sbAdminApp')
  .controller('RequestsCtrl', ['$scope', '$interval', 'txService', function($scope, $interval, txService) {
    console.log("loaded");
    $scope.balance = 0;

    var reloadData = function() {
        txService.getEther(function(balance) {
            $scope.balance = balance;
        })
        txService.getTransactions(function(txs) {
            $scope.txs = txs;
            for (var i = 0; i<txs.pendingOffers.length; i++) {
                txs.pendingOffers[i].pending = true;
            }
            $scope.offers = txs.pendingOffers.concat(txs.successfulOffers);

            for (var i = 0; i<txs.pendingAccepts.length; i++) {
                txs.pendingAccepts[i].pending = true;
            }
            $scope.accepts = txs.pendingAccepts.concat(txs.successfulAccepts);

            for (var i = 0; i<txs.pendingAgrees.length; i++) {
                txs.pendingAgrees[i].agreeing = true;
            }
            $scope.agrees = txs.pendingAgrees.concat(txs.offersAccepted);
            $scope.reloaded = true;
        }, function() {
            //add mock data here when server not running
            $scope.offers = []; //Offers you made
            $scope.accepts = []; //Offers that you accepted and waiting for other party to agree
            $scope.agrees = []; //Offers accepted waiting for you to agree, or agreed but not included in block chain
            $scope.reloaded = true;
        })
    }

    $interval(function() {
        reloadData();
    }, 5000)
    reloadData();

    $scope.getBackground = function(pending) {
        if (pending) {
            return {
                background: '#ffb888'
            }
        }
    }

    $scope.agree = function(uuid) {
        txService.agree(uuid, function(response) {
            console.log("Agree sent");
        })
        $scope.reloaded = false;
    }

    $scope.dairy = [{
      'storename' : 'NTUC',
      'product': 'Milk',
      'qty': 12,
      'expiryDate': 123145123,
      'price': 120,
      'transportCost': 60
    },
    {
      'storename' : 'Giant',
      'product': 'Goat Cheese',
      'qty': 22,
      'expiryDate': 993145123,
      'price': 1200.08,
      'transportCost': 77
    },
    {
      'storename' : 'NTUC',
      'product': 'Yoghurt',
      'qty': 44,
      'expiryDate': 1003145123,
      'price': 28.99,
      'transportCost': 69
    }
    ],

    $scope.vegetable = [{
      'storename' : 'NTUC',
      'product': 'Cabbage',
      'qty': 12,
      'expiryDate': 123145123,
      'price': 120,
      'transportCost': 60
    },
    {
      'storename' : 'Giant',
      'product': 'Broccoli',
      'qty': 22,
      'expiryDate': 993145123,
      'price': 1200.08,
      'transportCost': 77
    },
    {
      'storename' : 'NTUC',
      'product': 'Carrots',
      'qty': 44,
      'expiryDate': 1003145123,
      'price': 28.99,
      'transportCost': 69
    }
    ],

    $scope.fruit = [{
      'storename' : 'NTUC',
      'product': 'Apples',
      'qty': 12,
      'expiryDate': 123145123,
      'price': 120,
      'transportCost': 60
    },
    {
      'storename' : 'Giant',
      'product': 'Oranges',
      'qty': 22,
      'expiryDate': 993145123,
      'price': 1200.08,
      'transportCost': 77
    },
    {
      'storename' : 'NTUC',
      'product': 'Dragon Fruit',
      'qty': 44,
      'expiryDate': 1003145123,
      'price': 28.99,
      'transportCost': 69
    }
    ];

  $scope.sortColumn = "name";
  $scope.reverseSort = false;

  $scope.sortData = function (column) {
    $scope.reverseSort = ($scope.sortColumn == column) ? !$scope.reverseSort : false;
    $scope.sortColumn = column;
  };

  $scope.getSortClass = function (column) {
    if ($scope.sortColumn == column) {
      return $scope.reverseSort ? 'arrow-down' : 'arrow-up'
    }
  };
  }]);
