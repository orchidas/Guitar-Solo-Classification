// Tom Collins 4/16/2017.
// This script performs first-order Markov analyses and then uses these to
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

function construct_stm(pieces_concat){
 // Tom Collins 4/16/2017.
 // This function takes an array of point sets as input, in the format
 // [beat of measure, string no, transposed fret number]
 // and constructs an array known as a state transition matrix. In reality, it
 // is an array not a matrix: an array of objects where each object contains a
 // beat_string_fret_state property and a continuations property. The
 // beat_string_fret_state property value is an array, something like
 // [2, 4, 7], which means a musical event/segment that begins on beat 2 of
 // the measure and consists of string 4 fret 7. The continuations property
 // value is an array consisting of state-context pairs: it is all the
 // events/segments that follow on from [2, 4, 7], say, in the pieces_concat
 // variable.
 
 var npc = pieces_concat.length;
 
 var state_context_pairs = [];
 //for (ipc = 0; ipc < npc; ipc++){
 //  state_context_pairs[ipc]
 //    = brm.comp_obj2beat_rel_mnn_states(json_scores[ipc]);
 //}
 //console.log('I got here!');
 
 var stm = [];
 for (ipc = 0; ipc < npc; ipc++){
  for (jstate = 0; jstate < pieces_concat[ipc].length - 1; jstate++){
   var rel_idx
    = mu.array_object_index_of_array(
     stm, pieces_concat[ipc][jstate],
     "beat_string_fret_state");
   if (rel_idx >= 0){
    // The current state already appears in the stm. Push its continuation
    // to the array of continuations for this state.
    stm[rel_idx]["continuations"].push(pieces_concat[ipc][jstate + 1]);
   }
   else{
    // The current state has not appeared in the stm before. Push it and
    // its first continuation observed here to the stm.
    stm.push({
     "beat_string_fret_state": pieces_concat[ipc][jstate],
     "continuations": [pieces_concat[ipc][jstate + 1]]
    });
   }
  }
  // console.log('Completed processing composition ' + ipc);
 }
 
 for (ist = 0; ist < stm.length; ist++){
  stm[ist].continuations = mu.count_rows(stm[ist].continuations);
  stm[ist].continuations.push(mu.array_sum(stm[ist].continuations[1]));
 }
 return stm;
}

//// Example:
//var piece_1 = [
// [1, 4, 5],
// [2, 4, 7],
// [4.5, 4, 5]
//];
//var piece_2 = [
// [2, 4, 7],
// [4, 4, 5],
// [1, 4, 5],
// [2, 4, 7]
//];
//var stm = construct_stm([piece_1, piece_2]);
//console.log(stm); // Should give:
////[
//// {
////  beat_string_fret_state: [1, 4, 5],
////  continuations: [[[2, 4, 7]], [2], 2]
////  },
////  {
////   beat_string_fret_state: [2, 4, 7],
////   continuations: [[[4.5, 4, 5], [4, 4, 5]], [1, 1], 2]
////  },
////  {
////   beat_string_fret_state: [4, 4, 5],
////   continuations: [[[1, 4, 5]], [1], 1]
////  }
////]


function markov_1_probabilities(piece, init_dist, stm){
 // Tom Collins 4/16/2017.
 // This function takes an array of point sets as input, in the format
 // [beat of measure, string no, transposed fret number]
 // and calculates their empirical probability of occurrence under a first-
 // order Markov model according to the given initial distribution and state
 // transition matrix.
 
 // Initial probability according to init_dist.
 var curr_prob = 0;
 var rel_idx_0 = init_dist[0].index_item_1st_occurs(piece[0]);
 if (rel_idx_0 >= 0){
  curr_prob = init_dist[1][rel_idx_0]/mu.array_sum[init_dist[1]];
 }
 var probs = [curr_prob];
 
 // Subsequent probabilities according to stm.
 for (jstate = 0; jstate < piece.length - 1; jstate++){
  var curr_state = piece[jstate];
  // console.log('curr_state:', curr_state);
  var curr_prob = 0;
  var rel_idx_1
   = mu.array_object_index_of_array(
    stm, curr_state,
    "beat_string_fret_state");
  // console.log('rel_idx_1:', rel_idx_1);
  if (rel_idx_1 >= 0){
   // The current state appears in the stm. Calculate its continuation's
   // probability in the continuations.
   var cont = stm[rel_idx_1]["continuations"];
   // console.log('cont:', cont);
   var rel_idx_2 = cont[0].index_item_1st_occurs(piece[jstate + 1]);
   // console.log('rel_idx_2:', rel_idx_2);
   if (rel_idx_2 >= 0){
    curr_prob = cont[1][rel_idx_2]/cont[2];
   }
  }
  probs.push(curr_prob);
 }
 return probs;
}

//// Example:
//var piece_3 = [
// [1, 3, 5],
// [2, 4, 7],
// [4, 4, 5],
// [1, 4, 5],
// [3, 4, 7]
//];
//var init_dist = mu.count_rows([piece_1[0], piece_2[0]]);
//var probs = markov_1_probabilities(piece_3, init_dist, stm);
//console.log('probs:', probs);


function string_and_fret2midi_note_number(string_no, fret_no){
 var open_string_MNNs = [64, 59, 55, 50, 45, 40];
 return open_string_MNNs[string_no - 1] + fret_no;
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

// Do loocv for a first-order Markov model.
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
  // Perform first-order Markov analysis leaving this song out. //
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
      return [Math.round(x[0]*100)/100, string_and_fret2midi_note_number(x[1], x[2])];
     });
     // console.log('curr_song.slice(0, 100):', curr_song.slice(0, 100));
     songs_concat.push(curr_song);
     init_state.push(curr_song[0]);
    }
   }
    
   // Form the empirical distributions for this leave-one-out song.
   var init_dist = mu.count_rows(init_state);
   // console.log('init_dist:', init_dist);
   var stm = construct_stm(songs_concat);
   
   // Calculate the probabilities for this leave-one-out-song.
   var loo_song = require(looPath + '/' + looName + '.json');
   loo_song = loo_song.map(function(x){
    return [Math.round(x[0]*100)/100, string_and_fret2midi_note_number(x[1], x[2])];
   });
   var probs = markov_1_probabilities(loo_song, init_dist, stm);
   // console.log('max3:', max3);
   cond_probs[md_keys[jband]] = mu.mean(probs);
   cond_probs_arr[jband] = cond_probs[md_keys[jband]];
  }
  // console.log('cond_probs:', cond_probs);
  
  var probs = {};
  probs.cond_probs = cond_probs;
  var mi = mu.max_argmax(cond_probs_arr);
  probs.decision = md_keys[mi[1]];
  md[md_keys[iband]][md[md_keys[iband]].song_names[isong]] = probs;
  
 }
}

console.log('md', md);

// Here's R code for establishing that 27 or more out of 80 classified
// correctly is significantly better than chance.
// pbinom(26, 80, 0.25)

