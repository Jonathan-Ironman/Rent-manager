angular.module('ngAppRentManager', []).
controller('RentCtrl', ['$scope', function ($scope) {
    $scope.tenants = huurders;
    $scope.payments = data;

    $scope.setData = function (newData, type) {
        type == "tenants" ? $scope.tenants = newData : $scope.payments = newData;
        $scope.$apply(); // <-- Said to be bad
    };

    // Default search modifiers.
    $scope.search = { text: "", minAmount: 0 };
    $scope.sort = 'date';
    $scope.reverse = true;
}]);