exports.append_array = function append_array(an_array){
  // Tom Collins 23/12/2014.
  // This function removes one level of brackets from an array.


  var out_array = [];
  for (ia = 0; ia < an_array.length; ia++){
    for (ib = 0; ib < an_array[ia].length; ib++){
      out_array.push(an_array[ia][ib]);
    }
  }
  return out_array;
};


// cdc: I think this is the same:
// var flat_array = nested_array.reduce(function(a,b){  return a.concat(b);  },[]);


// Example:
//var an_array = [[4], [1, 2]];
//var ans = append_array(an_array);
//console.log(ans); // Should give [4, 1, 2].


exports.append_array_of_arrays =
function append_array_of_arrays(an_array){
  // Tom Collins 9/8/2015.
  // In
  // an_array Array mandatory
  // Out Array
  // In an array of arrays, this function identifies elements that are arrays
  // of arrays, as opposed to arrays whose first element is a string, and
  // removes one structural level from the former type of arrays.
  


// Christian: faster and same result to do like so:
// nested_array ? = nested_array.length>1 && nested_array[0] instanceof Array?nested_array[0]:nested_array;

  var out_array = [];
  for (ia = 0; ia < an_array.length; ia++){
    if (typeof an_array[ia][0] == "string") {
      out_array.push(an_array[ia]);
    }
    else{
      for (ib = 0; ib < an_array[ia].length; ib++){
        out_array.push(an_array[ia][ib]);
      } 
    }
    
  }
  return out_array;
};


// cdc: I think this is the same:
// var arr = arr.length===1&&arr[0] instanceof Array?arr[0]:arr;

// Example 1:
//var an_array = [
//  ["yes", 0],
//  [["crotchet", 0], ["crotchet", 0], ["crotchet", 0]],
//  ["no", 4]];
//var ans = append_array_of_arrays(an_array);
//console.log(ans); // Should give:
//[["yes", 0], ["crotchet", 0], ["crotchet", 0], ["crotchet", 0], ["no", 4]]
// Example 2:
//var an_array = [["yes", 0]];
//var ans = append_array_of_arrays(an_array);
//console.log(ans); // Should give [["yes", 0]]
// Example 3:
//var an_array = [["yes", 0], ["no", 0]];
//var ans = append_array_of_arrays(an_array);
//console.log(ans); // Should give [["yes", 0], ["no", 0]]
// Example 4:
//var an_array = [[["crotchet", 0], ["crotchet", 0]]];
//var ans = append_array_of_arrays(an_array);
//console.log(ans); // Should give [["crotchet", 0], ["crotchet", 0]]


Array.prototype.equals = function(array){
  // Joe on Stack Overflow 27/12/2014.
  // Returns true if two arrays are equal, and false otherwise.
  // http://stackoverflow.com/questions/7837456/comparing-two-arrays-in-javascript
  
  // If the other array is a falsy value, return.
  if (!array)
  return false;
  
  // Compare lengths.
  if (this.length != array.length)
  return false;
  
  for (var i = 0, l=this.length; i < l; i++){
    // Check if we have nested arrays.
    if (this[i] instanceof Array && array[i] instanceof Array){
      // Recurse into the nested arrays.
      if (!this[i].equals(array[i]))
      return false;
    }
    else if (this[i] != array[i]){
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;   
    }           
  }
  return true;
}

// Example:
// var a = [1, [2, 3]];
// var ans = a.equals([1, [2, 3]]);
// console.log(ans); // Should give true.



    // Christian: here is the same with "reduce"
    // an_array.reduce(function(a,b){return a+b;},0)

exports.array_sum = function array_sum(an_array){
		// Tom Collins 14/3/2015
		// Returns the sum of elements of an array.


		
		var count = 0;
		for(var i = 0, n = an_array.length; i < n; i++){
				count += an_array[i];
		}
		return count;
}



