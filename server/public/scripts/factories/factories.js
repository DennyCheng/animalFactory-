myApp.factory('DataFactory', ['$http', function($http) {
    // PRIVATE
    var pets = {type:"cat"};

    var getPets = function() {
      console.log('DF getting data from server');
      var promise = $http.get('/favorites').then(function(response) {
          // data returned, put it in our array
          pets = response.data;

          console.log('DF Async data response:', pets);
      });

      return promise;
    };

    var addPet = function(petObject) {
      var promise = $http.post('/data', petObject).then(function(response) {
        console.log('DF post completed');
        // done, now refresh out data
        return getPets();
      });

      return promise;
    };

    // PUBLIC API object
    return {
      petsArray: function() {
        console.log("hitting petsArray factory");
        return pets;
      },
      retrieveData: function() {
        return getPets();
      },
      addPet: function(petObject) {
        return addPets(petObject);
      }
    };
}]);
