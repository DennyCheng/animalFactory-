var myApp = angular.module('myApp', []);

myApp.filter('unique', function() {
    return function(arr, field) {
        return _.uniq(arr, function(a) {
            return a[field];
        });
    };
});

myApp.factory('DataFactory', ['$http', function($http) {
    // PRIVATE
    var pets = undefined;

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
      var promise = $http.post('/favorites', petObject).then(function(response) {
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
        return addPet(petObject);
      }
    };
}]);

myApp.controller("petController", ["$scope", "$http","DataFactory", function($scope, $http, DataFactory) {
    //MARK:------INITS KEY + URL FOR API USE
    var key = 'b900e0d5e332753a460a64eaa8de00fd';
    var baseURL = 'http://api.petfinder.com/';
    //MARK:------INITS SCOPED VARIABLES FOR SHOW/HIDE AND DROP DOWNS


    //declare factory score
    $scope.dataFactory = DataFactory;
    console.log($scope.dataFactory);
    // $scope.petsArray = $scope.DataFactory.petsArray;
    // $scope.retrieveData = $scope.DataFactory.retrieveData;
    // $scope.addPet = $scope.DataFactory.addPet;
    initDOM();

    //MARK:------UPDATES DISPLAY TO SHOW FAVORITES WINDOW OR UPDATE WHEN FAVORITE FILTER'S VALUE CHANGES
    $scope.findFavorites = function(selected) {
        getFavoritesData(selected);
        $scope.showFavorite = false;
        $scope.showRandom = true;
        $scope.isfavorited = true;
    };

    //MARK:------CALLS API TO FIND A RANDOM PET BASED ON ANIMAL TYPE
    $scope.randomPet = function(animal_name) {
        //build unique query
        var query = buildQuery(animal_name);
        //call api to build scoped pet object
        makeAPICallForPetObject(query, animal_name);
    };

    //MARK:------POSTS TO DATABASE A NEW FAVORITED PET OBJECT
    $scope.addFavorite = function() {
        //hides favorite button to prevent dups.
        $scope.isfavorited = true;

        //builds then posts pet object to database, updates favorite list
        var favoritePet = buildPetObject();

        $scope.dataFactory.addPet(favoritePet).then(function(){
          $scope.dataFactory.retrieveData();

        });
    };

    //MARK:------BUILDS UNIQUE QUERY STRING FOR SPECIFIED ANIMAL
    function buildQuery(animal_name){
      var query = baseURL + 'pet.getRandom';
      query += '?key=' + key;
      query += '&animal=' + animal_name;
      query += '&output=basic';
      query += '&format=json';

      return query;
    }

    //MARK:------MAKES API CALL TO BUILD PET OBJECT
    function makeAPICallForPetObject(query, animal_name){
      var request = encodeURI(query) + '&callback=JSON_CALLBACK';
      $http.jsonp(request).then(function(response) {
          $scope.isfavorited = false;
          $scope.showRandom = false;
          $scope.showFavorite = true;
          $scope.pet = response.data.petfinder.pet;
          $scope.pet.animalType = animal_name;
      });
    }

    //MARK:------BUILDS PET OBJECT FOR POST REQUEST
    function buildPetObject(){
      var typeAnimal = $scope.pet.breeds.breed.$t;
      var petDescription = $scope.pet.description.$t;

      if (petDescription === undefined) {
          petDescription = "no description";
      } else if (petDescription.length > 100) {
          petDescription = petDescription.substring(0, 100);
          petDescription += "...";
      }

      if (typeAnimal === null) {
          typeAnimal = "no description";
      }


      var favoritePet = {
          pet_name: $scope.pet.name.$t,
          pet_age: $scope.pet.age.$t,
          pet_img: $scope.pet.media.photos.photo[2].$t,
          pet_description: petDescription,
          pet_type: typeAnimal,
          pet_id: $scope.pet.id.$t,
          pet_animal: $scope.pet.animalType
      };

      console.log(favoritePet);
      return favoritePet;

    }

    //MARK:------INITS ALL SCOPED VARIABLES NECESSARY AT DOC_LOAD
    function initDOM(){
      getFavoritesData();
      $scope.isfavorited = false;
      $scope.showFavorite = true;
      $scope.showRandom = true;
      $scope.showOptions = true;

      $scope.options = [{
          id: 1,
          name: 'bird'
      }, {
          id: 2,
          name: 'dog'
      }, {
          id: 3,
          name: 'cat'
      }, {
          id: 4,
          name: 'pig'
      }];

      $scope.animalTypes = [];


    }

    //MARK:------COUNTS AMOUNT OF FAVORITES BY ANIMAL TYPE
    function countFavorites() {
        $scope.favoriteCount = _.countBy($scope.animalTypes, function(animal) {
            var match = "";
            $scope.animalTypes.forEach(function(theType, i) {
                if (animal.name == theType.name) {
                    match = theType.name;
                }
            });
            // console.log(match);
            return match;
        });
        console.log("favoriteCount:", $scope.favoriteCount);
    }

    //MARK:------FILTERS FAVORITES OUTPUT BY SELECTION FROM DROPDOWN
    function changeFavoriteOutput(dataOf, selected) {
        $scope.favorites = dataOf.length;
        if (selected != "All" && selected !== undefined) {
            //MARK:------SHOW ONLY SELECTED ANIMAL TYPE IN FAVORITES
            $scope.currentFavorites = [];
            dataOf.forEach(function(pet, i) {
                if (pet.pet_animal == selected) {
                    $scope.currentFavorites.push(pet);
                }
            });
        } else {
            //MARK:------IF ALL NO SPECIFIC DROPDOWN WAS SELECTED -> SHOW ALL
            $scope.currentFavorites = dataOf;
        }


    }

    //MARK:------CALLS GET REQUEST TO BUILD FAVORITE LIST BY TYPE
    function getFavoritesData(selectedType) {
      console.log("getFavoritesData called");
      console.log("meows",$scope.dataFactory.petsArray());
      if($scope.dataFactory.petsArray() === undefined){
        console.log("factory has no flipping data, gettin that shit now");
        $scope.dataFactory.retrieveData().then(function(){
          changeFavoriteOutput($scope.dataFactory.petsArray(), selectedType);
          findTypes($scope.dataFactory.petsArray());
          countFavorites();
        });
      } else{
        console.log("shit fuck dam");
        changeFavoriteOutput($scope.dataFactory.petsArray(), selectedType);
        findTypes($scope.dataFactory.petsArray());
        countFavorites();
      }
    }

    //MARK:------BUILDS ARRAY CONTAINING ALL ANIMAL TYPES
    function findTypes(theData) {
        $scope.animalTypes = [];
        theData.forEach(function(animal, i) {
            $scope.animalTypes.push({
                name: animal.pet_animal
            });
        });
    }



}]);