// Example:
// var ans = array_sum([1, -2, 3]);
// console.log(ans); // Should give 2.


exports.arrayObjectIndexOf = function arrayObjectIndexOf(myArray, searchTerm,
                                                         property){
  // Joe on Stack Overflow 27/12/2014.
  // In an array of objects that all have the same properties, this function
  // locates the index of the object whose specifiable property is set to a
  // specifiable value.
  // http://stackoverflow.com/questions/8668174/indexof-method-in-an-object-array
  
  for(var i = 0, len = myArray.length; i < len; i++) {
    if (myArray[i][property] === searchTerm) return i;
  }
  return -1;
}

//// Example:
//var q1z = {
//    hello: 'world',
//    foo: 'bar'
//};
//var qaz = {
//    hello: 'stevie',
//    foo: 'baz'
//}
//var myArray = [];
//myArray.push(q1z, qaz);
//var ans = arrayObjectIndexOf(myArray, "stevie", "hello");
//console.log(ans);  // Should give 1.


exports.arrayObjectIndexOfArray =
function arrayObjectIndexOfArray(myArray, searchArray, property){
  // Tom Collins 27/1/2015.
  // In an array of objects that all have the same properties, this function
  // locates the index of an array object whose specifiable property is equal
  // to a specifiable array.
  
  for(var i = 0, len = myArray.length; i < len; i++) {
    // var candArray = myArray[i][property];
    // console.log('candArray:');
    // console.log(typeof candArray);
    if (myArray[i][property].equals(searchArray)) return i;
  }
  return -1;
}

//// Example:
//var obj0 = {
//    "state": [1, [-4, 0, 3]],
//    "continuations": "blah1"
//};
//var obj1 = {
//    "state": [3, [-4, 7]],
//    "continuations": "blah2"
//};
//var myArray = [];
//myArray.push(obj0, obj1);
//var ans = arrayObjectIndexOfArray(myArray, [3, [-4, 7]], "state");
//console.log(ans);  // Should give 1.


function copy_array_object(arr){
  // Tom Collins 21/2/2015.
  // This function returns an independent copy of an array object.
  
  var arr2 = JSON.parse(JSON.stringify(arr));
  return arr2;
}
exports.copy_array_object = copy_array_object;

// Example:
//var arr1 = {"eyes": "brown", "hair": "blue"};
//var arr2 = copy_array_object(arr1);
//arr2.hair = "green";
//console.log(arr1); // Should give: {"eyes": "brown", "hair": "blue"}.


function cyclically_permute_array_by(arr, m){
  // Tom Collins 6/11/2015.
  // This function moves the ith item of a list to the first item in the output
  // list, where i - 1 is the second argument. The (i-1)th item is moved to the
  // last item in the output list, etc.
  
  m = m % arr.length;
  var arr2 = copy_array_object(arr);
  var arr3 = arr2.slice(0, m);
  var arr4 = arr2.slice(m).concat(arr3);
  return arr4;
}
exports.cyclically_permute_array_by = cyclically_permute_array_by;

// Example:
// var arr1 = ["eyes", "nose", "hair"];
// var ans = cyclically_permute_array_by(arr1, 1);
// console.log(ans); // Should give: ["nose", "hair", "eyes"].
// var ans2 = cyclically_permute_array_by(arr1, 2);
// console.log(ans2); // Should give: ["hair", "eyes", "nose"].
//var ans3 = cyclically_permute_array_by([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 12);
//console.log(ans3); // Should give: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].

Array.prototype.index_item_1st_occurs = function(a){
  // Tom Collins 1/2/2015.
  // Returns the index at which the given argument a firsts occurs. It is more
  // robust than indexOf functionality because it will match arguments
  // consisting of arrays, strings, and booleans as well as numbers. It will
  // not match arbitrary objects, however (see second example below).
  
  var typeofa = typeof a;
  var instanceofarraya = a instanceof Array;
  var idx = -1;
  var i = 0;
  while (i < this.length)
  {
    if (typeof this[i] == typeofa){
      if(instanceofarraya && this[i] instanceof Array){
        if (this[i].equals(a)){
          idx = i;
          i = this.length - 1;
        }
      }
      else{
        if (this[i] == a){
          idx = i;
          i = this.length - 1;
        }
      }
    }
    i=i+1;
  }
  return idx;
}

