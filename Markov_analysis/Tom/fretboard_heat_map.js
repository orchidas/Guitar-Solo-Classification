// Tom Collins 3/15/2017.
// This script performs zero-order Markov analyses on fretboard data and
// outputs the calculated distributions as arrays for subsequent reading in by
// other software (e.g., Matlab).

// Format of the incoming data is
// [beat_of_measure, string, transposed_fret, MNN, scale_degree].

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
  var outPath = __dirname + '/../../../../../../../Dropbox/collDataInit/private/projects/guitarSoloClassifier/20170413/count_mx/';
}

// Get artist and song names in a useful object.
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
console.log('md:', md);

var max_fret = 0;
// Calculate distributions for a zero-order Markov model and save.
var md_keys = Object.keys(md);
// for (iband = 0; iband < 1; iband++){
for (iband = 0; iband < md_keys.length; iband++){
 // for (isong = 0; isong < 2; isong++){
 for (isong = 0; isong < md[md_keys[iband]].song_names.length; isong++){
  var songPath = inPath + '/' + md_keys[iband];
  var songName = md[md_keys[iband]].song_names[isong]; // Leave-one-out song.
  console.log('songName:', songName);
  
  //////////////////////////////////////////////////////
  // Perform zero-order Markov analysis on this song. //
  //////////////////////////////////////////////////////
  
  var curr_song = require(songPath + '/' + songName + '.json');
  curr_song = curr_song.map(function(x){
   // Create array of string and fret numbers.
   return [x[1], x[2]];
  });
  // Form the empirical distributions for this song.
  var count = mu.count_rows(curr_song);
  // console.log('count:', count);
  // Save it.
  fs.writeFileSync(outPath + '/' + md_keys[iband] + '/' + songName + ".txt",
                   JSON.stringify(count, null, 2));
  
  // Keep a record of the maximum fret number observed, so we can have a well-
  // defined fretboard heat map.
  var curr_max_fret = mu.max_argmax(curr_song.map(function(x){
   // Create array of string and fret numbers.
   return x[1];
  }));
  if (curr_max_fret[0] > max_fret){
   max_fret = curr_max_fret[0];
  }
 }
}

console.log('max_fret', max_fret);
