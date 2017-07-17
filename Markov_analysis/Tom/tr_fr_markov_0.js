// Tom Collins 4/16/2017.
// This script performs zero-order Markov analyses and then uses these to
// calculate probabilities of input in a leave-one-out fashion.

// Format of the incoming data is
// [beat_of_measure, string, transposed_fret, MNN, scale_degree, duration].

// Requires.
var fs = require('fs'); // File system operations library.
var mu = require('maia-util');

var user = 'tom';
if (user == 'orchi'){
  var inPath = __dirname + '/../../path/to/your/JSON/files/';
  var outPath = __dirname + '/../../output/directory/which/must/exist/already/';
}
else {
  var inPath = __dirname + '/../../../../../../../Dropbox/collDataInit/private/projects/guitarSoloClassifier/20170413/data_trans_fret/';
  var outPath = __dirname + '/../../output/directory/which/must/exist/already/';
}

// Get artist and song names in a useful object for loocv.
var md = {}; // Metadata.
var bnames = fs.readdirSync(inPath);
// console.log('bnames:', bnames);
// Iterate over band names to get song names.
for (iband = 0; iband < bnames.length; iband++){
 if (bnames[iband] !== ".DS_Store"){
  var bd = {};
  var curr_songs = [];
  songPath = inPath + '/' + bnames[iband];
  var snames = fs.readdirSync(songPath);
  // console.log('snames:', snames);
  // Iterate over song names to add to songs_concat.
  for (isong = 0; isong < snames.length; isong++){
   var sname = snames[isong];
   if (sname.slice(sname.length - 4) == "json"){
    curr_songs.push(sname.slice(0, sname.length - 5));
   }
  }
  bd.song_names = curr_songs;
  md[bnames[iband]] = bd;
 }
}
// console.log('md:', md);

// Do loocv for a zero-order Markov model.
var md_keys = Object.keys(md);
// for (iband = 0; iband < 1; iband++){
for (iband = 0; iband < md_keys.length; iband++){
 // for (isong = 0; isong < 2; isong++){
 for (isong = 0; isong < md[md_keys[iband]].song_names.length; isong++){
  var looPath = inPath + '/' + md_keys[iband];
  var looName = md[md_keys[iband]].song_names[isong]; // Leave-one-out song.
  console.log('looName:', looName);
  var cond_probs = {};
  var cond_probs_arr = [];
  
  ///////////////////////////////////////////////////////////////
  // Perform zero-order Markov analysis leaving this song out. //
  ///////////////////////////////////////////////////////////////
  
  for (jband = 0; jband < md_keys.length; jband++){
   songPath = inPath + '/' + md_keys[jband];
   var snames = md[md_keys[jband]].song_names;
   // console.log('snames:', snames);
   // var snames = fs.readdirSync(songPath);
   var songs_concat = [];
   var init_state = [];
   
   // Iterate over song names to add to songs_concat.
   for (jsong = 0; jsong < snames.length; jsong++){
    var sname = snames[jsong];
    // Check that this is not the leave-one-out song.
    if (sname !== looName){
     // console.log('Processing song ' + snames[jsong]);
     var curr_song = require(songPath + '/' + snames[jsong] + '.json');
     curr_song = curr_song.map(function(x){
      // Round beat to 2-3 decimal places, to
      // avoid decimals (e.g., triplets) being analyzed as different events when
      // they are in fact the same.
      return [Math.round(x[0]*100)/100, x[1], x[2]];
     });
     // console.log('curr_song.slice(0, 100):', curr_song.slice(0, 100));
     songs_concat = songs_concat.concat(curr_song);
     init_state.push(curr_song[0]);
    }
   }
    
   // Form the empirical distributions for this leave-one-out song.
   var count = mu.count_rows(songs_concat);
   // console.log('count:', count);
   var init_dist = mu.count_rows(init_state);
   // console.log('init_dist:', init_dist);
   
   // Calculate the probabilities for this leave-one-out-song.
   var loo_song = require(looPath + '/' + looName + '.json');
   loo_song = loo_song.map(function(x){
    return [Math.round(x[0]*100)/100, x[1], x[2]];
   });
   var loo_counts = loo_song.map(function(x){
    var rel_idx = count[0].index_item_1st_occurs(x);
    if (rel_idx > 0){
     return count[1][rel_idx];
    }
    else {
     return 0;
    }
   });
   // console.log('loo_counts:', loo_counts);
   // Grab max three loo_counts, turn them into probabilities, calculate a mean
   // and store it.
   var max3 = loo_counts.sort(function(a, b){return b - a;}).slice(0);
   max3 = max3.map(function(x){
    return x/songs_concat.length;
   });
   // console.log('max3:', max3);
   cond_probs[md_keys[jband]] = mu.mean(max3);
   cond_probs_arr[jband] = cond_probs[md_keys[jband]];
  }
  // console.log('cond_probs:', cond_probs);
  
  var probs = {};
  probs.cond_probs = cond_probs;
  var mi = mu.max_argmax(cond_probs_arr);
  probs.decision = md_keys[mi[1]];
  //if (cond_probs.Clapton_short > cond_probs.Gilmour_short){
  // probs.decision = 'clapton';
  //}
  //else {
  // probs.decision = 'gilmour';
  //}
  md[md_keys[iband]][md[md_keys[iband]].song_names[isong]] = probs;
  
 }
}

console.log('md', md);

// Here's R code for establishing that 27 or more out of 80 classified
// correctly is significantly better than chance.
// pbinom(26, 80, 0.25)