// Example:
// var a = [-7, [2, 3]];
// var ans = a.index_item_1st_occurs([2, 3]);
// console.log(ans); // Should give 1.
// var b = [[-7], [2, 3], {'schurrle':7}, 4];
// ans = b.index_item_1st_occurs({'schurrle':7});
// console.log(ans); // Should give -1.


Array.prototype.index_item_1st_doesnt_occur = function(a){
  // Tom Collins 1/2/2015.
  // Returns the index at which the given argument a first does not occur. It
  // is robust in the sense that it will match arguments consisting of arrays,
  // strings, and booleans as well as numbers. It will not match arbitrary
  // objects, however (see second example below).
  
  var typeofa = typeof a;
  var instanceofarraya = a instanceof Array;
  var idx = -1;
  var i = 0;
  while (i < this.length)
  {
    if (!(typeof this[i] == typeofa) ||
          (instanceofarraya && !(this[i] instanceof Array))){
      idx = i;
      i = this.length - 1;
    }
    else{
      if(instanceofarraya && this[i] instanceof Array){
        if (!this[i].equals(a)){
          idx = i;
          i = this.length - 1;
        }
      }
      else{
        if (!(this[i] == a)){
          idx = i;
          i = this.length - 1;
        }
      }
    }
    i=i+1;
  }
  return idx;
}

// Example:
// var a = [[1], [1], -7];
// var ans = a.index_item_1st_doesnt_occur([1]);
// console.log(ans); // Should give 2.
// var b = [{'schurrle':7}, 1, 1, [-7], [2, 3], 4];
// ans = b.index_item_1st_doesnt_occur({'schurrle':7});
// console.log(ans); // Should give 0.


exports.max_argmax = function max_argmax(arr){
  // Tom Collins 21/10/2014.
  // Returns the maximum element in an array and its index (argument).
  
  var max = arr[0];
  var maxIndex = 0;
  for (var i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i;
      max = arr[i];
    }
  }
  return [max, maxIndex];
}

// cdc: I think this is the same
// arr.reduce(function(a,b){ a>b?return a:b; },arr[0])

// Example:
// var ans = max_argmax([9, -2, 4, 11, -5]);
// console.log(ans); // Should give [11, 3].



exports.min_argmin = function min_argmin(arr){
  // Tom Collins 21/10/2014.
  // Returns the minimum element in an array and its index (argument).
  
  var min = arr[0];
  var minIndex = 0;
  for (var i = 1; i < arr.length; i++) {
    if (arr[i] < min) {
      minIndex = i;
      min = arr[i];
    }
  }
  return [min, minIndex];
}

// cdc: I think this is the same
// arr.reduce(function(a,b){ a<b?return a:b; },arr[0])


// Example:
// var ans = min_argmin([9, -2, 4, 11, -5]);
// console.log(ans); // Should give [-5, 4].


exports.multiply_array_by_constant =
function multiply_array_by_constant(an_array, a_constant){
  // Tom Collins 27/12/2014.
  // Two arguments are supplied to this function: an array and a constant. An
  // array is returned, containing the result of multiplying each element of
  // the input array by the constant.
  
  var out_array = [];
  for (i = 0; i < an_array.length; i++){
    out_array.push(a_constant*an_array[i]);
  }
  return out_array;
}

// cdc: I think this is the same
// var an_array = an_array.map(function(a,b){ return a*a_contstant; })


// Example:
//var ans = multiply_array_by_constant([2, 0], 5);
//console.log(ans); // Should give: [10, 0];

